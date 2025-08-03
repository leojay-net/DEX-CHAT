# FiatBridge - Crypto to Fiat Bridge Contract

A comprehensive Solidity contract system for handling cryptocurrency to fiat currency conversions (offramping) and fiat to cryptocurrency conversions (onramping) with integration to external payment processors like Paystack.

## Features

- **Offramping**: Convert crypto tokens to fiat currency via bank transfers
- **Onramping**: Convert fiat currency to crypto tokens  
- **Multi-token Support**: Configurable support for multiple ERC20 tokens
- **Fee Management**: Configurable fees per token with automatic collection
- **Access Control**: Owner and operator roles for secure operations
- **Pausable**: Emergency pause functionality
- **Liquidity Management**: Owner can add/remove liquidity for onramping
- **Request Tracking**: Complete lifecycle tracking of all requests
- **Event Logging**: Comprehensive event emission for frontend integration

## Contract Architecture

### Core Contracts

1. **FiatBridge.sol** - Main contract handling all fiat bridge operations
2. **MockToken.sol** - ERC20 mock token for testing
3. **Test Files** - Comprehensive test suite
4. **Deployment Scripts** - Automated deployment and configuration

### Key Data Structures

```solidity
struct FiatRequest {
    address user;           // User initiating the request
    address token;          // Token being converted
    uint256 tokenAmount;    // Amount of tokens (net after fees)
    uint256 fiatAmount;     // Fiat amount
    string fiatCurrency;    // Currency code (NGN, USD, etc.)
    string transactionId;   // Unique transaction identifier
    RequestType requestType;// OFFRAMP or ONRAMP
    RequestStatus status;   // Current status
    uint256 timestamp;      // Request timestamp
    string externalReference; // External payment reference
}

struct SupportedToken {
    bool isSupported;       // Whether token is supported
    uint256 minAmount;      // Minimum transaction amount
    uint256 maxAmount;      // Maximum transaction amount  
    uint256 fee;           // Fee in basis points (100 = 1%)
}
```

## Installation & Setup

### 1. Install Dependencies

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
```

### 2. Environment Setup

Create a `.env` file:

```bash
# Deployment Configuration
PRIVATE_KEY=0x... # Your private key
FEE_RECIPIENT=0x... # Address to receive fees

# Token Addresses (optional, for mainnet deployment)
USDC_ADDRESS=0x...
USDT_ADDRESS=0x...
WETH_ADDRESS=0x...
STRK_ADDRESS=0x...

# Operator Addresses (optional)
OPERATOR_1=0x...
OPERATOR_2=0x...

# For configuration script
FIAT_BRIDGE_ADDRESS=0x...
LIQUIDITY_TOKEN=0x...
LIQUIDITY_AMOUNT=1000000000000 # Amount in wei
NEW_FEE_RECIPIENT=0x...
```

### 3. Deploy Test Environment

```bash
# Deploy test environment with mock tokens
forge script script/TestFiatBridge.s.sol:DeployTestEnvironment --broadcast --rpc-url $RPC_URL

# Deploy to mainnet/testnet
forge script script/DeployFiatBridge.s.sol:DeployFiatBridge --broadcast --rpc-url $RPC_URL --verify
```

## Usage

### Offramping (Crypto → Fiat)

```solidity
// 1. User approves tokens
IERC20(tokenAddress).approve(fiatBridgeAddress, amount);

// 2. Initiate offramp
bytes32 requestId = fiatBridge.initiateOfframp(
    tokenAddress,    // USDC address
    100 * 10**6,    // 100 USDC
    165000,         // 165,000 NGN expected
    "NGN",          // Nigerian Naira
    "tx_123"        // Unique transaction ID
);

// 3. Operator processes request after bank transfer
fiatBridge.processFiatRequest(
    requestId,
    RequestStatus.COMPLETED,
    "paystack_transfer_code_123"
);
```

### Onramping (Fiat → Crypto)

```solidity
// 1. User initiates onramp request
bytes32 requestId = fiatBridge.initiateOnramp(
    tokenAddress,    // USDC address  
    100 * 10**6,    // 100 USDC requested
    165000,         // 165,000 NGN to pay
    "NGN",          // Nigerian Naira
    "tx_456"        // Unique transaction ID
);

// 2. User pays fiat via external system (Paystack)
// 3. Operator confirms payment and completes request
fiatBridge.processFiatRequest(
    requestId,
    RequestStatus.COMPLETED,
    "paystack_payment_ref_456"
);
```

### Admin Operations

```solidity
// Add token support
fiatBridge.setSupportedToken(
    tokenAddress,
    10 * 10**6,     // Min: 10 tokens
    100000 * 10**6, // Max: 100,000 tokens
    100            // Fee: 1%
);

// Add liquidity for onramping
fiatBridge.addLiquidity(tokenAddress, amount);

// Set operators
fiatBridge.setOperator(operatorAddress, true);

// Emergency pause
fiatBridge.pause();
```

## Testing

Run the complete test suite:

```bash
# Run all tests
forge test

# Run specific test file
forge test --match-path test/FiatBridge.t.sol

# Run with verbose output
forge test -vvv

# Generate gas report
forge test --gas-report
```

### Test Coverage

The test suite covers:
- ✅ Successful offramp flows
- ✅ Successful onramp flows  
- ✅ Request processing and status updates
- ✅ Fee calculations and distributions
- ✅ Failure scenarios and refunds
- ✅ Access control and permissions
- ✅ Token configuration management
- ✅ Pause/unpause functionality
- ✅ Emergency withdrawals
- ✅ Event emissions
- ✅ Edge cases and error conditions

## Integration with Frontend

### Event Listening

```typescript
// Listen for new requests
fiatBridge.on("FiatRequestCreated", (requestId, user, token, tokenAmount, fiatAmount, currency, requestType, transactionId) => {
    console.log("New fiat request:", requestId);
    // Update UI, notify backend
});

// Listen for request updates
fiatBridge.on("FiatRequestProcessed", (requestId, newStatus, externalReference) => {
    console.log("Request updated:", requestId, newStatus);
    // Update UI status
});
```

### Request Status Tracking

```typescript
async function getRequestStatus(requestId: string) {
    const request = await fiatBridge.getRequest(requestId);
    return {
        status: request.status,
        externalReference: request.externalReference,
        timestamp: request.timestamp
    };
}
```

## Security Considerations

### Access Control
- **Owner**: Can configure tokens, set operators, pause contract, emergency withdraw
- **Operators**: Can process requests and update statuses
- **Users**: Can initiate offramp/onramp requests

### Safety Mechanisms
- ✅ ReentrancyGuard on all state-changing functions
- ✅ Pausable for emergency stops
- ✅ SafeERC20 for all token transfers
- ✅ Input validation on all parameters
- ✅ Fee limits (max 10%)
- ✅ Amount limits (min/max per token)

### Best Practices
- Always approve exact amounts needed
- Monitor request statuses via events
- Implement proper error handling
- Use timeouts for pending requests
- Regular security audits recommended

## Gas Optimization

- Used packed structs where possible
- Efficient mapping usage
- Batch operations support
- Minimal storage reads/writes

## Deployment Costs

Estimated gas costs:
- Contract deployment: ~2,500,000 gas
- Token configuration: ~100,000 gas
- Offramp initiation: ~150,000 gas
- Onramp initiation: ~120,000 gas
- Request processing: ~80,000 gas

## Integration with Existing DEX

The FiatBridge contract is designed to work alongside your existing DEX infrastructure:

1. **Independent Operation**: Handles only fiat conversions, leaving DEX swaps unchanged
2. **Token Compatibility**: Supports same ERC20 tokens as your DEX
3. **Event Integration**: Can be integrated with existing event monitoring
4. **Shared Infrastructure**: Can use same operators and fee recipients

## Monitoring & Analytics

### Key Metrics to Track
- Total volume by token and currency
- Success/failure rates
- Average processing times
- Fee collection
- Liquidity utilization
- User activity patterns

### Recommended Monitoring
- Set up alerts for failed requests
- Monitor contract balance levels
- Track operator activity
- Watch for unusual patterns

## Support & Maintenance

### Regular Tasks
- Monitor liquidity levels
- Process pending requests
- Update token configurations as needed
- Withdraw collected fees
- Review and update operator permissions

### Troubleshooting
- Check request status via `getRequest()`
- Verify token approvals and balances
- Confirm operator permissions
- Review event logs for issues

## Contributing

1. Fork the repository
2. Create feature branch
3. Add comprehensive tests
4. Ensure all tests pass
5. Submit pull request

## License

MIT License - see LICENSE file for details.
