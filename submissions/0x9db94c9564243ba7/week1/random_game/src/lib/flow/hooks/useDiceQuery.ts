import { useFlowQuery } from "@onflow/kit";
import { diceRollScript } from "../scripts/diceRoll";

export const useDiceQuery = () => {
  const { data, isLoading, error, refetch } = useFlowQuery({
    cadence: diceRollScript,
    args: (arg, t) => [], // No arguments needed for this script
    query: { staleTime: 10000 },
  });

  // Calculate total and get individual dice values
  const processRolls = (rolls: any[] | undefined) => {
    if (!rolls || !Array.isArray(rolls)) return { total: 0, dice1: 0, dice2: 0 };
    const dice1 = Number(rolls[0]);
    const dice2 = Number(rolls[1]);
    return {
      total: dice1 + dice2,
      dice1,
      dice2
    };
  };

  const processedData = data ? processRolls(data as any[]) : { total: 0, dice1: 0, dice2: 0 };

  return {
    result: processedData.total,
    dice1: processedData.dice1,
    dice2: processedData.dice2,
    isLoading,
    error,
    refetch
  };
}; 