import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

access(all) contract FrogDash {

    access(all) event GameStarted(user:Address, id:UInt64)
    access(all) event GameEnded(user:Address, id:UInt64, lilyPoints:UInt64)
    access(all) event EmeraldBurned(user:Address, lilyPoints: UInt64)
    access(all) event NewGameCreated(id:UInt64)
    access(all) event ContractInitialized()

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
        access(all) var end_time: UFix64
        access(all) var time_stamp: UFix64
        access(all) var entries: [Address]
        // access(mapping Identity) let game_vault: @FlowToken.Vault
        access(all) var user_score_board: {Address: UserScoreBoard}
        init(){
            self.id = self.uuid
            self.start_time = getCurrentBlock().timestamp
            self.end_time = getCurrentBlock().timestamp
            self.time_stamp = 86400.0 //24 hours
            self.entries = []
            // self.game_vault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
            self.user_score_board = {}
        }

        access(all) fun _start_game(userAddr: Address) {
            pre {
                self.user_score_board[userAddr]!.turn_count < FrogDash.MAX_CHANCE: "You have only 3 chances"
                self.end_time - self.start_time < self.time_stamp : "Time is up!!!"
            }
            let poolId = self.uuid
            self.entries.append(userAddr)
            var board = self.user_score_board[userAddr] ?? panic("User board not found!!!")
            board.update_user_board(newLilyPoints: 0, newEmeraldPoints: 0)
            board.update_has_paid(paid:true)
            // self.user_score_board[userAddr] = board
            emit GameStarted(user:userAddr, id:poolId)
        }

        access(all) fun _end_game(userAddr: Address, lilyCount: UInt64, emeraldCount: UInt64) {
            pre{
                self.user_score_board[userAddr] != nil: "User not found!"
                self.user_score_board[userAddr]?.has_paid == true: "User Did Not Paid"
                self.end_time - self.start_time < self.time_stamp : "Time is up!!!"
            }
            let poolId = self.uuid
            var board = self.user_score_board[userAddr] ?? panic("User board not found!!!")
            board.update_user_board(newLilyPoints: lilyCount, newEmeraldPoints: emeraldCount)
            emit GameEnded(user:userAddr, id:poolId, lilyPoints: lilyCount)
        }

        access(all) fun burn_emerald(userAddr: Address, emerald:UInt64){
            pre{
                self.user_score_board[userAddr] != nil: "User not found!"
                self.end_time - self.start_time < self.time_stamp : "Time is up!!!"
            }
            var board = self.user_score_board[userAddr] ?? panic("User board not found!!!")
            board.burn_emerald(numberOfEmerald: emerald)
            let lilyPoints = board.lily_points
            emit EmeraldBurned(user:userAddr, lilyPoints: lilyPoints)
        }

        view access(all) fun get_user_score_board(addr:Address): FrogDash.UserScoreBoard{
            return self.user_score_board[addr] ?? panic("User board not found!!!")
        }
    }

    access(all) resource Admin {
        access(all) let game_history: @{UInt64: FrogDash.Game}

        access(contract) fun createGame() {
            FrogDash.total_games = FrogDash.total_games + 1
            let new_game <- create Game()
            let id = new_game.id
            self.game_history[new_game.id] <-! new_game
            emit NewGameCreated(id:id)
        }

        view access(all) fun borrowGame(id: UInt64): &Game? {
            return &self.game_history[id]
        }

        view access(all) fun getPoolIDs(): [UInt64] {
            return self.game_history.keys
        }

        init(){
            self.game_history <- {}
        }
    }

    view access(all) fun borrowAdmin(): &Admin {
        let borrowAdmin: &FrogDash.Admin = self.account.storage.borrow<&FrogDash.Admin>(from: /storage/FrogDash) ?? panic("Admin Not Found!!!")
        return borrowAdmin
    }

    view access(all) fun borrowPool(id: UInt64): &Game{
        return self.borrowAdmin().borrowGame(id: id) ?? panic("Game Not Found!!!")
    }

    access(all) fun start_game(id:UInt64, addr:Address) {
        let game = self.borrowPool(id: id)
        game._start_game(userAddr: addr)
    }

    access(all) fun end_game(id:UInt64, addr:Address, lilyCount:UInt64, emeraldCount:UInt64) {
        let game = self.borrowPool(id: id)
        game._end_game(userAddr: addr, lilyCount: lilyCount, emeraldCount: emeraldCount)
    }

    init() {
        self.total_games = 0
        self.MAX_CHANCE = 3

        let admin: @Admin <- create Admin()
        admin.createGame()
        self.account.storage.save(<- admin, to: /storage/FrogDash)
        emit ContractInitialized()
    }
}