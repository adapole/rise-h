import { network } from "hardhat"
import { config as dotenvConfig } from "dotenv"
import { fileURLToPath } from "url"
import { dirname, resolve } from "path"
const __dirname = dirname(fileURLToPath(import.meta.url))

dotenvConfig({ path: resolve(__dirname, "../../../.env") })

const { ethers } = await network.connect({ network: "testnet" })

async function main() {
    const [signer] = await ethers.getSigners()
    console.log("Using signer:", signer.address)

    const contractAddress = process.env.TOKENMANAGER_ADDRESS as string
    const recipient = signer.address

    const myHTSTokenContract = await ethers.getContractAt("TokenManager", contractAddress, signer)

    // Display the underlying HTS token address
    const tokenAddress = await myHTSTokenContract.tokenAddress()
    console.log("HTS ERC20 facade address:", tokenAddress)

    // 1) Associate the signer via token.associate() (EOA -> token contract)
    const tokenAssociateAbi = ["function associate()"]
    const token = new ethers.Contract(tokenAddress, tokenAssociateAbi, signer)
    console.log("Associating signer to token via token.associate() ...")
    const assocTx = await token.associate({ gasLimit: 800_000 })
    await assocTx.wait()
    console.log("Associate tx hash:", assocTx.hash)

    // 3) Mint the Token via the wrapper (wrapper holds supply key)
    console.log(`Minting Token to ${recipient} ...`)
    // Note: Our mintNFT function is overloaded; we must use this syntax to disambiguate
    // or we get a typescript error.
    const tx = await myHTSTokenContract["mintTokenToAddressPublic(address,int64)"](recipient, 1000, {
        gasLimit: 350_000
    })
    await tx.wait()
    console.log("Mint tx hash:", tx.hash)

    // Check recipient's Token balance on the ERC20 facade (not on MyHTSToken)
    const erc20 = new ethers.Contract(
        tokenAddress,
        ["function balanceOf(address owner) view returns (uint256)"],
        signer
    )
    const balance = (await erc20.balanceOf(recipient)) as bigint
    console.log("Balance:", balance.toString(), "Tokens")
}

main().catch(console.error)
