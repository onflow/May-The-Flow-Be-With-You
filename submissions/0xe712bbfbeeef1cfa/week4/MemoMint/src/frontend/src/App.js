import React, { useState, useEffect, useRef } from 'react';
import { fcl } from '@onflow/fcl';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';

// Initialize Flow
fcl.config()
  .put('accessNode.api', process.env.REACT_APP_FLOW_ACCESS_NODE)
  .put('0xNonFungibleToken', process.env.REACT_APP_NON_FUNGIBLE_TOKEN_ADDRESS)
  .put('0xMemoMint', process.env.REACT_APP_MEMO_MINT_ADDRESS);

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(uuidv4());
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogin = async () => {
    try {
      const user = await fcl.logIn();
      setUser(user);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fcl.unauthenticate();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/api/chat', {
        message: userMessage,
        sessionId
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/summarize', {
        sessionId
      });
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintNFT = async () => {
    if (!user || !summary) return;

    try {
      const response = await axios.post('http://localhost:3001/api/mint', {
        summary,
        address: user.addr
      });

      alert(`NFT minted successfully! Transaction ID: ${response.data.transactionId}`);
    } catch (error) {
      console.error('Error minting NFT:', error);
      alert('Failed to mint NFT. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">MemoMint</h1>
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Connected: {user.addr}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="h-[500px] overflow-y-auto mb-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
                } max-w-[80%]`}
              >
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ))}
            {isLoading && (
              <div className="text-center text-gray-500">Thinking...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded"
              disabled={!user || isLoading}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
              disabled={!user || isLoading}
            >
              Send
            </button>
          </form>
        </div>

        {messages.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Summary</h2>
            {summary ? (
              <div className="mb-4">
                <ReactMarkdown>{summary}</ReactMarkdown>
                {user && (
                  <button
                    onClick={handleMintNFT}
                    className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Mint as NFT
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleGenerateSummary}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                disabled={isLoading}
              >
                Generate Summary
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App; 