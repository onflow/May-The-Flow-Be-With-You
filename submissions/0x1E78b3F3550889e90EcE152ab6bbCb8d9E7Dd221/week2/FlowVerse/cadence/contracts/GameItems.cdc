access(all) contract GameItems {
    // Event emitted when a new item is created
    access(all) event ItemCreated(id: UInt64, name: String, rarity: String)
    
    // Event emitted when an item is transferred
    access(all) event ItemTransferred(id: UInt64, from: Address?, to: Address?)
    
    // Structure to store item data
    access(all) struct Item {
        access(all) let id: UInt64
        access(all) let name: String
        access(all) let rarity: String
        access(all) let createdAt: UFix64
        
        init(id: UInt64, name: String, rarity: String) {
            self.id = id
            self.name = name
            self.rarity = rarity
            self.createdAt = getCurrentBlock().timestamp
        }
    }
    
    // Resource to store a collection of items
    access(all) resource Collection {
        // Dictionary to store items
        access(all) var items: {UInt64: Item}
        
        init() {
            self.items = {}
        }
        
        // Add an item to the collection
        access(all) fun addItem(item: Item) {
            self.items[item.id] = item
        }
        
        // Remove an item from the collection
        access(all) fun removeItem(id: UInt64): Item? {
            let item = self.items[id]
            if item != nil {
                self.items.remove(key: id)
            }
            return item
        }
        
        // Get all items in the collection
        access(all) fun getItems(): [Item] {
            return self.items.values
        }
    }
    
    // Create a new collection
    access(all) fun createCollection(): @Collection {
        return <- create Collection()
    }
    
    // Create a new item
    access(all) fun createItem(name: String, rarity: String): Item {
        let id = self.getNextItemId()
        let item = Item(id: id, name: name, rarity: rarity)
        emit ItemCreated(id: id, name: name, rarity: rarity)
        return item
    }
    
    // Get the next available item ID
    access(all) fun getNextItemId(): UInt64 {
        return self.nextItemId
    }
    
    // Counter for generating unique item IDs
    access(all) var nextItemId: UInt64
    
    init() {
        self.nextItemId = 1
    }
} 