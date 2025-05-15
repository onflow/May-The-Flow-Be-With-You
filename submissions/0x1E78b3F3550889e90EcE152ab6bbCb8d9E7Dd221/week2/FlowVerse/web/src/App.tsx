import { useState, useEffect } from 'react'
import { ChakraProvider, Box, VStack, Heading, Text, Button, Tabs, TabList, TabPanels, Tab, TabPanel, useToast, extendTheme, Container, Flex, Spacer, Icon } from '@chakra-ui/react'
import * as fcl from '@onflow/fcl'
import { Profile } from './components/Profile'
import { Market } from './components/Market'
import { FaGamepad } from 'react-icons/fa'

// Configure Flow client for testnet
fcl.config({
  'accessNode.api': 'https://rest-testnet.onflow.org',
  'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
  'app.detail.title': 'Flow Game',
  'app.detail.icon': 'https://placekitten.com/g/200/200'
})

const theme = extendTheme({
  fonts: {
    heading: `'Press Start 2P', cursive`,
    body: `'Inter', sans-serif`,
  },
  styles: {
    global: {
      body: {
        bg: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
        color: 'white',
        minHeight: '100vh',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
        borderRadius: 'xl',
        boxShadow: 'md',
        letterSpacing: 'wider',
      },
      variants: {
        solid: {
          bg: 'teal.400',
          color: 'white',
          _hover: { bg: 'teal.500', transform: 'scale(1.05)' },
        },
        outline: {
          borderColor: 'teal.300',
          color: 'teal.200',
          _hover: { bg: 'teal.900', color: 'white' },
        },
      },
    },
    Tabs: {
      baseStyle: {
        tab: {
          fontWeight: 'bold',
          _selected: { color: 'teal.300', borderColor: 'teal.300' },
        },
      },
    },
  },
})

// Add Google Fonts
const fontLink = document.createElement('link')
fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;700&display=swap'
fontLink.rel = 'stylesheet'
document.head.appendChild(fontLink)

interface FlowUser {
  addr: string;
}

interface ProfileData {
  username: string;
  items: Array<{
    id: number;
    name: string;
    rarity: string;
    createdAt: number;
  }>;
}

function App() {
  const [user, setUser] = useState<FlowUser | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const toast = useToast()

  useEffect(() => {
    // Subscribe to user changes
    fcl.currentUser.subscribe(setUser)
  }, [])

  const handleLogin = async () => {
    try {
      await fcl.authenticate()
    } catch {
      toast({
        title: 'Failed to authenticate',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleLogout = async () => {
    try {
      await fcl.unauthenticate()
    } catch {
      toast({
        title: 'Failed to logout',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const createProfile = async () => {
    if (!user) return

    try {
      await fcl.mutate({
        cadence: `
          import GameProfile from "0xc221baf396e794dd/GameProfile"
          
          transaction(username: String) {
            prepare(acct: AuthAccount) {
              GameProfile.createProfile(username: username)
            }
          }
        `,
        args: (arg: typeof fcl.arg, t: typeof fcl.t) => [arg("Player1", t.String)],
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        limit: 50
      })

      // Refresh profile
      const result = await fcl.query({
        cadence: `
          import GameProfile from "0xc221baf396e794dd/GameProfile"
          
          pub fun main(address: Address): GameProfile.Profile? {
            return GameProfile.getProfile(address: address)
          }
        `,
        args: (arg: typeof fcl.arg, t: typeof fcl.t) => [arg(user.addr, t.Address)]
      })

      setProfile(result)
    } catch (error: any) {
      console.error('Profile creation failed:', error)
      toast({
        title: 'Failed to create profile',
        description: error?.message || String(error),
        status: 'error',
        duration: 7000,
        isClosable: true,
      })
    }
  }

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bgGradient="linear(to-br, #232526, #414345)">
        <Container maxW="container.lg" py={12}>
          <Flex align="center" mb={8}>
            <Icon as={FaGamepad} w={10} h={10} color="teal.300" mr={4} />
            <Heading fontFamily="heading" fontSize={["2xl", "3xl", "4xl"]} letterSpacing="wider">
              Flow Game
            </Heading>
            <Spacer />
          </Flex>
          <VStack spacing={8} align="center">
            {!user ? (
              <Button size="lg" colorScheme="teal" onClick={handleLogin} boxShadow="xl">
                Connect Wallet
              </Button>
            ) : (
              <VStack spacing={6} width="100%" align="center">
                <Box bg="gray.800" px={6} py={4} borderRadius="2xl" boxShadow="2xl" minW="320px">
                  <Text fontSize="md" color="teal.200" mb={2} fontFamily="body">
                    Connected as: <b>{user.addr}</b>
                  </Text>
                  {!profile && (
                    <Button colorScheme="green" size="md" onClick={createProfile} w="100%" mb={2}>
                      Create Profile
                    </Button>
                  )}
                  <Button colorScheme="red" variant="outline" size="md" onClick={handleLogout} w="100%">
                    Disconnect
                  </Button>
                </Box>
                {profile && (
                  <Tabs variant="enclosed" colorScheme="teal" width="100%" boxShadow="xl" borderRadius="xl" bg="gray.900" p={4}>
                    <TabList>
                      <Tab fontSize="lg">Profile</Tab>
                      <Tab fontSize="lg">Market</Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel>
                        <Profile address={user.addr} />
                      </TabPanel>
                      <TabPanel>
                        <Market />
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                )}
              </VStack>
            )}
          </VStack>
        </Container>
      </Box>
    </ChakraProvider>
  )
}

export default App
