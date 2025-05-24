import "NonFungibleToken"
import "CreatureNFTV2"

// Esta transacción procesa la evolución de una criatura NFT V2 basada en
// el tiempo transcurrido desde la última actualización. Utiliza la semilla inicial
// de la criatura para generar semillas diarias deterministas, permitiendo
// una evolución consistente y predecible sin necesidad de almacenar estados adicionales.
// Simula 300 steps de evolución por día, siguiendo el modelo de la simulación en Python.

transaction(nftID: UInt64, segundosPorDiaSimulado: UFix64, stepsPerDay: UInt64) {
    // Referencia al NFT que se va a actualizar
    let nftRef: &CreatureNFTV2.NFT
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Obtener referencia a la colección del firmante
        let collectionRef = signer.storage.borrow<&CreatureNFTV2.Collection>(from: CreatureNFTV2.CollectionStoragePath)
            ?? panic("No se pudo obtener referencia a la colección. Asegúrate de que la cuenta esté configurada correctamente.")
            
        // Obtener referencia a la criatura específica
        self.nftRef = collectionRef.borrowCreatureNFT(id: nftID)
            ?? panic("No se pudo obtener referencia a la criatura con ID ".concat(nftID.toString()))
    }
    
    execute {
        // Funciones matemáticas auxiliares para evitar errores
        fun abs(_ value: UFix64): UFix64 {
            if value < 0.0 {
                return 0.0 - value
            }
            return value
        }
        
        // Verificar si la criatura está viva
        if !self.nftRef.estaViva {
            log("La criatura ".concat(self.nftRef.id.toString()).concat(" no está viva. No se procesará evolución."))
            return
        }
        
        // Obtener timestamp actual
        let currentTimestamp = getCurrentBlock().timestamp
        let currentBlockHeight = getCurrentBlock().height
        
        // Calcular días transcurridos desde última evolución
        let diasTranscurridos = self.nftRef.calcularDiasTranscurridos(
            timestampActual: currentTimestamp,
            segundosPorDiaSimulado: segundosPorDiaSimulado
        )
        
        // Si ha pasado algún tiempo, procesar evolución
        if diasTranscurridos > 0.0 {
            // Calcular cuántos steps totales tenemos que procesar
            // Multiplicamos los días transcurridos por el número de steps por día
            let totalStepsToProcess = UInt64(diasTranscurridos * UFix64(stepsPerDay))
            
            // Si no hay steps que procesar, salir
            if totalStepsToProcess == 0 {
                log("No hay suficientes steps para procesar (< 1 step)")
                return
            }
            
            log("Procesando ".concat(totalStepsToProcess.toString()).concat(" steps (")
               .concat(diasTranscurridos.toString()).concat(" días) para la criatura ")
               .concat(self.nftRef.id.toString()))
            
            // Calcular día base para la generación de semillas
            // Es el último día procesado entero + 1
            let diaBaseSimulado = UInt64(self.nftRef.edadDiasCompletos) + 1
            
            // Variables para seguimiento de evolución
            var currentDayBeingProcessed = diaBaseSimulado
            var stepsTakenInCurrentDay: UInt64 = 0
            var diasCompletados: UFix64 = 0.0
            var currentDaySeeds: [UInt64] = self.nftRef.generateDailySeeds(diaSimulado: diaBaseSimulado)
            
            // Procesar cada step de evolución
            var stepNumber: UInt64 = 0
            while stepNumber < totalStepsToProcess {
                // Determinar si necesitamos generar nuevas semillas diarias
                if stepsTakenInCurrentDay >= stepsPerDay {
                    // Hemos completado un día, actualizar contadores y generar nuevas semillas
                    currentDayBeingProcessed = currentDayBeingProcessed + 1
                    stepsTakenInCurrentDay = 0
                    diasCompletados = diasCompletados + 1.0
                    
                    // Incrementar edad al completar un día
                    self.nftRef.updateEdad(newEdad: self.nftRef.edadDiasCompletos + 1.0)
                    
                    // Generar nuevas semillas para el siguiente día
                    currentDaySeeds = self.nftRef.generateDailySeeds(diaSimulado: currentDayBeingProcessed)
                    
                    // Verificar si la criatura debe morir por vejez
                    if self.nftRef.edadDiasCompletos >= self.nftRef.lifespanTotalSimulatedDays && self.nftRef.estaViva {
                        self.nftRef.updateVitalStatus(
                            newEstaViva: false,
                            newDeathBlock: currentBlockHeight,
                            newDeathTimestamp: currentTimestamp
                        )
                        
                        log("La criatura ".concat(self.nftRef.id.toString()).concat(" ha muerto de vejez después de ")
                           .concat(self.nftRef.edadDiasCompletos.toString()).concat(" días simulados."))
                        
                        break // Detener evolución si la criatura muere
                    }
                }
                
                // Calcular seeds de step específicos usando variación del PRNG
                // Adaptación del algoritmo en Python, pero simplificado para escalar dentro de un step
                let stepSalt = stepsTakenInCurrentDay * 31 // Usar un primo para mejor distribución 
                
                // Usar las semillas diarias R0 y R1 como base, y derivar semillas específicas para este step
                let r0Base = currentDaySeeds[0]
                let r1Base = currentDaySeeds[1]
                
                let stepR0 = (r0Base ^ stepSalt) % UInt64(4294967296)
                let stepR1 = (r1Base ^ (stepSalt * 11)) % UInt64(4294967296)
                
                // Aplicar evolución muy pequeña en cada step (dividida por el número de steps por día)
                // para que el efecto total sea equivalente a un día completo
                self.nftRef.updateGenesForStep(r0: stepR0, r1: stepR1, stepsPerDay: stepsPerDay)
                
                // Ganar puntos de evolución (también dividido por steps por día)
                self.nftRef.gainEvolutionPointsForStep(r0: stepR0, stepsPerDay: stepsPerDay)
                
                // Incrementar contador de steps para este día
                stepsTakenInCurrentDay = stepsTakenInCurrentDay + 1
                
                // Incrementar el contador del bucle
                stepNumber = stepNumber + 1
            }
            
            // Si procesamos steps pero no días completos, actualizar la edad proporcionalmente
            if diasCompletados < 1.0 && stepsTakenInCurrentDay > 0 {
                let fraccionDiaCompletado = UFix64(stepsTakenInCurrentDay) / UFix64(stepsPerDay)
                self.nftRef.updateEdad(newEdad: self.nftRef.edadDiasCompletos + fraccionDiaCompletado)
            }
            
            // Actualizar timestamp y bloque de última evolución
            self.nftRef.setLastEvolutionProcessed(
                blockHeight: currentBlockHeight,
                timestamp: currentTimestamp
            )
            
            // Emitir evento de evolución
            emit CreatureNFTV2.EvolutionProcessed(
                creatureID: self.nftRef.id,
                processedSteps: totalStepsToProcess,
                newAge: self.nftRef.edadDiasCompletos,
                evolutionPoints: self.nftRef.puntosEvolucion
            )
            
            log("Evolución completada. Nueva edad: ".concat(self.nftRef.edadDiasCompletos.toString())
               .concat(" días. EP actuales: ").concat(self.nftRef.puntosEvolucion.toString()))
        } else {
            log("No ha pasado suficiente tiempo para procesar evolución")
        }
    }
} 