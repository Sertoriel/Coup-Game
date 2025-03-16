import React from 'react';
import { useGameStore } from '../store/gameStore';

export const DiscardPile = () => {
  const { discardPile } = useGameStore();
  
  const countByCharacter = discardPile.reduce((acc, char) => {
    acc[char] = (acc[char] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Discarded Influences</h3>
      <div className="flex gap-4">
        {Object.entries(countByCharacter).map(([character, count]) => (
          <div key={character} className="text-center">
            <div className="w-16 h-24 bg-gray-200 rounded-lg flex items-center justify-center mb-1">
              <span className="font-medium">{character}</span>
            </div>
            <span className="text-sm text-gray-600">x{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};