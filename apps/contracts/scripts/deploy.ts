import { network } from "hardhat"

const { ethers } = await network.connect({ network: "testnet" })

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log("Deploying contract with the account:", deployer.address)

    // 1) Deploy the wrapper contract
    // The deployer will also be the owner of our NFT contract
    const MyHTSToken = await ethers.getContractFactory("TokenManager", deployer)
    const contract = await MyHTSToken.deploy()
    await contract.waitForDeployment()

    // 2) Create the HTS NFT collection by calling createNFTCollection()
    const HBAR_TO_SEND = "15" // HBAR to send with createNFTCollection()
    console.log(`Calling createToken() with ${HBAR_TO_SEND} HBAR to create the HTS Token...`)
    const tx = await contract.createToken({
        gasLimit: 250_000,
        value: ethers.parseEther(HBAR_TO_SEND)
    })
    await tx.wait()
    console.log("createToken() tx hash:", tx.hash)

    // 3) Read the created HTS token address
    const contractAddress = await contract.getAddress()
    console.log("TokenManager contract deployed at:", contractAddress)
    const tokenAddress = await contract.tokenAddress()
    console.log("Underlying HTS Token (ERC20 facade) address:", tokenAddress)
}

main().catch(console.error)
