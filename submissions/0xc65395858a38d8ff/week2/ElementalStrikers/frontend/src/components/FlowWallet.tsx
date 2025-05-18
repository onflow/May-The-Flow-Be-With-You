'use client';

import { useEffect, useState } from 'react';
import * as fcl from '@onflow/fcl';
import { 
  Button, 
  Flex
} from '@chakra-ui/react';

interface User {
  addr: string | null;
  loggedIn: boolean | null;
}

export default function FlowWallet() {
  const [user, setUser] = useState<User>({ addr: null, loggedIn: null });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const unsubscribe = fcl.currentUser.subscribe((newUser: User) => {
      setUser(newUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    fcl.authenticate();
  };

  const handleLogout = () => {
    fcl.unauthenticate();
  };

  // Formatear la dirección para mostrar
  const formatAddress = (address: string | null): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (!isMounted) {
    return null;
  }

  if (!user.loggedIn) {
    return (
      <Button 
        colorScheme="teal" 
        variant="outline"
        color="white"
        borderColor="white"
        _hover={{ bg: 'teal.600' }}
        onClick={handleLogin}
      >
        Conectar Wallet
      </Button>
    );
  }

  return (
    <Flex align="center">
      <Button 
        variant="ghost"
        color="white"
        onClick={handleLogout}
        _hover={{ bg: 'teal.700' }}
      >
        {formatAddress(user.addr)}
      </Button>
    </Flex>
  );
} 