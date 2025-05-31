import { useState, useEffect } from 'react';
import SaveScoreButton from './SaveScoreButton';

interface Question {
    question: string;
    options: Record<string, string>;
    correct_option: string;
    score: number;
    difficulty: string;
}

interface QuizProps {
    account: string;
    refreshFlag: boolean;
}

const Quiz = ({ account, refreshFlag }: QuizProps) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [latestOnChainScore, setLatestOnChainScore] = useState<number | null>(null);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const response = await fetch('https://breaking-bad-fastapi.onrender.com/questions/Breaking%20Bad');
            const data = await response.json();
            setQuestions(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching questions:', error);
            setLoading(false);
        }
    };

    const handleAnswerClick = (selectedOption: string) => {
        const currentQ = questions[currentQuestion];
        if (selectedOption === currentQ.correct_option) {
            setScore(score + currentQ.score);
        }

        const nextQuestion = currentQuestion + 1;
        if (nextQuestion < questions.length) {
            setCurrentQuestion(nextQuestion);
        } else {
            setShowScore(true);
        }
    };

    const restartQuiz = () => {
        setCurrentQuestion(0);
        setScore(0);
        setShowScore(false);
        setLatestOnChainScore(null);
        fetchQuestions();
    };

    const handleScoreUpdate = (newScore: number | null) => {
        setLatestOnChainScore(newScore);
    };

    const handleRefreshScore = () => {
        // This function is no longer used in the new implementation
    };

    if (loading) {
        return (
            <div className="text-center text-2xl text-yellow-500 py-8 font-bold">
                Loading questions...
            </div>
        );
    }

    if (showScore) {
        const totalPossibleScore = questions.reduce((total, q) => total + q.score, 0);
        const percentage = Math.round((score / totalPossibleScore) * 100);

        return (
            <div className="text-center p-8 bg-gray-900 rounded-xl shadow-2xl">
                <h2 className="text-3xl font-bold text-yellow-500 mb-6">Quiz Completed!</h2>
                <div className="mb-8">
                    <p className="text-2xl text-white mb-2">
                        You scored <span className="text-yellow-500 font-bold">{score}</span> out of <span className="text-yellow-500 font-bold">{totalPossibleScore}</span> points
                    </p>
                    <p className="text-xl text-gray-300">
                        That's <span className="text-yellow-500 font-bold">{percentage}%</span> correct!
                    </p>
                    {account && latestOnChainScore !== null && (
                        <p className="text-green-400 font-bold mt-2">Latest On-Chain Score: {latestOnChainScore}</p>
                    )}
                </div>
                <SaveScoreButton scores={[score]} account={account} onScoreUpdate={handleScoreUpdate} refreshFlag={refreshFlag} />
                <button
                    onClick={restartQuiz}
                    className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-8 rounded-lg transition-colors duration-300 text-lg transform hover:scale-105 mt-4"
                >
                    Play Again
                </button>
            </div>
        );
    }

    const currentQ = questions[currentQuestion];

    return (
        <div className="max-w-3xl mx-auto p-8 bg-gray-900 rounded-xl shadow-2xl">
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <div className="text-lg text-gray-300">
                        Question <span className="font-bold text-yellow-500">{currentQuestion + 1}</span>/{questions.length}
                    </div>
                    <div className="text-sm text-gray-300">
                        Difficulty: <span className="font-bold text-yellow-500 capitalize">{currentQ.difficulty}</span>
                    </div>
                </div>
                <div className="text-2xl font-bold text-white mb-8 flex items-center gap-4">
                    {currentQ.question}
                    <span className="ml-2 px-3 py-1 bg-yellow-400 text-black text-base font-semibold rounded-full shadow-sm">+{currentQ.score} pts</span>
                </div>
            </div>
            <div className="space-y-4">
                {Object.entries(currentQ.options).map(([key, value]) => (
                    <button
                        key={key}
                        onClick={() => handleAnswerClick(key)}
                        className="w-full p-4 text-left bg-gray-800 text-white hover:bg-yellow-400 hover:text-gray-900 focus:bg-yellow-400 focus:text-gray-900 rounded-lg transition-all duration-300 text-lg border border-gray-700 hover:border-yellow-500 focus:border-yellow-500 transform hover:scale-[1.02] focus:scale-[1.02] outline-none"
                        tabIndex={0}
                        aria-label={`Answer ${key}: ${value}`}
                    >
                        <span className="font-bold text-black mr-3">{key}.</span> <span className="font-semibold text-black hover:text-gray-900 focus:text-gray-900">{value}</span>
                    </button>
                ))}
            </div>
            <div className="mt-8 text-center text-gray-400">
                <p>Current Score: <span className="text-yellow-500 font-bold">{score}</span> points</p>
            </div>
        </div>
    );
};

export default Quiz; 