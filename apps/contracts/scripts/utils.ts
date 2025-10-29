import { SupportedNetwork, isSupportedNetwork } from "@semaphore-protocol/utils"
import { readFileSync, writeFileSync } from "fs"

export type NetworkDeployedContracts = {
    name: "Semaphore" | "SemaphoreVerifier" | "PoseidonT3"
    address: string
    startBlock: number
}[]

export type DeployedContracts = {
    network: string
    contracts: NetworkDeployedContracts
}[]

export async function deploy(ethers: any, contractName: string, network?: string, args: any[] = []): Promise<string> {
    const ContractFactory = await ethers.getContractFactory(contractName)

    // If the network is not a local one and it's supported, it deploys contracts deterministically.
    if (network && isSupportedNetwork(network)) {
        // Proxy address got from https://github.com/Arachnid/deterministic-deployment-proxy.
        const proxyAddress = "0x4e59b44847b379578588920ca78fbf26c0b4956c"
        // For the moment, salt will always be zero.
        const salt = `0x${"0".repeat(64)}`

        const { bytecode, interface: abi } = ContractFactory
        const [signer] = await ethers.getSigners()

        // If the contract has a constructor with arguments, they should be added to the bytecode/initcode.
        const encodedArgs = args ? abi.encodeDeploy(args).slice(2) : ""

        await signer.sendTransaction({
            to: proxyAddress,
            data: `${salt}${bytecode.replace("0x", "")}${encodedArgs}`
        })

        // Contract addresses can be calculated deterministically.
        return ethers.getCreate2Address(proxyAddress, salt, ethers.keccak256(bytecode + encodedArgs))
    }

    const contract = await ContractFactory.deploy(...args)

    await contract.waitForDeployment()

    return contract.getAddress()
}
const deployedContractsPath = "../utils/src/networks/deployed-contracts.json"
export function getDeployedContracts(): DeployedContracts {
    return JSON.parse(readFileSync(deployedContractsPath, "utf8"))
}

export function getDeployedContractsByNetwork(network: string): NetworkDeployedContracts {
    const deployedContracts = getDeployedContracts()
    const networkDeployedContracts = deployedContracts.find((n) => n.network === network)

    if (!networkDeployedContracts) {
        throw Error(`Network '${network}' is not supported`)
    }

    return networkDeployedContracts.contracts
}

export function getDeployedContractAddress(network: string, contractName: string): string {
    const contracts = getDeployedContractsByNetwork(network)
    const semaphoreAddress = contracts.find((contract) => contract.name === contractName)

    if (!semaphoreAddress) {
        throw Error(`Contract with name '${contractName}' does not exist`)
    }

    return semaphoreAddress.address
}
