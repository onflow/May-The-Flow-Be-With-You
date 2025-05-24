import type { TransactionStatus as TxStatus } from '../types';

interface TransactionStatusProps {
  status: TxStatus;
}

export const TransactionStatus = ({ status }: TransactionStatusProps) => {
  if (status.status === 'idle') return null;
  
  return (
    <div className={`
      rounded-lg p-4 mb-4
      ${status.status === 'pending' ? 'bg-blue-50 text-blue-700' : 
        status.status === 'success' ? 'bg-green-50 text-green-700' : 
        'bg-red-50 text-red-700'}
    `}>
      <div className="flex items-center">
        {status.status === 'pending' && (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        
        {status.status === 'success' && (
          <svg className="h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
        
        {status.status === 'error' && (
          <svg className="h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}
        
        <span className="font-medium">
          {status.status === 'pending' && 'Transaction in progress...'}
          {status.status === 'success' && 'Transaction completed successfully'}
          {status.status === 'error' && `Transaction failed: ${status.error || 'Unknown error'}`}
        </span>
      </div>
      
      {status.txId && (
        <p className="text-xs mt-2 break-all">
          Transaction ID: {status.txId}
        </p>
      )}
    </div>
  );
}; 