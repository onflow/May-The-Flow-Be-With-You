'use client';

import { Box, Button, ButtonGroup, Container, Heading, Text, VStack, Spinner, useToast, useColorModeValue, Code, Image, Flex, Spacer, Tag, HStack, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, useDisclosure } from '@chakra-ui/react';
import { useEffect, useState, useRef } from 'react';
import * as fcl from '@onflow/fcl';
import Header from '@/components/Header';
import NextLink from 'next/link';
import AdvancedCreatureVisualizer from '@/components/AdvancedCreatureVisualizer';
import { motion } from 'framer-motion';

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
    
    prepare(acct: auth(BorrowValue) &Account) {
        // Get reference to the collection
        let collectionRef = acct.storage.borrow<&EvolvingCreatureNFT.Collection>(
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
  const toast = useToast();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(300);
  const [canvasHeight, setCanvasHeight] = useState(300);

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

      toast.update(toastId, {
        title: 'Creature Minted!',
        description: 'Your new creature has arrived in the environment.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      fetchCreatures(); 

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
    if (!user?.addr) {
      toast({ title: "User Not Connected", description: "Please connect your wallet.", status: "warning" });
      return;
    }
    if (creatures.length === 0) {
      toast({ title: "No Creatures", description: "There are no active creatures to evolve.", status: "info" });
      return;
    }

    setIsProcessingEvolution(true);
    toast({ 
        title: `Starting evolution for ${creatures.length} creature(s)...`,
        description: "You will be asked to approve one transaction per creature.",
        status: "info", 
        duration: 3000 + creatures.length * 1500, 
        isClosable: true 
    });

    let successCount = 0;
    let errorCount = 0;

    for (const creature of creatures) {
      if (!creature.estaViva) { // Skip dead creatures, though script should only fetch alive ones
          console.log(`Skipping evolution for dead creature #${creature.id}`);
          continue;
      }
      let toastIdEvo: string | number = "";
      try {
        toastIdEvo = toast({
          title: `Processing Evolution for Creature #${creature.id}`,
          description: 'Sending transaction...',
          status: 'loading',
          duration: null,
          isClosable: false,
        });

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

        toast.update(toastIdEvo, {
          description: `Transaction sent (${transactionId.substring(0,8)}...). Waiting for confirmation...`,
        });

        await fcl.tx(transactionId).onceSealed();

        toast.update(toastIdEvo, {
          title: `Evolution Successful for #${creature.id}!`, 
          description: `Creature #${creature.id} has processed its evolution.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        successCount++;
      } catch (error: any) {
        errorCount++;
        console.error(`Error processing evolution for creature #${creature.id}:`, error);
        if (toastIdEvo) {
          toast.update(toastIdEvo, {
            title: `Error Evolving #${creature.id}`,
            description: error?.message || 'An unknown error occurred.',
            status: 'error',
            duration: 9000,
            isClosable: true,
          });
        } else {
          toast({
            title: `Error Evolving #${creature.id}`,
            description: error?.message || 'An unknown error occurred.',
            status: 'error',
            duration: 9000,
            isClosable: true,
          });
        }
      }
    }

    toast({ 
        title: "Global Evolution Process Concluded", 
        description: `${successCount} creature(s) evolved. ${errorCount} error(s).`,
        status: errorCount > 0 ? (successCount > 0 ? "warning" : "error") : "success",
        duration: 7000,
        isClosable: true
    });

    if (successCount > 0 || errorCount > 0) { 
      fetchCreatures(); 
    }
    setIsProcessingEvolution(false);
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
                    isDisabled={creatures.filter(c => c.estaViva).length >= 5}
                  >
                    Mint New Creature (0.1 FLOW)
                  </Button>
                  <Button 
                    onClick={handleProcessEvolutionAllCreatures} 
                    colorScheme="purple"
                    isLoading={isProcessingEvolution}
                  >
                    Process Evolution
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
                    isDisabled={creatures.filter(c => c.estaViva && parseFloat(c.puntosEvolucion) >= MINIMUM_EP_FOR_MITOSIS).length === 0}
                  >
                    Perform Mitosis
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
    </Box>
  );
} 