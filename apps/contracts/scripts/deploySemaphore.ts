import { network, run } from "hardhat"

const { ethers } = await network.connect({ network: "testnet" })

async function main(logs = true) {
    const [deployer] = await ethers.getSigners()
    console.log("Deploying contract with the account:", deployer.address)

    // Deploy SemaphoreVerifier if not provided.
    const SemaphoreVerifierFactory = await ethers.getContractFactory("SemaphoreVerifier", deployer)

    const semaphoreVerifier = await SemaphoreVerifierFactory.deploy()

    await semaphoreVerifier.waitForDeployment()

    const semaphoreVerifierAddress = await semaphoreVerifier.getAddress()
    if (logs) {
        console.info(`SemaphoreVerifier contract has been deployed to: ${semaphoreVerifierAddress}`)
    }
    const PoseidonT3Factory = await ethers.getContractFactory("PoseidonT3", deployer)
    const poseidonT3 = await PoseidonT3Factory.deploy()

    await poseidonT3.waitForDeployment()

    const poseidonAddress = await poseidonT3.getAddress()

    if (logs) {
        console.info(`Poseidon library has been deployed to: ${poseidonAddress}`)
    }
    // Deploy the Semaphore contract with the necessary library.
    const SemaphoreFactory = await ethers.getContractFactory(
        "Semaphore",
        {
            libraries: {
                PoseidonT3: poseidonAddress
            }
        },
        deployer
    )

    const semaphore = await SemaphoreFactory.deploy(semaphoreVerifierAddress)

    await semaphore.waitForDeployment()

    if (logs) {
        console.info(`Semaphore contract has been deployed to: ${await semaphore.getAddress()}`)
    }
}

main(true).catch((err) => {
    console.error("❌ Deployment failed:", err)
    process.exitCode = 1
})
