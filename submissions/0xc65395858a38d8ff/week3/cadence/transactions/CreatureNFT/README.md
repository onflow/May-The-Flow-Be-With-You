# CreatureNFT Transactions

Este directorio contiene las transacciones y scripts para interactuar con el contrato CreatureNFT.

## Uso de las Transacciones

1. Primero, configura tu cuenta con:
   ```
   flow transactions send week3/cadence/transactions/CreatureNFT/setup_account.cdc --network testnet --signer testnet-account
   ```

2. Para acuñar (mint) una criatura para el juego con atributos generados aleatoriamente (RECOMENDADO):
   ```
   flow transactions send week3/cadence/transactions/CreatureNFT/mint_creature_game.cdc <recipient address> <name> <description> --network testnet --signer testnet-account
   ```
   Esta transacción utiliza datos de la blockchain (altura del bloque, timestamp, hash) para generar 
   atributos pseudo-aleatorios, fija la vida máxima en 7 días y usa un placeholder para la imagen
   ya que se generará con p5.js.

3. Para acuñar (mint) una criatura con atributos específicos (versión manual):
   ```
   flow transactions send week3/cadence/transactions/CreatureNFT/mint_nft.cdc <recipient address> <name> <description> <thumbnail> <initialGenesVisibles> <initialGenesOcultos> <initialPuntosEvolucion> <lifespanDays> <initialEdadDiasCompletos> <initialEstaViva> <initialHomeostasisTargets> --network testnet --signer testnet-account
   ```

4. Para transferir una criatura:
   ```
   flow transactions send week3/cadence/transactions/CreatureNFT/transfer_nft.cdc <recipient address> <nft_id> --network testnet --signer testnet-account
   ```

5. Para actualizar la descripción de una criatura:
   ```
   flow transactions send week3/cadence/transactions/CreatureNFT/update_nft_description.cdc <nft_id> <new_description> --network testnet --signer testnet-account
   ```

6. Para actualizar los puntos de evolución:
   ```
   flow transactions send week3/cadence/transactions/CreatureNFT/update_evolution_points.cdc <nft_id> <new_puntos_evolucion> --network testnet --signer testnet-account
   ```

7. Para actualizar la edad (simulando el paso del tiempo):
   ```
   flow transactions send week3/cadence/transactions/CreatureNFT/update_age.cdc <nft_id> <new_age_days> --network testnet --signer testnet-account
   ```

## Uso de los Scripts

1. Para obtener los IDs de las criaturas en una colección:
   ```
   flow scripts execute week3/cadence/transactions/CreatureNFT/get_collection_ids.cdc <account_address> --network testnet
   ```

2. Para obtener detalles completos de una criatura:
   ```
   flow scripts execute week3/cadence/transactions/CreatureNFT/get_nft_details.cdc <account_address> <nft_id> --network testnet
   ```

## Integración con LLM para Homeostasis

Las criaturas se crean inicialmente sin objetivos de homeostasis. El usuario interactuará con un LLM para:

1. Conversar sobre cómo quiere que evolucione su criatura
2. El LLM analizará la conversación y establecerá objetivos de homeostasis acordes
3. El juego usará estos objetivos para guiar la evolución de la criatura

Para establecer objetivos de homeostasis basados en la conversación con el LLM, usa:
```
flow transactions send week3/cadence/transactions/CreatureNFT/set_homeostasis_from_llm.cdc <nft_id> <gen_name> <target_value> <conversation_summary> --network testnet --signer testnet-account
```

Ejemplo:
```
flow transactions send week3/cadence/transactions/CreatureNFT/set_homeostasis_from_llm.cdc 1 "formaPrincipal" 3.0 "El usuario quiere que su criatura evolucione hacia una forma piramidal para maximizar su capacidad ofensiva" --network testnet --signer testnet-account
```

Los genes visibles disponibles para homeostasis son:
- "colorR": Componente rojo del color (0.0-1.0)
- "colorG": Componente verde del color (0.0-1.0)
- "colorB": Componente azul del color (0.0-1.0)
- "tamañoBase": Tamaño físico (0.5-3.0)
- "formaPrincipal": Forma física (1: esfera, 2: cubo, 3: pirámide)
- "numApendices": Número de apéndices (0-8)
- "patronMovimiento": Tipo de movimiento (1: Estático, 2: Circular, 3: Patrulla, 4: Errático)

## Ejemplo de Uso Recomendado

Para tu juego ElementalStrikers, recomendamos usar la transacción `mint_creature_game.cdc` que genera los atributos usando aleatoriedad de la blockchain:

```
flow transactions send week3/cadence/transactions/CreatureNFT/mint_creature_game.cdc 0x2444e6b4d9327f09 "Sparkle" "Una criatura elemental de energía pura que cambia de forma" --network testnet --signer testnet-account
```

Esta transacción genera automáticamente:
- Genes visibles (colores, forma, tamaño, apéndices, patrón)
- Genes ocultos (metabolismo, vida máxima de 7 días, stats de combate)
- La homeostasis comienza vacía para ser definida por interacción con LLM
- Usa una imagen placeholder que será reemplazada por visualización generada en p5.js