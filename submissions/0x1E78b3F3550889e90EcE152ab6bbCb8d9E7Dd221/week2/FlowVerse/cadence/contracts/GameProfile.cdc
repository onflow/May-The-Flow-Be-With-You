import GameItems from "./GameItems.cdc"

access(all) contract GameProfile {
    // Event emitted when a new profile is created
    access(all) event ProfileCreated(address: Address)
    
    // Structure to store profile data
    access(all) struct Profile {
        access(all) let address: Address
        access(all) let createdAt: UFix64
        access(all) var username: String
        
        init(address: Address, username: String) {
            self.address = address
            self.username = username
            self.createdAt = getCurrentBlock().timestamp
        }
        
        access(all) fun setUsername(newUsername: String) {
            self.username = newUsername
        }
    }
    
    // Resource to store a player's profile and collection
    access(all) resource PlayerProfile {
        access(all) var profile: Profile
        access(all) var collection: @GameItems.Collection
        
        init(address: Address, username: String) {
            self.profile = Profile(address: address, username: username)
            self.collection <- GameItems.createCollection()
        }
        
        // Update username
        access(all) fun updateUsername(newUsername: String) {
            self.profile.setUsername(newUsername: newUsername)
        }
        
        // Get all items in the collection
        access(all) fun getItems(): [GameItems.Item] {
            return self.collection.getItems()
        }
        
        // Add an item to the collection
        access(all) fun addItem(item: GameItems.Item) {
            self.collection.addItem(item: item)
        }
        
        // Remove an item from the collection
        access(all) fun removeItem(id: UInt64): GameItems.Item? {
            return self.collection.removeItem(id: id)
        }
    }
    
    // Dictionary to store all player profiles
    access(all) var profiles: @{Address: PlayerProfile}
    
    init() {
        self.profiles <- {}
    }
    
    // Create a new player profile
    access(all) fun createProfile(username: String) {
        let address = self.account.address
        let profile <- create PlayerProfile(address: address, username: username)
        self.profiles[address] <-! profile
        emit ProfileCreated(address: address)
    }
    
    // Get a player's profile
    access(all) fun getProfile(address: Address): &PlayerProfile? {
        if self.profiles[address] == nil {
            return nil
        }
        return &self.profiles[address] as &PlayerProfile?
    }
    
    // Check if a player has a profile
    access(all) fun hasProfile(address: Address): Bool {
        return self.profiles[address] != nil
    }
} 