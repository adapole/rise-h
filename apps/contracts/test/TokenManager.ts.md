import { expect } from "chai"
import { ethers, network } from "hardhat"

describe("TokenManager (Hedera Testnet)", function () {
    this.timeout(120000) // 2-minute timeout for Hedera transaction confirmation

    let TokenManager: any
    let deployer: any
    let user1: any

    before(async function () {
        ;[deployer, user1] = await ethers.getSigners()

        console.log(`\n🚀 Deploying TokenManager from ${deployer.address} on ${network.name}...`)

        const TokenManagerFactory = await ethers.getContractFactory("TokenManager", deployer)
        TokenManager = await TokenManagerFactory.deploy()

        console.log("⏳ Waiting for deployment confirmation...")
        await TokenManager.waitForDeployment()

        const tokenAddress = await TokenManager.tokenAddress()
        console.log(`✅ TokenManager deployed. Token Address: ${tokenAddress}`)
    })

    it("Should successfully create token on Hedera", async function () {
        const tokenAddr = await TokenManager.tokenAddress()
        expect(tokenAddr).to.properAddress
        console.log(`🪙 Token deployed at: ${tokenAddr}`)
    })

    it("Should mint tokens on Hedera", async function () {
        const tokenAddr = await TokenManager.tokenAddress()
        console.log(`\n🧾 Minting tokens on: ${tokenAddr}`)

        const metadata: string[] = []
        const tx = await TokenManager.mintTokenPublic(tokenAddr, 50, metadata)
        const receipt = await tx.wait()

        console.log("✅ Mint transaction confirmed:", receipt.hash)
        expect(receipt.status).to.equal(1)
    })

    it("Should associate token with another account", async function () {
        const tokenAddr = await TokenManager.tokenAddress()
        console.log(`\n🔗 Associating token for ${user1.address}`)

        const tx = await TokenManager.associateTokenPublic(user1.address, tokenAddr)
        const receipt = await tx.wait()

        console.log("✅ Association TX:", receipt.hash)
        expect(receipt.status).to.equal(1)
    })

    it("Should approve spending", async function () {
        const tokenAddr = await TokenManager.tokenAddress()
        console.log(`\n💳 Approving ${user1.address} to spend tokens...`)

        const tx = await TokenManager.approvePublic(tokenAddr, user1.address, 10)
        const receipt = await tx.wait()

        console.log("✅ Approve TX:", receipt.hash)
        expect(receipt.status).to.equal(1)
    })
})
