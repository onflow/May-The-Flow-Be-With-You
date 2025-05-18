import ChainRaffle from 0xd6b1d5f6fd9cbe94
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

transaction(name: String, ticketPrice: UFix64, maxTickets: UInt64, durationInSeconds: UFix64) {
    prepare(signer: AuthAccount) {
        ChainRaffle.createRaffle(
            name: name,
            ticketPrice: ticketPrice,
            maxTickets: maxTickets,
            durationInSeconds: durationInSeconds
        )
    }
} 