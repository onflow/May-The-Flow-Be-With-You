import { Box, VStack, Heading, Text, Button, SimpleGrid, useToast } from '@chakra-ui/react'
import { useState, useEffect, useCallback } from 'react'
import * as fcl from '@onflow/fcl'

interface Listing {
  id: number
  item: {
    id: number
    name: string
    rarity: string
    createdAt: number
  }
  price: number
  seller: string
}

export function Market() {
  const [listings, setListings] = useState<Listing[]>([])
  const toast = useToast()

  const fetchListings = useCallback(async () => {
    try {
      const result = await fcl.query({
        cadence: `
          import GameMarket from "0xc221baf396e794dd/GameMarket"
          
          pub fun main(): [GameMarket.Listing] {
            return GameMarket.getListings()
          }
        `,
        args: (arg: typeof fcl.arg, t: typeof fcl.t) => []
      })

      setListings(result)
    } catch {
      toast({
        title: 'Failed to fetch listings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }, [toast])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const buyItem = async (listingId: number) => {
    try {
      await fcl.mutate({
        cadence: `
          import GameMarket from "0xc221baf396e794dd/GameMarket"
          import GameProfile from "0xc221baf396e794dd/GameProfile"
          
          transaction(listingId: UInt64) {
            prepare(acct: AuthAccount) {
              let profile = GameProfile.getProfile(address: acct.address)!
              let item = GameMarket.buyItem(listingId: listingId)
              profile.addItem(item: item)
            }
          }
        `,
        args: (arg: typeof fcl.arg, t: typeof fcl.t) => [
          arg(listingId, t.UInt64)
        ],
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        limit: 50
      })

      await fetchListings()
    } catch {
      toast({
        title: 'Failed to buy item',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Heading size="md">Marketplace</Heading>

        <SimpleGrid columns={3} spacing={4}>
          {listings.map((listing) => (
            <Box key={listing.id} p={4} borderWidth={1} borderRadius="md">
              <VStack align="start" spacing={2}>
                <Text fontWeight="bold">{listing.item.name}</Text>
                <Text>Rarity: {listing.item.rarity}</Text>
                <Text>Price: {listing.price} FLOW</Text>
                <Text fontSize="sm">Seller: {listing.seller}</Text>
                <Button size="sm" colorScheme="blue" onClick={() => buyItem(listing.id)}>
                  Buy
                </Button>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  )
} 