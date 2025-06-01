import { useState, useEffect } from 'react';
import * as fcl from "@onflow/fcl";

export function useFlowUser() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
  }, []);

  useEffect(() => {
    if (user?.addr) {
      const getBalance = async () => {
        try {
          const balance = await fcl.query({
            cadence: `
              import FungibleToken from 0xFungibleToken
              import FlowToken from 0xFlowToken

              pub fun main(address: Address): UFix64 {
                let account = getAccount(address)
                let vaultRef = account.getCapability(/public/flowTokenBalance)
                              .borrow<&FlowToken.Vault{FungibleToken.Balance}>()
                              ?? panic("Could not borrow Balance reference")
                return vaultRef.balance
              }
            `,
            args: (arg, t) => [arg(user.addr, t.Address)],
          });
          setBalance(balance);
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      };
      getBalance();
    }
  }, [user?.addr]);

  return {
    user,
    balance,
    logIn: fcl.authenticate,
    logOut: fcl.unauthenticate,
    signUp: fcl.signUp,
  };
} 