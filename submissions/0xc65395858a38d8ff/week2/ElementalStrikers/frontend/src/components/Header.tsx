'use client';

import React from 'react';
import { Box, Flex, Heading, Spacer, Image } from '@chakra-ui/react';
import FlowWallet from './FlowWallet'; // Assuming FlowWallet is in the same directory or adjust path

const Header: React.FC = () => {
  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      wrap="wrap"
      padding="1.5rem"
      bg="teal.500" // Example background color, can be themed
      color="white" // Example text color
      boxShadow="md"
    >
      <Flex align="center" mr={5}>
        <Image src="/assets/icons/lorc/vortex.png" alt="Elemental Strikers Logo" boxSize="50px" mr="10px" />
        <Heading as="h1" size="lg" letterSpacing={'tighter'}>
          Elemental Strikers
        </Heading>
      </Flex>

      <Spacer />

      <Box>
        <FlowWallet />
      </Box>
    </Flex>
  );
};

export default Header; 