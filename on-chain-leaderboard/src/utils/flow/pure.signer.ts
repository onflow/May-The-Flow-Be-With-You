import elliptic from "elliptic";
import { SHA3 } from "sha3";

/**
 * Sign a message with a private key
 */
export function signWithKey(privateKeyHex: string, msg: string) {
    const ec = new elliptic.ec("p256");
    const key = ec.keyFromPrivate(Buffer.from(privateKeyHex, "hex"));
    const sig = key.sign(_hashMsg(msg));
    const n = 32;
    const r = sig.r.toArrayLike(Buffer, "be", n);
    const s = sig.s.toArrayLike(Buffer, "be", n);
    return Buffer.concat([r.valueOf(), s.valueOf()]).toString("hex");
}

/**
 * Hash a message
 */
function _hashMsg(msg: string) {
    const sha = new SHA3(256);
    sha.update(Buffer.from(msg, "hex"));
    return sha.digest();
}
