import React from 'react';
import { Player } from '../types/game';
import { Shield } from 'lucide-react';

interface PlayerHandProps {
  player: Player;
  showCards: boolean;
}

export const PlayerHand = ({ player, showCards }: PlayerHandProps) => {
  return (
    <div className="flex gap-4">
      {player.influences.map((card, index) => (
        <div
          key={index}
          className={`w-24 h-36 rounded-lg ${
            card.revealed
              ? 'bg-gray-200'
              : showCards
              ? 'bg-indigo-600'
              : 'bg-indigo-500'
          } flex items-center justify-center shadow-md transition-transform hover:transform hover:scale-105`}
        >
          {card.revealed ? (
            <span className="text-gray-600 font-medium">{card.character}</span>
          ) : showCards ? (
            <span className="text-white font-medium">{card.character}</span>
          ) : (
            <Shield className="w-8 h-8 text-white opacity-50" />
          )}
        </div>
      ))}
    </div>
  );
};