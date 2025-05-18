import "dotenv/config";
import * as fcl from "@onflow/fcl";
import elliptic from "elliptic";
import { SHA3 } from "sha3";

const ec = new elliptic.ec("p256");

const PRIVATE_KEY = process.env.FLOW_PRIVATE_KEY;
const ACCOUNT_ADDRESS = "0xc2e7bab62102f4e1";
const KEY_ID = 0;

const sign = (message) => {
  const key = ec.keyFromPrivate(Buffer.from(PRIVATE_KEY, "hex"));
  const sig = key.sign(hashMsg(message));
  const n = 32;
  const r = sig.r.toArrayLike(Buffer, "be", n);
  const s = sig.s.toArrayLike(Buffer, "be", n);
  return Buffer.concat([r, s]).toString("hex");
};

const hashMsg = (msg) => {
  const sha = new SHA3(256);
  sha.update(Buffer.from(msg, "hex"));
  return sha.digest();
};

export const authorization = async (account = {}) => {
  return {
    ...account,
    tempId: `${ACCOUNT_ADDRESS}-${KEY_ID}`,
    addr: fcl.sansPrefix(ACCOUNT_ADDRESS),
    keyId: Number(KEY_ID),
    signingFunction: async (signable) => {
      return {
        addr: fcl.withPrefix(ACCOUNT_ADDRESS),
        keyId: Number(KEY_ID),
        signature: sign(signable.message),
      };
    },
  };
};
