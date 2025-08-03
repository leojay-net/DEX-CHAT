// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {FiatBridge} from "../src/FiatBridge.sol";
import {MockToken} from "../src/MockToken.sol";

contract DeployFiatBridge is Script {
    function setUp() public {}

    function run() public {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address feeRecipient = vm.envAddress("FEE_RECIPIENT");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        address deployer = vm.addr(deployerPrivateKey);

        // Deploy USDT first
        MockToken usdt = new MockToken("Tether USD", "USDT", 6, 1000000 * 10**6); // 1M USDT
        console.log("USDT deployed at:", address(usdt));

        // Deploy FiatBridge contract
        FiatBridge fiatBridge = new FiatBridge(feeRecipient);
        
        console.log("FiatBridge deployed at:", address(fiatBridge));
        console.log("Fee recipient:", feeRecipient);
        console.log("Owner:", fiatBridge.owner());

        // Add USDT support first
        fiatBridge.setSupportedToken(
            address(usdt),
            10 * 10**6, // Min: 10 USDT
            100000 * 10**6, // Max: 100,000 USDT
            100 // Fee: 1%
        );
        console.log("USDT support added:", address(usdt));

        // Add liquidity to the bridge for onramping USDT
        uint256 usdtLiquidity = 100000 * 10**6; // 100K USDT
        usdt.approve(address(fiatBridge), usdtLiquidity);
        fiatBridge.addLiquidity(address(usdt), usdtLiquidity);
        console.log("USDT liquidity added:", usdtLiquidity);

        // USDC configuration (if address provided)
        address usdcAddress = vm.envOr("USDC_ADDRESS", address(0x0));
        if (usdcAddress != address(0)) {
            fiatBridge.setSupportedToken(
                usdcAddress,
                10 * 10**6, // Min: 10 USDC
                100000 * 10**6, // Max: 100,000 USDC
                100 // Fee: 1%
            );
            console.log("USDC support added:", usdcAddress);
        }

        // ETH/WETH configuration (if address provided)
        address wethAddress = vm.envOr("WETH_ADDRESS", address(0x0));
        if (wethAddress != address(0)) {
            fiatBridge.setSupportedToken(
                wethAddress,
                1 * 10**15, // Min: 0.001 ETH
                100 * 10**18, // Max: 100 ETH
                150 // Fee: 1.5%
            );
            console.log("WETH support added:", wethAddress);
        }

        // STRK configuration (if address provided)
        address strkAddress = vm.envOr("STRK_ADDRESS", address(0x0));
        if (strkAddress != address(0)) {
            fiatBridge.setSupportedToken(
                strkAddress,
                100 * 10**18, // Min: 100 STRK
                1000000 * 10**18, // Max: 1,000,000 STRK
                100 // Fee: 1%
            );
            console.log("STRK support added:", strkAddress);
        }

        // Set up operators if specified
        address operator1 = vm.envOr("OPERATOR_1", address(0x0));
        if (operator1 != address(0)) {
            fiatBridge.setOperator(operator1, true);
            console.log("Operator 1 added:", operator1);
        }

        address operator2 = vm.envOr("OPERATOR_2", address(0x0));
        if (operator2 != address(0)) {
            fiatBridge.setOperator(operator2, true);
            console.log("Operator 2 added:", operator2);
        }

        // Set deployer as operator for testing
        fiatBridge.setOperator(deployer, true);
        console.log("Deployer set as operator:", deployer);

        vm.stopBroadcast();

        // Log deployment summary
        console.log("=== Deployment Summary ===");
        console.log("FiatBridge Contract:", address(fiatBridge));
        console.log("USDT Token:", address(usdt));
        console.log("Network:", block.chainid);
        console.log("Block Number:", block.number);
        console.log("Deployer:", deployer);
        console.log("USDT Liquidity Added:", usdtLiquidity);
        console.log("=========================");

        // Usage examples
        console.log("\n=== Usage Examples ===");
        console.log("USDT Contract Address:", address(usdt));
        console.log("FiatBridge Contract Address:", address(fiatBridge));
        console.log("To test offramp: fiatBridge.initiateOfframp(usdtAddress, amount, fiatAmount, 'NGN', 'tx_123')");
        console.log("To test onramp: fiatBridge.initiateOnramp(usdtAddress, amount, fiatAmount, 'NGN', 'tx_456')");
        console.log("====================");
    }
}