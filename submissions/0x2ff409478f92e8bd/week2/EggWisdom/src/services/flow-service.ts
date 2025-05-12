import * as fcl from "@onflow/fcl";
import { FLOW_ADDRESSES } from "./fcl-config";

// Transaction scripts
const mintEggWisdomTx = `
import EggWisdom from 0xEggWisdom

transaction {
  prepare(acct: AuthAccount) {
    if acct.borrow<&EggWisdom.Collection>(from: EggWisdom.CollectionStoragePath) == nil {
      // Create a new empty collection
      let collection <- EggWisdom.createEmptyCollection()
      // Save it to the account
      acct.save(<-collection, to: EggWisdom.CollectionStoragePath)
      // Create a public capability for the collection
      acct.link<&{EggWisdom.EggWisdomCollectionPublic}>(
        EggWisdom.CollectionPublicPath,
        target: EggWisdom.CollectionStoragePath
      )
    }
    
    // Mint a new EggWisdom NFT
    let eggMinter = getAccount(${FLOW_ADDRESSES.EggWisdom})
      .getCapability(EggWisdom.MinterPublicPath)
      .borrow<&{EggWisdom.MinterPublic}>()
      ?? panic("Could not borrow minter capability")
    
    eggMinter.mintEggWisdom(recipient: acct.address)
  }
}
`;

const mintWisdomPhraseTx = `
import EggWisdom from 0xEggWisdom

transaction {
  prepare(acct: AuthAccount) {
    if acct.borrow<&EggWisdom.PhraseCollection>(from: EggWisdom.PhraseCollectionStoragePath) == nil {
      // Create a new empty collection
      let collection <- EggWisdom.createEmptyPhraseCollection()
      // Save it to the account
      acct.save(<-collection, to: EggWisdom.PhraseCollectionStoragePath)
      // Create a public capability for the collection
      acct.link<&{EggWisdom.WisdomPhraseCollectionPublic}>(
        EggWisdom.PhraseCollectionPublicPath,
        target: EggWisdom.PhraseCollectionStoragePath
      )
    }
    
    // Mint a new WisdomPhrase NFT
    let phraseMinter = getAccount(${FLOW_ADDRESSES.EggWisdom})
      .getCapability(EggWisdom.PhraseMinterPublicPath)
      .borrow<&{EggWisdom.PhraseMinterPublic}>()
      ?? panic("Could not borrow phrase minter capability")
    
    phraseMinter.mintWisdomPhrase(recipient: acct.address)
  }
}
`;

const uploadWisdomImageTx = `
import EggWisdom from 0xEggWisdom

transaction(imageBase64: String, players: [String], cats: [String]) {
  prepare(acct: AuthAccount) {
    let metadataUploader = getAccount(${FLOW_ADDRESSES.EggWisdom})
      .getCapability(EggWisdom.MetadataUploaderPublicPath)
      .borrow<&{EggWisdom.MetadataUploaderPublic}>()
      ?? panic("Could not borrow metadata uploader capability")
    
    metadataUploader.uploadMetadata(image: imageBase64, players: players, cats: cats, uploader: acct.address)
  }
}
`;

const petEggWisdomTx = `
import EggWisdom from 0xEggWisdom

transaction(eggId: UInt64) {
  prepare(acct: AuthAccount) {
    let eggPetter = getAccount(${FLOW_ADDRESSES.EggWisdom})
      .getCapability(EggWisdom.EggPetterPublicPath)
      .borrow<&{EggWisdom.EggPetterPublic}>()
      ?? panic("Could not borrow egg petter capability")
    
    eggPetter.petEgg(eggId: eggId, petter: acct.address)
  }
}
`;

// Query scripts
const getUserDataScript = `
import EggWisdom from 0xEggWisdom
import ZenToken from 0xEggWisdom

pub struct UserData {
  pub let address: Address
  pub let zenBalance: UFix64
  pub let eggs: [EggData]
  pub let phrases: [PhraseData]

  init(address: Address, zenBalance: UFix64, eggs: [EggData], phrases: [PhraseData]) {
    self.address = address
    self.zenBalance = zenBalance
    self.eggs = eggs
    self.phrases = phrases
  }
}

pub struct EggData {
  pub let id: UInt64
  pub let metadata: {String: String}

  init(id: UInt64, metadata: {String: String}) {
    self.id = id
    self.metadata = metadata
  }
}

pub struct PhraseData {
  pub let id: UInt64
  pub let metadata: {String: String}

  init(id: UInt64, metadata: {String: String}) {
    self.id = id
    self.metadata = metadata
  }
}

pub fun main(address: Address): UserData {
  let acct = getAccount(address)
  
  // Get Zen token balance
  let zenVault = acct.getCapability(/public/zenTokenBalance)
    .borrow<&{ZenToken.Balance}>()
  
  let zenBalance = zenVault != nil ? zenVault!.balance : 0.0
  
  // Get EggWisdom NFTs
  let eggCollection = acct.getCapability(EggWisdom.CollectionPublicPath)
    .borrow<&{EggWisdom.EggWisdomCollectionPublic}>()
  
  let eggs: [EggData] = []
  if eggCollection != nil {
    let eggIds = eggCollection!.getIDs()
    for id in eggIds {
      let egg = eggCollection!.borrowEggWisdom(id: id)
      eggs.append(EggData(id: id, metadata: egg.getMetadata()))
    }
  }
  
  // Get WisdomPhrase NFTs
  let phraseCollection = acct.getCapability(EggWisdom.PhraseCollectionPublicPath)
    .borrow<&{EggWisdom.WisdomPhraseCollectionPublic}>()
  
  let phrases: [PhraseData] = []
  if phraseCollection != nil {
    let phraseIds = phraseCollection!.getIDs()
    for id in phraseIds {
      let phrase = phraseCollection!.borrowWisdomPhrase(id: id)
      phrases.append(PhraseData(id: id, metadata: phrase.getMetadata()))
    }
  }
  
  return UserData(
    address: address,
    zenBalance: zenBalance,
    eggs: eggs,
    phrases: phrases
  )
}
`;

const getLeaderboardScript = `
import ZenToken from 0xEggWisdom

pub struct LeaderboardEntry {
  pub let address: Address
  pub let zenBalance: UFix64
  pub let rank: UInt8

  init(address: Address, zenBalance: UFix64, rank: UInt8) {
    self.address = address
    self.zenBalance = zenBalance
    self.rank = rank
  }
}

pub struct LeaderboardData {
  pub let entries: [LeaderboardEntry]
  pub let totalZenSupply: UFix64

  init(entries: [LeaderboardEntry], totalZenSupply: UFix64) {
    self.entries = entries
    self.totalZenSupply = totalZenSupply
  }
}

pub fun main(): LeaderboardData {
  let zenAdmin = getAccount(${FLOW_ADDRESSES.EggWisdom})
    .getCapability(/public/zenTokenAdmin)
    .borrow<&{ZenToken.Administrator}>()
    ?? panic("Could not borrow admin capability")
  
  let leaderboard = zenAdmin.getLeaderboard(limit: 10)
  
  let entries: [LeaderboardEntry] = []
  var rank: UInt8 = 1
  
  for entry in leaderboard {
    entries.append(LeaderboardEntry(
      address: entry.address,
      zenBalance: entry.balance,
      rank: rank
    ))
    rank = rank + 1
  }
  
  return LeaderboardData(
    entries: entries,
    totalZenSupply: zenAdmin.getTotalSupply()
  )
}
`;

// Flow service functions
export const FlowService = {
  // Authentication
  authenticate: fcl.authenticate,
  unauthenticate: fcl.unauthenticate,
  currentUser: fcl.currentUser,

  // Transactions
  mintEggWisdom: async () => {
    const transactionId = await fcl.mutate({
      cadence: mintEggWisdomTx,
      limit: 100
    });

    return fcl.tx(transactionId).onceSealed();
  },

  mintWisdomPhrase: async () => {
    const transactionId = await fcl.mutate({
      cadence: mintWisdomPhraseTx,
      limit: 100
    });

    return fcl.tx(transactionId).onceSealed();
  },

  uploadWisdomImage: async (imageBase64: string, players: string[], cats: string[]) => {
    const transactionId = await fcl.mutate({
      cadence: uploadWisdomImageTx,
      args: (arg, t) => [
        arg(imageBase64, t.String),
        arg(players, t.Array(t.String)),
        arg(cats, t.Array(t.String))
      ],
      limit: 1000 // Higher limit for image upload
    });

    return fcl.tx(transactionId).onceSealed();
  },

  petEggWisdom: async (eggId: number) => {
    const transactionId = await fcl.mutate({
      cadence: petEggWisdomTx,
      args: (arg, t) => [arg(eggId, t.UInt64)],
      limit: 100
    });

    return fcl.tx(transactionId).onceSealed();
  },

  // Queries
  getUserData: async (address: string) => {
    return fcl.query({
      cadence: getUserDataScript,
      args: (arg, t) => [arg(address, t.Address)]
    });
  },

  getLeaderboard: async () => {
    return fcl.query({
      cadence: getLeaderboardScript
    });
  }
}; 