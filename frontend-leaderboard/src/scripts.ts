const network = import.meta.env.VITE_NETWORK;

export const getLeaderboardScript = `
import Leaderboard from ${network === "mainnet" ? "0xLeaderboard" : "0x4fae0a028f1057ae"}

access(all)
fun main(
  admin: Address,
  periodAlias: String?,
): [Leaderboard.ScoreRecord] {
  if let adminRef = Leaderboard.borrowLeaderboardAdmin(admin) {
    return adminRef.getLeaderboardByPeriodAlias(periodAlias)
  }
  return []
}
`;

export const getLeaderboardScriptArgs = (periodAlias: string | undefined) => [
    { type: "Address", value: network === "mainnet" ? "0xb56e8d0d805eebf8" : "0xe647591c05619dba" },
    {
        type: "Optional",
        value: typeof periodAlias === "string" ? { type: "String", value: periodAlias } : null,
    },
];
