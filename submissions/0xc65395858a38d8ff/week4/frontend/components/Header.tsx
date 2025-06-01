'use client';

import { Box, Button, Container, Flex, Heading, Spacer, useColorMode, useColorModeValue, IconButton, useToast } from '@chakra-ui/react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';
import '@/flow/config'; // FCL Config

// Cadence code for setup_account transaction
const SETUP_ACCOUNT_TX = `
import NonFungibleToken from 0xNonFungibleToken
import EvolvingCreatureNFT from 0xEvolvingCreatureNFT

// Esta transacción configura una cuenta para usar EvolvingCreatureNFT
// Crea una colección vacía y la guarda en el storage de la cuenta
// También establece links públicos para que otros puedan depositar criaturas

transaction {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Verificar si la colección ya existe
        if signer.storage.borrow<&EvolvingCreatureNFT.Collection>(from: EvolvingCreatureNFT.CollectionStoragePath) == nil {
            // Crear una colección vacía
            let collection <- EvolvingCreatureNFT.createEmptyCollection(nftType: Type<@EvolvingCreatureNFT.NFT>())
            
            // Guardar la colección en el storage
            signer.storage.save(<-collection, to: EvolvingCreatureNFT.CollectionStoragePath)

            // Crear un link público para la colección
            let cap = signer.capabilities.storage.issue<&EvolvingCreatureNFT.Collection>(EvolvingCreatureNFT.CollectionStoragePath)
            signer.capabilities.publish(cap, at: EvolvingCreatureNFT.CollectionPublicPath)
            
            log("Cuenta configurada para usar EvolvingCreatureNFT")
        } else {
            log("La cuenta ya está configurada para usar EvolvingCreatureNFT")
        }
    }
} 
`;

export default function Header() {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('neutral.100', 'neutral.900');
  const borderColor = useColorModeValue('neutral.200', 'neutral.700');
  const toast = useToast();

  const [user, setUser] = useState<{ addr?: string; loggedIn?: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAccountConfigured, setIsAccountConfigured] = useState(false);

  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
  }, []);

  // Efecto para verificar el estado de configuración de la cuenta desde localStorage
  useEffect(() => {
    if (user.addr) {
      const configuredStatus = localStorage.getItem(`primordia_account_configured_${user.addr}`);
      if (configuredStatus === 'true') {
        setIsAccountConfigured(true);
      } else {
        setIsAccountConfigured(false); // Asegurarse de resetear si no está configurada o el usuario cambia
      }
    } else {
      setIsAccountConfigured(false); // Resetear si no hay usuario
    }
  }, [user.addr]); // Depende de user.addr para re-evaluar cuando el usuario cambia

  const handleConnect = () => {
    fcl.logIn();
  };

  const handleDisconnect = () => {
    fcl.unauthenticate();
    // Opcional: podrías querer limpiar el estado de configuración si se desconecta,
    // pero normalmente se mantiene por si vuelve a conectar con la misma cuenta.
  };

  const handleSetupAccount = async () => {
    if (!user.addr) {
      toast({ title: 'Error', description: 'Usuario no conectado.', status: 'error' });
      return;
    }
    setIsLoading(true);
    try {
      const transactionId = await fcl.mutate({
        cadence: SETUP_ACCOUNT_TX,
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 999
      });

      toast({
        title: 'Transacción Enviada',
        description: `Setup Account TX: ${transactionId}. Esperando sellado...`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      await fcl.tx(transactionId).onceSealed();
      
      toast({
        title: 'Cuenta Configurada',
        description: 'Tu cuenta está lista para EvolvingCreatureNFT.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Guardar estado en localStorage y actualizar estado local
      localStorage.setItem(`primordia_account_configured_${user.addr}`, 'true');
      setIsAccountConfigured(true);

    } catch (error: any) {
      console.error("Error en Setup Account TX:", error);
      toast({
        title: 'Error en Setup Account',
        description: error?.message || 'Ocurrió un error al configurar la cuenta.',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      as="header" 
      bg={bgColor}
      borderBottomWidth="1px"
      borderColor={borderColor}
      py={3}
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex="sticky"
      shadow="sm"
    >
      <Container maxW="container.xl">
        <Flex align="center">
          <Heading as="h1" size="lg" color="primary.500">
            Primordia: Genesis Protocol
          </Heading>
          <Spacer />
          <Button 
            mr={4} 
            onClick={user.loggedIn ? handleDisconnect : handleConnect}
            isLoading={isLoading && !user.loggedIn} 
          >
            {user.loggedIn ? `Desconectar (${user.addr?.substring(0,4)}...${user.addr?.substring(user.addr.length - 4)})` : 'Conectar Wallet'}
          </Button>
          {user.loggedIn && (
            <Button 
              mr={4} 
              onClick={handleSetupAccount} 
              isLoading={isLoading && !isAccountConfigured} // Solo muestra loading si no está configurada y se está configurando
              colorScheme={isAccountConfigured ? "green" : "secondary"}
              isDisabled={isAccountConfigured || isLoading} // Deshabilitar si ya está configurada o si alguna operación (conexión/setup) está en curso
            >
              {isAccountConfigured ? 'Cuenta Configurada' : 'Configurar Cuenta'}
            </Button>
          )}
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
            onClick={toggleColorMode}
            variant="ghost"
          />
        </Flex>
      </Container>
    </Box>
  );
} 