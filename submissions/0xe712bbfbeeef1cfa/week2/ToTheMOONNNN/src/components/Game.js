import React, { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';
import { useWallet } from '../hooks/useWallet';

const Game = () => {
  const { user, connectWallet } = useWallet();
  const [thrustPoints, setThrustPoints] = useState(0);
  const [clickMultiplier, setClickMultiplier] = useState(1);
  const [autoThrusters, setAutoThrusters] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Constants from the smart contract
  const BOOSTER_COST = 10;
  const AUTO_THRUSTER_COST = 50;

  useEffect(() => {
    if (user?.addr) {
      loadPlayerState();
    }
  }, [user]);

  const loadPlayerState = async () => {
    try {
      const result = await fcl.query({
        cadence: `
          import ClickToMoon from 0xClickToMoon
          
          pub fun main(address: Address): {String: UFix64} {
            let playerStorage = getAccount(address).getCapability(/public/playerStorage)
              .borrow<&ClickToMoon.PlayerStorage>() ?? panic("No player found")
            
            if let player = playerStorage.player {
              return {
                "thrustPoints": player.thrustPoints,
                "clickMultiplier": player.clickMultiplier,
                "autoThrusters": player.autoThrusters
              }
            }
            return {
              "thrustPoints": 0.0,
              "clickMultiplier": 1.0,
              "autoThrusters": 0.0
            }
          }
        `,
        args: (arg, t) => [arg(user.addr, t.Address)]
      });

      setThrustPoints(Number(result.thrustPoints));
      setClickMultiplier(Number(result.clickMultiplier));
      setAutoThrusters(Number(result.autoThrusters));
    } catch (error) {
      console.error('Error loading player state:', error);
    }
  };

  const handleClick = async () => {
    if (!user?.addr) return;

    try {
      setIsLoading(true);
      const transactionId = await fcl.mutate({
        cadence: `
          import ClickToMoon from 0xClickToMoon
          
          transaction {
            prepare(acct: AuthAccount) {
              let playerStorage = acct.borrow<&ClickToMoon.PlayerStorage>(from: /storage/playerStorage)
                ?? panic("No player storage found")
              
              if let player = playerStorage.player {
                player.generateThrust()
              }
            }
          }
        `,
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 999
      });

      await fcl.tx(transactionId).onceSealed();
      await loadPlayerState();
    } catch (error) {
      console.error('Error generating thrust:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseUpgrade = async (upgradeType) => {
    if (!user?.addr) return;

    try {
      setIsLoading(true);
      const transactionId = await fcl.mutate({
        cadence: `
          import ClickToMoon from 0xClickToMoon
          
          transaction(upgradeType: String) {
            prepare(acct: AuthAccount) {
              let playerStorage = acct.borrow<&ClickToMoon.PlayerStorage>(from: /storage/playerStorage)
                ?? panic("No player storage found")
              
              if let player = playerStorage.player {
                if upgradeType == "Booster" {
                  player.purchaseBooster()
                } else if upgradeType == "AutoThruster" {
                  player.purchaseAutoThruster()
                }
              }
            }
          }
        `,
        args: (arg, t) => [arg(upgradeType, t.String)],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 999
      });

      await fcl.tx(transactionId).onceSealed();
      await loadPlayerState();
    } catch (error) {
      console.error('Error purchasing upgrade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.addr) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-4xl font-bold mb-8">Click to Moon 🚀</h1>
        <button
          onClick={connectWallet}
          className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect Wallet to Play
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-8">Click to Moon 🚀</h1>
      
      <div className="text-2xl mb-8">
        Thrust Points: {thrustPoints.toFixed(2)}
      </div>

      <button
        onClick={handleClick}
        disabled={isLoading}
        className="w-32 h-32 mb-8 bg-red-600 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        🚀
      </button>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl mb-2">Booster</h3>
          <p className="mb-2">Cost: {BOOSTER_COST} thrust</p>
          <p className="mb-4">Current multiplier: {clickMultiplier}x</p>
          <button
            onClick={() => purchaseUpgrade("Booster")}
            disabled={isLoading || thrustPoints < BOOSTER_COST}
            className="w-full px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Purchase
          </button>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl mb-2">Auto-Thruster</h3>
          <p className="mb-2">Cost: {AUTO_THRUSTER_COST} thrust</p>
          <p className="mb-4">Owned: {autoThrusters}</p>
          <button
            onClick={() => purchaseUpgrade("AutoThruster")}
            disabled={isLoading || thrustPoints < AUTO_THRUSTER_COST}
            className="w-full px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Purchase
          </button>
        </div>
      </div>
    </div>
  );
};

export default Game; 