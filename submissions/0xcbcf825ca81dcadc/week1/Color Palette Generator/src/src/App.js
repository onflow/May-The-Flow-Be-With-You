import React, { useState } from 'react';
import * as fcl from "@onflow/fcl";
import styled from 'styled-components';

// Configure FCL
fcl.config({
  "app.detail.title": "Color Palette Generator",
  "accessNode.api": "http://127.0.0.1:8888",
  "discovery.wallet": "http://localhost:8701/fcl/authn",
  "flow.network": "emulator",
  "0xColorPaletteGenerator": "0xf8d6e0586b0a20c7"
})

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 2rem;
`;

const PaletteContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const ColorBox = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1rem;
  margin: 0.5rem;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
`;

const ColorCode = styled.span`
  background: rgba(255,255,255,0.9);
  padding: 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  cursor: pointer;
`;

const Button = styled.button`
  background: #4CAF50;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #45a049;
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  margin-bottom: 1rem;
  font-size: 1rem;
`;

const ErrorMessage = styled.div`
  color: #ff0000;
  margin: 1rem 0;
  padding: 1rem;
  background: #fff5f5;
  border-radius: 4px;
  border: 1px solid #ff0000;
`;

function App() {
  const [colors, setColors] = useState([]);
  const [colorCount, setColorCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const generatePalette = async () => {
    try {
      setLoading(true);
      setError(null);
      setColors([]);

      const result = await fcl.query({
        cadence: `
          import ColorPaletteGenerator from 0xColorPaletteGenerator

          access(all) fun main(colorCount: Int): [ColorPaletteGenerator.Color] {
            let palette = ColorPaletteGenerator.generatePalette(colorCount: colorCount)
            return palette.colors
          }
        `,
        args: (arg, t) => [arg(colorCount, t.Int)],
      });

      if (!result || !Array.isArray(result)) {
        throw new Error("Invalid response from contract");
      }

      const formattedColors = result.map(color => ({
        rgb: `rgb(${color.red}, ${color.green}, ${color.blue})`,
        hex: `#${color.red.toString(16).padStart(2, '0')}${color.green.toString(16).padStart(2, '0')}${color.blue.toString(16).padStart(2, '0')}`
      }));

      setColors(formattedColors);
    } catch (error) {
      console.error("Error generating palette:", error);
      setError(
        error.message || "Failed to generate color palette. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Title>Flow Color Palette Generator</Title>
      
      <div>
        <Select 
          value={colorCount} 
          onChange={(e) => setColorCount(parseInt(e.target.value))}
          disabled={loading}
        >
          <option value={3}>3 Colors</option>
          <option value={4}>4 Colors</option>
          <option value={5}>5 Colors</option>
        </Select>
      </div>

      <Button 
        onClick={generatePalette}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate New Palette'}
      </Button>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <PaletteContainer>
        {colors.map((color, index) => (
          <ColorBox 
            key={index}
            style={{ backgroundColor: color.rgb }}
          >
            <ColorCode onClick={() => copyToClipboard(color.hex)}>
              {color.hex}
            </ColorCode>
          </ColorBox>
        ))}
      </PaletteContainer>
    </Container>
  );
}

export default App; 