import FrogDash from 0x34a43e3b12517b72

access(all)
fun main(id:UInt64): Address {
  return FrogDash.get_top_scorer(id: id)
}