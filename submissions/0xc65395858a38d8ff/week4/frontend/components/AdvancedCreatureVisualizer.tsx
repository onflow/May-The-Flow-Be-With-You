'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Text,
  Badge,
  SimpleGrid,
  Card,
  CardBody,
  Flex,
  Progress,
  useColorModeValue,
  Icon,
  Tooltip
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiHeart, FiEye, FiStar } from 'react-icons/fi';

// Interfaces
interface CreatureVisualData {
  id: number;
  name: string;
  description: string;
  thumbnail: string;
  estaViva: boolean;
  edadDiasCompletos: string;
  lifespanTotalSimulatedDays: string;
  puntosEvolucion: string;
  traitValues: { [key: string]: string | null };
  registeredModules: string[];
}

interface AdvancedCreatureVisualizerProps {
  creatures: CreatureVisualData[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

const MotionBox = motion(Box);
const MotionCard = motion(Card);

// Helper functions to parse trait values
const parseVisualTraits = (traitValue: string | null) => {
  if (!traitValue) return null;
  
  const traits: any = {};
  const parts = traitValue.split('|');
  
  parts.forEach(part => {
    if (part.includes('R:')) traits.colorR = parseFloat(part.split('R:')[1]) || 0;
    if (part.includes('G:')) traits.colorG = parseFloat(part.split('G:')[1]) || 0;
    if (part.includes('B:')) traits.colorB = parseFloat(part.split('B:')[1]) || 0;
    if (part.includes('Size:')) traits.tamanoBase = parseFloat(part.split('Size:')[1]) || 1;
    if (part.includes('Form:')) traits.formaPrincipal = parseFloat(part.split('Form:')[1]) || 1;
    if (part.includes('Apps:')) traits.numApendices = parseFloat(part.split('Apps:')[1]) || 0;
    if (part.includes('Mov:')) traits.patronMovimiento = parseFloat(part.split('Mov:')[1]) || 1;
  });
  
  return traits;
};

const parseAdvancedVisualTraits = (traitValue: string | null) => {
  if (!traitValue) return null;
  
  const traits: any = {};
  const parts = traitValue.split('|');
  
  parts.forEach(part => {
    if (part.includes('PAT:')) traits.tipoPatron = parseInt(part.split('PAT:')[1]) || 0;
    if (part.includes('DENS:')) traits.densidadPatron = parseFloat(part.split('DENS:')[1]) || 0;
    if (part.includes('AURA:')) traits.tipoAura = parseInt(part.split('AURA:')[1]) || 0;
    if (part.includes('LUZ:')) traits.emiteLuz = part.split('LUZ:')[1] === '1';
    if (part.includes('SALUD:')) traits.nivelSalud = parseFloat(part.split('SALUD:')[1]) || 1;
    if (part.includes('ENERGIA:')) traits.nivelEnergia = parseFloat(part.split('ENERGIA:')[1]) || 1;
    if (part.includes('ELEM:')) traits.efectoElemental = parseInt(part.split('ELEM:')[1]) || 0;
  });
  
  return traits;
};

// Visual trait type mappings
const PATTERN_TYPES = ['Smooth', 'Spots', 'Stripes', 'Dots', 'Swirls'];
const AURA_TYPES = ['None', 'Fire', 'Water', 'Earth', 'Air'];
const FORM_TYPES = ['Agile', 'Tank', 'Attacker'];
const ELEMENTAL_EFFECTS = ['Normal', 'Crystal', 'Flame', 'Ice'];

export default function AdvancedCreatureVisualizer({ 
  creatures, 
  onRefresh, 
  isLoading = false 
}: AdvancedCreatureVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  // Parse all creature visual data
  const parsedCreatures = useMemo(() => {
    return creatures.map(creature => {
      const visualTraits = parseVisualTraits(creature.traitValues['VisualTraitsModule']);
      const advancedTraits = parseAdvancedVisualTraits(creature.traitValues['AdvancedVisualTraitsModule']);
      
      return {
        ...creature,
        visual: visualTraits,
        advanced: advancedTraits
      };
    });
  }, [creatures]);

  // Canvas drawing function
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || parsedCreatures.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawCreature = (creature: any, x: number, y: number, size: number) => {
      const visual = creature.visual;
      const advanced = creature.advanced;
      
      if (!visual) return;

      // Base size from traits
      const baseSize = (visual.tamanoBase || 1) * size;
      
      // Health/energy affects brightness
      const healthMod = advanced?.nivelSalud || 1;
      const energyMod = advanced?.nivelEnergia || 1;
      
      // Main body color
      const r = Math.floor((visual.colorR || 0) * 255 * healthMod);
      const g = Math.floor((visual.colorG || 0) * 255 * healthMod);
      const b = Math.floor((visual.colorB || 0) * 255 * healthMod);
      
      ctx.save();
      
      // Aura effect
      if (advanced?.tipoAura > 0) {
        const auraColors = [
          [255, 100, 100], // Fire
          [100, 100, 255], // Water  
          [139, 69, 19],   // Earth
          [200, 200, 255]  // Air
        ];
        const auraColor = auraColors[advanced.tipoAura - 1] || [255, 255, 255];
        const gradient = ctx.createRadialGradient(x, y, baseSize * 0.5, x, y, baseSize * 1.5);
        gradient.addColorStop(0, `rgba(${auraColor[0]}, ${auraColor[1]}, ${auraColor[2]}, 0)`);
        gradient.addColorStop(1, `rgba(${auraColor[0]}, ${auraColor[1]}, ${auraColor[2]}, 0.3)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(x - baseSize * 1.5, y - baseSize * 1.5, baseSize * 3, baseSize * 3);
      }

      // Main body shape based on form
      const form = visual.formaPrincipal || 1;
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      
      if (form === 1) { // Agile - oval
        ctx.beginPath();
        ctx.ellipse(x, y, baseSize * 0.6, baseSize * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (form === 2) { // Tank - circle
        ctx.beginPath();
        ctx.arc(x, y, baseSize * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else { // Attacker - diamond
        ctx.beginPath();
        ctx.moveTo(x, y - baseSize * 0.8);
        ctx.lineTo(x + baseSize * 0.6, y);
        ctx.lineTo(x, y + baseSize * 0.8);
        ctx.lineTo(x - baseSize * 0.6, y);
        ctx.closePath();
        ctx.fill();
      }

      // Pattern overlay
      if (advanced?.tipoPatron > 0) {
        ctx.globalAlpha = advanced.densidadPatron || 0.5;
        ctx.fillStyle = `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`;
        
        if (advanced.tipoPatron === 1) { // Spots
          for (let i = 0; i < 5; i++) {
            const spotX = x + (Math.random() - 0.5) * baseSize;
            const spotY = y + (Math.random() - 0.5) * baseSize;
            ctx.beginPath();
            ctx.arc(spotX, spotY, baseSize * 0.1, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (advanced.tipoPatron === 2) { // Stripes
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(x - baseSize * 0.6, y - baseSize * 0.8 + i * baseSize * 0.4, baseSize * 1.2, baseSize * 0.1);
          }
        }
        ctx.globalAlpha = 1;
      }

      // Appendages
      const numApps = Math.floor(visual.numApendices || 0);
      ctx.fillStyle = `rgb(${Math.floor(r * 0.8)}, ${Math.floor(g * 0.8)}, ${Math.floor(b * 0.8)})`;
      for (let i = 0; i < numApps; i++) {
        const angle = (i / numApps) * Math.PI * 2;
        const appX = x + Math.cos(angle) * baseSize * 0.9;
        const appY = y + Math.sin(angle) * baseSize * 0.9;
        ctx.beginPath();
        ctx.arc(appX, appY, baseSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }

      // Glow effect
      if (advanced?.emiteLuz) {
        ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
        ctx.shadowBlur = 20;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(x, y, baseSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      // Energy indicator (pulsing)
      if (energyMod > 0.8) {
        const pulse = Math.sin(Date.now() * 0.01) * 0.1 + 0.9;
        ctx.globalAlpha = pulse * 0.5;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, baseSize * 0.9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    };

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = '#f7fafc'; // Light background for now
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw creatures in a grid
    const cols = Math.min(3, parsedCreatures.length);
    const rows = Math.ceil(parsedCreatures.length / cols);
    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;
    const creatureSize = Math.min(cellWidth, cellHeight) * 0.3;

    parsedCreatures.forEach((creature, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * cellWidth + cellWidth / 2;
      const y = row * cellHeight + cellHeight / 2;
      
      drawCreature(creature, x, y, creatureSize);
      
      // Creature ID label
      ctx.fillStyle = '#2d3748';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`#${creature.id}`, x, y + creatureSize + 20);
    });

  }, [parsedCreatures, useColorModeValue]);

  return (
    <VStack spacing={6} align="stretch" w="full">
      {/* Enhanced Canvas */}
      <MotionBox
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        bg={bgColor}
        p={4}
        borderRadius="xl"
        border="1px"
        borderColor={borderColor}
      >
        <Text fontSize="lg" fontWeight="bold" mb={4} textAlign="center">
          🧬 Advanced Visual Ecosystem
        </Text>
        <canvas 
          ref={canvasRef}
          width={800}
          height={400}
          style={{ 
            width: '100%', 
            height: 'auto', 
            borderRadius: '8px',
            backgroundColor: useColorModeValue('#f7fafc', '#2d3748')
          }}
        />
      </MotionBox>

      {/* Detailed Creature Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        <AnimatePresence>
          {parsedCreatures.map((creature, index) => (
            <MotionCard
              key={creature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              bg={cardBg}
              border="1px"
              borderColor={borderColor}
              overflow="hidden"
            >
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  {/* Header */}
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" fontSize="lg">
                      Creature #{creature.id}
                    </Text>
                    <HStack spacing={1}>
                      <Icon as={FiHeart} color={creature.estaViva ? "green.500" : "red.500"} />
                      <Badge colorScheme={creature.estaViva ? "green" : "red"}>
                        {creature.estaViva ? "Alive" : "Dead"}
                      </Badge>
                    </HStack>
                  </Flex>

                  {/* Basic Stats */}
                  <SimpleGrid columns={2} spacing={2}>
                    <Box>
                      <Text fontSize="xs" color="gray.500">Age</Text>
                      <Text fontSize="sm" fontWeight="bold">
                        {parseFloat(creature.edadDiasCompletos).toFixed(1)} days
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500">Evolution Points</Text>
                      <Text fontSize="sm" fontWeight="bold" color="purple.500">
                        {parseFloat(creature.puntosEvolucion).toFixed(1)}
                      </Text>
                    </Box>
                  </SimpleGrid>

                  {/* Visual Traits */}
                  {creature.visual && (
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb={1}>Visual Traits</Text>
                      <HStack wrap="wrap" spacing={1}>
                        <Badge 
                          colorScheme="red" 
                          variant="solid"
                          style={{ 
                            backgroundColor: `rgb(${Math.floor((creature.visual.colorR || 0) * 255)}, ${Math.floor((creature.visual.colorG || 0) * 255)}, ${Math.floor((creature.visual.colorB || 0) * 255)})`,
                            color: 'white'
                          }}
                        >
                          Color
                        </Badge>
                        <Badge colorScheme="blue">
                          {FORM_TYPES[Math.floor((creature.visual.formaPrincipal || 1) - 1)] || 'Unknown'}
                        </Badge>
                        <Badge colorScheme="green">
                          Size: {(creature.visual.tamanoBase || 1).toFixed(1)}x
                        </Badge>
                        <Badge colorScheme="orange">
                          Apps: {Math.floor(creature.visual.numApendices || 0)}
                        </Badge>
                      </HStack>
                    </Box>
                  )}

                  {/* Advanced Effects */}
                  {creature.advanced && (
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb={1}>Advanced Effects</Text>
                      <HStack wrap="wrap" spacing={1}>
                        {creature.advanced.tipoPatron > 0 && (
                          <Badge colorScheme="purple">
                            {PATTERN_TYPES[creature.advanced.tipoPatron] || 'Pattern'}
                          </Badge>
                        )}
                        {creature.advanced.tipoAura > 0 && (
                          <Badge colorScheme="cyan">
                            {AURA_TYPES[creature.advanced.tipoAura] || 'Aura'}
                          </Badge>
                        )}
                        {creature.advanced.emiteLuz && (
                          <Badge colorScheme="yellow">✨ Glowing</Badge>
                        )}
                        {creature.advanced.efectoElemental > 0 && (
                          <Badge colorScheme="teal">
                            {ELEMENTAL_EFFECTS[creature.advanced.efectoElemental] || 'Elemental'}
                          </Badge>
                        )}
                      </HStack>
                    </Box>
                  )}

                  {/* Health & Energy Bars */}
                  {creature.advanced && (
                    <VStack spacing={1} align="stretch">
                      <Box>
                        <Flex justify="space-between" align="center" mb={1}>
                          <Text fontSize="xs" color="gray.500">Health</Text>
                          <Text fontSize="xs" color="gray.500">
                            {Math.floor((creature.advanced.nivelSalud || 1) * 100)}%
                          </Text>
                        </Flex>
                        <Progress 
                          value={(creature.advanced.nivelSalud || 1) * 100} 
                          colorScheme="red" 
                          size="sm" 
                          borderRadius="full"
                        />
                      </Box>
                      <Box>
                        <Flex justify="space-between" align="center" mb={1}>
                          <Text fontSize="xs" color="gray.500">Energy</Text>
                          <Text fontSize="xs" color="gray.500">
                            {Math.floor((creature.advanced.nivelEnergia || 1) * 100)}%
                          </Text>
                        </Flex>
                        <Progress 
                          value={(creature.advanced.nivelEnergia || 1) * 100} 
                          colorScheme="blue" 
                          size="sm" 
                          borderRadius="full"
                        />
                      </Box>
                    </VStack>
                  )}
                </VStack>
              </CardBody>
            </MotionCard>
          ))}
        </AnimatePresence>
      </SimpleGrid>
    </VStack>
  );
} 