import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Coins, Swords, Crown, Shield, Anchor, UserPlus } from 'lucide-react';
import { Character } from '../types/game';

export const GameActions = () => {
  const { players, currentPlayerIndex, performAction, initiateAction } = useGameStore();
  const currentPlayer = players[currentPlayerIndex];
  const mustCoup = currentPlayer.coins >= 10;
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const handleAction = (action: string, character?: Character) => {
    initiateAction(action as any, character);
  };

  const otherPlayers = players.filter((_, index) => index !== currentPlayerIndex);

  return (
    <div className="space-y-4">
      {/* Basic Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          disabled={mustCoup}
          onClick={() => handleAction('income')}
          className="flex items-center justify-center gap-2 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Coins className="w-5 h-5" />
          <span>Income (+1)</span>
        </button>

        <button
          disabled={mustCoup}
          onClick={() => handleAction('foreign_aid')}
          className="flex items-center justify-center gap-2 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Coins className="w-5 h-5" />
          <span>Foreign Aid (+2)</span>
        </button>
      </div>

      {/* Character Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          disabled={mustCoup}
          onClick={() => handleAction('tax', 'Duke')}
          className="flex items-center justify-center gap-2 p-3 bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Crown className="w-5 h-5" />
          <span>Tax as Duke (+3)</span>
        </button>

        <button
          disabled={mustCoup || currentPlayer.coins < 3}
          onClick={() => handleAction('assassinate', 'Assassin')}
          className="flex items-center justify-center gap-2 p-3 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Swords className="w-5 h-5" />
          <span>Assassinate (-3)</span>
        </button>

        <button
          disabled={mustCoup}
          onClick={() => handleAction('steal', 'Captain')}
          className="flex items-center justify-center gap-2 p-3 bg-purple-100 rounded-lg hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Anchor className="w-5 h-5" />
          <span>Steal as Captain</span>
        </button>

        <button
          disabled={mustCoup}
          onClick={() => handleAction('exchange', 'Ambassador')}
          className="flex items-center justify-center gap-2 p-3 bg-green-100 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus className="w-5 h-5" />
          <span>Exchange as Ambassador</span>
        </button>
      </div>

      {/* Coup Action */}
      <button
        disabled={currentPlayer.coins < 7}
        onClick={() => handleAction('coup')}
        className="w-full flex items-center justify-center gap-2 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Shield className="w-5 h-5" />
        <span>Coup (-7)</span>
      </button>

      {/* Target Selection */}
      {selectedTarget && (
        <div className="mt-4">
          <h4 className="text-lg font-semibold mb-2">Select Target:</h4>
          <div className="grid grid-cols-1 gap-2">
            {otherPlayers.map(player => (
              <button
                key={player.id}
                onClick={() => {
                  if (selectedTarget) {
                    handleAction(selectedTarget, player.id as any);
                    setSelectedTarget(null);
                  }
                }}
                className="p-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                {player.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {mustCoup && (
        <div className="text-red-600 text-center font-medium mt-4">
          You must perform a Coup when you have 10 or more coins!
        </div>
      )}
    </div>
  );
};