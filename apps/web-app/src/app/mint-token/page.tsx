"use client"

import { useState } from "react"
import MintForm from "./MintForm"
import styles from "@/styles/Home.module.css"
import styleInner from "@/styles/Transfer.module.css"
import useHashConnect from "@/hooks/useHashConnect"
import { signMessages } from "@/services/hashconnect"

export default function MintTokenPage() {
    const [isVerified, setIsVerified] = useState(false)
    const [proofResult, setProofResult] = useState<string | null>(null)
    const { isConnected, accountId } = useHashConnect()

    async function handleProofVerification(file: File) {
        const formData = new FormData()
        formData.append("proof", file)

        try {
            if (!isConnected || !accountId) {
                setProofResult("❗ Please connect your wallet first.")
                return
            }
            await signMessages(accountId, "Approve PoSQL proof for minting")

            const res = await fetch("/api/verify-posql", {
                method: "POST",
                body: formData
            })
            const data = await res.json()

            if (data.verified) {
                setIsVerified(true)
                setProofResult("✅ Proof verified successfully.")
            } else {
                setProofResult("❌ Proof verification failed.")
            }
        } catch (err) {
            console.error(err)
            setProofResult("⚠️ Error verifying proof.")
        }
    }

    return (
        <main className={styles.main}>
            <h1 className={styles.title}>Mint Consortium Stablecoin</h1>
            <p className={styles.description}>
                Provide your <b>Proof-of-SQL (PoSQL)</b> to verify reserves before minting.
            </p>

            {!isVerified ? (
                <div className={styleInner.container}>
                    <h3>Step 1: Upload PoSQL Proof</h3>
                    <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleProofVerification(file)
                        }}
                    />
                    {proofResult && <p>{proofResult}</p>}
                </div>
            ) : (
                <MintForm />
            )}
        </main>
    )
}
