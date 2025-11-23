import React, { useState, useEffect } from 'react';
import { PlusCircle, MinusCircle, Undo, RotateCcw } from 'lucide-react';

const GAME_STATE_KEY = 'playerCalculatorGame';

const PlayerCalculator = () => {
    const [players, setPlayers] = useState(() => {
        try {
            const saved = localStorage.getItem(GAME_STATE_KEY);
            if (!saved) return [
                { id: 'A', name: 'Player A' },
                { id: 'B', name: 'Player B' },
            ];
            
            const data = JSON.parse(saved);
            if (typeof data.players[0] === 'string') {
                return data.players.map(p => ({ id: p, name: `Player ${p}` }));
            }
            return data.players;
        } catch {
            return [
                { id: 'A', name: 'Player A' },
                { id: 'B', name: 'Player B' },
            ];
        }
    });

    const [rounds, setRounds] = useState(() => {
        try {
            const saved = localStorage.getItem(GAME_STATE_KEY);
            return saved ? JSON.parse(saved).rounds : [];
        } catch {
            return [];
        }
    });

    const [currentScores, setCurrentScores] = useState(() => {
        const initialPlayerIds = players.map(p => p.id);
        return initialPlayerIds.reduce((acc, playerId) => ({ ...acc, [playerId]: '' }), {});
    });

    useEffect(() => {
        const gameState = { players, rounds };
        localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
    }, [players, rounds]);

    const startNewGame = () => {
        if (window.confirm("Are you sure you want to start a new game? This will erase your saved game.")) {
            const initialPlayers = [
                { id: 'A', name: 'Player A' },
                { id: 'B', name: 'Player B' },
            ];
            setPlayers(initialPlayers);
            setRounds([]);
            setCurrentScores(initialPlayers.reduce((acc, player) => ({ ...acc, [player.id]: '' }), {}));
        }
    };

    const undoLastRound = () => {
        if (rounds.length > 0) {
            if (window.confirm("Are you sure you want to undo the last round?")) {
                setRounds(prev => prev.slice(0, -1));
            }
        } else {
            alert("No rounds to undo.");
        }
    };

    const handlePlayerNameChange = (playerId, newName) => {
        setPlayers(prevPlayers =>
            prevPlayers.map(p =>
                p.id === playerId ? { ...p, name: newName } : p
            )
        );
    };
    
    const addPlayer = () => {
        const availableLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const usedIds = new Set(players.map(p => p.id));
        const nextId = Array.from(availableLetters).find(id => !usedIds.has(id));
        
        if (nextId) {
            setPlayers([...players, { id: nextId, name: `Player ${nextId}` }]);
            setCurrentScores(prev => ({ ...prev, [nextId]: '' }));
        }
    };

    const removePlayer = (playerIdToRemove) => {
        if (players.length <= 2) {
            alert('Minimum 2 players required');
            return;
        }
        setPlayers(players.filter(player => player.id !== playerIdToRemove));
        const newScores = { ...currentScores };
        delete newScores[playerIdToRemove];
        setCurrentScores(newScores);
    };

    const calculateRoundDifferences = (scores) => {
        const results = {};
        const playerIds = players.map(p => p.id);
        
        playerIds.forEach(playerId => {
            let sum = 0;
            playerIds.forEach(otherPlayerId => {
                if (playerId !== otherPlayerId) {
                    sum += (scores[playerId] - scores[otherPlayerId]) * -1;
                }
            });
            results[playerId] = sum;
        });
        return results;
    };

    const calculateCumulativeResults = () => {
        const cumulative = players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {});
        rounds.forEach(round => {
            for (const playerId in round.differences) {
                if (cumulative.hasOwnProperty(playerId)) {
                    cumulative[playerId] += round.differences[playerId];
                }
            }
        });
        return cumulative;
    };

    const handleInputChange = (playerId, value) => {
        setCurrentScores(prev => ({ ...prev, [playerId]: value }));
    };

    const handleSubmitRound = () => {
        const playerIds = players.map(p => p.id);
        const scoresToValidate = playerIds.reduce((acc, id) => ({...acc, [id]: currentScores[id]}), {});

        if (Object.values(scoresToValidate).some(score => score === '' || isNaN(score))) {
            alert('Please enter valid numbers for all players.');
            return;
        }

        const numericScores = playerIds.reduce((acc, id) => ({...acc, [id]: Number(currentScores[id])}), {});
        const roundDifferences = calculateRoundDifferences(numericScores);
        
        setRounds(prev => [...prev, {
            roundNumber: prev.length + 1,
            scores: numericScores,
            differences: roundDifferences
        }]);

        setCurrentScores(playerIds.reduce((acc, id) => ({ ...acc, [id]: '' }), {}));
    };

    const cumulativeResults = calculateCumulativeResults();

    return (
        <div className="min-h-screen font-sans bg-gradient-to-br from-blue-300 via-purple-400 to-pink-400 p-4 sm:p-6 md:p-8 text-slate-800">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <h1 className="text-4xl md:text-5xl font-bold text-white text-center drop-shadow-lg">Place Calculator</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={startNewGame}
                            className="bg-white/30 backdrop-blur-lg rounded-lg p-2 pr-3 text-slate-700 hover:bg-white/40 transition-all border border-white/50 flex items-center gap-2 shadow-md"
                            title="New Game"
                        >
                            <RotateCcw size={20} />
                            <span className="font-medium text-sm">New Game</span>
                        </button>
                        <button
                            onClick={undoLastRound}
                            className="bg-white/30 backdrop-blur-lg rounded-lg p-2 pr-3 text-slate-700 hover:bg-white/40 transition-all border border-white/50 flex items-center gap-2 shadow-md"
                            title="Undo Last Round"
                        >
                            <Undo size={20} />
                            <span className="font-medium text-sm">Undo</span>
                        </button>
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Input & Results Panel */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Input Card */}
                        <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-800">Input Scores</h2>
                                <button onClick={addPlayer} className="text-blue-600 hover:text-blue-500 transition-colors" title="Add Player">
                                    <PlusCircle size={28} />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                                {players.map(player => (
                                    <div key={player.id} className="space-y-2">
                                        <input
                                            type="text"
                                            value={player.name}
                                            onChange={(e) => handlePlayerNameChange(player.id, e.target.value)}
                                            className="w-full bg-black/10 border-transparent rounded-md px-3 py-1 text-sm font-semibold text-slate-700 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:bg-black/5"
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={currentScores[player.id]}
                                                onChange={(e) => handleInputChange(player.id, e.target.value)}
                                                placeholder="Score"
                                                className="w-full bg-black/10 border-transparent rounded-md pl-3 pr-1 py-2 text-slate-800 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:bg-black/5"
                                            />
                                            <button onClick={() => removePlayer(player.id)} className="text-red-500 hover:text-red-400 transition-colors" title="Remove Player">
                                                <MinusCircle size={24} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleSubmitRound}
                                className="mt-8 w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                            >
                                Submit Round
                            </button>
                        </div>
                        
                        {/* Cumulative Results Card */}
                        <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6">Cumulative Results</h2>
                            <div className="space-y-3">
                                {players.map(player => (
                                    <div key={player.id} className="flex justify-between items-center p-3 bg-black/10 rounded-lg">
                                        <span className="font-bold text-slate-700">{player.name}</span>
                                        <span className={`font-bold text-lg ${
                                            cumulativeResults[player.id] > 0 ? 'text-green-600' : 
                                            cumulativeResults[player.id] < 0 ? 'text-red-600' : 'text-slate-600'
                                        }`}>
                                            {cumulativeResults[player.id] > 0 ? '+' : ''}{cumulativeResults[player.id] ?? 0}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Rounds History Panel */}
                    <div className="lg:col-span-3 bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6 overflow-hidden">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Rounds History</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px] text-sm text-left">
                                <thead className="text-slate-600">
                                    <tr className="border-b border-white/40">
                                        <th className="px-3 py-3 font-semibold">#</th>
                                        {players.map(player => <th key={player.id} className="px-3 py-3 font-semibold">{player.name}</th>)}
                                        {players.map(player => <th key={`${player.id}-diff`} className="px-3 py-3 font-semibold text-center">{player.name} +/-</th>)}
                                    </tr>
                                </thead>
                                <tbody className="text-slate-700">
                                    {rounds.slice().reverse().map((round) => (
                                        <tr key={round.roundNumber} className="border-b border-white/20 hover:bg-black/5">
                                            <td className="px-3 py-3 font-bold">{round.roundNumber}</td>
                                            {players.map(player => (
                                                <td key={`${round.roundNumber}-${player.id}-score`} className="px-3 py-3">{round.scores[player.id] ?? '–'}</td>
                                            ))}
                                            {players.map(player => (
                                                <td key={`${round.roundNumber}-${player.id}-diff`} className={`px-3 py-3 font-bold text-center ${
                                                    round.differences[player.id] > 0 ? 'text-green-600' : 
                                                    round.differences[player.id] < 0 ? 'text-red-600' : 'text-slate-500'
                                                }`}>
                                                    {round.differences[player.id] != null ? 
                                                        `${round.differences[player.id] > 0 ? '+' : ''}${round.differences[player.id]}` : '–'
                                                    }
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PlayerCalculator;
