// SPDX-License-Identifier: BSL-1.0
pragma solidity >=0.8.23 <0.9.0;

import './CicadaVote.sol';
import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";


/// @title SemaphoreCicada
/// @notice Implements a hybrid system using Semaphore V4 + homomorphic time-lock puzzles.
/// It provides temporary tally privacy while preserving indefinite individual ballot anonymity.
contract SemaphoreCicada is CicadaVote {

    uint256 public votingEndTime;          // timestamp when voting closes
    uint256 public timelockDelaySeconds;   // required delay after votingEndTime before finalization

    bool public finalized;
    uint256 public totalYes;
    uint256 public totalNo;

    struct EncryptedBallot {
        bytes ciphertext; // time-lock encrypted ballot data
        uint256 nullifier; // to prevent replay/double vote
    }

    mapping(uint256 => bool) public nullifierUsed;
    EncryptedBallot[] public ballots;

    event BallotSubmitted(uint256 indexed nullifier, bytes ciphertext);
    event TallyFinalized(uint256 yes, uint256 no);
    event VotingExecuted();

    error DuplicateNullifier(uint256 nullifier);
    error UnsupportedMerkleTreeDepth(uint256 depth);
    error InvalidGroupId(uint256 groupId);
    error ZeroSemaphoreAddress();
    error VotingNotFinalized();

    ISemaphore public semaphore;
    uint256 public immutable groupId;

    /// @param _semaphore address of deployed Semaphore v4 contract
    /// @param _groupId id of the Semaphore group used for eligibility
    /// @param _votingDurationSeconds length of the voting window (seconds)
    /// @param _timelockDelaySeconds delay after votingEndTime before finalizeTally can be called
    constructor(
        address _semaphore,
        uint256 _groupId,
        uint256 _votingDurationSeconds,
        uint256 _timelockDelaySeconds
    ) {
         if (_semaphore == address(0)) {
            revert ZeroSemaphoreAddress();
        }
        if (groupId == 0) {
            revert InvalidGroupId(groupId);
        }

        semaphore = ISemaphore(_semaphore);
        groupId = _groupId;
        votingEndTime = block.timestamp + _votingDurationSeconds;
        timelockDelaySeconds = _timelockDelaySeconds;
    }

    /// @notice Submit a vote anonymously, proving membership via Semaphore
    /// @param proof - Semaphore proof per ISemaphore.SemaphoreProof
    /// @param encryptedBallot - ciphertext of the vote, e.g. encrypted YES/NO under time-lock params
    function submitVote(
        ISemaphore.SemaphoreProof calldata proof,
        bytes calldata encryptedBallot
    ) external {
        if (block.timestamp >= votingEndTime) {
            revert("Voting period has ended");
        }

        // Verify zero-knowledge proof
        bool isValid = semaphore.verifyProof(groupId, proof);
        if (!isValid) {
            revert ISemaphore.Semaphore__InvalidProof();
        }

        // Prevent double-voting using nullifier (local cache)
        uint256 n = proof.nullifier;
        if (nullifierUsed[n]) revert ISemaphore.Semaphore__YouAreUsingTheSameNullifierTwice();
        nullifierUsed[n] = true;

        ballots.push(EncryptedBallot({
            ciphertext: encryptedBallot,
            nullifier: proof.nullifier
        }));

        emit BallotSubmitted(proof.nullifier, encryptedBallot);
    }

    /// @notice Whether finalizeTally may be called (voting ended and timelock elapsed)
    function canFinalize() public view returns (bool) {
        return (block.timestamp >= votingEndTime + timelockDelaySeconds) && !finalized;
    }

    /// @notice Finalizes the vote tally once the timelock T has passed
    /// The decryption & tallying logic happens off-chain and is then posted here.
    function finalizeTally(uint256 yes, uint256 no) external {
        if (!canFinalize()) {
            revert VotingNotFinalized();
        }
        if (block.timestamp < votingEndTime + timelockDelaySeconds) {
            revert("Timelock delay has not elapsed");
        }
        if (finalized) {
            revert("Tally already finalized");
        }

        finalized = true;
        totalYes = yes;
        totalNo = no;

        emit TallyFinalized(yes, no);
    }

    /// @notice Example: external contract hook (could trigger token peg update)
    function executeResult() external {
        require(finalized, "Not finalized");
        // TODO: integrate token/peg update logic here
        emit VotingExecuted();
    }

    /// @notice Helper to fetch ballots count
    function ballotsCount() external view returns (uint256) {
        return ballots.length;
    }

/**

    /// @notice Create a vote and record Semaphore group metadata for voter eligibility
    /// @param pp PublicParameters for the Cicada vote
    /// @param description Human readable description
    /// @param startTime vote start timestamp (0 => now)
    /// @param votingPeriod duration in seconds
    /// @param votersMerkleRoot the merkle root used by the off-chain group (for convenience)
    /// @param merkleTreeDepth depth of the merkle tree (must be supported by Semaphore)
    /// @param groupId the Semaphore group id that contains identity commitments of eligible voters
    function createVote(
        PublicParameters memory pp,
        string memory description,
        uint64 startTime,
        uint64 votingPeriod,
        uint256 votersMerkleRoot,
        uint256 merkleTreeDepth,
        uint256 groupId
    )
        external
    {
        if (merkleTreeDepth < 16 || merkleTreeDepth > 32) {
            revert UnsupportedMerkleTreeDepth(merkleTreeDepth);
        }
        // Basic sanity check for groupId (0 is unlikely valid)
        if (groupId == 0) {
            revert InvalidGroupId(groupId);
        }

        voterData[nextVoteId].merkleRoot = votersMerkleRoot;
        voterData[nextVoteId].merkleTreeDepth = merkleTreeDepth;
        voterData[nextVoteId].groupId = groupId;

        _createVote(pp, description, startTime, votingPeriod);
    }

    /// @notice Cast a ballot using Semaphore v4 proof validation.
    /// @param voteId id of the cicada vote
    /// @param pp public parameters for the cicada vote
    /// @param ballot time-lock puzzle encoding the ballot
    /// @param PoV proof of ballot validity for Cicada internals
    /// @param nullifierHash semaphore nullifier hash to prevent double voting
    /// @param semaphoreProofData the SNARK proof points (uint256[8]) produced by Semaphore prover
    function castBallot(
        uint256 voteId,
        PublicParameters memory pp,
        Puzzle memory ballot,
        ProofOfValidity memory PoV,
        uint256 nullifierHash,
        uint256[8] calldata semaphoreProofData
    )
        external
    {
        if (voterData[voteId].nullifiers[nullifierHash]) {
            revert DuplicateNullifier(nullifierHash);
        }

        ISemaphore.SemaphoreProof memory proof = ISemaphore.SemaphoreProof({
            merkleTreeDepth: voterData[voteId].merkleTreeDepth,
            merkleTreeRoot: voterData[voteId].merkleRoot,
            nullifier: nullifierHash,
            signal: uint256(keccak256(abi.encode(ballot))), // keep your signal encoding
            groupId: voterData[voteId].groupId,
            points: semaphoreProofData
        });

        // Validate the proof against Semaphore v4 contract.
        // This will revert if the proof is invalid or nullifier already used on Semaphore side.
        semaphore.validateProof(voterData[voteId].groupId, proof);

        // Mark nullifier locally to prevent double-submission within this contract's state.
        voterData[voteId].nullifiers[nullifierHash] = true;

        _castBallot(voteId, pp, ballot, PoV);
    }

    function finalizeVote(
        uint256 voteId,
        PublicParameters memory pp,
        uint64 tallyPlaintext,
        uint256[4] memory w,
        ProofOfExponentiation memory PoE
    )
        external
    {
        _finalizeVote(voteId, pp, tallyPlaintext, w, PoE);
    }
**/
}