import { useEffect, useState } from 'react';
import * as fcl from '@onflow/fcl';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Avatar } from '../components/Avatar';
import { initializeFCL } from '../lib/fcl-config';

interface Identity {
  reputation: number;
  participationCount: number;
  visualSignature: string;
  lastUpdated: number;
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Initialize FCL configuration
  useEffect(() => {
    initializeFCL();
  }, []);

  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
  }, []);

  useEffect(() => {
    if (user?.addr) {
      fetchIdentity();
    }
  }, [user]);

  const showSuccessNotification = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const fetchIdentity = async () => {
    try {
      setLoading(true);
      const result = await fcl.query({
        cadence: `
          import IdentitySystem from "../cadence/contracts/IdentitySystem.cdc"
          
          pub fun main(address: Address): IdentitySystem.Identity? {
              let account = getAccount(address)
              return account.getCapability<&IdentitySystem.Identity>(/public/Identity)
                  .borrow()
          }
        `,
        args: (arg: any, t: any) => [arg(user.addr, t.Address)],
      });
      
      if (result) {
        setIdentity({
          reputation: result.reputation,
          participationCount: result.participationCount,
          visualSignature: result.visualSignature,
          lastUpdated: result.lastUpdated,
        });
      } else {
        setIdentity(null);
      }
    } catch (error) {
      console.error('Error fetching identity:', error);
      showSuccessNotification('Error fetching identity data');
    } finally {
      setLoading(false);
    }
  };

  const createIdentity = async () => {
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import IdentitySystem from "../cadence/contracts/IdentitySystem.cdc"
          
          transaction {
              prepare(signer: auth(Signer) &Account) {
                  let identity <- IdentitySystem.createIdentity()
                  signer.save(<- identity, to: /storage/Identity)
                  signer.link<&IdentitySystem.Identity>(/public/Identity, target: /storage/Identity)
              }
          }
        `,
        limit: 999,
      });

      await fcl.tx(transactionId).onceSealed();
      await fetchIdentity();
      showSuccessNotification('Identity created successfully!');
    } catch (error) {
      console.error('Error creating identity:', error);
      showSuccessNotification('Error creating identity');
    }
  };

  const updateReputation = async () => {
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import IdentitySystem from "../cadence/contracts/IdentitySystem.cdc"
          
          transaction {
              prepare(signer: auth(Signer) &Account) {
                  let identity = signer.borrow<&IdentitySystem.Identity>(from: /storage/Identity)
                      ?? panic("Identity not found")
                  identity.updateReputation(points: 1)
              }
          }
        `,
        limit: 999,
      });

      await fcl.tx(transactionId).onceSealed();
      await fetchIdentity();
      showSuccessNotification('Reputation updated!');
    } catch (error) {
      console.error('Error updating reputation:', error);
      showSuccessNotification('Error updating reputation');
    }
  };

  const logIn = async () => {
    try {
      await fcl.authenticate();
    } catch (error) {
      console.error('Authentication error:', error);
      showSuccessNotification('Authentication failed');
    }
  };

  const logOut = async () => {
    try {
      await fcl.unauthenticate();
    } catch (error) {
      console.error('Logout error:', error);
      showSuccessNotification('Logout failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 text-white">
      {/* Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            {notificationMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="p-6 backdrop-blur-lg bg-white/5 border-b border-white/10">
        <div className="container mx-auto flex justify-between items-center">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
          >
            FlowPersona
          </motion.h1>
          {user && user.addr ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <span className="text-sm bg-white/10 px-4 py-2 rounded-full">
                {`${user.addr.slice(0, 6)}...${user.addr.slice(-4)}`}
              </span>
              <button
                onClick={logOut}
                className="px-4 py-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Log Out
              </button>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={logIn}
              className="px-6 py-3 bg-blue-500/80 hover:bg-blue-500 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              Connect Wallet
            </motion.button>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        {user ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12"
          >
            <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-lg border border-white/10 shadow-xl">
              <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Your Identity
              </h2>
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
                </div>
              ) : identity ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-sm text-gray-300">Reputation</p>
                      <p className="text-2xl font-bold">{identity.reputation}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-sm text-gray-300">Participation</p>
                      <p className="text-2xl font-bold">{identity.participationCount}</p>
                    </div>
                  </div>
                  <button
                    onClick={updateReputation}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl hover:opacity-90 transition-all duration-300 transform hover:scale-105"
                  >
                    Earn Reputation
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-lg text-gray-300">No identity found. Create one to get started!</p>
                  <button
                    onClick={createIdentity}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:opacity-90 transition-all duration-300 transform hover:scale-105"
                  >
                    Create Identity
                  </button>
                </div>
              )}
            </div>
            
            <div className="h-[500px] bg-white/10 rounded-2xl backdrop-blur-lg border border-white/10 shadow-xl overflow-hidden">
              <Canvas>
                <OrbitControls enableZoom={false} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                {identity && (
                  <Avatar
                    reputation={identity.reputation}
                    participationCount={identity.participationCount}
                  />
                )}
              </Canvas>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Welcome to Flow Persona
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Connect your wallet to view and manage your on-chain identity. Create your unique visual signature and build your reputation in the Flow ecosystem.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logIn}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-lg font-semibold hover:opacity-90 transition-all duration-300"
            >
              Connect Wallet
            </motion.button>
          </motion.div>
        )}
      </main>
    </div>
  );
} 