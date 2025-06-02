'use client';

import { Box, Button, ButtonGroup, Container, Heading, Text, VStack, Spinner, useToast, useColorModeValue, Code, Image, Flex, Spacer, Tag, HStack, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, useDisclosure, Badge, IconButton } from '@chakra-ui/react';
import { useEffect, useState, useRef } from 'react';
import * as fcl from '@onflow/fcl';
import '@/flow/config'; // Importar configuración de FCL
import { config } from '@onflow/config';
import Header from '@/components/Header';
import NextLink from 'next/link';
import AdvancedCreatureVisualizer from '@/components/AdvancedCreatureVisualizer';
import { motion } from 'framer-motion';
import { OpenRouterService } from '../../services/OpenRouterService';

// Motion components
const MotionBox = motion(Box);
const MotionVStack = motion(VStack);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);

// Animation variants
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.1,
      duration: 0.6,
      ease: "easeOut"
    }
  })
};

// Colors
const headingColor = 'blue.600';
const loreTextColor = 'gray.600';

const parseFloatSafe = (value: string | number | undefined | null, defaultValue: number): number => {
  if (value === undefined || value === null || typeof value === 'string' && value.trim() === '') {
    return defaultValue;
  }
  const num = parseFloat(typeof value === 'number' ? value.toString() : value);
  return isNaN(num) ? defaultValue : num;
};

const parseIntSafe = (value: string | number | undefined | null, defaultValue: number): number => {
    if (value === undefined || value === null || typeof value === 'string' && value.trim() === '') {
      return defaultValue;
    }
    const num = parseInt(typeof value === 'number' ? value.toString() : value, 10);
    return isNaN(num) ? defaultValue : num;
  };

const CONTRACT_NAME = "EvolvingCreatureNFT";
const CONTRACT_ADDRESS = "0x2444e6b4d9327f09"; // Your deployed contract address
const FUNGIBLE_TOKEN_ADDRESS = "0x9a0766d93b6608b7";
const FLOW_TOKEN_ADDRESS = "0x7e60df042a9c0868";
const NON_FUNGIBLE_TOKEN_ADDRESS = "0x631e88ae7f1d7c20";
const METADATA_VIEWS_ADDRESS = "0x631e88ae7f1d7c20";

const MINIMUM_EP_FOR_MITOSIS = 10.0;

const GET_ACTIVE_CREATURES_SCRIPT = `
import ${CONTRACT_NAME} from ${CONTRACT_ADDRESS}

access(all) struct CreatureUIData {
    access(all) let id: UInt64
    access(all) let name: String
    access(all) let description: String
    access(all) let thumbnail: String
    access(all) let estaViva: Bool
    access(all) let edadDiasCompletos: UFix64
    access(all) let lifespanTotalSimulatedDays: UFix64
    access(all) let puntosEvolucion: UFix64
    access(all) let initialSeed: UInt64
    access(all) let traitValues: {String: String?}
    access(all) let registeredModules: [String]

    init(
        id: UInt64, name: String, description: String, thumbnail: String, estaViva: Bool,
        edadDiasCompletos: UFix64, lifespanTotalSimulatedDays: UFix64, puntosEvolucion: UFix64,
        initialSeed: UInt64, traitValues: {String: String?}, registeredModules: [String]
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.thumbnail = thumbnail
        self.estaViva = estaViva
        self.edadDiasCompletos = edadDiasCompletos
        self.lifespanTotalSimulatedDays = lifespanTotalSimulatedDays
        self.puntosEvolucion = puntosEvolucion
        self.initialSeed = initialSeed
        self.traitValues = traitValues
        self.registeredModules = registeredModules
    }
}

access(all) fun main(userAddress: Address): [CreatureUIData] {
    let account = getAccount(userAddress)
    let collectionPublicPath: PublicPath = ${CONTRACT_NAME}.CollectionPublicPath

    let collectionCap = account
        .capabilities.get<&${CONTRACT_NAME}.Collection>(collectionPublicPath)
        .borrow()
        ?? panic("No se pudo obtener la capacidad pública de la colección de ${CONTRACT_NAME} desde la ruta: ".concat(collectionPublicPath.toString()))
    
    let activeIDs = collectionCap.getActiveCreatureIDs()
    var creaturesData: [CreatureUIData] = []
    
    for id in activeIDs {
        let creature = collectionCap.borrowEvolvingCreatureNFT(id: id) 
            ?? panic("No se pudo obtener la criatura con ID: ".concat(id.toString()))
        
        // Obtener valores de traits para todos los módulos registrados
        let traitValues: {String: String?} = {}
        let registeredModules = ${CONTRACT_NAME}.getRegisteredModules()
        
        for moduleType in registeredModules {
            traitValues[moduleType] = creature.getTraitValue(traitType: moduleType)
        }

        creaturesData.append(
            CreatureUIData(
                id: creature.id, name: creature.name, description: creature.description, thumbnail: creature.thumbnail,
                estaViva: creature.estaViva, edadDiasCompletos: creature.edadDiasCompletos,
                lifespanTotalSimulatedDays: creature.lifespanTotalSimulatedDays,
                puntosEvolucion: creature.puntosEvolucion, initialSeed: creature.initialSeed,
                traitValues: traitValues, registeredModules: registeredModules
            )
        )
    }
    return creaturesData
}
`;

// Transacción de mint con pago de 0.1 FLOW - versión simplificada
const MINT_NFT_WITH_PAYMENT_TRANSACTION = `
import EvolvingCreatureNFT from ${CONTRACT_ADDRESS}
import TraitModule from ${CONTRACT_ADDRESS}
import FungibleToken from ${FUNGIBLE_TOKEN_ADDRESS}
import FlowToken from ${FLOW_TOKEN_ADDRESS}

transaction(recipient: Address) {
    prepare(acct: auth(Storage, Capabilities, BorrowValue) &Account) {
        // Retirar 0.1 FLOW como pago
        let vaultRef = acct.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("No se pudo obtener bóveda de FlowToken.")
        let paymentVault <- vaultRef.withdraw(amount: 0.1)
        
        // Depositar el pago al contrato
        let contractAccount = getAccount(${CONTRACT_ADDRESS})
        let paymentReceiver = contractAccount.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            .borrow() ?? panic("No se pudo obtener receptor de pago del contrato")
        paymentReceiver.deposit(from: <-paymentVault)
        
        // Get minter capability from contract account
        let minterCap = contractAccount.capabilities.get<&EvolvingCreatureNFT.NFTMinter>(/public/EvolvingCreatureNFTMinter)
        
        if minterCap.check() {
            let minter = minterCap.borrow()!
            
            // Get recipient's collection reference
            let recipientAccount = getAccount(recipient)
            let recipientCap = recipientAccount.capabilities.get<&EvolvingCreatureNFT.Collection>(EvolvingCreatureNFT.CollectionPublicPath)
            
            if recipientCap.check() {
                let collection = recipientCap.borrow()!
                
                // Create initial traits dynamically from ALL registered modules
                let initialTraits: @{String: {TraitModule.Trait}} <- {}
                let registeredModules = EvolvingCreatureNFT.getRegisteredModules()

                // Generate random seed from blockchain data for uniqueness
        let currentBlock = getCurrentBlock()
                let baseTimestamp = currentBlock.timestamp
        let blockHeight = currentBlock.height
                
                // Create a pseudo-random seed combining multiple sources
                let combinedSeed = UInt64(baseTimestamp) + blockHeight + UInt64(recipient.toString().length) * 12345
                
                // Create trait with seed for each registered module
                var moduleIndex: UInt64 = 0
                for moduleType in registeredModules {
                    if let factory = EvolvingCreatureNFT.getModuleFactory(moduleType: moduleType) {
                        // Create unique seed per module by adding module index
                        let moduleSeed = combinedSeed + moduleIndex * 98765
                        let randomTrait <- factory.createTraitWithSeed(seed: moduleSeed)
                        initialTraits[moduleType] <-! randomTrait
                        log("Created random trait for module: ".concat(moduleType).concat(" with seed: ").concat(moduleSeed.toString()))
                    }
                    moduleIndex = moduleIndex + 1
                }
                
                // Mint new NFT with traits
                let nft <- minter.mintNFT(
                    name: "Evolving Creature",
                    description: "A unique evolving digital creature",
                    thumbnail: "https://i.imgur.com/R3jYmPZ.png",
                    lifespanDays: 7.0,
                    initialTraits: <- initialTraits
                )
                
                collection.deposit(token: <-nft)
                log("NFT minted with 0.1 FLOW payment and deposited successfully!")
            } else {
                panic("Recipient's collection not found or not accessible")
            }
        } else {
            panic("No minter capability found")
        }
    }
}
`;

const PROCESS_EVOLUTION_TRANSACTION = `
import EvolvingCreatureNFT from ${CONTRACT_ADDRESS}

transaction(creatureID: UInt64, simulatedSecondsPerDay: UFix64) {
    
    prepare(acct: auth(Storage) &Account) {
        // Get reference to the collection with proper permissions
        let collectionRef = acct.storage.borrow<auth(Mutate, Insert, Remove) &EvolvingCreatureNFT.Collection>(
            from: EvolvingCreatureNFT.CollectionStoragePath
        ) ?? panic("Could not borrow collection reference")
        
        // Evolve the specific creature based on elapsed time (step-by-step processing)
        // 250 steps per simulated day
        collectionRef.evolveCreature(id: creatureID, simulatedSecondsPerDay: simulatedSecondsPerDay)
        
        log("Creature ".concat(creatureID.toString()).concat(" evolved with ").concat(simulatedSecondsPerDay.toString()).concat(" seconds per simulated day (250 steps/day)"))
    }
}
`;

const PERFORM_MITOSIS_TRANSACTION = `
import EvolvingCreatureNFT from ${CONTRACT_ADDRESS}

transaction(creatureID: UInt64, epCost: UFix64) {
    // Referencia a la colección de NFTs del usuario
    let collectionRef: auth(Mutate, Insert, Remove) &EvolvingCreatureNFT.Collection
    
    prepare(signer: auth(Storage) &Account) {
        // Obtener referencia a la colección
        self.collectionRef = signer.storage.borrow<auth(Mutate, Insert, Remove) &EvolvingCreatureNFT.Collection>(
            from: EvolvingCreatureNFT.CollectionStoragePath
        ) ?? panic("No se pudo obtener referencia a la colección de criaturas modulares")
        
        // Verificar que el costo de EP es razonable
        if epCost < 10.0 { 
            panic("El costo mínimo de EP para mitosis es 10.0")
        }
    }
    
    execute {
        // Realizar mitosis
        let success = self.collectionRef.performMitosis(creatureID: creatureID, epCost: epCost)
        
        if !success {
            panic("No se pudo realizar mitosis. Verifica que la criatura esté viva, tenga suficientes EP, y que no se haya alcanzado el límite de criaturas")
        }
        
        log("¡Mitosis exitosa! Se ha creado una nueva criatura modular")
    }
}
`;

// Interfaz para los datos de las criaturas que vienen del script
interface CreatureDataFromScript {
  id: string; 
  name: string;
  description: string;
  thumbnail: string;
  estaViva: boolean;
  edadDiasCompletos: string; 
  lifespanTotalSimulatedDays: string; 
  puntosEvolucion: string; 
  initialSeed: string; // Changed to string as UInt64 comes as string
  traitValues: { [key: string]: string | null };
  registeredModules: string[];
}

// Interfaz para los datos de las criaturas transformados para el frontend
interface CreatureUIDataFrontend {
  id: number; 
  name: string;
  description: string;
  thumbnail: string;
  estaViva: boolean;
  edadDiasCompletos: string; 
  lifespanTotalSimulatedDays: string; 
  puntosEvolucion: string; 
  initialSeed: number; // Kept as number, will parse from string
  traitValues: { [key: string]: string | null };
  registeredModules: string[];
  seedChangeCount: string; 
}

export default function EnvironmentPage() {
  const [user, setUser] = useState<{ addr?: string; loggedIn?: boolean }>({});
  const [creatures, setCreatures] = useState<CreatureUIDataFrontend[]>([]);
  const [isLoadingCreatures, setIsLoadingCreatures] = useState(false);
  const [isLoadingMint, setIsLoadingMint] = useState(false);
  const [isProcessingEvolution, setIsProcessingEvolution] = useState(false);
  const [processingMitosisForId, setProcessingMitosisForId] = useState<number | null>(null);
  const [openRouterService, setOpenRouterService] = useState<OpenRouterService | null>(null);
  const [customNotifications, setCustomNotifications] = useState<Array<{
    id: string;
    title: string;
    description: string;
    status: 'info' | 'success' | 'warning' | 'error' | 'loading';
    duration: number;
    timestamp: number;
  }>>([]);
  
  // Evolution Chronicles Modal State
  const [evolutionChronicles, setEvolutionChronicles] = useState<Array<{
    creatureIndex: number;
    creatureName: string;
    narrative: string;
    changes: string;
  }>>([]);
  const [showChroniclesModal, setShowChroniclesModal] = useState(false);
  const [currentChronicleIndex, setCurrentChronicleIndex] = useState(0);
  
  // Birth Chronicle Modal State
  const [birthChronicle, setBirthChronicle] = useState<{
    creatureName: string;
    narrative: string;
    creatureData: string;
  } | null>(null);
  const [showBirthModal, setShowBirthModal] = useState(false);
  const toast = useToast();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(300);
  const [canvasHeight, setCanvasHeight] = useState(300);

  // Debug FCL configuration
  console.log("🔧 FCL Configuration:", {
    accessNode: config().get("accessNode.api"),
    evolvingCreatureNFT: config().get("0xEvolvingCreatureNFT"),
    network: process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet"
  });

  // Initialize OpenRouter service for epic evolution narratives
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    console.log('🔑 OpenRouter API Key available:', !!apiKey);
    if (apiKey && apiKey.trim()) {
      try {
        const service = new OpenRouterService(apiKey);
        setOpenRouterService(service);
        console.log('🤖 AI Service initialized for evolution narratives');
        
        // Show confirmation notification with guaranteed visibility
        setTimeout(() => {
          showEpicNotification(
            '🤖 AI Chronicle Keeper Ready',
            'Epic narratives will be generated for births and evolutions!',
            'success',
            4000
          );
        }, 1000);
      } catch (error) {
        console.error('❌ Failed to initialize AI service:', error);
      }
    } else {
      console.log('❌ No OpenRouter API key available - narratives will use fallback text');
    }
  }, []);

  // Modal state
  const { isOpen: isMitosisModalOpen, onOpen: onOpenMitosisModal, onClose: onCloseMitosisModal } = useDisclosure();
  const [mitosisTargetCreature, setMitosisTargetCreature] = useState<CreatureUIDataFrontend | null>(null);
  const [mitosisEpInput, setMitosisEpInput] = useState(MINIMUM_EP_FOR_MITOSIS.toFixed(1)); // Use constant for default

  const bgColor = useColorModeValue('neutral.50', 'neutral.800');
  const cardBgColor = useColorModeValue('white', 'neutral.700');
  const textColor = useColorModeValue('neutral.800', 'neutral.100');

  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
  }, []);

  // Custom epic notification system that WILL be visible
  const showEpicNotification = (
    title: string, 
    description: string, 
    status: 'info' | 'success' | 'warning' | 'error' | 'loading' = 'info',
    duration: number = 0, // Default to 0 (manual close only)
    autoRemove: boolean = false // Explicit control over auto-removal
  ) => {
    // Generate unique ID with random component to avoid duplicates
    const id = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const notification = {
      id,
      title,
      description,
      status,
      duration,
      timestamp: Date.now()
    };
    
    setCustomNotifications(prev => [...prev, notification]);
    
    // Auto-remove only if explicitly requested
    if (autoRemove && duration > 0) {
      setTimeout(() => {
        setCustomNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
    
    return id;
  };

  // Update existing notification
  const updateEpicNotification = (id: string, updates: Partial<typeof customNotifications[0]>) => {
    setCustomNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, ...updates } : notification
      )
    );
    
    // If updating to a non-loading status, set auto-remove timer
    if (updates.status && updates.status !== 'loading' && updates.duration && updates.duration > 0) {
      setTimeout(() => {
        setCustomNotifications(prev => prev.filter(n => n.id !== id));
      }, updates.duration);
    }
  };

  // Remove notification manually
  const removeEpicNotification = (id: string) => {
    setCustomNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Interpret evolution changes mystically but informatively
  const interpretEvolutionChanges = (ageDelta: number, epDelta: number): string => {
    const changes: string[] = [];
    
    // Interpret age progression with actual numbers but mystical language
    if (ageDelta > 0.5) {
      changes.push(`matured ${ageDelta.toFixed(1)} cosmic cycles, gaining profound wisdom`);
    } else if (ageDelta > 0.1) {
      changes.push(`aged ${ageDelta.toFixed(1)} ethereal days, growing in experience`);
    } else {
      changes.push(`touched by ${ageDelta.toFixed(2)} whispers of time`);
    }
    
    // Interpret evolution points with actual numbers but mystical language
    if (epDelta > 5.0) {
      changes.push(`their anima essence surged by ${epDelta.toFixed(1)} powerful resonances`);
    } else if (epDelta > 2.0) {
      changes.push(`channeled ${epDelta.toFixed(1)} streams of evolutionary force`);
    } else if (epDelta > 0.5) {
      changes.push(`absorbed ${epDelta.toFixed(1)} currents of cosmic growth`);
    } else if (epDelta < 0) {
      changes.push(`released ${Math.abs(epDelta).toFixed(1)} energies back to the cosmos`);
    } else {
      changes.push(`maintained harmonious balance, gathering ${epDelta.toFixed(1)} essence`);
    }
    
    return changes.join(', ');
  };

  // Generate epic evolution narrative using LLM
  const generateEvolutionNarrative = async (
    creature: CreatureUIDataFrontend, 
    beforeState: any, 
    afterState: any
  ): Promise<string> => {
    if (!openRouterService) {
      const ageDelta = afterState.age - beforeState.age;
      const epDelta = afterState.evolutionPoints - beforeState.evolutionPoints;
      return `🌟 ${creature.name} aged ${ageDelta.toFixed(2)} days and gained ${epDelta.toFixed(1)} evolution points through the passage of time.`;
    }

    try {
      const ageDelta = afterState.age - beforeState.age;
      const epDelta = afterState.evolutionPoints - beforeState.evolutionPoints;
      
      // Interpret changes mystically instead of showing raw numbers
      const mysticalChanges = interpretEvolutionChanges(ageDelta, epDelta);
      const currentTraits = interpretCreatureTraits(creature);
      
      const prompt = `You are the Chronicle Keeper of Primordia, inscribing the sacred evolution tales. Write a mystical narrative describing how this creature transformed through cosmic energies.

CREATURE: ${creature.name}
TRANSFORMATION: ${mysticalChanges}
CURRENT ESSENCE: ${currentTraits}

WRITING RULES:
- Write EXACTLY 1-2 sentences in flowing narrative prose
- Use mystical, poetic language befitting cosmic lore
- ABSOLUTELY NO markdown formatting: no **bold**, no *italics*, no _underlines_, no # headers, no [links]
- NO numbered lists, bullet points, or special formatting
- NO technical terms or numbers - only magical/mystical language
- Include 1 relevant emoji naturally in the text
- Focus on transformation and cosmic forces
- Mention the creature's name naturally
- Write PLAIN TEXT ONLY - no special characters for formatting
- Keep it concise and immersive

Write as if inscribing sacred text in an ancient tome. Make it feel magical and brief.

Chronicle:`;

      const narrative = await openRouterService.chat(prompt);
      return narrative || `🌟 Through the swirling mists of time, ${creature.name} absorbed ${epDelta.toFixed(1)} essence of pure anima, their form reshaping across ${ageDelta.toFixed(2)} cycles of cosmic transformation.`;
    } catch (error) {
      console.error('Failed to generate evolution narrative:', error);
      const ageDelta = afterState.age - beforeState.age;
      const epDelta = afterState.evolutionPoints - beforeState.evolutionPoints;
      return `✨ Within the ethereal realm of Primordia, ${creature.name} channeled ${epDelta.toFixed(1)} streams of anima essence, their being transformed through ${ageDelta.toFixed(2)} cycles of celestial evolution.`;
    }
  };

  // Interpret creature traits into mystical but informative descriptions
  const interpretCreatureTraits = (creature: CreatureUIDataFrontend): string => {
    const descriptions: string[] = [];
    
    // Interpret visual traits with specific values
    if (creature.traitValues?.visual) {
      const visual = creature.traitValues.visual;
      if (visual.includes('Size:')) {
        const sizeMatch = visual.match(/Size:([0-9.]+)/);
        if (sizeMatch) {
          const size = parseFloat(sizeMatch[1]);
          if (size < 1.0) descriptions.push(`diminutive form (${size.toFixed(1)} essence)`);
          else if (size < 1.5) descriptions.push(`modest stature (${size.toFixed(1)} essence)`);
          else if (size < 2.0) descriptions.push(`balanced proportions (${size.toFixed(1)} essence)`);
          else if (size < 2.5) descriptions.push(`impressive magnitude (${size.toFixed(1)} essence)`);
          else descriptions.push(`colossal presence (${size.toFixed(1)} essence)`);
        }
      }
      
      if (visual.includes('Form:')) {
        const formMatch = visual.match(/Form:([0-9.]+)/);
        if (formMatch) {
          const form = parseFloat(formMatch[1]);
          if (form < 1.5) descriptions.push(`agile spirit (${form.toFixed(1)} form essence)`);
          else if (form < 2.5) descriptions.push(`guardian strength (${form.toFixed(1)} form essence)`);
          else descriptions.push(`warrior ferocity (${form.toFixed(1)} form essence)`);
        }
      }
      
      // Add color interpretation
      if (visual.includes('R:') && visual.includes('G:') && visual.includes('B:')) {
        const rMatch = visual.match(/R:([0-9.]+)/);
        const gMatch = visual.match(/G:([0-9.]+)/);
        const bMatch = visual.match(/B:([0-9.]+)/);
        if (rMatch && gMatch && bMatch) {
          const r = parseFloat(rMatch[1]);
          const g = parseFloat(gMatch[1]);
          const b = parseFloat(bMatch[1]);
          const dominant = Math.max(r, g, b);
          if (r === dominant && r > 0.6) descriptions.push(`crimson aura radiating power`);
          else if (g === dominant && g > 0.6) descriptions.push(`emerald essence of nature`);
          else if (b === dominant && b > 0.6) descriptions.push(`sapphire depths of wisdom`);
          else descriptions.push(`balanced chromatic harmonies`);
        }
      }
    }
    
    // Interpret personality traits with values
    if (creature.traitValues?.personality) {
      const personality = creature.traitValues.personality;
      if (personality.includes('TEMP:')) {
        const tempMatch = personality.match(/TEMP:([0-9.]+)/);
        if (tempMatch) {
          const temp = parseFloat(tempMatch[1]);
          if (temp < 0.3) descriptions.push(`introspective nature (${(temp*100).toFixed(0)}% temperament)`);
          else if (temp > 0.7) descriptions.push(`charismatic presence (${(temp*100).toFixed(0)}% temperament)`);
          else descriptions.push(`balanced social spirit (${(temp*100).toFixed(0)}% temperament)`);
        }
      }
      
      if (personality.includes('CUR:')) {
        const curMatch = personality.match(/CUR:([0-9.]+)/);
        if (curMatch) {
          const curiosity = parseFloat(curMatch[1]);
          if (curiosity > 0.7) descriptions.push(`insatiable curiosity (${(curiosity*100).toFixed(0)}% explorer spirit)`);
          else if (curiosity < 0.3) descriptions.push(`contemplative wisdom (${(curiosity*100).toFixed(0)}% exploration)`);
          else descriptions.push(`moderate inquisitiveness (${(curiosity*100).toFixed(0)}% curiosity)`);
        }
      }
      
      if (personality.includes('INT:')) {
        const intMatch = personality.match(/INT:([0-9.]+)/);
        if (intMatch) {
          const intelligence = parseFloat(intMatch[1]);
          if (intelligence > 0.8) descriptions.push(`brilliant intellect (${(intelligence*100).toFixed(0)}% cognitive power)`);
          else if (intelligence > 0.6) descriptions.push(`sharp mind (${(intelligence*100).toFixed(0)}% intelligence)`);
          else descriptions.push(`developing intellect (${(intelligence*100).toFixed(0)}% mental capacity)`);
        }
      }
    }
    
    return descriptions.length > 0 ? descriptions.join(', ') : 'mysterious cosmic energies';
  };

  // Generate epic birth narrative for new creatures using LLM
  const generateBirthNarrative = async (newCreature: CreatureUIDataFrontend): Promise<string> => {
    if (!openRouterService) {
      return `🌟 A new creature has emerged from the primordial energies of Primordia! Welcome ${newCreature.name} to the cosmic realm.`;
    }

    try {
      // Interpret traits mystically instead of showing raw numbers
      const mysticalTraits = interpretCreatureTraits(newCreature);
      const traitCount = Object.keys(newCreature.traitValues || {}).length;
      const modulesList = newCreature.registeredModules.join(', ') || 'primordial essence';
      
      const prompt = `You are the Chronicle Keeper of Primordia, inscribing the sacred birth tales. Write a mystical narrative describing the emergence of a new cosmic entity from the primordial energies.

NEWBORN: ${newCreature.name}
COSMIC SIGNATURE: ${newCreature.initialSeed}
DESTINY: ${newCreature.lifespanTotalSimulatedDays} days of existence
ESSENCE STREAMS: ${traitCount} streams of power (${modulesList})
MYSTICAL TRAITS: ${mysticalTraits}

WRITING RULES:
- Write EXACTLY 1-2 sentences in flowing narrative prose
- Use mystical, poetic language of cosmic creation
- ABSOLUTELY NO markdown formatting: no **bold**, no *italics*, no _underlines_, no # headers, no [links]
- NO numbered lists, bullet points, or special formatting
- NO technical terms or numbers - only magical/mystical language
- Include 1 relevant emoji naturally in the text
- Focus on emergence, cosmic birth, and mystical traits
- Mention the creature's name naturally
- Describe the birth as a cosmic event of significance
- Write PLAIN TEXT ONLY - no special characters for formatting
- Keep it concise and immersive

Write as if inscribing the moment of creation in sacred chronicles. Make it feel like witnessing the birth of a legend.

Birth Chronicle:`;

      const narrative = await openRouterService.chat(prompt);
      return narrative || `🌟 From the swirling vortex of creation, ${newCreature.name} manifests into existence with ${traitCount} streams of cosmic power flowing through their being, bearing the eternal signature ${newCreature.initialSeed} and destined to walk the realms for ${newCreature.lifespanTotalSimulatedDays} cycles of primordial life.`;
    } catch (error) {
      console.error('Failed to generate birth narrative:', error);
      const traitCount = Object.keys(newCreature.traitValues || {}).length;
      return `✨ Through the ancient rites of creation, ${newCreature.name} awakens in the cosmic realm with ${traitCount} streams of essence flowing through their being, their soul marked by the eternal signature ${newCreature.initialSeed}, ready to embrace their destined path through the mystical realms of Primordia.`;
    }
  };

  useEffect(() => {
    function handleResize() {
      if (canvasContainerRef.current) {
        const containerWidth = canvasContainerRef.current.offsetWidth;
        // Allow canvas to be larger, e.g., up to 600px or 90% of container width
        const newWidth = Math.min(600, containerWidth * 0.9);
        setCanvasWidth(newWidth);
        // Make canvas height a bit more substantial, e.g., 75% of its width or a fixed larger value
        setCanvasHeight(Math.max(250, newWidth * 0.75)); 
      }
    }
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchCreatures = async () => {
    if (!user?.addr) {
        return;
    }
    setIsLoadingCreatures(true);
    try {
      const result = await fcl.query({
        cadence: GET_ACTIVE_CREATURES_SCRIPT,
        args: (arg, t) => [arg(user.addr as string, t.Address)]
      });
      
      console.log("Creatures from script:", result);

      const transformedCreatures = (result as CreatureDataFromScript[]).map(creature => ({
        ...creature,
        id: parseIntSafe(creature.id, 0),
        initialSeed: parseIntSafe(creature.initialSeed, Math.floor(Math.random() * 99999) + 1), // Parse string to number, fallback to random (1 to 100000)
        traitValues: creature.traitValues || {},
        registeredModules: creature.registeredModules || [],
        seedChangeCount: "0", // Assign default value directly
      }));
      
      setCreatures(transformedCreatures);

    } catch (error: any) {
      console.error("Error fetching creatures:", error);
      toast({
        title: 'Error Loading Creatures',
        description: error.message || 'An unknown error occurred.',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsLoadingCreatures(false);
    }
  };

  const handleMintCreature = async () => {
    if (!user?.addr) {
              showEpicNotification(
          "🌟 Cosmic Connection Required", 
          "The Genesis Shapers await your presence. Connect your ethereal wallet to birth new life.", 
          "warning",
          8000,
          true // Auto-remove warning
        );
      return;
    }
    setIsLoadingMint(true);
    let notificationId: string = ""; 

    try {
      notificationId = showEpicNotification(
        '🌟 Invoking the Rites of Creation',
        'The cosmic forge awakens... channeling primordial energies for manifestation.',
        'loading',
        0,
        false
      );

      const transactionId = await fcl.mutate({
        cadence: MINT_NFT_WITH_PAYMENT_TRANSACTION,
        args: (arg, t) => [arg(user.addr as string, t.Address)], 
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 9999
      });

      updateEpicNotification(notificationId, {
        title: '⚡ Cosmic Energies Converging',
        description: `The ritual echoes through the ethereal realm... awaiting the blessing of the cosmic guardians.`,
      });

      await fcl.tx(transactionId).onceSealed();

      // Show immediate success
      updateEpicNotification(notificationId, {
        title: '🌟 A New Soul Awakens!',
        description: 'From the swirling vortex of creation, a cosmic entity emerges... the Chronicle Keeper prepares their sacred scroll.',
        status: 'success',
        duration: 0, // Manual close only
      });

      // Refresh creatures to get the new creature's data
      await fetchCreatures();
      
      // Find the newly minted creature (it should be the latest one)
      try {
        const updatedCreatures = await fcl.query({
          cadence: GET_ACTIVE_CREATURES_SCRIPT,
          args: (arg, t) => [arg(user.addr as string, t.Address)]
        });
        
        if (updatedCreatures && updatedCreatures.length > 0) {
          // Get the most recent creature (highest ID)
          const newestCreature = updatedCreatures.reduce((latest: any, current: any) => {
            return parseInt(current.id) > parseInt(latest.id) ? current : latest;
          });
          
          if (newestCreature) {
            // Transform to frontend format
            const newCreature: CreatureUIDataFrontend = {
              ...newestCreature,
              id: parseIntSafe(newestCreature.id, 0),
              initialSeed: parseIntSafe(newestCreature.initialSeed, Math.floor(Math.random() * 99999) + 1),
              traitValues: newestCreature.traitValues || {},
              registeredModules: newestCreature.registeredModules || [],
              seedChangeCount: "0",
            };

            // Generate epic birth narrative and show modal
            console.log("🎭 Generating epic birth narrative...");
            
            // Close the creation notification and show modal preparation
            updateEpicNotification(notificationId, {
              title: '📜 Chronicle Keeper Inscribing...',
              description: 'The sacred birth scroll is being prepared. The modal will appear shortly.',
              status: 'info',
              duration: 3000, // Auto-remove
            });
            
            // Prepare creature data for display
            const traitsCount = Object.keys(newCreature.traitValues || {}).length;
            const modulesText = newCreature.registeredModules.join(', ');
            const creatureDataText = `Born with ${traitsCount} cosmic essence streams: ${modulesText}. Destiny spans ${newCreature.lifespanTotalSimulatedDays} days. Cosmic signature: ${newCreature.initialSeed}`;
            
            // Set initial birth chronicle with placeholder
            setBirthChronicle({
              creatureName: newCreature.name,
              narrative: "The Chronicle Keeper inscribes the sacred birth scroll...",
              creatureData: creatureDataText
            });
            
            // Show birth modal immediately
            setTimeout(() => {
              setShowBirthModal(true);
            }, 2000);
            
            // Generate AI narrative asynchronously and update modal
            generateBirthNarrative(newCreature).then(birthNarrative => {
              console.log("📜 Generated birth narrative:", birthNarrative);
              setBirthChronicle({
                creatureName: newCreature.name,
                narrative: birthNarrative,
                creatureData: creatureDataText
              });
            }).catch(error => {
              console.error("Failed to generate birth narrative:", error);
              // Show fallback birth narrative
              setBirthChronicle({
                creatureName: newCreature.name,
                narrative: `From the swirling vortex of creation, ${newCreature.name} awakens in the cosmic realm, their soul blessed with the eternal energies of Primordia. Thus begins their destined journey through the mystical realms.`,
                creatureData: creatureDataText
              });
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch new creature details:", error);
      } 

    } catch (error: any) {
      console.error("Error minting creature:", error);
      if (notificationId) { 
        updateEpicNotification(notificationId, {
          title: '⚡ Cosmic Disturbance',
          description: 'The celestial energies have been disrupted. The ritual must be attempted again when the cosmic winds are favorable.',
          status: 'error',
          duration: 9000,
        });
      } else {
        showEpicNotification(
          '⚡ Cosmic Disturbance',
          'The celestial energies have been disrupted. The ritual must be attempted again when the cosmic winds are favorable.',
          'error',
          9000
        );
      }
    } finally {
      setIsLoadingMint(false);
    }
  };

  const handleProcessEvolutionAllCreatures = async () => {
    try {
      console.log("🔄 Process Evolution called");
      console.log("📋 User:", user);
      console.log("🐾 Creatures:", creatures);
      
    if (!user?.addr) {
        console.log("❌ User not connected");
      toast({ title: "User Not Connected", description: "Please connect your wallet.", status: "warning" });
      return;
    }
    if (creatures.length === 0) {
        console.log("❌ No creatures to evolve");
      toast({ title: "No Creatures", description: "There are no active creatures to evolve.", status: "info" });
      return;
    }

      console.log("✅ Validation passed, setting processing state...");
    setIsProcessingEvolution(true);
      
      // Filter alive creatures first
      const aliveCreatures = creatures.filter(c => c.estaViva);
      
      console.log("✅ Showing initial notification...");
      showEpicNotification(
        '🧬 Initiating Primordial Evolution Protocol',
        `Preparing to evolve ${aliveCreatures.length} creatures through the cosmic energies of Primordia. Each creature will require wallet approval to process their evolution.`,
        'info',
        8000,
        true // Auto-remove this intro message
      );

    let successCount = 0;
    let errorCount = 0;

      console.log("✅ Starting creature loop for ALL creatures...");
      
      if (aliveCreatures.length === 0) {
        console.log("❌ No alive creatures found");
        toast({ 
          title: "No Alive Creatures", 
          description: "No alive creatures to evolve.", 
          status: "info",
          position: 'top-right',
        });
        return;
      }

      console.log(`✅ Processing ${aliveCreatures.length} alive creatures`);

      // Clear previous chronicles
      setEvolutionChronicles([]);
      const newChronicles: Array<{
        creatureIndex: number;
        creatureName: string;
        narrative: string;
        changes: string;
      }> = [];

      // Process each creature with enhanced UI feedback
      for (let i = 0; i < aliveCreatures.length; i++) {
        const creature = aliveCreatures[i];
        console.log(`🐾 Processing creature ${i + 1}/${aliveCreatures.length}: #${creature.id}`);
        
        // Capture before state for narrative
        const beforeState = {
          age: parseFloat(creature.edadDiasCompletos),
          evolutionPoints: parseFloat(creature.puntosEvolucion),
          name: creature.name
        };
        
        let toastIdEvo: string = "";
        try {
          console.log("✅ Creating enhanced notification for creature...");
          toastIdEvo = showEpicNotification(
            `🧬 Evolution ${i + 1}/${aliveCreatures.length}: ${creature.name}`,
            `Processing creature #${creature.id}... Wallet approval needed.`,
            'loading',
            0,  // No duration for loading
            false // No auto-remove for loading notifications
          );

          console.log(`🚀 About to send FCL transaction for creature ${creature.id}`);

        const transactionId = await fcl.mutate({
          cadence: PROCESS_EVOLUTION_TRANSACTION,
          args: (arg, t) => [
            arg(creature.id.toString(), t.UInt64),
            arg("2000.0", t.UFix64)
          ],
          proposer: fcl.authz,
          payer: fcl.authz,
          authorizations: [fcl.authz],
          limit: 9999 
        });

          console.log(`✅ Transaction sent with ID: ${transactionId}`);

          updateEpicNotification(toastIdEvo, {
            title: `⏳ Evolution ${i + 1}/${aliveCreatures.length}: ${creature.name}`,
            description: `Transaction sent (${transactionId.substring(0,8)}...). Waiting for blockchain confirmation...`,
        });

        await fcl.tx(transactionId).onceSealed();

          // Show simple completion toast (auto-remove)
          updateEpicNotification(toastIdEvo, {
            title: `✅ ${creature.name} Evolved!`,
            description: `Chronicle ${i + 1}/${aliveCreatures.length} completed. Generating epic narrative...`,
          status: 'success',
            duration: 4000, // Auto-remove
          });

          // Refresh creatures to get updated state
          await fetchCreatures();
          
          // Find updated creature state
          const updatedCreatures = await fcl.query({
            cadence: GET_ACTIVE_CREATURES_SCRIPT,
            args: (arg, t) => [arg(user.addr as string, t.Address)]
          });
          
          const updatedCreature = updatedCreatures.find((c: any) => c.id === creature.id.toString());
          const afterState = updatedCreature ? {
            age: parseFloat(updatedCreature.edadDiasCompletos),
            evolutionPoints: parseFloat(updatedCreature.puntosEvolucion),
            name: updatedCreature.name
          } : null;

          // Generate epic evolution narrative and save for modal (non-blocking)
          if (afterState) {
            console.log("🎭 Generating epic evolution narrative...");
            console.log("📊 Before state:", beforeState);
            console.log("📊 After state:", afterState);
            
            const ageDelta = afterState.age - beforeState.age;
            const epDelta = afterState.evolutionPoints - beforeState.evolutionPoints;
            const mysticalChanges = interpretEvolutionChanges(ageDelta, epDelta);
            
            // Save chronicle IMMEDIATELY (don't wait for AI generation)
            newChronicles.push({
              creatureIndex: i + 1,
              creatureName: creature.name,
              narrative: `Chronicle for ${creature.name} is being inscribed by the cosmic scribes...`, // Placeholder
              changes: mysticalChanges
            });
            
            // Generate AI narrative asynchronously and update later
            generateEvolutionNarrative(creature, beforeState, afterState).then(evolutionNarrative => {
              console.log("📜 Generated narrative:", evolutionNarrative);
              
              // Update the chronicle with the real narrative
              const chronicleIndex = newChronicles.findIndex(c => c.creatureName === creature.name && c.creatureIndex === i + 1);
              if (chronicleIndex >= 0) {
                newChronicles[chronicleIndex].narrative = evolutionNarrative;
                setEvolutionChronicles([...newChronicles]); // Update state
              }
              
              console.log("✅ Chronicle updated with AI narrative");
            }).catch(error => {
              console.error("❌ Failed to generate narrative:", error);
              
              // Update with fallback narrative
              const chronicleIndex = newChronicles.findIndex(c => c.creatureName === creature.name && c.creatureIndex === i + 1);
              if (chronicleIndex >= 0) {
                newChronicles[chronicleIndex].narrative = `The cosmic winds whisper of ${creature.name}'s transformation through the ethereal realms of Primordia.`;
                setEvolutionChronicles([...newChronicles]); // Update state
              }
            });
          } else {
            console.log("❌ No afterState available for narrative generation");
            
            // Still save a chronicle even without afterState
            newChronicles.push({
              creatureIndex: i + 1,
              creatureName: creature.name,
              narrative: `${creature.name} underwent a mystical transformation, though the details remain shrouded in cosmic mystery.`,
              changes: "unknown cosmic forces at work"
            });
          }
        successCount++;
          
          // Small delay between creatures for better UX
          if (i < aliveCreatures.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
      } catch (error: any) {
        errorCount++;
          console.error(`❌ Error processing evolution for creature #${creature.id}:`, error);
        if (toastIdEvo) {
            updateEpicNotification(toastIdEvo, {
              title: `❌ Evolution Failed: ${creature.name}`,
            description: error?.message || 'An unknown error occurred.',
            status: 'error',
              duration: 8000, // Auto-remove errors too
          });
        }
      }
    }

      console.log("✅ Evolution process completed");
      
      // Set chronicles and show modal if we have any narratives
      setEvolutionChronicles(newChronicles);
      
      // Epic completion summary (auto-remove)
      let completionTitle = "🌟 Evolution Complete!";
      let completionDescription = `${successCount} creature(s) evolved. ${errorCount} error(s).`;
      
      if (successCount > 0 && errorCount === 0) {
        completionTitle = "✨ Primordial Evolution Mastered!";
        completionDescription = `All ${successCount} creatures have successfully evolved! Click to read their chronicles.`;
      } else if (successCount > 0 && errorCount > 0) {
        completionTitle = "⚡ Partial Evolution Success";
        completionDescription = `${successCount} creatures evolved successfully, but ${errorCount} faced cosmic turbulence.`;
      } else if (errorCount > 0) {
        completionTitle = "🌪️ Evolution Disrupted";
        completionDescription = `Evolution was disrupted by cosmic interference. ${errorCount} creatures could not evolve.`;
      }
      
      const completionStatus = errorCount > 0 ? (successCount > 0 ? "warning" : "error") : "success";
      showEpicNotification(
        completionTitle, 
        completionDescription,
        completionStatus,
        8000, // Auto-remove
        true
      );

      // Show chronicles modal if we have any successful evolutions
      console.log("🔍 Chronicles to show:", newChronicles.length);
      console.log("📖 Chronicles data:", newChronicles);
      
      if (newChronicles.length > 0) {
        // Debug notification
        showEpicNotification(
          '📜 Chronicles Ready!',
          `${newChronicles.length} epic chronicles generated. Opening modal...`,
          'info',
          3000,
          true
        );
        
        setTimeout(() => {
          console.log("🚀 Opening chronicles modal...");
          setCurrentChronicleIndex(0);
          setShowChroniclesModal(true);
          console.log("✅ Modal state set to true");
        }, 1500); // Small delay to let completion toast show first
      } else {
        // Debug if no chronicles
        showEpicNotification(
          '⚠️ No Chronicles Generated',
          'No evolution narratives were created.',
          'warning',
          5000,
          true
        );
      }

    if (successCount > 0 || errorCount > 0) { 
      fetchCreatures(); 
    }
      
    } catch (error: any) {
      console.error("❌ CRITICAL ERROR in handleProcessEvolutionAllCreatures:", error);
      console.error("❌ Error stack:", error.stack);
      toast({
        title: "Critical Error",
        description: error?.message || 'A critical error occurred.',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      console.log("✅ Setting processing state to false");
    setIsProcessingEvolution(false);
    }
  };

  const handlePerformMitosis = async () => {
    if (!user?.addr || !mitosisTargetCreature) {
      toast({ title: "Error", description: "User not connected or creature not selected.", status: "warning" });
      if (mitosisTargetCreature) onCloseMitosisModal();
      return;
    }

    const creatureToMitose = mitosisTargetCreature;
    const epCost = parseFloatSafe(mitosisEpInput, 0.0);

    if (epCost < MINIMUM_EP_FOR_MITOSIS) {
        toast({ title: "Invalid EP Cost", description: `The minimum EP cost for mitosis is ${MINIMUM_EP_FOR_MITOSIS.toFixed(1)}.`, status: "warning" });
        return;
    }
    if (parseFloatSafe(creatureToMitose.puntosEvolucion, 0.0) < epCost) {
        toast({ title: "Insufficient EP", description: `The creature only has ${parseFloatSafe(creatureToMitose.puntosEvolucion, 0.0).toFixed(1)} EP.`, status: "warning" });
        return;
    }
    if (creatures.filter(c => c.estaViva).length >= 5) { 
        toast({ title: "Active Creature Limit Reached", description: "Cannot perform mitosis, the maximum limit of active creatures (5) has been reached.", status: "warning" });
        return;
    }

    setProcessingMitosisForId(creatureToMitose.id);
    let toastIdMitosis: string | number = "";

    try {
      toastIdMitosis = toast({
        title: `Initiating Mitosis for Creature #${creatureToMitose.id}`,
        description: 'Sending transaction...', 
        status: 'loading',
        duration: null,
        isClosable: false,
      });

      const transactionId = await fcl.mutate({
        cadence: PERFORM_MITOSIS_TRANSACTION,
        args: (arg, t) => [
          arg(creatureToMitose.id.toString(), t.UInt64),
          arg(epCost.toFixed(1), t.UFix64)
        ],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 9999 
      });

      toast.update(toastIdMitosis, {
        description: `Transaction sent (${transactionId.substring(0,8)}...). Waiting for confirmation...`,
      });

      await fcl.tx(transactionId).onceSealed();

      toast.update(toastIdMitosis, {
        title: `Mitosis Successful for #${creatureToMitose.id}!`,
        description: `A new creature has been born from #${creatureToMitose.id}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchCreatures(); 
      onCloseMitosisModal(); // Close modal on success
    } catch (error: any) {
      console.error(`Error performing mitosis for creature #${creatureToMitose.id}:`, error);
      if (toastIdMitosis) {
        toast.update(toastIdMitosis, {
          title: `Error in Mitosis for #${creatureToMitose.id}`,
          description: error?.message || 'An unknown error occurred.',
          status: 'error',
          duration: 9000,
          isClosable: true,
        });
      } else {
        toast({
          title: `Error in Mitosis for #${creatureToMitose.id}`,
          description: error?.message || 'An unknown error occurred.',
          status: 'error',
          duration: 9000,
          isClosable: true,
        });
      }
    } finally {
      setProcessingMitosisForId(null);
    }
  };

  useEffect(() => {
    if (user.addr) {
      fetchCreatures();
      
      // Show welcome notification to confirm the system works
      showEpicNotification(
        '🌟 Primordia Environment Loaded',
        'Epic notification system active! Notifications will appear here during evolution.',
        'info',
        5000
      );
    }
  }, [user.addr]);

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} color={textColor}>
      <Header />
      
      {/* Evolution Chronicles Modal - OUTSIDE Container for absolute positioning */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        zIndex: 99999999999,
        pointerEvents: showChroniclesModal ? 'auto' : 'none',
        display: showChroniclesModal ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      }}>
        {/* Manual Modal Implementation */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '4px solid #3182ce',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          zIndex: 99999999999
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: '#3182ce',
            color: 'white',
            padding: '20px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <h2 style={{ margin: 0, fontSize: '24px' }}>📜 Chronicles of Primordia</h2>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
              {evolutionChronicles.length} chronicles ready
            </p>
            <button 
              onClick={() => setShowChroniclesModal(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
          
                     {/* Body */}
           <div style={{ padding: '20px', minHeight: '300px' }}>
             {evolutionChronicles.length > 0 ? (
              <div>
                {evolutionChronicles[currentChronicleIndex] ? (
                  <div>
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '12px', 
                      backgroundColor: '#e9d5ff', 
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      <h3 style={{ margin: 0, fontSize: '20px', color: '#7c3aed' }}>
                        {evolutionChronicles[currentChronicleIndex].creatureName}
                      </h3>
                      <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                        Evolution #{evolutionChronicles[currentChronicleIndex].creatureIndex}
                      </p>
                    </div>
                    
                    <div style={{ 
                      backgroundColor: '#dbeafe', 
                      padding: '16px', 
                      borderRadius: '8px',
                      border: '2px solid blue',
                      marginBottom: '16px'
                    }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '16px', 
                        lineHeight: '1.8',
                        fontStyle: 'italic',
                        color: '#1e40af'
                      }}>
                        {evolutionChronicles[currentChronicleIndex].narrative}
                      </p>
                    </div>
                    
                    <div style={{ 
                      backgroundColor: '#faf5ff', 
                      padding: '12px', 
                      borderRadius: '8px',
                      border: '2px solid purple'
                    }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '14px', 
                        color: '#7c3aed',
                        fontWeight: 'bold'
                      }}>
                        🌟 {evolutionChronicles[currentChronicleIndex].changes}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'red', textAlign: 'center' }}>
                    No chronicle at index {currentChronicleIndex}
                  </p>
                )}
              </div>
            ) : (
              <p style={{ color: 'red', textAlign: 'center', padding: '16px' }}>
                No chronicles available!
              </p>
            )}
          </div>
          
          {/* Footer */}
          <div style={{ 
            backgroundColor: '#f9fafb', 
            padding: '16px', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                disabled={currentChronicleIndex === 0}
                onClick={() => setCurrentChronicleIndex(prev => Math.max(0, prev - 1))}
                style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #3b82f6',
                  backgroundColor: currentChronicleIndex === 0 ? '#e5e7eb' : 'white',
                  color: currentChronicleIndex === 0 ? '#9ca3af' : '#3b82f6',
                  borderRadius: '4px',
                  cursor: currentChronicleIndex === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Previous
              </button>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                {currentChronicleIndex + 1} of {evolutionChronicles.length}
              </span>
              <button
                disabled={currentChronicleIndex >= evolutionChronicles.length - 1}
                onClick={() => setCurrentChronicleIndex(prev => Math.min(evolutionChronicles.length - 1, prev + 1))}
                style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #3b82f6',
                  backgroundColor: currentChronicleIndex >= evolutionChronicles.length - 1 ? '#e5e7eb' : 'white',
                  color: currentChronicleIndex >= evolutionChronicles.length - 1 ? '#9ca3af' : '#3b82f6',
                  borderRadius: '4px',
                  cursor: currentChronicleIndex >= evolutionChronicles.length - 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Next →
              </button>
            </div>
            
            <button 
              onClick={() => setShowChroniclesModal(false)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close Chronicles
            </button>
          </div>
        </div>
      </div>
      
      {/* Birth Chronicle Modal - OUTSIDE Container for absolute positioning */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        zIndex: 99999999999,
        pointerEvents: showBirthModal ? 'auto' : 'none',
        display: showBirthModal ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      }}>
        {/* Manual Birth Modal Implementation */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '4px solid #10b981',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          zIndex: 99999999999
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '20px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <h2 style={{ margin: 0, fontSize: '24px' }}>🌟 Birth Chronicle of Primordia</h2>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
              A new cosmic entity emerges
            </p>
            <button 
              onClick={() => setShowBirthModal(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
          
          {/* Body */}
          <div style={{ padding: '20px', minHeight: '300px' }}>
            {birthChronicle ? (
              <div>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '12px', 
                  backgroundColor: '#d1fae5', 
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#059669' }}>
                    {birthChronicle.creatureName}
                  </h3>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                    Newly Born Cosmic Entity
                  </p>
                </div>
                
                <div style={{ 
                  backgroundColor: '#ecfdf5', 
                  padding: '16px', 
                  borderRadius: '8px',
                  border: '2px solid #10b981',
                  marginBottom: '16px'
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '16px', 
                    lineHeight: '1.8',
                    fontStyle: 'italic',
                    color: '#047857'
                  }}>
                    {birthChronicle.narrative}
                  </p>
                </div>
                
                <div style={{ 
                  backgroundColor: '#f0fdf4', 
                  padding: '12px', 
                  borderRadius: '8px',
                  border: '2px solid #22c55e'
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px', 
                    color: '#15803d',
                    fontWeight: 'bold'
                  }}>
                    ✨ {birthChronicle.creatureData}
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ color: 'red', textAlign: 'center', padding: '16px' }}>
                No birth chronicle available!
              </p>
            )}
          </div>
          
          {/* Footer */}
          <div style={{ 
            backgroundColor: '#f9fafb', 
            padding: '16px', 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button 
              onClick={() => setShowBirthModal(false)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close Birth Chronicle
            </button>
          </div>
        </div>
      </div>
      
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <MotionVStack
            variants={sectionVariants}
            custom={1}
            spacing={4}
            textAlign="center"
          >
            <MotionHeading
              as="h1"
              fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
              fontWeight="extrabold"
              color={headingColor}
            >
              Primordia Environment
            </MotionHeading>
            <MotionText
              fontSize={{ base: "lg", md: "xl" }}
              color={loreTextColor}
              maxW="2xl"
            >
              Witness your creatures evolve in their digital ecosystem
            </MotionText>
          </MotionVStack>

          {/* Account Connection Status */}
          <MotionBox variants={sectionVariants} custom={2}>
            {!user.loggedIn ? (
              <Flex justify="center">
                <Button onClick={fcl.authenticate} colorScheme="blue" size="lg">
                  Connect Wallet to View Environment
                </Button>
              </Flex>
            ) : (
              <VStack spacing={6}>
                {/* Action Buttons */}
                <Flex justify="center" wrap="wrap" gap={4}>
                  <Button 
                    onClick={handleMintCreature} 
                    colorScheme="green" 
                    isLoading={isLoadingMint}
                    loadingText="🌟 Creating..."
                    isDisabled={creatures.filter(c => c.estaViva).length >= 5}
                  >
                    🌟 Birth New Creature (0.1 FLOW)
                  </Button>
                  <Button 
                    onClick={handleProcessEvolutionAllCreatures} 
                    colorScheme="purple"
                    isLoading={isProcessingEvolution}
                    loadingText="🧬 Evolving..."
                  >
                    🧬 Evolve All Creatures
                  </Button>
                  <Button 
                    onClick={() => {
                      const availableCreatures = creatures.filter(c => c.estaViva && parseFloat(c.puntosEvolucion) >= MINIMUM_EP_FOR_MITOSIS);
                      if (availableCreatures.length > 0) {
                        setMitosisTargetCreature(availableCreatures[0]);
                        onOpenMitosisModal();
                      }
                    }} 
                    colorScheme="cyan"
                    isLoading={processingMitosisForId !== null}
                    loadingText="🔬 Dividing..."
                    isDisabled={creatures.filter(c => c.estaViva && parseFloat(c.puntosEvolucion) >= MINIMUM_EP_FOR_MITOSIS).length === 0}
                  >
                    🔬 Cosmic Mitosis
                  </Button>
                  <Button 
                    onClick={fetchCreatures} 
                    colorScheme="blue"
                    variant="outline"
                    isLoading={isLoadingCreatures}
                  >
                    Refresh Data
                  </Button>
                </Flex>

                {/* Advanced Creature Visualizer with v2 Modular System */}
                <AdvancedCreatureVisualizer
                  creatures={creatures}
                  onRefresh={fetchCreatures}
                  onMint={handleMintCreature}
                  onProcessEvolution={handleProcessEvolutionAllCreatures}
                  isLoading={isLoadingCreatures}
                />

                {/* Mitosis Modal */}
                <Modal isOpen={isMitosisModalOpen} onClose={onCloseMitosisModal} size="md">
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader>
                      Perform Mitosis
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                      {mitosisTargetCreature && (
                        <VStack spacing={4} align="stretch">
                          <Text>
                            <strong>Creature #{mitosisTargetCreature.id}</strong>
                          </Text>
                          <Text>
                            Current EP: {parseFloat(mitosisTargetCreature.puntosEvolucion).toFixed(1)}
                          </Text>
                          <FormControl>
                            <FormLabel>EP Cost for Mitosis</FormLabel>
                            <Input
                              type="number"
                              value={mitosisEpInput}
                              onChange={(e) => setMitosisEpInput(e.target.value)}
                              min={MINIMUM_EP_FOR_MITOSIS}
                              max={parseFloat(mitosisTargetCreature.puntosEvolucion)}
                              step="0.1"
                            />
                          </FormControl>
                        </VStack>
                      )}
                    </ModalBody>
                    <ModalFooter>
                      <Button colorScheme="blue" mr={3} onClick={handlePerformMitosis}>
                        Perform Mitosis
                      </Button>
                      <Button variant="ghost" onClick={onCloseMitosisModal}>
                        Cancel
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>


              </VStack>
            )}
          </MotionBox>
        </VStack>
      </Container>

      {/* Epic Notifications System - Guaranteed Visibility */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 999999999,
          pointerEvents: 'none',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column-reverse', // Newest notifications appear at bottom
          gap: '12px'
        }}
      >
        {customNotifications.map((notification) => {
          const getStatusColors = () => {
            switch (notification.status) {
              case 'success':
                return { bg: '#059669', border: '#10b981', icon: '✅' };
              case 'error':
                return { bg: '#dc2626', border: '#ef4444', icon: '❌' };
              case 'warning':
                return { bg: '#d97706', border: '#f59e0b', icon: '⚠️' };
              case 'loading':
                return { bg: '#7c3aed', border: '#8b5cf6', icon: '🔄' };
              default:
                return { bg: '#2563eb', border: '#3b82f6', icon: 'ℹ️' };
            }
          };

          const colors = getStatusColors();

          return (
            <div
              key={notification.id}
              style={{
                background: `linear-gradient(135deg, ${colors.bg}dd, ${colors.bg}aa)`,
                border: `2px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '16px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                color: 'white',
                pointerEvents: 'auto',
                transform: 'translateX(0)',
                transition: 'all 0.3s ease-in-out',
                animation: notification.status === 'loading' ? 'pulse 2s infinite' : 'slideIn 0.3s ease-out'
              }}
              onClick={() => removeEpicNotification(notification.id)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>
                  {colors.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '16px', 
                    marginBottom: '4px',
                    lineHeight: '1.2'
                  }}>
                    {notification.title}
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    opacity: 0.9,
                    lineHeight: '1.4',
                    wordBreak: 'break-word'
                  }}>
                    {notification.description}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEpicNotification(notification.id);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    flexShrink: 0
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateY(100%) translateX(-20px);
            opacity: 0;
            scale: 0.8;
          }
          to {
            transform: translateY(0) translateX(0);
            opacity: 1;
            scale: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }
      `}</style>
    </Box>
  );
} 