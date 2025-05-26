import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

access(all) contract DelegationPoolV2 {

    access(all) let PoolStoragePath: StoragePath
    access(all) let PoolPublicPath: PublicPath
    access(all) let DelegatorStoragePath: StoragePath

    access(all) let DelegatorPublicPath: PublicPath

    access(all) var totalDelegated: UFix64

    access(all) resource interface DelegatorPublic {
        access(all) var balance: UFix64
    }

    access(all) resource Delegator: DelegatorPublic {
        access(all) var balance: UFix64
        access(self) var vault: @FlowToken.Vault

        init() {
            self.balance = 0.0
            self.vault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
        }

        access(all) fun deposit(from: @{FungibleToken.Vault}) {
            let flowVault <- from as! @FlowToken.Vault
            self.balance = self.balance + flowVault.balance
            self.vault.deposit(from: <-flowVault)
        }

        access(all) fun withdraw(amount: UFix64): @FlowToken.Vault {
            pre {
                amount <= self.balance: "Insufficient delegated balance"
            }
            self.balance = self.balance - amount
            return <-self.vault.withdraw(amount: amount) as! @FlowToken.Vault
        }
    }

    access(all) resource interface PoolPublic {
        access(all) fun depositToPool(from: @{FungibleToken.Vault})
        access(all) fun addRewardTokens(from: @{FungibleToken.Vault})
        access(all) fun delegate(delegator: auth(Storage, BorrowValue) &Account, amount: UFix64)
        access(all) fun claimRewards(delegator: Address): @FlowToken.Vault
    }

    access(all) resource Pool: PoolPublic {
        access(self) var vault: @FlowToken.Vault
        access(self) var delegators: {Address: UFix64}
        access(self) var lastRewardTime: UFix64

        init() {
            self.vault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
            self.delegators = {}
            self.lastRewardTime = getCurrentBlock().timestamp
        }

        access(all) fun depositToPool(from: @{FungibleToken.Vault}) {
            let flowVault <- from as! @FlowToken.Vault
            self.vault.deposit(from: <-flowVault)
        }

        access(all) fun addRewardTokens(from: @{FungibleToken.Vault}) {
            let flowVault <- from as! @FlowToken.Vault
            self.vault.deposit(from: <-flowVault)
        }

        access(all) fun delegate(delegator: auth(Storage, BorrowValue) &Account, amount: UFix64) {
            let delegatorVaultRef = delegator.storage.borrow<&Delegator>(from: DelegationPoolV2.DelegatorStoragePath)
                ?? panic("Delegator resource not found")

            // Get a reference to the delegator's FlowToken vault with Withdraw authorization
            let vaultRef = delegator.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
                ?? panic("Flow Token Vault not found")

            let vault <- vaultRef.withdraw(amount: amount)

            delegatorVaultRef.deposit(from: <-vault)

            self.delegators[delegator.address] = (self.delegators[delegator.address] ?? 0.0) + amount
            DelegationPoolV2.totalDelegated = DelegationPoolV2.totalDelegated + amount
        }

        access(all) fun claimRewards(delegator: Address): @FlowToken.Vault {
            pre {
                self.delegators.containsKey(delegator): "Delegator not found"
            }

            let currentTime = getCurrentBlock().timestamp
            let weeksPassed = (currentTime - self.lastRewardTime) / 604800.0
            let rewardPercentage = weeksPassed * 0.01

            let delegatedAmount = self.delegators[delegator]!
            let rewardAmount = delegatedAmount * rewardPercentage

            self.delegators[delegator] = delegatedAmount - rewardAmount
            DelegationPoolV2.totalDelegated = DelegationPoolV2.totalDelegated - rewardAmount

            return <-self.vault.withdraw(amount: rewardAmount) as! @FlowToken.Vault
        }
    }

    init() {
        self.PoolStoragePath = /storage/DelegationPoolV2
        self.PoolPublicPath = /public/DelegationPoolV2
        self.DelegatorStoragePath = /storage/DelegatorV2
        self.DelegatorPublicPath = /public/DelegatorV2
        self.totalDelegated = 0.0

        let pool <- create Pool()
        self.account.storage.save(<-pool, to: self.PoolStoragePath)

        let cap = self.account.capabilities.storage.issue<&{PoolPublic}>(self.PoolStoragePath)
        self.account.capabilities.publish(cap, at: self.PoolPublicPath)
    }

    access(all) fun createDelegator(): @Delegator {
        return <-create Delegator()
    }
}