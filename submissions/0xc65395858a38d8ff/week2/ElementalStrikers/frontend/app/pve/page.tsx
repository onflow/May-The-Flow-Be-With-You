'use client';

import React, { useEffect, useState } from 'react';
import * as fcl from '@onflow/fcl';
import { Box, Heading, Text, Button, Container, Stack } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import PvEGame from '../../src/components/PvEGame';
import { setupAccount } from '../../flow/transactions';

interface User {
  addr?: string;
  loggedIn?: boolean;
}

export default function PvEPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
          setIsLoading(true);
          await setupAccount();
          setIsSetUp(true);
          alert('Cuenta configurada exitosamente');
        } catch (error) {
          console.error('Error al configurar la cuenta:', error);
          alert('No se pudo configurar la cuenta');
        } finally {
          setIsLoading(false);
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
          <Heading size="xl">Conecta tu Wallet</Heading>
          <Text textAlign="center" fontSize="lg">
            Conecta tu Flow Wallet para comenzar a jugar el modo PvE de ElementalStrikers
          </Text>
          <Button 
            colorScheme="teal" 
            size="lg" 
            onClick={handleLogin}
            loading={isLoading}
          >
            Conectar Wallet
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
          >
            Volver al Inicio
          </Button>
        </Stack>
      ) : (
        isLoading ? (
          <Stack direction="column" gap={8} align="center" justify="center" minH="70vh">
            <Heading size="md">Configurando tu cuenta...</Heading>
          </Stack>
        ) : (
          <PvEGame />
        )
      )}
    </Container>
  );
} 