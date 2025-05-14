import { useLeaderboard } from '../hooks/useLeaderboard';
import { formatAddress } from '../utils/imageUtils';

export const Leaderboard = () => {
  const { entries, totalSupply, isLoading, error } = useLeaderboard();
  
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Zen Leaderboard</h2>
        <div className="bg-egg-teal/20 px-3 py-1 rounded-full">
          <p className="text-sm font-medium">
            Total Supply: <span className="font-bold">{totalSupply.toFixed(2)} Zen</span>
          </p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center p-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Failed to load leaderboard</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No data available yet</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry) => (
                <tr key={entry.address} className="hover:bg-gray-50">
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`
                        flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center 
                        ${entry.rank === 1 ? 'bg-yellow-100 text-yellow-600' : 
                          entry.rank === 2 ? 'bg-gray-100 text-gray-600' : 
                          entry.rank === 3 ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-500'}
                      `}>
                        {entry.rank}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatAddress(entry.address)}
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <span className="font-bold">{entry.zenBalance.toFixed(2)}</span>
                    <span className="text-gray-500 ml-1">Zen</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="text-right mt-4">
        <p className="text-xs text-gray-500">
          Auto-updates every minute
        </p>
      </div>
    </div>
  );
}; 