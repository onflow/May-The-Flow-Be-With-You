// import { useAppSelector } from "@/redux/hooks";
import { Level } from "@/types";
import { useEffect, useState, useCallback } from "react";
import { useGetRecords } from "./useContract";

type Filter = {
  level: Level | "all";
  result: "win" | "lose" | "all";
  //   time: number | "";
};

export const defaultFilter: Filter = {
  level: "all",
  result: "all"
  // time: ""
};

interface OnChainRecord {
  player: string;
  timestamp: bigint;
  timeTaken: bigint;
  level: number;
}

interface LeaderboardRecord {
  timestamp: number;
  duration: number;
  level: Level;
  status: "win" | "lose";
  player: string;
}

const useRecords = () => {
  const { records: onChainRecords, isPending, error } = useGetRecords();
  const [filteredRecords, setFilteredRecords] = useState<LeaderboardRecord[]>([]);
  const [filter, setFilter] = useState<Filter>(defaultFilter);
  const [best, setBest] = useState<Record<Exclude<Level, "custom">, LeaderboardRecord | null>>({
    beginner: null,
    intermediate: null,
    expert: null
  });

  // Convert on-chain records to LeaderboardRecord format
  const convertToLeaderboardRecord = useCallback((record: OnChainRecord): LeaderboardRecord => {
    const levelMap = {
      0: 'beginner',
      1: 'intermediate',
      2: 'expert'
    } as const;

    return {
      timestamp: Number(record.timestamp),
      duration: Number(record.timeTaken),
      level: levelMap[record.level as keyof typeof levelMap] || 'beginner',
      status: "win", // All on-chain records are wins
      player: record.player
    };
  }, []);

  useEffect(() => {
    if (onChainRecords && onChainRecords.length > 0) {
      const convertedRecords = onChainRecords.map(convertToLeaderboardRecord);

      const beginners = convertedRecords
        .filter((r) => r.level === "beginner" && r.status === "win")
        .sort((a, b) => a.duration - b.duration);
      const intermediates = convertedRecords
        .filter((r) => r.level === "intermediate" && r.status === "win")
        .sort((a, b) => a.duration - b.duration);
      const experts = convertedRecords
        .filter((r) => r.level === "expert" && r.status === "win")
        .sort((a, b) => a.duration - b.duration);

      setBest((prev) => ({
        ...prev,
        beginner: beginners[0] ?? null,
        intermediate: intermediates[0] ?? null,
        expert: experts[0] ?? null
      }));
    }
  }, [onChainRecords, convertToLeaderboardRecord]);

  useEffect(() => {
    if (onChainRecords && onChainRecords.length > 0) {
      const convertedRecords = onChainRecords.map(convertToLeaderboardRecord);

      const filtered = convertedRecords.filter((r) => {
        if (filter.level !== "all" && r.level !== filter.level) {
          return false;
        }
        if (filter.result !== "all" && r.status !== filter.result) {
          return false;
        }
        return true;
      }).sort((a, b) => a.duration - b.duration);

      setFilteredRecords(filtered);
    } else {
      setFilteredRecords([]);
    }
  }, [onChainRecords, filter, convertToLeaderboardRecord]);

  const updateFilter = (filter: Partial<Filter>) => {
    setFilter((prev) => {
      return { ...prev, ...filter };
    });
  };

  return {
    records: filteredRecords,
    best,
    filter,
    updateFilter,
    isPending,
    error
  };
};

export default useRecords;
