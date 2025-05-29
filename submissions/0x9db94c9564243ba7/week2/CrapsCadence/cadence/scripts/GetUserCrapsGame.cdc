import "OnchainCraps"

access(all)
fun main(parent: Address): &OnchainCraps.Game? {

  let userAccount = getAuthAccount<auth(BorrowValue) &Account>(parent)
  let crapsGameRef = userAccount.storage.borrow<&OnchainCraps.Game>(from: OnchainCraps.GameStoragePath)

  return crapsGameRef
}
