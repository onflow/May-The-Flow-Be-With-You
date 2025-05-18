import React, { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';
import { 
  Box, 
  Heading, 
  Text, 
  Stack,
  Button, 
  Image, 
  Flex, 
  Container, 
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';
import { createPracticeGame, revealOutcome } from '../../flow/transactions';

// Definir los tipos para los resultados del juego
interface GameResult {
  gameId: number;
  mode: string;
  player1Move: string;
  computerMove: string;
  environmentalModifier: string;
  criticalHitTypePlayer1: string;
  criticalHitTypeP2OrComputer: string;
  winner: string | null;
}

// Definir tipos para la respuesta de la transacción
interface TransactionResult {
  gameId: number;
  mode: string;
  player1Move: string;
  computerMove: string;
  environmentalModifier: string;
  criticalHitTypePlayer1: string;
  criticalHitTypeP2OrComputer: string;
  winner?: string | null;
}

// Definir tipo para usuario de Flow
interface FlowUser {
  addr: string;
  loggedIn: boolean;
  // Define propiedades específicas en lugar de 'any'
  cid?: string;
  expiresAt?: number;
  f_type?: string;
  f_vsn?: string;
  services?: Record<string, unknown>;
}

// Definir el tipo para elementInfo
interface ElementInfo {
  name: string;
  color: string;
  image: string;
  strongAgainst: string;
  weakAgainst: string;
  description: string;
}

interface ElementsMap {
  [key: string]: ElementInfo;
}

export default function PvEGame() {
  const [userAddress, setUserAddress] = useState<string>('');
  const [selectedElement, setSelectedElement] = useState<string>('');
  const [gameState, setGameState] = useState<string>('select'); // select, loading, result
  // Usamos una constante para el gameId ya que actualmente no se usa el valor dinámico
  const GAME_ID = 1; // ID fijo para el demo
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  
  // Escuchar cambios en la autenticación
  useEffect(() => {
    const unsub = fcl.currentUser.subscribe((user: FlowUser) => {
      if (user.addr) {
        setUserAddress(user.addr);
      }
    });
    return () => unsub();
  }, []);

  const elementInfo: ElementsMap = {
    Fire: {
      name: 'Fire',
      color: 'red.500',
      image: '/assets/icons/lorc/sword-spin.png',
      strongAgainst: 'Plant',
      weakAgainst: 'Water',
      description: 'The burning power that consumes everything in its path'
    },
    Water: {
      name: 'Water',
      color: 'blue.500',
      image: '/assets/icons/lorc/vortex.png',
      strongAgainst: 'Fire',
      weakAgainst: 'Plant',
      description: 'The constant flow that erodes any obstacle'
    },
    Plant: {
      name: 'Plant',
      color: 'green.500',
      image: '/assets/icons/lorc/thorny-vine.png',
      strongAgainst: 'Water',
      weakAgainst: 'Fire',
      description: 'Life that thrives and strengthens over time'
    }
  };

  // Manejar la selección de elemento
  const handleElementSelect = (element: string) => {
    setSelectedElement(element);
  };

  // Iniciar juego PvE
  const startPracticeGame = async () => {
    if (!selectedElement) {
      alert('Debes seleccionar un elemento primero');
      return;
    }

    try {
      setGameState('loading');
      
      // Crear juego PvE
      await createPracticeGame(selectedElement);
      
      // Simular espera para la transacción
      // En producción, deberíamos suscribirnos a eventos de blockchain
      setTimeout(async () => {
        try {
          // Revelar el resultado
          const result: TransactionResult = await revealOutcome(GAME_ID);
          // Asegurarse de que el resultado tenga la propiedad winner
          const completeResult: GameResult = {
            gameId: result.gameId,
            mode: result.mode,
            player1Move: result.player1Move,
            computerMove: result.computerMove,
            environmentalModifier: result.environmentalModifier,
            criticalHitTypePlayer1: result.criticalHitTypePlayer1,
            criticalHitTypeP2OrComputer: result.criticalHitTypeP2OrComputer,
            winner: result.winner || null
          };
          setGameResult(completeResult);
          setGameState('result');
          setShowResult(true);
        } catch (error) {
          console.error("Error al revelar resultado:", error);
          alert('Hubo un problema al revelar el resultado del juego');
          setGameState('select');
        }
      }, 3000);
      
    } catch (error) {
      console.error("Error al crear juego:", error);
      alert('Hubo un problema al iniciar el juego');
      setGameState('select');
    }
  };

  // Jugar de nuevo
  const playAgain = () => {
    setGameState('select');
    setSelectedElement('');
    setGameResult(null);
    setShowResult(false);
  };

  // Renderizar pantalla de selección de elemento
  const renderElementSelection = () => (
    <Box mt={8}>
      <Heading size="xl" textAlign="center" mb={6}>
        Choose Your Element
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={8} maxW="container.lg" mx="auto">
        {Object.keys(elementInfo).map((element) => (
          <Box
            key={element}
            onClick={() => handleElementSelect(element)}
            borderWidth="2px"
            borderRadius="lg"
            overflow="hidden"
            borderColor={selectedElement === element ? elementInfo[element].color : "gray.200"}
            boxShadow={selectedElement === element ? `0 0 15px ${elementInfo[element].color}` : "md"}
            transition="all 0.3s ease"
            cursor="pointer"
            bg="white"
            height="100%"
            _hover={{ transform: 'scale(1.05)' }}
            _active={{ transform: 'scale(0.95)' }}
          >
            <Box p={4} bg={elementInfo[element].color} color="white" textAlign="center">
              <Image 
                src={elementInfo[element].image} 
                alt={element} 
                boxSize="80px" 
                mx="auto"
                filter="brightness(0) invert(1)"
              />
              <Heading size="lg" mt={2}>{elementInfo[element].name}</Heading>
            </Box>
            <Box p={4}>
              <Text textAlign="center" color="gray.800">{elementInfo[element].description}</Text>
              <Box h="1px" bg="gray.200" my={3} />
              <Box>
                <Stack direction="row" justify="center" mb={2}>
                  <Text fontWeight="bold" color="gray.800">Strong against:</Text>
                  <Badge colorScheme={elementInfo[elementInfo[element].strongAgainst].color.split('.')[0]}>
                    {elementInfo[element].strongAgainst}
                  </Badge>
                </Stack>
                <Stack direction="row" justify="center">
                  <Text fontWeight="bold" color="gray.800">Weak against:</Text>
                  <Badge colorScheme={elementInfo[elementInfo[element].weakAgainst].color.split('.')[0]}>
                    {elementInfo[element].weakAgainst}
                  </Badge>
                </Stack>
              </Box>
            </Box>
          </Box>
        ))}
      </SimpleGrid>
      
      <Flex justify="center" mt={10}>
        <Button
          colorScheme="teal"
          size="lg"
          onClick={startPracticeGame}
          disabled={!selectedElement}
          px={10}
        >
          Start Battle!
        </Button>
      </Flex>
    </Box>
  );

  // Renderizar pantalla de carga
  const renderLoading = () => (
    <Container centerContent py={20}>
      <Stack direction="column" gap={8} align="center">
        <Heading>Preparing Battle...</Heading>
        <Box w="100%" maxW="500px" bg="gray.200" h="10px" borderRadius="full">
          <Box 
            w="40%" 
            h="full" 
            bg="teal.500" 
            borderRadius="full" 
            animation="progress 1.5s ease-in-out infinite"
          />
        </Box>
        <Text fontSize="lg">Your {selectedElement} is preparing for combat</Text>
        
        <Box
          animation="spin 2s linear infinite"
        >
          <Image 
            src={elementInfo[selectedElement]?.image} 
            alt={selectedElement}
            boxSize="150px"
            opacity={0.8}
          />
        </Box>
      </Stack>
    </Container>
  );

  // Renderizar el resultado del juego
  const renderResult = () => {
    if (!gameResult) return null;
    
    const isWinner = gameResult.winner === userAddress;
    const isDraw = !gameResult.winner;
    
    return (
      <Box 
        position="fixed" 
        top="0" 
        left="0" 
        right="0" 
        bottom="0" 
        bg="blackAlpha.700" 
        zIndex={100} 
        display={showResult ? "flex" : "none"}
        alignItems="center"
        justifyContent="center"
        onClick={() => setShowResult(false)}
      >
        <Box 
          maxW="xl" 
          w="full" 
          bg="gray.800" 
          color="white" 
          borderRadius="xl" 
          borderWidth="2px" 
          borderColor={isWinner ? "green.500" : isDraw ? "yellow.500" : "red.500"}
          onClick={(e) => e.stopPropagation()}
          p={6}
          position="relative"
        >
          <Heading textAlign="center" fontSize="2xl" mb={4}>
            {isWinner ? "Victory!" : isDraw ? "Draw!" : "Defeat!"}
          </Heading>
          <Button 
            position="absolute" 
            top={4} 
            right={4} 
            size="sm" 
            onClick={() => setShowResult(false)}
          >
            X
          </Button>
          
          <Stack direction="column" gap={6}>
            <Text fontSize="lg" textAlign="center" fontWeight="bold">
              {isWinner 
                ? "You defeated your opponent!" 
                : isDraw 
                  ? "A fierce battle that ends in a draw!" 
                  : "Your opponent has defeated you this time!"}
            </Text>
            
            <Stack direction="row" gap={10} justify="center" width="100%">
              <Stack direction="column" align="center">
                <Text fontWeight="bold">You</Text>
                <Image 
                  src={elementInfo[gameResult.player1Move]?.image}
                  alt={gameResult.player1Move}
                  boxSize="80px"
                  filter="brightness(0) invert(1)"
                />
                <Badge colorScheme={gameResult.player1Move === "Fire" ? "red" : gameResult.player1Move === "Water" ? "blue" : "green"}>
                  {gameResult.player1Move}
                </Badge>
              </Stack>
              
              <Text fontSize="3xl">VS</Text>
              
              <Stack direction="column" align="center">
                <Text fontWeight="bold">Opponent</Text>
                <Image 
                  src={elementInfo[gameResult.computerMove]?.image}
                  alt={gameResult.computerMove}
                  boxSize="80px"
                  filter="brightness(0) invert(1)"
                />
                <Badge colorScheme={gameResult.computerMove === "Fire" ? "red" : gameResult.computerMove === "Water" ? "blue" : "green"}>
                  {gameResult.computerMove}
                </Badge>
              </Stack>
            </Stack>
            
            {gameResult.environmentalModifier !== "None" && (
              <Box p={3} bg="whiteAlpha.300" borderRadius="md" width="100%">
                <Text fontWeight="bold" textAlign="center" mb={1}>Environmental Modifier:</Text>
                <Text textAlign="center" fontWeight="semibold">{gameResult.environmentalModifier}</Text>
              </Box>
            )}
            
            {(gameResult.criticalHitTypePlayer1 !== "None" || gameResult.criticalHitTypeP2OrComputer !== "None") && (
              <Box p={3} bg="whiteAlpha.300" borderRadius="md" width="100%">
                <Text fontWeight="bold" textAlign="center" mb={1}>Critical Hits:</Text>
                {gameResult.criticalHitTypePlayer1 !== "None" && (
                  <Text textAlign="center" fontWeight="semibold">Your attack was critical! ({gameResult.criticalHitTypePlayer1})</Text>
                )}
                {gameResult.criticalHitTypeP2OrComputer !== "None" && (
                  <Text textAlign="center" fontWeight="semibold">The opponent landed a critical hit! ({gameResult.criticalHitTypeP2OrComputer})</Text>
                )}
              </Box>
            )}
            
            <Flex justify="center">
              <Button colorScheme="teal" onClick={playAgain} size="lg">
                Play Again
              </Button>
            </Flex>
          </Stack>
        </Box>
      </Box>
    );
  };

  return (
    <Box py={8}>
      <Container maxW="container.xl">
        <Stack direction="column" gap={6} align="stretch">
          {/* Encabezado */}
          <Box textAlign="center" mb={4}>
            <Badge colorScheme="green" p={2} fontSize="md">Practice Mode (PvE)</Badge>
            <Heading size="xl" mt={2}>Battle Against AI</Heading>
            <Text fontSize="lg" mt={2} color="gray.300">
              Test your elemental skills against an AI opponent
            </Text>
          </Box>
          
          {gameState === 'select' && renderElementSelection()}
          {gameState === 'loading' && renderLoading()}
          {renderResult()}
        </Stack>
      </Container>
      
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 0%; }
        }
      `}</style>
    </Box>
  );
} 