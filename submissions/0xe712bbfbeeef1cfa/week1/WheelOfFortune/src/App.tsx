import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import fcl from './config/flow';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  color: white;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 2rem;
  text-align: center;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
`;

const WheelContainer = styled.div`
  position: relative;
  width: 400px;
  height: 400px;
  margin: 2rem 0;
`;

const Wheel = styled.div<{ rotation: number }>`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(
    #ff0000 0% 16.67%,
    #ff7f00 16.67% 33.33%,
    #ffff00 33.33% 50%,
    #00ff00 50% 66.67%,
    #0000ff 66.67% 83.33%,
    #4b0082 83.33% 100%
  );
  transition: transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99);
  transform: rotate(${props => props.rotation}deg);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
`;

const Pointer = styled.div`
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-top: 40px solid #ffd700;
  filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
`;

const Button = styled.button`
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background: linear-gradient(45deg, #ffd700, #ffa500);
  border: none;
  border-radius: 25px;
  color: #1a1a1a;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 1rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const Result = styled.div`
  font-size: 1.5rem;
  margin-top: 2rem;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  text-align: center;
`;

const ConnectButton = styled(Button)`
  background: linear-gradient(45deg, #00ff00, #00cc00);
  margin-bottom: 2rem;
`;

const App: React.FC = () => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
  }, []);

  useEffect(() => {
    console.log('User object:', user);
  }, [user]);

  const handleSpin = async () => {
    if (isSpinning || !user?.addr) return;
    setIsSpinning(true);
    setResult(null);

    try {
      const txId = await fcl.mutate({
        cadence: `
          import WheelOfFortuneV2 from 0xb3905e10b1e5c542
            transaction {

              prepare(acct: authAccount) {
                let result = WheelOfFortuneV2.spinWheel(caller: acct.address)
                log("You spun: ".concat(result))
              }

              execute {
                // Nothing needed here for now
              }
            }
        `,
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        authorizations: [fcl.currentUser],
        limit: 100
      });

      const newRotation = rotation + 1800 + Math.random() * 1800;
      setRotation(newRotation);

      setTimeout(() => {
        setResult('Check wallet for spin result!');
        setIsSpinning(false);
      }, 3000);
    } catch (error) {
      console.error('Error spinning wheel:', error);
      setIsSpinning(false);
      setResult('Error spinning wheel. Please try again.');
    }
  };

  const handleConnect = async () => {
    try {
      await fcl.unauthenticate();
      await fcl.authenticate();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fcl.unauthenticate();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  return (
    <Container>
      <Title>Wheel of Fortune</Title>
      {!user?.loggedIn ? (
        <ConnectButton onClick={handleConnect}>
          Connect Wallet
        </ConnectButton>
      ) : (
        <>
          {(user && (user.addr || user.address)) && (
            <div style={{ marginBottom: '1rem', color: '#ffd700', fontWeight: 'bold' }}>
              Connected: {user.addr || user.address}
              <Button 
                onClick={handleDisconnect}
                style={{ marginLeft: '1rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                Disconnect
              </Button>
            </div>
          )}
          <WheelContainer>
            <Pointer />
            <Wheel rotation={rotation} />
          </WheelContainer>
          <Button onClick={handleSpin} disabled={isSpinning}>
            {isSpinning ? 'Spinning...' : 'Spin the Wheel'}
          </Button>
          {result && <Result>{result}</Result>}
        </>
      )}
    </Container>
  );
};

export default App;
