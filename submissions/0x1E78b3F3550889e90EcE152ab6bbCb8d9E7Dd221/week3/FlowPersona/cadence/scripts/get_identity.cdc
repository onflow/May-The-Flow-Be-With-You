import IdentitySystem from "../contracts/IdentitySystem.cdc"

pub fun main(address: Address): IdentitySystem.Identity {
    return IdentitySystem.getIdentity(address: address)
} 