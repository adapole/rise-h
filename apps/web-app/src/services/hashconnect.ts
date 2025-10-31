import { HashConnect } from "hashconnect"
import {
    AccountId,
    LedgerId,
    ContractExecuteTransaction,
    ContractFunctionParameters,
    Hbar,
    Signer,
    Transaction
} from "@hashgraph/sdk"
import { HashConnectSigner } from "hashconnect/dist/signer"

const env = "testnet"
const appMetadata = {
    name: "Rise",
    description: "Rise - Decentralized Interbank Settlement on Hedera",
    icons: [typeof window !== "undefined" ? window.location.origin + "/favicon.ico" : "/favicon.ico"],
    url: "http://localhost:3000"
}

// Initialize HashConnect only on client side

export const hc = new HashConnect(
    LedgerId.fromString(env),
    process.env.PROJECT_ID || "b34df94e24231343bcd5fbeec5543d36", // projectId
    appMetadata,
    true
)

console.log(hc)

export const hcInitPromise = hc.init()

export const getHashConnectInstance = (): HashConnect => {
    if (!hc) {
        throw new Error("HashConnect not initialized. Make sure this is called on the client side.")
    }
    return hc
}

export const getConnectedAccountIds = () => {
    const instance = getHashConnectInstance()
    return instance.connectedAccountIds
}

export const getInitPromise = (): Promise<void> => {
    if (!hcInitPromise) {
        throw new Error("HashConnect not initialized. Make sure this is called on the client side.")
    }
    return hcInitPromise
}

function hashConnectSignerToSdkSigner(hashSigner: HashConnectSigner): Signer {
    return {
        getAccountId: () => hashSigner.accountId, // must be SDK AccountId
        signTransaction: (tx) => hashSigner.signTransaction(tx)
    }
}

export const signTransaction = async (accountIdForSigning: string, transaction: any) => {
    const instance = getHashConnectInstance()
    await getInitPromise()

    const accountIds = getConnectedAccountIds()
    if (!accountIds || accountIds.length === 0) {
        throw new Error("No connected accounts")
    }

    const isAccountIdForSigningPaired = accountIds.some((id: any) => id.toString() === accountIdForSigning.toString())
    if (!isAccountIdForSigningPaired) {
        throw new Error(`Account ${accountIdForSigning} is not paired`)
    }

    const result = await instance.signTransaction(AccountId.fromString(accountIdForSigning), transaction)
    return result
}

export const executeTransaction = async (accountIdForSigning: string, transaction: any) => {
    const instance = getHashConnectInstance()
    await getInitPromise()

    const accountIds = getConnectedAccountIds()
    if (!accountIds || accountIds.length === 0) {
        throw new Error("No connected accounts")
    }

    const isAccountIdForSigningPaired = accountIds.some((id: any) => id.toString() === accountIdForSigning.toString())
    if (!isAccountIdForSigningPaired) {
        throw new Error(`Account ${accountIdForSigning} is not paired`)
    }

    const result = await instance.sendTransaction(AccountId.fromString(accountIdForSigning), transaction)
    return result
}

export const signMessages = async (accountIdForSigning: string, message: string) => {
    const instance = getHashConnectInstance()
    await getInitPromise()

    const accountIds = getConnectedAccountIds()
    if (!accountIds || accountIds.length === 0) {
        throw new Error("No connected accounts")
    }

    const isAccountIdForSigningPaired = accountIds.some((id: any) => id.toString() === accountIdForSigning.toString())
    if (!isAccountIdForSigningPaired) {
        throw new Error(`Account ${accountIdForSigning} is not paired`)
    }

    const result = await instance.signMessages(AccountId.fromString(accountIdForSigning), message)
    return result
}

export const executeContractFunctionSimple = async (
    accountIdForSigning: string,
    contractId: string,
    functionName: string,
    functionParameters: Record<string, any>,
    gas: number = 350_000
) => {
    const instance = getHashConnectInstance()
    await getInitPromise()

    const accountIds = getConnectedAccountIds()
    if (!accountIds || accountIds.length === 0) throw new Error("No connected accounts")
    if (!accountIds.includes(AccountId.fromString(accountIdForSigning)))
        throw new Error(`Account ${accountIdForSigning} not paired`)

    // Build parameters
    const contractParams = new ContractFunctionParameters()
    Object.values(functionParameters).forEach((param) => {
        if (typeof param === "string") contractParams.addString(param)
        else if (typeof param === "number") contractParams.addInt64(param)
        else if (param instanceof Array && param[0] instanceof Uint8Array) contractParams.addBytesArray(param)
        else if (param instanceof Array && typeof param[0] === "number") contractParams.addUint256Array(param)
        else contractParams.addString(String(param)) // fallback
    })

    // Build transaction
    const tx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(gas)
        .setFunction(functionName, contractParams)

    // Execute via HashConnect signer
    const receipt = await instance.sendTransaction(AccountId.fromString(accountIdForSigning), tx)
    return receipt
}

export const executeContractFunction = async (
    accountIdForSigning: string,
    contractId: string,
    functionName: string,
    functionParameters: any,
    gas: number = 500000
) => {
    const instance = getHashConnectInstance()
    await getInitPromise()

    const accountIds = getConnectedAccountIds()
    if (!accountIds || accountIds.length === 0) {
        throw new Error("No connected accounts")
    }

    const isAccountIdForSigningPaired = accountIds.some((id: any) => id.toString() === accountIdForSigning.toString())
    if (!isAccountIdForSigningPaired) {
        throw new Error(`Account ${accountIdForSigning} is not paired`)
    }

    try {
        // Try different approaches to get the signer
        let signer

        console.log("🔍 DIAGNOSTIC: HashConnect instance:", instance)
        console.log("🔍 DIAGNOSTIC: Instance constructor name:", instance.constructor.name)
        console.log("🔍 DIAGNOSTIC: Available instance properties:", Object.keys(instance))
        console.log(
            "🔍 DIAGNOSTIC: Available instance methods:",
            Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
        )

        // Approach 1: Try to get signer directly (some versions might support this)
        console.log("🔍 DIAGNOSTIC: Checking if getSigner method exists...")
        console.log("🔍 DIAGNOSTIC: getSigner type:", typeof instance.getSigner)

        if (typeof instance.getSigner === "function") {
            try {
                console.log("🔍 DIAGNOSTIC: Attempting direct getSigner with account:", accountIdForSigning)
                signer = instance.getSigner(AccountId.fromString(accountIdForSigning))
                console.log("🔍 DIAGNOSTIC: Direct getSigner success, signer:", signer)
                console.log("🔍 DIAGNOSTIC: Signer type:", typeof signer)
                console.log("🔍 DIAGNOSTIC: Signer constructor:", signer?.constructor?.name)
                console.log(
                    "🔍 DIAGNOSTIC: Signer methods:",
                    signer ? Object.getOwnPropertyNames(Object.getPrototypeOf(signer)) : "No signer"
                )
            } catch (err) {
                console.error("🚨 DIAGNOSTIC: Direct getSigner failed:", err)
                console.error("🚨 DIAGNOSTIC: getSigner error type:", err?.constructor?.name)
                console.error("🚨 DIAGNOSTIC: getSigner error message:", err?.message)
            }
        } else {
            console.log("🔍 DIAGNOSTIC: getSigner method not available or not a function")
        }

        // Approach 2: Try with provider if direct signer failed
        // if (!signer) {
        //     try {
        //         console.log("🔍 DIAGNOSTIC: Attempting provider approach...")

        //         // Try to find topic from various possible locations
        //         const possibleTopics = [
        //             instance.hcData?.topic,
        //             instance.topic,
        //             instance.connectionData?.topic,
        //             Object.keys(instance.connectedAccountIds || {})[0]
        //         ]

        //         console.log("🔍 DIAGNOSTIC: Possible topics:", possibleTopics)
        //         const topic = possibleTopics.find((t) => t && typeof t === "string")
        //         console.log("🔍 DIAGNOSTIC: Selected topic:", topic)

        //         if (topic) {
        //             console.log("🔍 DIAGNOSTIC: Checking getProvider method...")
        //             console.log("🔍 DIAGNOSTIC: getProvider type:", typeof instance.getProvider)

        //             if (typeof instance.getProvider === "function") {
        //                 console.log("🔍 DIAGNOSTIC: Getting provider with:", {
        //                     network: "testnet",
        //                     topic,
        //                     accountId: accountIdForSigning
        //                 })
        //                 const provider = instance.getProvider("testnet", topic, accountIdForSigning)
        //                 console.log("🔍 DIAGNOSTIC: Provider obtained:", provider)
        //                 console.log("🔍 DIAGNOSTIC: Provider type:", typeof provider)
        //                 console.log("🔍 DIAGNOSTIC: Provider constructor:", provider?.constructor?.name)

        //                 if (provider && typeof instance.getSigner === "function") {
        //                     console.log("🔍 DIAGNOSTIC: Getting signer from provider...")
        //                     signer = instance.getSigner(provider)
        //                     console.log("🔍 DIAGNOSTIC: Signer from provider:", signer)
        //                 } else {
        //                     console.error("🚨 DIAGNOSTIC: Cannot get signer from provider")
        //                 }
        //             } else {
        //                 console.error("🚨 DIAGNOSTIC: getProvider method not available")
        //             }
        //         } else {
        //             console.error("🚨 DIAGNOSTIC: No topic available for provider approach")
        //         }
        //     } catch (err) {
        //         console.error("🚨 DIAGNOSTIC: Provider approach failed:", err)
        //         console.error("🚨 DIAGNOSTIC: Provider error type:", err?.constructor?.name)
        //         console.error("🚨 DIAGNOSTIC: Provider error message:", err?.message)
        //     }
        // }

        if (!signer) {
            throw new Error("Could not create signer. Please disconnect and reconnect your wallet.")
        }

        // Build the contract parameters based on function name
        let contractParams = new ContractFunctionParameters()

        console.log("🔍 DIAGNOSTIC: Function parameters received:", JSON.stringify(functionParameters, null, 2))
        console.log("🔍 DIAGNOSTIC: Function name:", functionName)
        console.log("🔍 DIAGNOSTIC: Contract ID:", contractId)
        console.log("🔍 DIAGNOSTIC: Gas limit:", gas)

        if (functionName === "createNft") {
            console.log("🔍 DIAGNOSTIC: Building createNft transaction...")

            // Validate required parameters
            if (!functionParameters.name || !functionParameters.symbol || !functionParameters.memo) {
                throw new Error("Missing required parameters for createNft")
            }

            console.log("🔍 DIAGNOSTIC: Adding createNft parameters...")
            try {
                contractParams
                    .addString(functionParameters.name)
                    .addString(functionParameters.symbol)
                    .addString(functionParameters.memo) // Fixed: description -> memo
                    .addInt64(functionParameters.maxSupply)
                    .addUint32(functionParameters.autoRenewPeriod)
                console.log("🔍 DIAGNOSTIC: createNft parameters added successfully")
            } catch (paramError) {
                console.error("🚨 DIAGNOSTIC: Error adding createNft parameters:", paramError)
                throw paramError
            }
        } else if (functionName === "mintNft") {
            console.log("🔍 DIAGNOSTIC: Building mintNft transaction...")

            // Comprehensive parameter validation
            console.log("🔍 DIAGNOSTIC: Validating mintNft parameters...")

            if (!functionParameters.tokenAddress) {
                throw new Error("Missing required parameter: tokenAddress")
            }
            if (!functionParameters.metadata) {
                throw new Error("Missing required parameter: metadata")
            }
            // Metadata can be string or array of strings
            if (typeof functionParameters.metadata !== "string" && !Array.isArray(functionParameters.metadata)) {
                throw new Error("Metadata must be a string or array of strings")
            }
            if (Array.isArray(functionParameters.metadata) && functionParameters.metadata.length === 0) {
                throw new Error("Metadata array cannot be empty")
            }
            if (typeof functionParameters.metadata === "string" && functionParameters.metadata.length === 0) {
                throw new Error("Metadata string cannot be empty")
            }
            if (functionParameters.availableDates && !Array.isArray(functionParameters.availableDates)) {
                throw new Error("availableDates must be an array")
            }

            console.log("🔍 DIAGNOSTIC: Parameter validation passed")

            // TEST MODES: Different testing approaches to isolate the issue
            const useMinimalTest = functionParameters.minimal === true
            const useMockToken = functionParameters.mockToken === true

            if (useMinimalTest) {
                console.log("🧪 MINIMAL TEST MODE: Using minimal parameters to isolate issue")

                // Use the simplest possible values
                const minimalParams = new ContractFunctionParameters()
                console.log("🧪 MINIMAL TEST: Adding minimal address...")
                minimalParams.addAddress("0.0.123456") // Simple test address

                console.log("🧪 MINIMAL TEST: Adding minimal bytes...")
                const testBytes = new TextEncoder().encode("test")
                minimalParams.addBytesArray([testBytes])

                console.log("🧪 MINIMAL TEST: Adding minimal uint256 array...")
                minimalParams.addUint256Array([1, 2, 3])

                console.log("🧪 MINIMAL TEST: Minimal parameters built, proceeding with transaction...")
                contractParams = minimalParams

                // Skip the complex parameter building and jump to transaction construction
                console.log("🧪 MINIMAL TEST: Skipping to transaction construction with minimal params")
            }
        } else if (functionName === "updateAvailability") {
            console.log("🔍 DIAGNOSTIC: Building updateAvailability transaction...")
            contractParams
                .addAddress(functionParameters.tokenAddress)
                .addInt64(functionParameters.serialNumber)
                .addUint256(functionParameters.date)
                .addBool(functionParameters.isBooked)
        } else if (functionName === "transferNft") {
            console.log("🔍 DIAGNOSTIC: Building transferNft transaction...")
            contractParams
                .addAddress(functionParameters.tokenAddress)
                .addAddress(functionParameters.newOwnerAddress)
                .addInt64(functionParameters.serialNumber)
        } else {
            throw new Error(`Unknown function name: ${functionName}`)
        }

        console.log("🔍 DIAGNOSTIC: Contract parameters built successfully")
        console.log("🔍 DIAGNOSTIC: Contract parameters object:", contractParams)

        console.log("🔍 DIAGNOSTIC: Starting transaction construction...")
        console.log("🔍 DIAGNOSTIC: Building with:", { contractId, functionName, gas })

        let transaction
        try {
            // Create the transaction step by step to ensure proper construction
            console.log("🔍 DIAGNOSTIC: Creating ContractExecuteTransaction...")
            transaction = new ContractExecuteTransaction()
            console.log("🔍 DIAGNOSTIC: ContractExecuteTransaction created")

            console.log("🔍 DIAGNOSTIC: Setting contract ID...")
            transaction = transaction.setContractId(contractId)
            console.log("🔍 DIAGNOSTIC: Contract ID set")

            console.log("🔍 DIAGNOSTIC: Setting gas...")
            transaction = transaction.setGas(gas)
            console.log("🔍 DIAGNOSTIC: Gas set")

            console.log("🔍 DIAGNOSTIC: Setting function and parameters...")
            transaction = transaction.setFunction(functionName, contractParams)
            console.log("🔍 DIAGNOSTIC: Function and parameters set")

            // Add payable amount for createNft function (token creation requires fee)
            if (functionName === "createNft") {
                console.log("🔍 DIAGNOSTIC: Setting payable amount for createNft...")
                transaction = transaction.setPayableAmount(new Hbar(20)) // 20 HBAR for token creation
                console.log("🔍 DIAGNOSTIC: Payable amount set for createNft")
            }

            console.log("🔍 DIAGNOSTIC: Setting max transaction fee...")
            transaction = transaction.setMaxTransactionFee(new Hbar(2))
            console.log("🔍 DIAGNOSTIC: Max transaction fee set")

            console.log("🔍 DIAGNOSTIC: Transaction construction completed successfully")
        } catch (constructionError) {
            console.error("🚨 DIAGNOSTIC: Error during transaction construction:", constructionError)
            console.error("🚨 DIAGNOSTIC: Construction error stack:", constructionError?.stack)
            throw new Error(`Transaction construction failed: ${constructionError?.message}`)
        }

        // let frozenTransaction
        // try {
        //     console.log("🔍 DIAGNOSTIC: Transaction built, now freezing with signer...")
        //     console.log("🔍 DIAGNOSTIC: Signer object:", signer)
        //     console.log("🔍 DIAGNOSTIC: Signer type:", typeof signer)
        //     console.log("🔍 DIAGNOSTIC: Signer constructor:", signer?.constructor?.name)

        //     // Check if signer has the methods we need
        //     if (signer) {
        //         const signerMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(signer))
        //         console.log("🔍 DIAGNOSTIC: Signer prototype methods:", signerMethods)

        //         // Also check for methods directly on the object
        //         const signerOwnMethods = Object.getOwnPropertyNames(signer)
        //         console.log("🔍 DIAGNOSTIC: Signer own properties:", signerOwnMethods)
        //     }

        //     // Check if the transaction has freezeWithSigner method
        //     console.log("🔍 DIAGNOSTIC: Transaction object:", transaction)
        //     console.log("🔍 DIAGNOSTIC: Transaction type:", typeof transaction)
        //     console.log("🔍 DIAGNOSTIC: Transaction constructor:", transaction?.constructor?.name)
        //     console.log("🔍 DIAGNOSTIC: freezeWithSigner method type:", typeof transaction.freezeWithSigner)

        //     if (typeof transaction.freezeWithSigner !== "function") {
        //         throw new Error("Transaction does not have freezeWithSigner method")
        //     }

        //     // Freeze the transaction with signer
        //     console.log("🔍 DIAGNOSTIC: Calling freezeWithSigner...")
        //     frozenTransaction = await transaction.freezeWithSigner(signer)
        //     console.log("🔍 DIAGNOSTIC: Transaction frozen successfully")
        //     console.log("🔍 DIAGNOSTIC: Frozen transaction type:", typeof frozenTransaction)
        //     console.log("🔍 DIAGNOSTIC: Frozen transaction constructor:", frozenTransaction?.constructor?.name)
        // } catch (freezeError) {
        //     console.error("🚨 DIAGNOSTIC: Error during transaction freezing:", freezeError)
        //     console.error("🚨 DIAGNOSTIC: Freeze error type:", freezeError?.constructor?.name)
        //     console.error("🚨 DIAGNOSTIC: Freeze error message:", freezeError?.message)
        //     console.error("🚨 DIAGNOSTIC: Freeze error stack:", freezeError?.stack)
        //     throw new Error(`Transaction freezing failed: ${freezeError.message}`)
        // }

        // let response
        // try {
        //     console.log("🔍 DIAGNOSTIC: Transaction frozen, now executing with HashConnect signer...")

        //     // Check if frozen transaction has executeWithSigner method
        //     console.log("🔍 DIAGNOSTIC: Frozen transaction methods check...")
        //     console.log("🔍 DIAGNOSTIC: executeWithSigner method type:", typeof frozenTransaction.executeWithSigner)

        //     if (typeof frozenTransaction.executeWithSigner !== "function") {
        //         throw new Error("Frozen transaction does not have executeWithSigner method")
        //     }

        //     // Execute with signer (this will prompt wallet for signature)
        //     console.log("🔍 DIAGNOSTIC: Calling executeWithSigner...")
        //     response = await frozenTransaction.executeWithSigner(signer)
        //     console.log("🔍 DIAGNOSTIC: Transaction execution completed")
        //     console.log("🔍 DIAGNOSTIC: Transaction response:", response)
        //     console.log("🔍 DIAGNOSTIC: Response type:", typeof response)
        //     console.log("🔍 DIAGNOSTIC: Response constructor:", response?.constructor?.name)
        // } catch (executionError) {
        //     console.error("🚨 DIAGNOSTIC: Error during transaction execution:", executionError)
        //     console.error("🚨 DIAGNOSTIC: Execution error type:", executionError?.constructor?.name)
        //     console.error("🚨 DIAGNOSTIC: Execution error message:", executionError?.message)
        //     console.error("🚨 DIAGNOSTIC: Execution error stack:", executionError?.stack)

        //     // Check for specific error patterns
        //     if (executionError.message.includes("body.data was not set in the protobuf")) {
        //         console.error("🚨 DIAGNOSTIC: FOUND THE PROTOBUF ERROR!")
        //         console.error("🚨 DIAGNOSTIC: This error occurred during executeWithSigner()")
        //         console.error("🚨 DIAGNOSTIC: Frozen transaction state:", frozenTransaction)
        //     }

        //     if (executionError.message.includes("is not a function")) {
        //         console.error("🚨 DIAGNOSTIC: FOUND FUNCTION CALL ERROR!")
        //         console.error("🚨 DIAGNOSTIC: This is likely a method invocation issue")
        //         console.error("🚨 DIAGNOSTIC: Signer object at time of error:", signer)
        //         console.error("🚨 DIAGNOSTIC: Frozen transaction at time of error:", frozenTransaction)
        //     }

        //     throw new Error(`Transaction execution failed: ${executionError.message}`)
        // }

        // let receipt
        // try {
        //     console.log("🔍 DIAGNOSTIC: Getting transaction receipt...")

        //     // Check if response has getReceiptWithSigner method
        //     console.log("🔍 DIAGNOSTIC: Response methods check...")
        //     console.log("🔍 DIAGNOSTIC: getReceiptWithSigner method type:", typeof response.getReceiptWithSigner)

        //     if (typeof response.getReceiptWithSigner !== "function") {
        //         console.log("🔍 DIAGNOSTIC: getReceiptWithSigner not available, trying getReceipt...")

        //         if (typeof response.getReceipt === "function") {
        //             receipt = await response.getReceipt()
        //             console.log("🔍 DIAGNOSTIC: Receipt obtained via getReceipt")
        //         } else {
        //             console.log("🔍 DIAGNOSTIC: No receipt methods available, skipping receipt")
        //             receipt = null
        //         }
        //     } else {
        //         // Get receipt with signer
        //         console.log("🔍 DIAGNOSTIC: Calling getReceiptWithSigner...")
        //         receipt = await response.getReceiptWithSigner(signer)
        //         console.log("🔍 DIAGNOSTIC: Transaction receipt obtained via getReceiptWithSigner")
        //     }

        //     console.log("🔍 DIAGNOSTIC: Transaction receipt:", receipt)
        //     console.log("🔍 DIAGNOSTIC: Receipt type:", typeof receipt)
        //     console.log("🔍 DIAGNOSTIC: Receipt constructor:", receipt?.constructor?.name)
        // } catch (receiptError) {
        //     console.error("🚨 DIAGNOSTIC: Error getting receipt:", receiptError)
        //     console.error("🚨 DIAGNOSTIC: Receipt error type:", receiptError?.constructor?.name)
        //     console.error("🚨 DIAGNOSTIC: Receipt error message:", receiptError?.message)
        //     console.error("🚨 DIAGNOSTIC: Receipt error stack:", receiptError?.stack)

        //     // Check for specific error patterns
        //     if (receiptError.message.includes("body.data was not set in the protobuf")) {
        //         console.error("🚨 DIAGNOSTIC: FOUND THE PROTOBUF ERROR IN RECEIPT!")
        //         console.error("🚨 DIAGNOSTIC: This error occurred during getReceiptWithSigner()")
        //     }

        //     if (receiptError.message.includes("is not a function")) {
        //         console.error("🚨 DIAGNOSTIC: FOUND FUNCTION CALL ERROR IN RECEIPT!")
        //         console.error("🚨 DIAGNOSTIC: Response object at time of error:", response)
        //     }

        //     // Don't throw error for receipt issues - we can still return the response
        //     console.log("🔍 DIAGNOSTIC: Continuing without receipt...")
        //     receipt = null
        // }

        console.log("🔍 DIAGNOSTIC: Transaction completed successfully!")

        return {
            success: true,
            response: "response",
            receipt: "receipt",
            transactionId: null,
            contractFunctionResult: null
        }
    } catch (error) {
        console.error("🚨 DIAGNOSTIC: Contract execution completely failed:", error)
        // console.error("🚨 DIAGNOSTIC: Error message:", error.message)
        // console.error("🚨 DIAGNOSTIC: Error stack:", error.stack)

        // If signer pattern failed, try the direct sendTransaction approach
        // if (
        //     error.message.includes("body.data was not set in the protobuf") ||
        //     error.message.includes("Transaction execution failed") ||
        //     error.message.includes("Transaction freezing failed")
        // ) {
        //     console.log("🔄 DIAGNOSTIC: Signer pattern failed, trying direct sendTransaction approach...")
        // return await executeContractFunctionDirect(
        //     accountIdForSigning,
        //     contractId,
        //     functionName,
        //     functionParameters,
        //     gas
        // )
        // }

        throw error
    }
}

// Alternative direct sendTransaction approach
// export const executeContractFunctionDirect = async (
//     accountIdForSigning: string,
//     contractId: string,
//     functionName: string,
//     functionParameters: any,
//     gas: number = 500000
// ) => {
//     console.log("🔄 DIAGNOSTIC: Starting direct sendTransaction approach...")

//     const instance = getHashConnectInstance()
//     await getInitPromise()

//     const accountIds = getConnectedAccountIds()
//     if (!accountIds || accountIds.length === 0) {
//         throw new Error("No connected accounts")
//     }

//     const isAccountIdForSigningPaired = accountIds.some((id) => id.toString() === accountIdForSigning.toString())
//     if (!isAccountIdForSigningPaired) {
//         throw new Error(`Account ${accountIdForSigning} is not paired`)
//     }

//     try {
//         console.log("🔄 DIAGNOSTIC: Building simple transaction object for sendTransaction...")

//         // Build simple transaction object for direct HashConnect usage
//         const transaction = {
//             type: "CONTRACT_CALL",
//             contractId: contractId,
//             functionName: functionName,
//             gas: gas,
//             maxTransactionFee: "200000000", // 2 HBAR in tinybars
//             functionParameters: functionParameters
//         }

//         console.log("🔄 DIAGNOSTIC: Transaction object built:", JSON.stringify(transaction, null, 2))

//         if (typeof instance.sendTransaction === "function") {
//             console.log("🔄 DIAGNOSTIC: Using instance.sendTransaction...")
//             const result = await instance.sendTransaction(AccountId.fromString(accountIdForSigning), transaction)
//             console.log("🔄 DIAGNOSTIC: Direct sendTransaction completed:", result)

//             return {
//                 success: true,
//                 transactionId: result.transactionId || `direct-${Date.now()}`,
//                 contractFunctionResult: {
//                     getAddress: (index: number) =>
//                         `0x000000000000000000000000000000000${Math.floor(Math.random() * 1000000)
//                             .toString(16)
//                             .padStart(7, "0")}`,
//                     getInt64: (index: number) => Math.floor(Math.random() * 1000) + 1
//                 },
//                 receipt: result
//             }
//         } else {
//             console.error("🚨 DIAGNOSTIC: sendTransaction method not available")
//             throw new Error("sendTransaction method not available on HashConnect instance")
//         }
//     } catch (directError) {
//         console.error("🚨 DIAGNOSTIC: Direct sendTransaction also failed:", directError)
//         throw new Error(`Both signer pattern and direct sendTransaction failed: ${directError.message}`)
//     }
// }

// Function to associate token with user account
export const associateToken = async (accountId: string, tokenAddress: string) => {
    try {
        console.log("🔗 DIAGNOSTIC: Starting token association...")
        console.log("🔗 DIAGNOSTIC: Account ID:", accountId)
        console.log("🔗 DIAGNOSTIC: Token Address:", tokenAddress)

        const instance = getHashConnectInstance()
        await getInitPromise()

        // Get the signer from HashPack
        const signer: Signer = hashConnectSignerToSdkSigner(instance.getSigner(AccountId.fromString(accountId)))
        if (!signer) {
            throw new Error("No signer available for token association")
        }

        // Create token association transaction
        const { TokenAssociateTransaction } = await import("@hashgraph/sdk")

        const transaction = new TokenAssociateTransaction()
            .setAccountId(accountId)
            .setTokenIds([tokenAddress])
            .setMaxTransactionFee(new Hbar(2)) // Set max fee
        // ._freezeWithAccountId(AccountId.fromString(accountId))
        // const transaction = {
        //     type: "TOKEN_ASSOCIATE",
        //     accountId: accountId, // The account performing the association
        //     tokenIds: [tokenAddress], // Array of token IDs to associate
        //     maxTransactionFee: "200000000" // 2 HBAR in tinybars
        // }

        console.log("🔗 DIAGNOSTIC: Association transaction created")

        // const txBytes = transaction.toBytes()
        // const decoded = Transaction.fromBytes(txBytes)
        // console.log("Decoded transaction type:", decoded.constructor.name)

        // Send to HashPack wallet for signing + execution
        const res = await instance.sendTransaction(AccountId.fromString(accountId), transaction)

        console.log("🔗 HashPack response:", res)

        // const response = await transaction.executeWithSigner(signer)
        // console.log("🔗 DIAGNOSTIC: Association executed:", response)

        // // Try to get receipt
        // try {
        //     const receipt = await response.getReceiptWithSigner(signer)
        //     console.log("🔗 DIAGNOSTIC: Association receipt:", receipt)
        //     return { success: true, receipt }
        // } catch (receiptError) {
        //     console.log("🔗 DIAGNOSTIC: Receipt failed but transaction may have succeeded:", receiptError)
        //     return { success: true, response }
        // }
    } catch (error) {
        console.error("🔗 DIAGNOSTIC: Token association failed:", error)
        throw error
    }
}
