// src/app/page.js

"use client";

import { useState, useEffect } from "react";
import * as fcl from "@onflow/fcl";
import {
  useFlowMutate,
  useFlowTransaction,
  useCurrentFlowUser,
} from "@onflow/kit";

export default function Home() {
  const { user, authenticate, unauthenticate } = useCurrentFlowUser();
  const [randomNumber, setRandomNumber] = useState<string>("");
  const [pendingRequestId, setPendingRequestId] = useState<string>("");

  const {
    mutate: requestRandom,
    isPending: requestPending,
    data: requestTxId,
    error: requestError,
  } = useFlowMutate();

  const {
    mutate: revealRandom,
    isPending: revealPending,
    data: revealTxId,
    error: revealError,
  } = useFlowMutate();

  const { transactionStatus: requestTxStatus } = useFlowTransaction({
    id: requestTxId || ""
  });

  const { transactionStatus: revealTxStatus } = useFlowTransaction({
    id: revealTxId || ""
  });

  useEffect(() => {
    if (requestTxId && requestTxStatus?.status === 4) {
      // Get the request ID from the transaction events
      const getRequestId = async () => {
        try {
          const tx = await fcl.tx(requestTxId).onceSealed();
          const requestEvent = tx.events.find(event =>
            event.type.includes("RandomNumberGenerator.RandomNumberRequested")
          );
          if (requestEvent) {
            const requestId = requestEvent.data.requestId;
            setPendingRequestId(requestId.toString());
          }
        } catch (error) {
          console.error("Error getting request ID:", error);
        }
      };
      getRequestId();
    }
  }, [requestTxStatus?.status, requestTxId]);

  useEffect(() => {
    if (pendingRequestId && requestTxStatus?.status === 4) {
      // After request is sealed and we have the request ID, trigger reveal
      revealRandom({
        cadence: `
          import RandomNumberGenerator from 0xf8d6e0586b0a20c7

          transaction(requestId: UInt64) {
            prepare(acct: &Account) {
              // Authorization handled via wallet
            }
            execute {
              let randomNum = RandomNumberGenerator.revealRandomNumber(requestId: requestId)
              log("Revealed random number: ".concat(randomNum.toString()))
            }
          }
        `,
        args: (arg, t) => [arg(pendingRequestId, t.UInt64)],
      });
    }
  }, [pendingRequestId, requestTxStatus?.status]);

  useEffect(() => {
    if (revealTxId && revealTxStatus?.status === 4) {
      // Query the latest random number after reveal is sealed
      const queryRandom = async () => {
        try {
          const result = await fcl.query({
            cadence: `
              import RandomNumberGenerator from 0xf8d6e0586b0a20c7
              
              access(all)
              fun main(): UInt64 {
                let requestId = RandomNumberGenerator.requestRandomNumber(min: 1, max: 1000)
                return RandomNumberGenerator.revealRandomNumber(requestId: requestId)
              }
            `,
          });
          setRandomNumber(result.toString());
        } catch (error) {
          console.error("Error querying random number:", error);
        }
      };
      queryRandom();
    }
  }, [revealTxStatus?.status, revealTxId]);

  const handleGenerateRandom = () => {
    requestRandom({
      cadence: `
        import RandomNumberGenerator from 0xf8d6e0586b0a20c7

        transaction {
          prepare(acct: &Account) {
            // Authorization handled via wallet
          }
          execute {
            let requestId = RandomNumberGenerator.requestRandomNumber(min: 1, max: 1000)
            log("Requested random number with ID: ".concat(requestId.toString()))
          }
        }
      `,
    });
  };

  return (
    <div>
      <h1>Random Number Generator</h1>

      {user.loggedIn ? (
        <div>
          <p>Address: {user.addr}</p>
          <button onClick={unauthenticate}>Log Out</button>

          {/* Random Number Section */}
          <div style={{ marginTop: "20px" }}>
            <h2>Random Number Generator</h2>
            {randomNumber && <p>Latest Random Number: {randomNumber}</p>}
            <button
              onClick={handleGenerateRandom}
              disabled={requestPending || revealPending}
            >
              {requestPending ? "Requesting..." : revealPending ? "Revealing..." : "Generate Random Number"}
            </button>
          </div>

          <div style={{ marginTop: "20px" }}>
            <h3>Transaction Status</h3>
            {requestTxStatus && (
              <p>Random Request Status: {requestTxStatus.statusString}</p>
            )}
            {revealTxStatus && (
              <p>Random Reveal Status: {revealTxStatus.statusString}</p>
            )}
          </div>

          {requestError && <p>Error requesting random number: {requestError.message}</p>}
          {revealError && <p>Error revealing random number: {revealError.message}</p>}
        </div>
      ) : (
        <button onClick={authenticate}>Log In</button>
      )}
    </div>
  );
}
