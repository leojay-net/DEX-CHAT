// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title FiatBridge
 * @dev Contract for handling crypto to fiat (offramping) and fiat to crypto (onramping) operations
 * Integrates with external payment processors like Paystack for bank transfers
 */
contract FiatBridge is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Structs
    struct FiatRequest {
        address user;
        address token;
        uint256 tokenAmount;
        uint256 fiatAmount;
        string fiatCurrency;
        string transactionId;
        RequestType requestType;
        RequestStatus status;
        uint256 timestamp;
        string externalReference; // Paystack transfer reference
    }

    struct SupportedToken {
        bool isSupported;
        uint256 minAmount;
        uint256 maxAmount;
        uint256 fee; // Fee in basis points (100 = 1%)
    }

    enum RequestType {
        OFFRAMP, // Crypto to Fiat
        ONRAMP   // Fiat to Crypto
    }

    enum RequestStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED,
        REFUNDED
    }

    // State variables
    mapping(bytes32 => FiatRequest) public fiatRequests;
    mapping(address => SupportedToken) public supportedTokens;
    mapping(address => bool) public authorizedOperators;
    
    uint256 public requestCounter;
    uint256 public constant MAX_FEE = 1000; // 10% max fee
    address public feeRecipient;
    
    // Events
    event FiatRequestCreated(
        bytes32 indexed requestId,
        address indexed user,
        address indexed token,
        uint256 tokenAmount,
        uint256 fiatAmount,
        string fiatCurrency,
        RequestType requestType,
        string transactionId
    );

    event FiatRequestProcessed(
        bytes32 indexed requestId,
        RequestStatus newStatus,
        string externalReference
    );

    event TokenSupported(
        address indexed token,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 fee
    );

    event TokenUnsupported(address indexed token);

    event OperatorUpdated(address indexed operator, bool authorized);

    event FeesWithdrawn(address indexed token, uint256 amount, address recipient);

    // Modifiers
    modifier onlyOperator() {
        require(authorizedOperators[msg.sender] || msg.sender == owner(), "Not authorized operator");
        _;
    }

    modifier validToken(address token) {
        require(supportedTokens[token].isSupported, "Token not supported");
        _;
    }

    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
        authorizedOperators[msg.sender] = true;
    }

    /**
     * @dev Initiate a crypto to fiat conversion (offramping)
     * @param token The ERC20 token address to convert
     * @param tokenAmount Amount of tokens to convert
     * @param fiatAmount Expected fiat amount
     * @param fiatCurrency Currency code (e.g., "NGN", "USD")
     * @param transactionId Unique transaction identifier
     */
    function initiateOfframp(
        address token,
        uint256 tokenAmount,
        uint256 fiatAmount,
        string calldata fiatCurrency,
        string calldata transactionId
    ) external nonReentrant whenNotPaused validToken(token) returns (bytes32) {
        require(tokenAmount > 0, "Invalid token amount");
        require(fiatAmount > 0, "Invalid fiat amount");
        require(bytes(fiatCurrency).length > 0, "Invalid currency");
        require(bytes(transactionId).length > 0, "Invalid transaction ID");

        SupportedToken storage tokenConfig = supportedTokens[token];
        require(tokenAmount >= tokenConfig.minAmount, "Amount below minimum");
        require(tokenAmount <= tokenConfig.maxAmount, "Amount above maximum");

        // Calculate fee and net amount
        uint256 fee = (tokenAmount * tokenConfig.fee) / 10000;
        uint256 netAmount = tokenAmount - fee;

        // Transfer tokens from user to contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);

        // Transfer fee to fee recipient if needed
        if (fee > 0) {
            IERC20(token).safeTransfer(feeRecipient, fee);
        }

        // Create request ID
        bytes32 requestId = keccak256(abi.encodePacked(
            msg.sender,
            token,
            tokenAmount,
            block.timestamp,
            requestCounter++
        ));

        // Store request
        fiatRequests[requestId] = FiatRequest({
            user: msg.sender,
            token: token,
            tokenAmount: netAmount,
            fiatAmount: fiatAmount,
            fiatCurrency: fiatCurrency,
            transactionId: transactionId,
            requestType: RequestType.OFFRAMP,
            status: RequestStatus.PENDING,
            timestamp: block.timestamp,
            externalReference: ""
        });

        // Emit event
        emit FiatRequestCreated(
            requestId,
            msg.sender,
            token,
            netAmount,
            fiatAmount,
            fiatCurrency,
            RequestType.OFFRAMP,
            transactionId
        );

        return requestId;
    }

    /**
     * @dev Reserve tokens for fiat to crypto conversion (onramping)
     * @param token The ERC20 token address to receive
     * @param tokenAmount Amount of tokens to receive
     * @param fiatAmount Fiat amount being paid
     * @param fiatCurrency Currency code
     * @param transactionId Unique transaction identifier
     */
    function initiateOnramp(
        address token,
        uint256 tokenAmount,
        uint256 fiatAmount,
        string calldata fiatCurrency,
        string calldata transactionId
    ) external nonReentrant whenNotPaused validToken(token) returns (bytes32) {
        require(tokenAmount > 0, "Invalid token amount");
        require(fiatAmount > 0, "Invalid fiat amount");
        require(bytes(fiatCurrency).length > 0, "Invalid currency");
        require(bytes(transactionId).length > 0, "Invalid transaction ID");

        SupportedToken storage tokenConfig = supportedTokens[token];
        require(tokenAmount >= tokenConfig.minAmount, "Amount below minimum");
        require(tokenAmount <= tokenConfig.maxAmount, "Amount above maximum");

        // Check if contract has enough tokens
        require(IERC20(token).balanceOf(address(this)) >= tokenAmount, "Insufficient liquidity");

        // Create request ID
        bytes32 requestId = keccak256(abi.encodePacked(
            msg.sender,
            token,
            tokenAmount,
            block.timestamp,
            requestCounter++
        ));

        // Store request
        fiatRequests[requestId] = FiatRequest({
            user: msg.sender,
            token: token,
            tokenAmount: tokenAmount,
            fiatAmount: fiatAmount,
            fiatCurrency: fiatCurrency,
            transactionId: transactionId,
            requestType: RequestType.ONRAMP,
            status: RequestStatus.PENDING,
            timestamp: block.timestamp,
            externalReference: ""
        });

        // Emit event
        emit FiatRequestCreated(
            requestId,
            msg.sender,
            token,
            tokenAmount,
            fiatAmount,
            fiatCurrency,
            RequestType.ONRAMP,
            transactionId
        );

        return requestId;
    }

    /**
     * @dev Process a fiat request - can be called by operators to update status
     * @param requestId The request identifier
     * @param newStatus New status for the request
     * @param externalReference External payment reference (e.g., Paystack transfer code)
     */
    function processFiatRequest(
        bytes32 requestId,
        RequestStatus newStatus,
        string calldata externalReference
    ) external onlyOperator {
        FiatRequest storage request = fiatRequests[requestId];
        require(request.user != address(0), "Request not found");
        require(request.status == RequestStatus.PENDING || request.status == RequestStatus.PROCESSING, "Invalid status transition");

        request.status = newStatus;
        request.externalReference = externalReference;

        // Handle completion of onramp requests
        if (newStatus == RequestStatus.COMPLETED && request.requestType == RequestType.ONRAMP) {
            _processOnrampCompletion(request);
        }

        // Handle failed requests - refund if applicable
        if (newStatus == RequestStatus.FAILED && request.requestType == RequestType.OFFRAMP) {
            _processOfframpRefund(request);
        }

        emit FiatRequestProcessed(requestId, newStatus, externalReference);
    }

    /**
     * @dev Internal function to handle onramp completion
     */
    function _processOnrampCompletion(FiatRequest storage request) internal {
        SupportedToken storage tokenConfig = supportedTokens[request.token];
        uint256 fee = (request.tokenAmount * tokenConfig.fee) / 10000;
        uint256 netAmount = request.tokenAmount - fee;

        // Transfer tokens to user
        IERC20(request.token).safeTransfer(request.user, netAmount);

        // Transfer fee to fee recipient
        if (fee > 0) {
            IERC20(request.token).safeTransfer(feeRecipient, fee);
        }
    }

    /**
     * @dev Internal function to handle offramp refund
     */
    function _processOfframpRefund(FiatRequest storage request) internal {
        // Refund the tokens (minus any fees already taken)
        IERC20(request.token).safeTransfer(request.user, request.tokenAmount);
        request.status = RequestStatus.REFUNDED;
    }

    /**
     * @dev Add or update supported token configuration
     * @param token Token address
     * @param minAmount Minimum amount for transactions
     * @param maxAmount Maximum amount for transactions  
     * @param fee Fee in basis points
     */
    function setSupportedToken(
        address token,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 fee
    ) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(maxAmount > minAmount, "Invalid amount range");
        require(fee <= MAX_FEE, "Fee too high");

        supportedTokens[token] = SupportedToken({
            isSupported: true,
            minAmount: minAmount,
            maxAmount: maxAmount,
            fee: fee
        });

        emit TokenSupported(token, minAmount, maxAmount, fee);
    }

    /**
     * @dev Remove token support
     * @param token Token address to remove
     */
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token].isSupported = false;
        emit TokenUnsupported(token);
    }

    /**
     * @dev Update operator authorization
     * @param operator Operator address
     * @param authorized Whether the operator is authorized
     */
    function setOperator(address operator, bool authorized) external onlyOwner {
        require(operator != address(0), "Invalid operator address");
        authorizedOperators[operator] = authorized;
        emit OperatorUpdated(operator, authorized);
    }

    /**
     * @dev Update fee recipient
     * @param newFeeRecipient New fee recipient address
     */
    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = newFeeRecipient;
    }

    /**
     * @dev Emergency withdrawal function for contract owner
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    /**
     * @dev Pause contract operations
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get request details
     * @param requestId Request identifier
     */
    function getRequest(bytes32 requestId) external view returns (FiatRequest memory) {
        return fiatRequests[requestId];
    }

    /**
     * @dev Check if token is supported
     * @param token Token address
     */
    function isTokenSupported(address token) external view returns (bool) {
        return supportedTokens[token].isSupported;
    }

    /**
     * @dev Get token configuration
     * @param token Token address
     */
    function getTokenConfig(address token) external view returns (SupportedToken memory) {
        return supportedTokens[token];
    }

    /**
     * @dev Add liquidity for onramping (owner only)
     * @param token Token address
     * @param amount Amount to add
     */
    function addLiquidity(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @dev Check available liquidity for onramping
     * @param token Token address
     */
    function getAvailableLiquidity(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}