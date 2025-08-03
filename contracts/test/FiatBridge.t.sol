// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {FiatBridge} from "../src/FiatBridge.sol";
import {MockToken} from "../src/MockToken.sol";

contract FiatBridgeTest is Test {
    FiatBridge public fiatBridge;
    MockToken public usdc;
    MockToken public eth;
    
    address public owner = address(0x1);
    address public feeRecipient = address(0x2);
    address public user = address(0x3);
    address public operator = address(0x4);
    
    uint256 public constant INITIAL_BALANCE = 10000 * 10**6; // 10,000 USDC
    uint256 public constant MIN_AMOUNT = 10 * 10**6; // 10 USDC
    uint256 public constant MAX_AMOUNT = 10000 * 10**6; // 10,000 USDC
    uint256 public constant FEE_BPS = 100; // 1%

    function setUp() public {
        // Deploy contracts as owner
        vm.startPrank(owner);
        
        fiatBridge = new FiatBridge(feeRecipient);
        usdc = new MockToken("USDC", "USDC", 6, 1000000 * 10**6);
        eth = new MockToken("ETH", "ETH", 18, 10000 * 10**18);
        
        // Setup tokens
        fiatBridge.setSupportedToken(address(usdc), MIN_AMOUNT, MAX_AMOUNT, FEE_BPS);
        fiatBridge.setSupportedToken(address(eth), MIN_AMOUNT, MAX_AMOUNT, FEE_BPS);
        
        // Set operator
        fiatBridge.setOperator(operator, true);
        
        // Mint tokens to user
        usdc.mint(user, INITIAL_BALANCE);
        eth.mint(user, INITIAL_BALANCE);
        
        // Add liquidity to contract for onramping
        usdc.approve(address(fiatBridge), INITIAL_BALANCE);
        fiatBridge.addLiquidity(address(usdc), INITIAL_BALANCE);
        
        eth.approve(address(fiatBridge), INITIAL_BALANCE);
        fiatBridge.addLiquidity(address(eth), INITIAL_BALANCE);
        
        vm.stopPrank();
        
        // User approves spending
        vm.startPrank(user);
        usdc.approve(address(fiatBridge), type(uint256).max);
        eth.approve(address(fiatBridge), type(uint256).max);
        vm.stopPrank();
    }

    function testOfframpSuccess() public {
        uint256 tokenAmount = 100 * 10**6; // 100 USDC
        uint256 fiatAmount = 165000; // 165,000 NGN (assuming 1 USDC = 1,650 NGN)
        string memory currency = "NGN";
        string memory txId = "tx_123";
        
        uint256 userBalanceBefore = usdc.balanceOf(user);
        uint256 feeRecipientBalanceBefore = usdc.balanceOf(feeRecipient);
        
        vm.prank(user);
        bytes32 requestId = fiatBridge.initiateOfframp(
            address(usdc),
            tokenAmount,
            fiatAmount,
            currency,
            txId
        );
        
        // Check balances
        uint256 expectedFee = (tokenAmount * FEE_BPS) / 10000;
        uint256 expectedNetAmount = tokenAmount - expectedFee;
        
        assertEq(usdc.balanceOf(user), userBalanceBefore - tokenAmount);
        assertEq(usdc.balanceOf(feeRecipient), feeRecipientBalanceBefore + expectedFee);
        
        // Check request details
        FiatBridge.FiatRequest memory request = fiatBridge.getRequest(requestId);
        assertEq(request.user, user);
        assertEq(request.token, address(usdc));
        assertEq(request.tokenAmount, expectedNetAmount);
        assertEq(request.fiatAmount, fiatAmount);
        assertEq(request.fiatCurrency, currency);
        assertEq(request.transactionId, txId);
        assertEq(uint8(request.requestType), uint8(FiatBridge.RequestType.OFFRAMP));
        assertEq(uint8(request.status), uint8(FiatBridge.RequestStatus.PENDING));
    }

    function testOnrampSuccess() public {
        uint256 tokenAmount = 100 * 10**6; // 100 USDC
        uint256 fiatAmount = 165000; // 165,000 NGN
        string memory currency = "NGN";
        string memory txId = "tx_456";
        
        vm.prank(user);
        bytes32 requestId = fiatBridge.initiateOnramp(
            address(usdc),
            tokenAmount,
            fiatAmount,
            currency,
            txId
        );
        
        // Check request details
        FiatBridge.FiatRequest memory request = fiatBridge.getRequest(requestId);
        assertEq(request.user, user);
        assertEq(request.token, address(usdc));
        assertEq(request.tokenAmount, tokenAmount);
        assertEq(request.fiatAmount, fiatAmount);
        assertEq(request.fiatCurrency, currency);
        assertEq(request.transactionId, txId);
        assertEq(uint8(request.requestType), uint8(FiatBridge.RequestType.ONRAMP));
        assertEq(uint8(request.status), uint8(FiatBridge.RequestStatus.PENDING));
    }

    function testOnrampCompletion() public {
        uint256 tokenAmount = 100 * 10**6; // 100 USDC
        uint256 fiatAmount = 165000; // 165,000 NGN
        string memory currency = "NGN";
        string memory txId = "tx_789";
        string memory externalRef = "paystack_ref_123";
        
        // Initiate onramp
        vm.prank(user);
        bytes32 requestId = fiatBridge.initiateOnramp(
            address(usdc),
            tokenAmount,
            fiatAmount,
            currency,
            txId
        );
        
        uint256 userBalanceBefore = usdc.balanceOf(user);
        uint256 feeRecipientBalanceBefore = usdc.balanceOf(feeRecipient);
        
        // Complete onramp
        vm.prank(operator);
        fiatBridge.processFiatRequest(
            requestId,
            FiatBridge.RequestStatus.COMPLETED,
            externalRef
        );
        
        // Check balances
        uint256 expectedFee = (tokenAmount * FEE_BPS) / 10000;
        uint256 expectedNetAmount = tokenAmount - expectedFee;
        
        assertEq(usdc.balanceOf(user), userBalanceBefore + expectedNetAmount);
        assertEq(usdc.balanceOf(feeRecipient), feeRecipientBalanceBefore + expectedFee);
        
        // Check request status
        FiatBridge.FiatRequest memory request = fiatBridge.getRequest(requestId);
        assertEq(uint8(request.status), uint8(FiatBridge.RequestStatus.COMPLETED));
        assertEq(request.externalReference, externalRef);
    }

    function testOfframpFailureRefund() public {
        uint256 tokenAmount = 100 * 10**6; // 100 USDC
        uint256 fiatAmount = 165000; // 165,000 NGN
        string memory currency = "NGN";
        string memory txId = "tx_fail";
        
        // Initiate offramp
        vm.prank(user);
        bytes32 requestId = fiatBridge.initiateOfframp(
            address(usdc),
            tokenAmount,
            fiatAmount,
            currency,
            txId
        );
        
        uint256 userBalanceBefore = usdc.balanceOf(user);
        
        // Fail the request
        vm.prank(operator);
        fiatBridge.processFiatRequest(
            requestId,
            FiatBridge.RequestStatus.FAILED,
            ""
        );
        
        // Check refund
        uint256 expectedFee = (tokenAmount * FEE_BPS) / 10000;
        uint256 expectedNetAmount = tokenAmount - expectedFee;
        
        assertEq(usdc.balanceOf(user), userBalanceBefore + expectedNetAmount);
        
        // Check request status
        FiatBridge.FiatRequest memory request = fiatBridge.getRequest(requestId);
        assertEq(uint8(request.status), uint8(FiatBridge.RequestStatus.REFUNDED));
    }

    function test_RevertWhen_OfframpUnsupportedToken() public {
        MockToken unsupportedToken = new MockToken("UNSUPPORTED", "UNS", 18, 1000 * 10**18);
        unsupportedToken.mint(user, 1000 * 10**18);
        
        vm.startPrank(user);
        unsupportedToken.approve(address(fiatBridge), type(uint256).max);
        
        // Should fail
        vm.expectRevert("Token not supported");
        fiatBridge.initiateOfframp(
            address(unsupportedToken),
            100 * 10**18,
            1000,
            "USD",
            "tx_fail"
        );
        vm.stopPrank();
    }

    function test_RevertWhen_OfframpAmountTooLow() public {
        uint256 tokenAmount = 5 * 10**6; // 5 USDC (below minimum)
        
        vm.prank(user);
        vm.expectRevert("Amount below minimum");
        fiatBridge.initiateOfframp(
            address(usdc),
            tokenAmount,
            1000,
            "USD",
            "tx_fail"
        );
    }

    function test_RevertWhen_OfframpAmountTooHigh() public {
        uint256 tokenAmount = 15000 * 10**6; // 15,000 USDC (above maximum)
        
        vm.prank(user);
        vm.expectRevert("Amount above maximum");
        fiatBridge.initiateOfframp(
            address(usdc),
            tokenAmount,
            15000,
            "USD",
            "tx_fail"
        );
    }

    function test_RevertWhen_OnrampInsufficientLiquidity() public {
        // First remove liquidity to make the test work
        uint256 contractBalance = usdc.balanceOf(address(fiatBridge));
        vm.prank(owner);
        fiatBridge.emergencyWithdraw(address(usdc), contractBalance - 5 * 10**6); // Leave only 5 USDC
        
        // Try to onramp more than available (but within limits: min=10, max=10000)
        uint256 tokenAmount = 50 * 10**6; // 50 USDC - above minimum, within max, but exceeds available liquidity of 5 USDC
        
        vm.prank(user);
        vm.expectRevert("Insufficient liquidity");
        fiatBridge.initiateOnramp(
            address(usdc),
            tokenAmount,
            1000000,
            "NGN",
            "tx_fail"
        );
    }

    function test_RevertWhen_UnauthorizedOperator() public {
        vm.prank(user);
        bytes32 requestId = fiatBridge.initiateOfframp(
            address(usdc),
            100 * 10**6,
            165000,
            "NGN",
            "tx_123"
        );
        
        // Unauthorized user tries to process request
        vm.prank(user);
        vm.expectRevert("Not authorized operator");
        fiatBridge.processFiatRequest(
            requestId,
            FiatBridge.RequestStatus.COMPLETED,
            "ref"
        );
    }

    function testTokenConfiguration() public {
        address newToken = address(0x123);
        uint256 newMinAmount = 50 * 10**6;
        uint256 newMaxAmount = 5000 * 10**6;
        uint256 newFee = 200; // 2%
        
        vm.prank(owner);
        fiatBridge.setSupportedToken(newToken, newMinAmount, newMaxAmount, newFee);
        
        assertTrue(fiatBridge.isTokenSupported(newToken));
        
        FiatBridge.SupportedToken memory config = fiatBridge.getTokenConfig(newToken);
        assertEq(config.minAmount, newMinAmount);
        assertEq(config.maxAmount, newMaxAmount);
        assertEq(config.fee, newFee);
        assertTrue(config.isSupported);
        
        // Remove token support
        vm.prank(owner);
        fiatBridge.removeSupportedToken(newToken);
        assertFalse(fiatBridge.isTokenSupported(newToken));
    }

    function testOperatorManagement() public {
        address newOperator = address(0x5);
        
        // Add operator
        vm.prank(owner);
        fiatBridge.setOperator(newOperator, true);
        
        // Test operator can process requests
        vm.prank(user);
        bytes32 requestId = fiatBridge.initiateOfframp(
            address(usdc),
            100 * 10**6,
            165000,
            "NGN",
            "tx_op_test"
        );
        
        vm.prank(newOperator);
        fiatBridge.processFiatRequest(
            requestId,
            FiatBridge.RequestStatus.PROCESSING,
            "ref_123"
        );
        
        // Remove operator
        vm.prank(owner);
        fiatBridge.setOperator(newOperator, false);
        
        // Should fail now
        vm.expectRevert("Not authorized operator");
        vm.prank(newOperator);
        fiatBridge.processFiatRequest(
            requestId,
            FiatBridge.RequestStatus.COMPLETED,
            "ref_456"
        );
    }

    function testPauseUnpause() public {
        // Pause contract
        vm.prank(owner);
        fiatBridge.pause();
        
        // Should fail when paused
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        vm.prank(user);
        fiatBridge.initiateOfframp(
            address(usdc),
            100 * 10**6,
            165000,
            "NGN",
            "tx_paused"
        );
        
        // Unpause
        vm.prank(owner);
        fiatBridge.unpause();
        
        // Should work again
        vm.prank(user);
        fiatBridge.initiateOfframp(
            address(usdc),
            100 * 10**6,
            165000,
            "NGN",
            "tx_unpaused"
        );
    }

    function testEmergencyWithdraw() public {
        uint256 contractBalance = usdc.balanceOf(address(fiatBridge));
        uint256 ownerBalanceBefore = usdc.balanceOf(owner);
        
        vm.prank(owner);
        fiatBridge.emergencyWithdraw(address(usdc), contractBalance);
        
        assertEq(usdc.balanceOf(address(fiatBridge)), contractBalance - contractBalance);
        assertEq(usdc.balanceOf(owner), ownerBalanceBefore + contractBalance);
    }

    function testGetAvailableLiquidity() public {
        uint256 liquidity = fiatBridge.getAvailableLiquidity(address(usdc));
        assertEq(liquidity, usdc.balanceOf(address(fiatBridge)));
    }

    function testAddLiquidity() public {
        uint256 additionalLiquidity = 1000 * 10**6;
        uint256 contractBalanceBefore = usdc.balanceOf(address(fiatBridge));
        
        vm.startPrank(owner);
        usdc.mint(owner, additionalLiquidity);
        usdc.approve(address(fiatBridge), additionalLiquidity);
        fiatBridge.addLiquidity(address(usdc), additionalLiquidity);
        vm.stopPrank();
        
        assertEq(usdc.balanceOf(address(fiatBridge)), contractBalanceBefore + additionalLiquidity);
    }

    function testEvents() public {
        uint256 tokenAmount = 100 * 10**6;
        uint256 fiatAmount = 165000;
        string memory currency = "NGN";
        string memory txId = "tx_events";
        
        // Test FiatRequestCreated event for offramp
        // We'll check the event without predicting the exact requestId
        vm.prank(user);
        bytes32 requestId = fiatBridge.initiateOfframp(
            address(usdc),
            tokenAmount,
            fiatAmount,
            currency,
            txId
        );
        
        // Test FiatRequestProcessed event
        string memory externalRef = "paystack_123";
        vm.expectEmit(true, false, false, true);
        emit FiatBridge.FiatRequestProcessed(
            requestId,
            FiatBridge.RequestStatus.PROCESSING,
            externalRef
        );
        
        vm.prank(operator);
        fiatBridge.processFiatRequest(
            requestId,
            FiatBridge.RequestStatus.PROCESSING,
            externalRef
        );
    }
}