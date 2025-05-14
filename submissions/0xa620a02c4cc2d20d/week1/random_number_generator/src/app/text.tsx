// src/app/page.js

"use client";

import { useState, useEffect } from "react";
import {
    useFlowQuery,
    useFlowMutate,
    useFlowTransaction,
    useCurrentFlowUser,
} from "@onflow/kit";

export default function Home() {
    const { user, authenticate, unauthenticate } = useCurrentFlowUser();
    const [lastTxId, setLastTxId] = useState<string>();

    const { data, isLoading, error, refetch } = useFlowQuery({
        cadence: `
      import "Counter"
      import "NumberFormatter"

      access(all)
      fun main(): String {
          let count: Int = Counter.getCount()
          let formattedCount = NumberFormatter.formatWithCommas(number: count)
          return formattedCount
      }
    `,
        query: { enabled: true },
    });

    const {
        mutate: increment,
        isPending: txPending,
        data: txId,
        error: txError,
    } = useFlowMutate();

    const { transactionStatus, error: txStatusError } = useFlowTransaction({
        id: txId || ""
    });

    useEffect(() => {
        if (txId && transactionStatus?.status === 4) {
            refetch();
        }
    }, [transactionStatus?.status, txId, refetch]);

    const handleIncrement = () => {
        increment({
            cadence: `
        import "Counter"

        transaction {
          prepare(acct: &Account) {
            // Authorization handled via wallet
          }
          execute {
            Counter.increment()
            let newCount = Counter.getCount()
            log("New count after incrementing: ".concat(newCount.toString()))
          }
        }
      `,
        });
    };

    return (
        <div>
            <h1>@onflow/kit App Quickstart</h1>

            {isLoading ? (
                <p>Loading count...</p>
            ) : error ? (
                <p>Error fetching count: {error.message}</p>
            ) : (
                <div>
                    <h2>Count: {data as string}</h2>
                </div>
            )}

            {user.loggedIn ? (
                <div>
                    <p>Address: {user.addr}</p>
                    <button onClick={unauthenticate}>Log Out</button>
                    <button onClick={handleIncrement} disabled={txPending}>
                        {txPending ? "Processing..." : "Increment Count"}
                    </button>

                    <div>
                        Latest Transaction Status:{" "}
                        {transactionStatus?.statusString || "No transaction yet"}
                    </div>

                    {txError && <p>Error sending transaction: {txError.message}</p>}

                    {lastTxId && (
                        <div>
                            <h3>Transaction Status</h3>
                            {transactionStatus ? (
                                <p>Status: {transactionStatus.statusString}</p>
                            ) : (
                                <p>Waiting for status update...</p>
                            )}
                            {txStatusError && <p>Error: {txStatusError.message}</p>}
                        </div>
                    )}
                </div>
            ) : (
                <button onClick={authenticate}>Log In</button>
            )}
        </div>
    );
}
