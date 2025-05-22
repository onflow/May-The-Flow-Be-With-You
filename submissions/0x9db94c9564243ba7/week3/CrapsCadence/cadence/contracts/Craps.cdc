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
    //access(all) var come: Int?
    access(all) var bets: { String : UFix64 }
    access(all) let id: UInt64

    //add overall userInfo here instead of above


    access (contract) fun fieldBet(diceTotal: UInt8, betAmount: UFix64) : OnchainCraps.BetResult {

      var betStatus: String = ""
      var resultAmount: UFix64? = nil

      //process and add field to roll result
      if diceTotal == 12 || diceTotal == 2 {
        betStatus = "WIN"
        resultAmount = betAmount * 3.0
        //send resultAmount of coins to user

      } else if diceTotal == 3 || diceTotal == 4 || diceTotal == 9 || diceTotal == 10 || diceTotal == 11 {
        betStatus = "WIN"
        resultAmount = betAmount * 2.0
        //send resultAmount of coins to user
      } else {
        betStatus = "LOSE"
        resultAmount = betAmount
      }
      return OnchainCraps.BetResult(bet: "FIELD", betAmount: betAmount, status: betStatus, resultAmount: resultAmount )
    }


    access (all) fun rollDice(userAddress: Address, newBets: { String : UFix64 }? ) : RollResult {

      if self.state == OnchainCraps.GameState.COMEOUT && (newBets == nil || newBets!.length == 0)  { //IF its the comeout roll, we need at least 1 bet placed
        assert(self.bets["POINT"] != nil && self.bets["POINT"]! > 0.0, message: "Come out bets need a bet placed" )
      }

      // Generate first & seconde dice roll (1-6)
      let firstRoll = revertibleRandom<UInt8>(modulo: 6) + 1
      let secondRoll = revertibleRandom<UInt8>(modulo: 6) + 1
      let diceTotal = firstRoll + secondRoll

      let rollResult: [OnchainCraps.BetResult] = []

      //process all prop bets first, since there is no memory or storage needed
      if newBets != nil {
        for bet in newBets?.keys! {

          let currentBet = self.bets[bet]!
          assert(OnchainCraps.allowedBets[self.state]!.contains(bet), message: "This bet is not allowed during the current gmame phase")

          if bet == "FIELD" {
            let fieldResult = self.fieldBet(diceTotal: diceTotal, betAmount: newBets![bet]!)
            rollResult.append(fieldResult)
          } else if bet == "CRAPS" {
            var betStatus: String = ""
            var resultAmount: UFix64? = nil
            if diceTotal == 12 || diceTotal == 2 || diceTotal == 3 {
              betStatus = "WIN"
              resultAmount = newBets![bet]! * 8.0 //7:1 odds plus buy-in back
              //send resultAmount of coins to user

            } else {
              betStatus = "LOSE"
              resultAmount = newBets![bet]!
              //send newBets![bet]! to the admin

            }
            rollResult.append(OnchainCraps.BetResult(bet: bet, betAmount: newBets![bet]!, status: betStatus, resultAmount: resultAmount))
          } else if bet == "YO" {
            var betStatus: String = ""
            var resultAmount: UFix64? = nil
            if diceTotal == 11 {
              betStatus = "WIN"
              resultAmount = newBets![bet]! * 16.0 //15:1 odds plus buy-in back
              //send resultAmount of coins to user

            } else {
              betStatus = "LOSE"
              resultAmount = newBets![bet]!
              //send newBets![bet]! to the admin
            }
            rollResult.append(OnchainCraps.BetResult(bet: bet, betAmount: newBets![bet]!, status: betStatus, resultAmount: resultAmount ))
          } else { //this is not a Prop bet, so we should add it to our bets
            let currentBet = newBets![bet]!
            if self.bets[bet] != nil {
              self.bets[bet] = currentBet + self.bets[bet]!
            } else {
              self.bets[bet] = currentBet
            }
          } 
        }
      }

      if self.bets.length == 0 { //If there are only prop bets then we can return
        return OnchainCraps.RollResult(value: diceTotal, rollResults: rollResult)
      }

      if self.bets["ODDS"] != nil {
        assert(self.bets["PASS"] != nil, message: "Odds bet needs a point bet")
        assert((self.bets["PASS"]! * 5.0 ) > self.bets["ODDS"]!, message: "Odds must be less than 5x")
      }

      if self.state == OnchainCraps.GameState.COMEOUT {
        for bet in self.bets.keys { //loop through bets and update the state of this game

          let currentBet = self.bets[bet]!
          let allowedBets = OnchainCraps.allowedBets[OnchainCraps.GameState.COMEOUT]!
          //make sure newBets only cointains keys "PASS" and "FIELD
          assert(OnchainCraps.allowedBets[self.state]!.contains(bet), message: "Come out rolls can only have PASS or FIELD bets")
          assert(currentBet >= 0.1, message: "Bet must be greater than 0.1")
          
          if bet == "PASS" {

            var betStatus: String = ""
            var resultAmount: UFix64? = nil

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
        for bet in self.bets.keys {

          var betStatus: String = ""
          var resultAmount: UFix64? = nil

          let betAmount = self.bets[bet]!
          let userRef: &Account = getAccount(userAddress)

          if diceTotal == 7 {
            betStatus = "LOSE"
            resultAmount = self.bets.remove(key: bet) //remove the bet
            rollResult.append(OnchainCraps.BetResult(bet: bet, betAmount: betAmount, status: betStatus, resultAmount: resultAmount )) //TODO - we should't return until the end
            self.state = OnchainCraps.GameState.COMEOUT //reset game state
            //send "resultAmount" of coins to the admin account - payment todo
            
          } else if bet == "PASS" {
            if Int(diceTotal) == self.point {
              betStatus = "WIN"
              resultAmount = 2.0 * self.bets.remove(key: bet)! //remove the bet, clear the table
              self.state = OnchainCraps.GameState.COMEOUT //reset game state
              rollResult.append(OnchainCraps.BetResult(bet: bet, betAmount: betAmount, status: betStatus, resultAmount: resultAmount )) //TODO - we should't return until the end
              //send the resultAmount to the user - payment todo
            }
          } else if bet == "ODDS" { //pass line odds
            if Int(diceTotal) == self.point {
              betStatus = "WIN"
              resultAmount = self.bets[bet]

              if self.point  == 6 || self.point == 8 {
                resultAmount = resultAmount! * 1.2
              } else if self.point == 5 || self.point == 9 {
                resultAmount = resultAmount! * 1.5
              } else if self.point == 4 || self.point == 10 {
                resultAmount = resultAmount! * 2.0
              }

              resultAmount = resultAmount! + self.bets.remove(key: bet)! //remove the bet, clear the table
              self.state = OnchainCraps.GameState.COMEOUT //reset game state
              
              rollResult.append(OnchainCraps.BetResult(bet: bet, betAmount: betAmount, status: betStatus, resultAmount: resultAmount )) //TODO - we should't return until the end
              //send the resultAmount to the user - payment todo
            }
          } else if bet == "4" || bet == "5" || bet == "6" || bet == "8" || bet == "9" || bet == "10" {
            let betNumber = Int.fromString(bet)!
            if diceTotal == UInt8(betNumber) {
              betStatus = "WIN"
              resultAmount = self.bets[bet]
              
              // Apply odds based on the number
              if bet == "6" || bet == "8" {
                resultAmount = resultAmount! * 1.16666666
              } else if bet == "5" || bet == "9" {
                resultAmount = resultAmount! * 1.4
              } else if bet == "4" || bet == "10" {
                resultAmount = resultAmount! * 1.8
              }
              
              rollResult.append(OnchainCraps.BetResult(bet: bet, betAmount: betAmount, status: betStatus, resultAmount: resultAmount))
              //send the resultAmount to the user - payment todo
            }
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
      //self.come = nil
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
    self.allowedBets = { //are allowed bets necessary?
      OnchainCraps.GameState.COMEOUT:["PASS", "FIELD"], 
      OnchainCraps.GameState.POINT:["FIELD", "CRAPS", "YO", "4", "5", "6", "8", "9", "10", "ODDS"] //to add: COME
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