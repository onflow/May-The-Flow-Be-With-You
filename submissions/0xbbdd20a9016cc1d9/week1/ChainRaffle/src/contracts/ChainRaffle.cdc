import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

access(all) contract ChainRaffle {
    access(all) var totalSupply: UInt64

    access(all) resource Raffle {
        access(all) let id: UInt64
        access(all) let name: String
        access(all) let ticketPrice: UFix64
        access(all) let maxTickets: UInt64
        access(all) let startTime: UFix64
        access(all) let endTime: UFix64
        access(all) var totalPrize: UFix64
        access(all) var tickets: {Address: UInt64}
        access(all) var isActive: Bool
        access(all) var winner: Address?
        access(contract) let prizeVault: @FlowToken.Vault

        init(
            id: UInt64,
            name: String,
            ticketPrice: UFix64,
            maxTickets: UInt64,
            startTime: UFix64,
            endTime: UFix64
        ) {
            self.id = id
            self.name = name
            self.ticketPrice = ticketPrice
            self.maxTickets = maxTickets
            self.startTime = startTime
            self.endTime = endTime
            self.totalPrize = 0.0
            self.tickets = {}
            self.isActive = true
            self.winner = nil
            self.prizeVault <- FlowToken.createEmptyVault(balance: 0.0)
        }

        access(all) fun getTicketCount(): UInt64 {
            return UInt64(self.tickets.length)
        }

        access(all) fun setIsActive(_ isActive: Bool) {
            self.isActive = isActive
        }

        access(all) fun addTicket(address: Address) {
            self.tickets[address] = self.getTicketCount()
        }

        access(all) fun setWinner(winner: Address) {
            self.winner = winner
        }

        access(all) fun depositPrize(payment: @FlowToken.Vault) {
            self.prizeVault.deposit(from: <-payment)
            self.totalPrize = self.prizeVault.balance
        }

        access(all) fun withdrawPrize(amount: UFix64): @FlowToken.Vault {
            let vault <- self.prizeVault.withdraw(amount: amount)
            return <-vault
        }
    }

    access(all) var raffles: @{UInt64: Raffle}

    access(all) fun createRaffle(
        name: String,
        ticketPrice: UFix64,
        maxTickets: UInt64,
        startTime: UFix64,
        endTime: UFix64
    ) {
        let raffle <- create Raffle(
            id: self.totalSupply,
            name: name,
            ticketPrice: ticketPrice,
            maxTickets: maxTickets,
            startTime: startTime,
            endTime: endTime
        )
        
        self.raffles[self.totalSupply] <-! raffle

        self.totalSupply = self.totalSupply + 1
    }

    access(all) fun buyTicket(raffleId: UInt64, payment: @FlowToken.Vault) {
        pre {
            self.raffles[raffleId] != nil: "Raffle does not exist"
        }

        let raffle = (&self.raffles[raffleId] as &Raffle?)!
        assert(raffle.isActive, message: "Raffle is not active")
        assert(getCurrentBlock().timestamp >= raffle.startTime, message: "Raffle has not started yet")
        assert(getCurrentBlock().timestamp <= raffle.endTime, message: "Raffle has ended")
        assert(raffle.getTicketCount() < raffle.maxTickets, message: "Raffle is full")
        assert(payment.balance == raffle.ticketPrice, message: "Payment amount must match ticket price")

        // Add ticket to raffle
        raffle.addTicket(address: payment.owner!.address)
        
        // Add payment to prize pool
        raffle.depositPrize(payment: <-payment)
    }

    access(all) fun drawWinner(raffleId: UInt64): Address? {
        pre {
            self.raffles[raffleId] != nil: "Raffle does not exist"
        }

        let raffle = (&self.raffles[raffleId] as &Raffle?)!
        assert(raffle.isActive, message: "Raffle is not active")
        assert(getCurrentBlock().timestamp > raffle.endTime, message: "Raffle has not ended yet")

        let ticketCount = raffle.getTicketCount()
        if ticketCount == 0 {
            raffle.setIsActive(false)
            return nil
        }

        // Get random number using block height
        let randomSeed = getCurrentBlock().height
        let winningTicket = (randomSeed % ticketCount)

        // Find winner
        for address in raffle.tickets.keys {
            if raffle.tickets[address] == winningTicket {
                raffle.setWinner(winner: address)
                raffle.setIsActive(false)

                // Transfer prize to winner
                let winnerAccount = getAccount(address)
                let receiverRef = winnerAccount.capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                    ?? panic("Could not borrow receiver reference")
                
                let prizeVault <- raffle.withdrawPrize(amount: raffle.totalPrize)
                receiverRef.deposit(from: <-prizeVault)
                return address
            }
        }

        return nil
    }

    init() {
        self.totalSupply = 0
        self.raffles <- {}
    }
} 