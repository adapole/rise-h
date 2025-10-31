"use client"

import { useState } from "react"
import styles from "@/styles/Voting.module.css"

export default function VotingPage() {
    const [votes, setVotes] = useState([
        { id: 1, description: "Peg 1 RHT = 1 USD basket", yes: 0, no: 0 },
        { id: 2, description: "Add new bank to settlement network", yes: 0, no: 0 }
    ])

    const handleVote = (voteId: number, type: "yes" | "no") => {
        setVotes((prev) =>
            prev.map((v) => {
                if (v.id === voteId) {
                    return { ...v, [type]: v[type] + 1 }
                }
                return v
            })
        )
    }

    return (
        <div className={styles.container}>
            <h1>Stablecoin - Peg Voting</h1>
            <p>Participate in decentralized interbank settlement votes</p>
            <div className={styles.voteGrid}>
                {votes.map((vote) => (
                    <div key={vote.id} className={styles.voteCard}>
                        <h2>{vote.description}</h2>
                        <div className={styles.voteButtons}>
                            <button onClick={() => handleVote(vote.id, "yes")} className="btn btn-success">
                                ✅ Yes ({vote.yes})
                            </button>
                            <button onClick={() => handleVote(vote.id, "no")} className="btn btn-danger">
                                ❌ No ({vote.no})
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
