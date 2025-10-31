import { NextResponse } from "next/server"
import { ethers } from "ethers"
import MintControllerABI from "../../../../contract-artifacts/MintController.json"

export async function POST(req: Request) {
    const { to, amount } = await req.json()

    const rpcUrl = process.env.HEDERA_RPC_URL
    const operatorKey = process.env.HEDERA_OPERATOR_PRIVATE_KEY // server-side only
    const contractAddr = process.env.MINT_CONTROLLER

    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const signer = new ethers.Wallet(operatorKey!, provider)

    // You can either use a Contract (simpler) or craft raw tx data with Interface:
    const iface = new ethers.Interface(MintControllerABI.abi ?? MintControllerABI)
    const data = iface.encodeFunctionData("mint", [to, ethers.parseUnits(amount, 18)])

    const txReq = {
        to: contractAddr,
        data
        // optionally set gasLimit / maxFeePerGas etc.
    }

    const tx = await signer.sendTransaction(txReq)
    await tx.wait()
    return NextResponse.json({ txHash: tx.hash })
}
