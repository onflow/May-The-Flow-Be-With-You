access(all) contract interface FungibleToken {
    /// The total supply of all tokens in existence.
    access(all) var totalSupply: UFix64

    /// The event that is emitted when tokens are withdrawn from a Vault
    access(all) event TokensWithdrawn(amount: UFix64, from: Address?)

    /// The event that is emitted when tokens are deposited into a Vault
    access(all) event TokensDeposited(amount: UFix64, to: Address?)

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
                // `result` refers to the return value
                result.balance == amount:
                    "Withdrawal amount must be the same as the balance of the withdrawn Vault"
            }
        }
    }

    /// The interface that enforces the requirements for depositing
    /// tokens into the implementing type.
    access(all) resource interface Receiver {
        access(all) fun deposit(from: @Vault)
    }

    /// The interface that contains both the `Provider` and `Receiver`
    /// interfaces.
    ///
    /// It does not enforce requirements on `balance` here,
    /// because having an `balance` field in an interface would mean
    /// that every time the `balance` of a concrete type changes,
    /// the interface would have to be copied and rewritten, which would be
    /// extremely expensive.
    access(all) resource interface Balance {
        access(all) var balance: UFix64
    }

    /// The resource that contains the functions to send and receive tokens.
    ///
    access(all) resource Vault: Provider, Receiver, Balance {
        /// The total balance of the vault
        access(all) var balance: UFix64

        /// Initialize the balance at resource creation time
        init(balance: UFix64) {
            self.balance = balance
        }

        /// Withdraw tokens from the vault
        ///
        /// The function's access level is access(all), but this is not a problem
        /// because only the owner of the resource can call this function.
        ///
        /// @param amount: The amount of tokens to be withdrawn from the vault
        /// @return The Vault resource containing the withdrawn funds
        ///
        access(all) fun withdraw(amount: UFix64): @Vault {
            self.balance = self.balance - amount
            emit TokensWithdrawn(amount: amount, from: self.owner?.address)
            return <-create Vault(balance: amount)
        }

        /// Deposit tokens into the vault
        ///
        /// The function's access level is access(all), but this is not a problem
        /// because only the owner of the resource can call this function.
        ///
        /// @param from: The Vault resource containing the tokens to be deposited
        ///
        access(all) fun deposit(from: @Vault) {
            let vault <- from as! @FungibleToken.Vault
            self.balance = self.balance + vault.balance
            emit TokensDeposited(amount: vault.balance, to: self.owner?.address)
            vault.balance = 0.0
            destroy vault
        }
    }

    /// Allows any user to create a new Vault that has a zero balance
    access(all) fun createEmptyVault(): @Vault {
        return <-create Vault(balance: 0.0)
    }
} 