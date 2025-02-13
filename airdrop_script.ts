import { Connection, Keypair, Transaction, PublicKey, sendAndConfirmTransaction } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import * as fs from 'fs';
import bs58 from 'bs58';
import * as dotenv from 'dotenv';
import * as winston from 'winston';

// Configure Winston for logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'airdrop.log' })
  ]
});

// Load environment variables from a .env file
dotenv.config({ path: '.env' });

// Retrieve the RPC URL from environment variables
const rpcUrl = process.env.RPC_URL;
if (!rpcUrl) {
  logger.error('RPC URL is not set in environment variables');
  throw new Error('RPC URL is not set in environment variables');
}

// Establish a connection to the Solana cluster
const connection = new Connection(rpcUrl, 'confirmed');

// Retrieve the private key from environment variables and decode it
const privateKeyBase58 = process.env.ECLIPSE_PRIVATE_KEY;
if (!privateKeyBase58) {
  logger.error('Private key is not set in environment variables');
  throw new Error('Private key is not set in environment variables');
}
const privateKeyUint8Array = bs58.decode(privateKeyBase58);
const payerKeypair = Keypair.fromSecretKey(privateKeyUint8Array);

// Define the SPL token mint address
const splTokenMintAddress = new PublicKey('EtUtjntdnndwLrXKNgwWKyfSCsuy3thP4pr5vqxtWA1m');

// Define constants for chunk size and maximum retries
const CHUNK_SIZE = 10;
const MAX_RETRIES = 10;

// Define the structure of token data
interface TokenData {
  address: string;
  mint: string;
  owner: string;
  amount: number;
  delegated_amount: number;
  token_extensions: {
    transfer_fee_amount: {
      withheld_amount: number;
    };
  };
  frozen: boolean;
}

// Initialize an array to store recipient addresses
let recipientAddresses: TokenData[] = [];

/**
 * Execute the airdrop of SPL tokens to recipients.
 */
export async function executeAirdrop() {
  try {
    logger.info('Starting airdrop execution...');

    // Read recipient data from a JSON file
    const data = fs.readFileSync('./output.json', 'utf8');
    recipientAddresses = JSON.parse(data).filter((recipient: TokenData) => recipient.amount > 0);

    const failedRecipients: string[] = [];
    const chunkedRecipients = chunkArray(recipientAddresses, CHUNK_SIZE);

    // Process each chunk of recipients
    for (const chunk of chunkedRecipients) {
      const transaction = new Transaction();
      const walletToInstructionMap = new Map<string, Transaction>();

      // Prepare instructions for each recipient in the chunk
      for (const recipient of chunk) {
        try {
          const recipientTransaction = await createRecipientTransaction(recipient.owner);
          if (recipientTransaction) {
            transaction.add(...recipientTransaction.instructions);
            walletToInstructionMap.set(recipient.owner, recipientTransaction);
          }
        } catch (error) {
          logger.error(`Error creating instructions for ${recipient.owner}:`, error instanceof Error ? error.message : error);
          failedRecipients.push(recipient.owner);
        }
      }

      // Attempt to send the chunked transaction
      try {
        const txSignature = await sendAndConfirmTransaction(connection, transaction, [payerKeypair]);
        logger.info(`Chunk Transaction Succeeded: ${txSignature}`);
      } catch (error) {
        logger.warn('Chunk transaction failed. Retrying individually:', error instanceof Error ? error.message : error);

        // Retry each recipient individually if the chunk transaction fails
        for (const recipient of chunk) {
          const recipientTransaction = walletToInstructionMap.get(recipient.owner);
          if (recipientTransaction) {
            const isSuccessful = await sendTransactionWithRetries(recipientTransaction, recipient.owner);
            if (!isSuccessful) {
              failedRecipients.push(recipient.owner);
            }
          }
        }
      }
    }

    // Retry failed recipients
    await retryFailedRecipients(failedRecipients);
    logger.info('Airdrop execution completed.');
  } catch (error) {
    logger.error('Error during airdrop:', error instanceof Error ? error.message : error);
  }
}

/**
 * Process a single recipient to create necessary instructions.
 * @param recipient - The recipient's public key.
 * @returns A transaction containing the instructions for the recipient.
 */
async function createRecipientTransaction(recipient: string): Promise<Transaction | null> {
  try {
    const recipientPublicKey = new PublicKey(recipient);
    const recipientTokenAddress = await getAssociatedTokenAddress(splTokenMintAddress, recipientPublicKey);

    // Check if the associated token account exists
    const accountInfo = await connection.getAccountInfo(recipientTokenAddress);
    const transaction = new Transaction();

    if (!accountInfo) {
      // Add instruction to create the associated token account if it does not exist
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payerKeypair.publicKey,
          recipientTokenAddress,
          recipientPublicKey,
          splTokenMintAddress
        )
      );
    }

    // Add instruction to transfer tokens
    transaction.add(
      createTransferInstruction(
        await getAssociatedTokenAddress(splTokenMintAddress, payerKeypair.publicKey),
        recipientTokenAddress,
        payerKeypair.publicKey,
        10
      )
    );

    return transaction;
  } catch (error) {
    logger.error(`Error creating transaction for recipient ${recipient}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Send a transaction with retries in case of failure.
 * @param transaction - The transaction to send.
 * @param recipient - The recipient's public key.
 * @returns A boolean indicating whether the transaction was successful.
 */
async function sendTransactionWithRetries(transaction: Transaction, recipient: string): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const txSignature = await sendAndConfirmTransaction(connection, transaction, [payerKeypair]);
      logger.info(`Transaction succeeded for ${recipient}: ${txSignature}`);
      return true;
    } catch (error) {
      logger.warn(`Transaction failed for ${recipient} on attempt ${attempt}:`, error instanceof Error ? error.message : error);
      if (attempt === MAX_RETRIES) {
        return false;
      }
    }
  }
  return false;
}

/**
 * Retry failed recipients with multiple attempts.
 * @param failedRecipients - List of failed recipient addresses.
 */
async function retryFailedRecipients(failedRecipients: string[]) {
  for (const failedRecipient of failedRecipients) {
    let success = false;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const transaction = await createRecipientTransaction(failedRecipient);
        if (transaction) {
          await sendAndConfirmTransaction(connection, transaction, [payerKeypair]);
          logger.info(`Successfully retried for ${failedRecipient}`);
          success = true;
          break;
        }
      } catch (error) {
        logger.warn(`Retry ${attempt} failed for recipient ${failedRecipient}:`, error instanceof Error ? error.message : error);
      }
    }

    if (!success) {
      logger.error(`Airdrop failed after ${MAX_RETRIES} retries for recipient: ${failedRecipient}`);
    }
  }
}

/**
 * Split an array into chunks of a specified size.
 * @param array - The array to split.
 * @param size - The size of each chunk.
 * @returns An array of chunks.
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// Execute the airdrop function
executeAirdrop();
