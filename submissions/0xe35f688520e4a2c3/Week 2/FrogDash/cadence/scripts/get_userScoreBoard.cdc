import FrogDash from 0x33fbabd18734ed44

access(all)
fun main(id:UInt64, addr:Address): &FrogDash.UserScoreBoard {
  return FrogDash.get_user_score_board(id: id, addr: addr)
}