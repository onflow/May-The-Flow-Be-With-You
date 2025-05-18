import { Base64 } from "js-base64";

const endpoint = () => {
    return import.meta.env.VITE_NETWORK === "mainnet"
        ? "https://rest-mainnet.onflow.org"
        : "https://rest-testnet.onflow.org";
};

type CadenceJSONValue = {
    type: string;
    value: unknown;
};

export async function callCadenceScript(script: string, args: CadenceJSONValue[]) {
    const queryCodeBase64 = Base64.encode(script);
    const argsBase64 = args.map((a) => Base64.encode(JSON.stringify(a)));
    const response = await fetch(`${endpoint()}/v1/scripts?block_height=final`, {
        method: "POST",
        body: JSON.stringify({ script: queryCodeBase64, arguments: argsBase64 }),
        headers: { "content-type": "application/json" },
    });
    const resEncoded = await response.text();
    const resString = Base64.decode(resEncoded);
    return JSON.parse(resString);
}
