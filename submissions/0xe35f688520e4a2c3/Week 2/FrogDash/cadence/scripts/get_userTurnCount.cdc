import FrogDash from 0x34a43e3b12517b72

access(all)
fun main(id:UInt64, addr:Address): UInt8 {
  return FrogDash.get_user_turn_count(id: id, addr: addr)
}