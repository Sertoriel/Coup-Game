import React from 'react';
import { useGameStore } from '../store/gameStore';
import { PlayerHand } from './PlayerHand';
import { GameActions } from './GameActions';
import { ActionResolution } from './ActionResolution';
import { InfluenceSelection } from './InfluenceSelection';
import { DiscardPile } from './DiscardPile';
import { Crown, Coins } from 'lucide-react';

export const GameBoard = () => {
  const { players, currentPlayerIndex, winner, pendingAction, playerToLoseInfluence } = useGameStore();
  const currentPlayer = players[currentPlayerIndex];

  if (winner) {
    const winningPlayer = players.find(p => p.id === winner);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">🎉 Game Over! 🎉</h2>
          <p className="text-xl">{winningPlayer?.name} wins!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">Current Turn: {currentPlayer.name}</h2>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Coins className="w-5 h-5 text-yellow-600" />
          <span className="text-lg font-semibold">{currentPlayer.coins} coins</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Your Influences</h3>
          <PlayerHand player={currentPlayer} showCards={true} />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Available Actions</h3>
          <GameActions />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map((player, index) => (
          index !== currentPlayerIndex && (
            <div key={player.id} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-3">{player.name}</h3>
              <div className="flex items-center gap-2 mb-3">
                <Coins className="w-4 h-4 text-yellow-600" />
                <span>{player.coins} coins</span>
              </div>
              <PlayerHand player={player} showCards={false} />
            </div>
          )
        ))}
      </div>

      <DiscardPile />
      {pendingAction && <ActionResolution />}
      {playerToLoseInfluence && <InfluenceSelection />}
    </div>
  );
};