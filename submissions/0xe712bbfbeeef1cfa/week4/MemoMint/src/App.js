import React, { useState, useEffect, useRef } from 'react';
import {
  authenticate,
  unauthenticate,
  currentUser,
  config,
  query,
  mutate,
  tx
} from '@onflow/fcl';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';
import { FaUser, FaRobot, FaMagic, FaSignOutAlt, FaSignInAlt, FaHistory } from 'react-icons/fa';
import { InferenceClient } from "@huggingface/inference";
import './App.css';

config()
  .put('accessNode.api', process.env.REACT_APP_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
  .put('0xMemoMint', '0x48b91e4148b1a831')
  .put('discovery.wallet', 'https://fcl-discovery.onflow.org/testnet/authn')
  .put('discovery.authn.endpoint', 'https://fcl-discovery.onflow.org/testnet/authn')
  .put('discovery.authn.include', ['0x82ec283f88a62e65', '0x9d2e44203cb13051']);

const client = new InferenceClient(process.env.REACT_APP_HUGGINGFACE_API_KEY);

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(uuidv4());
  const [memos, setMemos] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    currentUser().subscribe(setUser);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (user?.addr) {
      fetchMemos();
    }
  }, [user]);

  const fetchMemos = async () => {
    try {
      const result = await query({
        cadence: `
          import MemoMint from 0xMemoMint
          
          pub fun main(): [MemoMint.Memo] {
            let ids = MemoMint.getAllMemoIDs()
            let memos: [MemoMint.Memo] = []
            
            for id in ids {
              if let memo = MemoMint.getMemo(id: id) {
                memos.append(memo)
              }
            }
            
            return memos
          }
        `,
      });
      setMemos(result);
    } catch (err) {
      console.error('Error fetching memos:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      console.log('Sending request to DeepSeek API...');
      const response = await client.chatCompletion({
        provider: "hyperbolic",
        model: "deepseek-ai/DeepSeek-R1-0528",
        messages: [
          {
            role: "user",
            content: input
          }
        ]
      });
      
      console.log('API Response:', response);

      if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Invalid response from AI model');
      }

      const aiMessage = { role: 'assistant', content: response.choices[0].message.content.trim() };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error in chat:', err);
      alert('Error getting response: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!user?.addr) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      // Get summary using DeepSeek
      const conversationText = messages
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');
      
      const prompt = `Please provide a concise summary of the following conversation:\n\n${conversationText}\n\nSummary:`;
      
      console.log('Sending summarize request to DeepSeek API...');
      const response = await client.chatCompletion({
        provider: "hyperbolic",
        model: "deepseek-ai/DeepSeek-R1-0528",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });

      console.log('API Response:', response);

      if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Invalid response from AI model');
      }

      const summary = response.choices[0].message.content.trim();
      setSummary(summary);

      // Create memo with summary
      const createMemoTransaction = `
        import MemoMint from 0xMemoMint

        transaction(content: String) {
          prepare(signer: AuthAccount) {
            MemoMint.createMemo(content: content)
          }
        }
      `;

      const transactionId = await mutate({
        cadence: createMemoTransaction,
        args: (arg, t) => [arg(summary, t.String)],
        limit: 9999
      });

      // Wait for transaction to be sealed
      const transaction = await tx(transactionId).onceSealed();
      console.log('Transaction sealed:', transaction);

      // Refresh memos
      await fetchMemos();

      alert('Summary saved as memo successfully!');
    } catch (err) {
      console.error('Error in summarize:', err);
      alert('Error saving memo: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-ecstatic-bg font-sans flex flex-col justify-center items-center">
      {/* Header */}
      <header className="app-header-ecstatic shadow-lg p-6 flex flex-row justify-between items-center rounded-3xl w-full max-w-3xl mx-auto mt-10 mb-10">
        <span className="text-3xl font-extrabold text-white tracking-tight drop-shadow-lg flex items-center gap-2">
          <FaMagic className="inline-block mb-1" /> MemoMint
        </span>
        <div className="flex gap-2">
          {user?.addr ? (
            <div className="flex items-center gap-2">
              <span className="text-white/80 text-sm">
                {user.addr.slice(0, 6)}...{user.addr.slice(-4)}
              </span>
              <button onClick={unauthenticate} className="flex items-center gap-2 bg-white/20 hover:bg-white/40 text-white font-semibold px-5 py-2 rounded-full shadow transition">
                <FaSignOutAlt /> Disconnect
              </button>
            </div>
          ) : (
            <button onClick={authenticate} className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white font-semibold px-5 py-2 rounded-full shadow transition">
              <FaSignInAlt /> Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex flex-col items-center justify-center w-full max-w-2xl px-2 gap-8 flex-grow">
        <div className="app-chat-card rounded-3xl shadow-xl p-8 flex flex-col gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar w-full">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 italic py-12">Start a conversation with MemoMint!</div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <span className="bubble-icon-ai">
                  <FaRobot />
                </span>
              )}
              <div
                className={`app-bubble px-6 py-4 rounded-2xl max-w-[75%] shadow-md text-base font-medium whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'app-bubble-user'
                    : 'app-bubble-ai'
                }`}
              >
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              {msg.role === 'user' && (
                <span className="bubble-icon-user">
                  <FaUser />
                </span>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="flex gap-2 w-full">
          <input
            className="flex-1 px-6 py-4 rounded-full border-2 border-indigo-200 bg-white/80 shadow focus:outline-none focus:ring-2 focus:ring-pink-400 text-lg placeholder:text-gray-400"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share your thoughts..."
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
          />
          <button
            className="bg-gradient-to-r from-pink-500 to-indigo-500 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:from-pink-600 hover:to-indigo-600 transition text-lg flex items-center gap-2 disabled:opacity-50"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </div>

        {/* Summarize & Save Button */}
        <button
          onClick={handleSummarize}
          className="app-summarize-btn mt-2 self-center flex items-center gap-2 text-lg disabled:opacity-50"
          disabled={isLoading || messages.length === 0}
        >
          <FaMagic className="text-xl" /> Summarize & Save
        </button>

        {/* Summary Card */}
        {summary && (
          <div className="app-summary-card p-8 mt-4 rounded-3xl shadow-xl flex flex-col gap-2 animate-fade-in w-full">
            <h2 className="font-extrabold text-yellow-600 text-xl flex items-center gap-2 mb-2">
              <FaMagic /> Summary
            </h2>
            <ReactMarkdown className="prose prose-lg max-w-none text-gray-800">{summary}</ReactMarkdown>
          </div>
        )}

        {/* Memos Section */}
        {memos.length > 0 && (
          <div className="w-full mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaHistory /> Your Memos
            </h2>
            <div className="grid gap-4">
              {memos.map((memo) => (
                <div key={memo.id} className="bg-white/90 p-6 rounded-2xl shadow-lg">
                  <div className="text-sm text-gray-500 mb-2">
                    ID: {memo.id} • {new Date(Number(memo.timestamp) * 1000).toLocaleString()}
                  </div>
                  <ReactMarkdown className="prose prose-lg max-w-none text-gray-800">
                    {memo.content}
                  </ReactMarkdown>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex justify-center items-center mt-4">
            <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-3xl mx-auto mt-10 mb-6 rounded-3xl p-4 text-center text-xs text-gray-500 bg-gradient-to-r from-white/60 via-pink-100/60 to-indigo-100/60 shadow">
        &copy; {new Date().getFullYear()} MemoMint &mdash; Crafted with <span className="text-pink-400">♥</span> for May the Flow be with You!
      </footer>
    </div>
  );
}

export default App;
