import "FungibleToken"

access(all) contract FlowToken: FungibleToken {
    /// Total supply of Flow tokens in existence
    access(all) var totalSupply: UFix64

    /// Storage and Public Paths
    access(all) let VaultStoragePath: StoragePath
    access(all) let VaultPublicPath: PublicPath
    access(all) let ReceiverPublicPath: PublicPath

    /// TokensInitialized
    ///
    /// The event that is emitted when the contract is created
    access(all) event TokensInitialized(initialSupply: UFix64)

    /// TokensWithdrawn
    ///
    /// The event that is emitted when tokens are withdrawn from a Vault
    access(all) event TokensWithdrawn(amount: UFix64, from: Address?)

    /// TokensDeposited
    ///
    /// The event that is emitted when tokens are deposited to a Vault
    access(all) event TokensDeposited(amount: UFix64, to: Address?)

    /// Provider
    ///
    /// The interface that enforces the requirements for withdrawing
    /// tokens from the implementing type.
    ///
    /// It does not enforce requirements on `balance` here,
    /// because having an `balance` field in an interface would mean
    /// that every time the `balance` of a concrete type changes,
    /// the interface would have to be copied and rewritten, which would be
    /// extremely expensive.
    access(all) resource interface Provider {
        access(all) fun withdraw(amount: UFix64): @Vault {
            post {
                // `result` refers to the return value of the function
                result.balance == amount:
                    "Withdrawal amount must be the same as the balance of the withdrawn Vault"
            }
        }
    }

    /// Receiver
    ///
    /// The interface that enforces the requirements for depositing
    /// tokens into the implementing type.
    access(all) resource interface Receiver {
        access(all) fun deposit(from: @Vault)
    }

    /// Balance
    ///
    /// The interface that contains the `balance` field of the Vault
    /// and enforces that when new Vaults are created, the balance
    /// is initialized correctly.
    access(all) resource interface Balance {
        access(all) var balance: UFix64
    }

    /// Vault
    ///
    /// The resource that contains the functions to send and receive tokens.
    access(all) resource Vault: Provider, Receiver, Balance {
        /// The total balance of the vault
        access(all) var balance: UFix64

        // Initialize the balance at resource creation time
        init(balance: UFix64) {
            self.balance = balance
        }

        /// withdraw
        ///
        /// Function that takes an amount as an argument
        /// and withdraws that amount from the vault.
        ///
        /// It creates a new vault with the withdrawn tokens
        /// and returns that vault to the calling context.
        access(all) fun withdraw(amount: UFix64): @Vault {
            self.balance = self.balance - amount
            emit TokensWithdrawn(amount: amount, from: self.owner?.address)
            return <-create Vault(balance: amount)
        }

        /// deposit
        ///
        /// Function that takes a Vault object as an argument and adds
        /// its balance to the balance of the vault that is executing
        /// the function.
        access(all) fun deposit(from: @Vault) {
            let vault <- from as! @FlowToken.Vault
            self.balance = self.balance + vault.balance
            emit TokensDeposited(amount: vault.balance, to: self.owner?.address)
            vault.balance = 0.0
            destroy vault
        }
    }

    /// createEmptyVault
    ///
    /// Function that creates a new Vault with a balance of zero
    /// and returns it to the calling context.
    access(all) fun createEmptyVault(): @Vault {
        return <-create Vault(balance: 0.0)
    }

    init() {
        self.totalSupply = 0.0
        self.VaultStoragePath = /storage/flowTokenVault
        self.VaultPublicPath = /public/flowTokenBalance
        self.ReceiverPublicPath = /public/flowTokenReceiver

        // Create the Vault with the total supply of tokens and save it in storage
        let vault <- create Vault(balance: self.totalSupply)
        self.account.save(<-vault, to: self.VaultStoragePath)

        // Create a public capability to the stored Vault that only exposes
        // the `balance` field through the `Balance` interface
        self.account.link<&FlowToken.Vault{FungibleToken.Balance}>(
            self.VaultPublicPath,
            target: self.VaultStoragePath
        )

        // Create a public capability to the stored Vault that only exposes
        // the `deposit` method through the `Receiver` interface
        self.account.link<&FlowToken.Vault{FungibleToken.Receiver}>(
            self.ReceiverPublicPath,
            target: self.VaultStoragePath
        )

        emit TokensInitialized(initialSupply: self.totalSupply)
    }
} 