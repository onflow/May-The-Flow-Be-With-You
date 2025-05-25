import NonFungibleToken from 0x631e88ae7f1d7c20
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import MetadataViews from 0x631e88ae7f1d7c20
import ViewResolver from 0x631e88ae7f1d7c20
import Background from 0x4e4b4b2dd2fc8019
import Body from 0x4e4b4b2dd2fc8019
import Cloth from 0x4e4b4b2dd2fc8019
import Weapon from 0x4e4b4b2dd2fc8019
import Glove from 0x4e4b4b2dd2fc8019
import Ring from 0x4e4b4b2dd2fc8019
import Helmet from 0x4e4b4b2dd2fc8019
// import Rarity from 0x4e4b4b2dd2fc8019
import Base64 from 0x4e4b4b2dd2fc8019

access(all) contract Bag: NonFungibleToken {

    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event Minted(id: UInt64, svg:String)

    // Storage and Public Paths
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath

    // State Variable
    access(all) var totalSupply: UInt64
    access(all) var maxSupply: UInt64
    access(all) let bagPrice: UFix64
    access(all) let team: Address
    access(all) let reservedSupply: UInt64
    access(all) var reservedMinted: UInt64

    access(all) var bagsRarityScore: {UInt64: UInt64} 

    access(all) fun externalURL(): MetadataViews.ExternalURL {
        return MetadataViews.ExternalURL("https://xyz.io")
    }

    access(all) resource NFT: NonFungibleToken.NFT {
        access(all) let id: UInt64
        access(all) let svg: String

        init(id: UInt64, svg: String) 
        {
            self.id = id
            self.svg = svg
        }

        // access(all) fun getRarityScore(id:UInt64): UInt64?{
        //     return Bag.bagsRarityScore[id]
        // }

        access(all) fun getSVG(): String{
            return self.svg
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- Bag.createEmptyCollection(nftType: Type<@NFT>())
        }

        access(all) view fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Royalties>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>()
            ]
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: "Bag # ".concat(self.id.toString()),
                        description: "Bag is a fully on-chain NFT on Flow, crafted with Flow VRF randomness. Each Bag holds 7 unique traits, forming a one-of-a-kind warrior identity. But it’s more than art — all mint proceeds are staked, and the yield goes directly to holders. Bag is identity, utility, and rewards — all packed into a single Bag.",
                        thumbnail: MetadataViews.HTTPFile(url: self.getSVG())
                    )  
                case Type<MetadataViews.Royalties>():
                    let owner = getAccount(0xb752a55a9687f48e)
                    let cut = MetadataViews.Royalty(
                        receiver: owner.capabilities.get<&{FungibleToken.Receiver}>(/public/dapperUtilityCoinReceiver),
                        cut: 0.05, // 5% royalty
                        description: "Creator Royalty"
                    )
                    var royalties: [MetadataViews.Royalty] = [cut]
                    return MetadataViews.Royalties(royalties)
                case Type<MetadataViews.NFTCollectionData>():
                    return Bag.resolveContractView(resourceType: Type<@NFT>(), viewType: Type<MetadataViews.NFTCollectionData>())
                case Type<MetadataViews.NFTCollectionDisplay>():
                    return Bag.resolveContractView(resourceType: Type<@NFT>(), viewType: Type<MetadataViews.NFTCollectionDisplay>())
            }
            return nil
        }  
    }

    access(all) resource interface BagCollectionPublic {
        access(all) fun deposit(token: @{NonFungibleToken.NFT})
        access(all) view fun getIDs(): [UInt64]
        access(all) fun borrowBagNFT(id: UInt64): &Bag.NFT? {
            post {
                (result == nil) || (result?.id == id):
                    "Cannot borrow Bag reference: The ID of the returned reference is incorrect"
            }
        }
    }
    access(all) resource Collection: BagCollectionPublic, NonFungibleToken.Collection {
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}

        init () {
            self.ownedNFTs <- {}
        }

        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            pre {
                self.ownedNFTs.containsKey(withdrawID): "NFT does not exist in collection."
            }
            let token <- self.ownedNFTs.remove(key: withdrawID)!
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @Bag.NFT
            let id: UInt64 = token.id
            let oldToken <- self.ownedNFTs[id] <- token
            emit Deposit(id: id, to: self.owner?.address)
            destroy oldToken
        }

        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return &self.ownedNFTs[id]
        }

        access(all) view fun getLength(): Int {
			return self.ownedNFTs.length
		}

        access(all) fun borrowBagNFT(id: UInt64): &Bag.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = (&self.ownedNFTs[id] as &{NonFungibleToken.NFT}?)!
                let bagNFT = ref as! &Bag.NFT
                return bagNFT
            }else{
                return nil
            }
        }

        access(all)
		view fun borrowViewResolver(id: UInt64): &{ViewResolver.Resolver}?{ 
			if let nft = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}? {
				return nft as &{ViewResolver.Resolver}
			}
			return nil
		}

        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@NFT>()] = true
            return supportedTypes
        }

        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@NFT>()
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection}{ 
			return <- Bag.createEmptyCollection(nftType: Type<@Bag.NFT>())
		}
    }

    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }

    access(all) fun getRandomBackground(): String{
        let size = Background.backgrounds.length
        let sizes = UInt64(size)
        let rand = Bag.getRandomNumber(num: sizes)
        return Background.backgrounds[rand]
    }

    access(all) fun getRandomTypes(): String{
        let size = Body.body.length
        let sizes = UInt64(size)
        let rand = Bag.getRandomNumber(num: sizes)
        return Body.body[rand]
    }

    access(all) fun getRandomCloth(): String{
        let size = Cloth.cloths.length
        let sizes = UInt64(size)
        let rand = Bag.getRandomNumber(num: sizes)
        return Cloth.cloths[rand]
    }

    access(all) fun getRandomWeapons(): String{
        let size = Weapon.weapons.length
        let sizes = UInt64(size)
        let rand = Bag.getRandomNumber(num: sizes)
        return Weapon.weapons[rand]
    }

    access(all) fun getRandomNecklace(): String{
        let size = Glove.gloves.length
        let sizes = UInt64(size)
        let rand = Bag.getRandomNumber(num: sizes)
        return Glove.gloves[rand]
    }

    access(all) fun getRandomRing(): String{
        let size = Ring.rings.length
        let sizes = UInt64(size)
        let rand = Bag.getRandomNumber(num: sizes)
        return Ring.rings[rand]
    }

    access(all) fun getRandomHelmet(): String{
        let size = Helmet.helmets.length
        let sizes = UInt64(size)
        let rand = Bag.getRandomNumber(num: sizes)
        return Helmet.helmets[rand]
    }

    access(all) fun getRandomNumber(num: UInt64): UInt64 {
        let randomNumber: UInt64 = revertibleRandom<UInt64>(modulo: UInt64.max)
        let moduloResult = randomNumber % num
        return moduloResult == 0 ? 0 : moduloResult - 1
    }

    // access(contract) fun getRarityScore(rarity:String): UInt64{
    //     switch rarity {
    //     case "Common":
    //         return 1
    //     case "Rare":
    //         return 2
    //     case "Epic":
    //         return 3
    //     case "Legendary":
    //         return 5
    //     default:
    //         return 0
    //     }
    // }

    // access(contract) fun calculateRarityScore(itemName: String): UInt64 {
    //     let rarity = Rarity.rarity[itemName] ?? "Common"
    //     var value = Bag.getRarityScore(rarity : rarity)
    //     return value
    // }

    // access(contract) fun generateSVG(): String{
    //     // var totalRarityScore: UInt64 = 0
    //     var svg = "<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 350 350'><style>.bag { fill: white; font-family: serif; font-size: 14px; font-weight: bold} .base { fill: white; font-family: serif; font-size: 14px; } .title { fill: #ddd; font-family: Bookman; font-size: 10px; text-anchor: middle; }</style><rect width='100%' height='100%' fill='black' /><text x='175' y='340' class='title'>build-on-flow</text><text x='10' y='20' class='bag'>"
    //     var bagName = "bag #"
    //     svg = svg.concat(bagName)
    //     var bagId = Bag.totalSupply
    //     svg = svg.concat(bagId.toString()).concat("</text>").concat("<text x='10' y='60' class='base'>")
    //     let background = Bag.getRandomBackground()
    //     svg = svg.concat(background).concat("</text>")
    //     svg = svg.concat("<text x='10' y='80' class='base'>")
    //     let type = Bag.getRandomTypes()
    //     svg = svg.concat(type).concat("</text>")
    //     svg = svg.concat("<text x='10' y='100' class='base'>")
    //     let cloth = Bag.getRandomCloth()
    //     svg = svg.concat(cloth).concat("</text>")
    //     svg = svg.concat("<text x='10' y='120' class='base'>")
    //     let weapon = Bag.getRandomWeapons()
    //     svg = svg.concat(weapon).concat("</text>")
    //     svg = svg.concat("<text x='10' y='140' class='base'>")
    //     let necklace = Bag.getRandomNecklace()
    //     svg = svg.concat(necklace).concat("</text>")
    //     svg = svg.concat("<text x='10' y='160' class='base'>")
    //     let ring = Bag.getRandomRing()
    //     svg = svg.concat(ring).concat("</text>")
    //     svg = svg.concat("<text x='10' y='180' class='base'>")
    //     let helmet = Bag.getRandomHelmet()
    //     svg = svg.concat(helmet).concat("</text>")
    //     svg = svg.concat("<text x='10' y='250' class='base'>")
    //     let items = [background, type, cloth, weapon, necklace, ring, helmet]
    //     // for item in items {
    //     //     totalRarityScore = totalRarityScore + self.calculateRarityScore(itemName: item)
    //     // }
    //     // self.bagsRarityScore[bagId] = totalRarityScore
    //     // svg = svg.concat("rarity score: ").concat(totalRarityScore.toString()).concat("</text>")
    //     svg = svg.concat("</svg>")
    //     return svg
    // }

    access(contract) fun generateSVG(): String {
        var svg = "<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 350 350'>"
        svg = svg.concat("<style>")
        svg = svg.concat(".bag { fill: white; font-family: serif; font-size: 14px; font-weight: bold }")
        svg = svg.concat(".base { fill: white; font-family: serif; font-size: 14px; }")
        svg = svg.concat(".title { fill: #ddd; font-family: Bookman; font-size: 10px; text-anchor: middle; }")
        svg = svg.concat("</style>")
        svg = svg.concat("<rect width='100%' height='100%' fill='black' />")

        // Title
        svg = svg.concat("<text x='175' y='340' class='title'>build-on-flow</text>")

        // Bag ID
        svg = svg.concat("<text x='10' y='20' class='bag'>")
        let bagId = Bag.totalSupply
        svg = svg.concat("bag #").concat(bagId.toString()).concat("</text>")

        // Attributes
        let background = Bag.getRandomBackground()
        svg = svg.concat("<text x='10' y='60' class='base'>").concat(background).concat("</text>")

        let type = Bag.getRandomTypes()
        svg = svg.concat("<text x='10' y='80' class='base'>").concat(type).concat("</text>")

        let cloth = Bag.getRandomCloth()
        svg = svg.concat("<text x='10' y='100' class='base'>").concat(cloth).concat("</text>")

        let weapon = Bag.getRandomWeapons()
        svg = svg.concat("<text x='10' y='120' class='base'>").concat(weapon).concat("</text>")

        let necklace = Bag.getRandomNecklace()
        svg = svg.concat("<text x='10' y='140' class='base'>").concat(necklace).concat("</text>")

        let ring = Bag.getRandomRing()
        svg = svg.concat("<text x='10' y='160' class='base'>").concat(ring).concat("</text>")

        let helmet = Bag.getRandomHelmet()
        svg = svg.concat("<text x='10' y='180' class='base'>").concat(helmet).concat("</text>")

        // Close SVG
        svg = svg.concat("</svg>")
        return svg
    }

    access(all) fun mintNFT(addr:Address, payment: @FlowToken.Vault): @Bag.NFT {
        pre {
            self.totalSupply < self.maxSupply - self.reservedSupply || self.team == addr : "There are no public NFTs left."
            self.totalSupply + self.reservedMinted < self.maxSupply : "All NFTs are minted"
            payment.balance >= self.bagPrice : "You don't have funds"
        }
        if(addr != self.team){
            let contractReceiverRef = self.account.capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver) ?? panic("Could not borrow receiver reference")
            contractReceiverRef.deposit(from: <- payment)
        }else{
            self.reservedMinted = self.reservedMinted + 1
            let owner = getAccount(addr).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver) ?? panic("Could not borrow receiver reference")
            owner.deposit(from: <- payment)
        }
        Bag.totalSupply = Bag.totalSupply + 1
        var image = Bag.generateSVG()
        var svgToBase64 = Bag.convertSVG(url: image)
        var newSVG = "data:image/svg+xml;base64,".concat(svgToBase64)
        var newNFT <- create NFT(id: Bag.totalSupply,svg: newSVG)
        emit Minted(id: newNFT.id, svg: newNFT.svg)
        return <- newNFT
    }

    access(all) fun convertStringToBytes(input: String): [UInt8] {
        return input.utf8
    }

    access(all) fun convertSVG(url:String): String {
        var image = Bag.convertStringToBytes(input: url)
        return Base64.encode(data: image)
    }

    access(all) view fun getContractViews(resourceType: Type?): [Type] {
        return [
            Type<MetadataViews.NFTCollectionData>(),
            Type<MetadataViews.NFTCollectionDisplay>()
        ]
    }
    
    access(all) fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        switch viewType {
            case Type<MetadataViews.NFTCollectionData>():
                let collectionData = MetadataViews.NFTCollectionData(
                    storagePath: self.CollectionStoragePath,
                    publicPath: self.CollectionPublicPath,
                    publicCollection: Type<&Bag.Collection>(),
                    publicLinkedType: Type<&Bag.Collection>(),
                    createEmptyCollectionFunction: (fun(): @{NonFungibleToken.Collection} {
                        return <-Bag.createEmptyCollection(nftType: Type<@Bag.NFT>())
                    })
                )
                return collectionData
            case Type<MetadataViews.NFTCollectionDisplay>():
				let media = MetadataViews.Media(
					file: MetadataViews.HTTPFile(
						url: "https://white-worldwide-unicorn-392.mypinata.cloud/ipfs/bafybeigeadg24nqk5vuxjrcuv7w5p6ujxtzv3rilpigwh3c5wbmk2utyva"
					),
					mediaType: "image/png"
				)
				let mediaBanner = MetadataViews.Media(
					file: MetadataViews.HTTPFile(
						url: "https://white-worldwide-unicorn-392.mypinata.cloud/ipfs/bafybeihoztqdrbkkdmb3jmo7yrx4kdcamq7hr5ohsuq3ks3kmpfo3yrwxm"
					),
					mediaType: "image/png"
				)
				return MetadataViews.NFTCollectionDisplay(
					name: "Bag Collection",
					description: "Bag is a community-powered NFT that holds on-chain traits to build warrior identities — stake-backed, yield-generating, and made to give back to holders.",
					externalURL: MetadataViews.ExternalURL("https://xyz.io"),
					squareImage: media,
					bannerImage: mediaBanner,
					socials: {"twitter": MetadataViews.ExternalURL("https://x.com/flow")}
				)
        }
        return nil
    }

    init() {
        self.totalSupply = 0
        self.maxSupply = 6666
        self.bagPrice = 120.0
        self.bagsRarityScore = {}

        self.team = 0xb752a55a9687f48e
        self.reservedSupply = 50
        self.reservedMinted = 0

        self.CollectionStoragePath = /storage/GullyBagCollection
        self.CollectionPublicPath = /public/GullyBagCollection

        let collection <- create Collection()
        self.account.storage.save(<-collection, to: self.CollectionStoragePath)

        let collectionCap = self.account.capabilities.storage.issue<&{Bag.BagCollectionPublic}>(self.CollectionStoragePath)
        self.account.capabilities.publish(collectionCap, at: self.CollectionPublicPath)

        emit ContractInitialized()
    }
}