import FrogDash from 0x34a43e3b12517b72

access(all)
fun main(): GameDetails{
  let gameId = FrogDash.get_CurrentGameId()
  let gameRef =  FrogDash.borrow_game(id: gameId)
  return GameDetails(id:gameRef.id, topScrore:gameRef.top_scorer, statTime:gameRef.start_time, gameTotalTime:gameRef.total_time)
}    

access(all) struct GameDetails{
    access(all) let id:UInt64
    access(all) let topScrore:Address
    access(all) let statTime: UFix64
    access(all) let gameTotalTime:UFix64
    access(all) let endTime:UFix64
    access(all) var remainingTime:UFix64

    init(id:UInt64, topScrore:Address, statTime:UFix64, gameTotalTime:UFix64){
        self.id = id
        self.topScrore = topScrore
        self.statTime = statTime
        self.gameTotalTime = gameTotalTime
        self.endTime = statTime + gameTotalTime
        self.remainingTime = self._remainingTime()
    }

    access(all) fun _remainingTime(): UFix64{
        if(getCurrentBlock().timestamp < self.endTime){
            return self.endTime - getCurrentBlock().timestamp  
        }else{
            return 0.0
        }
    }
}