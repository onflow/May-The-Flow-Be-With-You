import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { FlowService } from '../services/flow-service';
import type { UserData } from '../types';

export const useUserData = () => {
  const { user, loggedIn } = useAuth();
  const queryClient = useQueryClient();
  
  // Query for fetching user data
  const { 
    data: userData, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['userData', user?.addr],
    queryFn: async () => {
      if (!user?.addr) return null;
      const data = await FlowService.getUserData(user.addr);
      return data as UserData;
    },
    enabled: !!user?.addr && loggedIn,
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Function to refresh user data after transactions
  const refreshUserData = () => {
    if (user?.addr) {
      queryClient.invalidateQueries({ queryKey: ['userData', user.addr] });
    }
  };
  
  // Helper functions
  const hasEggs = !!userData?.eggs?.length;
  const hasWisdomPhrases = !!userData?.phrases?.length;
  
  return {
    userData,
    isLoading,
    error,
    refetch,
    refreshUserData,
    hasEggs,
    hasWisdomPhrases,
  };
}; 