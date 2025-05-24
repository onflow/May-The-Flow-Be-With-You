'use client';

import { Box, Button, Container, Heading, Text, VStack, Spinner, useToast, useColorModeValue, Code, Image, Flex, Spacer, Tag } from '@chakra-ui/react';
import { useEffect, useState, useRef } from 'react';
import * as fcl from '@onflow/fcl';
import Header from '@/components/Header';
import NextLink from 'next/link';
import CreatureCanvas, { CreatureCanvasProps } from '@/components/CreatureCanvas';

// Contenido del script week3/frontend/flow/scripts/get_active_creatures.cdc
const GET_ACTIVE_CREATURES_SCRIPT = `
import CreatureNFTV5 from 0xCreatureNFTV5
import MetadataViews from 0xMetadataViews

// Este script devuelve información sobre todas las criaturas vivas en una colección
// Útil para mostrar las criaturas disponibles para reproducción y visualización en el frontend

access(all) struct CreatureUIData {
    access(all) let id: UInt64
    access(all) let name: String
    access(all) let description: String
    access(all) let thumbnail: String
    access(all) let edadDiasCompletos: UFix64
    access(all) let lifespanTotalSimulatedDays: UFix64
    access(all) let puntosEvolucion: UFix64
    access(all) let genesVisibles: {String: UFix64}
    access(all) let initialSeed: UInt64
    access(all) let seedChangeCount: UFix64
    access(all) let estaViva: Bool

    init(
        id: UInt64,
        name: String,
        description: String,
        thumbnail: String,
        edadDiasCompletos: UFix64,
        lifespanTotalSimulatedDays: UFix64,
        puntosEvolucion: UFix64,
        genesVisibles: {String: UFix64},
        initialSeed: UInt64,
        seedChangeCount: UFix64,
        estaViva: Bool
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.thumbnail = thumbnail
        self.edadDiasCompletos = edadDiasCompletos
        self.lifespanTotalSimulatedDays = lifespanTotalSimulatedDays
        self.puntosEvolucion = puntosEvolucion
        self.genesVisibles = genesVisibles
        self.initialSeed = initialSeed
        self.seedChangeCount = seedChangeCount
        self.estaViva = estaViva
    }
}

access(all) fun main(userAddress: Address): [CreatureUIData] {
    // Obtener referencia a la colección pública
    let collectionRef = getAccount(userAddress)
        .capabilities.get<&{CreatureNFTV5.CollectionPublic}>(CreatureNFTV5.CollectionPublicPath)
        .borrow() ?? panic("No se pudo obtener la colección pública")
    
    // Obtener los IDs de criaturas activas
    let activeIDs = collectionRef.getActiveCreatureIDs()
    
    // Crear array para almacenar datos de criaturas
    let creaturesResult: [CreatureUIData] = []
    
    // Obtener datos para cada criatura activa
    for id in activeIDs {
        let creatureRef = collectionRef.borrowCreatureNFT(id: id)
            ?? panic("No se encontró la criatura con ID ".concat(id.toString()))
        
        // Obtener thumbnail desde MetadataViews
        var currentThumbnail = "/assets/primordia-sigil.png"
        let displayView = creatureRef.resolveView(Type<MetadataViews.Display>())
        if let display = displayView as? MetadataViews.Display {
            if let httpFile = display.thumbnail as? MetadataViews.HTTPFile {
                currentThumbnail = httpFile.url
            } else if let ipfsFile = display.thumbnail as? MetadataViews.IPFSFile {
                currentThumbnail = "ipfs://".concat(ipfsFile.cid)
            }
        }

        // Copiar el diccionario genesVisibles para resolver el type mismatch
        let genesVisiblesActual: {String: UFix64} = {}
        let genesSourceRef = creatureRef.genesVisibles // This is &{String: UFix64} according to the error
        for key in genesSourceRef.keys {
            genesVisiblesActual[key] = genesSourceRef[key]! // Accessing key on ref gives UFix64?
        }

        let creatureData = CreatureUIData(
            id: id,
            name: creatureRef.name,
            description: creatureRef.description,
            thumbnail: currentThumbnail,
            edadDiasCompletos: creatureRef.edadDiasCompletos,
            lifespanTotalSimulatedDays: creatureRef.lifespanTotalSimulatedDays,
            puntosEvolucion: creatureRef.puntosEvolucion,
            genesVisibles: genesVisiblesActual, // Use the copy
            initialSeed: creatureRef.initialSeed,
            seedChangeCount: creatureRef.homeostasisTargets["_seedChangeCount"] ?? 0.0,
            estaViva: creatureRef.estaViva
        )
        
        creaturesResult.append(creatureData)
    }
    
    return creaturesResult
}
`;

// Contenido de week3/frontend/flow/transactions/mint_with_payment.cdc
const MINT_WITH_PAYMENT_TRANSACTION = `
import FungibleToken from 0xFungibleToken
import FlowToken from 0xFlowToken
import NonFungibleToken from 0xNonFungibleToken
import MetadataViews from 0xMetadataViews
import CreatureNFTV5 from 0xCreatureNFTV5

// Esta transacción permite crear una nueva criatura pagando 0.1 Flow
// El pago va a la cuenta que tiene el Minter
// Los genes y atributos se generan aleatoriamente como en mint_creature.cdc

transaction() {
    // Referencia a la colección del usuario
    let collectionRef: &CreatureNFTV5.Collection
    
    // Referencia a la billetera del usuario para pagar
    let paymentVault: @{FungibleToken.Vault} // Corregido al tipo de interfaz
    
    // Referencia al Minter
    let minterRef: &CreatureNFTV5.NFTMinter
    
    // Referencia a la billetera del propietario del contrato para recibir el pago
    let recipientRef: &{FungibleToken.Receiver}

    // Variables para almacenar los atributos generados aleatoriamente (from mint_creature.cdc)
    let genesVisibles: {String: UFix64}
    let genesOcultos: {String: UFix64}
    let initialPuntosEvolucion: UFix64
    let lifespanDays: UFix64
    
    prepare(signer: auth(Storage, FungibleToken.Withdraw, PublishCapability, IssueStorageCapabilityController) &Account) {
        // Obtener información del bloque actual para generar aleatoriedad (from mint_creature.cdc)
        let currentBlock = getCurrentBlock()
        let blockHeight = currentBlock.height
        let timestamp = currentBlock.timestamp
        
        let blockHeightInt = Int(blockHeight)
        let timestampIntegerPart = UInt64(timestamp)
        let timestampFractionalPart = timestamp - UFix64(timestampIntegerPart)
        let timestampFractionalAsUInt64 = UInt64(timestampFractionalPart * 1000000.0)
        let timestampInt = Int(timestampIntegerPart) + Int(timestampFractionalAsUInt64)

        // Verificar que el receptor tiene una colección (from mint_creature.cdc)
        if signer.storage.borrow<&CreatureNFTV5.Collection>(from: CreatureNFTV5.CollectionStoragePath) == nil {
            signer.storage.save(<-CreatureNFTV5.createEmptyCollection(nftType: Type<@CreatureNFTV5.NFT>()), to: CreatureNFTV5.CollectionStoragePath)
            signer.capabilities.publish(
                signer.capabilities.storage.issue<&{NonFungibleToken.CollectionPublic, CreatureNFTV5.CollectionPublic}>(CreatureNFTV5.CollectionStoragePath),
                at: CreatureNFTV5.CollectionPublicPath
            )
            log("Colección de CreatureNFTV5 creada para el signer.")
        }
        
        // Obtener la colección del usuario
        self.collectionRef = signer.storage.borrow<auth(Storage) &CreatureNFTV5.Collection>(
            from: CreatureNFTV5.CollectionStoragePath
        ) ?? panic("No se pudo obtener referencia a la colección. Asegúrate de que la cuenta esté configurada correctamente.")
        
        // Verificar si hay espacio para otra criatura
        if self.collectionRef.getActiveCreatureCount() >= CreatureNFTV5.MAX_ACTIVE_CREATURES {
            panic("Límite máximo de criaturas vivas alcanzado (".concat(CreatureNFTV5.MAX_ACTIVE_CREATURES.toString()).concat("No se puede crear más criaturas."))
        }
        
        // Obtener referencia a la billetera de Flow del usuario
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("No se pudo obtener referencia a la billetera de Flow")
        
        // Crear un pago de 0.1 Flow
        self.paymentVault <- vaultRef.withdraw(amount: 0.1)
        
        // Obtener referencia al minter del contrato desde la cuenta del propietario del contrato
        // Asume que el propietario (0x2444e6b4d9327f09) ha publicado una capacidad para el NFTMinter
        // en /public/CreatureNFTV5Minter
        self.minterRef = getAccount(0x2444e6b4d9327f09)
            .capabilities.borrow<&CreatureNFTV5.NFTMinter>(/public/CreatureNFTV5Minter)
            ?? panic("No se pudo obtener referencia al Minter del contrato en 0x2444e6b4d9327f09. Asegúrate de que la capacidad esté publicada en /public/CreatureNFTV5Minter.")
            
        // Obtener referencia a la billetera del propietario del contrato
        self.recipientRef = getAccount(0x2444e6b4d9327f09) // Dirección del propietario del contrato
            .capabilities
            .borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("No se pudo obtener referencia a la billetera del propietario del contrato. Asegúrate de que esté configurada.")

        // Generar genes visibles aleatorios (from mint_creature.cdc)
        self.genesVisibles = {
            "colorR": UFix64( (timestampInt + blockHeightInt) % 256) / 255.0,
            "colorG": UFix64( (timestampInt / 2 + blockHeightInt * 2) % 256) / 255.0,
            "colorB": UFix64( (timestampInt * 2 + blockHeightInt / 2) % 256) / 255.0,
            "tamanoBase": 0.5 + (UFix64( (blockHeightInt + timestampInt) % 501) / 1000.0),
            "formaPrincipal": 1.0 + UFix64( (timestampInt + 77) % 5),
            "numApendices": UFix64( (blockHeightInt + 123) % 6),
            "patronMovimiento": 1.0 + UFix64( (timestampInt + blockHeightInt + 234) % 4)
        }
        
        // Calcular valores de genes ocultos (from mint_creature.cdc)
        let normTamanoBase = (self.genesVisibles["tamanoBase"]! - 0.5) * 2.0 
        let tendenciaTamanoPositiva = normTamanoBase > 0.5 ? (normTamanoBase - 0.5) * 2.0 : 0.0
        let tendenciaTamanoNegativa = normTamanoBase < 0.5 ? (0.5 - normTamanoBase) * 2.0 : 0.0
        let formaActual = self.genesVisibles["formaPrincipal"]! 
        let numApendicesActual = self.genesVisibles["numApendices"]! 
        let normNumApendices = numApendicesActual / 5.0
        
        self.genesOcultos = {
            "tasaMetabolica": 0.1 + (UFix64( (timestampInt + 300) % 900) / 1000.0),
            "fertilidad": 0.1 + (UFix64( (timestampInt + 450) % 900) / 1000.0),
            "potencialEvolutivo": 0.1 + (UFix64( (timestampInt + 600) % 900) / 1000.0),
            "max_lifespan_dias_base": 7.0,
            "puntosSaludMax": 50.0 + (tendenciaTamanoPositiva * 50.0) + (formaActual == 2.0 ? 25.0 : (formaActual == 4.0 ? 15.0 : 0.0)),
            "ataqueBase": 10.0 + (formaActual == 3.0 ? 15.0 : (formaActual == 5.0 ? 20.0 : 0.0)) + (normNumApendices * 20.0) + (tendenciaTamanoPositiva * 10.0),
            "defensaBase": 10.0 + (formaActual == 2.0 ? 15.0 : (formaActual == 4.0 ? 20.0 : 0.0)) + (tendenciaTamanoPositiva * 15.0),
            "agilidadCombate": 0.2 + (formaActual == 1.0 ? 0.3 : (formaActual == 5.0 ? 0.1 : 0.0)) + (tendenciaTamanoNegativa * 0.3)
        }
        
        self.initialPuntosEvolucion = 5.0 + (UFix64( (blockHeightInt + timestampInt) % 151) / 10.0)
        self.lifespanDays = 7.0 // Fijo como en mint_creature.cdc
    }
    
    execute {
        // Depositar el pago en la cuenta del propietario del contrato
        self.recipientRef.deposit(from: <-self.paymentVault)
        
        // Usar el thumbnail fijo de mint_creature.cdc
        let thumbnailURL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzEyMzQ1NiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIj5FbGVtZW50YWwgU3RyaWtlcjwvdGV4dD48L3N2Zz4="

        // Crear la nueva criatura usando el minter con valores generados
        let newCreature <- self.minterRef.createNFT(
            name: "", // Nombre vacío como en mint_creature.cdc
            description: "", // Descripción vacía como en mint_creature.cdc
            thumbnail: thumbnailURL, // Thumbnail fijo
            birthBlockHeight: getCurrentBlock().height,
            initialGenesVisibles: self.genesVisibles,
            initialGenesOcultos: self.genesOcultos,
            initialPuntosEvolucion: self.initialPuntosEvolucion,
            lifespanDays: self.lifespanDays,
            initialEdadDiasCompletos: 0.0,
            initialEstaViva: true,
            initialHomeostasisTargets: {}
        )
        
        // Depositar la nueva criatura en la colección del usuario
        self.collectionRef.deposit(token: <-newCreature)
        
        log("¡Nueva criatura creada exitosamente con pago y genes aleatorios!")
        log("Puntos de Evolución iniciales: ".concat(self.initialPuntosEvolucion.toString()))
        log("Lifespan (días): ".concat(self.lifespanDays.toString()))
        log("Gen 'tamanoBase': ".concat(self.genesVisibles["tamanoBase"]!.toString()))
        log("Gen 'potencialEvolutivo': ".concat(self.genesOcultos["potencialEvolutivo"]!.toString()))
    }
}
`;

// Actualizada para coincidir con CreatureUIData del script Cadence
interface CreatureUIDataFrontend {
  id: number; 
  name: string;
  description: string;
  thumbnail: string;
  edadDiasCompletos: string; // UFix64
  lifespanTotalSimulatedDays: string; // UFix64
  puntosEvolucion: string; // UFix64
  genesVisibles: { [key: string]: string }; // {String: UFix64}
  initialSeed: number; // UInt64
  seedChangeCount: string; // UFix64
  estaViva: boolean;
}

export default function EnvironmentPage() {
  const [user, setUser] = useState<{ addr?: string; loggedIn?: boolean }>({});
  const [creatures, setCreatures] = useState<CreatureUIDataFrontend[]>([]); // Tipo actualizado
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAccountStatus, setIsLoadingAccountStatus] = useState(true);
  const [isAccountConfigured, setIsAccountConfigured] = useState(false);
  const [isMinting, setIsMinting] = useState(false); // Nuevo estado para la acuñación
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const mintToastIdRef = useRef<ReturnType<typeof toast> | undefined>();

  const canvasContainerRef = useRef<HTMLDivElement>(null); // Ref para el contenedor del canvas
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
  }, []);

  useEffect(() => {
    if (user.addr) {
      const configuredStatus = localStorage.getItem(`primordia_account_configured_${user.addr}`);
      setIsAccountConfigured(configuredStatus === 'true');
    } else {
      setIsAccountConfigured(false);
    }
    setIsLoadingAccountStatus(false);
  }, [user.addr]);

  // Efecto para ajustar el tamaño del canvas al tamaño de su contenedor
  useEffect(() => {
    function handleResize() {
      if (canvasContainerRef.current) {
        // Dejar un pequeño padding si es necesario
        const padding = 20; 
        const newWidth = canvasContainerRef.current.offsetWidth - padding;
        // Mantener una proporción o altura fija si se desea, aquí usamos una altura más o menos fija
        setCanvasDimensions({ width: newWidth > 0 ? newWidth : 300, height: 400 }); 
      }
    }
    window.addEventListener('resize', handleResize);
    handleResize(); // Llamar una vez al montar para establecer tamaño inicial
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasContainerRef]); // Depende de la ref

  const fetchCreatures = async () => {
    if (user.addr && isAccountConfigured) { 
      setIsLoading(true);
      setError(null);
      try {
        const userAddress = user.addr; 
        const result = await fcl.query({
          cadence: GET_ACTIVE_CREATURES_SCRIPT,
          args: (arg, t) => [arg(userAddress, t.Address)]
        });
        console.log("Creatures data from script:", result);
        setCreatures(result as CreatureUIDataFrontend[]); 
      } catch (err: any) {
        console.error("Error fetching creatures:", err);
        setError(err.message || "Error desconocido al cargar criaturas.");
        toast({ title: 'Error al Cargar Criaturas', description: err.message, status: 'error', duration: 5000, isClosable: true });
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!isLoadingAccountStatus) { 
        if (user.addr && !isAccountConfigured) {
            setIsLoading(false);
            setError("La cuenta no está configurada. Por favor, configúrala desde el Header.");
        } else if (user.addr && isAccountConfigured) {
            fetchCreatures();
        } else if (!user.addr) {
            setIsLoading(false);
            setError("Conecta tu wallet para ver el ambiente.");
        }
    }
  }, [user.addr, isAccountConfigured, isLoadingAccountStatus, toast]);

  const handleMintCreature = async () => {
    if (!user.addr) {
      toast({ title: 'Error', description: 'Conecta tu wallet primero.', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    setIsMinting(true);
    mintToastIdRef.current = toast({ 
        title: 'Acuñando Criatura...', 
        description: 'Enviando transacción...', 
        status: 'info', 
        duration: null, // Se mantiene abierto hasta que se actualice o cierre manualmente
        isClosable: false 
    });

    try {
      const transactionId = await fcl.mutate({
        cadence: MINT_WITH_PAYMENT_TRANSACTION,
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 9999, // Límite de gas
        args: (arg, t) => [] // Sin argumentos para esta transacción
      });
      
      if (mintToastIdRef.current) {
        toast.update(mintToastIdRef.current, { 
            title: 'Transacción Enviada', 
            description: `ID: ${transactionId}. Esperando confirmación...`, 
            status: 'info', 
            duration: null, 
            isClosable: false 
        });
      }

      await fcl.tx(transactionId).onceSealed();
      
      if (mintToastIdRef.current) {
        toast.update(mintToastIdRef.current, { 
            title: '¡Criatura Acuñada!', 
            description: 'Tu nueva criatura ha llegado al ambiente.', 
            status: 'success', 
            duration: 5000, 
            isClosable: true 
        });
      }
      fetchCreatures(); // Refrescar la lista de criaturas
    } catch (error: any) {
      console.error('Error minting creature:', error);
      if (mintToastIdRef.current) {
        toast.update(mintToastIdRef.current, { 
            title: 'Error al Acuñar', 
            description: error.message || 'Ocurrió un error desconocido.', 
            status: 'error', 
            duration: 7000, 
            isClosable: true 
        });
      } else {
        toast({ 
            title: 'Error al Acuñar', 
            description: error.message || 'Ocurrió un error desconocido.', 
            status: 'error', 
            duration: 7000, 
            isClosable: true 
        });
      }
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <Box>
      <Header />
      <Container maxW="container.xl" pt={{ base: 24, md: 32 }} pb={20}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl" textAlign="center" color="primary.300">
            Primordia Habitat
          </Heading>

          {user.loggedIn && isAccountConfigured && (
            <Button
              colorScheme="teal"
              onClick={handleMintCreature}
              isLoading={isMinting}
              loadingText="Acuñando..."
              isDisabled={isLoading || isLoadingAccountStatus || isMinting}
              mb={4}
            >
              Acuñar Nueva Criatura (0.1 FLOW)
            </Button>
          )}

          <Box 
            ref={canvasContainerRef}
            minH="450px"
            w="full"
            bg={useColorModeValue('gray.100', 'gray.700')} 
            borderRadius="md" 
            p={4}
            display="flex"
            flexDirection="column" 
            alignItems="center"
            justifyContent="center"
          >
            {isLoading || isLoadingAccountStatus ? (
              <Spinner size="xl" />
            ) : error ? (
              <Text color="red.500" textAlign="center">{error}</Text>
            ) : !isAccountConfigured ? (
                <Text>Por favor, conecta tu wallet y configura tu cuenta para ver el hábitat.</Text>
            ) : creatures.length === 0 && isAccountConfigured ? (
              <Text>No se encontraron criaturas activas en tu colección. ¡Minea una nueva!</Text>
            ) : (
              <CreatureCanvas 
                creatures={creatures} 
                canvasWidth={canvasDimensions.width} 
                canvasHeight={canvasDimensions.height} 
              />
            )}
          </Box>

          {!(isLoading || isLoadingAccountStatus) && !error && isAccountConfigured && creatures.length > 0 && (
            <VStack spacing={4} align="stretch" w="full" mt={6}>
              <Heading size="md" textAlign="center">Detalles de Criaturas Activas</Heading>
              {creatures.filter(c => c.estaViva).map(c => (
                <Box key={c.id} p={3} borderWidth={1} borderRadius="md" shadow="sm" bg={useColorModeValue('whiteAlpha.800', 'blackAlpha.300')}>
                  <Flex alignItems="center">
                      <Image src={c.thumbnail} alt={c.name} boxSize="50px" borderRadius="md" mr={4} fallbackSrc="/assets/primordia-sigil.png" />
                      <Box>
                          <Text fontWeight="bold">{c.name || "Criatura Sin Nombre"} (ID: {c.id})</Text>
                          <Text fontSize="xs">{c.description || "Sin descripción."}</Text>
                      </Box>
                      <Spacer />
                      <Tag size="sm" colorScheme={c.estaViva ? "green" : "red"}>{c.estaViva ? "Viva" : "Muerta"}</Tag>
                  </Flex>
                  <Text fontSize="sm" mt={2}>Edad: {parseFloat(c.edadDiasCompletos).toFixed(2)} días | Vida: {parseFloat(c.lifespanTotalSimulatedDays).toFixed(2)} días | EP: {parseFloat(c.puntosEvolucion).toFixed(2)}</Text>
                  <Text fontSize="xs">Seed: {c.initialSeed} (Cambios: {c.seedChangeCount})</Text>
                  <Code mt={1} p={2} borderRadius="sm" fontSize="xs" w="full" overflowX="auto" whiteSpace="pre-wrap">{JSON.stringify(c.genesVisibles, null, 2)}</Code>
                </Box>
              ))}
            </VStack>
          )}

          <NextLink href="/" passHref>
            <Button variant="outline">Volver al Inicio</Button>
          </NextLink>
        </VStack>
      </Container>
    </Box>
  );
} 