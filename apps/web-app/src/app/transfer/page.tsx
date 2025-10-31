"use client"

import { useState } from "react"
import styles from "@/styles/Transfer.module.css"

export default function TransferPage() {
    const [recipient, setRecipient] = useState("")
    const [amount, setAmount] = useState(0)
    const [status, setStatus] = useState("")

    const handleTransfer = () => {
        setStatus(`Transferring ${amount} tokens to ${recipient}...`)
        // Later: integrate Hedera transfer function
    }

    return (
        <div className={styles.container}>
            <h1>Transfer Tokens to Bank</h1>
            <p>Perform on-chain transfers to other banks</p>
            <div className={styles.form}>
                <input
                    type="text"
                    placeholder="Recipient Bank ID"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                />
                <button onClick={handleTransfer} className="btn btn-primary">
                    Transfer
                </button>
            </div>
            {status && <p>{status}</p>}
        </div>
    )
}
