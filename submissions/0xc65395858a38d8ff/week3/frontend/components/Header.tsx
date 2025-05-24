'use client';

import { Box, Button, Container, Flex, Heading, Spacer, useColorMode, useColorModeValue, IconButton, useToast } from '@chakra-ui/react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';
import '@/flow/config'; // FCL Config - Adjusted path if tsconfig paths are set to root

// Cadence code for setup_account transaction
const SETUP_ACCOUNT_TX = `
import NonFungibleToken from "0xNonFungibleToken"
import CreatureNFTV5 from "0xCreatureNFTV5"

// Esta transacción configura una cuenta para usar CreatureNFTV5
// Crea una colección vacía y la guarda en el storage de la cuenta
// También establece links públicos para que otros puedan depositar criaturas

transaction {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Verificar si la colección ya existe
        if signer.storage.borrow<auth(Storage) &CreatureNFTV5.Collection>(from: CreatureNFTV5.CollectionStoragePath) == nil {
            // Crear una colección vacía
            let collection <- CreatureNFTV5.createEmptyCollection(nftType: Type<@CreatureNFTV5.NFT>())
            
            // Guardar la colección en el storage
            signer.storage.save(<-collection, to: CreatureNFTV5.CollectionStoragePath)

            // Crear un link público para la colección
            signer.capabilities.publish(
                signer.capabilities.storage.issue<&{NonFungibleToken.CollectionPublic, CreatureNFTV5.CollectionPublic}>(
                    CreatureNFTV5.CollectionStoragePath
                ),
                at: CreatureNFTV5.CollectionPublicPath
            )
            
            log("Cuenta configurada para usar CreatureNFTV5")
        } else {
            log("La cuenta ya está configurada para usar CreatureNFTV5")
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

  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
  }, []);

  const handleConnect = () => {
    fcl.logIn();
  };

  const handleDisconnect = () => {
    fcl.unauthenticate();
  };

  const handleSetupAccount = async () => {
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
        title: 'Cuenta Configurada!',
        description: 'Tu cuenta está lista para CreatureNFTV5.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

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
            isLoading={isLoading && !user.loggedIn} // Show loading on connect button if auth is in progress
          >
            {user.loggedIn ? `Desconectar (${user.addr?.substring(0,4)}...${user.addr?.substring(user.addr.length - 4)})` : 'Conectar Wallet'}
          </Button>
          {user.loggedIn && (
            <Button 
              mr={4} 
              onClick={handleSetupAccount} 
              isLoading={isLoading} // General loading for setup button
              colorScheme="secondary"
            >
              Configurar Cuenta
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