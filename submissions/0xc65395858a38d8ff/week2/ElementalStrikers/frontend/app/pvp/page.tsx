'use client';

import React, { useEffect, useState } from 'react';
import * as fcl from '@onflow/fcl';
import { Heading, Text, Button, Container, Stack } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import AvailableGames from '../../src/components/AvailableGames';
import { setupAccount } from '../../flow/transactions';

interface User {
  addr?: string;
  loggedIn?: boolean;
}

export default function PvPPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSetUp, setIsSetUp] = useState(false);
  const router = useRouter();

  // Suscribirse a cambios en la autenticación
  useEffect(() => {
    const unsubscribe = fcl.currentUser.subscribe(setUser);
    return () => unsubscribe();
  }, []);

  // Configurar la cuenta si está autenticado
  useEffect(() => {
    const checkAndSetupAccount = async () => {
      if (user?.loggedIn && !isSetUp) {
        try {
          setLoading(true);
          await setupAccount();
          setIsSetUp(true);
        } catch (error) {
          console.error('Error setting up account:', error);
          alert('Could not set up account');
        } finally {
          setLoading(false);
        }
      }
    };

    checkAndSetupAccount();
  }, [user, isSetUp]);

  // Función para iniciar sesión
  const handleLogin = () => {
    fcl.authenticate();
  };

  return (
    <Container maxW="container.xl" py={8}>
      {!user?.loggedIn ? (
        <Stack direction="column" gap={8} align="center" justify="center" minH="70vh">
          <Heading size="xl">Connect Your Wallet</Heading>
          <Text textAlign="center" fontSize="lg">
            Connect your Flow Wallet to start playing PvP mode of ElementalStrikers
          </Text>
          <Button 
            colorScheme="teal" 
            size="lg" 
            onClick={handleLogin}
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
          >
            Back to Home
          </Button>
        </Stack>
      ) : (
        loading ? (
          <Stack direction="column" gap={8} align="center" justify="center" minH="70vh">
            <Heading size="md">Setting up your account...</Heading>
          </Stack>
        ) : (
          <AvailableGames />
        )
      )}
    </Container>
  );
} 