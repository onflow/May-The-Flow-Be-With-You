'use client';

import { Box, Button, Container, Heading, Text, VStack, Link as ChakraLink, Icon, Flex, Spacer, useColorModeValue, Divider, Card, CardBody, Tag, SimpleGrid, Image } from '@chakra-ui/react';
import NextLink from 'next/link';
import Header from '@/components/Header'; 
import { FiLogIn, FiZap, FiEye, FiShield, FiHexagon } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import * as fcl from '@onflow/fcl';

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

  const [user, setUser] = useState<{ addr?: string; loggedIn?: boolean }>({});
  const [isAccountConfigured, setIsAccountConfigured] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [currentTutorialPage, setCurrentTutorialPage] = useState(0);

  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
  }, []);

  useEffect(() => {
    if (user.addr) {
      const configuredStatus = localStorage.getItem(`primordia_account_configured_${user.addr}`);
      if (configuredStatus === 'true') {
        setIsAccountConfigured(true);
      } else {
        setIsAccountConfigured(false);
      }
    } else {
      setIsAccountConfigured(false);
    }
  }, [user.addr]);

  const cardHover = {
    hover: {
      y: -6,
      scale: 1.03,
      boxShadow: useColorModeValue("0px 12px 25px rgba(0, 0, 0, 0.15)", "0px 12px 25px rgba(0, 144, 255, 0.25)"),
      transition: { duration: 0.25, ease: "easeOut" }
    }
  };

  const phases = [
    { title: "Phase 1: Genesis Protocol ✅", description: "Mint unique creatures with modular traits (Visual, Personality, Combat modules). Each creature has AI-generated birth chronicles.", icon: FiZap, status: "Live", statusColorScheme: "green"},
    { title: "Phase 2: Evolution Engine ✅", description: "Watch creatures evolve through time-based simulations. Gain Evolution Points and witness AI-narrated transformations.", icon: FiEye, status: "Live", statusColorScheme: "green"},
    { title: "Phase 3: Cosmic Mitosis ✅", description: "Breed asexually using EP investment. More EP = longer lifespan offspring (10 EP = 1 day, scaling up to 15 days max).", icon: FiShield, status: "Live", statusColorScheme: "green"},
    { title: "Phase 4: Sexual Reproduction", description: "Breed creatures sexually with compatibility checks. Offspring lifespan depends on parent health, age, and genetics.", icon: FiHexagon, status: "Ready", statusColorScheme: "blue"},
    { title: "Phase 5: Limited Genesis", description: "Max 1000-2000 creatures can be minted. After that, only breeding creates new life. NFTs are expandable for future mechanics.", icon: FiLogIn, status: "Planned", statusColorScheme: "purple"},
  ];
  
  const backgroundImage = "/assets/primordia-nebula-bg.png";
  const sigilImage = "/assets/primordia-sigil.png";

  const canEnterEnvironment = user.loggedIn && isAccountConfigured;

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
          
          {/* CTA Button - Moved up here for better visibility */}
          <MotionVStack variants={sectionVariants} custom={1.5} pt={8}>
            {canEnterEnvironment ? (
              <MotionButton 
                size="lg"
                px={10}
                py={8}
                fontSize="xl"
                colorScheme="primary"
                variant="solid"
                _hover={{ 
                  bg: useColorModeValue('primary.600', 'primary.500'), 
                  shadow: 'xl',
                  transform: 'translateY(-3px) scale(1.03)'
                }}
                boxShadow="lg"
                leftIcon={<FiEye/>}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Check if user has seen the tutorial
                  const hasSeenTutorial = localStorage.getItem(`primordia_tutorial_seen_${user.addr}`);
                  if (!hasSeenTutorial) {
                    setShowTutorialModal(true);
                    setCurrentTutorialPage(0);
                  } else {
                    // Go directly to environment
                    window.location.href = '/environment';
                  }
                }}
              >
                🌟 Enter Primordia Environment
              </MotionButton>
            ) : (
              <NextLink href="#" passHref legacyBehavior>
                <MotionButton 
                  as="a"
                  size="lg"
                  px={10}
                  py={8}
                  fontSize="xl"
                  colorScheme="primary"
                  variant="solid"
                  isDisabled={true}
                  _hover={{cursor: 'not-allowed'}}
                  boxShadow="lg"
                  leftIcon={<FiEye/>}
                  animate={{ scale: [1, 1.02, 1], transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } }}
                >
                  Connect & Setup Account to Enter
                </MotionButton>
              </NextLink>
            )}
            {user.loggedIn && !isAccountConfigured && (
              <Text fontSize="sm" color="orange.500" textAlign="center" mt={2}>
                ⚠️ Account setup required before entering
              </Text>
            )}
          </MotionVStack>
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
                From the roiling heart of the Chaotic Nebula, a nascent world whispers its arrival - <Text as="strong" color={headingColor}>Primordia</Text>. Here, <Text as="strong" color={headingColor}>modular digital creatures</Text> evolve through cosmic energies, each possessing unique <Text as="strong" color={headingColor}>Visual, Personality, Combat, and Reproduction modules</Text>. You are a <Text as="strong" color={headingColor}>Genesis Shaper</Text>, wielding the power to birth, evolve, and breed these cosmic entities.
              </MotionText>
              <MotionVStack variants={sectionVariants} custom={3} spacing={4} alignSelf="flex-start">
                <Text fontSize={{base: "md", md: "lg"}} lineHeight="tall" color={loreTextColor}>
                  Your purpose is to enact the <Text as="strong" color={headingColor}>Genesis Protocol</Text>: create creatures through <Text as="strong" color={headingColor}>0.1 FLOW minting</Text>, guide their <Text as="strong" color={headingColor}>time-based evolution</Text>, and master the arts of <Text as="strong" color={headingColor}>Cosmic Mitosis</Text> and <Text as="strong" color={headingColor}>Sexual Reproduction</Text>. Each creature tells their own story through <Text as="strong" color={headingColor}>AI-generated epic narratives</Text>.
                </Text>
                <Text fontSize={{base: "md", md: "lg"}} lineHeight="tall" color={loreTextColor}>
                  In the coming <Text as="strong" color={headingColor}>Limited Genesis</Text> era, only 1000-2000 creatures will ever be minted. After that, <Text as="strong" color={headingColor}>breeding becomes the only path to new life</Text>. The <Text as="strong" color={headingColor}>expandable NFT architecture</Text> awaits future mechanics from developers worldwide.
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



        </Container>
        
        {/* Tutorial Modal */}
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          zIndex: 99999999999,
          pointerEvents: showTutorialModal ? 'auto' : 'none',
          display: showTutorialModal ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.9)'
        }}>
          {/* Manual Tutorial Modal Implementation */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            border: '4px solid #2563eb',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '85vh',
            overflow: 'auto',
            zIndex: 99999999999
          }}>
            {/* Header */}
            <div style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '20px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px' }}>🌟 Welcome to Primordia Environment</h2>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                Essential Guide for Genesis Shapers
              </p>
            </div>
            
            {/* Body */}
            <div style={{ padding: '20px', minHeight: '400px' }}>
              {currentTutorialPage === 0 && (
                <div>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '16px', 
                    backgroundColor: '#dbeafe', 
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '20px', color: '#1e40af' }}>
                      🌌 The Cosmic Environment
                    </h3>
                  </div>
                  
                  <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
                    <p><strong>Welcome, Genesis Shaper!</strong> You're about to enter the mystical realm of Primordia where digital creatures evolve through cosmic energies.</p>
                    
                    <h4 style={{ color: '#2563eb', marginTop: '20px' }}>🎮 Interactive Environment:</h4>
                    <ul>
                      <li><strong>Click creatures</strong> to see their detailed stats and traits</li>
                      <li><strong>Watch them chat</strong> - they have personalities and will communicate based on their traits</li>
                      <li><strong>Observe their forms</strong> - visual traits determine their appearance and colors</li>
                    </ul>
                    
                    <h4 style={{ color: '#2563eb', marginTop: '20px' }}>⚠️ Important Notice:</h4>
                    <p style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '6px', border: '1px solid #f59e0b' }}>
                      🧪 <strong>You're on Flow Testnet</strong> - All FLOW tokens are free test tokens with no real value.
                    </p>
                  </div>
                </div>
              )}
              
              {currentTutorialPage === 1 && (
                <div>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '16px', 
                    backgroundColor: '#d1fae5', 
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '20px', color: '#059669' }}>
                      🌟 Creating Life (Minting)
                    </h3>
                  </div>
                  
                  <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
                    <h4 style={{ color: '#059669', marginTop: '20px' }}>💰 Minting Cost:</h4>
                    <p><strong>0.1 FLOW per creature</strong> - This cost helps maintain the ecosystem balance</p>
                    
                    <h4 style={{ color: '#059669', marginTop: '20px' }}>🎲 Modular Generation:</h4>
                    <ul>
                      <li><strong>Visual Module:</strong> Size, form, colors, appendages that determine appearance</li>
                      <li><strong>Personality Module:</strong> Temperament, curiosity, intelligence, empathy affecting behavior</li>
                      <li><strong>Combat Module:</strong> Attack, defense, agility stats (ready for future PvP)</li>
                      <li><strong>Reproduction Module:</strong> Fertility, maturity, compatibility for breeding</li>
                      <li><strong>Cosmic signature</strong> - Every creature gets a unique seed number from blockchain data</li>
                      <li><strong>Lifespan</strong> - Currently set to 7 simulated days</li>
                    </ul>
                    
                    <h4 style={{ color: '#059669', marginTop: '20px' }}>📜 Birth Chronicles:</h4>
                    <p>When you mint a creature, an <strong>AI-generated epic narrative</strong> will describe their cosmic birth! These appear in a beautiful modal for you to read.</p>
                    
                    <p style={{ backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '6px', border: '1px solid #10b981' }}>
                      🎭 <strong>Tip:</strong> Each creature has a personality that affects how they communicate and behave!
                    </p>
                  </div>
                </div>
              )}
              
              {currentTutorialPage === 2 && (
                <div>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '16px', 
                    backgroundColor: '#e0e7ff', 
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '20px', color: '#3730a3' }}>
                      🧬 Evolution & Time
                    </h3>
                  </div>
                  
                  <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
                    <h4 style={{ color: '#3730a3', marginTop: '20px' }}>⏰ Evolution Process:</h4>
                    <ul>
                      <li><strong>"Evolve All Creatures"</strong> button processes time for ALL alive creatures</li>
                      <li><strong>Each creature ages</strong> and gains Evolution Points (EP) individually</li>
                      <li><strong>Requires wallet approval</strong> for each creature (blockchain transaction)</li>
                    </ul>
                    
                    <h4 style={{ color: '#3730a3', marginTop: '20px' }}>📈 Time Mechanics:</h4>
                    <ul>
                      <li><strong>250 steps per simulated day</strong> (fixed in contract)</li>
                      <li><strong>2000 seconds per day</strong> (accelerated for testing)</li>
                      <li><strong>Creatures mature</strong> and gain EP based on their traits</li>
                    </ul>
                    
                    <h4 style={{ color: '#3730a3', marginTop: '20px' }}>📚 Evolution Chronicles:</h4>
                    <p>After evolution, you'll see <strong>epic AI-generated narratives</strong> describing each creature's transformation in a paginated modal!</p>
                    
                    <p style={{ backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '6px', border: '1px solid #3b82f6' }}>
                      ⚡ <strong>Pro Tip:</strong> Evolution takes time and each creature needs individual approval - be patient!
                    </p>
                  </div>
                </div>
              )}
              
              {currentTutorialPage === 3 && (
                <div>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '16px', 
                    backgroundColor: '#fdf2f8', 
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '20px', color: '#be185d' }}>
                      🧬 Breeding & Reproduction Systems
                    </h3>
                  </div>
                  
                  <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
                    <h4 style={{ color: '#be185d', marginTop: '20px' }}>🔬 Cosmic Mitosis (Available Now):</h4>
                    <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                      <p><strong>Investment-Based Lifespan:</strong></p>
                      <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                        <li>10 EP minimum = 1 day offspring lifespan</li>
                        <li>20 EP investment = 6 days (1 + 10×0.5)</li>
                        <li>30 EP investment = 11 days (1 + 20×0.5)</li>
                        <li>Maximum offspring lifespan: 15 days</li>
                      </ul>
                      <p><strong>Strategy:</strong> Save EP for longer-lived, more valuable offspring!</p>
                    </div>
                    
                    <h4 style={{ color: '#be185d', marginTop: '20px' }}>💕 Sexual Reproduction (Ready, Events Not Implemented):</h4>
                    <div style={{ backgroundColor: '#fef7cd', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                      <p><strong>Parent Quality Determines Offspring Lifespan:</strong></p>
                      <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                                 <li><strong>Health Factor:</strong> Parents with &gt;50 EP add up to +2 days</li>
                        <li><strong>Age Factor:</strong> Young parents add up to +3 days</li>
                        <li><strong>Hybrid Vigor:</strong> +1 day bonus for sexual reproduction</li>
                        <li><strong>Final Range:</strong> 2-12 days based on parent quality</li>
                      </ul>
                      <p><strong>Example:</strong> Two healthy young parents = ~8-12 day offspring</p>
                    </div>
                    
                    <h4 style={{ color: '#be185d', marginTop: '20px' }}>🏆 Future Economy Vision:</h4>
                    <p>When minting stops, breeding becomes the only source of new creatures. Strategic breeders will:</p>
                    <ul>
                      <li>Optimize parent health and timing</li>
                      <li>Create valuable genetic lines</li>
                      <li>Trade premium offspring</li>
                      <li>Build reputation as elite breeders</li>
                    </ul>
                    
                    <p style={{ backgroundColor: '#fdf2f8', padding: '12px', borderRadius: '6px', border: '1px solid #ec4899' }}>
                      💡 <strong>Pro Tip:</strong> Start experimenting with mitosis now to understand genetics before sexual reproduction launches!
                    </p>
                  </div>
                </div>
              )}
              
              {currentTutorialPage === 4 && (
                <div>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '16px', 
                    backgroundColor: '#fef3c7', 
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '20px', color: '#92400e' }}>
                      🔬 Advanced Features
                    </h3>
                  </div>
                  
                  <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
                    <h4 style={{ color: '#92400e', marginTop: '20px' }}>🔬 Cosmic Mitosis (Asexual Breeding):</h4>
                    <ul>
                      <li><strong>EP Investment System:</strong> 10 EP minimum = 1 day offspring lifespan</li>
                      <li><strong>Scaling Rewards:</strong> Each additional EP = +0.5 days (max 15 days)</li>
                      <li><strong>Example:</strong> 20 EP investment = 6 days offspring lifespan</li>
                      <li><strong>Genetic Mutations:</strong> Small random changes in traits</li>
                      <li><strong>Strategic Planning:</strong> More EP = longer-lived, more valuable offspring</li>
                    </ul>
                    
                    <h4 style={{ color: '#92400e', marginTop: '20px' }}>💕 Sexual Reproduction (Coming Soon):</h4>
                    <ul>
                      <li><strong>Parent Health Factor:</strong> Creatures with more EP produce healthier offspring</li>
                      <li><strong>Age Factor:</strong> Younger parents create stronger children (up to +3 days)</li>
                      <li><strong>Compatibility System:</strong> Some creatures are more genetically compatible</li>
                      <li><strong>Hybrid Vigor:</strong> Sexual offspring get +1 day bonus lifespan</li>
                      <li><strong>Final Range:</strong> 2-12 days depending on parent quality</li>
                    </ul>
                    
                    <h4 style={{ color: '#92400e', marginTop: '20px' }}>🏆 Limited Genesis Economy:</h4>
                    <ul>
                      <li><strong>Mainnet Launch:</strong> Only 1000-2000 creatures can ever be minted</li>
                      <li><strong>Post-Genesis:</strong> New creatures only through breeding (mitosis/sexual)</li>
                      <li><strong>Breeder Economy:</strong> Players become creature breeders and sellers</li>
                      <li><strong>Scarcity Value:</strong> Each creature becomes more valuable over time</li>
                    </ul>
                    
                    <h4 style={{ color: '#92400e', marginTop: '20px' }}>🔧 Expandable NFT System:</h4>
                    <ul>
                      <li><strong>Modular Architecture:</strong> New trait modules can be added anytime</li>
                      <li><strong>Future Mechanics:</strong> Combat, exploration, crafting can be plugged in</li>
                      <li><strong>AI Image Generation:</strong> Planned visual representation based on traits</li>
                      <li><strong>Third-Party Integration:</strong> Other developers can add mechanics</li>
                    </ul>
                    
                    <p style={{ backgroundColor: '#fef7cd', padding: '12px', borderRadius: '6px', border: '1px solid #d97706' }}>
                      🌟 <strong>Vision:</strong> A self-sustaining digital ecosystem where players breed, trade, and evolve unique creatures with AI-generated narratives and expandable mechanics!
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div style={{ 
              backgroundColor: '#f9fafb', 
              padding: '16px', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  disabled={currentTutorialPage === 0}
                  onClick={() => setCurrentTutorialPage(prev => Math.max(0, prev - 1))}
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #3b82f6',
                    backgroundColor: currentTutorialPage === 0 ? '#e5e7eb' : 'white',
                    color: currentTutorialPage === 0 ? '#9ca3af' : '#3b82f6',
                    borderRadius: '4px',
                    cursor: currentTutorialPage === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ← Previous
                </button>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  {currentTutorialPage + 1} of 5
                </span>
                <button
                  disabled={currentTutorialPage >= 4}
                  onClick={() => setCurrentTutorialPage(prev => Math.min(4, prev + 1))}
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #3b82f6',
                    backgroundColor: currentTutorialPage >= 4 ? '#e5e7eb' : 'white',
                    color: currentTutorialPage >= 4 ? '#9ca3af' : '#3b82f6',
                    borderRadius: '4px',
                    cursor: currentTutorialPage >= 4 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next →
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => {
                    setShowTutorialModal(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    // Mark tutorial as seen
                    localStorage.setItem(`primordia_tutorial_seen_${user.addr}`, 'true');
                    setShowTutorialModal(false);
                    // Go to environment
                    window.location.href = '/environment';
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🌟 Enter Environment
                </button>
              </div>
            </div>
          </div>
        </div>
      </Box>
    </MotionBox>
  );
}
