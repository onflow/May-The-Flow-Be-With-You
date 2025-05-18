import React, { useState, useRef, useEffect } from 'react';
import { FaXTwitter } from 'react-icons/fa6';
import { FaGlobe } from 'react-icons/fa';
import * as fcl from "@onflow/fcl";
import './InfoPanel.css';

// Your contract address - replace this with your actual deployed contract address
const CONTRACT_ADDRESS = "dfab49498c36d959"; // Replace this with your actual contract address

// Configure FCL
fcl.config({
  "accessNode.api": "https://rest-testnet.onflow.org", // Testnet
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn" // Testnet wallet discovery
})

interface FrameData {
  id: number;
  title: string;
  description: string;
  status: 'unlocked';
  xLink: string;
  websiteLink: string;
}

interface InfoPanelProps {
  selectedFrame: number | null;
  frameData: FrameData | null;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ selectedFrame, frameData }) => {
  // Use refs to maintain input values without re-rendering on every keystroke
  const clueRefs = useRef<Array<string>>(["", "", "", "", ""]);
  const [isClueModalOpen, setIsClueModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Add new state variables for contract interaction
  const [verificationResults, setVerificationResults] = useState<boolean[]>([false, false, false, false, false]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [allWordsCorrect, setAllWordsCorrect] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [showError, setShowError] = useState(false);
  
  // Only used when submitting to trigger a re-render with current values
  const [, forceUpdate] = useState({});

  // Get all words from contract when component mounts
  useEffect(() => {
    const fetchContractWords = async () => {
      try {
        const response = await fcl.query({
          cadence: `
            import WordVerification from 0x${CONTRACT_ADDRESS}
            
            access(all) fun main(): [String] {
              return WordVerification.getAllWords()
            }
          `
        });
        console.log("Words from contract:", response);
      } catch (error) {
        console.error("Error fetching words from contract:", error);
      }
    };
    
    fetchContractWords();
  }, []);

  const handleClueChange = (index: number, value: string) => {
    // Update the ref value without triggering a state change
    clueRefs.current[index] = value;
    // No state update here, so no re-render occurs
    
    // Clear error when user starts typing again
    if (showError) {
      setShowError(false);
    }
  };

  const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWalletAddress(e.target.value);
  };

  const handleSubmitClues = async () => {
    setIsVerifying(true);
    setShowError(false);
    const results: boolean[] = [false, false, false, false, false];
    
    try {
      let hasAnyIncorrect = false;
      let hasAnyCorrect = false;

      // Check each word against the contract
      for (let i = 0; i < 5; i++) {
        const word = clueRefs.current[i].trim().toLowerCase();
        if (!word) continue;
        
        // Verify if the word is at the correct index
        const isCorrect = await fcl.query({
          cadence: `
            import WordVerification from 0x${CONTRACT_ADDRESS}
            
            access(all) fun main(index: Int, word: String): Bool {
              return WordVerification.verifyWordAtIndex(index: index, word: word)
            }
          `,
          args: (arg: any, t: any) => [arg(i.toString(), t.Int), arg(word, t.String)]
        });
        
        results[i] = isCorrect;
        
        if (isCorrect) {
          hasAnyCorrect = true;
        } else {
          hasAnyIncorrect = true;
        }

        // Update input styling based on verification result
        if (inputRefs.current[i]) {
          inputRefs.current[i]!.className = `clue-input ${isCorrect ? 'correct' : 'incorrect'}`;
        }
      }
      
      setVerificationResults(results);
      
      // Show error if any entered word is incorrect
      if (hasAnyIncorrect) {
        setShowError(true);
      }
      
      // Only set allWordsCorrect if all non-empty words are correct
      const allCorrect = results.every((result, index) => result || clueRefs.current[index].trim() === "");
      setAllWordsCorrect(allCorrect && hasAnyCorrect && !hasAnyIncorrect);
      
      // Force a re-render to show the current values and results
      forceUpdate({});
    } catch (error) {
      console.error("Error verifying words:", error);
      setShowError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle clicks outside the modal content
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsClueModalOpen(false);
      }
    };

    if (isClueModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isClueModalOpen]);

  const ClueCard = () => (
    <div className="clue-card">
      <h4>Enter Your Clues</h4>
      <div className="clue-inputs">
        {clueRefs.current.map((clue, index) => (
          <div key={index} className="clue-input-wrapper">
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              defaultValue={clue}
              onChange={(e) => handleClueChange(index, e.target.value)}
              placeholder="______"
              className={`clue-input ${verificationResults[index] ? 'correct' : ''}`}
              maxLength={20}
              onClick={(e) => e.stopPropagation()}
            />
            {verificationResults[index] && (
              <span className="verification-indicator correct">✓</span>
            )}
          </div>
        ))}
      </div>
      
      {showError && (
        <div className="error-message">
          One or more clues are incorrect. Please try again.
        </div>
      )}
      
      <button 
        className="submit-clues-btn" 
        onClick={(e) => {
          e.stopPropagation();
          handleSubmitClues();
        }}
        disabled={isVerifying}
      >
        {isVerifying ? 'Verifying...' : 'Validate Clues'}
      </button>
      
      {allWordsCorrect && (
        <div className="success-container">
          <div className="success-message">
            All clues correct! You've unlocked this frame.
          </div>
          <div className="wallet-input-container">
            <label htmlFor="wallet-address">Enter your wallet address to claim:</label>
            <input
              id="wallet-address"
              type="text"
              value={walletAddress}
              onChange={handleWalletAddressChange}
              placeholder="0x..."
              className="wallet-address-input"
            />
            <button 
              className="claim-btn"
              disabled={!walletAddress}
              onClick={() => {
                // Here you would implement the claim functionality
                console.log(`Claiming to wallet: ${walletAddress}`);
                // You could add a transaction call to the contract here
              }}
            >
              Claim
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (!selectedFrame || !frameData) {
    return (
      <div className="info-panel">
        <div className="welcome-message">
          <h2>Select a Frame</h2>
          <p>Click on any frame in the maze to view its details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="info-panel">
      <h2>META MAZE EXPLORER</h2>
      
      <div className="frame-info">
        <h3>{frameData.title}</h3>
        <p className="frame-description">{frameData.description}</p>
        
        <div className="frame-links">
          <a href={frameData.xLink} target="_blank" rel="noopener noreferrer" className="social-link">
            <FaXTwitter className="social-icon" />
          </a>
          <a href={frameData.websiteLink} target="_blank" rel="noopener noreferrer" className="social-link">
            <FaGlobe className="social-icon" />
          </a>
        </div>
      </div>

      {/* Desktop view */}
      <div className="desktop-clue-card">
        <ClueCard />
      </div>

      {/* Mobile view */}
      <div className="mobile-clue-section">
        <button 
          className="open-clue-modal-btn"
          onClick={() => setIsClueModalOpen(true)}
        >
          Enter Clues
        </button>
      </div>

      {/* Mobile Modal */}
      {isClueModalOpen && (
        <div 
          className="clue-modal-overlay" 
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setIsClueModalOpen(false);
            }
          }}
        >
          <div 
            ref={modalRef}
            className="clue-modal-content"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button 
              className="close-modal-btn"
              onClick={() => setIsClueModalOpen(false)}
            >
              ×
            </button>
            <ClueCard />
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoPanel;