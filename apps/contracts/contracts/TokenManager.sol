// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

// Admin/ownership like the OZ example
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
// Read/transfer via ERC20 facade exposed at the HTS token EVM address
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

// Hedera HTS system contracts (as in your setup)
// Hedera HTS system contracts (v1, NOT v2)
import {HederaTokenService} from "@hashgraph/smart-contracts/contracts/system-contracts/hedera-token-service/HederaTokenService.sol";
import {IHederaTokenService} from "@hashgraph/smart-contracts/contracts/system-contracts/hedera-token-service/IHederaTokenService.sol";
import {IHRC719} from "@hashgraph/smart-contracts/contracts/system-contracts/hedera-token-service/IHRC719.sol";
import {HederaResponseCodes} from "@hashgraph/smart-contracts/contracts/system-contracts/HederaResponseCodes.sol";
import {KeyHelper} from "@hashgraph/smart-contracts/contracts/system-contracts/hedera-token-service/KeyHelper.sol";
import {ExpiryHelper} from "@hashgraph/smart-contracts/contracts/system-contracts/hedera-token-service/ExpiryHelper.sol";


// interface HederaTokenService {
//     function createFungibleToken(
//         address treasury,
//         uint64 initialSupply,
//         string memory tokenName,
//         string memory tokenSymbol,
//         uint32 decimals
//     ) external returns (address tokenAddress);

//     function mintToken(address token, int64 amount, bytes[] calldata metadata) external returns (int64 newTotalSupply);

//     function burnToken(address token, int64 amount, bytes[] calldata metadata) external returns (int64 newTotalSupply);
// }

contract TokenManager is HederaTokenService, ExpiryHelper, KeyHelper {
    // Hedera Token Service precompile address (0x167) converted safely:
    // convert the integer to uint160, then to address, then to the contract type
    // HederaTokenService constant hts = HederaTokenService(address(uint160(0x167)));
    address public tokenAddress;

    // Cosmetic copies for convenience (optional)
    string name = "RiseHederaToken";
    string symbol = "RHT";
    string memo = "memo";
    int64 initialTotalSupply = 1000;
    int64 maxSupply = 20000000000;
    int32 decimals = 8;
    bool freezeDefaultStatus = false;
    bool finiteTotalSupplyType = false;
    // 90 days in seconds
    // int32 constant defaultAutoRenewPeriod = 7776000;

    event CreatedToken(address tokenAddress);
    event MintedToken(int64 newTotalSupply, int64[] serialNumbers);
    event TransferToken(address tokenAddress, address receiver, int64 amount);
    event KycGranted(bool kycGranted);
    event ResponseCode(int responseCode);
    event IsAssociated(bool status);

    error CryptoTransferFailed();
    error CreateFungibleTokenFailed();
    error MintFailed();
    error BurnFailed();
    error MultipleAssociationsFailed();
    error SingleAssociationFailed();
    error MultipleDissociationsFailed();
    error SingleDissociationFailed();
    error ApproveFailed();
    error UpdateTokenExpiryInfoFailed();

    constructor(address treasury) {
        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](6);
        keys[0] = getSingleKey(KeyType.ADMIN, KeyType.PAUSE, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));
        keys[1] = getSingleKey(KeyType.KYC, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));
        keys[2] = getSingleKey(KeyType.FREEZE, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));
        keys[3] = getSingleKey(KeyType.WIPE, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));
        keys[4] = getSingleKey(KeyType.SUPPLY, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));
        keys[5] = getSingleKey(KeyType.FEE, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));

        IHederaTokenService.Expiry memory expiry = IHederaTokenService.Expiry(
            0, treasury, 8000000
        );

        IHederaTokenService.HederaToken memory token = IHederaTokenService.HederaToken(
            name, symbol, treasury, memo, finiteTotalSupplyType, maxSupply, freezeDefaultStatus, keys, expiry
        );
        
        
        (int responseCode, address _tokenAddress) = HederaTokenService.createFungibleToken(token, initialTotalSupply, decimals);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert CreateFungibleTokenFailed();
        }
        tokenAddress = _tokenAddress;

        emit CreatedToken(tokenAddress);
    }


    function mintTokenPublic(address token, int64 amount, bytes[] memory metadata) public
    returns (int responseCode, int64 newTotalSupply, int64[] memory serialNumbers)  {
        (responseCode, newTotalSupply, serialNumbers) = HederaTokenService.mintToken(token, amount, metadata);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert MintFailed();
        }

        emit MintedToken(newTotalSupply, serialNumbers);
    }

    function mintTokenToAddressPublic(address token, address receiver, int64 amount, bytes[] memory metadata) public
    returns (int responseCode, int64 newTotalSupply, int64[] memory serialNumbers)  {
        (responseCode, newTotalSupply, serialNumbers) = mintTokenPublic(token, amount, metadata);

        // (int success) = 
        HederaTokenService.transferToken(token, address(this), receiver, amount);
        // if (success != HederaResponseCodes.SUCCESS) revert CryptoTransferFailed();
        
        emit TransferToken(token, receiver, amount);
    }

    // Mint additional tokens. Ensure that msg.sender holds the supply key or is authorized.
    function mintMoreTokens(int64 amount) external {
        // Metadata array left empty, but can be used for NFT-like functionality or extra data
        HederaTokenService.mintToken(tokenAddress, amount, new bytes[](0));
    }

    function tryDecodeSuccessResponseCode(bool success, bytes memory result) private pure returns (bool) {
        return (success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN) == HederaResponseCodes.SUCCESS;
    }

    function safeUpdateTokenExpiryInfo(address token, IHederaTokenService.Expiry memory expiryInfo) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.updateTokenExpiryInfo.selector, token, expiryInfo));
        if (!tryDecodeSuccessResponseCode(success, result)) revert UpdateTokenExpiryInfoFailed();
    }


    // Burn existing tokens. Ensure the caller is authorized via supply key management.
    function burnSomeTokens(int64 amount) external {
        // HederaTokenService.burnToken(tokenAddress, amount, new bytes[](0));
    }

    /// @dev Associate caller with token contract that implements the IHRC719 interface
    /// @param token The address of the token to associate with.
    /// @return responseCode The response code of the association.
    function associateTokenPublic(address account, address token) public returns (int responseCode) {
        (responseCode) = HederaTokenService.associateToken(account, token);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert SingleAssociationFailed();
        }
    }

    function approvePublic(address token, address spender, uint256 amount) public returns (int responseCode) {
    responseCode = HederaTokenService.approve(token, spender, amount);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ApproveFailed();
        }
    }

    
    // /// @dev Dissociate caller with token contract that implements the IHRC719 interface
    // /// @param token The address of the token to dissociate with.
    // /// @return responseCode The response code of the dissociation.
    function dissociate(address token) public returns (uint256 responseCode) {
        return IHRC719(token).dissociate();
    }

    // /// @dev Calls the `isAssociated` function on the token contract that implements the IHRC719 interface.
    // /// @param token The address of the token to associate with.
    // /// @notice Making isAssociated(address) non-view function to avoid going through mirror-node as isAssociated() is not yet fully supported on mirror node.
    // /// @notice Should be transitioned to view function when the feature is supported by mirror node. Tracking by this issue https://github.com/hashgraph/hedera-smart-contracts/issues/948
    function isAssociated(address token) public {
        bool status = IHRC719(token).isAssociated();
        emit IsAssociated(status);
    }
}