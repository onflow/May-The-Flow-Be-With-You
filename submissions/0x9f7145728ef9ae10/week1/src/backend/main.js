import * as fcl from "@onflow/fcl";
import "./fcl-config.js";
import { authorization } from "./signer.js";

async function callGenerate() {
  const txId = await fcl.mutate({
    cadence: `
      import Random from 0xc2e7bab62102f4e1

      transaction {
        prepare(signer: &Account) {
          Random.generate()
        }
      }
    `,
    args: [],
    proposer: authorization,
    payer: authorization,
    authorizations: [authorization],
    limit: 100,
  });

  console.log("Transaction ID:", txId);
  const tx = await fcl.tx(txId).onceSealed();
  console.log("Transaction sealed:", tx.events[0].data);
}

callGenerate();
