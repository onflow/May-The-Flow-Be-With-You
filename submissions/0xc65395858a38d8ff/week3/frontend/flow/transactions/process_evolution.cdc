import "NonFungibleToken"
import "CreatureNFTV6"
import "ViewResolver" // Asegurarse que está importado si se usa directamente

// Esta transacción procesa la evolución de una criatura NFT V3 basada en
// el tiempo transcurrido desde la última actualización. Utiliza la semilla inicial
// de la criatura para generar semillas diarias deterministas, permitiendo
// una evolución consistente y predecible sin necesidad de almacenar estados adicionales.
// Simula 300 steps de evolución por día, siguiendo el modelo de la simulación en Python.
// Además, ahora incluye eventos de fin de día y posibilidad de reproducción sexual automática.

transaction(creatureID: UInt64, stepsToProcess: UInt64, secondsPerDay: UFix64) {

    // Referencia a la colección de NFTs del usuario
    let nftRef: &CreatureNFTV6.NFT
    // Referencia para acceder a la colección (para reproducción sexual)
    let collectionRef: &CreatureNFTV6.Collection

    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Obtener referencia a la colección
        self.collectionRef = signer.storage.borrow<auth(Storage) &CreatureNFTV6.Collection>(from: CreatureNFTV6.CollectionStoragePath)
            ?? panic("No se pudo obtener referencia a la colección de criaturas")

        // Obtener referencia a la criatura específica
        self.nftRef = self.collectionRef.borrowCreatureNFTForUpdate(id: creatureID)
            ?? panic("No se encontró la criatura con ID ".concat(creatureID.toString()))

        // Asegurarse de que la criatura está viva antes de procesar
        if !self.nftRef.estaViva {
            panic("La criatura está muerta, no se puede procesar la evolución.")
        }
    }

    execute {
        log("Procesando evolución para la criatura: ".concat(self.nftRef.id.toString()))
        log("Pasos a procesar: ".concat(stepsToProcess.toString()))
        log("Segundos por día simulado: ".concat(secondsPerDay.toString()))

        let currentBlock = getCurrentBlock()
        var processedSteps: UInt64 = 0
        var totalEPGainedThisTx: UFix64 = 0.0
        let initialAge = self.nftRef.edadDiasCompletos

        // Calcular cuántos días simulados completos han pasado desde la última evolución
        let diasTranscurridosDesdeUltimaEvol = self.nftRef.calcularDiasTranscurridos(
            timestampActual: currentBlock.timestamp,
            segundosPorDiaSimulado: secondsPerDay
        )
        log("Días transcurridos desde la última evolución (timestamp): ".concat(diasTranscurridosDesdeUltimaEvol.toString()))

        // Convertir a número entero de días y luego a UFix64 para la edad
        let diasCompletosPasados = UInt64(diasTranscurridosDesdeUltimaEvol)
        self.nftRef.updateEdad(newEdad: initialAge + UFix64(diasCompletosPasados))
        log("Nueva edad (días completos): ".concat(self.nftRef.edadDiasCompletos.toString()))

        // Verificar si la criatura muere de vejez
        if self.nftRef.edadDiasCompletos >= self.nftRef.lifespanTotalSimulatedDays {
            self.nftRef.updateVitalStatus(newEstaViva: false, newDeathBlock: currentBlock.height, newDeathTimestamp: currentBlock.timestamp)
            self.collectionRef.markCreatureAsDead(creatureID: self.nftRef.id)
            log("La criatura murió de vejez.")
            // No procesar más steps si murió
            self.nftRef.setLastEvolutionProcessed(blockHeight: currentBlock.height, timestamp: currentBlock.timestamp)
            self.nftRef.emitEvolutionProcessedEvent(processedSteps: 0, newAge: self.nftRef.edadDiasCompletos, evolutionPoints: self.nftRef.puntosEvolucion)
            return
        }

        // Procesar los steps de evolución
        var i: UInt64 = 0
        while i < stepsToProcess {
            if !self.nftRef.estaViva { break } // Salir si muere durante el proceso

            // Generar semillas diarias basadas en la semilla inicial y el día simulado actual
            // El día simulado para la semilla debe ser consistente, se usa edadDiasCompletos
            let dailySeeds = self.nftRef.generateDailySeeds(diaSimulado: UInt64(self.nftRef.edadDiasCompletos))
            
            // Asumimos que stepsPerDay es 1440 para obtener semillas por step
            // Esto es una simplificación, idealmente stepsPerDay sería un parámetro o constante del contrato
            let stepsPerDayForSeedGeneration: UInt64 = 1440 
            let stepSeedIndex = processedSteps % stepsPerDayForSeedGeneration // Índice de semilla para el step actual dentro del día

            // Usar semillas diarias para diferentes aspectos de la evolución del step
            // Ejemplo: semilla 0 para volatilidad, semilla 1 para pasiva, semilla 2 para homeo boost, semilla 3 para homeo efecto
            // Es importante que estas semillas cambien para cada step, o se usen de forma que simulen variación por step.
            // Aquí usamos `stepSeedIndex` para intentar derivar semillas únicas por step a partir de las diarias.
            // Esto es una simplificación. Un PRNG más robusto por step sería ideal.
            let r0_volSeed = dailySeeds[0] ^ stepSeedIndex 
            let r1_pasSeed = dailySeeds[1] ^ stepSeedIndex
            let r2_boostHomeoSeed = dailySeeds[2] ^ stepSeedIndex
            let r3_homeoEfecSeed = dailySeeds[3] ^ stepSeedIndex
            let r4_epGainSeed = dailySeeds[4] ^ stepSeedIndex

            self.nftRef.updateGenesForStep(r0VolSeed: r0_volSeed, r1PasSeed: r1_pasSeed, r2BoostHomeoSeed: r2_boostHomeoSeed, r3HomeoEfecSeed: r3_homeoEfecSeed, stepsPerDay: stepsPerDayForSeedGeneration)
            self.nftRef._updateCombatGenesForStep(r0VolSeed: r0_volSeed, r1PasSeedStep: r1_pasSeed, stepsPerDay: stepsPerDayForSeedGeneration)
            
            let epGainedThisStep = self.nftRef.gainEvolutionPointsForStep(r0: r4_epGainSeed, stepsPerDay: stepsPerDayForSeedGeneration)
            // La función gainEvolutionPointsForStep ya actualiza self.nftRef.puntosEvolucion
            // totalEPGainedThisTx = totalEPGainedThisTx + epGainedThisStep // No es necesario si la función actualiza directamente

            processedSteps = processedSteps + 1
            i = i + 1
        }

        // Actualizar el timestamp y blockHeight de la última evolución procesada
        self.nftRef.setLastEvolutionProcessed(blockHeight: currentBlock.height, timestamp: currentBlock.timestamp)
        log("Evolución procesada. Pasos ejecutados: ".concat(processedSteps.toString()))
        log("Puntos de evolución actuales: ".concat(self.nftRef.puntosEvolucion.toString()))

        // Intentar reproducción sexual después de la evolución si la criatura sigue viva
        if self.nftRef.estaViva {
            log("Intentando reproducción sexual para la colección...")
            // Asegurarse de que no se exceda el límite de criaturas activas
            if self.collectionRef.getActiveCreatureCount() < CreatureNFTV6.MAX_ACTIVE_CREATURES {
                let newOffspring <- self.collectionRef.attemptSexualReproduction()
                if newOffspring != nil {
                    log("¡Reproducción sexual exitosa! Nueva criatura creada.")
                    // Verificar si se puede depositar (doble chequeo, el attempt ya debería considerarlo)
                    if self.collectionRef.getActiveCreatureCount() < CreatureNFTV6.MAX_ACTIVE_CREATURES {
                         self.collectionRef.deposit(token: <-newOffspring!)
                         log("Descendiente depositado en la colección.")
                    } else {
                        log("No se pudo depositar el descendiente, límite de colección alcanzado.")
                        destroy newOffspring // Importante destruir si no se puede depositar
                    }
                } else {
                    log("No ocurrió reproducción sexual esta vez.")
                }
            } else {
                log("No se intentó reproducción sexual, límite de criaturas activas ya alcanzado.")
            }
        }
        // Emitir evento de evolución procesada (incluso si murió)
        self.nftRef.emitEvolutionProcessedEvent(processedSteps: processedSteps, newAge: self.nftRef.edadDiasCompletos, evolutionPoints: self.nftRef.puntosEvolucion)
    }
} 