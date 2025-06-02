'use client';

import { Box, Button, ButtonGroup, Container, Heading, Text, VStack, Spinner, useToast, useColorModeValue, Code, Image, Flex, Spacer, Tag, HStack, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, useDisclosure } from '@chakra-ui/react';
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
                    lifespanDays: 5.0,
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
    duration: number = 8000
  ) => {
    const id = Date.now().toString();
    const notification = {
      id,
      title,
      description,
      status,
      duration,
      timestamp: Date.now()
    };
    
    setCustomNotifications(prev => [...prev, notification]);
    
    // Auto-remove after duration (unless it's a loading notification)
    if (status !== 'loading' && duration > 0) {
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
      
      // Extract some trait information for context
      const visualTraits = creature.traitValues?.visual || '';
      const advancedTraits = creature.traitValues?.advanced_visual || '';
      
      const prompt = `You are the Chronicle Keeper of Primordia, inscribing the sacred evolution tales. Write a mystical narrative describing how this creature transformed through cosmic energies.

CREATURE: ${creature.name}
TRANSFORMATION: Aged ${ageDelta.toFixed(2)} days, gained ${epDelta.toFixed(1)} anima essence
ESSENCE: ${visualTraits ? visualTraits.substring(0, 80) : 'mysterious energies'}

WRITING RULES:
- Write EXACTLY 2-3 sentences in flowing narrative prose
- Use mystical, poetic language befitting cosmic lore
- NO markdown formatting (**bold**, etc.)
- NO numbered lists or bullet points  
- NO technical terms - only magical/mystical language
- Include 1-2 relevant emojis naturally in the text
- Focus on transformation, cosmic forces, and mystical evolution
- Mention the creature's name naturally in the narrative

Write as if inscribing sacred text in an ancient tome. Make it feel magical and immersive.

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

  // Generate epic birth narrative for new creatures using LLM
  const generateBirthNarrative = async (newCreature: CreatureUIDataFrontend): Promise<string> => {
    if (!openRouterService) {
      return `🌟 A new creature has emerged from the primordial energies of Primordia! Welcome ${newCreature.name} to the cosmic realm.`;
    }

    try {
      // Extract trait information for the birth story
      const visualTraits = newCreature.traitValues?.visual || '';
      const advancedTraits = newCreature.traitValues?.advanced_visual || '';
      const personalityTraits = newCreature.traitValues?.personality || '';
      const reproductionTraits = newCreature.traitValues?.reproduction || '';
      
      const traitsList = Object.entries(newCreature.traitValues || {})
        .filter(([key, value]) => value && value.length > 0)
        .map(([key, value]) => `${key}: ${value?.substring(0, 80)}`)
        .join(', ');

      const prompt = `You are the Chronicle Keeper of Primordia, inscribing the sacred birth tales. Write a mystical narrative describing the emergence of a new cosmic entity from the primordial energies.

NEWBORN: ${newCreature.name}
COSMIC SIGNATURE: ${newCreature.initialSeed}
DESTINY: ${newCreature.lifespanTotalSimulatedDays} days of existence
MANIFESTED ESSENCE: ${traitsList || 'pure potential energy'}

WRITING RULES:
- Write EXACTLY 2-3 sentences in flowing narrative prose
- Use mystical, poetic language of cosmic creation
- NO markdown formatting (**bold**, etc.)
- NO numbered lists or technical terms
- Include 1-2 relevant emojis naturally in the text
- Focus on emergence, cosmic birth, and destiny
- Mention the creature's name naturally in the narrative
- Describe the birth as a cosmic event of significance

Write as if inscribing the moment of creation in sacred chronicles. Make it feel like witnessing the birth of a legend.

Birth Chronicle:`;

      const narrative = await openRouterService.chat(prompt);
      return narrative || `🌟 From the swirling vortex of creation, ${newCreature.name} manifests into existence, bearing the cosmic signature ${newCreature.initialSeed} and destined to walk the realms for ${newCreature.lifespanTotalSimulatedDays} cycles of life.`;
    } catch (error) {
      console.error('Failed to generate birth narrative:', error);
      return `✨ Through the ancient rites of creation, ${newCreature.name} awakens in the cosmic realm, their essence marked by the eternal signature ${newCreature.initialSeed}, ready to embrace their destined path.`;
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
      toast({ title: "User Not Connected", description: "Please connect your wallet.", status: "warning" });
      return;
    }
    setIsLoadingMint(true);
    let toastId: string | number = ""; 

    try {
      toastId = toast({
        title: 'Processing Mint',
        description: 'Sending transaction to mint your creature...',
        status: 'info',
        duration: null, 
        isClosable: false,
      });

      const transactionId = await fcl.mutate({
        cadence: MINT_NFT_WITH_PAYMENT_TRANSACTION,
        args: (arg, t) => [arg(user.addr as string, t.Address)], 
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 9999
      });

      toast.update(toastId, {
        description: `Transaction sent: ${transactionId}. Waiting for confirmation...`,
      });

      await fcl.tx(transactionId).onceSealed();

      // Show immediate success
      toast.update(toastId, {
        title: '🌟 Creature Born!',
        description: 'A new cosmic entity has emerged from the primordial energies! Discovering their traits...',
        status: 'success',
        duration: 8000,
        isClosable: true,
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

            // Generate epic birth narrative (non-blocking)
            console.log("🎭 Generating epic birth narrative...");
            generateBirthNarrative(newCreature).then(birthNarrative => {
              console.log("📜 Generated birth narrative:", birthNarrative);
              // Show epic birth chronicle
              toast({
                title: `📜 Birth Chronicle of ${newCreature.name}`,
                description: birthNarrative,
                status: 'info',
                duration: 15000,
                isClosable: true,
              });

              // Also show traits summary
              const traitsCount = Object.keys(newCreature.traitValues || {}).length;
              const modulesText = newCreature.registeredModules.join(', ');
              toast({
                title: `🧬 Traits Manifested`,
                description: `${newCreature.name} emerged with ${traitsCount} trait modules: ${modulesText}`,
                status: 'success',
                duration: 10000,
                isClosable: true,
              });
            }).catch(error => {
              console.error("Failed to generate birth narrative:", error);
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch new creature details:", error);
      } 

    } catch (error: any) {
      console.error("Error minting creature:", error);
      if (toastId) { 
        toast.update(toastId, {
          title: 'Error Minting Creature',
          description: error?.message || 'An unknown error occurred.',
          status: 'error',
          duration: 9000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error Minting Creature',
          description: error?.message || 'An unknown error occurred.',
          status: 'error',
          duration: 9000,
          isClosable: true,
        });
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
        5000
      );

      let successCount = 0;
      let errorCount = 0;

      console.log("✅ Starting creature loop for ALL creatures...");
      
              // Debug notification to confirm visibility
        showEpicNotification(
          "🔍 DEBUG: Evolution Starting",
          `Found ${aliveCreatures.length} alive creatures. UI systems active.`,
          "info",
          3000
        );
      
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
        
        let toastIdEvo: string | number = "";
        try {
          console.log("✅ Creating enhanced notification for creature...");
          toastIdEvo = showEpicNotification(
            `🧬 Evolution ${i + 1}/${aliveCreatures.length}: ${creature.name}`,
            `Processing creature #${creature.id}... Wallet approval needed.`,
            'loading',
            0  // No auto-remove for loading notifications
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

          // Show immediate success first
          updateEpicNotification(toastIdEvo, {
            title: `✨ Evolution Complete: ${creature.name}!`, 
            description: `The cosmic energies have transformed ${creature.name}. The Chronicle Keeper inscribes their tale...`,
            status: 'success',
            duration: 8000,
          });

          // Generate epic evolution narrative with LLM (non-blocking)
          if (afterState) {
            console.log("🎭 Generating epic evolution narrative...");
            console.log("🔧 OpenRouter service available:", !!openRouterService);
            console.log("📊 Before state:", beforeState);
            console.log("📊 After state:", afterState);
            
            generateEvolutionNarrative(creature, beforeState, afterState).then(evolutionNarrative => {
              console.log("📜 Generated narrative:", evolutionNarrative);
              console.log("🚀 About to show narrative toast...");
              
              // Show epic narrative notification
              const narrativeNotificationId = showEpicNotification(
                `📜 Chronicle of ${creature.name}`,
                evolutionNarrative,
                'info',
                12000
              );
              
              console.log("✅ Narrative notification created with ID:", narrativeNotificationId);
            }).catch(error => {
              console.error("❌ Failed to generate narrative:", error);
              console.error("💥 Error details:", error.message || error);
              
              // Show fallback notification
              showEpicNotification(
                `📜 Evolution Chronicle`,
                `The cosmic winds whisper of ${creature.name}'s transformation through the ethereal realms of Primordia.`,
                'info',
                8000
              );
            });
          } else {
            console.log("❌ No afterState available for narrative generation");
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
            toast.update(toastIdEvo, {
              title: `❌ Evolution Failed: ${creature.name}`,
              description: error?.message || 'An unknown error occurred.',
              status: 'error',
              duration: 9000,
              isClosable: true,
            });
          }
        }
      }

      console.log("✅ Evolution process completed");
      
      // Epic completion summary
      let completionTitle = "🌟 Evolution Complete!";
      let completionDescription = `${successCount} creature(s) evolved. ${errorCount} error(s).`;
      
      if (successCount > 0 && errorCount === 0) {
        completionTitle = "✨ Primordial Evolution Mastered!";
        completionDescription = `All ${successCount} creatures have successfully evolved through the cosmic energies of Primordia!`;
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
        10000
      );

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
          right: '20px',
          zIndex: 999999999,
          pointerEvents: 'none',
          maxWidth: '380px',
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
            transform: translateY(100%) translateX(20px);
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