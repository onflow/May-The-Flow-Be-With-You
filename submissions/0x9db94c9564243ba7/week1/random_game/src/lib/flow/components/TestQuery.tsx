import React from 'react';
import { useTestQuery } from '../hooks/useTestQuery';

export const TestQuery: React.FC = () => {
  const { data, isLoading, error, refetch } = useTestQuery();

  if (isLoading) return <p>Loading query...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <p>Result: {String(data)}</p>
      <button onClick={() => refetch()}>Refetch</button>
    </div>
  );
}; 