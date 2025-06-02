'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Tooltip,
  Button,
  ButtonGroup,
  Tag,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Divider,
  Textarea,
  IconButton
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiHeart, FiEye, FiStar, FiMessageCircle } from 'react-icons/fi';
import { OpenRouterService } from '../services/OpenRouterService';
import { PersonalityService, PersonalityData } from '../services/PersonalityService';
import * as fcl from '@onflow/fcl';

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

// Chat bubble interface
interface ChatBubble {
  id: number;
  creatureId: number;
  message: string;
  timestamp: number;
  duration: number;
  position: { x: number; y: number };
  level: string; // communication level
}

const MotionBox = motion(Box);
const MotionCard = motion(Card);

// Helper functions to parse trait values - COMPLETE PARSING
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
    // Pattern traits
    if (part.includes('PAT:')) traits.tipoPatron = parseInt(part.split('PAT:')[1]) || 0;
    if (part.includes('DENS:')) traits.densidadPatron = parseFloat(part.split('DENS:')[1]) || 0;
    
    // Secondary colors
    if (part.includes('SEC:')) {
      const colorStr = part.split('SEC:')[1];
      const colors = colorStr.split(',');
      traits.colorSecundarioR = parseFloat(colors[0]) || 0;
      traits.colorSecundarioG = parseFloat(colors[1]) || 0;
      traits.colorSecundarioB = parseFloat(colors[2]) || 0;
    }
    
    // Surface properties
    if (part.includes('BRILL:')) traits.brilloSuperficie = parseFloat(part.split('BRILL:')[1]) || 0;
    
    // Aura effects
    if (part.includes('AURA:')) traits.tipoAura = parseInt(part.split('AURA:')[1]) || 0;
    if (part.includes('AINT:')) traits.intensidadAura = parseFloat(part.split('AINT:')[1]) || 0;
    
    // Light/bioluminescence
    if (part.includes('LUZ:')) traits.emiteLuz = part.split('LUZ:')[1] === '1';
    if (part.includes('LUZC:')) {
      const lightStr = part.split('LUZC:')[1];
      const lightColors = lightStr.split(',');
      traits.colorLuzR = parseFloat(lightColors[0]) || 0.8;
      traits.colorLuzG = parseFloat(lightColors[1]) || 0.8;
      traits.colorLuzB = parseFloat(lightColors[2]) || 0.6;
    }
    
    // Physical features
    if (part.includes('OJOS:')) traits.tipoOjos = parseInt(part.split('OJOS:')[1]) || 0;
    if (part.includes('TOJOS:')) traits.tamanoOjos = parseFloat(part.split('TOJOS:')[1]) || 1;
    if (part.includes('BOCA:')) traits.tipoBoca = parseInt(part.split('BOCA:')[1]) || 0;
    if (part.includes('TEX:')) traits.texturaPiel = parseInt(part.split('TEX:')[1]) || 0;
    
    // Cycles and states
    if (part.includes('RITMO:')) traits.ritmoCircadiano = parseFloat(part.split('RITMO:')[1]) || 0.5;
    if (part.includes('SALUD:')) traits.nivelSalud = parseFloat(part.split('SALUD:')[1]) || 1;
    if (part.includes('ENERGIA:')) traits.nivelEnergia = parseFloat(part.split('ENERGIA:')[1]) || 1;
    
    // Elemental effects
    if (part.includes('ELEM:')) traits.efectoElemental = parseInt(part.split('ELEM:')[1]) || 0;
    
    // Evolution marks
    if (part.includes('MARCAS:')) {
      const marcasStr = part.split('MARCAS:')[1];
      traits.marcasEvolucion = marcasStr ? marcasStr.split(',').map(m => parseInt(m)).filter(m => !isNaN(m)) : [];
    }
  });
  
  return traits;
};

// Parse PersonalityModuleV2 traits for chat functionality
const parsePersonalityTraits = (traitValue: string | null) => {
  if (!traitValue) return null;
  
  const traits: any = {};
  const parts = traitValue.split('|');
  
  parts.forEach(part => {
    // Core temperament
    if (part.includes('TEMP:')) traits.temperamento = parseFloat(part.split('TEMP:')[1]) || 0.5;
    if (part.includes('AGR:')) traits.agresividad = parseFloat(part.split('AGR:')[1]) || 0.3;
    if (part.includes('CUR:')) traits.curiosidad = parseFloat(part.split('CUR:')[1]) || 0.7;
    if (part.includes('SOC:')) traits.energia_social = parseFloat(part.split('SOC:')[1]) || 0.5;
    if (part.includes('CREA:')) traits.creatividad = parseFloat(part.split('CREA:')[1]) || 0.5;
    if (part.includes('EMP:')) traits.empatia = parseFloat(part.split('EMP:')[1]) || 0.6;
    
    // Intelligence & communication
    if (part.includes('INT:')) traits.inteligencia_base = parseFloat(part.split('INT:')[1]) || 0.4;
    if (part.includes('VOC:')) traits.vocabulario_size = parseInt(part.split('VOC:')[1]) || 10;
    if (part.includes('LING:')) traits.complejidad_linguistica = parseFloat(part.split('LING:')[1]) || 0.1;
    
    // Emotional state
    if (part.includes('FEL:')) traits.felicidad = parseFloat(part.split('FEL:')[1]) || 0.5;
    if (part.includes('CONF:')) traits.confianza = parseFloat(part.split('CONF:')[1]) || 0.5;
    if (part.includes('EST:')) traits.estres = parseFloat(part.split('EST:')[1]) || 0.2;
    
    // Family data
    if (part.includes('GEN:')) traits.generacion = parseInt(part.split('GEN:')[1]) || 0;
    if (part.includes('ORIG:')) traits.origen_nacimiento = part.split('ORIG:')[1] || 'created';
  });
  
  return traits;
};

// Communication level determination based on traits
const getCommunicationLevel = (personality: any): string => {
  if (!personality) return 'bebe';
  
  const vocabulary_factor = personality.vocabulario_size / 2000; // MAX_VOCABULARY_SIZE from contract
  const intelligence_factor = personality.inteligencia_base || 0.4;
  const linguistic_factor = personality.complejidad_linguistica || 0.1;
  
  const development_score = (vocabulary_factor + intelligence_factor + linguistic_factor) / 3.0;
  
  if (development_score < 0.2) return 'bebe';
  if (development_score < 0.4) return 'toddler';
  if (development_score < 0.6) return 'child';
  if (development_score < 0.8) return 'teen';
  return 'adult';
};

// Check if creature should send spontaneous message (based on contract logic)
const shouldSendSpontaneousMessage = (personality: any): boolean => {
  if (!personality) {
    console.log('🎲 No personality data for chat roll');
    return false;
  }
  
  // Increased base chance for more frequent messages
  const frecuencia_chat = 0.6; // Increased from 0.3
  const baseChance = frecuencia_chat * 0.25; // 0-25% base (increased from 0.1)
  
  // Calculate all modifiers
  let multiplier = 1.0;
  const modifiers = [];
  
  // Emotional modifiers - more generous
  if (personality.felicidad > 0.6) {
    multiplier *= 1.4;
    modifiers.push(`happy(${personality.felicidad.toFixed(2)}): x1.4`);
  }
  if (personality.estres > 0.5) {
    multiplier *= 1.3;
    modifiers.push(`stressed(${personality.estres.toFixed(2)}): x1.3`);
  }
  if (personality.energia_social > 0.4) {
    multiplier *= 1.3;
    modifiers.push(`social(${personality.energia_social.toFixed(2)}): x1.3`);
  }
  
  // Personality modifiers - more generous
  if (personality.temperamento < 0.3) {
    multiplier *= 0.7;
    modifiers.push(`shy(${personality.temperamento.toFixed(2)}): x0.7`);
  }
  if (personality.curiosidad > 0.5) {
    multiplier *= 1.2;
    modifiers.push(`curious(${personality.curiosidad.toFixed(2)}): x1.2`);
  }
  if (personality.creatividad > 0.6) {
    multiplier *= 1.1;
    modifiers.push(`creative(${personality.creatividad.toFixed(2)}): x1.1`);
  }
  if (personality.empatia > 0.6) {
    multiplier *= 1.1;
    modifiers.push(`empathetic(${personality.empatia.toFixed(2)}): x1.1`);
  }
  
  // Intelligence bonus
  if (personality.inteligencia_base > 0.6) {
    multiplier *= 1.2;
    modifiers.push(`intelligent(${personality.inteligencia_base.toFixed(2)}): x1.2`);
  }
  
  // Communication level bonus
  const level = getCommunicationLevel(personality);
  if (level === 'adult') {
    multiplier *= 1.3;
    modifiers.push(`adult: x1.3`);
  } else if (level === 'teen') {
    multiplier *= 1.2;
    modifiers.push(`teen: x1.2`);
  } else if (level === 'child') {
    multiplier *= 1.1;
    modifiers.push(`child: x1.1`);
  }
  
  // Calculate final chance
  const finalChance = Math.min(baseChance * multiplier, 0.8); // Max 80% chance (increased from 50%)
  const roll = Math.random();
  const willChat = finalChance > 0.02 && roll < finalChance;
  
  console.log(`🎲 Chat probability: base=${(baseChance*100).toFixed(1)}% × ${multiplier.toFixed(2)} = ${(finalChance*100).toFixed(1)}% | roll=${(roll*100).toFixed(1)}% | result=${willChat ? 'CHAT' : 'NO'}`);
  if (modifiers.length > 0) {
    console.log(`   Modifiers: ${modifiers.join(', ')}`);
  }
  
  return willChat;
};

// Visual trait type mappings - COMPLETE FROM CONTRACTS
const PATTERN_TYPES = ['Smooth', 'Spots', 'Stripes', 'Dots', 'Swirls'];
const AURA_TYPES = ['None', '🔥Fire', '💧Water', '🌍Earth', '💨Air'];
const EYE_TYPES = ['Round', 'Feline', 'Compound', 'Multiple'];
const MOUTH_TYPES = ['Small', 'Large', 'Beak', 'Tentacles'];
const TEXTURE_TYPES = ['Smooth', 'Scaled', 'Furry', 'Crystalline'];
const ELEMENTAL_EFFECTS = ['Normal', '💎Crystal', '🔥Flame', '❄️Ice'];
const FORM_TYPES = ['Agile', 'Tank', 'Attacker'];
const MOVEMENT_TYPES = ['Walk', 'Run', 'Hop', 'Dash'];
const EVOLUTION_MARKS: Record<number, string> = {
  1: '🌱First Evolution',
  2: '🛡️Survivor', 
  3: '👶Breeder',
  4: '👴Elder',
  5: '⚔️Fighter',
  6: '🗺️Explorer'
};

export default function AdvancedCreatureVisualizer({ 
  creatures, 
  onRefresh, 
  isLoading = false 
}: AdvancedCreatureVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [time, setTime] = useState(0);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const toast = useToast();
  
  // Canvas colors (moved out of useEffect to avoid hook violations)
  const canvasBgColor = useColorModeValue('#f7fafc', '#0f0f23');
  const textColor = useColorModeValue('#2d3748', '#e2e8f0');
  
  // Background gradient colors
  // Primordia Environment Colors - Genesis Shaper's Realm
  const nebulaTopColor = useColorModeValue('#1a0b2e', '#0f051a'); // Deep cosmic purple
  const nebulaMidColor = useColorModeValue('#2d1b4e', '#1a0d2a'); // Mid nebula
  const nebulaDeepColor = useColorModeValue('#4a3268', '#251741'); // Deeper purple
  const nebulaBottomColor = useColorModeValue('#6a4c93', '#352352'); // Base nebula
  const animaStreamColor = useColorModeValue('#8a2be2', '#9d4edd'); // Anima energy streams
  const creationEnergyColor = useColorModeValue('#ff6b9d', '#ff8cc8'); // Creation collision energy
  const echoColor = useColorModeValue('#ffd700', '#ffec8b'); // Echoes of First Forging
  const elementalStratumColor = useColorModeValue('#4ade80', '#22d3ee'); // Elemental strata
  const selectionColor = useColorModeValue('#ff6b6b', '#ffa726');
  const gridColor = useColorModeValue('rgba(138, 43, 226, 0.2)', 'rgba(157, 78, 221, 0.3)');
  
  // Environment state - simplified, no UI controls
  const [showTrails] = useState(true);
  const [showParticles] = useState(true);
  const [showGrid] = useState(false);
  const [isPlaying] = useState(true);
  const [animationSpeed] = useState(1.0);
  const [selectedCreature, setSelectedCreature] = useState<number | null>(null);

  // Chat system state
  const chatBubblesRef = useRef<ChatBubble[]>([]);
  const [openRouterApiKey, setOpenRouterApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [openRouterService, setOpenRouterService] = useState<OpenRouterService | null>(null);
  const chatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastChatTimeRef = useRef<Map<number, number>>(new Map());
  const pendingChatRequests = useRef<Set<number>>(new Set());
  const [isGeneratingMessages, setIsGeneratingMessages] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<{current: number, total: number} | null>(null);

  // Individual creature chat modal state
  const [selectedCreatureChat, setSelectedCreatureChat] = useState<any>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{sender: 'user' | 'creature', message: string, timestamp: number}>>([]);
  const [userMessage, setUserMessage] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [creatureChatHistory, setCreatureChatHistory] = useState<Map<number, Array<{sender: 'user' | 'creature', message: string, timestamp: number}>>>(new Map());
  const [currentUserAddress, setCurrentUserAddress] = useState<string | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Enhanced creature data with physics - using useRef to persist between renders
  const creaturePhysicsRef = useRef<Map<number, any>>(new Map());
  
  // Parse all creature visual data
  const parsedCreatures = useMemo(() => {
    return creatures.map(creature => {
      const visualTraits = parseVisualTraits(creature.traitValues['visual']);
      const advancedTraits = parseAdvancedVisualTraits(creature.traitValues['advanced_visual']);
      const personalityTraits = parsePersonalityTraits(creature.traitValues['personality']);
      
      return {
        ...creature,
        visual: visualTraits,
        advanced: advancedTraits,
        personality: personalityTraits
      };
    });
  }, [creatures]);

  // Initialize OpenRouter service when API key is provided
  useEffect(() => {
    if (openRouterApiKey.trim()) {
      try {
        const service = new OpenRouterService(openRouterApiKey);
        setOpenRouterService(service);
        setShowApiKeyInput(false);
        console.log('🤖 AI Service initialized successfully');
        toast({
          title: "AI Service Connected",
          description: "Generating initial messages for all creatures...",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('❌ Failed to initialize AI service:', error);
        toast({
          title: "Connection Failed",
          description: "Invalid API key or service unavailable",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [openRouterApiKey, toast]);

  // Generate initial messages when service is ready
  useEffect(() => {
    if (openRouterService && parsedCreatures.length > 0 && !isGeneratingMessages) {
      generateInitialMessages();
    }
  }, [openRouterService, parsedCreatures.length]);

  // Message cache management with intelligent reuse
  const getCachedMessages = (creatureId: number): string[] => {
    const key = `creature_messages_${creatureId}`;
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : [];
  };

  const setCachedMessages = (creatureId: number, messages: string[]) => {
    const key = `creature_messages_${creatureId}`;
    // Keep only the most recent 10 messages
    const trimmedMessages = messages.slice(-10);
    localStorage.setItem(key, JSON.stringify(trimmedMessages));
  };

  const getNextMessage = (creatureId: number): string | null => {
    const cached = getCachedMessages(creatureId);
    if (cached.length === 0) return null;

    // 70% chance to reuse existing message, 30% to generate new
    const shouldReuse = Math.random() < 0.7;
    
    if (shouldReuse && cached.length > 0) {
      // Select random message from cache
      const randomIndex = Math.floor(Math.random() * cached.length);
      const selectedMessage = cached[randomIndex];
      console.log(`🔄 Reusing cached message for creature ${creatureId}: "${selectedMessage}" (${randomIndex + 1}/${cached.length})`);
      return selectedMessage;
    } else {
      // Generate new message (trigger background generation)
      console.log(`🆕 Triggering new message generation for creature ${creatureId} (${cached.length} in pool)`);
      generateBackgroundMessage(creatureId);
      
      // For now, return a random existing message while new one generates
      if (cached.length > 0) {
        const randomIndex = Math.floor(Math.random() * cached.length);
        return cached[randomIndex];
      }
      return null;
    }
  };

  const addMessageToPool = (creatureId: number, newMessage: string) => {
    const cached = getCachedMessages(creatureId);
    
    // Avoid exact duplicates
    if (!cached.includes(newMessage)) {
      cached.push(newMessage);
      setCachedMessages(creatureId, cached);
      console.log(`➕ Added new message to pool for creature ${creatureId}: "${newMessage}" (${cached.length}/10)`);
    } else {
      console.log(`🔄 Message already exists in pool for creature ${creatureId}, skipping duplicate`);
    }
  };

  const generateBackgroundMessage = async (creatureId: number) => {
    if (pendingChatRequests.current.has(creatureId)) {
      console.log(`⏳ Generation already pending for creature ${creatureId}`);
      return;
    }

    console.log(`🎬 generateBackgroundMessage called for creature ${creatureId}`);
    
    try {
      pendingChatRequests.current.add(creatureId);
      
      const creature = parsedCreatures.find(c => c.id === creatureId);
      if (!creature) {
        console.log(`❌ Creature ${creatureId} not found for background generation`);
        return;
      }
      
      console.log(`🔄 Generating background message for creature ${creatureId}...`);
      
      // Try to get personality data from contract first
      let personalityData = null;
      try {
        // Get current user address
        const user = await fcl.currentUser.snapshot();
        if (user.addr) {
          personalityData = await PersonalityService.getCreaturePersonalityPrompts(user.addr, creatureId);
        } else {
          console.log(`❌ No user address available for creature ${creatureId}`);
        }
      } catch (error) {
        console.error(`❌ Could not get personality data for creature ${creatureId}, falling back to local generation`);
      }
      
      let message: string | null = null;
      if (personalityData && !personalityData.error) {
        console.log(`✅ Using contract-based personality data for creature ${creatureId}`);
        const prompt = PersonalityService.getPromptFromPersonalityData(personalityData, 'spontaneous');
        
        if (openRouterService) {
          message = await openRouterService.chat(prompt);
        }
      } else {
        console.log(`❌ Could not get personality data for creature ${creatureId}, falling back to local generation`);
        
        // Get previous messages for context
        const previousMessages = getCachedMessages(creatureId);
        const contextMessages = previousMessages.slice(-3); // Last 3 messages for context
        
        // Use local generation with context
        const creatureWithContext = { ...creature, previousMessages: contextMessages };
        message = await generateCreatureChat(creatureWithContext);
      }
      
      if (message) {
        addMessageToPool(creatureId, message);
        console.log(`✅ Background message cached for creature ${creatureId}: "${message}"`);
      } else {
        console.log(`❌ Failed to generate background message for creature ${creatureId}`);
      }
      
    } catch (error) {
      console.error(`❌ Error in generateBackgroundMessage for creature ${creatureId}:`, error);
    } finally {
      pendingChatRequests.current.delete(creatureId);
    }
  };

  const generateInitialMessages = async () => {
    if (!openRouterService || parsedCreatures.length === 0) return;
    
    console.log(`🎬 Generating initial message pool for ${parsedCreatures.length} creatures...`);
    setGenerationProgress({ current: 0, total: parsedCreatures.length });
    
    for (let i = 0; i < parsedCreatures.length; i++) {
      const creature = parsedCreatures[i];
      const cached = getCachedMessages(creature.id);
      
      // Only generate if pool has less than 3 messages
      if (cached.length < 3) {
        console.log(`🔄 Generating initial messages for creature ${creature.id} (${cached.length}/10 in pool)...`);
        
        try {
          // Generate 2-3 initial messages to start the pool
          const messagesToGenerate = Math.min(3 - cached.length, 2);
          
          for (let j = 0; j < messagesToGenerate; j++) {
            const previousMessages = getCachedMessages(creature.id);
            const contextMessages = previousMessages.slice(-2);
            const message = await generateCreatureChat(creature);
            
            if (message) {
              addMessageToPool(creature.id, message);
            }
            
            // Small delay between generations
            if (j < messagesToGenerate - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
        } catch (error) {
          console.error(`❌ Error generating initial messages for creature ${creature.id}:`, error);
        }
      } else {
        console.log(`✅ Creature ${creature.id} already has sufficient messages (${cached.length}/10)`);
      }
      
      setGenerationProgress({ current: i + 1, total: parsedCreatures.length });
      
      // Delay between creatures
      if (i < parsedCreatures.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setGenerationProgress(null);
    console.log(`✅ Initial message pool generation complete`);
  };

  const generateChatPrompt = (creature: any, previousMessages: string[] = []): string => {
    const personality = creature.personality;
    if (!personality) return '';

    const personalityDesc = getPersonalityDescription(personality);
    const emotionalState = getEmotionalState(personality);
    const communicationLevel = getCommunicationLevel(personality);
    
    // Get current time context
    const now = new Date();
    const currentHour = now.getHours();
    const timeOfDay = currentHour < 6 ? 'night' : 
                     currentHour < 12 ? 'morning' : 
                     currentHour < 18 ? 'afternoon' : 'evening';
    
    const contextString = previousMessages.length > 0 
      ? `\n\nRecent things you've said before: ${previousMessages.slice(-3).map(msg => `"${msg}"`).join(', ')}`
      : '';

    return `You are a ${creature.name}, a mystical life form from Primordia, realm of the Genesis Shapers. 

PERSONALITY: ${personalityDesc}
CURRENT EMOTIONAL STATE: ${emotionalState}
COMMUNICATION LEVEL: ${communicationLevel}
AGE: ${creature.edadDiasCompletos} simulated days old
TIME: ${timeOfDay}
ANIMA ESSENCE: ${creature.puntosEvolucion} points

You exist in the primordial nebula where creation energy flows like living rivers. You can sense the Echoes of the First Forging around you.

COMMUNICATION STYLE for ${communicationLevel}:
- bebe: Single words, sounds like "goo", "bah", "happy"
- toddler: 2-3 words, simple concepts like "me happy", "play now" 
- child: Short sentences, curious, asks simple questions
- teen: More complex thoughts, sometimes moody or excited
- adult: Full sentences, philosophical, can discuss complex ideas

${contextString}

Generate ONE short message (under 50 characters) that you might spontaneously say right now. Be authentic to your personality and age. Avoid repeating exactly what you've said before.

Response:`;
  };

  const getPersonalityDescription = (personality: any): string => {
    const traits = [];
    if (personality.temperamento > 0.7) traits.push('extroverted');
    else if (personality.temperamento < 0.3) traits.push('shy');
    
    if (personality.agresividad > 0.7) traits.push('aggressive');
    else if (personality.agresividad < 0.3) traits.push('peaceful');
    
    if (personality.curiosidad > 0.7) traits.push('curious');
    if (personality.creatividad > 0.7) traits.push('creative');
    if (personality.empatia > 0.7) traits.push('empathetic');
    
    return traits.length > 0 ? traits.join(', ') : 'balanced';
  };

  const getEmotionalState = (personality: any): string => {
    if (personality.felicidad > 0.8) return 'very happy';
    if (personality.estres > 0.7) return 'stressed';
    if (personality.felicidad < 0.3) return 'sad';
    return 'calm';
  };

  const generateCreatureChat = async (creature: any): Promise<string | null> => {
    if (!openRouterService || !creature.personality) return null;
    
    try {
      const prompt = generateChatPrompt(creature);
      const response = await openRouterService.chat(prompt);
      return response?.trim() || null;
    } catch (error) {
      console.error('Failed to generate creature chat:', error);
      return null;
    }
  };

  const addChatBubble = (creatureId: number, message: string, level: string) => {
    const physics = creaturePhysicsRef.current.get(creatureId);
    if (!physics) {
      console.warn(`💭 Cannot add chat bubble for creature ${creatureId}: no physics found`);
      return;
    }
    
    const bubble: ChatBubble = {
      id: Date.now() + Math.random(),
      creatureId,
      message,
      timestamp: Date.now(),
      duration: Math.max(5000, message.length * 150), // LONGER DURATION: 5+ seconds minimum
      position: { x: physics.x, y: physics.y },
      level
    };
    
    // Add to ref directly - no async state updates
    chatBubblesRef.current = [...chatBubblesRef.current, bubble];
    
    // Remove bubble after duration
    setTimeout(() => {
      chatBubblesRef.current = chatBubblesRef.current.filter(b => b.id !== bubble.id);
    }, bubble.duration);
  };

  // Check for creature message display (using cached messages)
  useEffect(() => {
    if (!openRouterService) {
      console.log('💬 No OpenRouter service available for chat');
      return;
    }
    
    console.log('💬 Starting cached message display system');
    
    const checkCachedMessageDisplay = () => {
      const now = Date.now();
      const aliveCreatures = parsedCreatures.filter(c => c.estaViva && c.personality);
      
      if (aliveCreatures.length === 0) {
        return;
      }
      
      let eligibleCount = 0;
      let restingCount = 0;
      
      for (const creature of aliveCreatures) {
        const lastChatTime = lastChatTimeRef.current.get(creature.id) || 0;
        const timeSinceLastChat = now - lastChatTime;
        
        // Only check every 45 seconds per creature (save API credits)
        if (timeSinceLastChat < 45000) {
          continue;
        }
        
        // Check if creature is in a resting state
        const physics = creaturePhysicsRef.current.get(creature.id);
        if (!physics) continue;
        
        const currentSpeed = Math.sqrt(physics.vx * physics.vx + physics.vy * physics.vy);
        
        const isSlowOrResting = currentSpeed < 0.5 || 
                               physics.activityState === 'resting' || 
                               physics.activityState === 'observing' ||
                               physics.activityState === 'sleeping' ||
                               physics.activityState === 'drowsy';
        
        if (physics.activityState === 'resting' || physics.activityState === 'observing' || 
            physics.activityState === 'sleeping' || physics.activityState === 'drowsy') {
          restingCount++;
        }
        
        if (!isSlowOrResting) continue;
        
        eligibleCount++;
        
        // Check if creature should chat (simpler logic)
        const shouldChat = shouldSendSpontaneousMessage(creature.personality);
        
        if (shouldChat) {
          // Get cached message instead of generating new one
          const message = getNextMessage(creature.id);
          
          if (message) {
            const level = getCommunicationLevel(creature.personality);
            addChatBubble(creature.id, message, level);
            lastChatTimeRef.current.set(creature.id, now);
            console.log(`💬 Creature ${creature.id} says: "${message}" (${level} level, cached)`);
          } else {
            console.log(`📭 Creature ${creature.id}: No cached messages available`);
          }
        }
      }
      
      if (eligibleCount > 0) {
        console.log(`💬 Chat check: ${eligibleCount}/${aliveCreatures.length} eligible, ${restingCount} resting`);
      }
    };
    
    // Check every 15 seconds (save API credits)
    chatIntervalRef.current = setInterval(checkCachedMessageDisplay, 15000);
    
    return () => {
      if (chatIntervalRef.current) {
        clearInterval(chatIntervalRef.current);
      }
    };
  }, [openRouterService, parsedCreatures]);

  // Cleanup chat interval on unmount
  useEffect(() => {
    return () => {
      if (chatIntervalRef.current) {
        clearInterval(chatIntervalRef.current);
      }
    };
  }, []);

  // Initialize creature physics
  const initializeCreaturePhysics = useCallback((creature: any, index: number, canvasW: number, canvasH: number) => {
    const cols = Math.ceil(Math.sqrt(parsedCreatures.length));
    const spacing = Math.min(120, canvasW / cols);
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    // Random initial position within bounds
    const baseX = 100 + col * spacing + (Math.random() - 0.5) * 60;
    const baseY = 100 + row * spacing + (Math.random() - 0.5) * 60;
    
    const visual = creature.visual || {};
    const advanced = creature.advanced || {};
    
    // Give creatures an immediate target far from their starting position
    const targetX = baseX + (Math.random() - 0.5) * 200; // Increased from 100 to 200
    const targetY = baseY + (Math.random() - 0.5) * 200;
    
    return {
      id: creature.id,
      x: Math.max(50, Math.min(canvasW - 50, baseX)),
      y: Math.max(50, Math.min(canvasH - 50, baseY)),
      targetX: Math.max(50, Math.min(canvasW - 50, targetX)),
      targetY: Math.max(50, Math.min(canvasH - 50, targetY)),
      vx: 0,
      vy: 0,
      rotation: 0,
      scale: Math.max(0.8, (visual.tamanoBase || 1) * 0.7),
      pulsePhase: Math.random() * Math.PI * 2,
      trailPoints: [],
      particles: [],
      energy: Math.min(1.0, parseFloat(creature.puntosEvolucion) / 50),
      
          // Movement patterns based on traits - FULL decimal precision for uniqueness
    movementType: Math.floor(visual.patronMovimiento || 1) % 4,
    movementVariation: (visual.patronMovimiento || 1) % 1, // Decimal part = personality signature
    movementPersonality: {
      // Extract decimals from multiple traits for compound uniqueness
      speedMod: (visual.tamanoBase || 1) % 1, // Size decimal affects speed
      patternMod: (visual.formaPrincipal || 1) % 1, // Form decimal affects pattern
      energyMod: (visual.numApendices || 0) % 1, // Appendage decimal affects energy
    },
    movementTimer: Math.random() * 1000,
    movementIntensity: Math.max(0.2, advanced.nivelEnergia || 0.4), // Even more conservative
      
      // Territory for territorial creatures
      territoryX: baseX,
      territoryY: baseY,
      territoryRadius: 40 + (advanced.nivelSalud || 0.5) * 30,
      
      // Activity states for natural behavior
      activityState: 'active', // 'active', 'resting', 'observing'
      activityTimer: 0,
      restDuration: 0,
      nextActivityChange: Math.random() * 240 + 180, // 3-7 seconds initially (longer for clicks)
    };
  }, [parsedCreatures.length]);

  // Physics and particle systems
  const updateCreaturePhysics = useCallback((physics: any, creature: any, currentTime: number, canvasW: number, canvasH: number) => {
    // INITIALIZE ACTIVITY STATE for existing creatures that don't have it
    if (!physics.activityState) {
      physics.activityState = 'active';
      physics.activityTimer = 0;
      physics.restDuration = 0;
      physics.nextActivityChange = Math.random() * 180 + 120;
      console.log(`Initialized activity state for creature ${physics.id}`);
    }
    
    // SAFETY: Validate and fix NaN coordinates immediately
    if (isNaN(physics.x) || isNaN(physics.y)) {
      console.warn(`Creature ${physics.id} has NaN coordinates, resetting to safe position`);
      physics.x = 100 + Math.random() * (canvasW - 200);
      physics.y = 100 + Math.random() * (canvasH - 200);
      physics.vx = 0;
      physics.vy = 0;
    }
    
    // SAFETY: Validate targets
    if (isNaN(physics.targetX) || isNaN(physics.targetY)) {
      console.warn(`Creature ${physics.id} has NaN targets, setting new targets`);
      physics.targetX = 100 + Math.random() * (canvasW - 200);
      physics.targetY = 100 + Math.random() * (canvasH - 200);
    }
    
    // SAFETY: Validate velocities  
    if (isNaN(physics.vx) || isNaN(physics.vy)) {
      console.warn(`Creature ${physics.id} has NaN velocities, resetting to zero`);
      physics.vx = 0;
      physics.vy = 0;
    }
    
    // Always update physics, but movement speed depends on isPlaying
    const speedMultiplier = isPlaying ? 1.0 : 0.0;

    const visual = creature.visual || {};
    const advanced = creature.advanced || {};
    
    // Update animation phases (always animate breathing)
    physics.pulsePhase += 0.02 * animationSpeed;
    physics.movementTimer += speedMultiplier; // Only increment timer when playing
    
    // Movement patterns - smooth acceleration from rest - ULTRA SLOW FOR EASY CLICKS
    const baseSpeed = 0.015 * animationSpeed * speedMultiplier;  // Ultra slow for easy clicking
    const energyMod = Math.max(0.1, physics.movementIntensity || 0.5); // SAFETY: Ensure minimum energy
    const movementVariation = Math.max(0, Math.min(1, physics.movementVariation || 0)); // SAFETY: Clamp to [0,1]
    
    // CIRCADIAN RHYTHM: Based on real browser time
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60; // 0-24 with decimals
    const circadianRhythm = advanced.ritmoCircadiano || 0.5; // 0-1 creature's preference
    
    // Calculate if creature should be awake based on their circadian rhythm
    // circadianRhythm 0 = nocturnal, 0.5 = crepuscular, 1 = diurnal
    let shouldBeAwake = false;
    let sleepIntensity = 0; // 0 = fully awake, 1 = deep sleep
    
    if (circadianRhythm < 0.3) {
      // Nocturnal (active 20:00-06:00)
      shouldBeAwake = currentHour >= 20 || currentHour <= 6;
      sleepIntensity = shouldBeAwake ? 0 : Math.sin((currentHour - 6) / 14 * Math.PI) * 0.8;
    } else if (circadianRhythm > 0.7) {
      // Diurnal (active 06:00-20:00)  
      shouldBeAwake = currentHour >= 6 && currentHour <= 20;
      sleepIntensity = shouldBeAwake ? 0 : Math.sin((currentHour >= 20 ? currentHour - 20 : currentHour + 4) / 10 * Math.PI) * 0.8;
    } else {
      // Crepuscular (active dawn/dusk: 05:00-08:00 and 17:00-21:00)
      shouldBeAwake = (currentHour >= 5 && currentHour <= 8) || (currentHour >= 17 && currentHour <= 21);
      if (currentHour >= 9 && currentHour <= 16) {
        sleepIntensity = 0.6; // Afternoon nap
      } else if (currentHour >= 22 || currentHour <= 4) {
        sleepIntensity = 0.8; // Night sleep
      } else {
        sleepIntensity = 0;
      }
    }
    
    // NATURAL ACTIVITY CYCLE: Influenced by circadian rhythm
    physics.activityTimer++;
    
    if (physics.activityTimer >= physics.nextActivityChange) {
      const healthFactor = advanced.nivelSalud || 1.0;
      const energyFactor = advanced.nivelEnergia || 1.0;
      
      // Determine next activity based on circadian rhythm and creature state
      if (sleepIntensity > 0.5) {
        // Should be sleeping due to circadian rhythm
        physics.activityState = 'sleeping';
        physics.nextActivityChange = physics.activityTimer + Math.floor(600 + Math.random() * 900); // 10-25 seconds of sleep (MUCH LONGER)
      } else if (!shouldBeAwake && sleepIntensity > 0.2) {
        // Drowsy period
        physics.activityState = 'drowsy';
        physics.nextActivityChange = physics.activityTimer + Math.floor(240 + Math.random() * 360); // 4-10 seconds (MUCH LONGER)
      } else if (physics.activityState === 'active') {
        // Normal activity cycle when awake - MUCH MORE RESTING FOR EASIER CLICKS AND CHAT
        const shouldRest = Math.random() < (0.7 + (1 - energyFactor) * 0.2 + sleepIntensity * 0.1); // MUCH higher chance to rest (70%+)
        physics.activityState = shouldRest ? 'resting' : 'observing';
        
        if (shouldRest) {
          physics.restDuration = Math.floor(300 + Math.random() * 600 + (1 - energyFactor) * 300); // 5-20 seconds rest (MUCH LONGER)
          physics.nextActivityChange = physics.activityTimer + physics.restDuration;
        } else {
          physics.nextActivityChange = physics.activityTimer + Math.floor(180 + Math.random() * 300); // 3-8 seconds observing (MUCH LONGER)
        }
      } else {
        // Return to activity when awake - SHORTER ACTIVE PERIODS
        physics.activityState = 'active';
        const activityDuration = Math.floor(60 + Math.random() * 120 + energyFactor * 60); // 1-4 seconds active (MUCH SHORTER)
        physics.nextActivityChange = physics.activityTimer + activityDuration;
      }
    }
    
    // APPLY MOVEMENT BASED ON ACTIVITY STATE AND CIRCADIAN RHYTHM
    const sleepSpeedMod = physics.activityState === 'sleeping' ? 0 : 
                         physics.activityState === 'drowsy' ? 0.3 : 1.0;
    
    if (physics.activityState === 'active' || physics.activityState === 'drowsy') {
      switch (physics.movementType) {
        case 0: // Guardian - distinctive protective patrols with decimal personality
          const guardianSpeedBase = 0.0002 * (0.5 + movementVariation) * sleepSpeedMod; // Even slower for clicks
          const guardianSpeed = guardianSpeedBase * (0.6 + physics.movementPersonality.speedMod * 0.4); // Individual speed signature
          const guardianRange = 30 * (0.8 + movementVariation * 0.4) * (0.8 + physics.movementPersonality.patternMod * 0.4);
          
          // Unique float pattern combining multiple decimals
          const uniquePhase = physics.id + physics.movementPersonality.patternMod * Math.PI * 2;
          const guardianFloat = Math.sin(currentTime * guardianSpeed + uniquePhase) * guardianRange;
          physics.targetY = physics.territoryY + guardianFloat;
          
          // More frequent direction changes for patrol behavior
          if (Math.floor(physics.movementTimer) % (120 + Math.floor(movementVariation * 60)) === 0) {
            const guardianMoveRange = 80 * (0.6 + movementVariation * 0.8);
            physics.targetX = physics.territoryX + (Math.random() - 0.5) * guardianMoveRange;
            physics.targetX = Math.max(50, Math.min(canvasW - 50, physics.targetX));
          }
          break;
        
        case 1: // Circular hunter - distinctive hunting spirals
          const huntRadius = (70 + energyMod * 50) * (0.7 + movementVariation * 0.6);
          const huntSpeed = 0.0003 * energyMod * (0.5 + movementVariation * 0.8) * sleepSpeedMod; // Even slower
          const huntPhase = physics.id + movementVariation * Math.PI * 2;
          
          // Add spiral effect - radius changes over time
          const spiralMod = 0.8 + 0.4 * Math.sin(currentTime * huntSpeed * 0.3);
          const actualRadius = huntRadius * spiralMod;
          
          physics.targetX = canvasW/2 + Math.cos(currentTime * huntSpeed + huntPhase) * actualRadius;
          physics.targetY = canvasH/2 + Math.sin(currentTime * huntSpeed + huntPhase) * actualRadius;
          
          // Keep targets in bounds
          physics.targetX = Math.max(50, Math.min(canvasW - 50, physics.targetX));
          physics.targetY = Math.max(50, Math.min(canvasH - 50, physics.targetY));
          break;
        
        case 2: // Erratic explorer - distinctive zigzag exploration
          const explorerFreq = Math.floor(90 + (120 * movementVariation)); // 1.5-3.5 seconds (faster changes)
          if (Math.floor(physics.movementTimer) % explorerFreq === 0 || 
              Math.abs(physics.x - physics.targetX) < 15 && Math.abs(physics.y - physics.targetY) < 15) {
            
            const explorerRange = (100 + energyMod * 100) * (0.5 + movementVariation * 1.0) * sleepSpeedMod; // Larger range
            
            // Zigzag pattern - alternate between different quadrants
            const quadrant = Math.floor(physics.movementTimer / explorerFreq) % 4;
            const directionX = quadrant < 2 ? 1 : -1;
            const directionY = (quadrant % 2 === 0) ? 1 : -1;
            
            const newTargetX = physics.x + directionX * (Math.random() * 0.7 + 0.3) * explorerRange;
            const newTargetY = physics.y + directionY * (Math.random() * 0.7 + 0.3) * explorerRange;
            
            physics.targetX = Math.max(50, Math.min(canvasW - 50, newTargetX));
            physics.targetY = Math.max(50, Math.min(canvasH - 50, newTargetY));
          }
          break;
        
        case 3: // Territorial - distinctive figure-8 patrols
          const territorySpeed = 0.0004 * energyMod * (0.4 + movementVariation * 0.8) * sleepSpeedMod; // Even slower
          const territoryAngle = currentTime * territorySpeed + movementVariation * Math.PI * 2;
          const patrolRadius = physics.territoryRadius * (0.7 + movementVariation * 0.3); // Moderate radius
          
          // Figure-8 pattern for distinctive territorial behavior
          const figureEightX = Math.cos(territoryAngle) * patrolRadius;
          const figureEightY = Math.sin(territoryAngle * 2) * patrolRadius * 0.6; // Double frequency on Y
          
          physics.targetX = physics.territoryX + figureEightX;
          physics.targetY = physics.territoryY + figureEightY;
          
          // Keep in bounds
          physics.targetX = Math.max(50, Math.min(canvasW - 50, physics.targetX));
          physics.targetY = Math.max(50, Math.min(canvasH - 50, physics.targetY));
          break;
      }
    } else if (physics.activityState === 'observing') {
      // Observing: Very subtle movements, like breathing or looking around
      const observeFloat = Math.sin(currentTime * 0.001 + physics.id) * 3;
      physics.targetX = physics.x + observeFloat;
      physics.targetY = physics.y + Math.cos(currentTime * 0.0012 + physics.id) * 2;
    } else if (physics.activityState === 'drowsy') {
      // Drowsy: Slow, minimal movements
      const drowsyFloat = Math.sin(currentTime * 0.0008 + physics.id) * 2;
      physics.targetX = physics.x + drowsyFloat;
      physics.targetY = physics.y + Math.cos(currentTime * 0.0006 + physics.id) * 1;
    } else {
      // Resting or sleeping: Stay still with minimal breathing
      const breathingFloat = Math.sin(currentTime * 0.0005 + physics.id) * 1;
      physics.targetX = physics.x + breathingFloat;
      physics.targetY = physics.y;
    }
    
    // Smooth and natural movement with gradual acceleration
    const individualSpeedMod = 0.8 + movementVariation * 0.4; // Less extreme variation
    const speed = baseSpeed * (0.4 + energyMod * 0.3) * individualSpeedMod; // Much lower responsiveness
    const dampening = 0.95 + movementVariation * 0.03; // Higher dampening for smoother start
    
    // Gradual acceleration from rest - if creature was nearly still, start slower
    const currentSpeed = Math.sqrt(physics.vx * physics.vx + physics.vy * physics.vy);
    const isNearlyStill = currentSpeed < 0.5;
    const accelerationMultiplier = isNearlyStill ? 0.3 : 1.0; // Start at 30% speed when nearly still
    const finalSpeed = speed * accelerationMultiplier;
    
    // SAFETY: Validate all calculations before applying
    const deltaX = (physics.targetX - physics.x);
    const deltaY = (physics.targetY - physics.y);
    
    if (!isNaN(deltaX) && !isNaN(deltaY) && !isNaN(finalSpeed) && !isNaN(dampening)) {
      const newVx = physics.vx * dampening + deltaX * finalSpeed;
      const newVy = physics.vy * dampening + deltaY * finalSpeed;
      
      // SAFETY: Validate new velocities before applying
      if (!isNaN(newVx) && !isNaN(newVy)) {
        physics.vx = newVx;
        physics.vy = newVy;
        
        const newX = physics.x + physics.vx;
        const newY = physics.y + physics.vy;
        
        // SAFETY: Validate new positions before applying
        if (!isNaN(newX) && !isNaN(newY)) {
          physics.x = newX;
          physics.y = newY;
        }
      }
    }
    
    // Keep in bounds - SAFETY: Ensure coordinates are always valid
    physics.x = Math.max(50, Math.min(canvasW - 50, physics.x || 100));
    physics.y = Math.max(50, Math.min(canvasH - 50, physics.y || 100));
    
    // FINAL SAFETY CHECK: If somehow still NaN, reset to center
    if (isNaN(physics.x) || isNaN(physics.y)) {
      console.error(`Creature ${physics.id} still has NaN after all safety checks, resetting to center`);
      physics.x = canvasW / 2;
      physics.y = canvasH / 2;
      physics.vx = 0;
      physics.vy = 0;
      physics.targetX = physics.x + (Math.random() - 0.5) * 100;
      physics.targetY = physics.y + (Math.random() - 0.5) * 100;
    }
    
    // Update trails
    if (showTrails) {
      physics.trailPoints.unshift({ x: physics.x, y: physics.y, alpha: 1 });
      if (physics.trailPoints.length > 12) {
        physics.trailPoints.pop();
      }
      physics.trailPoints.forEach((point: any, i: number) => {
        point.alpha = Math.max(0, 1 - (i / physics.trailPoints.length) * 1.2);
      });
    }
    
    // Update particles
    if (showParticles) {
      // Add energy particles
      if (physics.movementTimer % Math.max(10, 30 - physics.energy * 20) === 0 && physics.energy > 0.1) {
        const hue = visual.colorR ? (visual.colorR * 360) % 360 : 180;
        physics.particles.push({
          x: physics.x + (Math.random() - 0.5) * 40,
          y: physics.y + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2 - 0.5,
          life: 60 + Math.random() * 40,
          maxLife: 60 + Math.random() * 40,
          size: 1 + Math.random() * 3,
          color: `hsl(${hue}, 80%, 70%)`,
          type: 'energy'
        });
      }
      
      // Update existing particles
      physics.particles = physics.particles.filter((particle: any) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        particle.vy -= 0.02; // Float upward
        particle.life--;
        return particle.life > 0;
      });
    }
    
    return physics;
  }, [isPlaying, animationSpeed, showTrails, showParticles]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use persistent physics state
    const localCreaturePhysics = creaturePhysicsRef.current;

    const drawCreature = (physics: any, creature: any, currentTime: number) => {
      const visual = creature.visual;
      const advanced = creature.advanced;
      
      if (!visual) return;

      // Use physics position
      const x = physics.x;
      const y = physics.y;

      ctx.save();
      ctx.translate(x, y);
      
      // Enhanced size calculation with health modifier - MORE IMPACTFUL
      const healthModifier = advanced?.nivelSalud || 1;
      const baseSize = Math.max(35, (visual.tamanoBase || 1) * physics.scale * 65 * (0.9 + 0.5 * healthModifier)); // Increased from 40 to 65
      
      // Unique breathing pattern per creature
      const breathingSpeed = 0.003 * (advanced?.nivelEnergia || 1);
      const creatureOffset = creature.id * 0.1; // Different phase per creature
      const energyBreathing = 0.8 + 0.2 * Math.sin(currentTime * breathingSpeed + creatureOffset);
      ctx.scale(energyBreathing, energyBreathing);
      
      // Enhanced color system - Primary + Secondary colors
      const primaryR = visual.colorR || 0.5;
      const primaryG = visual.colorG || 0.5;
      const primaryB = visual.colorB || 0.5;
      
      // Secondary colors from advanced traits
      const secondaryR = advanced?.colorSecundarioR || primaryR;
      const secondaryG = advanced?.colorSecundarioG || primaryG;
      const secondaryB = advanced?.colorSecundarioB || primaryB;
      
      // Convert primary to HSL
      const max = Math.max(primaryR, primaryG, primaryB);
      const min = Math.min(primaryR, primaryG, primaryB);
      const lightness = (max + min) / 2;
      
      let hue = 0;
      let saturation = 0;
      
      if (max !== min) {
        const delta = max - min;
        saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
        
        switch (max) {
          case primaryR: hue = (primaryG - primaryB) / delta + (primaryG < primaryB ? 6 : 0); break;
          case primaryG: hue = (primaryB - primaryR) / delta + 2; break;
          case primaryB: hue = (primaryR - primaryG) / delta + 4; break;
        }
        hue /= 6;
      }
      
      const hslHue = hue * 360;
      const hslSat = Math.max(40, saturation * 100);
      let hslLight = Math.max(30, Math.min(70, lightness * 100));
      
      // Health/energy/brightness affects lighting
      const healthMod = advanced?.nivelSalud || 1;
      const energyMod = advanced?.nivelEnergia || 1;
      const brightness = advanced?.brilloSuperficie || 0.2;
      
      hslLight = hslLight * healthMod * (1 + brightness * 0.5);
      
      // Enhanced aura system with intensity - MORE VISIBLE
      if (advanced?.tipoAura > 0 && advanced?.intensidadAura > 0) {
        const auraColors = [
          [255, 120, 120], // Fire - brighter
          [120, 180, 255], // Water - brighter  
          [160, 120, 60],  // Earth - brighter
          [220, 220, 255]  // Air - brighter
        ];
        const auraColor = auraColors[advanced.tipoAura - 1] || [255, 255, 255];
        const intensity = Math.max(0.5, advanced.intensidadAura); // Minimum intensity
        const pulsation = 0.9 + 0.3 * Math.sin(currentTime * 0.004 + creature.id);
        
        // Multiple aura layers for depth - MORE INTENSE
        for (let layer = 0; layer < 4; layer++) { // One more layer
          const layerSize = baseSize * (1.8 + layer * 0.4) * pulsation; // Larger auras
          const layerAlpha = intensity * (0.8 - layer * 0.15); // More opaque
          
          const gradient = ctx.createRadialGradient(0, 0, baseSize * 0.2, 0, 0, layerSize);
          gradient.addColorStop(0, `rgba(${auraColor[0]}, ${auraColor[1]}, ${auraColor[2]}, 0)`);
          gradient.addColorStop(0.6, `rgba(${auraColor[0]}, ${auraColor[1]}, ${auraColor[2]}, ${layerAlpha * 0.6})`); // More visible
          gradient.addColorStop(1, `rgba(${auraColor[0]}, ${auraColor[1]}, ${auraColor[2]}, ${layerAlpha * 0.2})`); // More visible
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, layerSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // REVOLUTIONARY BODY FORM - Using ALL decimals for unique shapes
      ctx.beginPath();
      
      // DECIMAL-DRIVEN FORM UNIQUENESS
      const formaPrincipalRaw = visual.formaPrincipal || 1;
      const formBaseType = Math.floor(formaPrincipalRaw); // 1, 2, 3 = Agile, Tank, Attacker
      const formDecimalSignature = formaPrincipalRaw % 1; // 0.0 to 0.999 = unique shape modifier
      
      const tamanoBaseRaw = visual.tamanoBase || 1;
      const tamanoDecimalSignature = tamanoBaseRaw % 1; // Size shape modifier
      
      const numApendicesRaw = visual.numApendices || 0;
      const appendageDecimalSignature = numApendicesRaw % 1; // Appendage shape influence
      
      // FORM-SPECIFIC POINT COUNTS AND CHARACTERISTICS
      let numPoints, shapeComplexity, asymmetryFactor;
      switch (formBaseType) {
        case 1: // Agile - More angular, dynamic
          numPoints = 6 + Math.floor(formDecimalSignature * 4); // 6-9 points
          shapeComplexity = 2.5 + formDecimalSignature * 1.5; // 2.5-4.0 complexity
          asymmetryFactor = 0.15 + formDecimalSignature * 0.1; // 0.15-0.25 asymmetry
          break;
        case 2: // Tank - Rounder, more points for bulk
          numPoints = 8 + Math.floor(formDecimalSignature * 6); // 8-13 points
          shapeComplexity = 1.8 + formDecimalSignature * 0.8; // 1.8-2.6 complexity 
          asymmetryFactor = 0.05 + formDecimalSignature * 0.1; // 0.05-0.15 asymmetry
          break;
        case 3: // Attacker - Sharp, fewer points
          numPoints = 5 + Math.floor(formDecimalSignature * 3); // 5-7 points
          shapeComplexity = 3.0 + formDecimalSignature * 2.0; // 3.0-5.0 complexity
          asymmetryFactor = 0.2 + formDecimalSignature * 0.15; // 0.2-0.35 asymmetry
          break;
        default:
          numPoints = 8;
          shapeComplexity = 3.0;
          asymmetryFactor = 0.15;
      }
      
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        
        // DECIMAL-DRIVEN UNIQUE SHAPE MODIFIERS
        const shapePersonality = Math.sin(angle * shapeComplexity + formDecimalSignature * Math.PI * 2);
        const sizePersonality = Math.cos(angle * 2 + tamanoDecimalSignature * Math.PI * 2);
        const appendageInfluence = Math.sin(angle * 4 + appendageDecimalSignature * Math.PI * 2);
        
        // Organic variation influenced by texture type AND decimals
        let textureModifier = 1.0;
        const textureType = advanced?.texturaPiel || 0;
        const textureDecimal = textureType % 1; // Extract decimal from texture too!
        
        switch (Math.floor(textureType)) {
          case 1: // Scaled - more angular with decimal variation
            textureModifier = 0.90 + 0.15 * Math.sin(angle * (5 + textureDecimal * 4)) * (0.8 + textureDecimal * 0.4);
            break;
          case 2: // Furry - softer with decimal fuzziness
            textureModifier = 0.95 + 0.08 * Math.sin(angle * (10 + textureDecimal * 8)) * (0.9 + textureDecimal * 0.2);
            break;
          case 3: // Crystalline - geometric with decimal facets
            textureModifier = 0.85 + 0.25 * Math.sin(angle * (3 + textureDecimal * 3)) * (0.7 + textureDecimal * 0.6);
            break;
          default:
            textureModifier = 0.92 + 0.12 * Math.sin(angle * (6 + textureDecimal * 2));
        }
        
        // COMPOUND SHAPE VARIATION - All decimals working together
        const baseVariation = (0.7 + 0.4 * shapePersonality) * textureModifier;
        const sizeVariation = 0.9 + 0.2 * sizePersonality * (0.8 + tamanoDecimalSignature * 0.4);
        const asymmetryVariation = 1.0 + asymmetryFactor * appendageInfluence * (formDecimalSignature - 0.5);
        
        // Breathing and organic effects
        const breathingEffect = 1 + 0.15 * Math.sin(currentTime * 0.003 + creature.id);
        const organicNoise = 0.85 + 0.3 * Math.sin(currentTime * 0.005 + angle * 2 + creature.id);
        
        const radius = baseSize * baseVariation * sizeVariation * asymmetryVariation * breathingEffect * organicNoise;
        const bx = Math.cos(angle) * radius;
        const by = Math.sin(angle) * radius;
        
        if (i === 0) {
          ctx.moveTo(bx, by);
        } else {
          const prevAngle = ((i - 1) / numPoints) * Math.PI * 2;
          
          // Previous point with same decimal-driven calculations
          const prevShapePersonality = Math.sin(prevAngle * shapeComplexity + formDecimalSignature * Math.PI * 2);
          const prevSizePersonality = Math.cos(prevAngle * 2 + tamanoDecimalSignature * Math.PI * 2);
          const prevAppendageInfluence = Math.sin(prevAngle * 4 + appendageDecimalSignature * Math.PI * 2);
          
          const prevBaseVariation = (0.7 + 0.4 * prevShapePersonality) * textureModifier;
          const prevSizeVariation = 0.9 + 0.2 * prevSizePersonality * (0.8 + tamanoDecimalSignature * 0.4);
          const prevAsymmetryVariation = 1.0 + asymmetryFactor * prevAppendageInfluence * (formDecimalSignature - 0.5);
          
          const prevRadius = baseSize * prevBaseVariation * prevSizeVariation * prevAsymmetryVariation * breathingEffect * organicNoise;
          const prevX = Math.cos(prevAngle) * prevRadius;
          const prevY = Math.sin(prevAngle) * prevRadius;
          
          // DECIMAL-DRIVEN CURVE CONTROL - Each creature has unique curve style
          const curvePersonality = formDecimalSignature + tamanoDecimalSignature + appendageDecimalSignature;
          const curveIntensity = 0.3 + (curvePersonality % 1) * 0.4; // 0.3-0.7 curve intensity
          const curveDirection = (curvePersonality > 1.5) ? 1 : -1; // Some curve inward, some outward
          
          const cpX = (prevX + bx) / 2 + curveDirection * curveIntensity * Math.sin(angle + formDecimalSignature * Math.PI) * baseSize * 0.1;
          const cpY = (prevY + by) / 2 + curveDirection * curveIntensity * Math.cos(angle + tamanoDecimalSignature * Math.PI) * baseSize * 0.1;
          
          ctx.quadraticCurveTo(cpX, cpY, bx, by);
        }
      }
      ctx.closePath();
      
      // Enhanced gradient with primary and secondary colors
      const bodyGradient = ctx.createRadialGradient(
        -baseSize * 0.3, -baseSize * 0.3, 0,
        0, 0, baseSize * 1.2
      );
      
      // Calculate secondary color HSL
      const secMax = Math.max(secondaryR, secondaryG, secondaryB);
      const secMin = Math.min(secondaryR, secondaryG, secondaryB);
      const secLightness = (secMax + secMin) / 2;
      
      let secHue = hslHue;
      if (secMax !== secMin) {
        const delta = secMax - secMin;
        switch (secMax) {
          case secondaryR: secHue = ((secondaryG - secondaryB) / delta + (secondaryG < secondaryB ? 6 : 0)) / 6 * 360; break;
          case secondaryG: secHue = ((secondaryB - secondaryR) / delta + 2) / 6 * 360; break;
          case secondaryB: secHue = ((secondaryR - secondaryG) / delta + 4) / 6 * 360; break;
        }
      }
      
      bodyGradient.addColorStop(0, `hsl(${hslHue}, ${hslSat}%, ${hslLight + 25 * healthMod}%)`);
      bodyGradient.addColorStop(0.3, `hsl(${secHue}, ${hslSat}%, ${secLightness * 100 * healthMod}%)`);
      bodyGradient.addColorStop(0.7, `hsl(${hslHue - 10}, ${hslSat + 15}%, ${(hslLight - 15) * healthMod}%)`);
      bodyGradient.addColorStop(1, `hsl(${secHue - 20}, ${hslSat + 10}%, ${(secLightness * 100 - 25) * healthMod}%)`);
      
      ctx.fillStyle = bodyGradient;
      ctx.fill();
      
      // Surface patterns overlay with decimal uniqueness
      if (advanced?.tipoPatron > 0 && advanced?.densidadPatron > 0.1) {
        const patternTypeRaw = advanced.tipoPatron;
        const patternType = Math.floor(patternTypeRaw);
        const patternVariation = patternTypeRaw % 1; // Decimal for pattern uniqueness
        const density = advanced.densidadPatron;
        
        ctx.save();
        ctx.globalAlpha = density * 0.6;
        ctx.strokeStyle = `hsl(${secHue}, ${hslSat + 20}%, ${(secLightness * 100 - 30) * healthMod}%)`;
        ctx.lineWidth = 1;
        
        switch (patternType) {
          case 1: // Spots with decimal uniqueness
            const spotCount = Math.floor(density * (10 + patternVariation * 6)); // 10-16 spots based on decimal
            for (let i = 0; i < spotCount; i++) {
              const angle = (i / spotCount) * Math.PI * 2 + patternVariation * Math.PI * 0.5; // Unique rotation
              const r = baseSize * (0.25 + patternVariation * 0.1) + Math.sin(angle * 3) * baseSize * 0.2;
              const x = Math.cos(angle) * r;
              const y = Math.sin(angle) * r;
              const spotSize = baseSize * (0.06 + patternVariation * 0.04); // 0.06-0.10 size variation
              ctx.beginPath();
              ctx.arc(x, y, spotSize, 0, Math.PI * 2);
              ctx.stroke();
            }
            break;
          case 2: // Stripes
            for (let i = -baseSize; i < baseSize; i += baseSize * 0.3 / density) {
              ctx.beginPath();
              ctx.moveTo(i, -baseSize);
              ctx.lineTo(i, baseSize);
              ctx.stroke();
            }
            break;
          case 4: // Swirls
            ctx.beginPath();
            for (let t = 0; t < Math.PI * 4; t += 0.1) {
              const r = baseSize * 0.6 * (1 - t / (Math.PI * 4));
              const x = Math.cos(t) * r;
              const y = Math.sin(t) * r;
              if (t === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
            break;
        }
        ctx.restore();
      }
      
      // Enhanced glow with bioluminescence - MORE INTENSE
      if (advanced?.emiteLuz) {
        const lightR = advanced.colorLuzR || 0.9;
        const lightG = advanced.colorLuzG || 0.9;
        const lightB = advanced.colorLuzB || 0.7;
        const glowPulse = 0.8 + 0.4 * Math.sin(currentTime * 0.003 + creature.id); // Stronger pulse
        
        ctx.shadowColor = `rgba(${Math.floor(lightR * 255)}, ${Math.floor(lightG * 255)}, ${Math.floor(lightB * 255)}, ${glowPulse})`;
        ctx.shadowBlur = baseSize * 1.2; // Larger glow
        ctx.fill();
        
        // Double glow for more impact
        ctx.shadowBlur = baseSize * 0.6;
        ctx.fill();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      } else if (energyMod > 0.4) { // Lower threshold
        // Regular energy glow - MORE VISIBLE
        ctx.shadowColor = `hsl(${hslHue}, ${hslSat + 20}%, ${hslLight + 30}%)`;
        ctx.shadowBlur = 15 * energyMod; // Larger glow
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      // ENHANCED EYES - Using decimal precision for uniqueness
      const eyeTypeRaw = advanced?.tipoOjos || 0;
      const eyeType = Math.floor(eyeTypeRaw);
      const eyeVariation = eyeTypeRaw % 1; // Extract decimal part for uniqueness
      
      const eyeSizeMultiplier = advanced?.tamanoOjos || 1.0;
      const baseEyeSize = baseSize * 0.15 * eyeSizeMultiplier;
      
      // Use eye variation for unique spacing and asymmetry
      const eyeDistanceBase = baseSize * 0.4;
      const eyeDistance = eyeDistanceBase * (0.9 + eyeVariation * 0.2); // 0.9x - 1.1x variation
      const eyeAsymmetry = (eyeVariation - 0.5) * baseEyeSize * 0.1; // Slight asymmetry
      
      // Eye closure based on activity state and circadian rhythm
      const isSleeping = physics.activityState === 'sleeping';
      const isDrowsy = physics.activityState === 'drowsy';
      const eyeOpenness = isSleeping ? 0.1 : isDrowsy ? 0.5 : 1.0;
      
      // Blinking animation when awake
      const blinkCycle = Math.sin(currentTime * 0.001 + physics.id) * 0.5 + 0.5;
      const shouldBlink = blinkCycle > 0.95 && !isSleeping;
      const finalEyeOpenness = shouldBlink ? 0.2 : eyeOpenness;
      
      // Pupil movement based on energy level (less when tired)
      const pupilSpeed = (advanced?.nivelEnergia || 0.5) * 0.003 * eyeOpenness;
      const pupilOffsetX = Math.sin(currentTime * pupilSpeed) * 2;
      const pupilOffsetY = Math.cos(currentTime * pupilSpeed * 1.3) * 2;
      
             // Draw eyes based on type
       if (eyeType === 1) {
         // Feline eyes - more elongated
         [-eyeDistance, eyeDistance].forEach(x => {
           const y = -baseSize * 0.2;
           
           // Eye shape
           ctx.beginPath();
           ctx.ellipse(x, y, baseEyeSize, baseEyeSize * 0.7, 0, 0, Math.PI * 2);
           ctx.fillStyle = 'white';
           ctx.fill();
           
           // Iris
           ctx.beginPath();
           ctx.ellipse(x, y, baseEyeSize * 0.8, baseEyeSize * 0.5, 0, 0, Math.PI * 2);
           ctx.fillStyle = `hsl(${(hslHue + 180) % 360}, 80%, 45%)`;
           ctx.fill();
           
           // Vertical pupil
           ctx.beginPath();
           ctx.ellipse(x + pupilOffsetX, y + pupilOffsetY, baseEyeSize * 0.15, baseEyeSize * 0.4, 0, 0, Math.PI * 2);
           ctx.fillStyle = 'black';
           ctx.fill();
         });
       } else if (eyeType === 2) {
         // Compound eyes - multiple small segments
         [-eyeDistance, eyeDistance].forEach(x => {
           const y = -baseSize * 0.2;
           const segments = 6;
           for (let i = 0; i < segments; i++) {
             const angle = (i / segments) * Math.PI * 2;
             const segX = x + Math.cos(angle) * baseEyeSize * 0.3;
             const segY = y + Math.sin(angle) * baseEyeSize * 0.3;
             
             ctx.beginPath();
             ctx.arc(segX, segY, baseEyeSize * 0.3, 0, Math.PI * 2);
             ctx.fillStyle = `hsl(${(hslHue + 180 + i * 10) % 360}, 70%, 40%)`;
             ctx.fill();
             ctx.strokeStyle = 'black';
             ctx.lineWidth = 1;
             ctx.stroke();
           }
         });
       } else if (eyeType === 3) {
         // Multiple eyes - 4 smaller eyes
         const positions = [
           [-eyeDistance * 0.7, -baseSize * 0.3],
           [eyeDistance * 0.7, -baseSize * 0.3],
           [-eyeDistance * 1.2, -baseSize * 0.1],
           [eyeDistance * 1.2, -baseSize * 0.1]
         ];
         
         positions.forEach(([x, y]) => {
           ctx.beginPath();
           ctx.arc(x, y, baseEyeSize * 0.6, 0, Math.PI * 2);
           ctx.fillStyle = 'white';
           ctx.fill();
           
           ctx.beginPath();
           ctx.arc(x + pupilOffsetX * 0.5, y + pupilOffsetY * 0.5, baseEyeSize * 0.2, 0, Math.PI * 2);
           ctx.fillStyle = 'black';
           ctx.fill();
         });
       } else {
         // Round eyes (default) with sleep states and decimal uniqueness
         [-eyeDistance, eyeDistance].forEach((x, index) => {
           const y = -baseSize * 0.2 + (index === 1 ? eyeAsymmetry : -eyeAsymmetry); // Slight asymmetry
           const individualEyeSize = baseEyeSize * (0.95 + eyeVariation * 0.1); // Size variation per eye
           
                        if (finalEyeOpenness < 0.3) {
               // Closed/sleeping eyes - draw as lines with unique angles
               ctx.strokeStyle = `hsl(${hslHue - 30}, 50%, 30%)`;
               ctx.lineWidth = 2;
               const eyeAngle = (eyeVariation - 0.5) * 0.3; // Unique eye angle
               ctx.beginPath();
               ctx.moveTo(x - individualEyeSize + Math.sin(eyeAngle) * 2, y - Math.cos(eyeAngle) * 2);
               ctx.lineTo(x + individualEyeSize + Math.sin(eyeAngle) * 2, y + Math.cos(eyeAngle) * 2);
               ctx.stroke();
                        } else {
               // Open eyes with variable openness and decimal uniqueness
               const eyeHeight = individualEyeSize * finalEyeOpenness;
               const eyeRotation = (eyeVariation - 0.5) * 0.2; // Unique eye rotation
               
               // Eye white (ellipse when drowsy) with unique proportions
               const eyeEccentricity = 0.9 + eyeVariation * 0.2; // 0.9-1.1 width variation
               ctx.beginPath();
               ctx.ellipse(x, y, individualEyeSize * eyeEccentricity, eyeHeight, eyeRotation, 0, Math.PI * 2);
               ctx.fillStyle = 'white';
               ctx.fill();
               
               // Iris (scaled with eye openness) with unique color shift
               const irisHueShift = eyeVariation * 60 - 30; // ±30 degree hue shift
               ctx.beginPath();
               ctx.ellipse(x, y, individualEyeSize * 0.7 * eyeEccentricity, eyeHeight * 0.7, eyeRotation, 0, Math.PI * 2);
               ctx.fillStyle = `hsl(${((hslHue + 180 + irisHueShift) % 360)}, ${60 + eyeVariation * 20}%, ${45 + eyeVariation * 10}%)`;
               ctx.fill();
             
             // Pupil (only if reasonably open)
             if (finalEyeOpenness > 0.4) {
               ctx.beginPath();
               ctx.arc(x + pupilOffsetX, y + pupilOffsetY, baseEyeSize * 0.3 * finalEyeOpenness, 0, Math.PI * 2);
               ctx.fillStyle = 'black';
               ctx.fill();
               
               // Eye shine (only when awake)
               if (finalEyeOpenness > 0.8) {
                 ctx.beginPath();
                 ctx.arc(x + pupilOffsetX - 1, y + pupilOffsetY - 1, baseEyeSize * 0.1, 0, Math.PI * 2);
                 ctx.fillStyle = 'white';
                 ctx.fill();
               }
             }
           }
         });
       }

      // REVOLUTIONARY MOUTH SYSTEM - Using ALL traits for unique expressions
      const mouthTypeRaw = advanced?.tipoBoca || 0;
      const mouthType = Math.floor(mouthTypeRaw);
      const mouthVariation = mouthTypeRaw % 1; // Extract decimal for unique mouth characteristics
      
      // DECIMAL-DRIVEN UNIQUENESS - Each mouth is completely individual
      const mouthDecimalSignature = mouthVariation; // 0.0 to 0.999...
      const mouthY = baseSize * (0.26 + mouthDecimalSignature * 0.08); // 0.26-0.34 position variation
      const mouthWidth = baseSize * (0.2 + mouthDecimalSignature * 0.15); // 0.2-0.35 width variation
      const mouthAsymmetry = (mouthDecimalSignature - 0.5) * 0.1; // Slight left/right tilt
      const mouthCurvature = 0.8 + mouthDecimalSignature * 0.4; // 0.8-1.2 curvature multiplier
      
      // EMOTIONAL STATE - Based on health, energy, activity, and circadian rhythm
      const healthState = advanced?.nivelSalud || 1.0;
      const energyState = advanced?.nivelEnergia || 1.0;
      const currentHour = new Date().getHours();
      const circadianPreference = advanced?.ritmoCircadiano || 0.5;
      
      // Calculate emotional expression
      let emotionalState = 'neutral';
      let expressionIntensity = 0.5;
      
      // Activity-based emotions
      if (physics.activityState === 'sleeping') {
        emotionalState = 'sleeping';
        expressionIntensity = 0.2;
      } else if (physics.activityState === 'drowsy') {
        emotionalState = 'tired';
        expressionIntensity = 0.3;
      } else if (healthState < 0.3) {
        emotionalState = 'sick';
        expressionIntensity = 0.2;
      } else if (healthState > 0.8 && energyState > 0.7) {
        emotionalState = 'happy';
        expressionIntensity = 0.8;
      } else if (energyState < 0.3) {
        emotionalState = 'tired';
        expressionIntensity = 0.4;
      } else if (energyState > 0.6) {
        emotionalState = 'excited';
        expressionIntensity = 0.7;
      }
      
      // Circadian mismatch creates stress
      const isNocturnal = circadianPreference < 0.3;
      const isDiurnal = circadianPreference > 0.7;
      const isDaytime = currentHour >= 6 && currentHour <= 18;
      
      if ((isNocturnal && isDaytime) || (isDiurnal && !isDaytime)) {
        emotionalState = 'stressed';
        expressionIntensity = Math.max(0.3, expressionIntensity * 0.7);
      }
      
      // Breathing/speaking animation
      const breathingCycle = Math.sin(currentTime * 0.004 * (energyState + 0.5) * (0.8 + mouthVariation * 0.4));
      const mouthOpenness = Math.max(0.1, 0.3 + breathingCycle * 0.3 * expressionIntensity);
      
      ctx.strokeStyle = `hsl(${hslHue - 30}, 50%, 30%)`;
      ctx.fillStyle = `hsl(${hslHue - 30}, 40%, 20%)`;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      // EMOTIONAL EXPRESSIONS - Each type has different emotional expressions
      switch (mouthType) {
        case 1: // Large mouth - More expressive
          switch (emotionalState) {
            case 'happy':
              // Big smile
              ctx.beginPath();
              ctx.arc(0, mouthY - 2, mouthWidth * 1.5, 0.2, Math.PI - 0.2);
              ctx.stroke();
              break;
            case 'excited':
              // Open excited mouth
              ctx.beginPath();
              ctx.ellipse(0, mouthY, mouthWidth * 0.8, mouthWidth * 0.6 * mouthOpenness, 0, 0, Math.PI * 2);
              ctx.stroke();
              if (mouthOpenness > 0.5) ctx.fill();
              break;
            case 'sick':
              // Downward mouth
              ctx.beginPath();
              ctx.arc(0, mouthY + 3, mouthWidth * 1.2, Math.PI + 0.3, -0.3);
              ctx.stroke();
              break;
            case 'sleeping':
              // Closed line
              ctx.beginPath();
              ctx.moveTo(-mouthWidth * 0.5, mouthY);
              ctx.lineTo(mouthWidth * 0.5, mouthY);
              ctx.stroke();
              break;
            case 'stressed':
              // Wavy stressed mouth
              ctx.beginPath();
              ctx.moveTo(-mouthWidth, mouthY);
              ctx.quadraticCurveTo(-mouthWidth * 0.5, mouthY + 2, 0, mouthY);
              ctx.quadraticCurveTo(mouthWidth * 0.5, mouthY - 2, mouthWidth, mouthY);
              ctx.stroke();
              break;
            default:
              // Neutral large mouth
              ctx.beginPath();
              ctx.arc(0, mouthY, mouthWidth * 1.2 * mouthOpenness, 0.1, Math.PI - 0.1);
              ctx.stroke();
          }
          break;
          
        case 2: // Beak - Different beak positions
          ctx.save();
          const beakAngle = emotionalState === 'excited' ? -0.2 : 
                           emotionalState === 'sick' ? 0.3 : 
                           emotionalState === 'sleeping' ? 0.1 : 0;
          ctx.rotate(beakAngle);
          
          ctx.beginPath();
          const beakSize = emotionalState === 'excited' ? 1.2 : 
                          emotionalState === 'sick' ? 0.8 : 1.0;
          ctx.moveTo(-mouthWidth * 0.3 * beakSize, mouthY - 2);
          ctx.lineTo(0, mouthY + mouthWidth * 0.5 * beakSize);
          ctx.lineTo(mouthWidth * 0.3 * beakSize, mouthY - 2);
          ctx.closePath();
          ctx.fillStyle = `hsl(${hslHue + 40}, 60%, 40%)`;
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          break;
          
        case 3: // Tentacle mouth - Tentacles show emotion
          const tentacleCount = 4;
          const tentacleSpread = emotionalState === 'excited' ? 1.5 : 
                                emotionalState === 'sick' ? 0.5 : 
                                emotionalState === 'sleeping' ? 0.3 : 1.0;
          
          for (let i = 0; i < tentacleCount; i++) {
            const baseAngle = (i / tentacleCount) * Math.PI + Math.PI * 0.2;
            const emotionalOffset = (emotionalState === 'happy' ? Math.sin(currentTime * 0.01 + i) * 0.3 : 0);
            const angle = baseAngle + emotionalOffset;
            const length = mouthWidth * (0.5 + mouthOpenness * 0.5) * tentacleSpread;
            const endX = Math.cos(angle) * length;
            const endY = mouthY + Math.sin(angle) * length * 0.5;
            
            ctx.beginPath();
            ctx.moveTo(0, mouthY);
            ctx.quadraticCurveTo(endX * 0.5, mouthY, endX, endY);
            ctx.stroke();
            
            // Tentacle tip
            ctx.beginPath();
            ctx.arc(endX, endY, emotionalState === 'excited' ? 2 : 1, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
          
        default: // Small mouth - Subtle expressions with DECIMAL UNIQUENESS
          const expressionOffset = mouthDecimalSignature * 4 - 2; // -2 to 2 offset
          
          ctx.save();
          ctx.rotate(mouthAsymmetry); // Unique tilt per creature
          
          switch (emotionalState) {
            case 'happy':
              // Small smile with unique decimal curve
              ctx.beginPath();
              const smileRadius = mouthWidth * (0.6 + mouthDecimalSignature * 0.6) * mouthCurvature;
              const smileStart = 0.2 + mouthDecimalSignature * 0.3; // 0.2-0.5 start angle
              const smileEnd = Math.PI - smileStart;
              ctx.arc(0, mouthY - 1 + expressionOffset, smileRadius, smileStart, smileEnd);
              ctx.stroke();
              break;
            case 'excited':
              // Small O shape with decimal size variation
              ctx.beginPath();
              const excitedSize = mouthWidth * (0.4 + mouthDecimalSignature * 0.4) * mouthOpenness;
              ctx.arc(0, mouthY + expressionOffset, excitedSize, 0, Math.PI * 2);
              ctx.stroke();
              break;
            case 'sick':
              // Downward curve with decimal depth
              ctx.beginPath();
              const sickRadius = mouthWidth * (0.6 + mouthDecimalSignature * 0.4);
              const sickDepth = 2 + mouthDecimalSignature * 2; // 2-4 pixels down
              ctx.arc(0, mouthY + sickDepth + expressionOffset, sickRadius, Math.PI + 0.4, -0.4);
              ctx.stroke();
              break;
            case 'tired':
              // Slightly open, droopy with decimal variation
              ctx.beginPath();
              const tiredWidth = mouthWidth * (0.3 + mouthDecimalSignature * 0.4);
              const tiredHeight = mouthWidth * 0.2 * mouthOpenness * (0.8 + mouthDecimalSignature * 0.4);
              ctx.ellipse(0, mouthY + 1 + expressionOffset, tiredWidth, tiredHeight, 0, 0, Math.PI);
              ctx.stroke();
              break;
            case 'sleeping':
              // Tiny closed line with decimal length
              ctx.beginPath();
              const sleepLength = mouthWidth * (0.2 + mouthDecimalSignature * 0.2);
              ctx.moveTo(-sleepLength, mouthY + expressionOffset);
              ctx.lineTo(sleepLength, mouthY + expressionOffset);
              ctx.stroke();
              break;
            case 'stressed':
              // Tight line with decimal wave pattern
              ctx.beginPath();
              const stressWidth = mouthWidth * (0.3 + mouthDecimalSignature * 0.2);
              const stressWave = 1 + mouthDecimalSignature * 2; // 1-3 pixel wave
              ctx.moveTo(-stressWidth, mouthY + expressionOffset);
              ctx.quadraticCurveTo(0, mouthY + stressWave + expressionOffset, stressWidth, mouthY + expressionOffset);
              ctx.stroke();
              break;
            default:
              // Neutral with unique decimal positioning and size
              ctx.beginPath();
              const neutralRadius = mouthWidth * mouthOpenness * (0.6 + mouthDecimalSignature * 0.6);
              const neutralStart = 0.1 + mouthDecimalSignature * 0.2; // Unique smile start
              const neutralEnd = Math.PI - neutralStart;
              ctx.arc(0, mouthY + expressionOffset, neutralRadius, neutralStart, neutralEnd);
              ctx.stroke();
          }
          
          ctx.restore();
      }

      // TENTACLES/APPENDAGES
      const numApps = Math.min(6, Math.floor(visual.numApendices || 0));
      for (let i = 0; i < numApps; i++) {
        const baseAngle = (i / numApps) * Math.PI * 2;
        const angle = baseAngle + Math.sin(currentTime * 0.002 + i) * 0.3;
        const length = baseSize * 0.6 * (0.8 + 0.4 * Math.sin(currentTime * 0.003 + i));
        
        ctx.save();
        ctx.rotate(angle);
        ctx.translate(baseSize * 0.7, 0);
        
        // Tentacle
        ctx.strokeStyle = `hsl(${hslHue - 20}, ${hslSat}%, ${(hslLight - 10) * healthMod}%)`;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        
        const segments = 4;
        for (let j = 1; j <= segments; j++) {
          const t = j / segments;
          const segmentX = length * t;
          const wave = Math.sin(currentTime * 0.005 + i + t * 4) * length * 0.2;
          const segmentY = wave;
          
          if (j === 1) {
            ctx.lineTo(segmentX, segmentY);
          } else {
            const prevT = (j - 1) / segments;
            const prevX = length * prevT;
            const prevWave = Math.sin(currentTime * 0.005 + i + prevT * 4) * length * 0.2;
            
            ctx.quadraticCurveTo(
              (prevX + segmentX) / 2,
              (prevWave + segmentY) / 2,
              segmentX, segmentY
            );
          }
        }
        ctx.stroke();
        
        // Tentacle tip
        const tipX = length;
        const tipY = Math.sin(currentTime * 0.005 + i) * length * 0.2;
        
        ctx.beginPath();
        ctx.arc(tipX, tipY, 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${hslHue + 40}, 80%, 70%)`;
        ctx.fill();
        
        ctx.restore();
      }

      // ELEMENTAL EFFECTS - Advanced visual effects
      const elementalEffect = advanced?.efectoElemental || 0;
      
      if (elementalEffect > 0) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        
        switch (elementalEffect) {
          case 1: // Crystal effect
            ctx.strokeStyle = `hsla(${hslHue + 120}, 90%, 70%, 0.7)`;
            ctx.lineWidth = 2;
            // Draw crystalline lines
            for (let i = 0; i < 6; i++) {
              const angle = (i / 6) * Math.PI * 2;
              const innerR = baseSize * 0.7;
              const outerR = baseSize * 1.1;
              
              ctx.beginPath();
              ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
              ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
              ctx.stroke();
            }
            break;
            
          case 2: // Flame effect
            const flameParticles = 8;
            for (let i = 0; i < flameParticles; i++) {
              const angle = (i / flameParticles) * Math.PI * 2;
              const distance = baseSize * (1.0 + 0.3 * Math.sin(currentTime * 0.01 + i));
              const px = Math.cos(angle) * distance;
              const py = Math.sin(angle) * distance - Math.abs(Math.sin(currentTime * 0.008 + i)) * 8;
              
              const flameSize = 3 + Math.sin(currentTime * 0.012 + i) * 2;
              ctx.beginPath();
              ctx.arc(px, py, flameSize, 0, Math.PI * 2);
              ctx.fillStyle = `hsla(${20 + Math.sin(currentTime * 0.01 + i) * 40}, 90%, 70%, 0.8)`;
              ctx.fill();
            }
            break;
            
          case 3: // Ice effect
            ctx.strokeStyle = `hsla(200, 90%, 80%, 0.6)`;
            ctx.lineWidth = 1;
            // Ice crystals
            for (let i = 0; i < 12; i++) {
              const angle = (i / 12) * Math.PI * 2;
              const r = baseSize * (0.8 + 0.4 * Math.sin(currentTime * 0.003 + i));
              const px = Math.cos(angle) * r;
              const py = Math.sin(angle) * r;
              
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(px + Math.cos(angle + Math.PI/2) * 5, py + Math.sin(angle + Math.PI/2) * 5);
              ctx.moveTo(px, py);
              ctx.lineTo(px + Math.cos(angle - Math.PI/2) * 5, py + Math.sin(angle - Math.PI/2) * 5);
              ctx.stroke();
            }
            break;
        }
        
        ctx.restore();
      }
      
      // Energy aura for high energy creatures - MORE DRAMATIC
      if (energyMod > 0.3) { // Lower threshold for more creatures
        ctx.strokeStyle = `hsla(${hslHue + 60}, 90%, 85%, 0.8)`; // More opaque
        ctx.lineWidth = 2; // Thicker line
        ctx.beginPath();
        ctx.arc(0, 0, baseSize * 1.5, 0, Math.PI * 2); // Larger aura
        ctx.stroke();
        
        // More energy particles for impact
        for (let i = 0; i < 6; i++) { // Double the particles
          const angle = currentTime * 0.002 + (i / 6) * Math.PI * 2;
          const radius = baseSize * (1.3 + 0.3 * Math.sin(currentTime * 0.005 + i));
          const px = Math.cos(angle) * radius;
          const py = Math.sin(angle) * radius;
          
          const particleSize = 3 + Math.sin(currentTime * 0.008 + i) * 1; // Variable size
          ctx.beginPath();
          ctx.arc(px, py, particleSize, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hslHue + 60 + i * 10}, 95%, 85%, 0.9)`; // More saturated
          ctx.fill();
          
          // Particle glow
          ctx.shadowColor = `hsla(${hslHue + 60 + i * 10}, 95%, 85%, 0.6)`;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
      }

      ctx.restore();
    };

    const animate = () => {
      const currentTime = Date.now();
      
        
      
      // Always clear and redraw canvas for smooth animation
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // PRIMORDIA - CHAOTIC NEBULA ENVIRONMENT
      // Deep nebula gradient - the roiling heart of creation
      const nebulaGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      nebulaGradient.addColorStop(0, nebulaTopColor); // Deep cosmic void
      nebulaGradient.addColorStop(0.25, nebulaMidColor); // Mid nebula swirls
      nebulaGradient.addColorStop(0.65, nebulaDeepColor); // Energy-rich depths
      nebulaGradient.addColorStop(1, nebulaBottomColor); // Foundational strata
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Anima Streams - flowing lifeblood energy - MORE SUBTLE
      ctx.save();
      ctx.globalAlpha = 0.25; // Less prominent so creatures stand out
      ctx.strokeStyle = animaStreamColor;
      ctx.lineWidth = 1;
      ctx.shadowColor = animaStreamColor;
      ctx.shadowBlur = 4;
      for (let i = 0; i < 6; i++) {
        const streamPhase = currentTime * 0.0008 + i * 1.2;
        const streamY = 30 + i * 60 + Math.sin(streamPhase) * 25;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 15) {
          const y = streamY + Math.sin((x * 0.015) + streamPhase) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
      
      // Creation Energy Particles - colliding forces of genesis - MORE SUBTLE
      ctx.save();
      ctx.globalAlpha = 0.3; // Less prominent so creatures stand out
      for (let i = 0; i < 20; i++) {
        const energyPhase = currentTime * 0.001 + i * 0.3;
        const x = (i * 35 + Math.sin(energyPhase * 1.5) * 40) % canvas.width;
        const y = (i * 25 + Math.cos(energyPhase * 1.2) * 50) % canvas.height;
        const size = Math.max(0.5, 1.5 + Math.sin(energyPhase * 3) * 1); // Ensure minimum size
        const pulsation = Math.max(0.1, 0.5 + 0.5 * Math.sin(energyPhase * 4)); // Ensure positive pulsation
        const radius = Math.max(0.1, size * pulsation); // Ensure positive radius
        
        ctx.shadowColor = creationEnergyColor;
        ctx.shadowBlur = 10 * pulsation;
        ctx.fillStyle = creationEnergyColor;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      
      // Echoes of the First Forging - golden memory fragments
      ctx.save();
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < 8; i++) {
        const echoPhase = currentTime * 0.0003 + i * 0.8;
        const x = (i * 80 + Math.sin(echoPhase) * 60) % canvas.width;
        const y = (i * 45 + Math.cos(echoPhase * 0.7) * 30) % canvas.height;
        const size = Math.max(0.5, 2 + Math.sin(echoPhase * 2) * 1.5); // Ensure minimum size
        const twinkle = Math.max(0.1, 0.3 + 0.7 * Math.sin(echoPhase * 5)); // Ensure positive twinkle
        const radius = Math.max(0.1, size * twinkle); // Ensure positive radius
        
        ctx.shadowColor = echoColor;
        ctx.shadowBlur = 15 * twinkle;
        ctx.fillStyle = echoColor;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Echo trails
        ctx.strokeStyle = echoColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = Math.max(0.05, 0.1 * twinkle); // Ensure positive alpha
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(echoPhase * 2) * 20, y + Math.sin(echoPhase * 2) * 20);
        ctx.stroke();
      }
      ctx.restore();
      
      // Elemental Strata - foundational energy layers
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = elementalStratumColor;
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const stratumY = canvas.height - 80 + i * 15;
        const stratumPhase = currentTime * 0.0005 + i * 0.5;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 10) {
          const y = stratumY + Math.sin((x * 0.01) + stratumPhase) * 5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
      
      // Draw grid if enabled
      if (showGrid) {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        const gridSize = 50;
        
        for (let x = 0; x < canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        
        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // Update physics and draw creatures
      parsedCreatures.forEach((creature, index) => {
        if (!creature.estaViva) return;
        
        let physics = localCreaturePhysics.get(creature.id);
        if (!physics) {
          physics = initializeCreaturePhysics(creature, index, canvas.width, canvas.height);
          localCreaturePhysics.set(creature.id, physics);
          console.log('Initialized physics for creature:', creature.id, 'at position:', physics.x, physics.y, 'target:', physics.targetX, physics.targetY);
        }
        
        // Update physics
        physics = updateCreaturePhysics(physics, creature, currentTime, canvas.width, canvas.height);
        localCreaturePhysics.set(creature.id, physics);
        
        // Draw trails first - MORE VIBRANT
        if (showTrails && physics.trailPoints.length > 1) {
          ctx.save();
          ctx.lineCap = 'round';
          for (let i = 0; i < physics.trailPoints.length; i++) {
            const point = physics.trailPoints[i];
            const size = (point.alpha * 8) + 2; // Larger trails
            
            ctx.globalAlpha = point.alpha * 0.7; // More opaque trails
            const visual = creature.visual || {};
            const hue = visual.colorR ? (visual.colorR * 360) % 360 : 180;
            ctx.fillStyle = `hsl(${hue}, 80%, 70%)`; // More saturated
            
            // Trail glow
            ctx.shadowColor = `hsl(${hue}, 80%, 70%)`;
            ctx.shadowBlur = 6;
            
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          }
          ctx.restore();
        }
        
        // Draw particles
        if (showParticles) {
          physics.particles.forEach((particle: any) => {
            const alpha = particle.life / particle.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
        }
        
        // Draw creature
        drawCreature(physics, creature, currentTime);
        
        // Selection indicator
        if (selectedCreature === creature.id) {
          ctx.save();
          ctx.strokeStyle = selectionColor;
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.8 + 0.2 * Math.sin(currentTime * 0.005);
          ctx.beginPath();
          ctx.arc(physics.x, physics.y, 45, 0, Math.PI * 2);
          ctx.stroke();
          
          // Selection pulse
          ctx.globalAlpha = 0.3 + 0.2 * Math.sin(currentTime * 0.008);
          ctx.beginPath();
          ctx.arc(physics.x, physics.y, 55 + Math.sin(currentTime * 0.01) * 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        
        // Draw creature ID
        ctx.fillStyle = selectedCreature === creature.id ? selectionColor : textColor;
        ctx.font = selectedCreature === creature.id ? 'bold 12px Arial' : '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`#${creature.id}`, physics.x, physics.y - 40);
      });
      
      // Clean up physics for dead creatures
      const aliveIds = new Set(parsedCreatures.filter(c => c.estaViva).map(c => c.id));
      localCreaturePhysics.forEach((_, id) => {
        if (!aliveIds.has(id)) {
          localCreaturePhysics.delete(id);
        }
      });

      // Draw chat bubbles on top of everything
      drawChatBubbles(ctx);

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation immediately
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
      }, [parsedCreatures, nebulaTopColor, nebulaMidColor, nebulaDeepColor, nebulaBottomColor, animaStreamColor, creationEnergyColor, echoColor, elementalStratumColor, selectionColor, gridColor, textColor, showTrails, showParticles, showGrid, isPlaying, animationSpeed, updateCreaturePhysics, initializeCreaturePhysics]);

  // === CHAT BUBBLE DRAWING FUNCTION ===
  const drawChatBubbles = (ctx: CanvasRenderingContext2D) => {
    const currentTime = Date.now();
    const bubbles = chatBubblesRef.current;
    
    bubbles.forEach((bubble) => {
      const physics = creaturePhysicsRef.current.get(bubble.creatureId);
      if (!physics) return;
      
      // Update bubble position to follow creature
      const bubbleX = physics.x;
      const bubbleY = physics.y - 70; // Position above creature
      
      // Calculate fade-out based on remaining time
      const remainingTime = bubble.duration - (currentTime - bubble.timestamp);
      const alpha = Math.min(1, remainingTime / 1000); // Fade in last second
      
      if (alpha <= 0) return;
      
      // Save context for bubble styling
      ctx.save();
      ctx.globalAlpha = alpha;
      
      // Measure text for bubble sizing
      ctx.font = getBubbleFont(bubble.level);
      const textMetrics = ctx.measureText(bubble.message);
      const textWidth = textMetrics.width;
      const textHeight = 16; // Approximate font height
      
      // Bubble dimensions
      const padding = 12;
      const bubbleWidth = textWidth + padding * 2;
      const bubbleHeight = textHeight + padding;
      const borderRadius = 8;
      
      // Draw bubble background
      ctx.fillStyle = getBubbleColor(bubble.level);
      ctx.strokeStyle = getBubbleBorderColor(bubble.level);
      ctx.lineWidth = 2;
      
      // Rounded rectangle bubble
      ctx.beginPath();
      
      // Use roundRect if available, otherwise fallback to manual rounded corners
      if (ctx.roundRect) {
        ctx.roundRect(
          bubbleX - bubbleWidth / 2,
          bubbleY - bubbleHeight,
          bubbleWidth,
          bubbleHeight,
          borderRadius
        );
      } else {
        // Manual rounded rectangle fallback
        const x = bubbleX - bubbleWidth / 2;
        const y = bubbleY - bubbleHeight;
        const w = bubbleWidth;
        const h = bubbleHeight;
        const r = borderRadius;
        
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      }
      
      ctx.fill();
      ctx.stroke();
      
      // Draw bubble tail (pointing to creature)
      const tailX = bubbleX;
      const tailY = bubbleY;
      const tailWidth = 8;
      const tailHeight = 8;
      
      ctx.beginPath();
      ctx.moveTo(tailX - tailWidth / 2, tailY);
      ctx.lineTo(tailX, tailY + tailHeight);
      ctx.lineTo(tailX + tailWidth / 2, tailY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Draw text
      ctx.fillStyle = getBubbleTextColor(bubble.level);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        bubble.message,
        bubbleX,
        bubbleY - bubbleHeight / 2
      );
      
      ctx.restore();
    });
  };

  // Helper functions for bubble styling
  const getBubbleFont = (level: string): string => {
    switch (level) {
      case 'bebe':
        return '12px Arial';
      case 'toddler':
        return '13px Arial';
      case 'child':
        return '14px Arial';
      case 'teen':
        return '15px Arial';
      case 'adult':
        return '16px Arial';
      default:
        return '14px Arial';
    }
  };

  const getBubbleColor = (level: string): string => {
    switch (level) {
      case 'bebe':
        return 'rgba(255, 182, 193, 0.9)'; // Light pink
      case 'toddler':
        return 'rgba(255, 215, 0, 0.9)'; // Gold
      case 'child':
        return 'rgba(135, 206, 235, 0.9)'; // Sky blue
      case 'teen':
        return 'rgba(147, 112, 219, 0.9)'; // Medium slate blue
      case 'adult':
        return 'rgba(106, 90, 205, 0.9)'; // Slate blue
      default:
        return 'rgba(255, 255, 255, 0.9)';
    }
  };

  const getBubbleBorderColor = (level: string): string => {
    switch (level) {
      case 'bebe':
        return 'rgba(255, 105, 180, 0.8)'; // Hot pink
      case 'toddler':
        return 'rgba(255, 165, 0, 0.8)'; // Orange
      case 'child':
        return 'rgba(30, 144, 255, 0.8)'; // Dodger blue
      case 'teen':
        return 'rgba(123, 104, 238, 0.8)'; // Medium slate blue
      case 'adult':
        return 'rgba(72, 61, 139, 0.8)'; // Dark slate blue
      default:
        return 'rgba(128, 128, 128, 0.8)';
    }
  };

  const getBubbleTextColor = (level: string): string => {
    switch (level) {
      case 'bebe':
      case 'toddler':
        return '#333333';
      default:
        return '#ffffff';
    }
  };

  // === INDIVIDUAL CREATURE CHAT FUNCTIONS ===

  // Open chat modal for specific creature
  const openCreatureChat = useCallback((creature: any) => {
    console.log(`💬 Opening chat with creature ${creature.id} (${creature.name})`);
    console.log(`🔍 Modal state before: isChatModalOpen=${isChatModalOpen}, selectedCreatureChat=${selectedCreatureChat?.id}`);
    
    setSelectedCreatureChat(creature);
    setIsChatModalOpen(true);
    
    // Load chat history for this creature
    const history = creatureChatHistory.get(creature.id) || [];
    setChatMessages(history);
    
    console.log(`🔍 Modal state after: setting isChatModalOpen=true, selectedCreatureChat=${creature.id}`);
  }, [isChatModalOpen, selectedCreatureChat, creatureChatHistory]);

  // Close chat modal
  const closeChatModal = () => {
    setIsChatModalOpen(false);
    setSelectedCreatureChat(null);
    setUserMessage('');
    setChatMessages([]);
  };

  // Analyze message and determine appropriate experience type using LLM
  const analyzeExperience = async (message: string): Promise<{
    experienceType: string,
    context: string,
    emotionalImpact: string,
    intensity: number
  }> => {
    if (!openRouterService) {
      return { 
        experienceType: 'social_interaction', 
        context: `User said: "${message}"`,
        emotionalImpact: 'neutral',
        intensity: 0.5 
      };
    }

    const analysisPrompt = `Analyze this user message to a digital creature and determine what type of experience it represents: "${message}"

    Available experience types:
    - social_interaction: Normal friendly conversation, questions, casual chat
    - user_abandoned: Harsh insults, threats, cruel words, abandonment language
    - user_returned: Warm greetings, compliments, expressions of care/love, positive reconnection
    - combat_won: Challenges, competitive language (if creature could "win")
    - combat_lost: Defeat language, submission (if creature could "lose")

    Respond with EXACTLY this format (no extra text):
    EXPERIENCE_TYPE: [one of the types above]
    CONTEXT: [1-2 sentence description of what happened]
    EMOTIONAL_IMPACT: [very_negative/negative/neutral/positive/very_positive]
    INTENSITY: [0.0-1.0]

    Consider:
    - Most normal messages are "social_interaction"
    - Only use "user_abandoned" for genuinely cruel/harsh messages (insults, threats, mean words)
    - Only use "user_returned" for warm, loving, or appreciative messages
    - Intensity measures how emotionally impactful this would be for a creature`;

    try {
      const response = await openRouterService.chat(analysisPrompt);
      
      // Parse the structured response
      const lines = response.split('\n');
      const experienceType = lines.find(l => l.includes('EXPERIENCE_TYPE:'))?.split(':')[1]?.trim() || 'social_interaction';
      const context = lines.find(l => l.includes('CONTEXT:'))?.split(':')[1]?.trim() || `User said: "${message}"`;
      const emotionalImpact = lines.find(l => l.includes('EMOTIONAL_IMPACT:'))?.split(':')[1]?.trim() || 'neutral';
      const intensity = parseFloat(lines.find(l => l.includes('INTENSITY:'))?.split(':')[1]?.trim() || '0.5');

      console.log(`🎭 Experience analysis: ${experienceType}, impact: ${emotionalImpact}, intensity: ${intensity}`);
      console.log(`📝 Context: ${context}`);
      
      return { 
        experienceType, 
        context, 
        emotionalImpact, 
        intensity: Math.max(0, Math.min(1, intensity)) 
      };
    } catch (error) {
      console.error('❌ Failed to analyze experience:', error);
      return { 
        experienceType: 'social_interaction', 
        context: `User said: "${message}"`,
        emotionalImpact: 'neutral',
        intensity: 0.5 
      };
    }
  };

  // Update creature experience in contract based on interaction
  const updateCreatureExperience = async (creatureId: number, experienceType: string, context: string) => {
    try {
      const UPDATE_EXPERIENCE = `
        import EvolvingCreatureNFT from 0x2444e6b4d9327f09
        import PersonalityModuleV2 from 0x2444e6b4d9327f09

        transaction(creatureID: UInt64, experienceType: String, context: String) {
            let collection: &EvolvingCreatureNFT.Collection
            
            prepare(signer: &Account) {
                self.collection = signer.capabilities.borrow<&EvolvingCreatureNFT.Collection>(EvolvingCreatureNFT.CollectionStoragePath)
                    ?? panic("Could not borrow collection reference")
            }
            
            execute {
                if let creature = self.collection.borrowEvolvingCreatureNFT(id: creatureID) {
                    if creature.traits.containsKey("personality") {
                        if let personalityTrait = creature.traits["personality"] as! &PersonalityModuleV2.PersonalityTrait? {
                            personalityTrait.addExperience(experienceType, context)
                            personalityTrait.updateUserInteraction(self.collection.owner!.address)
                            log("Experience added: ".concat(experienceType).concat(" - ").concat(context))
                        }
                    }
                }
            }
        }
      `;

      await fcl.mutate({
        cadence: UPDATE_EXPERIENCE,
        args: (arg: any, t: any) => [
          arg(creatureId.toString(), t.UInt64),
          arg(experienceType, t.String),
          arg(context, t.String)
        ],
        proposer: fcl.currentUser.authorization,
        payer: fcl.currentUser.authorization,
        authorizations: [fcl.currentUser.authorization],
        limit: 1000
      });

      console.log(`✅ Updated experience for creature ${creatureId}: ${experienceType} - ${context}`);
    } catch (error) {
      console.error(`❌ Failed to update creature experience:`, error);
    }
  };

  // Send message to creature
  const sendMessageToCreature = async () => {
    if (!userMessage.trim() || !selectedCreatureChat || !openRouterService || isSendingMessage) return;

    setIsSendingMessage(true);

    try {
      // Analyze experience type using LLM
      const experienceAnalysis = await analyzeExperience(userMessage);

      // Add user message to chat
      const userChatMessage = {
        sender: 'user' as const,
        message: userMessage.trim(),
        timestamp: Date.now()
      };

      const updatedMessages = [...chatMessages, userChatMessage];
      setChatMessages(updatedMessages);

      // Clear input immediately for better UX
      setUserMessage('');

      // Update experience in contract using LLM-determined type
      await updateCreatureExperience(selectedCreatureChat.id, experienceAnalysis.experienceType, experienceAnalysis.context);

      // Show appropriate feedback based on experience type
      if (experienceAnalysis.experienceType === 'user_abandoned') {
        toast({
          title: "😢 Creature Hurt",
          description: `${selectedCreatureChat.name} was hurt by your words. This will cause trauma and stress.`,
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
      } else if (experienceAnalysis.experienceType === 'user_returned') {
        toast({
          title: "😊 Creature Happy",
          description: `${selectedCreatureChat.name} feels appreciated by your kind words!`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else if (experienceAnalysis.emotionalImpact === 'very_positive') {
        toast({
          title: "🌟 Positive Interaction",
          description: `${selectedCreatureChat.name} enjoyed that interaction!`,
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } else if (experienceAnalysis.emotionalImpact === 'very_negative') {
        toast({
          title: "😟 Negative Impact",
          description: `${selectedCreatureChat.name} didn't appreciate that...`,
          status: "warning",
          duration: 2000,
          isClosable: true,
        });
      }

      // Get creature response using contract-based personality
      let personalityData = null;
      try {
        // Get current user address
        const user = await fcl.currentUser.snapshot();
        if (user.addr) {
          personalityData = await PersonalityService.getCreaturePersonalityPrompts(user.addr, selectedCreatureChat.id);
        } else {
          console.log(`❌ No user address available for creature chat response`);
        }
      } catch (error) {
        console.error('Failed to get personality data for response');
      }

      let creatureResponse = null;
      if (personalityData && !personalityData.error) {
        const responsePrompt = personalityData.responsePrompt.replace(
          'How are you feeling today?',
          userMessage.trim()
        );
        creatureResponse = await openRouterService.chat(responsePrompt);
      } else {
        // Fallback to local generation
        const prompt = generateChatPrompt(selectedCreatureChat, [userMessage.trim()]);
        creatureResponse = await openRouterService.chat(prompt);
      }

      if (creatureResponse) {
        const creatureChatMessage = {
          sender: 'creature' as const,
          message: creatureResponse,
          timestamp: Date.now()
        };

        const finalMessages = [...updatedMessages, creatureChatMessage];
        setChatMessages(finalMessages);

        // Update chat history
        const newHistory = new Map(creatureChatHistory);
        newHistory.set(selectedCreatureChat.id, finalMessages.slice(-20)); // Keep last 20 messages
        setCreatureChatHistory(newHistory);
      }

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      toast({
        title: "Chat Error",
        description: "Failed to send message. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Check user connection status
  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await fcl.currentUser.snapshot();
        setCurrentUserAddress(user.addr || null);
        console.log(`👤 Current user address: ${user.addr || 'Not connected'}`);
      } catch (error) {
        console.error('Failed to get user address:', error);
        setCurrentUserAddress(null);
      }
    };

    checkUser();
    
    // Listen for user changes
    const unsubscribe = fcl.currentUser.subscribe(checkUser);
    return () => unsubscribe && unsubscribe();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Debug modal state changes
  useEffect(() => {
    console.log(`🔍 Modal state changed: isOpen=${isChatModalOpen}, selectedCreature=${selectedCreatureChat?.id || 'none'}`);
  }, [isChatModalOpen, selectedCreatureChat]);

  return (
    <Box 
      w="100vw" 
      h="100vh" 
      overflow="hidden" 
      position="fixed"
      top={0}
      left={0}
      bg="black"
      zIndex={9999}
    >
      {/* FULL ENVIRONMENT - The entire page IS Primordia */}
      <Box
        w="full"
        h="full"
        position="relative"
      >
        <canvas 
          ref={canvasRef}
          width={typeof window !== 'undefined' ? window.innerWidth : 1920}
          height={typeof window !== 'undefined' ? window.innerHeight : 1080}
          onClick={(e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            // Find clicked creature
            let clickedCreature = null;
            const localCreaturePhysics = creaturePhysicsRef.current;
            
            parsedCreatures.forEach(creature => {
              if (!creature.estaViva) return;
              const physics = localCreaturePhysics.get(creature.id);
              if (!physics) return;
              
              const distance = Math.sqrt((x - physics.x) ** 2 + (y - physics.y) ** 2);
              const clickRadius = 60; // Even larger for full screen
              
              if (distance <= clickRadius) {
                clickedCreature = creature.id;
              }
            });
            
            setSelectedCreature(clickedCreature === selectedCreature ? null : clickedCreature);
          }}
          style={{ 
            width: '100vw',
            height: '100vh',
            backgroundColor: canvasBgColor,
            cursor: 'crosshair',
            display: 'block'
          }}
        />
          
        {/* Exit Button - Top Left */}
        <Button
          position="absolute"
          top={4}
          left={4}
          size="sm"
          variant="ghost"
          colorScheme="red"
          onClick={() => {
            // TODO: Add proper close functionality
            console.log('Exit full screen mode');
          }}
          bg="rgba(255, 0, 0, 0.1)"
          _hover={{ bg: "rgba(255, 0, 0, 0.2)" }}
          border="1px solid rgba(255, 0, 0, 0.3)"
          backdropFilter="blur(5px)"
          zIndex={25}
        >
          ✕ Exit
        </Button>
        
        {/* Subtle Integrated UI */}
        <HStack 
          position="absolute" 
          top={4} 
          left={20} 
          spacing={4} 
          zIndex={20}
          ml={16}
        >
          <Button
            colorScheme="purple" 
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={FiZap} />}
            onClick={onRefresh}
            isLoading={isLoading}
            loadingText="Processing..."
            bg="rgba(138, 43, 226, 0.1)"
            _hover={{ bg: "rgba(138, 43, 226, 0.2)" }}
            border="1px solid rgba(138, 43, 226, 0.3)"
            backdropFilter="blur(5px)"
          >
            Process Evolution
          </Button>
          
          <Button
            colorScheme="green" 
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={FiStar} />}
            onClick={() => {
              // TODO: Implement mint functionality
              console.log('Mint new life form');
            }}
            bg="rgba(46, 160, 67, 0.1)"
            _hover={{ bg: "rgba(46, 160, 67, 0.2)" }}
            border="1px solid rgba(46, 160, 67, 0.3)"
            backdropFilter="blur(5px)"
          >
            Mint Life Form
          </Button>
          
          <Button
            colorScheme="blue" 
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={FiMessageCircle} />}
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            bg="rgba(59, 130, 246, 0.1)"
            _hover={{ bg: "rgba(59, 130, 246, 0.2)" }}
            border="1px solid rgba(59, 130, 246, 0.3)"
            backdropFilter="blur(5px)"
            isLoading={isGeneratingMessages}
            loadingText={`Generating ${generationProgress?.current}/${generationProgress?.total}`}
          >
            {openRouterService ? 
              (isGeneratingMessages ? 
                `🔄 Generating...` : 
                '🎯 AI Ready'
              ) : 
              '🤖 Enable Chat'
            }
          </Button>
          
          {/* EMERGENCY CLOSE MODAL BUTTON - DISABLED FOR TESTING */}
          {false && isChatModalOpen && (
            <Button
              colorScheme="red"
              variant="solid"
              size="sm"
              onClick={() => {
                console.log('🚨 Emergency modal close');
                setIsChatModalOpen(false);
                setSelectedCreatureChat(null);
                setChatMessages([]);
                setUserMessage('');
              }}
              bg="rgba(255, 0, 0, 0.8)"
              _hover={{ bg: "rgba(255, 0, 0, 1)" }}
              border="1px solid rgba(255, 0, 0, 0.3)"
              backdropFilter="blur(5px)"
            >
              🚨 Close Modal
            </Button>
          )}
        </HStack>

        {/* API Key Input Panel */}
        <AnimatePresence>
          {showApiKeyInput && (
            <MotionBox
              position="absolute"
              top={16}
              left={20}
              w="400px"
              bg="rgba(0,0,0,0.9)"
              backdropFilter="blur(15px)"
              borderRadius="lg"
              p={4}
              border="1px solid rgba(59, 130, 246, 0.4)"
              zIndex={25}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <VStack spacing={3} align="stretch">
                <Text fontSize="sm" color="blue.200" fontWeight="bold">
                  🤖 AI Chat System
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Creatures will express their personalities through AI-generated messages based on their traits
                </Text>
                <FormControl>
                  <FormLabel fontSize="xs" color="gray.300">OpenRouter API Key</FormLabel>
                  <Input
                    size="sm"
                    type="password"
                    placeholder="sk-or-..."
                    value={openRouterApiKey}
                    onChange={(e) => setOpenRouterApiKey(e.target.value)}
                    bg="rgba(255,255,255,0.1)"
                    border="1px solid rgba(59, 130, 246, 0.3)"
                    _hover={{ borderColor: "rgba(59, 130, 246, 0.5)" }}
                    _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px rgba(59, 130, 246, 0.4)" }}
                    color="white"
                  />
                </FormControl>
                <HStack justify="space-between">
                  <Text fontSize="xs" color="gray.500">
                    Get your key at openrouter.ai
                  </Text>
                  <Button
                    size="xs"
                    colorScheme="blue"
                    onClick={() => setShowApiKeyInput(false)}
                  >
                    Close
                  </Button>
                </HStack>
                {openRouterService && (
                  <Text fontSize="xs" color="green.400" textAlign="center">
                    ✅ AI service connected! Creatures will now chat when resting.
                  </Text>
                )}
              </VStack>
            </MotionBox>
          )}
        </AnimatePresence>
        
        {/* Subtle Stats */}
        <VStack 
          position="absolute" 
          top={4} 
          right={4} 
          spacing={2} 
          zIndex={20}
          bg="rgba(0,0,0,0.3)"
          backdropFilter="blur(10px)"
          px={4}
          py={2}
          borderRadius="lg"
          border="1px solid rgba(138, 43, 226, 0.2)"
          align="stretch"
        >
          <HStack spacing={6}>
            <HStack spacing={1}>
              <Text fontSize="lg" color="purple.300" fontWeight="bold">
                {parsedCreatures.filter(c => c.estaViva).length}
              </Text>
              <Text fontSize="xs" color="gray.400">forms</Text>
            </HStack>
            <HStack spacing={1}>
              <Text fontSize="lg" color="purple.300" fontWeight="bold">
                {parsedCreatures.reduce((sum, c) => sum + parseFloat(c.puntosEvolucion), 0).toFixed(0)}
              </Text>
              <Text fontSize="xs" color="gray.400">anima</Text>
            </HStack>
          </HStack>
          
          {/* User Connection Status */}
          <HStack spacing={2} justify="center">
            <Text fontSize="xs" color="gray.400">Account:</Text>
            {currentUserAddress ? (
              <Text fontSize="xs" color="green.300" fontWeight="bold">
                {currentUserAddress.slice(0, 6)}...{currentUserAddress.slice(-4)}
              </Text>
            ) : (
              <Text fontSize="xs" color="red.300" fontWeight="bold">
                Not Connected
              </Text>
            )}
          </HStack>
        </VStack>
        
        {/* Simplified Creature Info Panel */}
        {selectedCreature && (
          <MotionBox
            position="absolute"
            right={4}
            top="50%"
            transform="translateY(-50%)"
            w="280px"
            bg="rgba(0,0,0,0.8)"
            backdropFilter="blur(15px)"
            borderRadius="lg"
            p={4}
            border="1px solid rgba(138, 43, 226, 0.4)"
            zIndex={30}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
          >
            {parsedCreatures
              .filter(creature => creature.id === selectedCreature)
              .map((creature) => (
                <VStack key={creature.id} align="stretch" spacing={4}>
                  {/* Header */}
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" fontSize="lg" color="purple.200">
                      Form #{creature.id}
                    </Text>
                    <Badge colorScheme={creature.estaViva ? "green" : "red"} variant="solid">
                      {creature.estaViva ? "🟢 Alive" : "💀 Dead"}
                    </Badge>
                  </Flex>

                  {/* Essential Stats Only */}
                  <SimpleGrid columns={2} spacing={3}>
                    <VStack spacing={0}>
                      <Text fontSize="xl" fontWeight="bold" color="yellow.300">
                        {parseFloat(creature.edadDiasCompletos).toFixed(1)}
                      </Text>
                      <Text fontSize="xs" color="gray.400">days old</Text>
                    </VStack>
                    <VStack spacing={0}>
                      <Text fontSize="xl" fontWeight="bold" color="purple.300">
                        {parseFloat(creature.puntosEvolucion).toFixed(1)}
                      </Text>
                      <Text fontSize="xs" color="gray.400">anima</Text>
                    </VStack>
                  </SimpleGrid>

                  {/* Key Actions */}
                  <VStack spacing={2}>
                    <Button
                      colorScheme="blue" 
                      variant="solid"
                      size="sm"
                      leftIcon={<Icon as={FiMessageCircle} />}
                      onClick={() => openCreatureChat(creature)}
                      w="full"
                      isDisabled={!openRouterService}
                    >
                      💬 Chat with {creature.name}
                    </Button>
                    
                    <Button
                      colorScheme="pink" 
                      variant="solid"
                      size="sm"
                      leftIcon={<Icon as={FiHeart} />}
                      onClick={() => {
                        console.log(`Mitosis for creature ${selectedCreature}`);
                      }}
                      w="full"
                    >
                      Initiate Mitosis
                    </Button>
                  </VStack>

                  {/* Only Non-Visual Info */}
                  {creature.advanced && (
                    <VStack spacing={3} align="stretch">
                      {/* Activity State */}
                      <Box>
                        <Text fontSize="xs" color="gray.400" mb={1}>Activity Cycle</Text>
                        <Text fontSize="sm" color="yellow.200">
                          {(creature.advanced.ritmoCircadiano || 0.5) < 0.25 ? '🌙 Nocturnal' : 
                           (creature.advanced.ritmoCircadiano || 0.5) < 0.75 ? '☀️ Diurnal' : '🌅 Crepuscular'}
                        </Text>
                      </Box>

                      {/* Personality & Chat Status */}
                      {creature.personality && (
                        <Box>
                          <Text fontSize="xs" color="gray.400" mb={1}>Personality & Chat</Text>
                          <VStack spacing={1} align="stretch">
                            <Text fontSize="xs" color="blue.300">
                              🧠 {getCommunicationLevel(creature.personality)} level
                            </Text>
                            <Text fontSize="xs" color="cyan.300">
                              💭 {getPersonalityDescription(creature.personality)}
                            </Text>
                            <Text fontSize="xs" color="green.300">
                              😊 {getEmotionalState(creature.personality)}
                            </Text>
                            {openRouterService && (
                              <Text fontSize="xs" color="purple.300">
                                🤖 AI chat enabled
                              </Text>
                            )}
                          </VStack>
                        </Box>
                      )}

                      {/* Health & Energy - Compact */}
                      <VStack spacing={2} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="gray.400">Health</Text>
                          <Text fontSize="xs" color="red.300">
                            {Math.floor((creature.advanced.nivelSalud || 1) * 100)}%
                          </Text>
                        </HStack>
                        <Progress 
                          value={(creature.advanced.nivelSalud || 1) * 100} 
                          colorScheme="red" 
                          size="sm" 
                          borderRadius="full"
                        />
                        
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="gray.400">Energy</Text>
                          <Text fontSize="xs" color="blue.300">
                            {Math.floor((creature.advanced.nivelEnergia || 1) * 100)}%
                          </Text>
                        </HStack>
                        <Progress 
                          value={(creature.advanced.nivelEnergia || 1) * 100} 
                          colorScheme="blue" 
                          size="sm" 
                          borderRadius="full"
                        />
                      </VStack>

                      {/* Evolution Achievements Only */}
                      {creature.advanced.marcasEvolucion && creature.advanced.marcasEvolucion.length > 0 && (
                        <Box>
                          <Text fontSize="xs" color="gray.400" mb={1}>Achievements</Text>
                          <VStack align="stretch" spacing={1}>
                            {creature.advanced.marcasEvolucion.slice(0, 3).map((mark: number, index: number) => (
                              <Text key={index} fontSize="xs" color="gold">
                                {EVOLUTION_MARKS[mark] || `Mark ${mark}`}
                              </Text>
                            ))}
                            {creature.advanced.marcasEvolucion.length > 3 && (
                              <Text fontSize="xs" color="gray.500">
                                +{creature.advanced.marcasEvolucion.length - 3} more...
                              </Text>
                            )}
                          </VStack>
                        </Box>
                      )}
                    </VStack>
                  )}
                </VStack>
              ))}
          </MotionBox>
        )}
      </Box>

      {/* ADVANCED CREATURE CHAT MODAL - CUSTOM IMPLEMENTATION */}
      {isChatModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={closeChatModal}
        >
          <div
            style={{
              backgroundColor: '#1a202c',
              color: 'white',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid #805ad5',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #2d3748',
              background: 'linear-gradient(135deg, #805ad5, #9f7aea)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                    💬 Chat with {selectedCreatureChat?.name}
                  </h2>
                  <span style={{
                    backgroundColor: '#805ad5',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    Form #{selectedCreatureChat?.id}
                  </span>
                </div>
                <button
                  onClick={closeChatModal}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '5px'
                  }}
                >
                  ✕
                </button>
              </div>
              
              {/* Personality Info */}
              {selectedCreatureChat?.personality && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#e2e8f0', marginBottom: '8px' }}>
                    <span>🧠 {getCommunicationLevel(selectedCreatureChat.personality)} level</span>
                    <span>💭 {getPersonalityDescription(selectedCreatureChat.personality)}</span>
                    <span>😊 {getEmotionalState(selectedCreatureChat.personality)}</span>
                  </div>
                  
                  {/* Communication Style Explanation */}
                  <div style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    padding: '8px 12px', 
                    borderRadius: '6px', 
                    fontSize: '11px', 
                    color: '#cbd5e0',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <strong>Communication Style:</strong> {getCommunicationExplanation(selectedCreatureChat.personality)}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Messages Area */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              backgroundColor: '#2d3748',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#a0aec0', padding: '40px 20px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                    Start a conversation with {selectedCreatureChat?.name}!
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#718096' }}>
                    Your words will influence their personality and emotional state.
                  </p>
                </div>
              ) : (
                                 <>
                   {chatMessages.map((msg, index) => (
                     <div key={index} style={{
                       display: 'flex',
                       justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                     }}>
                       <div style={{
                         maxWidth: '80%',
                         padding: '12px 16px',
                         borderRadius: '18px',
                         backgroundColor: msg.sender === 'user' ? '#3182ce' : '#805ad5',
                         color: 'white',
                         position: 'relative'
                       }}>
                         <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', opacity: 0.8 }}>
                           {msg.sender === 'user' ? 'You' : selectedCreatureChat?.name}
                         </div>
                         <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                           {msg.message}
                         </div>
                         <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.6 }}>
                           {new Date(msg.timestamp).toLocaleTimeString()}
                         </div>
                       </div>
                     </div>
                   ))}
                   
                   {/* Typing indicator when creature is responding */}
                   {isSendingMessage && (
                     <div style={{
                       display: 'flex',
                       justifyContent: 'flex-start'
                     }}>
                       <div style={{
                         maxWidth: '80%',
                         padding: '12px 16px',
                         borderRadius: '18px',
                         backgroundColor: '#805ad5',
                         color: 'white',
                         opacity: 0.8
                       }}>
                         <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', opacity: 0.8 }}>
                           {selectedCreatureChat?.name}
                         </div>
                         <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                           <span style={{ 
                             animation: 'pulse 1.5s ease-in-out infinite',
                             display: 'inline-block'
                           }}>
                             ✨ thinking...
                           </span>
                         </div>
                       </div>
                     </div>
                   )}
                   
                   <div ref={chatMessagesEndRef} />
                 </>
               )}
            </div>

                         {/* Footer with Input */}
             <div style={{
               padding: '20px',
               borderTop: '1px solid #2d3748',
               backgroundColor: '#1a202c'
             }}>
               {!openRouterService ? (
                 <div style={{ textAlign: 'center', color: '#f56565', padding: '20px' }}>
                   <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤖</div>
                   <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                     AI Chat Service Required
                   </div>
                   <div style={{ fontSize: '12px', color: '#a0aec0' }}>
                     Please configure your OpenRouter API key to enable creature chat
                   </div>
                 </div>
               ) : (
                 <>
                   <div style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '10px', textAlign: 'center' }}>
                     💡 Your messages will be analyzed for sentiment and will influence the creature's personality
                   </div>
                   <div style={{ display: 'flex', gap: '10px' }}>
                     <textarea
                       placeholder={`Say something to ${selectedCreatureChat?.name}...`}
                       value={userMessage}
                       onChange={(e) => setUserMessage(e.target.value)}
                       onKeyPress={(e) => {
                         if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           sendMessageToCreature();
                         }
                       }}
                       style={{
                         flex: 1,
                         padding: '12px',
                         borderRadius: '8px',
                         border: '1px solid #4a5568',
                         backgroundColor: '#2d3748',
                         color: 'white',
                         resize: 'none',
                         minHeight: '40px',
                         maxHeight: '100px',
                         fontSize: '14px'
                       }}
                       rows={2}
                     />
                     <button
                       onClick={sendMessageToCreature}
                       disabled={!userMessage.trim() || !openRouterService || isSendingMessage}
                       style={{
                         padding: '12px 20px',
                         borderRadius: '8px',
                         border: 'none',
                         backgroundColor: (!userMessage.trim() || !openRouterService || isSendingMessage) ? '#4a5568' : '#805ad5',
                         color: 'white',
                         cursor: (!userMessage.trim() || !openRouterService || isSendingMessage) ? 'not-allowed' : 'pointer',
                         fontSize: '16px',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         minWidth: '60px'
                       }}
                     >
                       {isSendingMessage ? '⏳' : '📤'}
                     </button>
                   </div>
                 </>
               )}
             </div>
          </div>
        </div>
      )}
    </Box>
    );
  } 