import FrogDash from 0x33fbabd18734ed44

access(all)
fun main(id:UInt64, addr:Address): UInt8 {
  return FrogDash.get_user_turn_count(id: id, addr: addr)
}