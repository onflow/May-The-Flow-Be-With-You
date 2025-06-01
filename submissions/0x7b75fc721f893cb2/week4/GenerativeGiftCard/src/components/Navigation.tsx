'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  useCurrentFlowUser,
} from "@onflow/kit";

export default function Navigation() {
  const pathname = usePathname();
  //const [userAddress, setUserAddress] = useState<CurrentUser | null>(null);
  const { user, authenticate, unauthenticate } = useCurrentFlowUser();


  return (
    <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">Flow Gift Cards</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/create"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === '/create'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Create Gift Card
                </Link>
                <Link
                  href="/my-cards"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === '/my-cards'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  My Gift Cards
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              {user && user.loggedIn ? (
                <button
                  onClick={unauthenticate}
                  className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 text-sm"
                >
                  Disconnect ({user.addr})
                </button>
              ) : (
                <button
                  onClick={authenticate}
                  className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 text-sm"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
    </nav>
  );
} 