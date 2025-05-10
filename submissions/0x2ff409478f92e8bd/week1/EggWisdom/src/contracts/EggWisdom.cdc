// MADE BY: Noah Naizir

// This contract is for the Egg Wisdom NFT Collection, built on Flow.
// Inspired by the tranquil wisdom of Zen Eggs, Zen Phrases is a unique NFT collection on Flow 
// that captures the fleeting sayings revealed with each gentle pet of a Zen Egg. 
// Every NFT immortalizes a single phrase—words of calm, clarity, or whimsy—paired with its serenity, yours to own for just 1 Flow.
// At the heart of this collection lies the Wisdom Egg, a singular NFT that holds a random phrase and image from the Zen Phrases gallery. 
// Anyone can pay a small fee to refresh its wisdom, transforming its message and appearance in a ripple of surprise and delight. 
// Will you hold the Wisdom Egg and bask in its ever-changing glow, or collect phrases to cherish their timeless truths?

// Join us to collect, trade, and reshape wisdom on the blockchain where every phrase is a moment, and every moment is yours to keep.

import "FungibleToken"
import "FlowToken"
import "NonFungibleToken"
import "ViewResolver"
import "MetadataViews"
import "RandomConsumer"
import "Xorshift128plus"
import "Burner"

access(all)
contract EggWisdom: NonFungibleToken, ViewResolver { 
    // -----------------------------------------------------------------------
    // EggWisdom contract-level fields.
    // These contain actual values that are stored in the smart contract.
    // -----------------------------------------------------------------------
    // Dictionary to hold general collection information
    access(self) let collectionInfo: {String: AnyStruct}  
    // Dictionary of phrases mapped to their totalSupply
    access(self) let phrases: {String: UInt64}
    // The Wisdom Egg's everchanging metadata
    access(self) var wisdomEgg: PhraseStruct?
    // Track of total supply of EggWisdom NFTs (goes up with minting)
    access(self) var totalSupply: UInt64
    // Track of total number of EggWisdom phrases
    access(self) var totalPhrases: UInt64
    /// The RandomConsumer.Consumer resource used to request & fulfill randomness
    access(self) let consumer: @RandomConsumer.Consumer
    // -----------------------------------------------------------------------
    // EggWisdom contract Events
    // ----------------------------------------------------------------------- 
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
	access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event newPhraseAdded(id: UInt64, phrase: String)
    access(all) event PhraseMinted(id: UInt64, phrase: String, minter: Address)
    access(all) event EggDeposit(id: UInt64, to: Address?)
    access(all) event EggWithdraw(id: UInt64, from: Address?)
    access(all) event WisdomEggPetted(id: UInt64, phrase: String, petter: Address)
    // -----------------------------------------------------------------------
    // EggWisdom account paths
    // -----------------------------------------------------------------------
	access(all) let CollectionStoragePath: StoragePath
	access(all) let CollectionPublicPath: PublicPath
	access(all) let CollectionPrivatePath: PrivatePath
	access(all) let AdministratorStoragePath: StoragePath
	access(all) let PhraseStoragePath: StoragePath
    access(all) let EggStoragePath: StoragePath
    access(all) let EggStoragePublicPath: PublicPath
    // -----------------------------------------------------------------------
    // EggWisdom contract-level Composite Type definitions
    // -----------------------------------------------------------------------

    // Resource used to store NFTs metadatas
    access(all) resource PhraseStorage {
        // mapping of metadatas to their IDs
        access(all) let metadatas: {UInt64: PhraseStruct}

        init() {
            self.metadatas = {}
        }
        // Functionality around the resource
        //
        // Add new Metadata to the Storage
        access(all) 
        fun addMetadata(newPhrase: String, newMetadata: PhraseStruct) {
            pre {
                self.metadatas[newMetadata.id] == nil: "There's already a metadataStruct for the phrase: ".concat(newPhrase)
            }
            self.metadatas[newMetadata.id] = newMetadata
            emit newPhraseAdded(id: newMetadata.id, phrase: newPhrase)
        }
        // Get metadata
        access(all)
        fun getPhrase(phraseID: UInt64): PhraseStruct? {
            pre {
                self.metadatas[phraseID] != nil: "There's no phrase like: ".concat(phraseID.toString())
            }
            return self.metadatas[phraseID]!
        }
        // Replace a phrase
        access(all)
        fun replacePhrase(phraseID: UInt64, newPhrase: PhraseStruct) {
            pre {
                self.metadatas[phraseID] != nil: "There's no phrase like: ".concat(phraseID.toString())
            }
            self.metadatas[phraseID] = newPhrase
        }
    }

    // Struct used to copy a Project's NFT metadata
    // and save it inside EggWisdom' storage

    access(all) struct PhraseStruct {
        access(all) let id: UInt64
        // Project to which this Metadata belongs to
        access(all) let phrase: String  
        access(all) let base64Img: String
        access(all) let namesOnScreen: [String]
        access(all) let catsOnScreen: [String]
        access(all) let background: String
        access(all) let uploader: Address

        init(_ phrase: String,_ base64Img: String, _ namesOnScreen: [String],_ catsOnScreen: [String],_ background: String, _ uploader: Address) {
            pre {
                // EggWisdom.phrases[phrase] == nil: "There's already a phrase like: ".concat(phrase)
            }
            self.id = EggWisdom.totalPhrases
            self.phrase = phrase
            self.base64Img = base64Img
            self.namesOnScreen = namesOnScreen
            self.catsOnScreen = catsOnScreen
            self.background = background
            self.uploader = uploader

        }
    }

    /// The resource that represents a VenezulaNFT
	access(all) resource NFT: NonFungibleToken.NFT {
        access(all) let id: UInt64
        access(all) let serial: UInt64
        access(all) let metadata: PhraseStruct?
        access(all) let isWisdom: Bool
        // Get this NFT traits
        // if its WisdomEgg, metadata will be changable
        access(all) fun getTraits(): {String: AnyStruct} {
            if self.isWisdom {
                let phaseStruct: EggWisdom.PhraseStruct = EggWisdom.getWisdom()!
                let traits: {String: AnyStruct} = {"id": self.id}
                traits["phrase"] = phaseStruct.phrase
                traits["serial"] = self.serial
                traits["background"] = phaseStruct.background
                traits["namesOnScreen"] = phaseStruct.namesOnScreen
                traits["catsOnScreen"] = phaseStruct.catsOnScreen
                return traits
            } else {
                let traits: {String: AnyStruct} = {"id": self.id}
                traits["phrase"] = self.metadata?.phrase
                traits["serial"] = self.serial
                traits["background"] = self.metadata?.background
                traits["namesOnScreen"] = self.metadata?.namesOnScreen
                traits["catsOnScreen"] = self.metadata?.catsOnScreen
                return traits
            }
        }
        // Pet the Egg Wisdom to change its phrase
        access(all) fun petEgg(payment: @{FungibleToken.Vault}) {
            pre {
                self.isWisdom == true: "This is not a Wisdom Egg"
                payment.balance == 0.01: "Payment is not 0.01 Flow"
            }
            // import storage
            let storage = EggWisdom.account.storage.borrow<&EggWisdom.PhraseStorage>(from: EggWisdom.PhraseStoragePath)!
            // Produce a random number
            let phraseID <- EggWisdom.consumer.requestRandomness()
            // fulfill the request with a PRG to generate multiple random numbers from
            let prg = EggWisdom.consumer.fulfillWithPRG(request: <-phraseID)
            let prgRef = &prg as &Xorshift128plus.PRG
            // Determine the Phrase randomly 
            let randomIDIndex = RandomConsumer.getNumberInRange(prg: prgRef, min: 0, max: EggWisdom.totalPhrases)
            // Get random Wisdom Egg metadata
            let phaseStruct = storage.getPhrase(phraseID: randomIDIndex)!
            // Update Wisdom Egg metadata
            EggWisdom.wisdomEgg = phaseStruct
            // Get contract's Vault
            let WisdomTreasury = getAccount(EggWisdom.account.address).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)!
            // Deposit the Flow into the account
            WisdomTreasury.deposit(from: <- payment)
            // Emit event
            emit WisdomEggPetted(id: self.id, phrase: phaseStruct.phrase, petter: self.owner?.address!)
        }


        init(metadataStruct: PhraseStruct?) {
            // Increment the global Cards IDs
            EggWisdom.totalSupply = EggWisdom.totalSupply + 1
            self.metadata = metadataStruct
            if self.metadata == nil {
                self.serial = 0
                self.isWisdom = true
                self.id = 0
            } else {
                self.id = EggWisdom.totalSupply
                self.serial = EggWisdom.totalSupply
                self.isWisdom = false
            }
        }

        /// createEmptyCollection creates an empty Collection
        /// and returns it to the caller so that they can own NFTs
        /// @{NonFungibleToken.Collection}
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- EggWisdom.createEmptyCollection(nftType: Type<@EggWisdom.NFT>())
        }
        // Standard to return NFT's metadata
		access(all) view fun getViews(): [Type] {
			return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Royalties>(),
                Type<MetadataViews.Editions>(),
                Type<MetadataViews.ExternalURL>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>(),
                Type<MetadataViews.Serial>(),
                Type<MetadataViews.Traits>(),
                Type<MetadataViews.EVMBridgedMetadata>()
			]
		}
        // Standard for resolving Views
        access(all) fun resolveView(_ view: Type): AnyStruct? {
            	let metadata = self.metadata
                switch view {
				case Type<MetadataViews.Display>():
					return MetadataViews.Display(
						name: "Egg Wisdom #".concat(metadata?.id?.toString()!),
						description: metadata?.phrase!,
						thumbnail: MetadataViews.HTTPFile( 
            				url: "data:image/png;base64,".concat(metadata?.base64Img!)
            			)
					)
				case Type<MetadataViews.Traits>():
					return MetadataViews.dictToTraits(dict: self.getTraits(), excludedNames: nil)
				case Type<MetadataViews.NFTView>():
					return MetadataViews.NFTView(
						id: self.id,
						uuid: self.uuid,
						display: self.resolveView(Type<MetadataViews.Display>()) as! MetadataViews.Display?,
						externalURL: self.resolveView(Type<MetadataViews.ExternalURL>()) as! MetadataViews.ExternalURL?,
						collectionData: self.resolveView(Type<MetadataViews.NFTCollectionData>()) as! MetadataViews.NFTCollectionData?,
						collectionDisplay: self.resolveView(Type<MetadataViews.NFTCollectionDisplay>()) as! MetadataViews.NFTCollectionDisplay?,
						royalties: self.resolveView(Type<MetadataViews.Royalties>()) as! MetadataViews.Royalties?,
						traits: self.resolveView(Type<MetadataViews.Traits>()) as! MetadataViews.Traits?
					)
				case Type<MetadataViews.NFTCollectionData>():
					return EggWisdom.resolveContractView(resourceType: Type<@EggWisdom.NFT>(), viewType: Type<MetadataViews.NFTCollectionData>())
        		case Type<MetadataViews.ExternalURL>():
        			return MetadataViews.ExternalURL("https://www.eggwisdom.flow/")
		        case Type<MetadataViews.NFTCollectionDisplay>():
					return EggWisdom.resolveContractView(resourceType: Type<@EggWisdom.NFT>(), viewType: Type<MetadataViews.NFTCollectionDisplay>())
				case Type<MetadataViews.Medias>():
                    let metadata = 10
					if metadata != nil {
						return MetadataViews.Medias(
							[
								MetadataViews.Media(
									file: MetadataViews.HTTPFile(
										url: "metadata.embededHTML"
									),
									mediaType: "html"
								)
							]
						)
					}
        		case Type<MetadataViews.Royalties>():
          			return MetadataViews.Royalties([
            			MetadataViews.Royalty(
              				receiver: getAccount(self.metadata?.uploader!).capabilities.get<&FlowToken.Vault>(/public/flowTokenReceiver),
              				cut: 0.5, // 5% royalty on secondary sales
              				description: "The deployer gets 5% of every secondary sale."
            			)
          			])
				case Type<MetadataViews.Serial>():
					return MetadataViews.Serial(
                        // GOTTA FIX
						0
					)
			}
			return nil
        }
    }
    // to allow others to deposit VenezuelaNFT_20s into their Collection. It also allows for reading
    // the IDs of VenezuelaNFT_20s in the Collection.
    /// Defines the methods that are particular to this NFT contract collection
    ///
    access(all) resource interface EggWisdomCollectionPublic {
        access(all) fun deposit(token: @{NonFungibleToken.NFT})
        access(all) fun getIDs(): [UInt64]
    //    access(all) fun getCardType(): Type
    }

    // Collection is a resource that every user who owns NFTs 
    // will store in their account to manage their NFTS
    //
	access(all) resource Collection: NonFungibleToken.Collection, EggWisdomCollectionPublic {
        // *** Collection Variables *** //
		access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}
        // *** Collection Constructor *** //
        init () {
			self.ownedNFTs <- {}
		}
        // *** Collection Functions *** //

        /// Returns a list of NFT types that this receiver accepts
        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@EggWisdom.NFT>()] = true
            return supportedTypes
        }
        /// Returns whether or not the given type is accepted by the collection
        /// A collection that can accept any type should just return true by default
        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@EggWisdom.NFT>()
        }
		// Withdraw removes a EggWisdom from the collection and moves it to the caller(for Trading)
		access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
			let token <- self.ownedNFTs.remove(key: withdrawID) 
                ?? panic("This Collection doesn't own a EggWisdom by id: ".concat(withdrawID.toString()))

			emit Withdraw(id: token.id, from: self.owner?.address)

			return <-token
		}
		// Deposit takes a EggWisdom and adds it to the collections dictionary
		// and adds the ID to the id array
		access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
			let newEggWisdom <- token as! @NFT
			let id: UInt64 = newEggWisdom.id
			// Add the new EggWisdom to the dictionary
            let oldEggWisdom <- self.ownedNFTs[id] <- newEggWisdom
            // Destroy old EggWisdom in that slot
            destroy oldEggWisdom

			emit Deposit(id: id, to: self.owner?.address)
		}

		// GetIDs returns an array of the IDs that are in the collection
		access(all) view fun getIDs(): [UInt64] {
			return self.ownedNFTs.keys
		}
        /// Gets the amount of NFTs stored in the collection
        access(all) view fun getLength(): Int {
            return self.ownedNFTs.length
        }

		// BorrowNFT gets a reference to an NFT in the collection
		access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
			return &self.ownedNFTs[id]
		}

		access(all) view fun borrowViewResolver(id: UInt64): &{ViewResolver.Resolver}? {
            if let nft = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}? {
                return nft as &{ViewResolver.Resolver}
            }
            return nil
		}
        /// createEmptyCollection creates an empty Collection of the same type
        /// and returns it to the caller
        /// @return A an empty collection of the same type
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-EggWisdom.createEmptyCollection(nftType: Type<@EggWisdom.NFT>())
        }
    }
    // -----------------------------------------------------------------------
    // Egg Wisdom Administrator Resource
    // -----------------------------------------------------------------------
    // Admin is a special authorization resource that 
    // allows the owner to perform important functions to modify the 
    // various aspects of the NFTs
    access(all) resource Admin {

        // function to create a new Phrase metadata
        access(all) 
        fun createPhrase(
            phrase: String,
            base64Img: String,
            namesOnScreen: [String],
            catsOnScreen: [String],
            background: String
            ) {
            pre {
                EggWisdom.phrases[phrase] == nil: "There's already a phrase like: ".concat(phrase)
            }
            // Increment the global Metadatas IDs
            EggWisdom.totalPhrases = EggWisdom.totalPhrases + 1
            // Create metadata struct
            let newMetadata = PhraseStruct(phrase, base64Img, namesOnScreen, catsOnScreen, background, EggWisdom.account.address)
            // import storage
            let storage = EggWisdom.account.storage.borrow<&EggWisdom.PhraseStorage>(from: EggWisdom.PhraseStoragePath)!
            // save new metadata inside the storage
            storage.addMetadata(newPhrase: phrase, newMetadata: newMetadata)
            // Add phrase to the contract's mapping
            EggWisdom.phrases[phrase] = newMetadata.id
        } 
    }
    // -----------------------------------------------------------------------
    // Wisdom Egg Storage Resource
    // -----------------------------------------------------------------------
    access(all) resource EggStorage: EggStoragePublic {
        // List of Eggs 
		access(all) var Eggs: @[Egg]    
        access(self) let poolPath: PublicPath  
        access(self) let pool: @FlowToken.Vault

        init() {
            let identifier = "EggWisdom_".concat(self.uuid.toString())
            self.poolPath = PublicPath(identifier: identifier)!
            self.Eggs <- []
            // Create storage slot for distribution of royalties
            let pool <-  FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
            self.pool <- pool
        }
		// Deposit takes a Egg and adds it to the storage list
		access(all) fun deposit(Egg: @Egg) {
            let id = Egg.uuid
            self.Eggs.append(<- Egg)

            // Emit event
			emit EggDeposit(id: id, to: self.owner?.address) 
		}
		// Withdraw removes the oldest Egg from the list and moves it to the caller(to reveal)
		access(all) fun withdraw(): @Egg {
			let Egg <- self.Eggs.removeFirst()
            let id = Egg.uuid
			
            emit EggWithdraw(id: id, from: self.owner?.address)
            return <- Egg
		}
        // Mint Egg 
        access(all)
        fun mintEgg(recipient: Address, payment: @{FungibleToken.Vault}): @Egg {
            pre {
                payment.balance == 1.0: "Payment is not 1 Flow"
            }
            // import storage
            let storage = EggWisdom.account.storage.borrow<&EggWisdom.PhraseStorage>(from: EggWisdom.PhraseStoragePath)!
            // Produce a random number
            let request <- EggWisdom.consumer.requestRandomness()
            // Create a Egg resource
            let Egg <- create Egg(request: <-request)
            // Get contract's Vault
            let WisdomTreasury = getAccount(EggWisdom.account.address).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)!
            // Get money for Royalty
            let poolRoyalties<- payment.withdraw(amount: 0.1)
            // Deposit the Flow into the account
            WisdomTreasury.deposit(from: <- payment)
            // Deposit the Flow into the pool
            self.pool.deposit(from: <- poolRoyalties)
            // Return the Egg
            return <- Egg
        }
        /* --- Reveal --- */
        /// Here the caller provides the Receipt given to them at commitment. The contract then "reveals pack" with
        /// _randomNumber(), providing the Receipt's contained Request.
        ///
        access(all)
        fun revealPhrase(receipt: @Egg, minter: Address) {
            pre {
                receipt.request != nil: "Cannot reveal the egg! The provided receipt has already been revealed."
                receipt.getRequestBlock()! <= getCurrentBlock().height: "Cannot reveal the egg! The provided receipt was committed for block height ".concat(receipt.getRequestBlock()!.toString()).concat(" but the current block height is ").concat(getCurrentBlock().height.toString())
            }
            // Get reference to recipt
            let commitBlock = receipt.getRequestBlock()!
            let receiptID = receipt.uuid
            let recipient = getAccount(minter)
            // Get reference to recipient's account
            let receiverRef: &{EggWisdom.EggWisdomCollectionPublic} = recipient.capabilities.borrow<&{EggWisdom.EggWisdomCollectionPublic}>(EggWisdom.CollectionPublicPath)
                ?? panic("Cannot borrow a reference to the recipient's Egg Wisdom collection")
            // Get the random number
            // fulfill the request with a PRG to generate multiple random numbers from
            let prg = EggWisdom.consumer.fulfillWithPRG(request: <-receipt.popRequest())
            let prgRef = &prg as &Xorshift128plus.PRG
            // Get a phrase picked at random among the possible phrases
            let phraseSlot = RandomConsumer.getNumberInRange(prg: prgRef, min: 1, max: UInt64(EggWisdom.totalPhrases))
            // Burn the receipt
            Burner.burn(<-receipt) 
            // import storage
            let storage = EggWisdom.account.storage.borrow<&EggWisdom.PhraseStorage>(from: EggWisdom.PhraseStoragePath)!
            // Get random Wisdom Egg metadata
            let phaseStruct = storage.getPhrase(phraseID: phraseSlot)!
            // Deposit royalties into this Phrase's creator
            let poolRoyalties <- self.pool.withdraw(amount: 0.1)
            // Get account's Vault
            let accountReceiver = getAccount(phaseStruct.uploader).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)!
            // Deposit the Flow into the account
            accountReceiver.deposit(from: <- poolRoyalties)
            // Create a new NFT
            let nft <- create NFT(metadataStruct: phaseStruct)
            // Deposit the NFT into the recipient's collection
            receiverRef.deposit(token: <- nft)
        }
        // Get number of Eggs in storage
        access(all) fun getBalance(): Int {
            return self.Eggs.length
        }

    }
    access(all) resource interface EggStoragePublic {  
        access(all) fun deposit(Egg: @Egg)
        access(all) fun getBalance(): Int
    }
    // -----------------------------------------------------------------------
    // Wisdom Egg Resource
    // -----------------------------------------------------------------------
    /// The Egg resource is used to store the associated phrase request. By listing the
    /// RandomConsumer.RequestWrapper conformance, this resource inherits all the default implementations of the
    /// interface. This is why the Egg resource has access to the getRequestBlock() and popRequest() functions
    /// without explicitly defining them.
    ///
    access(all) resource Egg : RandomConsumer.RequestWrapper {
        /// The associated randomness request which contains the block height at which the request was made
        /// and whether the request has been fulfilled.
        access(all) var request: @RandomConsumer.Request?

        init(request: @RandomConsumer.Request) {
            self.request <- request
        }
    }
    // -----------------------------------------------------------------------
    // EggWisdom private functions
    // -----------------------------------------------------------------------
    /// Returns a random number between 0 and 1 using the RandomConsumer.Consumer resource contained in the contract.
    /// For the purposes of this contract, a simple modulo operation could have been used though this is not the case
    /// for all ranges. Using the Consumer.fulfillRandomInRange function ensures that we can get a random number
    /// within any range without a risk of bias.
    ///
    access(self) 
    fun _randomNumber(request: @RandomConsumer.Request, max: Int): UInt64 {
        return self.consumer.fulfillRandomInRange(request: <-request, min: 0, max: UInt64(max))
    }

    // -----------------------------------------------------------------------
    // EggWisdom Generic or Standard public "transaction" functions
    // -----------------------------------------------------------------------

    /// createEmptyCollection creates an empty Collection for the specified NFT type
    /// and returns it to the caller so that they can own NFTs
    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }
    // create empty egg wisdom storage
    access(all) fun createEmptyEggStorage(): @EggStorage {
        return <- create EggStorage()
    }
    // Create a new phrase struct
    access(all) 
    fun createPhrase(
            phrase: String,
            base64Img: String,
            namesOnScreen: [String],
            catsOnScreen: [String],
            background: String,
            uploader: Address,
            payment: @{FungibleToken.Vault}
            ) {
            pre {
                payment.balance == 5.0: "Payment is not 5 Flow"
            }
            // Increment the global Metadatas IDs
            EggWisdom.totalPhrases = EggWisdom.totalPhrases + 1
            // Create metadata struct
            let newMetadata = PhraseStruct(phrase, base64Img, namesOnScreen, catsOnScreen, background, uploader)
            // import storage
            let storage = EggWisdom.account.storage.borrow<&EggWisdom.PhraseStorage>(from: EggWisdom.PhraseStoragePath)!
            // save new metadata inside the storage
            storage.addMetadata(newPhrase: phrase, newMetadata: newMetadata)
            // Get contract's Vault
            let WisdomTreasury = getAccount(EggWisdom.account.address).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)!
            // Deposit the Flow into the account
            WisdomTreasury.deposit(from: <- payment)
            // Add phrase to the contract's mapping
            EggWisdom.phrases[phrase] = newMetadata.id
    }
    // Mint EggWisdom NFT
    access(all)
    fun mintWisdomEgg(recipient: Address, payment: @{FungibleToken.Vault}) {
        pre {
            payment.balance == 5.0: "Payment is not 5 Flow"
        } 
        let nft <- create NFT(metadataStruct: nil)

        // emit PhraseMinted(id: nft.id, phrase: nft.metadata?.phrase!, minter: recipient)
		if let recipientCollection = getAccount(recipient)
			.capabilities.borrow<&{NonFungibleToken.Receiver}>(EggWisdom.CollectionPublicPath) 
			{
				recipientCollection.deposit(token: <- nft)
		} else {
			destroy nft
/* 				if let storage = &Piece.nftStorage[recipient] as &{UInt64: NFT}? {
					storage[nft.id] <-! nft
				} else {
					Piece.nftStorage[recipient] <-! {nft.id: <- nft}
				} */
		}

        // Get contract's Vault
		let WisdomTreasury = getAccount(EggWisdom.account.address).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)!
        // Deposit the Flow into the account
        WisdomTreasury.deposit(from: <- payment)
    }
    // -----------------------------------------------------------------------
    // EggWisdom Generic or Standard public "script" functions
    // -----------------------------------------------------------------------

    // Public function to get all the phrases and their total editions
    access(all) fun getPhrases(): {String: UInt64} {
        return self.phrases
    }
    // Get Wisdom Egg's metadata
    access(all) fun getWisdom(): PhraseStruct? {
        return self.wisdomEgg
    }
    // Public function to fetch a collection attribute
    access(all) fun getCollectionAttribute(key: String): AnyStruct {
		return self.collectionInfo[key] ?? panic(key.concat(" is not an attribute in this collection."))
	}
    /// Function that returns all the Metadata Views implemented by a Non Fungible Token
    ///
    /// @return An array of Types defining the implemented views. This value will be used by
    ///         developers to know which parameter to pass to the resolveView() method.
    ///
    access(all) view fun getContractViews(resourceType: Type?): [Type] {
        return [
            Type<MetadataViews.NFTCollectionData>(),
            Type<MetadataViews.NFTCollectionDisplay>()
        //    Type<MetadataViews.EVMBridgedMetadata>()
        ]
    }
    // Public function to return general metadata around the collection
    access(all) fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        switch viewType {
            case Type<MetadataViews.NFTCollectionData>():
                let collectionData = MetadataViews.NFTCollectionData(
                    storagePath: self.CollectionStoragePath,
                    publicPath: self.CollectionPublicPath,
                    publicCollection: Type<&EggWisdom.Collection>(),
                    publicLinkedType: Type<&EggWisdom.Collection>(),
                    createEmptyCollectionFunction: (fun (): @{NonFungibleToken.Collection} {
                        return <-EggWisdom.createEmptyCollection(nftType: Type<@EggWisdom.NFT>())
                    })
                )
                return collectionData
            case Type<MetadataViews.NFTCollectionDisplay>():
                let media = MetadataViews.Media(
            			file: MetadataViews.HTTPFile(
            				url: "https://img.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/824576.png"
            			),
            			mediaType: "image/png"
          			)	
                return MetadataViews.NFTCollectionDisplay(
                    name: "EggWisdom",
                    description: "EggWisdom and Zen governance.",
                    externalURL: MetadataViews.ExternalURL("https://EggWisdom.gg/"),
                    squareImage: media,
                    bannerImage: media,
                    socials: {
                        "twitter": MetadataViews.ExternalURL("https://twitter.com/EggWisdom")
                    }
                )
        }
        return nil
    }
    init() {
        self.collectionInfo = {}
        self.collectionInfo["name"] = "Egg Wisdom"
		self.collectionInfo["description"] = "Get Wisdom for 1 Flow"
		self.collectionInfo["image"] = MetadataViews.Media(
            			file: MetadataViews.HTTPFile(
            				url: "https://img.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/824576.png"
            			),
            			mediaType: "image/png"
          			)			
    	self.collectionInfo["dateCreated"] = getCurrentBlock().timestamp
    	self.collectionInfo["website"] = MetadataViews.ExternalURL("https://www.eggwisdom.flow/")
        self.phrases = {}
        self.totalSupply = 0
        self.totalPhrases = 0
        self.wisdomEgg = nil
        // Create a RandomConsumer.Consumer resource
        self.consumer <-RandomConsumer.createConsumer()

        let identifier = "EggWisdom_".concat(self.account.address.toString())
        // Set the named paths
		self.CollectionStoragePath = StoragePath(identifier: identifier)!
		self.CollectionPublicPath = PublicPath(identifier: identifier)!
		self.CollectionPrivatePath = PrivatePath(identifier: identifier)!
		self.AdministratorStoragePath = StoragePath(identifier: identifier.concat("Administrator"))!
		self.PhraseStoragePath = StoragePath(identifier: identifier.concat("PhraseStorage"))!
		self.EggStoragePath = StoragePath(identifier: identifier.concat("EggStorage"))!
		self.EggStoragePublicPath = PublicPath(identifier: identifier.concat("EggStoragePublic"))!

		// Create a Administrator resource and save it to EggWisdom account storage
		let administrator <- create Admin()
		self.account.storage.save(<- administrator, to: self.AdministratorStoragePath)
		// Create a phraseStorage resource and save it to EggWisdom account storage
		let phraseStorage <- create PhraseStorage()
		self.account.storage.save(<- phraseStorage, to: self.PhraseStoragePath)
		// Create a Collection resource and save it to storage
		let collection <- create Collection()
		self.account.storage.save(<- collection, to: self.CollectionStoragePath)
        // create a public capability for the collection
	    let collectionCap = self.account.capabilities.storage.issue<&EggWisdom.Collection>(self.CollectionStoragePath)
		self.account.capabilities.publish(collectionCap, at: self.CollectionPublicPath)
        // create a EggStorage resource and save it to storage
        let EggStorage <- create EggStorage()
        self.account.storage.save(<- EggStorage, to: self.EggStoragePath)
        // create a public capability for the Egg storage
        let EggStorageCap = self.account.capabilities.storage.issue<&{EggWisdom.EggStoragePublic}>(self.EggStoragePath)
		self.account.capabilities.publish(EggStorageCap, at: self.EggStoragePublicPath)
    }
}