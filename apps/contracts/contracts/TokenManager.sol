// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface HederaTokenService {
    function createFungibleToken(
        address treasury,
        uint64 initialSupply,
        string memory tokenName,
        string memory tokenSymbol,
        uint32 decimals
    ) external returns (address tokenAddress);

    function mintToken(address token, int64 amount, bytes[] calldata metadata) external returns (int64 newTotalSupply);

    function burnToken(address token, int64 amount, bytes[] calldata metadata) external returns (int64 newTotalSupply);
}

contract TokenManager {
    HederaTokenService constant hts = HederaTokenService(0x167);
    address public token;

    constructor(address treasury) {
        // Create a fungible token with an initial supply of 1,000 units
        // Token parameters: name = "MyHederaToken", symbol = "MHT", decimals = 8
        token = hts.createFungibleToken(treasury, 1000, "MyHederaToken", "MHT", 8);
    }

    // Mint additional tokens. Ensure that msg.sender holds the supply key or is authorized.
    function mintMoreTokens(int64 amount) external {
        // Metadata array left empty, but can be used for NFT-like functionality or extra data
        hts.mintToken(token, amount, new bytes[](0));
    }

    // Burn existing tokens. Ensure the caller is authorized via supply key management.
    function burnSomeTokens(int64 amount) external {
        hts.burnToken(token, amount, new bytes[](0));
    }
}