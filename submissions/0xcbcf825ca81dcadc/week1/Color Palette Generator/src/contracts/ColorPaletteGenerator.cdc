access(all) contract ColorPaletteGenerator {
    // Structure to represent a color in RGB format
    access(all) struct Color {
        access(all) let red: UInt8
        access(all) let green: UInt8
        access(all) let blue: UInt8

        init(red: UInt8, green: UInt8, blue: UInt8) {
            self.red = red
            self.green = green
            self.blue = blue
        }

        // Function to check if two colors are similar
        access(all) fun isSimilarTo(_ other: Color): Bool {
            let redDiff = self.absoluteDifference(self.red, other.red)
            let greenDiff = self.absoluteDifference(self.green, other.green)
            let blueDiff = self.absoluteDifference(self.blue, other.blue)
            
            return redDiff < 30 && greenDiff < 30 && blueDiff < 30
        }

        // Helper function to safely calculate absolute difference between UInt8 values
        access(all) fun absoluteDifference(_ a: UInt8, _ b: UInt8): UInt8 {
            if a >= b {
                return a - b
            }
            return b - a
        }
    }

    // Structure to represent a color palette
    access(all) struct ColorPalette {
        access(all) let colors: [Color]
        access(all) let timestamp: UFix64

        init(colors: [Color]) {
            self.colors = colors
            self.timestamp = getCurrentBlock().timestamp
        }
    }

    // Keep track of a nonce to add entropy
    access(self) var nonce: UInt64
    access(self) var lastGeneratedTimestamp: UFix64

    init() {
        self.nonce = 0
        self.lastGeneratedTimestamp = 0.0
    }

    // Helper function to limit a number within a range
    access(self) fun clamp(_ value: UInt16, _ minValue: UInt16, _ maxValue: UInt16): UInt16 {
        if value < minValue {
            return minValue
        }
        if value > maxValue {
            return maxValue
        }
        return value
    }

    // Generate a random number between 0 and max
    access(all) fun generateRandomNumber(max: UInt64, seed: UInt64): UInt8 {
        // Increment nonce
        self.nonce = self.nonce + 1

        // Get current block info for entropy
        let timestamp = getCurrentBlock().timestamp
        
        // Convert timestamp to integer safely
        let timeInt = UInt64(timestamp) // This will take the whole number part
        let timeFraction = UInt64((timestamp - UFix64(timeInt)) * 1000000.0) // Get microseconds
        
        // Combine multiple sources of entropy
        let seed1 = timeInt // timestamp whole number part
        let seed2 = timeFraction // microseconds part
        let seed3 = self.nonce // nonce component
        let seed4 = seed // Additional seed parameter
        
        // Mix the seeds using a more complex formula
        let mixed = ((seed1 ^ seed2) + (seed3 * seed4)) % max
        
        return UInt8(mixed)
    }

    // Generate a random color with good distribution
    access(all) fun generateRandomColor(seed: UInt64): Color {
        // Generate base colors with different seeds
        let red = self.generateRandomNumber(max: 256, seed: seed)
        let green = self.generateRandomNumber(max: 256, seed: seed + 1)
        let blue = self.generateRandomNumber(max: 256, seed: seed + 2)

        // Calculate total brightness
        let total = UInt16(red) + UInt16(green) + UInt16(blue)
        
        if total < 200 {
            // Too dark, increase brightness
            let component = self.generateRandomNumber(max: 3, seed: seed + 3)
            if component == 0 {
                let newRed = self.clamp(UInt16(red) + 100, 0, 255)
                return Color(red: UInt8(newRed), green: green, blue: blue)
            } else if component == 1 {
                let newGreen = self.clamp(UInt16(green) + 100, 0, 255)
                return Color(red: red, green: UInt8(newGreen), blue: blue)
            } else {
                let newBlue = self.clamp(UInt16(blue) + 100, 0, 255)
                return Color(red: red, green: green, blue: UInt8(newBlue))
            }
        } else if total > 650 {
            // Too light, decrease brightness
            let component = self.generateRandomNumber(max: 3, seed: seed + 4)
            if component == 0 {
                let newRed = self.clamp(UInt16(red) - 100, 0, 255)
                return Color(red: UInt8(newRed), green: green, blue: blue)
            } else if component == 1 {
                let newGreen = self.clamp(UInt16(green) - 100, 0, 255)
                return Color(red: red, green: UInt8(newGreen), blue: blue)
            } else {
                let newBlue = self.clamp(UInt16(blue) - 100, 0, 255)
                return Color(red: red, green: green, blue: UInt8(newBlue))
            }
        }

        return Color(red: red, green: green, blue: blue)
    }

    // Generate a palette with a specified number of colors
    access(all) fun generatePalette(colorCount: Int): ColorPalette {
        pre {
            colorCount >= 3 && colorCount <= 5: "Color count must be between 3 and 5"
        }

        var colors: [Color] = []
        var attempts = 0
        let maxAttempts = 20 // Prevent infinite loops
        
        // Update timestamp to ensure different seeds
        self.lastGeneratedTimestamp = getCurrentBlock().timestamp
        
        // Convert timestamp to a safe seed value
        let baseTimeSeed = UInt64(self.lastGeneratedTimestamp)

        while colors.length < colorCount && attempts < maxAttempts {
            // Generate a new color with a unique seed
            let seed = baseTimeSeed + UInt64(attempts) * 1000
            let newColor = self.generateRandomColor(seed: seed)
            
            // Check if this color is different enough from existing colors
            var isDifferent = true
            for existingColor in colors {
                if newColor.isSimilarTo(existingColor) {
                    isDifferent = false
                    break
                }
            }
            
            if isDifferent {
                colors.append(newColor)
            }
            
            attempts = attempts + 1
        }

        // If we couldn't generate enough different colors, fill with fallback colors
        while colors.length < colorCount {
            let fallbackSeed = baseTimeSeed + UInt64(colors.length) * 2000
            colors.append(self.generateRandomColor(seed: fallbackSeed))
        }

        return ColorPalette(colors: colors)
    }
} 