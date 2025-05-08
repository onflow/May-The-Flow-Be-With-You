import type { ArgsFn } from "@onflow/fcl-core/types/exec/args";
import type { Account } from "@onflow/typedefs";
import type { FlowConnector, FlowWallet } from "./flow";

export type Authz = (account: Account) => Promise<object> | object;

export interface IFlowScriptExecutor {
    /**
     * Execute a script
     * @param code Cadence code
     * @param args Cadence arguments
     */
    executeScript<T>(code: string, args: ArgsFn, defaultValue: T): Promise<T>;
}

/**
 * Signer interface
 */
export interface IFlowSigner {
    /**
     * Send a transaction
     */
    sendTransaction(code: string, args: ArgsFn, authz?: Authz): Promise<string>;

    /**
     * Build authorization
     */
    buildAuthorization(accountIndex?: number, privateKey?: string): Authz;
}

export interface Context extends Record<string, unknown> {}

export interface FlowBlockchainContext extends Context {
    connector: FlowConnector;
    wallet?: FlowWallet;
}
