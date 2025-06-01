import { Box, VStack, Heading, Text, Button, SimpleGrid, useToast } from '@chakra-ui/react'
import { useState, useEffect, useCallback } from 'react'
import * as fcl from '@onflow/fcl'

interface Item {
  id: number
  name: string
  rarity: string
  createdAt: number
}

interface ProfileProps {
  address: string
}

export function Profile({ address }: ProfileProps) {
  const [items, setItems] = useState<Item[]>([])
  const [username, setUsername] = useState<string>('')
  const toast = useToast()

  const fetchProfile = useCallback(async () => {
    try {
      const result = await fcl.query({
        cadence: `
          import GameProfile from "0xc221baf396e794dd/GameProfile"
          
          pub fun main(address: Address): GameProfile.Profile? {
            return GameProfile.getProfile(address: address)
          }
        `,
        args: (arg: typeof fcl.arg, t: typeof fcl.t) => [arg(address, t.Address)]
      })

      if (result) {
        setUsername(result.username)
        setItems(result.items)
      }
    } catch {
      toast({
        title: 'Failed to fetch profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }, [address, toast])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const createItem = async () => {
    try {
      await fcl.mutate({
        cadence: `
          import GameItems from "0xc221baf396e794dd/GameItems"
          import GameProfile from "0xc221baf396e794dd/GameProfile"
          
          transaction(name: String, rarity: String) {
            prepare(acct: AuthAccount) {
              let profile = GameProfile.getProfile(address: acct.address)!
              let item = GameItems.createItem(name: name, rarity: rarity)
              profile.addItem(item: item)
            }
          }
        `,
        args: (arg: typeof fcl.arg, t: typeof fcl.t) => [
          arg("New Item", t.String),
          arg("Common", t.String)
        ],
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        limit: 50
      })

      await fetchProfile()
    } catch {
      toast({
        title: 'Failed to create item',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const listItem = async (itemId: number) => {
    try {
      await fcl.mutate({
        cadence: `
          import GameItems from "0xc221baf396e794dd/GameItems"
          import GameMarket from "0xc221baf396e794dd/GameMarket"
          import GameProfile from "0xc221baf396e794dd/GameProfile"
          
          transaction(itemId: UInt64, price: UFix64) {
            prepare(acct: AuthAccount) {
              let profile = GameProfile.getProfile(address: acct.address)!
              let item = profile.removeItem(itemId: itemId)
              GameMarket.listItem(item: item, price: price)
            }
          }
        `,
        args: (arg: typeof fcl.arg, t: typeof fcl.t) => [
          arg(itemId, t.UInt64),
          arg("1.0", t.UFix64)
        ],
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        limit: 50
      })

      await fetchProfile()
    } catch {
      toast({
        title: 'Failed to list item',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Heading size="md">Profile: {username}</Heading>
        
        <Button colorScheme="blue" onClick={createItem}>
          Create New Item
        </Button>

        <SimpleGrid columns={3} spacing={4}>
          {items.map((item) => (
            <Box key={item.id} p={4} borderWidth={1} borderRadius="md">
              <VStack align="start" spacing={2}>
                <Text fontWeight="bold">{item.name}</Text>
                <Text>Rarity: {item.rarity}</Text>
                <Text>Created: {new Date(item.createdAt).toLocaleDateString()}</Text>
                <Button size="sm" colorScheme="green" onClick={() => listItem(item.id)}>
                  List for Sale
                </Button>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  )
} 