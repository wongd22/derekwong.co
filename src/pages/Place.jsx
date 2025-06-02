import React, { useState } from 'react';
import { PlusCircle, MinusCircle } from 'lucide-react';

const PlayerCalculator = () => {
    const [players, setPlayers] = useState(['A', 'B', 'C', 'D']);
    const [rounds, setRounds] = useState([]);
    const [currentScores, setCurrentScores] = useState({
        A: '', B: '', C: '', D: ''
    });

    const addPlayer = () => {
        const availableLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const usedLetters = new Set(players);
        const nextLetter = Array.from(availableLetters).find(letter => !usedLetters.has(letter));
        
        if (nextLetter) {
            setPlayers([...players, nextLetter]);
            setCurrentScores(prev => ({
                ...prev,
                [nextLetter]: ''
            }));
        }
    };

    const removePlayer = (playerToRemove) => {
        if (players.length <= 2) {
            alert('Minimum 2 players required');
            return;
        }

        setPlayers(players.filter(player => player !== playerToRemove));
        setCurrentScores(prev => {
            const newScores = { ...prev };
            delete newScores[playerToRemove];
            return newScores;
        });
    };

    const calculateRoundDifferences = (scores) => {
        const results = {};
        
        players.forEach(player => {
            let sum = 0;
            players.forEach(otherPlayer => {
                if (player !== otherPlayer) {
                    sum += (scores[player] - scores[otherPlayer]) * -1;
                }
            });
            results[player] = sum;
        });
        
        return results;
    };

    const calculateCumulativeResults = () => {
        const cumulative = players.reduce((acc, player) => {
            acc[player] = 0;
            return acc;
        }, {});

        rounds.forEach(round => {
            Object.keys(round.differences).forEach(player => {
                if (cumulative.hasOwnProperty(player)) {
                    cumulative[player] += round.differences[player];
                }
            });
        });
        return cumulative;
    };

    const handleInputChange = (player, value) => {
        setCurrentScores(prev => ({
            ...prev,
            [player]: value
        }));
    };

    const handleSubmitRound = () => {
        if (Object.entries(currentScores)
            .filter(([player]) => players.includes(player))
            .some(([_, score]) => score === '' || isNaN(score))) {
            alert('Please enter valid numbers for all players');
            return;
        }

        const numericScores = Object.entries(currentScores)
            .filter(([player]) => players.includes(player))
            .reduce((acc, [player, score]) => {
                acc[player] = Number(score);
                return acc;
            }, {});

        const roundDifferences = calculateRoundDifferences(numericScores);
        
        setRounds(prev => [...prev, {
            roundNumber: prev.length + 1,
            scores: numericScores,
            differences: roundDifferences
        }]);

        const resetScores = players.reduce((acc, player) => {
            acc[player] = '';
            return acc;
        }, {});
        setCurrentScores(resetScores);
    };

    const cumulativeResults = calculateCumulativeResults();

    return (
        <div className="min-h-screen bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold text-white text-center mb-12">Place Calculator</h1>
                
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Input Panel */}
                    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Input Round Scores</h2>
                            <button
                                onClick={addPlayer}
                                className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                                title="Add Player"
                            >
                                <PlusCircle size={24} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {players.map(player => (
                                <div key={player} className="relative">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Player {player}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={currentScores[player]}
                                            onChange={(e) => handleInputChange(player, e.target.value)}
                                            className="block w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <button
                                            onClick={() => removePlayer(player)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                            title="Remove Player"
                                        >
                                            <MinusCircle size={24} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleSubmitRound}
                            className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                        >
                            Submit Round
                        </button>
                    </div>

                    {/* Results Panel */}
                    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
                        <h2 className="text-xl font-bold text-white mb-6">Cumulative Results</h2>
                        <div className="space-y-3">
                            {Object.entries(cumulativeResults).map(([player, score]) => (
                                <div key={player} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                                    <span className="font-medium text-gray-200">Player {player}</span>
                                    <span className={`font-bold ${
                                        score > 0 ? 'text-emerald-400' : 
                                        score < 0 ? 'text-red-400' : 
                                        'text-gray-400'
                                    }`}>
                                        {score > 0 ? '+' : ''}{score}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Rounds History */}
                <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 overflow-x-auto">
                    <h2 className="text-xl font-bold text-white mb-6">Rounds History</h2>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="px-4 py-3 text-left text-gray-300">Round</th>
                                <th className="px-4 py-3 text-left text-gray-300" colSpan={players.length}>Scores</th>
                                <th className="px-4 py-3 text-left text-gray-300" colSpan={players.length}>Round +/-</th>
                            </tr>
                            <tr className="border-b border-gray-700">
                                <th className="px-4 py-3 text-gray-300"></th>
                                {players.map(player => (
                                    <th key={`score-${player}`} className="px-4 py-3 text-gray-300">
                                        Player {player}
                                    </th>
                                ))}
                                {players.map(player => (
                                    <th key={`diff-${player}`} className="px-4 py-3 text-gray-300">
                                        Player {player}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rounds.map((round) => (
                                <tr key={round.roundNumber} className="border-b border-gray-700">
                                    <td className="px-4 py-3 text-gray-300">
                                        {round.roundNumber}
                                    </td>
                                    {players.map(player => (
                                        <td key={`score-${player}`} className="px-4 py-3 text-gray-300">
                                            {round.scores[player] ?? '-'}
                                        </td>
                                    ))}
                                    {players.map(player => (
                                        <td 
                                            key={`diff-${player}`} 
                                            className={`px-4 py-3 ${
                                                round.differences[player] > 0 
                                                    ? 'text-emerald-400' 
                                                    : round.differences[player] < 0 
                                                        ? 'text-red-400' 
                                                        : 'text-gray-300'
                                            }`}
                                        >
                                            {round.differences[player] != null ? (
                                                <>
                                                    {round.differences[player] > 0 ? '+' : ''}
                                                    {round.differences[player]}
                                                </>
                                            ) : '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PlayerCalculator;