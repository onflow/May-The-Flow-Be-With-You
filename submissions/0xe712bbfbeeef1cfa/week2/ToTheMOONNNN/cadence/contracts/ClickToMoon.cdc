access(all) contract ClickToMoon {
    // Events
    access(all) event PlayerCreated(playerAddress: Address)
    access(all) event ThrustGenerated(playerAddress: Address, amount: UFix64)
    access(all) event UpgradePurchased(playerAddress: Address, upgradeType: String, cost: UFix64)

    // Constants
    access(all) let BASE_THRUST_PER_CLICK: UFix64 = 1.0
    access(all) let BOOSTER_COST: UFix64 = 10.0
    access(all) let AUTO_THRUSTER_COST: UFix64 = 50.0
    access(all) let AUTO_THRUST_INTERVAL: UFix64 = 60.0 // seconds
    access(all) let AUTO_THRUST_AMOUNT: UFix64 = 1.0

    // Player resource to store game state
    access(all) resource Player {
        access(all) var thrustPoints: UFix64
        access(all) var clickMultiplier: UFix64
        access(all) var autoThrusters: UFix64
        access(all) var lastAutoThrustTime: UFix64

        init() {
            self.thrustPoints = 0.0
            self.clickMultiplier = 1.0
            self.autoThrusters = 0.0
            self.lastAutoThrustTime = 0.0
        }

        // Generate thrust from clicking
        access(all) fun generateThrust() {
            let thrustAmount = ClickToMoon.BASE_THRUST_PER_CLICK * self.clickMultiplier
            self.thrustPoints = self.thrustPoints + thrustAmount
            emit ThrustGenerated(playerAddress: self.owner?.address ?? 0x0, amount: thrustAmount)
        }

        // Purchase a booster upgrade
        access(all) fun purchaseBooster() {
            pre {
                self.thrustPoints >= ClickToMoon.BOOSTER_COST: "Not enough thrust points for booster"
            }
            self.thrustPoints = self.thrustPoints - ClickToMoon.BOOSTER_COST
            self.clickMultiplier = self.clickMultiplier + 1.0
            emit UpgradePurchased(
                playerAddress: self.owner?.address ?? 0x0,
                upgradeType: "Booster",
                cost: ClickToMoon.BOOSTER_COST
            )
        }

        // Purchase an auto-thruster upgrade
        access(all) fun purchaseAutoThruster() {
            pre {
                self.thrustPoints >= ClickToMoon.AUTO_THRUSTER_COST: "Not enough thrust points for auto-thruster"
            }
            self.thrustPoints = self.thrustPoints - ClickToMoon.AUTO_THRUSTER_COST
            self.autoThrusters = self.autoThrusters + 1.0
            emit UpgradePurchased(
                playerAddress: self.owner?.address ?? 0x0,
                upgradeType: "AutoThruster",
                cost: ClickToMoon.AUTO_THRUSTER_COST
            )
        }

        // Generate passive thrust from auto-thrusters
        access(all) fun generateAutoThrust(currentTime: UFix64) {
            if self.autoThrusters > 0.0 {
                let timeDiff = currentTime - self.lastAutoThrustTime
                if timeDiff >= ClickToMoon.AUTO_THRUST_INTERVAL {
                    let thrustAmount = ClickToMoon.AUTO_THRUST_AMOUNT * self.autoThrusters
                    self.thrustPoints = self.thrustPoints + thrustAmount
                    self.lastAutoThrustTime = currentTime
                    emit ThrustGenerated(playerAddress: self.owner?.address ?? 0x0, amount: thrustAmount)
                }
            }
        }
    }

    // Storage for player resources
    access(all) resource PlayerStorage {
        access(all) var player: @Player?

        init() {
            self.player = nil
        }

        access(all) fun createPlayer() {
            if self.player == nil {
                self.player = create Player()
                emit PlayerCreated(playerAddress: self.owner?.address ?? 0x0)
            }
        }
    }

    // Initialize the contract
    init() {
        // Create a PlayerStorage resource
        let playerStorage = create PlayerStorage()
        
        // Save it to storage
        self.account.save(playerStorage, to: /storage/playerStorage)
        
        // Create a public capability
        self.account.link<&PlayerStorage>(playerStorage, target: /storage/playerStorage)
    }
} 