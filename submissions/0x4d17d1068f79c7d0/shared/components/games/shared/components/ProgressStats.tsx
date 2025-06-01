"use client";

import React from "react";

interface ProgressStatsProps {
  perfectRounds: number;
  totalRounds: number;
  additionalStats?: Array<{
    value: string | number;
    label: string;
    sublabel?: string;
  }>;
}

export function ProgressStats({
  perfectRounds,
  totalRounds,
  additionalStats = [],
}: ProgressStatsProps) {
  if (totalRounds === 0 && additionalStats.length === 0) return null;

  const successRate = totalRounds > 0 ? Math.round((perfectRounds / totalRounds) * 100) : 0;

  const stats = [
    ...(totalRounds > 0 ? [
      {
        value: perfectRounds,
        label: "Perfect Rounds",
        sublabel: undefined,
      },
      {
        value: totalRounds,
        label: "Total Rounds",
        sublabel: undefined,
      },
      {
        value: `${successRate}%`,
        label: "Success Rate",
        sublabel: undefined,
      },
    ] : []),
    ...additionalStats,
  ];

  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-4 px-6 py-3 bg-gray-50 rounded-lg">
        {stats.map((stat, index) => (
          <React.Fragment key={index}>
            {index > 0 && <div className="w-px h-8 bg-gray-300"></div>}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-xs text-gray-600">{stat.label}</div>
              {stat.sublabel && (
                <div className="text-xs text-gray-500 mt-1">{stat.sublabel}</div>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
