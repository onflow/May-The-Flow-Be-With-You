import React, { useState } from 'react';
import styled from 'styled-components';
import * as fcl from "@onflow/fcl";
import { PLACE_BET_TRANSACTION } from '../utils/cadence';

const BettingContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 15px;
  margin: 2rem 0;
  width: 100%;
  max-width: 400px;
`;

const BetInput = styled.input`
  width: 100%;
  padding: 0.8rem;
  margin: 1rem 0;
  border: 2px solid #00ff88;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  color: white;
  font-size: 1.1rem;
  outline: none;

  &:focus {
    box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
  }
`;

const BetButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: #00ff88;
  border: none;
  border-radius: 8px;
  color: #1a1a2e;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 255, 136, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  margin-top: 0.5rem;
  font-size: 0.9rem;
`;

const BettingPanel = ({ userBalance, onBetPlaced }) => {
  const [betAmount, setBetAmount] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBetChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBetAmount(value);
      setError('');
    }
  };

  const placeBet = async () => {
    if (!betAmount || parseFloat(betAmount) <= 0) {
      setError('Please enter a valid bet amount');
      return;
    }

    if (parseFloat(betAmount) > parseFloat(userBalance)) {
      setError('Insufficient balance');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const txId = await fcl.mutate({
        cadence: PLACE_BET_TRANSACTION,
        args: (arg, t) => [arg(betAmount, t.UFix64)],
        limit: 1000,
      });

      const txStatus = await fcl.tx(txId).onceSealed();
      onBetPlaced(txStatus);
      setBetAmount('');
    } catch (error) {
      setError('Failed to place bet. Please try again.');
      console.error('Betting error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <BettingContainer>
      <h3>Place Your Bet</h3>
      <BetInput
        type="text"
        value={betAmount}
        onChange={handleBetChange}
        placeholder="Enter bet amount in FLOW"
        disabled={isProcessing}
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <BetButton
        onClick={placeBet}
        disabled={isProcessing || !betAmount}
      >
        {isProcessing ? 'Processing...' : 'Place Bet'}
      </BetButton>
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        Available Balance: {userBalance} FLOW
      </div>
    </BettingContainer>
  );
};

export default BettingPanel; 