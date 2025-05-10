import RandomArt from "../contracts/RandomArt.cdc"

transaction {
    prepare(signer: auth(SaveValue) &Account) {
        // Generate new art piece
        let artPiece = RandomArt.generateArt()
        
        // Log the generated art piece details
        log("Generated Art Piece:")
        log("ID: ".concat(artPiece.id.toString()))
        log("Seed: ".concat(artPiece.seed.toString()))
        
        // Log each color separately
        log("Colors:")
        for color in artPiece.colors {
            log(color)
        }
        
        log("Pattern: ".concat(artPiece.pattern.toString()))
    }

    execute {
        // Transaction execution logic
    }
} 