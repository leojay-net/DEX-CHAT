# DEX-CHAT - AI-Powered USDT to Fiat Bridge

A comprehensive decentralized exchange (DEX) application that enables seamless conversion between USDT and Nigerian Naira (NGN) through AI-assisted conversations and automated smart contract interactions.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black)
![Solidity](https://img.shields.io/badge/Solidity-^0.8.19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## Overview

DEX-CHAT combines the power of AI conversation flows with blockchain technology to create an intuitive platform for cryptocurrency to fiat conversions. Users interact with an AI assistant that guides them through the conversion process, automatically triggering smart contract transactions when appropriate.

### Key Features

- **AI-Powered Interface**: Intelligent conversation flow with Google Gemini AI
- **USDT to NGN Conversion**: Seamless offramping through smart contracts
- **Nigerian Banking Integration**: Real bank account verification via Paystack API
- **Mobile-Responsive Design**: Optimized for all device sizes
- **Secure Wallet Integration**: Privy authentication with embedded wallets
- **Real-time Portfolio**: Live USDT balance tracking
- **Automated Transactions**: Smart triggering after conversation milestones
- **Transaction History**: Complete audit trail of all operations

## Architecture

The project consists of two main components:

### 1. Smart Contracts (`/contracts`)
- **Blockchain**: Morph Holesky Testnet
- **Main Contract**: FiatBridge.sol - Handles USDT to fiat conversions
- **Framework**: Foundry for development, testing, and deployment
- **Key Features**: Multi-token support, fee management, liquidity pools

### 2. Frontend Application (`/dex_with_fiat_frontend`)
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Blockchain Integration**: Wagmi + Viem
- **Authentication**: Privy wallet connection
- **AI Integration**: Google Gemini API
- **Payment Processing**: Paystack API for Nigerian banking

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.3.5** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Wagmi 2.16.0** - Ethereum development framework
- **Viem 2.33.1** - Low-level Ethereum interactions
- **Privy** - Wallet authentication and management
- **React Query** - Server state management
- **Lucide React** - Icon library

### Smart Contracts
- **Solidity ^0.8.19** - Smart contract language
- **Foundry** - Development toolkit
- **OpenZeppelin** - Security libraries
- **Morph Holesky** - Testnet deployment

### APIs & Services
- **Google Gemini AI** - Conversational AI
- **Paystack API** - Nigerian payment processing
- **Morph RPC** - Blockchain connectivity

## Technology Stack

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**
- **Foundry** (for smart contract development)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/leojay-net/DEX-CHAT.git
cd DEX-CHAT
```

### 2. Smart Contract Setup

```bash
cd contracts

# Install Foundry dependencies
forge install

# Compile contracts
forge build

# Run tests
forge test

# Deploy to testnet (configure .env first)
forge script script/DeployFiatBridge.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

### 3. Frontend Setup

```bash
cd dex_with_fiat_frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### 4. Environment Configuration

Create `.env.local` in the frontend directory:

```bash
# AI Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Wallet Authentication
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID=2810
NEXT_PUBLIC_RPC_URL=https://rpc-holesky.morphl2.io

# Contract Addresses
NEXT_PUBLIC_USDT_ADDRESS=0x3Dc887F12aF3565A2D28FC06492Aa698E6313Cf7
NEXT_PUBLIC_FIAT_BRIDGE_ADDRESS=0xf59Dd62E5721425ca86666060dD66B8d4fA5E900

# Payment Processing
PAYSTACK_SECRET_KEY=your_paystack_secret_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# Application Settings
NEXT_PUBLIC_APP_NAME=Fiat Off-ramping
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the Application

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The application will be available at `http://localhost:3000`

## Usage Guide

### For Users

1. **Connect Wallet**: Use the wallet connection interface to authenticate
2. **Start Conversation**: Begin chatting with the AI assistant about your conversion needs
3. **Provide Details**: Share your USDT amount and Nigerian bank account details
4. **Automatic Trigger**: After 5 consecutive chat messages, the system will prompt for transaction confirmation
5. **Bank Verification**: Your bank account will be verified via Paystack API
6. **Execute Transaction**: Confirm the smart contract transaction
7. **Receive Funds**: NGN will be transferred to your verified bank account

### For Developers

#### Key Components

- **`SimpleEthereumChatInterface`**: Main chat interface with AI integration
- **`SimpleEthereumFiatModal`**: USDT to fiat conversion modal
- **`SimpleEthereumWalletConnection`**: Wallet authentication component
- **`useChat`**: Custom hook for conversation management
- **`ethereumContract`**: Smart contract interaction utilities

#### Conversation Flow

```typescript
// Conversation state tracking
interface ConversationState {
    messageCount: number;
    hasUserCancelled: boolean;
    usdtAmount: string;
    bankDetails: BankDetails;
    shouldTriggerTransaction: boolean;
}
```

## Smart Contract Integration

### FiatBridge Contract

The main contract handles:
- USDT token approvals and transfers
- Fee calculations and deductions
- Request lifecycle management
- Event emission for frontend tracking

#### Key Functions

```solidity
function initiateOfframp(
    address token,
    uint256 amount,
    string memory bankAccount,
    string memory bankCode,
    string memory accountName
) external;
```

### Contract Addresses (Morph Holesky)

- **USDT Token**: `0x3Dc887F12aF3565A2D28FC06492Aa698E6313Cf7`
- **FiatBridge**: `0xf59Dd62E5721425ca86666060dD66B8d4fA5E900`

## Banking Integration

### Paystack API Integration

The application integrates with Paystack for:
- **Bank List Retrieval**: Get all supported Nigerian banks
- **Account Verification**: Verify account numbers and names
- **Real-time Validation**: Instant feedback during form completion

#### API Endpoints Used

```typescript
// Get list of banks
GET /bank

// Verify account number
GET /bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}
```

## Security Features

- **Wallet Security**: Privy-powered authentication with embedded wallets
- **Smart Contract Security**: OpenZeppelin security libraries
- **Input Validation**: Comprehensive form validation and sanitization
- **Error Handling**: Graceful error handling with user feedback
- **Type Safety**: Full TypeScript implementation

## Testing

### Smart Contract Tests

```bash
cd contracts
forge test --gas-report
```

### Frontend Tests

```bash
cd dex_with_fiat_frontend
npm run test
```

## Mobile Responsiveness

The application is fully responsive with:
- **Hamburger Menu**: Collapsible navigation for mobile
- **Touch-Optimized**: Large touch targets and smooth interactions
- **Responsive Layouts**: Adaptive design for all screen sizes
- **Mobile-First**: Progressive enhancement approach

## Deployment

### Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Smart Contract Deployment

```bash
cd contracts
forge script script/DeployFiatBridge.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write comprehensive tests for new features
- Update documentation for significant changes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support & Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/leojay-net/DEX-CHAT/issues)
- **Documentation**: Check the individual README files in `/contracts` and `/dex_with_fiat_frontend`
- **Community**: Join our discussions in GitHub Discussions

## Acknowledgments

- **Morph Network** - For providing the L2 infrastructure
- **Paystack** - For Nigerian payment processing
- **Google Gemini** - For AI conversation capabilities
- **Privy** - For seamless wallet authentication
- **OpenZeppelin** - For secure smart contract libraries

---

**Built with love for the future of decentralized finance in Africa**
