// SCRIPT DE EJEMPLO PARA EJECUTAR LA EVOLUCIÓN DE CRIATURAS V2
//
// Este es un script de ejemplo que muestra cómo invocar la transacción de evolución
// con los parámetros correctos según la simulación Python original.
//
// PASO 1: Configurar estos valores según tu entorno
let TESTNET_DEPLOYER_ADDRESS = "0x2444e6b4d9327f09"; // Reemplazar con tu dirección
let CREATURE_ID = 1; // Reemplazar con el ID de tu criatura
let NETWORK = "testnet";

// PASO 2: Configuración de simulación (equivalente a la simulación Python)
let SECONDS_PER_SIMULATED_DAY = 86400.0; // 1 día real = 86400 segundos
let STEPS_PER_DAY = 300; // Según simulation.py, cada día tiene 300 steps

// PASO 3: Ejecutar la transacción
// Ejecuta este comando:
//
// flow transactions send week3/cadence/transactions/CreatureNFTV2/process_evolution.cdc \
//   $CREATURE_ID $SECONDS_PER_SIMULATED_DAY $STEPS_PER_DAY \
//   --network $NETWORK --signer testnet-deployer
//
// Para acelerar la simulación para pruebas (días más cortos), puedes usar:
// let SECONDS_PER_SIMULATED_DAY = 60.0; // 1 minuto = 1 día simulado

// EJEMPLO DE COMANDOS COMPLETOS:

// Para evolución normal (1 día real = 1 día simulado):
// flow transactions send week3/cadence/transactions/CreatureNFTV2/process_evolution.cdc 1 86400.0 300 --network testnet --signer testnet-deployer

// Para pruebas aceleradas (1 minuto = 1 día simulado):
// flow transactions send week3/cadence/transactions/CreatureNFTV2/process_evolution.cdc 1 60.0 300 --network testnet --signer testnet-deployer

// Para ver el estado de evolución actual:
// flow scripts execute week3/cadence/scripts/get_creature_evolution_status.cdc 0x2444e6b4d9327f09 1 --network testnet

// SECUENCIA COMPLETA DE COMANDOS PARA IMPLEMENTAR Y PROBAR:

// 1. Deployar el contrato CreatureNFTV2
// flow accounts add-contract CreatureNFTV2 week3/cadence/contracts/CreatureNFTV2.cdc --network testnet --signer testnet-deployer

// 2. Configurar cuenta para recibir criaturas
// flow transactions send week3/cadence/transactions/CreatureNFTV2/setup_account.cdc --network testnet --signer testnet-deployer

// 3. Mintear una criatura
// flow transactions send week3/cadence/transactions/CreatureNFTV2/mint_creature_game.cdc 0x2444e6b4d9327f09 "MyCoolCreature" "Mi primera criatura evolucionable" --network testnet --signer testnet-deployer

// 4. Establecer objetivos de homeostasis mediante LLM
// flow transactions send week3/cadence/transactions/CreatureNFTV2/set_homeostasis_from_llm.cdc 1 "formaPrincipal" 3.0 "El usuario desea que su criatura evolucione hacia una forma más redondeada" --network testnet --signer testnet-deployer

// 5. Procesar evolución
// flow transactions send week3/cadence/transactions/CreatureNFTV2/process_evolution.cdc 1 60.0 300 --network testnet --signer testnet-deployer

// 6. Verificar estado de evolución
// flow scripts execute week3/cadence/scripts/get_creature_evolution_status.cdc 0x2444e6b4d9327f09 1 --network testnet 