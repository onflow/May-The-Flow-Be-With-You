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

  access (all) struct BetResult {
    access (all) let bet: String
    access (all) let betAmount: UFix64
    access (all) let status: String //WIN, LOSE, HOLD
    access (all) let resultAmount: UFix64? //How much won/lost

    init(bet: String, betAmount: UFix64, status: String, resultAmount: UFix64?) {
        self.bet = bet
        self.betAmount = betAmount
        self.status = status
        self.resultAmount = resultAmount != nil ? resultAmount : nil
    }
  }

  access(all) struct RollResult {
    access(all) let diceValue: UInt8
    access (all) let rollResults: [BetResult]
    //WE MAY WANT TO ADD STATUS TO ROLL RESULT

    init(value: UInt8, rollResults: [BetResult]) {
        self.diceValue = value
        self.rollResults = rollResults
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


    access (contract) fun fieldBet(diceTotal: UInt8, betAmount: UFix64) : OnchainCraps.BetResult {

      var betStatus: String = ""
      var resultAmount: UFix64? = nil

      //process and add field to roll result
      if diceTotal == 12 || diceTotal == 2 {
        betStatus = "WIN"
        resultAmount = betAmount * 2.0
        //send resultAmount of coins to user

      } else if diceTotal == 3 || diceTotal == 4 || diceTotal == 9 || diceTotal == 10 || diceTotal == 11 {
        betStatus = "WIN"
        resultAmount = betAmount
        //send resultAmount of coins to user
      } else {
        betStatus = "LOSE"
        resultAmount = betAmount
      }
      return OnchainCraps.BetResult(bet: "FIELD", betAmount: betAmount, status: betStatus, resultAmount: resultAmount )
    }


    access (all) fun rollDice(userAddress: Address, newBets: { String : UFix64 }? ) : RollResult {

      // Generate first & seconde dice roll (1-6)
      let firstRoll = revertibleRandom<UInt8>(modulo: 6) + 1
      let secondRoll = revertibleRandom<UInt8>(modulo: 6) + 1
      let diceTotal = firstRoll + secondRoll

      let rollResult: [OnchainCraps.BetResult] = []

      if self.state == OnchainCraps.GameState.COMEOUT {

        //assert that there is at least 1 bet on the board & bet must be PASS or Field
        assert(newBets != nil && newBets!.length >= 1, message: "Come out rolls need a bet placed")

        //loop through bets and update the state of this game
        for bet in newBets?.keys! {

          let currentBet = newBets![bet]!
          let allowedBets = OnchainCraps.allowedBets[OnchainCraps.GameState.COMEOUT]!
          //make sure newBets only cointains keys "PASS" and "FIELD
          assert(OnchainCraps.allowedBets[self.state]!.contains(bet), message: "Come out rolls can only have PASS or FIELD bets")
          assert(currentBet >= 0.1, message: "Bet must be greater than 0.1")
          
          if bet == "FIELD" {
            let fieldResult = self.fieldBet(diceTotal: diceTotal, betAmount: currentBet)
            rollResult.append(fieldResult)
          } else if bet == "PASS" {

            var betStatus: String = ""
            var resultAmount: UFix64? = nil

            if self.bets[bet] != nil {
              self.bets[bet] = currentBet + self.bets[bet]!
            } else {
              self.bets[bet] = currentBet
            }

            let betAmount = self.bets[bet]!

            // Check for craps (lose) first
            if diceTotal == 2 || diceTotal == 3 || diceTotal == 12 {

              betStatus = "LOSE"
              resultAmount = self.bets.remove(key: "PASS") //remove the bet

              //send "resultAmount" of coins to the admin account - payment todo


            } else if diceTotal == 7 || diceTotal == 11 { // Check for natural win (7 or 11)

              //need to get users account to send
              betStatus = "WIN"
              resultAmount = self.bets["PASS"]
              let userRef = getAccount(userAddress)

              //send the userPayout to the user - payment todo

            } else { //if we get here, it's a valid point number (4,5,6,8,9,10)

              self.point = Int(diceTotal)
              self.state = OnchainCraps.GameState.POINT
              betStatus = "HOLD"
            }

            rollResult.append(OnchainCraps.BetResult(bet: "PASS", betAmount: betAmount, status: betStatus, resultAmount: resultAmount )) //TODO - we should't return until the end
          }
        }
      } else if self.state == OnchainCraps.GameState.POINT {

        //loop through bets and update the state of this game
        for bet in newBets?.keys! {
          let currentBet = newBets![bet]!
          assert(OnchainCraps.allowedBets[self.state]!.contains(bet), message: "This bet is not allowed during the POINT phase")

          var betStatus: String = ""
          var resultAmount: UFix64? = nil

          if self.bets[bet] != nil {
            self.bets[bet] = currentBet + self.bets[bet]!
          } else {
            self.bets[bet] = currentBet
          }

          let betAmount = self.bets[bet]!
          
          if bet == "FIELD" {
            let fieldResult = self.fieldBet(diceTotal: diceTotal, betAmount: betAmount)
            rollResult.append(fieldResult)
          } else if bet == "CRAPS" { //2, 3, 12 - single bet

          } else if bet == "YO" { //11 - single bet

          }

        }
      }


      return OnchainCraps.RollResult(value: diceTotal, rollResults: rollResult)
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
      OnchainCraps.GameState.POINT:["FIELD", "COME", "CRAPS", "YO", "4", "5", "6", "8", "9", "10", "Odds"]
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