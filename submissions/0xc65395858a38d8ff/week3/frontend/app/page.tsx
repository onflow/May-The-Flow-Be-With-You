'use client';

import { Box, Button, Container, Heading, Text, VStack, Link as ChakraLink, Icon, Flex, Spacer, useColorModeValue } from '@chakra-ui/react';
import NextLink from 'next/link';
import Header from '@/components/Header'; // We will create this

export default function HomePage() {
  const bgColor = useColorModeValue('neutral.50', 'neutral.800');
  const textColor = useColorModeValue('neutral.800', 'neutral.50');

  return (
    <Box bg={bgColor} color={textColor} minH="100vh">
      <Header />
      <Container maxW="container.xl" pt={16} pb={12}>
        <VStack spacing={10} textAlign="center">
          <Heading as="h1" size="3xl" fontWeight="bold">
            Welcome to Primordia
          </Heading>
          <Text fontSize="xl" maxW="3xl" lineHeight="tall">
            From the roiling heart of the Chaotic Nebula, a nascent world whispers its arrival - <strong>Primordia</strong>. Here, the raw energies of creation collide, birthing landscapes of impossible beauty and terrifying flux. You are a <strong>Genesis Shaper</strong>, an entity touched by the Echoes of the First Forging, imbued with the rare ability to perceive and sculpt the Anima – the very lifeblood of this emergent sphere.
          </Text>
          <Text fontSize="xl" maxW="3xl" lineHeight="tall">
            Your purpose is to enact the <strong>Genesis Protocol</strong>: to seed Primordia with life, to nurture fledgling elemental beings from mere motes of Anima into complex creatures of power and purpose. These are not mere beasts, Shaper, but living manifestations of Primordia's volatile will. Their forms shift, their abilities transmute, their destinies intertwine with the fate of this new reality.
          </Text>
          <Text fontSize="xl" maxW="3xl" lineHeight="tall">
            Uncover the ancient secrets veiled within Primordia's elemental strata. Guide your creations through trials of survival and evolution. For in the balance of their growth lies the key to Primordia's stability, and perhaps, to understanding the echoes of your own mysterious origin.
          </Text>
          
          <Box p={8} borderWidth={1} borderRadius="lg" bg={useColorModeValue('white', 'neutral.700')} shadow="xl" w="full" maxW="3xl">
            <Heading as="h2" size="xl" mb={6}>Roadmap to Ascension</Heading>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg"><strong>Phase 1: Genesis Incubation (Current)</strong> - Connect your essence (wallet), set up your shaping sanctum (account), and prepare to mint your first Primordial Life Forms.</Text>
              <Text fontSize="lg"><strong>Phase 2: Environmental Awakening (Soon)</strong> - Enter the digital habitat. Observe your first 5 creatures. Witness their first steps in a dynamic, simulated ecosystem.</Text>
              <Text fontSize="lg"><strong>Phase 3: Elemental Trials (Coming Soon)</strong> - Test your creatures' mettle in PvE challenges. Earn evolution points, unlock new genetic traits, and discover rare mutations.</Text>
              <Text fontSize="lg"><strong>Phase 4: The Crucible of Conflict (Future)</strong> - Engage in strategic PvP battles. Pit your evolved Strikers against others. Climb the ranks and prove your shaping mastery.</Text>
              <Text fontSize="lg"><strong>Phase 5: Post-Mortem Alchemy (Future)</strong> - Even in death, essence remains. Explore utility for creatures that have completed their lifecycle. Harvest their genetic data for advanced shaping techniques or to create powerful artifacts.</Text>
            </VStack>
          </Box>

          <Button 
            as={NextLink} 
            href="#" // Placeholder, will eventually go to /environment or similar
            colorScheme="primary"
            size="lg"
            px={8}
            py={6}
            isDisabled // For now, until core features are ready
          >
            Enter the Environment (Coming Soon)
          </Button>
        </VStack>
      </Container>
    </Box>
  );
} 