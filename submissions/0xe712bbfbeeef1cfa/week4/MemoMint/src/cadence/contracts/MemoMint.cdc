access(all) contract MemoMint {
    // Event for when a memo is created
    access(all) event MemoCreated(id: UInt64, content: String, timestamp: UFix64)
    
    // Structure to store memo data
    access(all) struct Memo {
        access(all) let id: UInt64
        access(all) let content: String
        access(all) let timestamp: UFix64
        
        init(id: UInt64, content: String, timestamp: UFix64) {
            self.id = id
            self.content = content
            self.timestamp = timestamp
        }
    }
    
    // Storage for all memos
    access(self) var memos: {UInt64: Memo}
    access(self) var nextID: UInt64
    
    init() {
        self.memos = {}
        self.nextID = 1
    }
    
    // Create a new memo
    access(all) fun createMemo(content: String): UInt64 {
        let id = self.nextID
        self.nextID = self.nextID + 1
        
        let timestamp = getCurrentBlock().timestamp
        let memo = Memo(id: id, content: content, timestamp: timestamp)
        self.memos[id] = memo
        
        emit MemoCreated(id: id, content: content, timestamp: timestamp)
        
        return id
    }
    
    // Get a memo by ID
    access(all) fun getMemo(id: UInt64): Memo? {
        return self.memos[id]
    }
    
    // Get all memo IDs
    access(all) fun getAllMemoIDs(): [UInt64] {
        return self.memos.keys
    }
    
    // Get total number of memos
    access(all) fun getMemoCount(): UInt64 {
        return UInt64(self.memos.length)
    }
}
