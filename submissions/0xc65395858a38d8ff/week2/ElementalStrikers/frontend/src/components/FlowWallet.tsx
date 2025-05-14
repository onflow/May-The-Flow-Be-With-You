'use client';

import { useEffect, useState } from 'react';
import * as fcl from '@onflow/fcl';
import { Button, Box, Text, VStack, HStack, Tag, StackProps } from '@chakra-ui/react'; // Usando Chakra UI
import { flowConfig } from '../../flow/config'; // Import aconfiguración

// No necesitas importar ../flow/config.js aquí si ya está en _app.tsx o layout.tsx

export default function FlowWallet() {
  const [user, setUser] = useState<{ addr?: string; loggedIn?: boolean }>({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Aplica la configuración de FCL
    fcl.config(flowConfig);

    // Suscribe a los cambios del usuario actual de FCL
    const unsubscribe = fcl.currentUser.subscribe(setUser);
    return () => unsubscribe(); // Limpia la suscripción al desmontar
  }, []);

  const handleLogin = async () => {
    // Log current discovery.wallet setting
    const discoveryWallet = await fcl.config().get("discovery.wallet");
    console.log("FCL Discovery Wallet before auth:", discoveryWallet);
    fcl.authenticate();
  };

  const handleLogout = () => {
    fcl.unauthenticate();
  };

  // Atributos para VStack y HStack que pueden causar problemas con el linter
  const vStackProps: { gap?: number; align?: 'stretch' } = {
    gap: 3,
    align: 'stretch' as const,
  };

  const innerVStackProps: { gap?: number; align?: 'stretch' } = {
    gap: 2,
    align: 'stretch' as const,
  };
  
  const hStackProps: { gap?: number; align?: 'center' } = {
    gap: 2, // Example for HStack if needed, adjust as necessary
    align: 'center' as const,
  };

  if (!isMounted) {
    return null; // Or a loading spinner, or a placeholder
  }

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} shadow="md">
      <VStack {...vStackProps}>
        <Text fontSize="xl" fontWeight="bold">
          Flow Wallet
        </Text>
        {user.loggedIn ? (
          <VStack {...innerVStackProps}>
            <HStack {...hStackProps}>
              <Text>Address:</Text>
              <Tag.Root size="md" variant="solid" colorScheme="teal">
                <Tag.Label>{user.addr}</Tag.Label>
              </Tag.Root>
            </HStack>
            <Button colorScheme="red" onClick={handleLogout} size="sm">
              Log Out
            </Button>
          </VStack>
        ) : (
          <Button colorScheme="blue" onClick={handleLogin} size="sm">
            Log In with Flow Wallet
          </Button>
        )}
      </VStack>
    </Box>
  );
} 