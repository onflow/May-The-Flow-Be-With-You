/// @title Account Setup Transaction
/// @author Rooroo Documenter
/// @notice This transaction prepares a user's account to interact with the LuckyColorMatch ecosystem.
/// It ensures the account has:
/// 1. A FungibleToken vault (specifically for FLOW, at standard paths).
/// 2. A collection resource for LuckyCharmNFTs.
/// 3. A collection resource for AchievementBadgeNFTs.
/// If any of these are missing, the transaction creates and links them.
/// The paths for NFT collections are passed as arguments to allow flexibility, though
/// they typically correspond to the default paths defined in the respective NFT contracts.

import FungibleToken from 0xFUNGIBLETOKENADDRESS /// Standard Fungible Token contract interface.
import NonFungibleToken from 0xNONFUNGIBLETOKENADDRESS /// Standard Non-Fungible Token contract interface.
import LuckyCharmNFT from "../../contracts/LuckyCharmNFT.cdc" /// Contract for Lucky Charm NFTs.
import AchievementBadgeNFT from "../../contracts/AchievementBadgeNFT.cdc" /// Contract for Achievement Badge NFTs.
import MetadataViews from 0xMETADATAVIEWSADDRESS /// Standard for resolving metadata views for NFTs.

/// Transaction definition for setting up a user's account.
/// Signer: The user account to be set up.
///
/// Parameters:
/// - luckyCharmCollectionPublicPath: The `PublicPath` where the LuckyCharmNFT collection's public capabilities will be linked.
/// - luckyCharmCollectionStoragePath: The `StoragePath` where the LuckyCharmNFT collection will be stored.
/// - luckyCharmCollectionProviderPath: The `PrivatePath` for the LuckyCharmNFT collection's provider capability.
/// - achievementBadgeCollectionPublicPath: The `PublicPath` for the AchievementBadgeNFT collection's public capabilities.
/// - achievementBadgeCollectionStoragePath: The `StoragePath` for the AchievementBadgeNFT collection.
/// - achievementBadgeCollectionProviderPath: The `PrivatePath` for the AchievementBadgeNFT collection's provider capability.
transaction(
    luckyCharmCollectionPublicPath: PublicPath,
    luckyCharmCollectionStoragePath: StoragePath,
    luckyCharmCollectionProviderPath: PrivatePath,
    achievementBadgeCollectionPublicPath: PublicPath,
    achievementBadgeCollectionStoragePath: StoragePath,
    achievementBadgeCollectionProviderPath: PrivatePath
) {

    /// Prepare phase: Sets up the necessary vaults and collections in the signer's account.
    ///
    /// Parameters:
    /// - signer: The `AuthAccount` of the user whose account is being set up.
    ///
    /// Panics if:
    /// - Linking capabilities fails for any of the vaults or collections.
    prepare(signer: AuthAccount) {
        // 1. Set up FungibleToken Vault (e.g., for FLOW) if it doesn't already exist.
        // Uses standard paths: /storage/flowTokenVault and /public/flowTokenReceiver.
        if signer.borrow<&FungibleToken.Vault>(from: /storage/flowTokenVault) == nil {
            // Create a new FLOW Vault and save it to account storage.
            signer.save(<-FungibleToken.createEmptyVault(), to: /storage/flowTokenVault)
            log("FLOW Token Vault created.")

            // Create a public capability to the Vault that exposes Receiver and Balance interfaces.
            signer.link<&FungibleToken.Vault{FungibleToken.Receiver, FungibleToken.Balance}>(
                /public/flowTokenReceiver, // Standard public path for receiving FLOW.
                target: /storage/flowTokenVault
            ) ?? panic("Could not create public capability for FLOW Token Vault Receiver.")
            log("Public link to FLOW Token Vault Receiver created.")
        }

        // 2. Set up LuckyCharmNFT Collection if it doesn't already exist.
        if signer.borrow<&LuckyCharmNFT.Collection>(from: luckyCharmCollectionStoragePath) == nil {
            // Create a new empty LuckyCharmNFT collection.
            let charmCollection <- LuckyCharmNFT.createEmptyCollection()
            // Save the collection to the specified storage path.
            signer.save(<-charmCollection, to: luckyCharmCollectionStoragePath)
            log("LuckyCharmNFT Collection created at ".concat(luckyCharmCollectionStoragePath.toString()))

            // Create a public link to the collection, exposing standard NFT collection public interfaces
            // and the MetadataViews resolver collection interface.
            signer.link<&LuckyCharmNFT.Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, MetadataViews.ResolverCollection}>(
                luckyCharmCollectionPublicPath,
                target: luckyCharmCollectionStoragePath
            ) ?? panic("Could not create public link for LuckyCharmNFT Collection.")
            log("Public link to LuckyCharmNFT Collection created at ".concat(luckyCharmCollectionPublicPath.toString()))

            // Create a private link for the Provider capability, allowing the owner to withdraw NFTs.
            // This path should be kept private and used carefully.
            signer.link<&LuckyCharmNFT.Collection{NonFungibleToken.Provider}>(
                luckyCharmCollectionProviderPath,
                target: luckyCharmCollectionStoragePath
            ) ?? panic("Could not create private provider link for LuckyCharmNFT Collection.")
            log("Private provider link for LuckyCharmNFT Collection created at ".concat(luckyCharmCollectionProviderPath.toString()))
        }

        // 3. Set up AchievementBadgeNFT Collection if it doesn't already exist.
        if signer.borrow<&AchievementBadgeNFT.Collection>(from: achievementBadgeCollectionStoragePath) == nil {
            // Create a new empty AchievementBadgeNFT collection.
            let badgeCollection <- AchievementBadgeNFT.createEmptyCollection()
            // Save the collection to the specified storage path.
            signer.save(<-badgeCollection, to: achievementBadgeCollectionStoragePath)
            log("AchievementBadgeNFT Collection created at ".concat(achievementBadgeCollectionStoragePath.toString()))

            // Create a public link to the collection.
            signer.link<&AchievementBadgeNFT.Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, MetadataViews.ResolverCollection}>(
                achievementBadgeCollectionPublicPath,
                target: achievementBadgeCollectionStoragePath
            ) ?? panic("Could not create public link for AchievementBadgeNFT Collection.")
            log("Public link to AchievementBadgeNFT Collection created at ".concat(achievementBadgeCollectionPublicPath.toString()))

            // Create a private link for the Provider capability.
            signer.link<&AchievementBadgeNFT.Collection{NonFungibleToken.Provider}>(
                achievementBadgeCollectionProviderPath,
                target: achievementBadgeCollectionStoragePath
            ) ?? panic("Could not create private provider link for AchievementBadgeNFT Collection.")
            log("Private provider link for AchievementBadgeNFT Collection created at ".concat(achievementBadgeCollectionProviderPath.toString()))
        }

        log("Account setup successfully checked/completed for: ".concat(signer.address.toString()))
    }

    /// Execute phase: This transaction primarily performs setup in the `prepare` phase.
    /// No further actions are needed in the `execute` phase.
    execute {
        log("Account setup transaction execution phase reached for ".concat(signer.address.toString()).concat(". No further actions taken."))
    }
}