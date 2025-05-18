'use client';

import React, { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';
import { 
  Box, 
  Heading, 
  Text, 
  Stack,
  Button, 
  Flex, 
  Container, 
  Badge,
  Input,
  useDisclosure,
} from '@chakra-ui/react';
import { createPvPGame, joinGame, getAvailableGames } from '../../flow/transactions';

interface Game {
  id: number;
  creator: string;
  stake: string;
  rounds: number;
  status: string;
}

interface FlowUser {
  addr: string;
  loggedIn: boolean;
  cid?: string;
  expiresAt?: number;
  f_type?: string;
  f_vsn?: string;
  services?: Record<string, unknown>;
}

export default function AvailableGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userAddress, setUserAddress] = useState<string>('');
  const disclosure = useDisclosure();
  const [stakeAmount, setStakeAmount] = useState<string>('10.0');
  const [rounds, setRounds] = useState<string>('3');
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  // Escuchar cambios en la autenticación
  useEffect(() => {
    const unsub = fcl.currentUser.subscribe((user: FlowUser) => {
      if (user.addr) {
        setUserAddress(user.addr);
      }
    });
    return () => unsub();
  }, []);

  // Cargar juegos disponibles
  useEffect(() => {
    if (userAddress) {
      loadAvailableGames();
    }
  }, [userAddress]);

  // Simulación de carga de juegos disponibles
  const loadAvailableGames = async () => {
    setIsLoading(true);
    try {
      // En lugar de la simulación anterior, usamos la función getAvailableGames
      const availableGames = await getAvailableGames();
      setGames(availableGames);
    } catch (error) {
      console.error("Error loading available games:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Crear un nuevo juego PvP
  const handleCreateGame = async () => {
    setIsLoading(true);
    try {
      await createPvPGame(parseFloat(stakeAmount), parseInt(rounds));
      // Recargar la lista de juegos después de crear uno nuevo
      loadAvailableGames();
      disclosure.onClose();
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Could not create game. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Unirse a un juego existente
  const handleJoinGame = async (gameId: number, stakeAmount: string) => {
    setIsLoading(true);
    setSelectedGameId(gameId);
    try {
      await joinGame(gameId, parseFloat(stakeAmount));
      alert(`Successfully joined game #${gameId}`);
      // Recargar la lista de juegos después de unirse
      loadAvailableGames();
    } catch (error) {
      console.error("Error joining game:", error);
      alert("Could not join game. Please try again.");
    } finally {
      setIsLoading(false);
      setSelectedGameId(null);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Stack gap={8}>
        <Box textAlign="center">
          <Badge colorScheme="purple" p={2} fontSize="md">PvP Games</Badge>
          <Heading size="xl" mt={2}>Available Games</Heading>
          <Text fontSize="lg" mt={2} color="gray.300">
            Join an existing game or create your own to challenge other players
          </Text>
        </Box>

        <Flex justifyContent="flex-end">
          <Button 
            colorScheme="teal" 
            onClick={disclosure.onOpen}
          >
            {isLoading ? 'Creating...' : 'Create New Game'}
          </Button>
        </Flex>

        {games.length > 0 ? (
          <Box overflowX="auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Game ID</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Creator</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Stake (FLOW)</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Rounds</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr key={game.id}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{game.id}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{game.creator.substring(0, 8)}...</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{game.stake}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{game.rounds}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
                      <Badge colorScheme="yellow">{game.status}</Badge>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
                      <Button 
                        colorScheme="blue" 
                        size="sm"
                        onClick={() => handleJoinGame(game.id, game.stake)}
                        disabled={isLoading && selectedGameId === game.id}
                      >
                        {isLoading && selectedGameId === game.id ? 'Joining...' : 'Join'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        ) : (
          <Box textAlign="center" p={8} bg="gray.700" borderRadius="md">
            <Text mb={4}>No games available at the moment.</Text>
            <Button colorScheme="teal" onClick={disclosure.onOpen}>Create the first game!</Button>
          </Box>
        )}
      </Stack>

      {/* Create Game Dialog */}
      {disclosure.open && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          zIndex={100}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={disclosure.onClose}
        >
          <Box
            bg="gray.800"
            p={6}
            borderRadius="md"
            width="100%"
            maxWidth="400px"
            onClick={(e) => e.stopPropagation()}
          >
            <Heading size="md" mb={4}>Create New PvP Game</Heading>
            <Stack gap={4}>
              <Box>
                <Text fontWeight="medium" mb={2}>Stake Amount (FLOW)</Text>
                <Input 
                  type="number" 
                  value={stakeAmount} 
                  onChange={(e) => setStakeAmount(e.target.value)} 
                  placeholder="Enter stake amount"
                />
              </Box>
              <Box>
                <Text fontWeight="medium" mb={2}>Number of Rounds</Text>
                <Input 
                  type="number" 
                  value={rounds} 
                  onChange={(e) => setRounds(e.target.value)} 
                  placeholder="Enter number of rounds"
                />
              </Box>
              <Stack direction="row" gap={4} justify="flex-end">
                <Button variant="ghost" onClick={disclosure.onClose}>Cancel</Button>
                <Button colorScheme="blue" onClick={handleCreateGame} disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Game'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>
      )}
    </Container>
  );
} 