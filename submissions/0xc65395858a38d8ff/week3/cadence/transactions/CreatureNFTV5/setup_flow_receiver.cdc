import "FungibleToken"
import "FlowToken"

// Esta transacción configura la capacidad para recibir pagos en Flow
// Necesaria para la cuenta del propietario del contrato que recibirá los pagos por mintear

transaction {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Verificar si ya existe la capacidad pública
        if signer.capabilities.check<&{FungibleToken.Receiver}>(/public/flowTokenReceiver) {
            log("La cuenta ya tiene configurada la capacidad para recibir Flow")
            return
        }
        
        // Verificar que existe la billetera de Flow
        if signer.storage.borrow<auth(Storage) &FlowToken.Vault>(from: /storage/flowTokenVault) == nil {
            // Crear una billetera vacía
            let vault <- FlowToken.createEmptyVault()
            signer.storage.save(<-vault, to: /storage/flowTokenVault)
            
            log("Se ha creado una billetera de Flow")
        }
        
        // Crear la capacidad pública para recibir Flow
        signer.capabilities.publish(
            signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(
                /storage/flowTokenVault
            ),
            at: /public/flowTokenReceiver
        )
        
        log("Cuenta configurada para recibir pagos en Flow")
    }
} 