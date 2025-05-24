import CreatureNFTV6 from 0x2444e6b4d9327f09

access(all) fun main(): Bool {
    let cap = getAccount(0x2444e6b4d9327f09)
        .capabilities.borrow<&CreatureNFTV6.NFTMinter>(/public/CreatureNFTV6Minter)
    
    if cap == nil {
        log("Error: No se pudo tomar prestada la capacidad /public/CreatureNFTV6Minter de la cuenta 0x2444e6b4d9327f09")
        return false
    } else {
        log("Éxito: Se pudo tomar prestada la capacidad /public/CreatureNFTV6Minter.")
        return true
    }
} 