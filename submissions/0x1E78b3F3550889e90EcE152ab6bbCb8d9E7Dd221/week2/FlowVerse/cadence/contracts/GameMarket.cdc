import GameItems from "./GameItems.cdc"
import GameProfile from "./GameProfile.cdc"

access(all) contract GameMarket {
    // Event emitted when a trade is created
    access(all) event TradeCreated(tradeId: UInt64, seller: Address, itemId: UInt64)
    
    // Event emitted when a trade is completed
    access(all) event TradeCompleted(tradeId: UInt64, seller: Address, buyer: Address, itemId: UInt64)
    
    // Event emitted when a trade is cancelled
    access(all) event TradeCancelled(tradeId: UInt64, seller: Address, itemId: UInt64)
    
    // Structure to store trade data
    access(all) struct Trade {
        access(all) let id: UInt64
        access(all) let seller: Address
        access(all) let itemId: UInt64
        access(all) let createdAt: UFix64
        
        init(id: UInt64, seller: Address, itemId: UInt64) {
            self.id = id
            self.seller = seller
            self.itemId = itemId
            self.createdAt = getCurrentBlock().timestamp
        }
    }
    
    // Dictionary to store active trades
    access(all) var trades: {UInt64: Trade}
    
    // Counter for generating unique trade IDs
    access(all) var nextTradeId: UInt64
    
    init() {
        self.trades = {}
        self.nextTradeId = 1
    }
    
    // Create a new trade
    access(all) fun createTrade(itemId: UInt64) {
        let seller = self.account.address
        let tradeId = self.nextTradeId
        self.nextTradeId = tradeId + 1
        
        let trade = Trade(id: tradeId, seller: seller, itemId: itemId)
        self.trades[tradeId] = trade
        
        emit TradeCreated(tradeId: tradeId, seller: seller, itemId: itemId)
    }
    
    // Complete a trade
    access(all) fun completeTrade(tradeId: UInt64) {
        let trade = self.trades[tradeId] ?? panic("Trade not found")
        let seller = trade.seller
        let buyer = self.account.address
        let itemId = trade.itemId

        // Get seller's profile
        let sellerProfileOpt = GameProfile.getProfile(address: seller)
        if sellerProfileOpt == nil {
            panic("Seller profile not found")
        }
        let sellerProfile = sellerProfileOpt!

        // Get buyer's profile
        let buyerProfileOpt = GameProfile.getProfile(address: buyer)
        if buyerProfileOpt == nil {
            panic("Buyer profile not found")
        }
        let buyerProfile = buyerProfileOpt!

        // Remove item from seller's collection
        let item = sellerProfile.removeItem(id: itemId) ?? panic("Item not found in seller's collection")

        // Add item to buyer's collection
        buyerProfile.addItem(item: item)

        // Remove trade from active trades
        self.trades.remove(key: tradeId)

        emit TradeCompleted(tradeId: tradeId, seller: seller, buyer: buyer, itemId: itemId)
    }
    
    // Cancel a trade
    access(all) fun cancelTrade(tradeId: UInt64) {
        let trade = self.trades[tradeId] ?? panic("Trade not found")
        
        if trade.seller != self.account.address {
            panic("Only the seller can cancel the trade")
        }
        
        self.trades.remove(key: tradeId)
        
        emit TradeCancelled(tradeId: tradeId, seller: trade.seller, itemId: trade.itemId)
    }
    
    // Get all active trades
    access(all) fun getActiveTrades(): [Trade] {
        return self.trades.values
    }
    
    // Get a specific trade
    access(all) fun getTrade(tradeId: UInt64): Trade? {
        return self.trades[tradeId]
    }
} 