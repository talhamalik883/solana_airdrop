# Solana Airdrop Script

This project contains a TypeScript script to perform an airdrop of SPL tokens on the Solana blockchain. The script reads recipient addresses from a JSON file and transfers a specified amount of tokens to each recipient.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Prerequisites

- Node.js and npm installed on your machine. You can download them from [nodejs.org](https://nodejs.org/).
- TypeScript installed globally. You can install it using npm:
  ```bash
  npm install -g typescript
Installation
Clone the Repository:


git clone https://github.com/your-username/solana-airdrop.git
cd solana-airdrop
Install Dependencies:


npm install
Configuration
Create a .env File:

In the root of your project, create a file named .env.
Add Required Attributes:

Add your private key and Helius RPC URL to the .env file:

ECLIPSE_PRIVATE_KEY=your_base58_encoded_private_key
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_helius_api_key
Helius RPC URL Setup:

Sign up for an account at Helius to get your API key.
Update the HELIUS_RPC_URL in your .env file with your API key.
Recipient Data:

Ensure you have a file named output2.json in the root of your project with the recipient data. The file should contain an array of recipient objects with the following structure:

[
  {
    "address": "recipient_address",
    "mint": "token_mint_address",
    "owner": "recipient_public_key",
    "amount": 1,
    "delegated_amount": 0,
    "token_extensions": {
      "transfer_fee_amount": {
        "withheld_amount": 0
      }
    },
    "frozen": false
  }
]
Usage
Run the Script:

Use ts-node to run your TypeScript file:

npx ts-node airdrop_script.ts
Monitor the Output:

The script will output the status of each transaction to the console. Check for any errors or failed transactions.
Troubleshooting
Check Logs: If the script fails, check the console logs for error messages.
Validate Recipient Addresses: Ensure all recipient addresses in output2.json are valid Solana addresses.
Network Issues: Ensure your internet connection is stable and that the Helius RPC URL is correct.
