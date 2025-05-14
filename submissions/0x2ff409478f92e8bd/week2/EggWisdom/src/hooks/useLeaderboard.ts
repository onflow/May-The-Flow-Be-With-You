import { useQuery } from '@tanstack/react-query';
import { FlowService } from '../services/flow-service';
import type { LeaderboardData } from '../types';

export const useLeaderboard = () => {
  // Query for fetching leaderboard data
  const { 
    data: leaderboardData, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const data = await FlowService.getLeaderboard();
      return data as LeaderboardData;
    },
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60, // Auto-refresh every minute
  });
  
  return {
    leaderboardData,
    isLoading,
    error,
    refetch,
    totalSupply: leaderboardData?.totalZenSupply || 0,
    entries: leaderboardData?.entries || [],
  };
}; 