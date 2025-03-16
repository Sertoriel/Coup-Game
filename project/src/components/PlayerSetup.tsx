import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Users } from 'lucide-react';

export const PlayerSetup = () => {
  const [playerName, setPlayerName] = useState('');
  const { players, addPlayer, startGame } = useGameStore();

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      addPlayer(playerName.trim());
      setPlayerName('');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="flex items-center justify-center mb-6">
        <Users className="w-8 h-8 text-indigo-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800">Player Setup</h2>
      </div>

      <form onSubmit={handleAddPlayer} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter player name"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            maxLength={20}
          />
          <button
            type="submit"
            disabled={players.length >= 4 || !playerName.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </form>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Players ({players.length}/4):</h3>
        <ul className="space-y-2">
          {players.map((player, index) => (
            <li
              key={player.id}
              className="px-4 py-2 bg-gray-50 rounded-lg flex items-center"
            >
              <span className="font-medium">{index + 1}. {player.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => startGame()}
        disabled={players.length < 2}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Start Game ({players.length < 2 ? `Need ${2 - players.length} more players` : 'Ready!'})
      </button>
    </div>
  );
};