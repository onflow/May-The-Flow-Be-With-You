import React, { useState, useEffect } from 'react';
import * as fcl from "@onflow/fcl";

// Configure FCL
fcl.config({
  "app.detail.title": "ChainRaffle",
  "app.detail.icon": "https://placekitten.com/g/200/200",
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "0xChainRaffle": "0xca4c54eb195b5e0d" // Your deployed contract address
})

function App() {
  const [user, setUser] = useState({ loggedIn: false });
  const [activeRaffles, setActiveRaffles] = useState([]);
  const [newRaffle, setNewRaffle] = useState({
    name: '',
    ticketPrice: '',
    maxTickets: '',
    duration: ''
  });
  const [ticketsToBuy, setTicketsToBuy] = useState(1);

  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
    if (user.loggedIn) {
      fetchActiveRaffles();
    }
  }, [user.loggedIn]);

  const fetchActiveRaffles = async () => {
    try {
      const response = await fcl.query({
        cadence: `
          import ChainRaffle from 0xChainRaffle

          pub fun main(): [ChainRaffle.Raffle] {
            return ChainRaffle.getActiveRaffles()
          }
        `
      });
      setActiveRaffles(response);
    } catch (error) {
      console.error("Error fetching raffles:", error);
    }
  };

  // Helper function to format numbers as UFix64
  const formatUFix64 = (value) => {
    // Ensure the value has a decimal point and at least one decimal place
    if (!value.includes('.')) {
      value = value + '.0';
    }
    return value;
  };

  const createRaffle = async (e) => {
    e.preventDefault();
    try {
      // Format the ticket price and duration as UFix64
      const formattedTicketPrice = formatUFix64(newRaffle.ticketPrice);
      const formattedDuration = formatUFix64(newRaffle.duration);

      const transactionId = await fcl.mutate({
        cadence: `
          import ChainRaffle from 0xChainRaffle

          transaction(name: String, ticketPrice: UFix64, maxTickets: UInt64, duration: UFix64) {
            prepare(acct: AuthAccount) {
              ChainRaffle.createRaffle(
                name: name,
                ticketPrice: ticketPrice,
                maxTickets: maxTickets,
                durationInSeconds: duration
              )
            }
          }
        `,
        args: (arg, t) => [
          arg(newRaffle.name, t.String),
          arg(formattedTicketPrice, t.UFix64),
          arg(newRaffle.maxTickets, t.UInt64),
          arg(formattedDuration, t.UFix64)
        ],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 9999
      });
      
      await fcl.tx(transactionId).onceSealed();
      fetchActiveRaffles();
      setNewRaffle({ name: '', ticketPrice: '', maxTickets: '', duration: '' });
    } catch (error) {
      console.error("Error creating raffle:", error);
      alert("Error creating raffle: " + error.message);
    }
  };

  const purchaseTickets = async (raffleId, ticketPrice) => {
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import ChainRaffle from 0xChainRaffle
          import FlowToken from 0x7e60df042a9c0868
          import FungibleToken from 0x9a0766d93b6608b7

          transaction(raffleId: UInt64, numTickets: UInt64) {
            let payment: @FlowToken.Vault
            
            prepare(acct: AuthAccount) {
              let vaultRef = acct.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
                  ?? panic("Could not borrow Flow token vault reference")
              
              // Calculate total cost
              let totalCost = UFix64(numTickets) * ChainRaffle.getRaffle(raffleId: raffleId)?.ticketPrice!
              
              // Withdraw payment
              self.payment <- vaultRef.withdraw(amount: totalCost)
            }

            execute {
              // Purchase tickets with payment
              ChainRaffle.purchaseTickets(
                raffleId: raffleId,
                numTickets: numTickets,
                payment: <-self.payment
              )
            }
          }
        `,
        args: (arg, t) => [
          arg(raffleId, t.UInt64),
          arg(ticketsToBuy, t.UInt64)
        ],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 9999
      });
      
      await fcl.tx(transactionId).onceSealed();
      fetchActiveRaffles();
    } catch (error) {
      console.error("Error purchasing tickets:", error);
      alert("Error purchasing tickets: " + error.message);
    }
  };

  const drawWinner = async (raffleId) => {
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import ChainRaffle from 0xChainRaffle

          transaction(raffleId: UInt64) {
            prepare(acct: AuthAccount) {
              ChainRaffle.drawWinner(raffleId: raffleId)
            }
          }
        `,
        args: (arg, t) => [arg(raffleId, t.UInt64)],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 9999
      });
      
      await fcl.tx(transactionId).onceSealed();
      fetchActiveRaffles();
    } catch (error) {
      console.error("Error drawing winner:", error);
      alert("Error drawing winner: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-3xl font-bold mb-8">ChainRaffle</h1>
                
                {!user.loggedIn ? (
                  <button
                    onClick={fcl.logIn}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Log In
                  </button>
                ) : (
                  <div>
                    <button
                      onClick={fcl.unauthenticate}
                      className="bg-red-500 text-white px-4 py-2 rounded mb-4"
                    >
                      Log Out
                    </button>
                    
                    {/* Create Raffle Form */}
                    <form onSubmit={createRaffle} className="space-y-4 mb-8">
                      <input
                        type="text"
                        placeholder="Raffle Name"
                        value={newRaffle.name}
                        onChange={(e) => setNewRaffle({...newRaffle, name: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        required
                      />
                      <input
                        type="number"
                        step="0.000001"
                        placeholder="Ticket Price (FLOW)"
                        value={newRaffle.ticketPrice}
                        onChange={(e) => setNewRaffle({...newRaffle, ticketPrice: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        required
                        min="0.000001"
                      />
                      <input
                        type="number"
                        placeholder="Max Tickets"
                        value={newRaffle.maxTickets}
                        onChange={(e) => setNewRaffle({...newRaffle, maxTickets: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        required
                        min="1"
                      />
                      <input
                        type="number"
                        placeholder="Duration (seconds)"
                        value={newRaffle.duration}
                        onChange={(e) => setNewRaffle({...newRaffle, duration: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        required
                        min="60"
                      />
                      <button
                        type="submit"
                        className="bg-green-500 text-white px-4 py-2 rounded w-full"
                      >
                        Create Raffle
                      </button>
                    </form>

                    {/* Active Raffles */}
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">Active Raffles</h2>
                      {activeRaffles.map((raffle) => (
                        <div key={raffle.id} className="border p-4 rounded">
                          <h3 className="font-bold">{raffle.name}</h3>
                          <p>Price: {raffle.ticketPrice} FLOW</p>
                          <p>Tickets: {Object.keys(raffle.tickets).length}/{raffle.maxTickets}</p>
                          <p>Total Prize: {raffle.totalPrize} FLOW</p>
                          <div className="mt-2 space-x-2">
                            <input
                              type="number"
                              min="1"
                              value={ticketsToBuy}
                              onChange={(e) => setTicketsToBuy(parseInt(e.target.value))}
                              className="w-20 px-2 py-1 border rounded"
                            />
                            <button
                              onClick={() => purchaseTickets(raffle.id, raffle.ticketPrice)}
                              className="bg-blue-500 text-white px-4 py-2 rounded"
                            >
                              Buy Tickets
                            </button>
                            {new Date().getTime() / 1000 > raffle.endTime && (
                              <button
                                onClick={() => drawWinner(raffle.id)}
                                className="bg-purple-500 text-white px-4 py-2 rounded"
                              >
                                Draw Winner
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 