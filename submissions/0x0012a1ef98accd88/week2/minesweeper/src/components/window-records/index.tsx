// import React, { useState, useEffect } from "react";
import WindowTitleBar from "../window-title-bar";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import clsx from "clsx";
import { toggleMiniRecords } from "@/redux/slice/user.data";
import dayjs from "dayjs";
import PersonalBest from "./personal-best";
// import relativeTime from "dayjs/plugin/relativeTime";

import useRecords from "../../hooks/useRecords";
import RadioFilter from "./radio-filter";
import { Level } from "@/types";
import { useState } from "react";

// type Props = {}
// dayjs.extend(relativeTime);

export const RecordWindowTitle = "Leadership Board";

const RecordsWindow = () => {
  const dispatch = useAppDispatch();
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);
  const recordWindowMinimized = useAppSelector((store) => store.userData.recordWindowMinimized);
  const ui = useAppSelector((store) => store.userData.ui);
  const { best, records, updateFilter, filter, isPending, error } = useRecords();

  const handleLevelChange = (level: Level | "all") => {
    updateFilter({ ...filter, level });
  };

  const handleResultChange = (result: "win" | "lose" | "all") => {
    updateFilter({ ...filter, result });
  };

  const handleCopyAddress = async (address: string, rowId: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedRowId(rowId);
      setTimeout(() => setCopiedRowId(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  if (recordWindowMinimized) return null;
  const isXP = ui === "xp";

  return (
    <div
      className={clsx(
        "window fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 dark:brightness-90",
        "min-w-[600px] w-[80vw] max-w-[800px]"
      )}
    >
      <WindowTitleBar allowDrag title={RecordWindowTitle} icon="/win/table.png">
        <button
          type="button"
          aria-label="Minimize"
          onClick={() => dispatch(toggleMiniRecords())}
          title="Hide the window"
        />
      </WindowTitleBar>
      <div className="window-body max-dvh-screen overflow-y-auto overflow-x-hidden">
        <div className="my-2 pl-0.5">
          <div className="flex items-center gap-2 text-sm capitalize">
            <span className="text-right w-8 text-xs">Level:</span>
            <ul className="flex gap-1 items-center py-1 font-semibold">
              {["all", "beginner", "intermediate", "expert"].map((_key) => {
                const id_key = `level_${_key}`;
                return (
                  <li key={_key} className="flex cursor-pointer">
                    <input
                      className="cursor-pointer"
                      id={id_key}
                      name={id_key}
                      type="radio"
                      onChange={() => handleLevelChange(_key as Level | "all")}
                      checked={filter.level === _key}
                    />
                    <label htmlFor={id_key}>{_key}</label>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex items-center gap-2 text-sm capitalize">
            <span className="text-right w-8 text-xs">Result:</span>
            <ul className="flex gap-1 items-center py-1 font-semibold">
              {["all", "win", "lose"].map((_key) => {
                const id_key = `result_${_key}`;
                return (
                  <li key={_key} className="flex cursor-pointer">
                    <input
                      className="cursor-pointer"
                      id={id_key}
                      name={id_key}
                      type="radio"
                      onChange={() => handleResultChange(_key as "win" | "lose" | "all")}
                      checked={filter.result === _key}
                    />
                    <label htmlFor={id_key}>{_key}</label>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="sunken-panel w-full min-h-[200px] max-h-[60vh] relative">
          {isPending ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
                <p className="mt-2">Loading records...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4">
              Error loading records: {error.message}
            </div>
          ) : (
            <table
              className={clsx(
                "interactive w-full text-sm",
                isXP && "border-collapse border border-slate-500/70"
              )}
            >
              <thead className={isXP ? "border-b border-b-slate-500" : ""}>
                <tr className="text-left">
                  <th className="w-1/4">Time</th>
                  <th className="w-1/6">Level</th>
                  <th className="w-1/6">Duration</th>
                  <th className="w-1/3">Player</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr className="translate-y-20">
                    <td colSpan={4} className="text-center">
                      No records yet
                    </td>
                  </tr>
                ) : (
                  records.map((r) => {
                    const { duration, level, timestamp, player } = r;
                    const rowId = `${timestamp}-${player}`;
                    const isCopied = copiedRowId === rowId;
                    return (
                      <tr key={timestamp}>
                        <td className={isXP ? "border-b border-b-slate-500/40" : ""}>
                          {dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss")}
                        </td>
                        <td className={isXP ? "border-b border-b-slate-500/40" : ""}>{level}</td>
                        <td className={isXP ? "border-b border-b-slate-500/40" : ""}>{duration}s</td>
                        <td className={clsx(
                          isXP ? "border-b border-b-slate-500/40" : "",
                          "font-mono text-xs"
                        )}>
                          <button
                            type="button"
                            onClick={() => handleCopyAddress(player, rowId)}
                            className={clsx(
                              "w-full text-left hover:bg-[#008] hover:text-white transition-colors px-2 py-1",
                              isCopied ? "bg-green-200" : "bg-teal-200"
                            )}
                            title={isCopied ? "Copied!" : "Click to copy address"}
                          >
                            {player}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
        <em className="drop-shadow">* play time less than 1 second excluded</em>
        <div className="mt-3 pt-5 px-1.5 grid grid-rows-2 grid-cols-1 justify-items-center">
          <div className="col-span-2">
            <PersonalBest level="expert" data={best.expert} />
          </div>
          <div className="place-self-start">
            <PersonalBest level="intermediate" data={best.intermediate} />
          </div>
          <div className="place-self-end">
            <PersonalBest level="beginner" data={best.beginner} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordsWindow;
