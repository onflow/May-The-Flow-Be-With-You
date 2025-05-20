import { Level } from "./index";

export interface LeaderboardRecord {
    timestamp: number;
    duration: number;
    level: Level;
    status: "win" | "lose";
    player: string;
} 