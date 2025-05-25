'use client';

import { Box, Button, ButtonGroup, Container, Heading, Text, VStack, Spinner, useToast, useColorModeValue, Code, Image, Flex, Spacer, Tag, HStack, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, useDisclosure } from '@chakra-ui/react';
import { useEffect, useState, useRef } from 'react';
import * as fcl from '@onflow/fcl';
import Header from '@/components/Header';
import NextLink from 'next/link';
import CreatureCanvas, { CreatureCanvasProps } from '@/components/CreatureCanvas';

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

const CONTRACT_NAME = "CreatureNFTV6";
const CONTRACT_ADDRESS = "0x2444e6b4d9327f09"; // Your deployed contract address
const FUNGIBLE_TOKEN_ADDRESS = "0x9a0766d93b6608b7";
const FLOW_TOKEN_ADDRESS = "0x7e60df042a9c0868";
const NON_FUNGIBLE_TOKEN_ADDRESS = "0x631e88ae7f1d7c20";
const METADATA_VIEWS_ADDRESS = "0x631e88ae7f1d7c20";

const MINIMUM_EP_FOR_MITOSIS = 10.0;

const GET_ACTIVE_CREATURES_SCRIPT = `
import NonFungibleToken from ${NON_FUNGIBLE_TOKEN_ADDRESS}
import ${CONTRACT_NAME} from ${CONTRACT_ADDRESS}
import MetadataViews from ${METADATA_VIEWS_ADDRESS}

access(all) struct CreatureUIData {
    access(all) let id: UInt64
    access(all) let name: String
    access(all) let description: String
    access(all) let thumbnail: String
    access(all) let estaViva: Bool
    access(all) let edadDiasCompletos: UFix64
    access(all) let lifespanTotalSimulatedDays: UFix64
    access(all) let puntosEvolucion: UFix64
    access(all) let genesVisibles: {String: UFix64}
    access(all) let genesOcultos: {String: UFix64}
    access(all) let homeostasisTargets: {String: UFix64}
    access(all) let birthTimestamp: UFix64
    access(all) let lastEvolutionProcessedTimestamp: UFix64
    access(all) let initialSeed: UInt64

    init(
        id: UInt64, name: String, description: String, thumbnail: String, estaViva: Bool,
        edadDiasCompletos: UFix64, lifespanTotalSimulatedDays: UFix64, puntosEvolucion: UFix64,
        genesVisibles: {String: UFix64}, genesOcultos: {String: UFix64}, homeostasisTargets: {String: UFix64},
        birthTimestamp: UFix64, lastEvolutionProcessedTimestamp: UFix64,
        initialSeed: UInt64
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.thumbnail = thumbnail
        self.estaViva = estaViva
        self.edadDiasCompletos = edadDiasCompletos
        self.lifespanTotalSimulatedDays = lifespanTotalSimulatedDays
        self.puntosEvolucion = puntosEvolucion
        self.genesVisibles = genesVisibles
        self.genesOcultos = genesOcultos
        self.homeostasisTargets = homeostasisTargets
        self.birthTimestamp = birthTimestamp
        self.lastEvolutionProcessedTimestamp = lastEvolutionProcessedTimestamp
        self.initialSeed = initialSeed
    }
}

access(all) fun main(userAddress: Address): [CreatureUIData] {
    let account = getAccount(userAddress)
    let collectionPublicPath: PublicPath = ${CONTRACT_NAME}.CollectionPublicPath

    let collectionCap = account
        .capabilities.get<&{${CONTRACT_NAME}.CollectionPublic}>(collectionPublicPath)
        .borrow()
        ?? panic("No se pudo obtener la capacidad pública de la colección de ${CONTRACT_NAME} desde la ruta: ".concat(collectionPublicPath.toString()))
    
    let activeIDs = collectionCap.getActiveCreatureIDs()
    var creaturesData: [CreatureUIData] = []
    
    for id in activeIDs {
        let creature = collectionCap.borrowCreatureNFT(id: id) 
            ?? panic("No se pudo obtener la criatura con ID: ".concat(id.toString()))
        
        let displayView = creature.resolveView(Type<MetadataViews.Display>())!
        let display = displayView as! MetadataViews.Display
        let httpFile = display.thumbnail as! MetadataViews.HTTPFile

        let genesVisiblesCopy: {String: UFix64} = {}
        for key in creature.genesVisibles.keys {
            genesVisiblesCopy[key] = creature.genesVisibles[key]!
        }

        let genesOcultosCopy: {String: UFix64} = {}
        for key in creature.genesOcultos.keys {
            genesOcultosCopy[key] = creature.genesOcultos[key]!
        }

        let homeostasisTargetsCopy: {String: UFix64} = {}
        for key in creature.homeostasisTargets.keys {
            homeostasisTargetsCopy[key] = creature.homeostasisTargets[key]!
        }

        creaturesData.append(
            CreatureUIData(
                id: creature.id, name: display.name, description: display.description, thumbnail: httpFile.url,
                estaViva: creature.estaViva, edadDiasCompletos: creature.edadDiasCompletos,
                lifespanTotalSimulatedDays: creature.lifespanTotalSimulatedDays,
                puntosEvolucion: creature.puntosEvolucion, genesVisibles: genesVisiblesCopy,
                genesOcultos: genesOcultosCopy, homeostasisTargets: homeostasisTargetsCopy,
                birthTimestamp: creature.birthTimestamp, lastEvolutionProcessedTimestamp: creature.lastEvolutionProcessedTimestamp,
                initialSeed: creature.id
            )
        )
    }
    return creaturesData
}
`;

const MINT_WITH_PAYMENT_TRANSACTION = `
import FungibleToken from ${FUNGIBLE_TOKEN_ADDRESS}
import FlowToken from ${FLOW_TOKEN_ADDRESS}
import NonFungibleToken from ${NON_FUNGIBLE_TOKEN_ADDRESS}
import ${CONTRACT_NAME} from ${CONTRACT_ADDRESS}

transaction {
    let collectionRef: &${CONTRACT_NAME}.Collection
    let paymentVault: @{FungibleToken.Vault}
    let minterRef: &${CONTRACT_NAME}.NFTMinter
    let recipientRef: &{FungibleToken.Receiver}

    let genesVisibles: {String: UFix64}
    let genesOcultos: {String: UFix64}
    let lifespan: UFix64
    let thumbnailURL: String
    let initialPuntosEvolucion: UFix64

    prepare(signer: auth(Storage, Capabilities) &Account) {
        if signer.storage.borrow<&${CONTRACT_NAME}.Collection>(from: ${CONTRACT_NAME}.CollectionStoragePath) == nil {
            signer.storage.save(<-${CONTRACT_NAME}.createEmptyCollection(nftType: Type<@${CONTRACT_NAME}.NFT>()), to: ${CONTRACT_NAME}.CollectionStoragePath)
            signer.capabilities.publish(
                signer.capabilities.storage.issue<&{NonFungibleToken.CollectionPublic, ${CONTRACT_NAME}.CollectionPublic}>(${CONTRACT_NAME}.CollectionStoragePath),
                at: ${CONTRACT_NAME}.CollectionPublicPath
            )
            log("Colección de ${CONTRACT_NAME} creada.")
        }
        
        self.collectionRef = signer.storage.borrow<auth(Storage) &${CONTRACT_NAME}.Collection>(from: ${CONTRACT_NAME}.CollectionStoragePath)
            ?? panic("No se pudo obtener la colección.")
        
        if self.collectionRef.getActiveCreatureCount() >= ${CONTRACT_NAME}.MAX_ACTIVE_CREATURES {
            panic("Límite máximo de criaturas vivas alcanzado.")
        }
        
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("No se pudo obtener bóveda de FlowToken.")
        self.paymentVault <- vaultRef.withdraw(amount: 0.1)

        self.minterRef = getAccount(${CONTRACT_ADDRESS})
            .capabilities.borrow<&${CONTRACT_NAME}.NFTMinter>(/public/${CONTRACT_NAME}Minter)
            ?? panic("No se pudo obtener Minter de ${CONTRACT_ADDRESS} en /public/${CONTRACT_NAME}Minter.")
            
        self.recipientRef = getAccount(${CONTRACT_ADDRESS})
            .capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("No se pudo obtener receptor de FlowToken de ${CONTRACT_ADDRESS}.")

        // --- Start: V5-style random generation logic ---
        let currentBlock = getCurrentBlock()
        let blockHeight = currentBlock.height
        let timestamp = currentBlock.timestamp

        let blockHeightInt = Int(blockHeight)
        
        // V5-style timestamp to Int conversion to avoid overflow
        let timestampIntegerPart = UInt64(timestamp) // Get the integer part as UInt64
        let timestampFractionalPart = timestamp - UFix64(timestampIntegerPart) // Get fractional part as UFix64
        let timestampFractionalAsInt = Int(UInt64(timestampFractionalPart * 1000000.0)) // Convert fractional to Int (scaled)
        let timestampInt = Int(timestampIntegerPart) + timestampFractionalAsInt // Combine, ensuring both are Int before sum

        self.genesVisibles = {
            "colorR": UFix64( (timestampInt + blockHeightInt) % 256) / 255.0,
            "colorG": UFix64( ( (timestampInt % 128) * 2 + (blockHeightInt % 128) ) % 256) / 255.0,
            "colorB": UFix64( ( (blockHeightInt % 128) * 2 + (timestampInt % 128) ) % 256) / 255.0,
            "tamanoBase": 0.8 + (UFix64( (blockHeightInt + timestampInt) % 1701 ) / 1000.0), // 0.8 to 2.5 (inclusive of 0.8, exclusive of 2.501)
            "formaPrincipal": 1.0 + UFix64( (timestampInt + blockHeightInt + 77) % 3), // 1.0, 2.0, or 3.0
            "numApendices": UFix64( (blockHeightInt + timestampInt + 123) % 9), // 0 to 8
            "patronMovimiento": 1.0 + UFix64( (timestampInt + blockHeightInt + 234) % 4) // 1.0 to 4.0
        }

        self.genesOcultos = {
            "tasaMetabolica": 0.7 + (UFix64( (timestampInt + blockHeightInt + 300) % 601) / 1000.0), // 0.7 to 1.3
            "fertilidad": 0.2 + (UFix64( (timestampInt + blockHeightInt + 450) % 601) / 1000.0),   // 0.2 to 0.8
            "potencialEvolutivo": 0.8 + (UFix64( (timestampInt + blockHeightInt + 600) % 401) / 1000.0), // 0.8 to 1.2
            // max_lifespan_dias_base will be set based on self.lifespan later if needed by contract, or fixed
            "puntosSaludMax": 80.0 + (UFix64( (timestampInt + blockHeightInt + 100) % 7001) / 100.0), // 80 to 150
            "ataqueBase": 8.0 + (UFix64( (timestampInt + blockHeightInt + 200) % 1001) / 100.0),    // 8 to 18
            "defensaBase": 8.0 + (UFix64( (timestampInt + blockHeightInt + 250) % 1001) / 100.0),   // 8 to 18
            "agilidadCombate": 0.7 + (UFix64( (timestampInt + blockHeightInt + 350) % 801) / 1000.0)  // 0.7 to 1.5
        }
        
        self.lifespan = 4.0 + (UFix64( (timestampInt + blockHeightInt + 500) % 3001) / 1000.0) // Range 4.0 to 7.0
        self.genesOcultos["max_lifespan_dias_base"] = self.lifespan // Ensure this is set for the contract

        self.initialPuntosEvolucion = 5.0 + (UFix64( (blockHeightInt + timestampInt) % 151) / 10.0) // 5.0 to 20.0

        let thumbnailOptions = ["https://i.imgur.com/0F0Z3pZ.png", "https://i.imgur.com/R3jYmPZ.png", "https://i.imgur.com/g6z4gYm.png"]
        self.thumbnailURL = thumbnailOptions[ (timestampInt + blockHeightInt) % thumbnailOptions.length ]
        // --- End: V5-style random generation logic ---
    }

    execute {
        self.recipientRef.deposit(from: <-self.paymentVault)
        let newNFT <- self.minterRef.createNFT(
            name: "", description: "A new entity.", thumbnail: self.thumbnailURL,
            birthBlockHeight: getCurrentBlock().height, initialGenesVisibles: self.genesVisibles,
            initialGenesOcultos: self.genesOcultos, initialPuntosEvolucion: self.initialPuntosEvolucion,
            lifespanDays: self.lifespan, initialEdadDiasCompletos: 0.0,
            initialEstaViva: true, initialHomeostasisTargets: {}
        )
        self.collectionRef.deposit(token: <-newNFT)
        log("New ${CONTRACT_NAME} minted and deposited.")
    }
}
`;

const PROCESS_EVOLUTION_TRANSACTION = `
import NonFungibleToken from ${NON_FUNGIBLE_TOKEN_ADDRESS}
import ${CONTRACT_NAME} from ${CONTRACT_ADDRESS}

transaction(nftID: UInt64, segundosPorDiaSimulado: UFix64, stepsPerDay: UInt64) {
    let nftRef: &${CONTRACT_NAME}.NFT
    let collectionRef: &${CONTRACT_NAME}.Collection
    
    prepare(signer: auth(Storage) &Account) {
        self.collectionRef = signer.storage.borrow<auth(Storage) &${CONTRACT_NAME}.Collection>(from: ${CONTRACT_NAME}.CollectionStoragePath)
            ?? panic("No se pudo obtener referencia a la colección. Asegúrate de que la cuenta esté configurada correctamente.")
        self.nftRef = self.collectionRef.borrowCreatureNFTForUpdate(id: nftID)
            ?? panic("No se pudo obtener referencia a la criatura con ID ".concat(nftID.toString()))
    }
    
    execute {
        if !self.nftRef.estaViva {
            log("La criatura ".concat(self.nftRef.id.toString()).concat(" no está viva. No se procesará evolución."))
            return
        }
        let currentTimestamp = getCurrentBlock().timestamp
        let currentBlockHeight = getCurrentBlock().height
        let diasTranscurridos = self.nftRef.calcularDiasTranscurridos(
            timestampActual: currentTimestamp,
            segundosPorDiaSimulado: segundosPorDiaSimulado
        )
        if diasTranscurridos > 0.0 {
            let totalStepsToProcess = UInt64(diasTranscurridos * UFix64(stepsPerDay))
            if totalStepsToProcess == 0 {
                log("No hay suficientes steps para procesar (< 1 step)")
                return
            }
            log("Procesando ".concat(totalStepsToProcess.toString()).concat(" steps (")
               .concat(diasTranscurridos.toString()).concat(" días) para la criatura ")
               .concat(self.nftRef.id.toString()))
            let diaBaseSimulado = UInt64(self.nftRef.edadDiasCompletos) + 1
            var currentDayBeingProcessed = diaBaseSimulado
            var stepsTakenInCurrentDay: UInt64 = 0
            var diasCompletados: UFix64 = 0.0
            var currentDaySeeds: [UInt64] = self.nftRef.generateDailySeeds(diaSimulado: diaBaseSimulado)
            var stepNumber: UInt64 = 0
            while stepNumber < totalStepsToProcess {
                if stepsTakenInCurrentDay >= stepsPerDay {
                    currentDayBeingProcessed = currentDayBeingProcessed + 1
                    stepsTakenInCurrentDay = 0
                    diasCompletados = diasCompletados + 1.0
                    self.nftRef.updateEdad(newEdad: self.nftRef.edadDiasCompletos + 1.0)
                    currentDaySeeds = self.nftRef.generateDailySeeds(diaSimulado: currentDayBeingProcessed)
                    let R4_semilla_evento = currentDaySeeds[4]
                    let random_normalized_ep_event = UFix64(R4_semilla_evento % 1000) / 999.0
                    var positive_change_ep_event = true
                    var final_ep_change_event: UFix64 = 0.0
                    let ep_change_ratio_event: UFix64 = 0.01
                    let base_ep_change_event = self.nftRef.puntosEvolucion * ep_change_ratio_event
                    if random_normalized_ep_event < 0.5 {
                        positive_change_ep_event = false
                        let magnitude_factor_event = (0.5 - random_normalized_ep_event) * 2.0
                        final_ep_change_event = base_ep_change_event * magnitude_factor_event
                    } else {
                        positive_change_ep_event = true
                        let magnitude_factor_event = (random_normalized_ep_event - 0.5) * 2.0
                        final_ep_change_event = base_ep_change_event * magnitude_factor_event
                    }
                    var newEP_event = self.nftRef.puntosEvolucion
                    if positive_change_ep_event {
                        newEP_event = self.nftRef.puntosEvolucion + final_ep_change_event
                    } else {
                        if self.nftRef.puntosEvolucion > final_ep_change_event + 0.1 {
                            newEP_event = self.nftRef.puntosEvolucion - final_ep_change_event
                        } else {
                            newEP_event = 0.1
                        }
                    }
                    self.nftRef.updatePuntosEvolucion(newEP: newEP_event)
                    log("Evento fin de día: Modificación EP ".concat(positive_change_ep_event ? "+" : "-").concat(final_ep_change_event.toString()))
                    if self.collectionRef.getActiveCreatureCount() < ${CONTRACT_NAME}.MAX_ACTIVE_CREATURES &&
                       self.collectionRef.getActiveCreatureCount() >= 2 {
                        let reproProb = UFix64((R4_semilla_evento >> 10) % 100) / 100.0
                        if reproProb < 0.25 {
                            let potentialChildNFT <- self.collectionRef.attemptSexualReproduction()
                            if potentialChildNFT != nil {
                                let actualChildNFT <- potentialChildNFT!
                                self.collectionRef.deposit(token: <-actualChildNFT)
                                log("¡Reproducción sexual automática exitosa! Se ha creado una nueva criatura.")
                            } else {
                                destroy potentialChildNFT
                            }
                        }
                    }
                    if self.nftRef.edadDiasCompletos >= self.nftRef.lifespanTotalSimulatedDays && self.nftRef.estaViva {
                        self.nftRef.updateVitalStatus(
                            newEstaViva: false,
                            newDeathBlock: currentBlockHeight,
                            newDeathTimestamp: currentTimestamp
                        )
                        log("La criatura ".concat(self.nftRef.id.toString()).concat(" ha muerto de vejez después de ")
                           .concat(self.nftRef.edadDiasCompletos.toString()).concat(" días simulados."))
                        self.collectionRef.markCreatureAsDead(creatureID: nftID)
                        break
                    }
                }
                let stepSaltBase = stepsTakenInCurrentDay * 31
                let r0BaseVolatilidad = currentDaySeeds[0]
                let r1BasePasiva = currentDaySeeds[1]
                let r2BaseBoostHomeo = currentDaySeeds[2]
                let r3BaseHomeoEfec = currentDaySeeds[3]
                let stepR1Pasiva = (r1BasePasiva ^ (stepSaltBase * 11)) % UInt64(4294967296)
                let stepR0EPGain = (r0BaseVolatilidad ^ stepSaltBase) % UInt64(4294967296)
                self.nftRef.updateGenesForStep(
                    r0VolSeed: r0BaseVolatilidad,
                    r1PasSeed: stepR1Pasiva,
                    r2BoostHomeoSeed: r2BaseBoostHomeo,
                    r3HomeoEfecSeed: r3BaseHomeoEfec,
                    stepsPerDay: stepsPerDay
                )
                self.nftRef._updateCombatGenesForStep(
                    r0VolSeed: r0BaseVolatilidad,
                    r1PasSeedStep: stepR1Pasiva,
                    stepsPerDay: stepsPerDay
                )
                self.nftRef.gainEvolutionPointsForStep(r0: stepR0EPGain, stepsPerDay: stepsPerDay)
                stepsTakenInCurrentDay = stepsTakenInCurrentDay + 1
                stepNumber = stepNumber + 1
            }
            if stepsTakenInCurrentDay > 0 {
                let fraccionDiaAdicional = UFix64(stepsTakenInCurrentDay) / UFix64(stepsPerDay)
                self.nftRef.updateEdad(newEdad: self.nftRef.edadDiasCompletos + fraccionDiaAdicional)
            }
            self.nftRef.setLastEvolutionProcessed(
                blockHeight: currentBlockHeight,
                timestamp: currentTimestamp
            )
            self.nftRef.emitEvolutionProcessedEvent(
                processedSteps: totalStepsToProcess,
                newAge: self.nftRef.edadDiasCompletos,
                evolutionPoints: self.nftRef.puntosEvolucion
            )
            log("Evolución completada. Nueva edad: ".concat(self.nftRef.edadDiasCompletos.toString())
               .concat(" días. EP actuales: ").concat(self.nftRef.puntosEvolucion.toString()))
        } else {
            log("No ha pasado suficiente tiempo para procesar evolución")
        }
    }
}
`;

const PERFORM_MITOSIS_TRANSACTION = `
import NonFungibleToken from ${NON_FUNGIBLE_TOKEN_ADDRESS}
import ${CONTRACT_NAME} from ${CONTRACT_ADDRESS}

transaction(creatureID: UInt64, epCost: UFix64) {
    let collectionRef: &${CONTRACT_NAME}.Collection
    
    prepare(signer: auth(Storage) &Account) {
        self.collectionRef = signer.storage.borrow<auth(Storage) &${CONTRACT_NAME}.Collection>(
            from: ${CONTRACT_NAME}.CollectionStoragePath
        ) ?? panic("No se pudo obtener referencia a la colección de criaturas ${CONTRACT_NAME}")
        
        if epCost < 10.0 { 
            panic("El costo mínimo de EP para mitosis es 10.0")
        }
    }
    
    execute {
        if self.collectionRef.getActiveCreatureCount() >= ${CONTRACT_NAME}.MAX_ACTIVE_CREATURES {
            panic("No se puede realizar mitosis: se ha alcanzado el límite máximo de criaturas vivas")
        }
        
        let parentRef = self.collectionRef.borrowCreatureNFTForUpdate(id: creatureID) 
            ?? panic("No se encontró la criatura con ID ".concat(creatureID.toString()))
        
        let childNFT <- parentRef.performMitosis(epCost: epCost) 
            ?? panic("No se pudo realizar mitosis. Verifica que la criatura esté viva, tenga suficientes EP y que el costo sea adecuado.")
        
        self.collectionRef.deposit(token: <-childNFT)
        
        log("Mitosis exitosa! Se ha creado una nueva criatura ${CONTRACT_NAME}")
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
  genesVisibles: { [key: string]: string }; 
  genesOcultos: { [key: string]: string };
  homeostasisTargets: { [key: string]: string };
  birthTimestamp: string; 
  lastEvolutionProcessedTimestamp: string; 
  initialSeed: string; // Changed to string as UInt64 comes as string
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
  genesVisibles: { [key: string]: string }; 
  genesOcultos: { [key: string]: string };
  homeostasisTargets: { [key: string]: string };
  birthTimestamp: string;
  lastEvolutionProcessedTimestamp: string;
  initialSeed: number; // Kept as number, will parse from string
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
        genesVisibles: creature.genesVisibles || {},
        genesOcultos: creature.genesOcultos || {},
        homeostasisTargets: creature.homeostasisTargets || {},
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
        cadence: MINT_WITH_PAYMENT_TRANSACTION,
        args: (arg, t) => [], 
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 9999 // Aumentado el límite de gas por si acaso
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
            arg("2000.0", t.UFix64),
            arg("300", t.UInt64) 
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
    <Box bg={bgColor} minH="100vh">
      <Header />
      <Container maxW="container.xl" pt={24} pb={12}> 
        <VStack spacing={8} align="stretch">
          <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'center', md: 'flex-start' }} justify="space-between" wrap="wrap">
            <Heading as="h1" size="xl" mb={{ base: 4, md: 0 }} color={textColor} mr={{md: 4}}>
              The Primordial Environment
            </Heading>
            <Spacer display={{base: "none", md: "block"}}/>
            <HStack spacing={4} mt={{base: 4, md:0}}>
                <Button 
                  colorScheme="primary"
                  onClick={handleMintCreature}
                  isLoading={isLoadingMint}
                  loadingText="Minting..."
                >
                  Mint New Creature (0.1 FLOW)
                </Button>
                <Button 
                  colorScheme="teal" 
                  onClick={handleProcessEvolutionAllCreatures}
                  isLoading={isProcessingEvolution}
                  loadingText="Evolving..."
                  disabled={creatures.length === 0 || !user.addr || isProcessingEvolution}
                >
                  Evolve All Creatures
                </Button>
            </HStack>
          </Flex>

          {isLoadingCreatures && <Spinner size="xl" alignSelf="center" color="primary.500" thickness="4px" />}

          {!isLoadingCreatures && creatures.length === 0 && user.addr && (
            <Text fontSize="lg" textAlign="center" color={textColor}>
              No creatures in this environment yet. Be the first to mint one!
            </Text>
          )}
          {!isLoadingCreatures && !user.addr && (
             <Text fontSize="lg" textAlign="center" color={textColor}>
              Connect your wallet to see the environment and your creatures.
            </Text>
          )}
          
          {/* Contenedor del Canvas - Se renderiza una sola vez y recibe todas las criaturas */}
          {!isLoadingCreatures && creatures.length > 0 && (
            <Box ref={canvasContainerRef} w="100%" display="flex" justifyContent="center" my={{ base: 4, md: 8 }} py={4} bg={useColorModeValue("gray.100", "gray.700")} borderRadius="md">
                 <CreatureCanvas 
                    creatures={creatures} // Pasa todas las criaturas
                    canvasWidth={canvasWidth} 
                    canvasHeight={canvasHeight} 
                  />
            </Box>
          )}

          <Box 
            display="grid" 
            gridTemplateColumns={{ base: "1fr", md: "repeat(auto-fill, minmax(300px, 1fr))" }} // Adjusted minmax for cards
            gap={6}
          >
            {creatures.map((creature) => {
              const hasEnoughEpForMinimum = parseFloatSafe(creature.puntosEvolucion, 0.0) >= MINIMUM_EP_FOR_MITOSIS;
              const canAttemptMitosis = creature.estaViva && hasEnoughEpForMinimum;
              
              return (
                <Box 
                  key={creature.id} 
                  p={4} // Slightly reduced padding for cards
                  shadow="md" 
                  borderWidth="1px" 
                  borderRadius="lg" 
                  bg={cardBgColor}
                  borderColor={useColorModeValue('neutral.200', 'neutral.600')}
                >
                  <VStack spacing={2.5} align="stretch">
                    <Flex align="center">
                      <Heading size="sm" color={textColor} noOfLines={1} title={creature.name || `Creature #${creature.id}`}>{creature.name || `Creature #${creature.id}`}</Heading>
                      <Spacer />
                      <Tag colorScheme={creature.estaViva ? "green" : "red"} ml={2} size="sm">
                        {creature.estaViva ? "Alive" : "Dead"}
                      </Tag>
                    </Flex>
                    
                    <Text fontSize="xs" color={useColorModeValue('neutral.600', 'neutral.300')} noOfLines={2}>{creature.description || "No description available."}</Text>
                    
                    <VStack spacing={0} align="stretch" fontSize="2xs">
                      <Text><strong>ID:</strong> {creature.id}</Text>
                      <Text><strong>Age:</strong> {parseFloat(creature.edadDiasCompletos).toFixed(2)} / {parseFloat(creature.lifespanTotalSimulatedDays).toFixed(2)} days</Text>
                      <Text><strong>EP:</strong> {parseFloat(creature.puntosEvolucion).toFixed(2)}</Text>
                      <Text><strong>Born:</strong> {new Date(parseFloat(creature.birthTimestamp) * 1000).toLocaleDateString()}</Text>
                    </VStack>

                    <ButtonGroup size="xs" spacing="2" mt={2}>
                        <Button 
                            colorScheme="purple"
                            onClick={() => {
                                setMitosisTargetCreature(creature);
                                setMitosisEpInput(MINIMUM_EP_FOR_MITOSIS.toFixed(1));
                                onOpenMitosisModal();
                            }}
                            isDisabled={!canAttemptMitosis || processingMitosisForId !== null} 
                        >
                            Mitosis...
                        </Button>
                    </ButtonGroup>

                  </VStack>
                </Box>
              );
            })}
          </Box>
          
          {/* Mitosis Modal */}
          {mitosisTargetCreature && (
            <Modal isOpen={isMitosisModalOpen} onClose={() => {
                onCloseMitosisModal();
                setProcessingMitosisForId(null);
            }} isCentered>
              <ModalOverlay />
              <ModalContent bg={cardBgColor}>
                <ModalHeader color={textColor}>Mitosis for Creature #{mitosisTargetCreature.id}</ModalHeader>
                <ModalCloseButton />
                <ModalBody color={textColor}>
                  <VStack spacing={4} align="stretch">
                    <Text>
                      <strong>Creature:</strong> {mitosisTargetCreature.name || `ID: ${mitosisTargetCreature.id}`}<br/>
                      <strong>Current EP:</strong> {parseFloatSafe(mitosisTargetCreature.puntosEvolucion, 0.0).toFixed(1)} EP
                    </Text>
                    <FormControl isRequired>
                      <FormLabel htmlFor={`ep-cost-${mitosisTargetCreature.id}`}>EP Cost for Mitosis (Minimum: {MINIMUM_EP_FOR_MITOSIS.toFixed(1)})</FormLabel>
                      <Input 
                        id={`ep-cost-${mitosisTargetCreature.id}`}
                        type="number"
                        value={mitosisEpInput}
                        onChange={(e) => setMitosisEpInput(e.target.value)}
                        min={MINIMUM_EP_FOR_MITOSIS}
                        max={parseFloatSafe(mitosisTargetCreature.puntosEvolucion, 0.0)}
                        step="0.1"
                      />
                    </FormControl>
                    {parseFloatSafe(mitosisEpInput, 0.0) < MINIMUM_EP_FOR_MITOSIS && (
                        <Text color="red.500" fontSize="sm">EP cost must be at least {MINIMUM_EP_FOR_MITOSIS.toFixed(1)}.</Text>
                    )}
                    {parseFloatSafe(mitosisEpInput, 0.0) > parseFloatSafe(mitosisTargetCreature.puntosEvolucion, 0.0) && (
                        <Text color="red.500" fontSize="sm">You do not have enough EP. Max: {parseFloatSafe(mitosisTargetCreature.puntosEvolucion, 0.0).toFixed(1)} EP.</Text>
                    )}
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={() => {
                      onCloseMitosisModal();
                      setProcessingMitosisForId(null);
                  }}>Cancel</Button>
                  <Button 
                    colorScheme="purple" 
                    onClick={handlePerformMitosis}
                    isLoading={processingMitosisForId === mitosisTargetCreature.id}
                    loadingText="Confirming..."
                    isDisabled={ 
                        processingMitosisForId !== null && processingMitosisForId !== mitosisTargetCreature.id || 
                        parseFloatSafe(mitosisEpInput, 0.0) < MINIMUM_EP_FOR_MITOSIS ||
                        parseFloatSafe(mitosisEpInput, 0.0) > parseFloatSafe(mitosisTargetCreature.puntosEvolucion, 0.0)
                    }
                  >
                    Confirm Mitosis ({parseFloatSafe(mitosisEpInput, MINIMUM_EP_FOR_MITOSIS).toFixed(1)} EP)
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          )}

          <Box textAlign="center" mt={8}>
            <NextLink href="/" passHref>
              <Button colorScheme="secondary" variant="outline">
                Back to Landing Page
              </Button>
            </NextLink>
          </Box>

        </VStack>
      </Container>
    </Box>
  );
} 