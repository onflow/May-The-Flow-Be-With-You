import { useState } from 'react';
import './App.css'
import Quiz from './components/Quiz'
import SaveScoreButton from './components/SaveScoreButton';
import { ethers } from 'ethers';

const CONTRACT_ABI = [
  "function highestScore(address user) view returns (uint256)"
];
const CONTRACT_ADDRESS = "0x0814533238C77dEb4feF6734443712219233327f";

const ConnectWallet = ({ onConnect, onDisconnect, onRefresh, account, latestScore, loading, animateScore }) => (
  <div className="mb-8 flex flex-col items-center">
    {!account ? (
      <button
        onClick={onConnect}
        className="bg-yellow-400 text-black px-4 py-2 rounded font-semibold mb-2"
      >
        Connect Wallet
      </button>
    ) : (
      <>
        <div className="mb-1 text-gray-800 font-semibold">
          Wallet: <span className="font-mono">{account.slice(0, 6)}...{account.slice(-4)}</span>
        </div>
        <div className="mb-1 text-green-700 font-semibold">
          <span className={animateScore ? "transition-all duration-500 ease-in-out bg-yellow-200 px-2 rounded" : ""}>
            Latest On-Chain Score: {loading ? 'Loading...' : latestScore !== null ? latestScore : 'N/A'}
          </span>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={onDisconnect}
            className="bg-red-500 text-black px-4 py-2 rounded font-semibold"
          >
            Disconnect
          </button>
          <button
            onClick={onRefresh}
            className="bg-gray-200 text-black px-4 py-2 rounded font-semibold border border-gray-400"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </>
    )}
  </div>
);

function App() {
  const [account, setAccount] = useState(null);
  const [latestScore, setLatestScore] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [loading, setLoading] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);

  const handleConnectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      await fetchLatestScore(accounts[0]);
    } catch (err) {
      // Optionally handle error
    }
  };

  const handleDisconnectWallet = () => {
    setAccount(null);
    setLatestScore(null);
  };

  const handleRefreshScore = async () => {
    setRefreshFlag(f => f + 1);
    setAnimateScore(true);
    if (account) {
      await fetchLatestScore(account);
    }
    setTimeout(() => setAnimateScore(false), 600);
  };

  const fetchLatestScore = async (userAddress) => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const score = await contract.highestScore(userAddress);
      setLatestScore(score.toString());
    } catch (err) {
      setLatestScore(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-green-800 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-2">Breaking Bad Quiz</h1>
          <p className="text-xl text-green-100">Test your knowledge of the greatest TV series!</p>
        </div>
      </header>
      <main className="max-w-4xl mx-auto py-8 px-4">
        <ConnectWallet onConnect={handleConnectWallet} onDisconnect={handleDisconnectWallet} onRefresh={handleRefreshScore} account={account} latestScore={latestScore} loading={loading} animateScore={animateScore} />
        <Quiz account={account} refreshFlag={refreshFlag} />
      </main>
    </div>
  )
}

export default App
