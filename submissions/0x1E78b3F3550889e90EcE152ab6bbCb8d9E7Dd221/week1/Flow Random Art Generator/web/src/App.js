import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import fcl from './fclConfig';

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 2rem;
`;

const Button = styled.button`
  background-color: #00ef8b;
  color: #333;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #00d47e;
    transform: translateY(-2px);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    transform: none;
  }
`;

const ArtContainer = styled.div`
  margin-top: 2rem;
  padding: 2rem;
  border-radius: 12px;
  background-color: #f5f5f5;
`;

const ArtPiece = styled.div`
  width: 300px;
  height: 300px;
  margin: 0 auto;
  border-radius: 8px;
  background: ${props => props.gradient};
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  margin: 1rem 0;
  padding: 1rem;
  background-color: #ffeeee;
  border-radius: 8px;
`;

function App() {
  const [artPiece, setArtPiece] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fcl.currentUser().subscribe(setUser);
  }, []);

  const generateArt = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user || !user.addr) {
        await fcl.authenticate();
        return;
      }
      // Generate new art piece
      const result = await fcl.mutate({
        cadence: `
          import RandomArt from "../contracts/RandomArt.cdc"
          
          transaction {
            prepare(signer: auth(SaveValue) &Account) {
              let artPiece = RandomArt.generateArt()
              return artPiece
            }
          }
        `,
        args: (arg, t) => [],
      });
      // Get the generated art piece
      const artPiece = await fcl.query({
        cadence: `
          import RandomArt from "../contracts/RandomArt.cdc"
          
          access(all) fun main(id: UInt64): RandomArt.ArtPiece? {
            return RandomArt.getArtPiece(id: id)
          }
        `,
        args: (arg, t) => [arg(result.id, t.UInt64)],
      });
      setArtPiece(artPiece);
    } catch (error) {
      console.error('Error generating art:', error);
      setError(error.message || 'Failed to generate art piece');
    } finally {
      setLoading(false);
    }
  };

  const getGradient = (colors) => {
    if (!colors || colors.length === 0) return 'linear-gradient(45deg, #00ef8b, #00d47e)';
    return `linear-gradient(45deg, ${colors.join(', ')})`;
  };

  return (
    <AppContainer>
      <Title>Flow Random Art Generator</Title>
      {!user || !user.addr ? (
        <Button onClick={fcl.authenticate}>
          Connect Wallet
        </Button>
      ) : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontWeight: 'bold' }}>Account:</span> {user.addr}
            <Button style={{ marginLeft: '1rem', background: '#eee', color: '#333' }} onClick={fcl.unauthenticate}>
              Disconnect
            </Button>
          </div>
          <Button onClick={generateArt} disabled={loading}>
            {loading ? 'Generating...' : 'Generate New Art'}
          </Button>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {artPiece && (
            <ArtContainer>
              <h2>Art Piece #{artPiece.id}</h2>
              <ArtPiece gradient={getGradient(artPiece.colors)} />
              <p>Pattern Type: {artPiece.pattern}</p>
              <p>Generated at: {new Date(artPiece.timestamp * 1000).toLocaleString()}</p>
            </ArtContainer>
          )}
        </>
      )}
    </AppContainer>
  );
}

export default App; 