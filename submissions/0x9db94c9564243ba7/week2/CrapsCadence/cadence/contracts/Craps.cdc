import "FungibleToken"

access(all) contract OnchainCraps {

  access(all) let CrapsAdminStoragePath: StoragePath
  access(all) let GameStoragePath: StoragePath

  access(all) let userGames: {Address : UInt64} //map of addresses to Game Ids

  access(all) let allowedBets: {OnchainCraps.GameState : [String]}

  //an dictionary of fungible token vaults to hold multiple tokens.
  access(all) var tokenVaults: @{String : {FungibleToken.Vault}}
  access(all) var nextGameId: UInt64

  //tbd implement: access (all) let userInfo: { Address : String } - probably best to store in Game

  access(all) enum GameState: UInt8 {
    access(all) case COMEOUT /// COMEOUT Bets
    access(all) case POINT /// POINT Bets
    access(all) case RESOLVED /// TBD State
  }

  access(all) struct RollResult {
    access(all) let message: String
    access(all) let value: UInt8
    //WE MAY WANT TO ADD STATUS TO ROLL RESULT

    init(message: String, value: UInt8) {
        self.message = message
        self.value = value
    }
}

  access (all) resource Game {
    access(all) var state: OnchainCraps.GameState
    access(all) var point: Int? 
    //access(all) var pointAmount: UFix64?
    access(all) var come: Int?
    access(all) var bets: { String : UFix64 }
    access(all) let id: UInt64

    //add overall userInfo here instead of above

    access (all) fun rollDice(userAddress: Address, newBets: { String : UFix64 }? ) : RollResult {

      // Generate first & seconde dice roll (1-6)
      let firstRoll = revertibleRandom<UInt8>(modulo: 6) + 1
      let secondRoll = revertibleRandom<UInt8>(modulo: 6) + 1
      let diceTotal = firstRoll + secondRoll

      if(self.state == OnchainCraps.GameState.COMEOUT){

        //assert that there is at least 1 bet on the board & bet must be PASS or Field
        assert(newBets != nil && newBets!.length >= 1, message: "Come out rolls need a bet placed")

        //loop through bets and update the state of this game
        for bet in newBets?.keys! {

          //make sure newBets only cointains keys "PASS" and "FIELD
          assert(bet == "PASS" || bet == "FIELD", message: "Come out rolls can only have PASS or FIELD bets")

          if bet == "FIELD" {
            //process and add field to roll result
          }

          if bet == "PASS" {
            // Check for craps (lose) first
            if diceTotal == 2 || diceTotal == 3 || diceTotal == 12 {
              
              //send coins to the admin account - payment todo
              return OnchainCraps.RollResult( message: "LOSE", value: diceTotal) //TODO - we should't return until the end
            }
            
            // Check for natural win (7 or 11)
            if diceTotal == 7 || diceTotal == 11 {
              //payout the user 1:1
              let userPayout = self.bets["PASS"]! 

              //need to get users account to send
              let userRef = getAccount(userAddress)
              //send the userPayout to the user - payment todo

              return OnchainCraps.RollResult( message: "WIN", value: diceTotal)  //TODO - we should't return until the end
            } 
            
            // If we get here, it's a valid point number (4,5,6,8,9,10)
            if diceTotal == 4 || diceTotal == 5 || diceTotal == 6 || 
                diceTotal == 8 || diceTotal == 9 || diceTotal == 10 {
              //set the point
              self.point = Int(diceTotal)
              self.state = OnchainCraps.GameState.POINT
              
              if self.bets.length < 1 { //self.bets > 0
                self.bets = newBets!
              } else {
                // TODO - Merge Pass Line bets
              }

              return OnchainCraps.RollResult(message: "NONE", value: diceTotal)  //TODO - we should't return until the end
            }
          }
        }
      }

      //we will probably take this out
      return OnchainCraps.RollResult( message: "NORESOLVE", value: diceTotal)

    }

    init() {
      self.id = OnchainCraps.nextGameId
      OnchainCraps.nextGameId = OnchainCraps.nextGameId + 1

      self.state = OnchainCraps.GameState.COMEOUT //we will need to change this to the enum
      self.point = nil
      //self.pointAmount = nil
      self.come = nil
      self.bets = {}
    }
  }

  access (all) fun createDiceGame() : @Game {
    return <- create OnchainCraps.Game()
  } 

  access (all) resource CrapsAdmin {
    //functions to add:

    //transfer coins out of the Craps Vault
    //ability to add new token vaults
    //add new bets
  }

  init(){
    self.allowedBets = {
      OnchainCraps.GameState.COMEOUT:["PASS", "FIELD"],
      OnchainCraps.GameState.POINT:["COME", "FIELD", "CRAPS", "YO", "2", "3", "4", "5", "6", "8", "9", "10", "11", "12", "Odds"]
    }
    self.userGames = {}
    self.tokenVaults <- {} //add aiSportsJuice

    self.nextGameId = 1

    // Set the named paths
    self.CrapsAdminStoragePath = /storage/CrapsAdmin
    self.GameStoragePath = /storage/OnchainCraps

    self.account.storage.save(<-create CrapsAdmin(), to: self.CrapsAdminStoragePath)
  }

}