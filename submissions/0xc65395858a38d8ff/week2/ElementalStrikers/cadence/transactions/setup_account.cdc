// transactions/setup_account.cdc
// Sets up a user's account to interact with the ElementalStrikers contract.

import ElementalStrikers from "../contracts/ElementalStrikers.cdc"

transaction {

    prepare(signer: auth(Save, Capabilities) &Account) {
        // Check if the PlayerAgent is already stored
        if signer.storage.type(at: ElementalStrikers.PlayerVaultStoragePath) == nil {
            // Create a new PlayerAgent resource and save it to account storage
            let agent <- ElementalStrikers.createPlayerAgent()
            signer.storage.save(<-agent, to: ElementalStrikers.PlayerVaultStoragePath)

            // Unpublish any existing capability at the public path to avoid collision
            // before publishing the new one.
            signer.capabilities.unpublish(ElementalStrikers.GamePlayerPublicPath)
            
            // Publish a capability to the PlayerAgent resource, restricted to the GamePlayer interface
            // This allows others (or the user themselves from scripts/other contexts)
            // to interact with the agent in a controlled way.
            signer.capabilities.publish(
                signer.capabilities.storage.issue<&ElementalStrikers.PlayerAgent>(
                    ElementalStrikers.PlayerVaultStoragePath
                ),
                at: ElementalStrikers.GamePlayerPublicPath
            )
            
            log("PlayerAgent created and stored. Public capability published.")
        } else {
            log("PlayerAgent already exists in storage.")
            // Optionally, ensure the public capability is correctly published if the agent exists
            // This handles cases where the agent might exist but the capability was unpublished or is incorrect.
            if signer.capabilities.get<&{ElementalStrikers.GamePlayer}>(ElementalStrikers.GamePlayerPublicPath) == nil {
                 // Unpublish any existing capability at the public path just in case it's a different type
                signer.capabilities.unpublish(ElementalStrikers.GamePlayerPublicPath)
                // Publish the capability
                signer.capabilities.publish(
                    signer.capabilities.storage.issue<&ElementalStrikers.PlayerAgent>(
                        ElementalStrikers.PlayerVaultStoragePath
                    ),
                    at: ElementalStrikers.GamePlayerPublicPath
                )
                log("PlayerAgent existed, public capability was missing and has been published.")
            } else {
                log("PlayerAgent existed and public capability is correctly published.")
            }
        }
    }

    execute {
        log("Account setup for ElementalStrikers finished.")
    }
} 