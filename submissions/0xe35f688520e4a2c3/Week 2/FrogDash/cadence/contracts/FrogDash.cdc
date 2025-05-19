import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

access(all) contract FrogDash {

    access(all) event FrogDahs__GameStarted(user:Address, id:UInt64)
    access(all) event FrogDahs__GameEnded(user:Address, id:UInt64, lilyPoints:UInt64)
    access(all) event FrogDahs__EmeraldBurned(user:Address, lilyPoints: UInt64)
    access(all) event FrogDahs__NewGameCreated(id:UInt64)
    access(all) event FrogDahs__RewardClaimed(id: UInt64, address: Address, amount: UFix64)
    access(all) event FrogDahs__ContractInitialized()

    access(all) var total_games:UInt64
    access(all) let MAX_CHANCE:UInt8

    access(all) struct UserScoreBoard{
        access(all) var lily_points: UInt64
        access(all) var emerald_points: UInt64
        access(all) var has_paid: Bool
        access(all) var turn_count: UInt8
        init(){
            self.lily_points = 0
            self.emerald_points = 0
            self.has_paid = false
            self.turn_count = 0
        }

        access(contract) fun update_user_board(newLilyPoints: UInt64, newEmeraldPoints: UInt64) {
            self.lily_points = newLilyPoints
            self.emerald_points = newEmeraldPoints
            self.turn_count = self.turn_count + 1
        }

        access(contract) fun update_has_paid(paid:Bool) {
            self.has_paid = paid
        }

        access(contract) fun burn_emerald(numberOfEmerald:UInt64){
            self.emerald_points = self.emerald_points - numberOfEmerald
            self.lily_points = self.lily_points + (numberOfEmerald * 5)
        }
    }

    access(all) resource Game {
        access(all) let id:UInt64
        access(all) var start_time: UFix64
        access(all) var total_time: UFix64
        access(mapping Identity) let game_vault: @FlowToken.Vault
        access(all) var user_score_board: {Address: UserScoreBoard}
        access(all) var top_scorer: Address
        init(){
            self.id = self.uuid
            self.start_time = getCurrentBlock().timestamp
            self.total_time = 86400.0 //24 hours
            self.game_vault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
            self.user_score_board = {}
            self.top_scorer = 0x0
        }

        access(contract) fun _add_user(userAddr: Address) {
            if self.user_score_board[userAddr] == nil {
                self.user_score_board[userAddr] = FrogDash.UserScoreBoard()
            }
        }

        access(contract) fun _start_game(userAddr: Address, amount: @FlowToken.Vault) {
            pre {
                amount.balance == UFix64(UInt64(amount.balance)): "Must be a whole number"
                amount.balance >= 10.0: "Required at lest 10.0 FLOW"
                self.user_score_board[userAddr]!.turn_count < FrogDash.MAX_CHANCE: "You have only 3 chances"
                self._get_current_time() < self._get_end_time() : "Time is up!!!"
            }
            self.game_vault.deposit(from: <- amount)
            var board: FrogDash.UserScoreBoard = self.user_score_board[userAddr] ?? panic("User board not found!!!")
            board.update_has_paid(paid:true)
            emit FrogDahs__GameStarted(user:userAddr, id:self.uuid)
        }

        access(contract) fun _end_game(userAddr: Address, lilyCount: UInt64, emeraldCount: UInt64) {
            pre{
                self.user_score_board[userAddr] == nil: "User not found!"
                self.user_score_board[userAddr]?.has_paid == true: "User Did Not Paid"
                self._get_current_time() - self.start_time < self.total_time : "Time is up!!!"
            }
            let poolId = self.uuid
            var board = self.user_score_board[userAddr] ?? panic("User board not found!!!")
            board.update_user_board(newLilyPoints: lilyCount, newEmeraldPoints: emeraldCount)
            self._get_topScorer()
            emit FrogDahs__GameEnded(user:userAddr, id:poolId, lilyPoints: lilyCount)
        }

        access(contract) fun _burn_emerald(userAddr: Address, emerald:UInt64){
            pre{
                self.user_score_board[userAddr] != nil: "User not found!"
                self._get_current_time() - self.start_time < self.total_time : "Time is up!!!"
            }
            var board = self.user_score_board[userAddr] ?? panic("User board not found!!!")
            board.burn_emerald(numberOfEmerald: emerald)
            let newLilyPoints = board.lily_points
            emit FrogDahs__EmeraldBurned(user:userAddr, lilyPoints: newLilyPoints)
        }

        view access(all) fun _get_user_score_board(addr:Address): FrogDash.UserScoreBoard{
            return self.user_score_board[addr] ?? panic("User board not found!!!")
        }

        view access(all) fun _get_remaining_time(): UFix64 {
            let endTime: UFix64 = self.start_time + self.total_time
            if self._get_current_time() >= endTime {
                return 0.0
            }
            return endTime - self._get_current_time()
        }

        view access(all) fun _get_current_time():UFix64{
            return getCurrentBlock().timestamp
        }

        view access(all) fun _get_end_time():UFix64{
            return self.start_time + self.total_time
        }

        access(all) fun _claim_reward(id:UInt64, addr:Address){
            pre{
                self._get_current_time() - self.start_time > self.total_time : "Game is still on!!!"
                self.top_scorer == addr : "Wrong Address"
                self.id == id : "Wrong ID"
            }
            let balance = self.game_vault.balance
            let user = self.top_scorer
            let reward <- self.game_vault.withdraw(amount: balance)
            let claim = getAccount(user).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver) ?? panic("Could not borrow receiver reference")
            claim.deposit(from: <- reward)
            emit FrogDahs__RewardClaimed(id: self.uuid, address: user, amount: balance)
        }

        access(all) fun _get_topScorer(){
            var top_scorer: Address = 0x0
            var max_points: UInt64 = 0
            
            for key in self.user_score_board.keys {
                let points = self.user_score_board[key]!.lily_points
                if points > max_points {
                    max_points = points
                    top_scorer = key
                }
            }
            self.top_scorer = top_scorer
        }
    }

    access(all) resource Admin {
        access(all) let game_history: @{UInt64: FrogDash.Game}

        access(all) fun create_game() {
            FrogDash.total_games = FrogDash.total_games + 1
            let new_game <- create Game()
            let game_id = new_game.id
            self.game_history[new_game.id] <-! new_game
            emit FrogDahs__NewGameCreated(id:game_id)
        }

        view access(all) fun check_is_previous_game_ended(id:UInt64): Bool{
            let remaining_time = self.borrow_game(id: id)!._get_remaining_time()
            if(remaining_time > 0.0){
                return false
            }
            return true
        }

        view access(all) fun borrow_game(id: UInt64): &Game? {
            return &self.game_history[id]
        }

        view access(all) fun get_game_history_IDs(): [UInt64] { 
            return self.game_history.keys
        }

        init(){
            self.game_history <- {}
        }
    }

    view access(all) fun borrow_admin(): &Admin {
        let borrow_admin: &FrogDash.Admin = self.account.storage.borrow<&FrogDash.Admin>(from: /storage/FrogDashStorage) ?? panic("Admin Not Found!!!")
        return borrow_admin
    }

    view access(all) fun get_IDs(): [UInt64]{
        return self.borrow_admin().get_game_history_IDs()
    }

    view access(all) fun get_CurrentGameId(): UInt64{
        let ids = self.get_IDs()
        let len = ids.length
        return ids[len-1]
    }

    view access(all) fun borrow_game(id: UInt64): &Game{
        return self.borrow_admin().borrow_game(id: id) ?? panic("Game Not Found!!!")
    }

    access(all) fun start_game(id:UInt64, addr:Address, amount: @FlowToken.Vault) {
        let borrowGame = self.borrow_game(id: id)
        borrowGame._add_user(userAddr: addr)
        borrowGame._start_game(userAddr: addr, amount: <- amount)
    }

    access(all) fun claim_reward(id:UInt64, addr:Address){
        let borrowGame = self.borrow_game(id: id)
        borrowGame._claim_reward(id: id, addr: addr)
    }

    access(all) fun end_game(id:UInt64, addr:Address, lilyCount:UInt64, emeraldCount:UInt64) {
        self.borrow_game(id: id)._end_game(userAddr: addr, lilyCount: lilyCount, emeraldCount: emeraldCount)
    }

    access(all) fun burn_emerald(id:UInt64, addr:Address, numOfEmerald:UInt64){
        self.borrow_game(id: id)._burn_emerald(userAddr: addr, emerald: numOfEmerald)
    }

    view access(all) fun get_user_score_board(id:UInt64, addr:Address): &FrogDash.UserScoreBoard{
        return self.borrow_game(id: id).user_score_board[addr] ?? panic("Board not found")
    }

    view access(all) fun get_user_lily_points(id:UInt64, addr:Address): UInt64{
        return self.get_user_score_board(id:id, addr:addr).lily_points
    }

    view access(all) fun get_user_emerald_points(id:UInt64, addr:Address): UInt64{
        return self.get_user_score_board(id:id, addr:addr).emerald_points
    }

    view access(all) fun get_user_has_Paid(id:UInt64, addr:Address): Bool{
        return self.get_user_score_board(id:id, addr:addr).has_paid
    }

    view access(all) fun get_user_turn_count(id:UInt64, addr:Address): UInt8{
        return self.get_user_score_board(id:id, addr:addr).turn_count
    }

    view access(all) fun get_top_scorer(id:UInt64): Address{
        return self.borrow_game(id: id).top_scorer
    }

    view access(all) fun get_total_games(): UInt64{
        return self.total_games
    }

    init() {
        self.total_games = 0
        self.MAX_CHANCE = 3

        let admin: @Admin <- create Admin()
        admin.create_game()
        self.account.storage.save(<- admin, to: /storage/FrogDashStorage)
        emit FrogDahs__ContractInitialized()
    }
}