// import { useAppSelector } from "@/redux/hooks";
import { Level, PlayRecord } from "@/types";
import { useEffect, useState } from "react";
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
}

const useRecords = () => {
  const { records: onChainRecords, isPending, error } = useGetRecords();
  const [filteredRecords, setFilteredRecords] = useState<PlayRecord[]>([]);
  const [filter, setFilter] = useState<Filter>(defaultFilter);
  const [best, setBest] = useState<Record<Exclude<Level, "custom">, PlayRecord | null>>({
    beginner: null,
    intermediate: null,
    expert: null
  });

  useEffect(() => {
    if (onChainRecords && onChainRecords.length > 0) {
      // Convert on-chain records to PlayRecord format
      const convertedRecords: PlayRecord[] = onChainRecords.map((record: OnChainRecord) => ({
        timestamp: Number(record.timestamp),
        duration: Number(record.timeTaken),
        level: "beginner", // Default to beginner since on-chain records don't store level
        status: "win", // All on-chain records are wins
        player: record.player
      }));

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
  }, [onChainRecords]);

  useEffect(() => {
    if (onChainRecords && onChainRecords.length > 0) {
      const convertedRecords: PlayRecord[] = onChainRecords.map((record: OnChainRecord) => ({
        timestamp: Number(record.timestamp),
        duration: Number(record.timeTaken),
        level: "beginner", // Default to beginner since on-chain records don't store level
        status: "win", // All on-chain records are wins
        player: record.player
      }));

      const filtered = convertedRecords.filter((r) => {
        if (filter.level !== "all" && r.level !== filter.level) {
          return false;
        }
        if (filter.result !== "all" && r.status !== filter.result) {
          return false;
        }
        // if (filter.time && r.duration != filter.time) {
        //   return false;
        // }
        return true;
      });
      setFilteredRecords(filtered);
    } else {
      setFilteredRecords([]);
    }
  }, [onChainRecords, filter]);

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
