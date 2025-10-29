import { network } from "hardhat"

const { ethers } = await network.connect({ network: "testnet" })

async function main() {
    console.log("Starting Feedback contract deployment...")
    const [deployer] = await ethers.getSigners()
    console.log("Deploying contract with the account:", deployer.address)

    let semaphoreAddress: string

    semaphoreAddress = "0x3eb28C1397936fa586dc219a01b3A86deF5D2145"

    console.log(`Using Semaphore at: ${semaphoreAddress}`)

    // --- Deploy Feedback.sol ---
    const FeedbackFactory = await ethers.getContractFactory("Feedback", deployer)

    const feedbackContract = await FeedbackFactory.deploy(semaphoreAddress)

    await feedbackContract.waitForDeployment() // ethers v6 standard

    console.log(`✅ Feedback deployed at: ${await feedbackContract.getAddress()}`)
}

main().catch((err) => {
    console.error("❌ Deployment failed:", err)
    process.exitCode = 1
})
