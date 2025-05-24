import RandomArt from "../contracts/RandomArt.cdc"

access(all) fun main(id: UInt64): RandomArt.ArtPiece? {
    let result = RandomArt.getArtPiece(id: id)
    if result != nil {
        return result
    }
    return nil
} 