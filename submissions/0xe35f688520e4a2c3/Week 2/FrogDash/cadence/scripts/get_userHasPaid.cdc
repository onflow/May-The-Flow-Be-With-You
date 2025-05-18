import FrogDash from 0x34a43e3b12517b72

access(all)
fun main(id:UInt64, addr:Address): Bool {
  return FrogDash.get_user_has_Paid(id: id, addr: addr)
}