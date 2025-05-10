'use client';

import { useState } from 'react';
import { getRandomNumber } from '../utils/contracts';
import SpinningWheel from './SpinningWheel';

export default function RandomNumber() {
    const [result, setResult] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);

    const generateRandom = async () => {
        try {
            setLoading(true);
            setError(null);
            setIsSpinning(true);
            const randomNumber = await getRandomNumber();
            // Ensure the number is between 1 and 12
            const normalizedNumber = ((randomNumber % 12) + 12) % 12 + 1;
            setResult(normalizedNumber);
        } catch (error) {
            console.error('Error generating random number:', error);
            setError(error instanceof Error ? error.message : 'Failed to generate random number');
            setIsSpinning(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSpinComplete = () => {
        setIsSpinning(false);
    };

    return (
        <div className="space-y-10">
            {/* Spinning Wheel */}
            <div className="relative">
                <SpinningWheel
                    isSpinning={isSpinning}
                    selectedNumber={result}
                    onSpinComplete={handleSpinComplete}
                />
            </div>

            {/* Spin Button */}
            <button
                onClick={generateRandom}
                disabled={loading || isSpinning}
                className="relative w-full group"
            >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-1000 group-disabled:opacity-25 animate-gradient"></div>
                <div className="relative px-6 py-4 bg-black rounded-xl flex items-center justify-center gap-3 text-sm text-white group-hover:text-blue-400 transition-all duration-300 group-disabled:cursor-not-allowed">
                    {loading || isSpinning ? (
                        <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>{isSpinning ? 'Spinning...' : 'Waiting for next block...'}</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            <span>Spin the Wheel!</span>
                        </>
                    )}
                </div>
            </button>

            {error && (
                <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-6 text-red-400 text-center text-sm animate-pulse">
                    {error}
                </div>
            )}
        </div>
    );
} 