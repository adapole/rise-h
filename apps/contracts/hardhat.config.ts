import type { HardhatUserConfig } from "hardhat/config"
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers"
import { configVariable } from "hardhat/config"

const config: HardhatUserConfig = {
    plugins: [hardhatToolboxMochaEthersPlugin],
    solidity: {
        profiles: {
            default: { version: "0.8.28" },
            production: {
                version: "0.8.28",
                settings: { viaIR: true, optimizer: { enabled: true, runs: 200 } }
            }
        }
    },
    networks: {
        testnet: {
            type: "http",
            url: configVariable("HEDERA_RPC_URL"),
            accounts: [configVariable("HEDERA_PRIVATE_KEY")]
        }
    },
    defaultNetwork: process.env.DEFAULT_NETWORK || "testnet"
}

export default config
