'use client';

import { Box, Button, Container, Heading, Text, VStack, Link as ChakraLink, Icon, Flex, Spacer, useColorModeValue, Divider, Card, CardBody, Tag, SimpleGrid, Image } from '@chakra-ui/react';
import NextLink from 'next/link';
import Header from '@/components/Header'; 
import { FiLogIn, FiZap, FiEye, FiShield, FiHexagon } from 'react-icons/fi';
import { motion } from 'framer-motion';

// Motion-wrapped Chakra components
const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);
const MotionVStack = motion(VStack);
const MotionButton = motion(Button);
const MotionCard = motion(Card);
const MotionImage = motion(Image);

const pageTransitionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

const heroVariants = {
  hidden: { opacity: 0, y: -50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.2, duration: 0.8, ease: "easeOut" }
  }
};

const sigilVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.5, duration: 1, type: "spring", stiffness: 100 }
  }
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.5,
      ease: "easeInOut"
    }
  })
};

export default function HomePage() {
  const textColor = useColorModeValue('neutral.800', 'neutral.100');
  const headingColor = useColorModeValue('primary.600', 'primary.300');
  const loreTextColor = useColorModeValue('neutral.700', 'neutral.200');
  const sectionBg = useColorModeValue('rgba(255, 255, 255, 0.05)', 'rgba(26, 32, 44, 0.5)'); // For LORE section if needed
  const roadmapBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)');
  const cardBg = useColorModeValue('rgba(247, 250, 252, 0.9)', 'rgba(45, 55, 72, 0.85)');
  const borderColor = useColorModeValue('neutral.300', 'neutral.700');
  const cardBorderColor = useColorModeValue('neutral.200', 'neutral.600');

  const cardHover = {
    hover: {
      y: -6,
      scale: 1.03,
      boxShadow: useColorModeValue("0px 12px 25px rgba(0, 0, 0, 0.15)", "0px 12px 25px rgba(0, 144, 255, 0.25)"),
      transition: { duration: 0.25, ease: "easeOut" }
    }
  };

  const phases = [
    { title: "Phase 1: Genesis Incubation", description: "Connect your essence, set up your sanctum, and mint your first Primordial Life Forms.", icon: FiZap, status: "Current", statusColorScheme: "green"},
    { title: "Phase 2: Environmental Awakening", description: "Enter the habitat. Observe your creatures. Witness their first steps in a dynamic ecosystem.", icon: FiEye, status: "Soon", statusColorScheme: "blue"},
    { title: "Phase 3: Elemental Trials", description: "Test your creatures' mettle in PvE. Earn evolution points, unlock traits, discover mutations.", icon: FiShield, status: "Coming Soon", statusColorScheme: "purple"},
    { title: "Phase 4: The Crucible of Conflict", description: "Engage in strategic PvP. Pit Strikers against others. Climb ranks, prove mastery.", icon: FiHexagon, status: "Future", statusColorScheme: "orange"},
    { title: "Phase 5: Post-Mortem Alchemy", description: "Even in death, essence remains. Harvest genetic data for advanced shaping or artifacts.", icon: FiLogIn, status: "Future", statusColorScheme: "red"},
  ];
  
  const backgroundImage = "/assets/primordia-nebula-bg.png";
  const sigilImage = "/assets/primordia-sigil.png";

  return (
    <MotionBox 
      variants={pageTransitionVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      bgImage={`url(${backgroundImage})`}
      bgPosition="center"
      bgRepeat="no-repeat"
      bgSize="cover"
      bgAttachment="fixed"
      color={textColor} 
      minH="100vh"
    >
      <Box bg={useColorModeValue('rgba(255,255,255,0.1)', 'rgba(0,0,0,0.4)')} minH="100vh"> {/* Darker Overlay */}
        <Header />
        
        {/* Hero Section */}
        <MotionVStack 
          variants={heroVariants} 
          spacing={6} 
          minH={{ base: "70vh", md: "85vh" }} 
          justifyContent="center" 
          textAlign="center" 
          px={4}
          pt={{ base: 24, md: 16 }} // Adjust padding top to account for fixed header
        >
          <MotionImage 
            variants={sigilVariants} 
            src={sigilImage} 
            alt="Primordia Sigil" 
            boxSize={{ base: "120px", md: "180px", lg: "220px" }} 
            objectFit="contain" 
            mb={4} 
          />
          <MotionHeading 
            as="h1" 
            fontSize={{ base: '4xl', md: '6xl', lg: '7xl' }} 
            fontWeight="extrabold"
            color={headingColor}
            textShadow={useColorModeValue("1px 1px 3px rgba(0,0,0,0.3)", "0px 0px 15px rgba(0, 144, 255, 0.6)")}
            letterSpacing="tight"
          >
            Primordia: Genesis Protocol
          </MotionHeading>
          <MotionText 
            variants={sectionVariants} 
            custom={1} // Delay after title
            fontSize={{ base: "lg", md: "2xl"}} 
            color={loreTextColor} 
            maxW="xl"
          >
            Forge your destiny in a world of evolving elemental power.
          </MotionText>
        </MotionVStack>

        {/* Main Content Container */}
        <Container maxW="container.xl" pb={20} pt={{base: 8, md: 0}}>
          {/* LORE Section */}
          <MotionVStack variants={sectionVariants} custom={2} spacing={8} mb={{base: 12, md: 20}} bg={sectionBg} p={{base:4, md:8}} borderRadius="xl" shadow="lg">
            <Heading as="h2" fontSize={{base: "2xl", md: "4xl"}} color={headingColor} textAlign="center">
              The Genesis Shaper's Calling
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 6, md: 10 }}>
              <MotionText variants={sectionVariants} custom={2.5} fontSize={{base: "md", md: "lg"}} lineHeight="tall" color={loreTextColor}>
                From the roiling heart of the Chaotic Nebula, a nascent world whispers its arrival - <Text as="strong" color={headingColor}>Primordia</Text>. Here, the raw energies of creation collide, birthing landscapes of impossible beauty and terrifying flux. You are a <Text as="strong" color={headingColor}>Genesis Shaper</Text>, an entity touched by the Echoes of the First Forging, imbued with the rare ability to perceive and sculpt the Anima – the very lifeblood of this emergent sphere.
              </MotionText>
              <MotionVStack variants={sectionVariants} custom={3} spacing={4} alignSelf="flex-start">
                <Text fontSize={{base: "md", md: "lg"}} lineHeight="tall" color={loreTextColor}>
                  Your purpose is to enact the <Text as="strong" color={headingColor}>Genesis Protocol</Text>: to seed Primordia with life, to nurture fledgling elemental beings from mere motes of Anima into complex creatures of power and purpose. These are not mere beasts, Shaper, but living manifestations of Primordia's volatile will.
                </Text>
                <Text fontSize={{base: "md", md: "lg"}} lineHeight="tall" color={loreTextColor}>
                  Their forms shift, their abilities transmute, their destinies intertwine with the fate of this new reality. Uncover the ancient secrets veiled within Primordia's elemental strata. Guide your creations, for in their balance lies the key.
                </Text>
              </MotionVStack>
            </SimpleGrid>
          </MotionVStack>
          
          <MotionBox variants={sectionVariants} custom={3.5} w="full">
            <Divider borderColor={borderColor} my={{base:8, md:12}} />
          </MotionBox>

          {/* Roadmap Section */}
          <MotionBox variants={sectionVariants} custom={4} p={{base: 4, md:8}} borderWidth={1} borderRadius="xl" bg={roadmapBg} shadow="2xl" w="full">
            <Heading as="h2" fontSize={{ base: '2xl', md: '3xl' }} mb={8} color={headingColor} fontWeight="semibold" textAlign="center">
              Roadmap to Ascension
            </Heading>
            <VStack spacing={6} align="stretch">
              {phases.map((phase, index) => (
                <MotionCard 
                  key={index} 
                  direction={{ base: 'column', sm: 'row' }} 
                  overflow='hidden' 
                  variant='outline' 
                  bg={cardBg} 
                  borderColor={cardBorderColor} 
                  variants={cardHover}
                  whileHover="hover"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0, transition: { delay: 0.1 + index * 0.1, duration: 0.5 } }} // Animate when card scrolls into view
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <Flex p={5} alignItems="center" justifyContent="center" bg={useColorModeValue('primary.100', 'primary.800')} minW={{ sm: "100px"}} borderLeftRadius={{sm: "md"}}>
                    <Icon as={phase.icon} w={10} h={10} color={useColorModeValue('primary.600', 'primary.300')} />
                  </Flex>
                  <CardBody>
                    <Flex justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Heading size='md' color={headingColor}>{phase.title}</Heading>
                        <Tag size="sm" colorScheme={phase.statusColorScheme} variant="solid" ml={2} mt={1} whiteSpace="nowrap">{phase.status}</Tag>
                    </Flex>
                    <Text py='2' color={loreTextColor} fontSize="sm">{phase.description}</Text>
                  </CardBody>
                </MotionCard>
              ))}
            </VStack>
          </MotionBox>

          {/* CTA Button */}
          <MotionVStack variants={sectionVariants} custom={5} pt={{base:12, md:20}}>
            <MotionButton 
              size="lg"
              px={10}
              py={8}
              fontSize="xl"
              colorScheme="primary"
              variant="solid"
              isDisabled 
              _hover={!true ? { // Using !true as it's always disabled for now
                bg: useColorModeValue('primary.600', 'primary.500'), 
                shadow: 'xl',
                transform: 'translateY(-3px) scale(1.03)'
              } : {}}
              boxShadow="lg"
              leftIcon={<FiEye/>}
              animate={ true ? { scale: [1, 1.02, 1], transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }} : {} } // Using true for the pulse animation
              whileTap={{ scale: 0.95 }}
            >
              Enter the Environment (Coming Soon)
            </MotionButton>
          </MotionVStack>

        </Container>
      </Box>
    </MotionBox>
  );
}
