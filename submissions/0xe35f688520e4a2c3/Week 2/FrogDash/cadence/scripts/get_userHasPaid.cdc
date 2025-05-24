import FrogDash from 0x33fbabd18734ed44

access(all)
fun main(id:UInt64, addr:Address): Bool {
  return FrogDash.get_user_has_Paid(id: id, addr: addr)
}