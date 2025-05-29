'use client';

import { useState, useCallback } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Button, 
  Flex,
  Text,
  Badge,
  Icon,
  useColorModeValue,
  SimpleGrid
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiZap, FiHeart } from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Solo importamos el canvas avanzado
const CreatureCanvasAdvanced = dynamic(() => import('./CreatureCanvasAdvanced'), { ssr: false });

// Interfaces
interface CreatureUIDataFrontend {
  id: number;
  name: string;
  description: string;
  thumbnail: string;
  edadDiasCompletos: string; 
  lifespanTotalSimulatedDays: string; 
  puntosEvolucion: string; 
  genesVisibles: { [key: string]: string }; 
  initialSeed: number; 
  seedChangeCount: string; 
  estaViva: boolean;
  genesOcultos: { [key: string]: string };
}

interface CreatureVisualizerHubProps {
  creatures: CreatureUIDataFrontend[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

const MotionBox = motion(Box);

export default function CreatureVisualizerHub({
  creatures,
  onRefresh,
  isLoading = false
}: CreatureVisualizerHubProps) {
  // Theme
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Statistics
  const aliveCreatures = creatures.filter(c => c.estaViva);
  const totalEP = creatures.reduce((sum, c) => {
    const ep = parseFloat(c.puntosEvolucion || '0');
    return sum + (isNaN(ep) ? 0 : ep);
  }, 0);
  const avgAge = aliveCreatures.length > 0 
    ? aliveCreatures.reduce((sum, c) => {
        const age = parseFloat(c.edadDiasCompletos || '0');
        return sum + (isNaN(age) ? 0 : age);
      }, 0) / aliveCreatures.length
    : 0;

  // Handlers
  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  return (
    <VStack spacing={6} align="stretch" w="full">
      {/* Header elegante */}
      <Flex justify="space-between" align="center">
        <VStack align="start" spacing={1}>
          <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
            🧬 Living Ecosystem
          </Text>
          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
            Watch your digital creatures evolve in real-time
          </Text>
        </VStack>
        
        <Button
          leftIcon={<Icon as={FiRefreshCw} />}
          onClick={handleRefresh}
          isLoading={isLoading}
          size="sm"
          colorScheme="blue"
          variant="ghost"
        >
          Refresh
        </Button>
      </Flex>

      {/* Stats elegantes */}
      <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          bg={bgColor}
          p={4}
          borderRadius="xl"
          border="1px"
          borderColor={borderColor}
          textAlign="center"
        >
          <HStack justify="center" spacing={2} mb={1}>
            <Icon as={FiHeart} color="green.500" />
            <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">
              Alive
            </Text>
          </HStack>
          <Text fontSize="2xl" fontWeight="bold" color="green.500">
            {aliveCreatures.length}
          </Text>
        </MotionBox>
        
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          bg={bgColor}
          p={4}
          borderRadius="xl"
          border="1px"
          borderColor={borderColor}
          textAlign="center"
        >
          <HStack justify="center" spacing={2} mb={1}>
            <Icon as={FiZap} color="purple.500" />
            <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">
              Evolution
            </Text>
          </HStack>
          <Text fontSize="2xl" fontWeight="bold" color="purple.500">
            {totalEP.toFixed(0)}
          </Text>
        </MotionBox>
        
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          bg={bgColor}
          p={4}
          borderRadius="xl"
          border="1px"
          borderColor={borderColor}
          textAlign="center"
        >
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold" mb={1}>
            Avg Age
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="blue.500">
            {avgAge.toFixed(1)}
            <Text as="span" fontSize="sm" color="gray.400" ml={1}>days</Text>
          </Text>
        </MotionBox>
      </SimpleGrid>

      {/* Canvas único y elegante */}
      <MotionBox
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <CreatureCanvasAdvanced
          creatures={creatures}
          canvasWidth={900}
          canvasHeight={600}
          showTrails={false}
          showParticles={true}
          showGrid={false}
          animationSpeed={1}
        />
      </MotionBox>

      {/* Lista de criaturas elegante */}
      {aliveCreatures.length > 0 && (
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          bg={bgColor}
          p={4}
          borderRadius="xl"
          border="1px"
          borderColor={borderColor}
        >
          <Text fontSize="lg" fontWeight="bold" mb={3} color={useColorModeValue('gray.800', 'white')}>
            🌟 Active Creatures
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
            {aliveCreatures.map((creature) => (
              <Box
                key={creature.id}
                p={3}
                bg={useColorModeValue('gray.50', 'gray.700')}
                borderRadius="lg"
                border="1px"
                borderColor={useColorModeValue('gray.200', 'gray.600')}
              >
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="bold" fontSize="sm">
                    #{creature.id}
                  </Text>
                  <Badge colorScheme="green" size="sm">
                    {parseFloat(creature.puntosEvolucion).toFixed(1)} EP
                  </Badge>
                </HStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500">
                    Age: {parseFloat(creature.edadDiasCompletos).toFixed(1)} / {parseFloat(creature.lifespanTotalSimulatedDays).toFixed(1)} days
                  </Text>
                  <HStack spacing={2}>
                    {Object.entries(creature.genesVisibles).slice(0, 3).map(([gene, value]) => (
                      <Badge key={gene} size="xs" variant="outline">
                        {gene.replace('color', '').replace('tamano', 'size').substring(0, 3)}: {parseFloat(value).toFixed(2)}
                      </Badge>
                    ))}
                  </HStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </MotionBox>
      )}
    </VStack>
  );
} 