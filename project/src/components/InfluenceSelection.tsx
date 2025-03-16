import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Card } from '../types/game';

export const InfluenceSelection = () => {
  const { players, playerToLoseInfluence, loseInfluence } = useGameStore();
  
  if (!playerToLoseInfluence) return null;
  
  const player = players.find(p => p.id === playerToLoseInfluence);
  if (!player) return null;

  const availableInfluences = player.influences.filter(card => !card.revealed);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">{player.name}, select an influence to lose:</h3>
        <div className="grid grid-cols-2 gap-4">
          {availableInfluences.map((card, index) => (
            <button
              key={index}
              onClick={() => loseInfluence(player.id, index)}
              className="p-4 bg-red-100 rounded-lg hover:bg-red-200 flex flex-col items-center"
            >
              <div className="w-20 h-28 bg-red-500 rounded-lg flex items-center justify-center mb-2">
                <span className="text-white font-medium">{card.character}</span>
              </div>
              <span>Reveal this influence</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};