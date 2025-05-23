export type Level = "beginner" | "intermediate" | "expert" | "custom";
export type UI = "win98" | "xp";
export type ArticleName = "about" | "help" | "feedback";

export interface PlayRecord {
    timestamp: number;
    duration: number;
    level: Level;
    status: "win" | "lose";
    player: string;
} 