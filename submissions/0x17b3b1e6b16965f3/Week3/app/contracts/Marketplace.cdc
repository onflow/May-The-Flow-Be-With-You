pub contract Marketplace {
    pub event ListingCreated(id: UInt64, nftId: UInt64, price: UFix64, seller: Address)
    pub event ListingCompleted(id: UInt64, nftId: UInt64, price: UFix64, seller: Address, buyer: Address)
    pub event ListingCancelled(id: UInt64, nftId: UInt64, seller: Address)

    pub struct Listing {
        pub let id: UInt64
        pub let nftId: UInt64
        pub let price: UFix64
        pub let seller: Address
        pub let createdAt: UFix64

        init(id: UInt64, nftId: UInt64, price: UFix64, seller: Address) {
            self.id = id
            self.nftId = nftId
            self.price = price
            self.seller = seller
            self.createdAt = getCurrentBlock().timestamp
        }
    }

    pub resource ListingCollection {
        pub var listings: @{UInt64: Listing}
        pub var nextListingID: UInt64

        init() {
            self.listings = {}
            self.nextListingID = 1
        }

        pub fun createListing(nftId: UInt64, price: UFix64): UInt64 {
            let listingID = self.nextListingID
            self.nextListingID = self.nextListingID + 1

            let listing = Listing(
                id: listingID,
                nftId: nftId,
                price: price,
                seller: self.account.address
            )

            self.listings[listingID] = listing
            emit ListingCreated(id: listingID, nftId: nftId, price: price, seller: self.account.address)
            return listingID
        }

        pub fun removeListing(listingID: UInt64) {
            let listing = self.listings.remove(key: listingID) ?? panic("Listing not found")
            emit ListingCancelled(id: listingID, nftId: listing.nftId, seller: listing.seller)
        }

        pub fun getListing(listingID: UInt64): &Listing? {
            return &self.listings[listingID] as &Listing?
        }

        pub fun getAllListings(): [Listing] {
            return self.listings.values
        }
    }

    pub fun createListing(nftId: UInt64, price: UFix64): UInt64 {
        let listingCollection = self.account.borrow<&ListingCollection>(from: /storage/MarketplaceListings)
            ?? panic("Listing collection not found")
        return listingCollection.createListing(nftId: nftId, price: price)
    }

    pub fun buyNFT(listingID: UInt64) {
        let listingCollection = self.account.borrow<&ListingCollection>(from: /storage/MarketplaceListings)
            ?? panic("Listing collection not found")
        
        let listing = listingCollection.getListing(listingID: listingID)
            ?? panic("Listing not found")

        // Transfer Flow tokens from buyer to seller
        let payment = FlowToken.createVault(amount: listing.price)
        let sellerVault = getAccount(listing.seller).getCapability(/public/flowTokenReceiver)
            .borrow<&{FungibleToken.Receiver}>() ?? panic("Seller vault not found")
        
        sellerVault.deposit(from: <-payment)

        // Transfer NFT from seller to buyer
        let nftCollection = getAccount(listing.seller).getCapability(/public/EmojiNFTCollection)
            .borrow<&EmojiNFT.Collection>() ?? panic("NFT collection not found")
        
        let nft = nftCollection.withdraw(id: listing.nftId)
        let buyerCollection = self.account.getCapability(/public/EmojiNFTCollection)
            .borrow<&EmojiNFT.Collection>() ?? panic("Buyer collection not found")
        
        buyerCollection.deposit(token: nft)

        // Remove listing
        listingCollection.removeListing(listingID: listingID)
        emit ListingCompleted(
            id: listingID,
            nftId: listing.nftId,
            price: listing.price,
            seller: listing.seller,
            buyer: self.account.address
        )
    }

    pub fun cancelListing(listingID: UInt64) {
        let listingCollection = self.account.borrow<&ListingCollection>(from: /storage/MarketplaceListings)
            ?? panic("Listing collection not found")
        listingCollection.removeListing(listingID: listingID)
    }

    pub fun getListing(listingID: UInt64): &Listing? {
        let listingCollection = self.account.borrow<&ListingCollection>(from: /storage/MarketplaceListings)
            ?? panic("Listing collection not found")
        return listingCollection.getListing(listingID: listingID)
    }

    pub fun getAllListings(): [Listing] {
        let listingCollection = self.account.borrow<&ListingCollection>(from: /storage/MarketplaceListings)
            ?? panic("Listing collection not found")
        return listingCollection.getAllListings()
    }

    init() {
        self.account.save(<-create ListingCollection(), to: /storage/MarketplaceListings)
        self.account.link<&ListingCollection>(/public/MarketplaceListings, target: /storage/MarketplaceListings)
    }
} 