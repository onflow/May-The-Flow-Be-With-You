import FrogDash from 0x34a43e3b12517b72

access(all)
fun main(id:UInt64, addr:Address): &FrogDash.UserScoreBoard {
  return FrogDash.get_user_score_board(id: id, addr: addr)
}