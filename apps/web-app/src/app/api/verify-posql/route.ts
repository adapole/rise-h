import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const formData = await req.formData()
    const proofFile = formData.get("proof") as File

    if (!proofFile) {
        return NextResponse.json({ verified: false, error: "No proof file provided." })
    }

    const proofText = await proofFile.text()

    try {
        const proof = JSON.parse(proofText)

        // ✅ Mock verification logic:
        if (proof?.query?.includes("SELECT * FROM reserves") && proof?.zkProof) {
            return NextResponse.json({ verified: true })
        } else {
            return NextResponse.json({ verified: false })
        }
    } catch (err) {
        console.error(err)
        return NextResponse.json({ verified: false, error: "Invalid proof file." })
    }
}
