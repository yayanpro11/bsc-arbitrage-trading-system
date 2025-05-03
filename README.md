# BSC Arbitrage Trading System

A decentralized arbitrage trading system built for Binance Smart Chain (BSC) that enables users to execute trades across multiple DEXes to profit from price differences.

## Features

- Multi-market support (4 DEXes):
  - PancakeSwap
  - BiSwap
  - ApeSwap
  - MDEX
- 11 trading pairs including:
  - BUSD-BTCB
  - BUSD-ETH
  - BUSD-CAKE
  - And more...
- 0.3% fee on transactions (sent to admin wallet)
- Web interface for easy trading
- Real-time price monitoring
- Secure token handling using OpenZeppelin contracts

## Prerequisites

- Node.js v14+ and npm
- MetaMask wallet with BSC network configured
- BNB for gas fees
- BUSD or other supported tokens for trading

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bsc-arbitrage-trader
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file in the root directory:
```env
PRIVATE_KEY=your_private_key_here
BSC_RPC_URL=https://bsc-dataseed.binance.org/
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
BSCSCAN_API_KEY=your_bscscan_api_key_here
```

## Testing

Run the test suite:
```bash
npm test
```

## Deployment

### Testnet Deployment
```bash
npm run deploy:testnet
```

### Mainnet Deployment
```bash
npm run deploy:mainnet
```

## Running the Frontend

Start the development server:
```bash
npm start
```

The frontend will be available at http://localhost:8000

## Usage

1. Connect your MetaMask wallet
2. Select trading pair
3. Choose source and destination DEXes
4. Enter trade amount
5. Execute arbitrage trade

## Smart Contract Architecture

- `ArbitrageTrader.sol`: Main contract handling trades and fees
- Market management for adding/removing DEXes
- Trading pair management
- Fee collection system
- Emergency withdrawal function

## Security Features

- OpenZeppelin's SafeERC20 for token transfers
- Owner-only administrative functions
- Emergency withdrawal capability
- Comprehensive test coverage

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT License

## Disclaimer

This software is for educational purposes only. Trading cryptocurrencies carries significant risks. Always do your own research and never trade with funds you cannot afford to lose.
