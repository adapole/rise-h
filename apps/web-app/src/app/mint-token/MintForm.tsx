"use client"

import { useState } from "react"
import { ethers } from "ethers"
import useHashConnect from "@/hooks/useHashConnect"
import "@/styles/MintToken.module.css"
import styles from "@/styles/Transfer.module.css"
import MintControllerABI from "../../../contract-artifacts/MintController.json"
import { ContractExecuteTransaction } from "@hashgraph/sdk"
import { associateToken, executeContractFunctionSimple, executeTransaction, signMessages } from "@/services/hashconnect"

export default function MintForm() {
    const [amount, setAmount] = useState("")
    const [status, setStatus] = useState("")
    const { isConnected, accountId } = useHashConnect()

    const TOKEN_ADDRESS = "0.0.7152637"

    async function handleMint() {
        try {
            if (!isConnected || !accountId) {
                setStatus("❗ Please connect your wallet first.")
                return
            }
            setStatus("⏳ Preparing mint transaction...")

            const rpcUrl = process.env.NEXT_PUBLIC_HEDERA_RPC_URL
            const mintControllerAddress = process.env.NEXT_PUBLIC_MINT_CONTROLLER

            if (!rpcUrl || !mintControllerAddress) {
                setStatus("❌ Missing RPC URL or Mint Controller address in env.")
                return
            }

            // 1. Create provider and signer (v6)

            const provider = new ethers.JsonRpcProvider(rpcUrl)

            // 1️⃣ Associate wallet with token
            await associateToken(accountId, TOKEN_ADDRESS)
            console.log("Wallet associated successfully")

            setStatus(`⏳ Minting ${amount} tokens...`)

            // 2️⃣ Convert amount to proper uint64 (or token decimals)
            const mintAmount = ethers.parseUnits(amount || "0", 8)

            // 3️⃣ Execute mint function
            await executeContractFunctionSimple(accountId, TOKEN_ADDRESS, "mintTokenToAddressPublic", {
                to: accountId,
                amount: mintAmount
            })

            setStatus(`✅ Mint successful! ${amount} tokens minted to ${accountId}`)

            // // 2. Get ABI and encode data for the contract call
            // const abi = (MintControllerABI as any).abi ?? MintControllerABI
            // const iface = new ethers.Interface(abi)

            // // mintTokenToAddressPublic(address to, int64 amount)
            // const amountWei = ethers.parseUnits(amount || "0", 8)
            // const data = iface.encodeFunctionData("mintTokenToAddressPublic", [accountId, amountWei])

            // // 3. Create Hedera ContractExecuteTransaction
            // const tx = new ContractExecuteTransaction()
            //     .setContractId(mintControllerAddress)
            //     .setGas(350_000)
            //     .setFunctionParameters(data)

            // // 4. Ask HashConnect to sign and send
            // const receipt = await executeTransaction(accountId, tx)
            // setStatus("✅ Mint successful — tx: " + receipt.transactionId.toString())

            // NOTE: In dev only. Do NOT keep private keys on the client in production.
            // Better: call a backend endpoint that signs the tx with an operator key or uses a delegated signer.
            // const privateKey = process.env.NEXT_PUBLIC_HEDERA_PRIVATE_KEY // dev-only
            // if (!privateKey) {
            //     setStatus("❌ Missing temp private key for dev.")
            //     return
            // }
            // const signer = new ethers.Wallet(privateKey, provider)

            // // Create contract helper and call mint
            // // If your ABI JSON has top-level .abi, use MintControllerABI.abi
            // const abi = (MintControllerABI as any).abi ?? MintControllerABI
            // const contract = new ethers.Contract(mintControllerAddress, abi, signer)

            // const tokenAddress = "0x00000000000000000000000000000000006d23Fe"
            // const tokenAssociateAbi = ["function associate()"]
            // const token = new ethers.Contract(tokenAddress, tokenAssociateAbi, signer)

            // // parseUnits in v6
            // const amountWei = ethers.parseUnits(amount || "0", 8)

            // const assocTx = await token.associate({ gasLimit: 800_000 })
            // await assocTx.wait()

            // console.log(`Minting Token to ${accountId} ...`)

            // const tx = await contract["mintTokenToAddressPublic(address,int64)"](accountId, amountWei, {
            //     gasLimit: 350_000
            // })
            // await tx.wait()
            // console.log("Mint tx hash:", tx.hash)

            // // Example function name: mint(address to, uint256 amount)
            // // Replace with your actual function name/args
            // // const tx = await contract.mint(signer.address, amountWei)
            // // setStatus("⏳ Waiting for confirmation...")
            // // await tx.wait()
            // setStatus("✅ Mint successful — tx: " + tx.hash)
        } catch (err: any) {
            console.error(err)
            setStatus("❌ Mint failed: " + (err?.message ?? String(err)))
        }
    }

    return (
        <div className={styles.container}>
            <h3>Step 2: Mint Tokens</h3>
            <div className={styles.form}>
                <input
                    type="number"
                    placeholder="Enter amount to mint"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <button onClick={handleMint} className="btn btn-primary" disabled={!amount}>
                    Mint
                </button>
            </div>
            {status && <p>{status}</p>}
        </div>
    )
}
