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

    const scoreTone = (value) =>
        value > 0 ? 'text-[#146C43]' : value < 0 ? 'text-[#B42318]' : 'text-[#5E5E5A]';

    return (
        <div className="min-h-screen font-sans bg-[#F5F5F3] p-4 sm:p-6 md:p-8 text-[#181818]">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#181818] text-center">Place Calculator</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={startNewGame}
                            className="bg-[#FFFFFF] rounded-lg p-2 pr-3 text-[#181818] hover:bg-[#F0F0EE] active:bg-[#E3E3E0] transition-colors duration-300 border border-[#E3E3E0] flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#181818] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F5F3]"
                            title="New Game"
                        >
                            <RotateCcw size={20} />
                            <span className="font-medium text-sm">New Game</span>
                        </button>
                        <button
                            onClick={undoLastRound}
                            className="bg-[#FFFFFF] rounded-lg p-2 pr-3 text-[#181818] hover:bg-[#F0F0EE] active:bg-[#E3E3E0] transition-colors duration-300 border border-[#E3E3E0] flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#181818] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F5F3]"
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
                        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E3E3E0] p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-[#181818]">Input Scores</h2>
                                <button
                                    onClick={addPlayer}
                                    className="text-[#181818] hover:text-[#000000] rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#181818] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFFFF]"
                                    title="Add Player"
                                >
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
                                            className="w-full bg-[#F0F0EE] border border-[#E3E3E0] rounded-md px-3 py-1 text-sm font-semibold text-[#181818] placeholder:text-[#5E5E5A] focus:outline-none focus:bg-[#FFFFFF] focus-visible:ring-2 focus-visible:ring-[#181818] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFFFF] transition-colors duration-300"
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={currentScores[player.id]}
                                                onChange={(e) => handleInputChange(player.id, e.target.value)}
                                                placeholder="Score"
                                                className="w-full bg-[#F0F0EE] border border-[#E3E3E0] rounded-md pl-3 pr-1 py-2 text-[#181818] placeholder:text-[#5E5E5A] focus:outline-none focus:bg-[#FFFFFF] focus-visible:ring-2 focus-visible:ring-[#181818] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFFFF] transition-colors duration-300"
                                            />
                                            <button
                                                onClick={() => removePlayer(player.id)}
                                                className="text-[#5E5E5A] hover:text-[#181818] rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#181818] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFFFF]"
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
                                className="mt-8 w-full bg-[#181818] text-[#FFFFFF] py-3 px-4 rounded-lg font-bold text-lg hover:bg-[#272727] active:bg-[#000000] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#181818] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFFFF]"
                            >
                                Submit Round
                            </button>
                        </div>
                        
                        {/* Cumulative Results Card */}
                        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E3E3E0] p-6">
                            <h2 className="text-2xl font-bold text-[#181818] mb-6">Cumulative Results</h2>
                            <div className="space-y-3">
                                {players.map(player => (
                                    <div key={player.id} className="flex justify-between items-center p-3 bg-[#F0F0EE] rounded-lg">
                                        <span className="font-bold text-[#181818]">{player.name}</span>
                                        <span className={`font-bold text-lg ${scoreTone(cumulativeResults[player.id])}`}>
                                            {cumulativeResults[player.id] > 0 ? '+' : ''}{cumulativeResults[player.id] ?? 0}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Rounds History Panel */}
                    <div className="lg:col-span-3 bg-[#FFFFFF] rounded-2xl border border-[#E3E3E0] p-6 overflow-hidden">
                        <h2 className="text-2xl font-bold text-[#181818] mb-6">Rounds History</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px] text-sm text-left">
                                <thead className="text-[#5E5E5A]">
                                    <tr className="border-b border-[#E3E3E0]">
                                        <th className="px-3 py-3 font-semibold">#</th>
                                        {players.map(player => <th key={player.id} className="px-3 py-3 font-semibold">{player.name}</th>)}
                                        {players.map(player => <th key={`${player.id}-diff`} className="px-3 py-3 font-semibold text-center">{player.name} +/-</th>)}
                                    </tr>
                                </thead>
                                <tbody className="text-[#181818]">
                                    {rounds.slice().reverse().map((round) => (
                                        <tr key={round.roundNumber} className="border-b border-[#E3E3E0] hover:bg-[#F0F0EE] transition-colors duration-300">
                                            <td className="px-3 py-3 font-bold">{round.roundNumber}</td>
                                            {players.map(player => (
                                                <td key={`${round.roundNumber}-${player.id}-score`} className="px-3 py-3">{round.scores[player.id] ?? '–'}</td>
                                            ))}
                                            {players.map(player => (
                                                <td key={`${round.roundNumber}-${player.id}-diff`} className={`px-3 py-3 font-bold text-center ${scoreTone(round.differences[player.id])}`}>
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
