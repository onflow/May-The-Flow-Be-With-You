import FrogDash from 0x33fbabd18734ed44

access(all)
fun main(id:UInt64): Address {
  return FrogDash.get_top_scorer(id: id)
}