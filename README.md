# Solana Airdrop Script

This project contains a TypeScript script to perform an airdrop of SPL tokens on the Solana blockchain. The script reads recipient addresses from a JSON file and transfers a specified amount of tokens to each recipient.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Prerequisites

- Node.js and npm installed on your machine. You can download them from [nodejs.org](https://nodejs.org/)
- TypeScript installed globally:

```bash
npm install -g typescript
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/talhamalik883/solana-airdrop.git
cd solana-airdrop
```

### 2. Install Dependencies

```bash
npm install
```

## Configuration

### Environment Setup

1. Create a `.env` file in the root directory
2. Add the following required attributes:

```env
ECLIPSE_PRIVATE_KEY=your_base58_encoded_private_key
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_helius_api_key
```

### Helius RPC Setup

1. Sign up for an account at [Helius](https://helius.dev)
2. Get your API key from the dashboard
3. Update the `HELIUS_RPC_URL` in your `.env` file with your API key

### Recipient Data

Create an `output.json` file in the project root with the following structure:

```json
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
```

## Usage

### Running the Script

Execute the airdrop script using ts-node:

```bash
npx tsx airdrop_script.ts
```

### Monitoring

The script will output the status of each transaction to the console. Watch for any error messages or failed transactions.

## Project Structure

```
solana-airdrop/
├── airdrop_script.ts    # Main script for token airdrop
├── tsconfig.json        # TypeScript configuration
├── package.json         # Project dependencies and scripts
├── .env                 # Environment variables (ignored by git)
├── output.json         # Recipient data file (ignored by git)
└── .gitignore          # Git ignore rules
```

### Key Files

- **airdrop_script.ts**: Contains the main logic for the SPL token airdrop
- **output.json**: JSON file containing recipient addresses and token amounts
- **.env**: Configuration file for private keys and RPC URLs
- **tsconfig.json**: TypeScript compiler configuration
- **package.json**: NPM package configuration and dependencies

## Troubleshooting

### Common Issues

- **Script Failures**: Check the console logs for detailed error messages
- **Invalid Addresses**: Verify all recipient addresses in `output.json` are valid Solana addresses
- **Network Issues**: 
  - Ensure stable internet connection
  - Verify Helius RPC URL is correct
  - Check Helius API key validity

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
