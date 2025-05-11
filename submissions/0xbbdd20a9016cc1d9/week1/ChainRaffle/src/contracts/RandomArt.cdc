access(all) contract RandomArt {
    // Event emitted when new art is generated
    access(all) event ArtGenerated(id: UInt64, seed: UInt64, timestamp: UFix64)

    // Structure to store art piece data
    access(all) struct ArtPiece {
        access(all) let id: UInt64
        access(all) let seed: UInt64
        access(all) let timestamp: UFix64
        access(all) let colors: [String]
        access(all) let pattern: UInt8

        init(id: UInt64, seed: UInt64, timestamp: UFix64, colors: [String], pattern: UInt8) {
            self.id = id
            self.seed = seed
            self.timestamp = timestamp
            self.colors = colors
            self.pattern = pattern
        }
    }

    // Dictionary to store generated art pieces
    access(self) var artPieces: {UInt64: ArtPiece}
    access(self) var nextID: UInt64
    access(self) var predefinedColors: [String]

    init() {
        self.artPieces = {}
        self.nextID = 1
        self.predefinedColors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080", "#008000", "#000080"]
    }

    // Generate a new piece of random art
    access(all) fun generateArt(): ArtPiece {
        // Get a random seed using Flow's built-in randomness
        let seed = self.getRandomSeed()

        // Generate random colors
        let colors = self.generateRandomColors(seed: seed)

        // Generate random pattern type
        let pattern = self.getRandomPattern(seed: seed)

        // Create timestamp
        let timestamp = getCurrentBlock().timestamp

        // Create new art piece
        let artPiece = ArtPiece(
            id: self.nextID,
            seed: seed,
            timestamp: timestamp,
            colors: colors,
            pattern: pattern
        )

        // Store the art piece
        self.artPieces[self.nextID] = artPiece

        // Increment ID for next piece
        self.nextID = self.nextID + 1

        // Emit event
        emit ArtGenerated(id: artPiece.id, seed: seed, timestamp: timestamp)

        return artPiece
    }

    // Get a random seed using Flow's built-in randomness
    access(self) fun getRandomSeed(): UInt64 {
        return getCurrentBlock().height
    }

    // Generate random colors based on seed
    access(self) fun generateRandomColors(seed: UInt64): [String] {
        let colors: [String] = []
        let height = getCurrentBlock().height

        // Select 3 random colors from predefined list
        let index1 = Int(height % 10)
        let index2 = Int((height + 1) % 10)
        let index3 = Int((height + 2) % 10)

        colors.append(self.predefinedColors[index1])
        colors.append(self.predefinedColors[index2])
        colors.append(self.predefinedColors[index3])

        return colors
    }

    // Generate random pattern type
    access(self) fun getRandomPattern(seed: UInt64): UInt8 {
        let height = getCurrentBlock().height
        let pattern = height % 4
        return UInt8(pattern)
    }

    // Get art piece by ID
    access(all) fun getArtPiece(id: UInt64): ArtPiece? {
        if self.artPieces[id] != nil {
            return self.artPieces[id]
        }
        return nil
    }

    // Get all art pieces
    access(all) fun getAllArtPieces(): [ArtPiece] {
        let pieces: [ArtPiece] = []
        for piece in self.artPieces.values {
            pieces.append(piece)
        }
        return pieces
    }
} 