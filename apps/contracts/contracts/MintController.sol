// SPDX-License-Identifier: BSL-1.0
pragma solidity ^0.8.20;

interface IHederaTokenService {
    function mintToken(address token, uint64 amount, bytes[] calldata metadata)
        external returns (int64 responseCode, uint64 newTotalSupply, int64[] memory serialNumbers);
}

interface IPoSQLVerifier {
    function verifyQuery(bytes calldata query, bytes calldata proof) external returns (bool);
}

contract MintController {
    address public token;
    address public verifier;
    uint256 public lastPegUpdate;
    uint256 public timelock = 1 days;

    mapping(bytes32 => bool) public usedProofs;

    constructor(address _token, address _verifier) {
        token = _token;
        verifier = _verifier;
    }

    function mintWithProof(bytes calldata query, bytes calldata proof, uint64 amount) external {
        bytes32 proofHash = keccak256(proof);
        require(!usedProofs[proofHash], "Proof reused");

        bool valid = IPoSQLVerifier(verifier).verifyQuery(query, proof);
        require(valid, "Invalid PoSQL proof");
        require(block.timestamp > lastPegUpdate + timelock, "Peg timelock active");

        IHederaTokenService(token).mintToken(token, amount, new bytes[](0) );
        usedProofs[proofHash] = true;
    }

    function updatePeg(uint256 newPeg) external {
        lastPegUpdate = block.timestamp;
        // TODO: voting contract call here
    }
}
