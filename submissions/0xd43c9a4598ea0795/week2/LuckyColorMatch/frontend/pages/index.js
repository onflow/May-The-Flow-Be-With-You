import Head from 'next/head';
import { useEffect, useState } from 'react';
import * as flowService from '../services/flowService'; // Ensure this path is correct
import '../flow/config'; // Initializes FCL

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [entryFee, setEntryFee] = useState(null);
  const [availableColors, setAvailableColors] = useState([]);
  const [combinationLength, setCombinationLength] = useState(0);
  const [currentRoundID, setCurrentRoundID] = useState(null);

  // Authentication
  useEffect(() => {
    flowService.getCurrentUser().then(setUser);
  }, []);

  const handleLogin = async () => {
    await flowService.logIn();
    flowService.getCurrentUser().then(setUser);
  };

  const handleLogout = () => {
    flowService.logOut();
    setUser(null);
  };

  const handleSetupAccount = async () => {
    if (!user || !user.addr) {
      alert("Please log in first.");
      return;
    }
    try {
      const result = await flowService.setupAccount();
      alert("Account setup transaction sent! Status: " + result.status.statusString);
      console.log("Setup Account Result:", result);
    } catch (error) {
      console.error("Failed to setup account:", error);
      alert("Failed to setup account: " + error.message);
    }
  };

  // Fetch initial game data
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const fee = await flowService.getLuckyColorMatchEntryFee();
        setEntryFee(fee);
        const colors = await flowService.getAvailableColors();
        setAvailableColors(colors);
        const length = await flowService.getCombinationLength();
        setCombinationLength(length);
        const roundID = await flowService.getCurrentRoundID();
        setCurrentRoundID(roundID);
      } catch (error) {
        console.error("Error fetching initial game data:", error);
      }
    };
    fetchGameData();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Lucky Color Match</title>
        <meta name="description" content="Play Lucky Color Match on Flow!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header style={{ marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
        <h1 style={{ textAlign: 'center' }}>Welcome to Lucky Color Match!</h1>
        <div style={{ textAlign: 'right' }}>
          {user && user.addr ? (
            <div>
              <span style={{ marginRight: '10px' }}>Logged in as: {user.addr}</span>
              <button onClick={handleLogout} style={{ padding: '8px 12px' }}>Log Out</button>
              <button onClick={handleSetupAccount} style={{ marginLeft: '10px', padding: '8px 12px' }}>Setup Account</button>
            </div>
          ) : (
            <button onClick={handleLogin} style={{ padding: '8px 12px' }}>Log In with Wallet</button>
          )}
        </div>
      </header>

      <main>
        <h2>Game Information</h2>
        {currentRoundID !== null ? <p>Current Round ID: {currentRoundID.toString()}</p> : <p>Loading Round ID...</p>}
        {entryFee !== null ? <p>Entry Fee: {parseFloat(entryFee).toFixed(2)} FLOW</p> : <p>Loading entry fee...</p>}
        {combinationLength > 0 ? <p>Combination Length: {combinationLength}</p> : <p>Loading combination length...</p>}
        {availableColors.length > 0 ? (
          <p>Available Colors: {availableColors.join(', ')}</p>
        ) : (
          <p>Loading available colors...</p>
        )}

        <!-- Placeholder for game interaction UI -->
        <div style={{ marginTop: '30px', border: '1px solid #ccc', padding: '20px' }}>
          <h3>Play the Game (Placeholder)</h3>
          <p>Game UI will go here. Select {combinationLength} colors from the list above.</p>
          <button style={{ padding: '10px 15px', marginTop: '10px' }}>Submit Colors (Placeholder)</button>
        </div>
      </main>

      <footer style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'center', fontSize: '0.9em' }}>
        <p>Powered by Flow Blockchain</p>
      </footer>
    </div>
  );
}