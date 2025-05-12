access(all) contract OnchainDice {

  access(all) let userGames: {Address : OnchainDice.Game}

  access(all) let allowedBets: {OnchainDice.GameState : [String]}

  //to implement: access (all) let userInfo: { Address : String }

  access(all) enum GameState: UInt8 {
    access(all) case NOBETS /// No Bets currently
    access(all) case COMEOUT /// COMEOUT Bets
    access(all) case POINT /// POINT Bets
    access(all) case RESOLVED /// TBD State
  }

  access (all) struct Bet {
    access (all) let betType: String
    access (all) let amount: UFix64

    init(betType: String, amount: UFix64){
      self.betType = betType
      self.amount = amount
    }
  }

  access (all) struct Game {
    access(all) var state: OnchainDice.GameState
    access(all) var point: Int? 
    access(all) var pointAmount: UFix64?
    access(all) var come: Int?
    access(all) var bets: { String : Bet }

    init() {
      self.state = OnchainDice.GameState.COMEOUT //we will need to change this to the enum
      self.point = nil
      self.pointAmount = nil
      self.come = nil
      self.bets = {}
    }
  }

  //add an Admin resource

  init(){
    self.allowedBets = {
      OnchainDice.GameState.COMEOUT:["PASS", "FIELD"],
      OnchainDice.GameState.POINT:["COME", "FIELD", "CRAPS", "YO", "2", "3", "4", "5", "6", "8", "9", "10", "11", "12", "Odds"]
    }
    self.userGames = {}
  }

}