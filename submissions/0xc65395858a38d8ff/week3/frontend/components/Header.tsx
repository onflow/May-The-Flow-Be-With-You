'use client';

import { Box, Button, Container, Flex, Heading, Spacer, Text, useColorMode, useColorModeValue, IconButton } from '@chakra-ui/react';
import { FaSun, FaMoon } from 'react-icons/fa';
// import { useState, useEffect } from 'react';
// import * as fcl from '@onflow/fcl';
// import '../flow/config'; // FCL Config

export default function Header() {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('neutral.100', 'neutral.900');
  const borderColor = useColorModeValue('neutral.200', 'neutral.700');

  // const [user, setUser] = useState<{ addr?: string; loggedIn?: boolean }>({});

  // useEffect(() => {
  //   fcl.currentUser.subscribe(setUser);
  // }, []);

  // const handleConnect = () => {
  //   fcl.logIn();
  // };

  // const handleDisconnect = () => {
  //   fcl.unauthenticate();
  // };

  // const handleSetupAccount = async () => {
  //   // Transaction code for setup_account.cdc will go here
  //   alert('Setup Account Clicked - Implement Transaction');
  // };

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
          <Button mr={4} /*onClick={user.loggedIn ? handleDisconnect : handleConnect}*/>
            {/* {user.loggedIn ? `Disconnect (${user.addr?.substring(0,6)}...)` : 'Connect Wallet'} */}
            Connect Wallet (Soon)
          </Button>
          {/* {user.loggedIn && ( */}
            <Button mr={4} /*onClick={handleSetupAccount}*/>Setup Account (Soon)</Button>
          {/* )} */}
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