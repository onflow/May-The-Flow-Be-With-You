import React, { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';
import './TarotCard.css';

const TarotCard = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [user, setUser] = useState(null);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const cards = [
    'chariot', 'emperor', 'fool', 'hermit', 'high',
    'justice', 'magician', 'star', 'sun', 'tower'
  ];

  useEffect(() => {
    fcl.config({
      'accessNode.api': 'https://rest-testnet.onflow.org',
      'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn'
    });
    fcl.currentUser().subscribe(setUser);
  }, []);

  const isConnected = user?.loggedIn && !!user?.addr;

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      await fcl.authenticate();
    } catch (error) {
      setError('Failed to connect wallet. Please try again.');
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await fcl.unauthenticate();
      setSelectedCard(null);
      setIsFlipped(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCardClick = () => {
    if (!isConnected) {
      setError('Please connect your wallet first.');
      return;
    }
    if (!isFlipped) {
      const randomIndex = Math.floor(Math.random() * cards.length);
      setSelectedCard(cards[randomIndex]);
      setError(null);
    }
    setIsFlipped(!isFlipped);
  };

  const mintTarotCard = async () => {
    if (!isConnected || !selectedCard) return;

    setIsMinting(true);
    setError(null);

    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import TarotV2 from 0x5cd3bc2df674f42f
          transaction(cardName: String) {
            prepare(acct: AuthAccount) {
              TarotV2.mintCard(cardName: cardName, owner: acct.address)
            }
          }
        `,
        args: (arg, t) => [arg(selectedCard, t.String)],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 999
      });

      await fcl.tx(transactionId).onceSealed();
      alert(`✨ Your Tarot card "${selectedCard}" has been minted!`);
    } catch (error) {
      setError('Minting failed. Please try again.');
      console.error(error);
    } finally {
      setIsMinting(false);
    }
  };

  const shortAddr = user?.addr
    ? `${user.addr.slice(0, 6)}...${user.addr.slice(-4)}`
    : '';

  return (
    <div className="tarot-container">
      {/* Wallet UI fixed to top right */}
      <div className="wallet-ui">
        {!isConnected ? (
          <button 
            onClick={connectWallet} 
            className="connect-wallet-btn"
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div className="wallet-connected">
            <span>{shortAddr}</span>
            <button onClick={disconnectWallet}>Disconnect</button>
          </div>
        )}
      </div>

      {/* Main Tarot Card Area */}
      <div className="card-section">
        {error && <div className="error-message">{error}</div>}

        <div 
          className={`card ${isFlipped ? 'flipped' : ''}`}
          onClick={handleCardClick}
        >
          <div className="card-inner">
            <div className="card-front">
              <img src="/cards/backcard.png" alt="Card Back" />
            </div>
            <div className="card-back">
              {selectedCard && (
                <img src={`/cards/${selectedCard}.png`} alt={`${selectedCard} Tarot`} />
              )}
            </div>
          </div>
        </div>

        {isFlipped && selectedCard && isConnected && (
          <button 
            onClick={mintTarotCard}
            disabled={isMinting}
            className="mint-btn"
          >
            {isMinting ? 'Minting...' : 'Mint Tarot Card'}
          </button>
        )}
      </div>
    </div>
  );
};

export default TarotCard;
