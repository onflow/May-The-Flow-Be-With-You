import "NonFungibleToken"
import "CreatureNFTV3"

// Esta transacción procesa la evolución de una criatura NFT V3 basada en
// el tiempo transcurrido desde la última actualización. Utiliza la semilla inicial
// de la criatura para generar semillas diarias deterministas, permitiendo
// una evolución consistente y predecible sin necesidad de almacenar estados adicionales.
// Simula 300 steps de evolución por día, siguiendo el modelo de la simulación en Python.
// Además, ahora incluye eventos de fin de día y posibilidad de reproducción sexual automática.

transaction(nftID: UInt64, segundosPorDiaSimulado: UFix64, stepsPerDay: UInt64) {
    // Referencia al NFT que se va a actualizar
    let nftRef: &CreatureNFTV3.NFT
    // Referencia a la colección para manejo de reproducción
    let collectionRef: &CreatureNFTV3.Collection
    
    prepare(signer: auth(Storage) &Account) {
        // Obtener referencia a la colección del firmante
        self.collectionRef = signer.storage.borrow<auth(Storage) &CreatureNFTV3.Collection>(from: CreatureNFTV3.CollectionStoragePath)
            ?? panic("No se pudo obtener referencia a la colección. Asegúrate de que la cuenta esté configurada correctamente.")
            
        // Obtener referencia a la criatura específica
        self.nftRef = self.collectionRef.borrowCreatureNFTForUpdate(id: nftID)
            ?? panic("No se pudo obtener referencia a la criatura con ID ".concat(nftID.toString()))
    }
    
    execute {
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
                    
                    // --- EVENTOS DE FIN DE DÍA ---
                    // Aplicar efectos aleatorios basados en R4 (semilla de eventos)
                    let R4_semilla_evento = currentDaySeeds[4] // currentDaySeeds tiene 5 elementos (índices 0-4)
                    
                    // Modificador de EP basado en R4 (como en simulation.py)
                    let random_normalized_ep_event = UFix64(R4_semilla_evento % 1000) / 999.0 
                    var positive_change_ep_event = true
                    var final_ep_change_event: UFix64 = 0.0
                    let ep_change_ratio_event: UFix64 = 0.01 
                    let base_ep_change_event = self.nftRef.puntosEvolucion * ep_change_ratio_event

                    if random_normalized_ep_event < 0.5 {
                        positive_change_ep_event = false
                        let magnitude_factor_event = (0.5 - random_normalized_ep_event) * 2.0
                        final_ep_change_event = base_ep_change_event * magnitude_factor_event
                    } else {
                        positive_change_ep_event = true
                        let magnitude_factor_event = (random_normalized_ep_event - 0.5) * 2.0
                        final_ep_change_event = base_ep_change_event * magnitude_factor_event
                    }
                    
                    var newEP_event = self.nftRef.puntosEvolucion
                    if positive_change_ep_event {
                        newEP_event = self.nftRef.puntosEvolucion + final_ep_change_event
                    } else {
                        if self.nftRef.puntosEvolucion > final_ep_change_event + 0.1 {
                            newEP_event = self.nftRef.puntosEvolucion - final_ep_change_event
                        } else {
                            newEP_event = 0.1 
                        }
                    }
                    self.nftRef.updatePuntosEvolucion(newEP: newEP_event)
                    log("Evento fin de día: Modificación EP ".concat(positive_change_ep_event ? "+" : "-").concat(final_ep_change_event.toString()))
                    
                    // --- INTENTAR REPRODUCCIÓN SEXUAL AUTOMÁTICA ---
                    if self.collectionRef.getActiveCreatureCount() < CreatureNFTV3.MAX_ACTIVE_CREATURES && 
                       self.collectionRef.getActiveCreatureCount() >= 2 {
                        let reproProb = UFix64((R4_semilla_evento >> 10) % 100) / 100.0
                        if reproProb < 0.25 { 
                            let potentialChildNFT <- self.collectionRef.attemptSexualReproduction()
                            if potentialChildNFT != nil {
                                let actualChildNFT <- potentialChildNFT!
                                self.collectionRef.deposit(token: <-actualChildNFT)
                                log("¡Reproducción sexual automática exitosa! Se ha creado una nueva criatura.")
                            } else {
                                destroy potentialChildNFT
                            }
                        }
                    }
                    
                    // Verificar si la criatura debe morir por vejez
                    if self.nftRef.edadDiasCompletos >= self.nftRef.lifespanTotalSimulatedDays && self.nftRef.estaViva {
                        self.nftRef.updateVitalStatus(
                            newEstaViva: false,
                            newDeathBlock: currentBlockHeight,
                            newDeathTimestamp: currentTimestamp
                        )
                        log("La criatura ".concat(self.nftRef.id.toString()).concat(" ha muerto de vejez después de ")
                           .concat(self.nftRef.edadDiasCompletos.toString()).concat(" días simulados."))
                        self.collectionRef.markCreatureAsDead(creatureID: nftID)
                        break 
                    }
                }
                
                // Calcular seeds de step específicos
                let stepSaltBase = stepsTakenInCurrentDay * 31 
                
                // Semillas diarias (asumiendo que currentDaySeeds tiene al menos 4 elementos para R0, R1, R2, R3)
                let r0BaseVolatilidad = currentDaySeeds[0]
                let r1BasePasiva = currentDaySeeds[1]      // Base para semilla pasiva de step
                let r2BaseBoostHomeo = currentDaySeeds[2]
                let r3BaseHomeoEfec = currentDaySeeds[3]
                // R4 (currentDaySeeds[4]) se usa para eventos de fin de día.

                // Semilla para evolución pasiva de genes visibles Y ocultos (varía por step)
                let stepR1Pasiva = (r1BasePasiva ^ (stepSaltBase * 11)) % UInt64(4294967296)

                // Semilla para EP gain (varía por step)
                let stepR0EPGain = (r0BaseVolatilidad ^ stepSaltBase) % UInt64(4294967296)

                // Aplicar evolución de genes visibles
                self.nftRef.updateGenesForStep(
                    r0VolSeed: r0BaseVolatilidad,      // Semilla diaria para volatilidad general
                    r1PasSeed: stepR1Pasiva,           // Semilla de step para evolución pasiva de visibles
                    r2BoostHomeoSeed: r2BaseBoostHomeo,  // Semilla diaria para boost homeostasis
                    r3HomeoEfecSeed: r3BaseHomeoEfec,   // Semilla diaria para efectividad homeostasis
                    stepsPerDay: stepsPerDay
                )
                
                // Aplicar evolución de genes ocultos de combate
                self.nftRef._updateCombatGenesForStep(
                    r0VolSeed: r0BaseVolatilidad,      // Semilla diaria para volatilidad general
                    r1PasSeedStep: stepR1Pasiva,       // Semilla de step para evolución pasiva de ocultos
                    stepsPerDay: stepsPerDay
                )
                
                // Ganar puntos de evolución
                self.nftRef.gainEvolutionPointsForStep(r0: stepR0EPGain, stepsPerDay: stepsPerDay)
                
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
            
            // Emitir evento de evolución llamando a la función en el NFT
            self.nftRef.emitEvolutionProcessedEvent(
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