import { useFlowQuery } from "@onflow/kit";
import { testScript } from "../scripts/test";

export const useTestQuery = () => {
  return useFlowQuery({
    cadence: testScript,
    args: (arg, t) => [arg(1, t.Int), arg(2, t.Int)],
    query: { staleTime: 10000 },
  });
}; 