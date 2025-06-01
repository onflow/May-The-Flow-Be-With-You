//THIS CONTRACT IS ONLY FOR DEVELOPMENT

import "FungibleToken"
import "FungibleTokenMetadataViews"
import "MetadataViews"
import "ViewResolver"
 
access(all) contract aiSportsJuice: FungibleToken {

    // The amount of tokens in existance
    access(all) var totalSupply: UFix64
    // nil if there is none
    access(all) let maxSupply: UFix64?

    // Paths
    access(all) let VaultStoragePath: StoragePath
    access(all) let ReceiverPublicPath: PublicPath
    access(all) let VaultPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath
    access(all) let AdministratorStoragePath: StoragePath

    // Events
    access(all) event TokensTransferred(amount: UFix64, from: Address, to: Address)
    access(all) event TokensMinted(amount: UFix64)
    access(all) event TokensBurned(amount: UFix64)

    access(all) resource Vault: FungibleToken.Vault {
        access(all) var balance: UFix64

        /// Called when a fungible token is burned via the `Burner.burn()` method
        access(contract) fun burnCallback() {
            if self.balance > 0.0 {
                emit TokensBurned(amount: self.balance)
                aiSportsJuice.totalSupply = aiSportsJuice.totalSupply - self.balance
            }
            self.balance = 0.0
        }

        access(FungibleToken.Withdraw) fun withdraw(amount: UFix64): @{FungibleToken.Vault} {
            self.balance = self.balance - amount

            if let owner: Address = self.owner?.address {
                aiSportsJuice.setBalance(address: owner, balance: self.balance)
            }
            return <- create Vault(balance: amount)
        }

        access(all) fun deposit(from: @{FungibleToken.Vault}) {
            let vault: @Vault <- from as! @Vault
            self.balance = self.balance + vault.balance
            destroy vault

            if let owner: Address = self.owner?.address {
                aiSportsJuice.setBalance(address: owner, balance: self.balance)
            }
        }

        access(all) view fun getViews(): [Type] {
            return aiSportsJuice.getContractViews(resourceType: nil)
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            return aiSportsJuice.resolveContractView(resourceType: nil, viewType: view)
        }

        access(all) view fun isAvailableToWithdraw(amount: UFix64): Bool {
            return amount <= self.balance
        }

        access(all) fun createEmptyVault(): @Vault {
            return <- create Vault(balance: 0.0)
        }
  
        init(balance: UFix64) {
            self.balance = balance
        }
    }

    access(all) fun createEmptyVault(vaultType: Type): @Vault {
        return <- create Vault(balance: 0.0)
    }

    access(all) resource Minter {
        access(all) fun mint(amount: UFix64): @Vault {
            post {
                aiSportsJuice.maxSupply == nil || aiSportsJuice.totalSupply <= aiSportsJuice.maxSupply!: 
                    "Exceeded the max supply of tokens allowd."
            }
            aiSportsJuice.totalSupply = aiSportsJuice.totalSupply + amount
            emit TokensMinted(amount: amount)
            return <- create Vault(balance: amount)
        }
    }

    // We follow this pattern of storage
    // so the (potentially) huge dictionary 
    // isn't loaded when the contract is imported
    access(all) resource Administrator {
        // This is an experimental index and should
        // not be used for anything official
        // or monetary related
        access(self) let balances: {Address: UFix64}

        access(contract) fun setBalance(address: Address, balance: UFix64) {
            self.balances[address] = balance
        }

        access(all) view fun getBalance(address: Address): UFix64 {
            return self.balances[address] ?? 0.0
        }

        access(all) view fun getBalances(): {Address: UFix64} {
            return self.balances
        }

        init() {
            self.balances = {}
        }
    }

    access(contract) fun setBalance(address: Address, balance: UFix64) {
        let admin: &Administrator = self.account.storage.borrow<&Administrator>(from: self.AdministratorStoragePath)!
        admin.setBalance(address: address, balance: balance)
    }

    access(all) view fun getBalance(address: Address): UFix64 {
        let admin: &Administrator = self.account.storage.borrow<&Administrator>(from: self.AdministratorStoragePath)!
        return admin.getBalance(address: address)
    }

    access(all) view fun getBalances(): {Address: UFix64} {
        let admin: &Administrator = self.account.storage.borrow<&Administrator>(from: self.AdministratorStoragePath)!
        return admin.getBalances()
    }

    access(all) view fun getContractViews(resourceType: Type?): [Type] {
        return [
            Type<FungibleTokenMetadataViews.FTView>(),
            Type<FungibleTokenMetadataViews.FTDisplay>(),
            Type<FungibleTokenMetadataViews.FTVaultData>(),
            Type<FungibleTokenMetadataViews.TotalSupply>()
        ]
    }

    access(all) view fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        switch viewType {
            case Type<FungibleTokenMetadataViews.FTView>():
                return FungibleTokenMetadataViews.FTView(
                    ftDisplay: self.resolveContractView(resourceType: nil, viewType: Type<FungibleTokenMetadataViews.FTDisplay>()) as! FungibleTokenMetadataViews.FTDisplay?,
                    ftVaultData: self.resolveContractView(resourceType: nil, viewType: Type<FungibleTokenMetadataViews.FTVaultData>()) as! FungibleTokenMetadataViews.FTVaultData?
                )
            case Type<FungibleTokenMetadataViews.FTDisplay>():
                let media = MetadataViews.Media(
                        file: MetadataViews.HTTPFile(
                        url: "https://nftstorage.link/ipfs/bafkreidrywo4xhmfqtzjbqxplwjfwhuvifsfquc7q7zoysg6bdrxjbxa5e"
                    ),
                    mediaType: "image"
                )
                let bannerMedia = MetadataViews.Media(
                        file: MetadataViews.HTTPFile(
                        url: "https://nftstorage.link/ipfs/bafybeidknogb3nrpopomfnyfupvzbqlbo2wtxuvskpa7ccrvvsfpvat2sa"
                    ),
                    mediaType: "image"
                )
                let medias = MetadataViews.Medias([media, bannerMedia])
                return FungibleTokenMetadataViews.FTDisplay(
                    name: "JUICE by aiSports",
                    symbol: "JUICE",
                    description: "This is the aiSports DAO, here we manage the $JUICE token and aiSports treasury. We will also utilize this platform to support community votes.",
                    externalURL: MetadataViews.ExternalURL("www.aisportspro.com"),
                    logos: medias,
                    socials: {
                        "twitter": MetadataViews.ExternalURL("aisportspro"),
                        "discord": MetadataViews.ExternalURL("VKvUxMwu5r")
                    }
                )
            case Type<FungibleTokenMetadataViews.FTVaultData>():
                return FungibleTokenMetadataViews.FTVaultData(
                    storagePath: aiSportsJuice.VaultStoragePath,
                    receiverPath: aiSportsJuice.ReceiverPublicPath,
                    metadataPath: aiSportsJuice.VaultPublicPath,
                    receiverLinkedType: Type<&Vault>(),
                    metadataLinkedType: Type<&Vault>(),
                    createEmptyVaultFunction: (fun(): @{FungibleToken.Vault} {
                        return <-aiSportsJuice.createEmptyVault(vaultType: Type<@Vault>())
                    })
                )
            case Type<FungibleTokenMetadataViews.TotalSupply>():
                return FungibleTokenMetadataViews.TotalSupply(
                    totalSupply: aiSportsJuice.totalSupply
                )
        }
        return nil
    }

    init() {

      // Contract Variables
      self.totalSupply = 100000.0 //hardcoded
      self.maxSupply = 10000000000.0 //hardcoded

      // Paths
      self.VaultStoragePath = /storage/aiSportsJuiceVault
      self.ReceiverPublicPath = /public/aiSportsJuiceReceiver
      self.VaultPublicPath = /public/aiSportsJuiceMetadata
      self.MinterStoragePath = /storage/aiSportsJuiceMinter
      self.AdministratorStoragePath = /storage/aiSportsJuiceAdmin
 
      // Admin Setup
      let vault <- create Vault(balance: self.totalSupply)
      self.account.storage.save(<- vault, to: self.VaultStoragePath)

      let publicCap = self.account.capabilities.storage.issue<&Vault>(self.VaultStoragePath)
      self.account.capabilities.publish(publicCap, at: self.VaultPublicPath)

      let receiverCap = self.account.capabilities.storage.issue<&Vault>(self.VaultStoragePath)
      self.account.capabilities.publish(receiverCap, at: self.ReceiverPublicPath)

      self.account.storage.save(<- create Administrator(), to: self.AdministratorStoragePath)
      self.account.storage.save(<-create Minter(), to: self.MinterStoragePath)

    }
}
 