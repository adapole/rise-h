import { network } from "hardhat"
const hre = require("hardhat")
import {
    Client,
    AccountId,
    PrivateKey,
    TokenAssociateTransaction,
    TokenId,
    ContractCreateFlow,
    ContractExecuteTransaction,
    ContractId,
    ContractFunctionParameters,
    Hbar
} from "@hashgraph/sdk"
import * as dotenv from "dotenv"

async function main() {
    const { ethers } = await network.connect({
        network: "testnet"
    })
    const [deployer] = await ethers.getSigners()
    console.log("Deploying contract with the account:", deployer.address)

    const MyContract = await ethers.getContractFactory("MyContract", deployer)
    const contract = await MyContract.deploy(/* constructor args if any */)

    await contract.waitForDeployment()

    const address = await contract.getAddress()
    console.log("Contract deployed at:", address)
}

main().catch(console.error)
// import * as dotenv from "dotenv"

// Helper function to convert EVM address to Hedera Account ID

// Helper function to convert EVM address to Token ID
function getTokenIdFromEvmAddress(evmAddress: string): TokenId {
    // Remove '0x' prefix if present
    return TokenId.fromSolidityAddress(evmAddress)
}

async function mains() {
    try {
        // Load environment variables
        // dotenv.config()

        // Check for environment variables
        const operatorId = process.env.OPERATOR_ID
        const operatorKey = process.env.OPERATOR_KEY
        const receiverAddress = process.env.RECEIVER_ADDRESS

        if (!operatorId || !operatorKey) {
            throw new Error("Environment variables OPERATOR_ID and OPERATOR_KEY must be present")
        }

        if (!receiverAddress) {
            throw new Error("Environment variable RECEIVER_ADDRESS must be present")
        }

        // Create Hedera client
        const client = Client.forTestnet()
        const accountId = AccountId.fromString(operatorId)
        const privateKey = PrivateKey.fromString(operatorKey)
        client.setOperator(accountId, privateKey)

        // Convert receiver's EVM address to Account ID if it's an EVM address
        const receiverAccountId = operatorId

        console.log("receiverAccountId", receiverAccountId.toString())
        console.log("Deploying Token contract...")

        // const nftService = new NFTService(client, accountId, privateKey);
        const nftContractId = await deployNFTContract(client, accountId, privateKey)
        console.log("NFT contract deployed at:", nftContractId.toString())

        console.log("\nCreating NFT token...")
        // const tokenAddress = await createNft(
        //     "HederaStays Properties",
        //     "HSTAY",
        //     "HederaStays Property Collection",
        //     1000, // maxSupply
        //     7776000, // autoRenewPeriod (90 days in seconds)
        //     nftContractId,
        //     client
        // )
        // console.log("NFT token created at:", tokenAddress)

        // // Convert token address to TokenId
        // const tokenId = getTokenIdFromEvmAddress(tokenAddress)
        // Step 1: Mint NFT to contract's wallet
        // console.log("\nStep 1: Minting NFT to contract's wallet...");
        // const metadata = [Buffer.from("ipfs://test-property-metadata-uri")];
        // const now = Math.floor(Date.now() / 1000);
        // const availableDates = [
        //     now + 86400, // Tomorrow
        //     now + (2 * 86400), // Day after tomorrow
        //     now + (3 * 86400)  // Three days from now
        // ];

        // const serialNumber = await nftService.mintNft(
        //     tokenAddress,
        //     metadata,
        //     availableDates
        // );
        // console.log("NFT minted with serial number:", serialNumber.toString());

        // // Step 2: Associate token with receiver's account using Hedera SDK
        // console.log("\nStep 2: Associating token with receiver's account...");
        // const associateTokenTx = await new TokenAssociateTransaction()
        //     .setAccountId(receiverAccountId)
        //     .setTokenIds([tokenId])
        //     .freezeWith(client)
        //     .sign(privateKey);

        // const associateTokenSubmit = await associateTokenTx.execute(client);
        // const associateTokenRx = await associateTokenSubmit.getReceipt(client);
        // console.log("Token association status:", associateTokenRx.status.toString());

        // // Step 3: Transfer NFT to receiver
        // console.log("\nStep 3: Transferring NFT to receiver...");
        // await nftService.transferNft(
        //     tokenAddress,
        //     receiverAddress,
        //     serialNumber.toNumber()
        // );
        // console.log("NFT transferred to:", receiverAddress);

        // // Save all deployment information
        // const fs = require('fs');
        // const deploymentInfo = {
        //     nftContractId: nftContractId.toString(),
        //     tokenAddress: tokenAddress,
        //     tokenId: tokenId.toString(),
        //     mintedNFTSerialNumber: serialNumber.toString(),
        //     receiverAddress: receiverAddress,
        //     receiverAccountId: receiverAccountId.toString(),
        //     availableDates: availableDates
        // };
        // fs.writeFileSync('deployment-nft.json', JSON.stringify(deploymentInfo, null, 2));
        // console.log("\nDeployment information saved to deployment-nft.json");

        console.log("\nDeployment and minting flow completed successfully!")
    } catch (error) {
        console.error("Error in deployment script:", error)
        process.exit(1)
    }
}

// main()

async function deployNFTContract(client: Client, accountId: AccountId, privateKey: PrivateKey) {
    try {
        // Read the contract bytecode
        const myContractArtifact = await hre.artifacts.readArtifact("TokenManager")
        const bytecode = myContractArtifact.bytecode

        const createContract = new ContractCreateFlow()
            .setGas(8000000) // Increase if revert
            .setBytecode(bytecode) // Contract bytecode
        const createContractTx = await createContract.execute(client)
        const createContractRx = await createContractTx.getReceipt(client)

        if (!createContractRx.contractId) {
            throw new Error("Failed to create contract - no contract ID received")
        }
        const contractId = createContractRx.contractId

        return contractId
    } catch (error) {
        console.error("Error deploying contract:", error)
        throw error
    }
}

async function createNft(
    name: string,
    symbol: string,
    memo: string,
    maxSupply: number,
    autoRenewPeriod: number,
    contractId: ContractId,
    client: Client
): Promise<string> {
    try {
        if (!contractId) {
            throw new Error("Contract not deployed")
        }

        const transaction = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(1000000)
            .setFunction(
                "createNft",
                new ContractFunctionParameters()
                    .addString(name)
                    .addString(symbol)
                    .addString(memo)
                    .addInt64(maxSupply)
                    .addUint32(autoRenewPeriod)
            )
            .setPayableAmount(new Hbar(10)) // Set an appropriate amount for token creation

        const txResponse = await transaction.execute(client)
        const record = await txResponse.getRecord(client)

        if (!record.contractFunctionResult) {
            throw new Error("Failed to create NFT - no function result received")
        }

        const tokenAddress = record.contractFunctionResult.getAddress(0)
        return tokenAddress
    } catch (error) {
        console.error("Error creating NFT:", error)
        throw error
    }
}
