// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {FiatBridge} from "../src/FiatBridge.sol";
import {MockToken} from "../src/MockToken.sol";

contract DeployTestEnvironment is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        address deployer = vm.addr(deployerPrivateKey);
        
        // Deploy mock tokens
        MockToken usdc = new MockToken("USD Coin", "USDC", 6, 1000000 * 10**6); // 1M USDC
        MockToken usdt = new MockToken("Tether USD", "USDT", 6, 1000000 * 10**6); // 1M USDT
        MockToken weth = new MockToken("Wrapped Ether", "WETH", 18, 10000 * 10**18); // 10K WETH
        MockToken strk = new MockToken("Starknet Token", "STRK", 18, 10000000 * 10**18); // 10M STRK

        console.log("Mock USDC deployed at:", address(usdc));
        console.log("Mock USDT deployed at:", address(usdt));
        console.log("Mock WETH deployed at:", address(weth));
        console.log("Mock STRK deployed at:", address(strk));

        // Deploy FiatBridge
        FiatBridge fiatBridge = new FiatBridge(deployer); // Use deployer as fee recipient for testing

        console.log("FiatBridge deployed at:", address(fiatBridge));

        // Configure supported tokens
        fiatBridge.setSupportedToken(
            address(usdc),
            10 * 10**6, // Min: 10 USDC
            100000 * 10**6, // Max: 100,000 USDC
            100 // Fee: 1%
        );

        fiatBridge.setSupportedToken(
            address(usdt),
            10 * 10**6, // Min: 10 USDT
            100000 * 10**6, // Max: 100,000 USDT
            100 // Fee: 1%
        );

        fiatBridge.setSupportedToken(
            address(weth),
            1 * 10**15, // Min: 0.001 ETH
            100 * 10**18, // Max: 100 ETH
            150 // Fee: 1.5%
        );

        fiatBridge.setSupportedToken(
            address(strk),
            100 * 10**18, // Min: 100 STRK
            1000000 * 10**18, // Max: 1,000,000 STRK
            100 // Fee: 1%
        );

        // Add liquidity to the bridge for onramping
        uint256 liquidityAmount = 100000 * 10**6; // 100K USDC/USDT
        usdc.approve(address(fiatBridge), liquidityAmount);
        fiatBridge.addLiquidity(address(usdc), liquidityAmount);

        usdt.approve(address(fiatBridge), liquidityAmount);
        fiatBridge.addLiquidity(address(usdt), liquidityAmount);

        uint256 ethLiquidity = 1000 * 10**18; // 1K WETH
        weth.approve(address(fiatBridge), ethLiquidity);
        fiatBridge.addLiquidity(address(weth), ethLiquidity);

        uint256 strkLiquidity = 1000000 * 10**18; // 1M STRK
        strk.approve(address(fiatBridge), strkLiquidity);
        fiatBridge.addLiquidity(address(strk), strkLiquidity);

        console.log("Liquidity added to FiatBridge");

        // Set deployer as operator for testing
        fiatBridge.setOperator(deployer, true);

        vm.stopBroadcast();

        // Output deployment info
        console.log("=== Test Environment Deployed ===");
        console.log("FiatBridge:", address(fiatBridge));
        console.log("USDC:", address(usdc));
        console.log("USDT:", address(usdt));
        console.log("WETH:", address(weth));
        console.log("STRK:", address(strk));
        console.log("Owner/Operator:", deployer);
        console.log("================================");

        // Create a simple usage example
        console.log("\n=== Usage Example ===");
        console.log("1. To initiate an offramp (crypto to fiat):");
        console.log("   fiatBridge.initiateOfframp(usdcAddress, amount, fiatAmount, 'NGN', 'tx_123')");
        console.log("2. To initiate an onramp (fiat to crypto):");
        console.log("   fiatBridge.initiateOnramp(usdcAddress, amount, fiatAmount, 'NGN', 'tx_456')");
        console.log("3. To process a request (operator only):");
        console.log("   fiatBridge.processFiatRequest(requestId, status, 'paystack_ref')");
        console.log("===================");
    }
}