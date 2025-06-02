'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import * as fcl from '@onflow/fcl';
import { getGiftCardsForAddress } from '@/utils/flow';

interface GiftCard {
  id: number;
  value: string;
  message: string;
  imageURL: string;
  status: { rawValue: string };
  recipient: string;
}

import {
  useCurrentFlowUser,
  useFlowTransactionStatus
} from "@onflow/kit";

export default function MyGiftCards() {
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState<number | null>(null);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [txId, setTxId] = useState('');
  const { user } = useCurrentFlowUser();

  useEffect(() => {
    if (user && user.loggedIn) {
      loadGiftCards();
    }
  }, [user]);

  const loadGiftCards = async () => {
    if (!user || !user.loggedIn) return;

    setLoading(true);
    try {
      const cards = await getGiftCardsForAddress(user.addr || '');
      console.log(cards);
      setGiftCards(cards);
    } catch (error) {
      console.error('Error loading gift cards:', error);
      toast.error('Failed to load gift cards');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (id: number) => {
    if (!user || !user.loggedIn) {
      toast.error('Please connect your wallet first');
      return;
    }

    setWithdrawing(id);
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import FungibleToken from 0x9a0766d93b6608b7
          import FlowToken from 0x7e60df042a9c0868
          import GiftCard from 0x2196c8fac03820bf

          transaction(giftCardId: UInt64) {
              let giftCardManager: &{GiftCard.GiftCardPublic}
              let recipientCapability: &{FungibleToken.Receiver}

              prepare(signer: auth(BorrowValue, Storage) &Account) {
                  let giftCardAccount = getAccount(0x2196c8fac03820bf)
                  // Get the gift card manager
                  self.giftCardManager = giftCardAccount
                      .capabilities
                      .borrow<&{GiftCard.GiftCardPublic}>(GiftCard.GiftCardPublicPath)
                      ?? panic("Could not borrow a reference to the GiftCardPublic capability")

                  self.recipientCapability = signer
                      .capabilities.borrow<&{FungibleToken.Receiver}>(
                          /public/flowTokenReceiver
                      ) ?? panic("Could not borrow recipient's FlowToken Receiver capability.")
              }

              execute {
                  // Withdraw the gift card and deposit the tokens
                  let withdrawnVault <- self.giftCardManager.withdrawGiftCard(id: giftCardId)

                  // Deposit the withdrawn tokens into the recipient's vault
                  self.recipientCapability.deposit(from: <-withdrawnVault)
              }
          } 
        `,
        args: (arg: any, t: any) => [arg(id, t.UInt64)],
        payer: fcl.currentUser,
        proposer: fcl.currentUser,
        authorizations: [fcl.currentUser],
      });
      setTxId(transactionId);

      toast.success(`Withdrawal is processed! Transaction ID: ${transactionId}`);
      await loadGiftCards(); // Reload the cards to update the status
    } catch (error) {
      console.error('Error withdrawing gift card:', error);
      toast.error('Failed to withdraw gift card');
    } finally {
      setWithdrawing(null);
    }
  };

  const { transactionStatus, error: txStatusError } = useFlowTransactionStatus(
    { id: txId || "" },
  );

  useEffect(() => {
    if (txId && transactionStatus?.status === 4 && !txStatusError) {
      toast.success(`Transaction ${txId} is successful`);
      loadGiftCards();
    } else if (txStatusError) {
      toast.error(`Transaction ${txId} has failed : ${txStatusError.message}`);
    }
  }, [transactionStatus?.status, txId, txStatusError]);

  if (!user || !user.loggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Gift Cards</h1>
          <p className="text-gray-600">Please connect your wallet to view your gift cards</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Gift Cards</h1>
        </div>

        {loading ? (
          <div className="text-center">Loading your gift cards...</div>
        ) : giftCards.length === 0 ? (
          <div className="text-center text-gray-500">No gift cards found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {giftCards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <img
                  src={card.imageURL}
                  alt="Gift Card"
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">
                      {card.value} FLOW
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        card.status.rawValue === "0"
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {card.status.rawValue === "0" ? "Allocated" : "Withdrawn"}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{card.message}</p>
                  {card.status.rawValue === "0" && (
                    <button
                      onClick={() => handleWithdraw(card.id)}
                      disabled={withdrawing === card.id}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {withdrawing === card.id ? 'Withdrawing...' : 'Withdraw'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 