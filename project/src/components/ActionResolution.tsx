import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Shield, AlertTriangle } from 'lucide-react';

export const ActionResolution = () => {
  const { pendingAction, players, blockAction, challengeAction, completeAction, selectTarget } = useGameStore();
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!pendingAction || !pendingAction.blockWindow) return;

    if (pendingAction.state === 'waiting_for_blocks' || pendingAction.state === 'waiting_for_challenges') {
      const timer = pendingAction.state === 'waiting_for_blocks' 
        ? pendingAction.blockWindow 
        : pendingAction.challengeWindow;
      
      setTimeLeft(timer);

      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1000) {
            clearInterval(interval);
            completeAction();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [pendingAction]);

  if (!pendingAction) return null;

  const sourcePlayer = players.find(p => p.id === pendingAction.sourcePlayerId);
  const targetPlayer = pendingAction.targetPlayerId 
    ? players.find(p => p.id === pendingAction.targetPlayerId)
    : null;

  const otherPlayers = players.filter(p => p.id !== pendingAction.sourcePlayerId);

  const renderActionDescription = () => {
    if (!sourcePlayer) return null;

    switch (pendingAction.type) {
      case 'tax':
        return `${sourcePlayer.name} is taking tax as Duke`;
      case 'steal':
        return targetPlayer 
          ? `${sourcePlayer.name} is stealing from ${targetPlayer.name} as Captain`
          : `${sourcePlayer.name} is attempting to steal as Captain`;
      case 'assassinate':
        return targetPlayer
          ? `${sourcePlayer.name} is assassinating ${targetPlayer.name}`
          : `${sourcePlayer.name} is attempting to assassinate`;
      default:
        return `${sourcePlayer.name} is performing ${pendingAction.type}`;
    }
  };

  if (pendingAction.state === 'selecting_target') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <h3 className="text-xl font-bold mb-4">Select a target</h3>
          <div className="space-y-2">
            {otherPlayers.map(player => (
              <button
                key={player.id}
                onClick={() => selectTarget(player.id)}
                className="w-full p-3 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-between"
              >
                <span>{player.name}</span>
                <span>{player.coins} coins</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">{renderActionDescription()}</h3>
        
        {pendingAction.state === 'waiting_for_blocks' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Time to block: {Math.ceil(timeLeft / 1000)}s
            </p>
            <div className="grid grid-cols-1 gap-3">
              {pendingAction.type === 'foreign_aid' && (
                <button
                  onClick={() => blockAction(sourcePlayer.id, 'Duke')}
                  className="flex items-center justify-center gap-2 p-3 bg-blue-100 rounded-lg hover:bg-blue-200"
                >
                  <Shield className="w-5 h-5" />
                  Block as Duke
                </button>
              )}
              {pendingAction.type === 'steal' && (
                <>
                  <button
                    onClick={() => blockAction(sourcePlayer.id, 'Captain')}
                    className="flex items-center justify-center gap-2 p-3 bg-blue-100 rounded-lg hover:bg-blue-200"
                  >
                    <Shield className="w-5 h-5" />
                    Block as Captain
                  </button>
                  <button
                    onClick={() => blockAction(sourcePlayer.id, 'Ambassador')}
                    className="flex items-center justify-center gap-2 p-3 bg-green-100 rounded-lg hover:bg-green-200"
                  >
                    <Shield className="w-5 h-5" />
                    Block as Ambassador
                  </button>
                </>
              )}
              {pendingAction.type === 'assassinate' && (
                <button
                  onClick={() => blockAction(sourcePlayer.id, 'Contessa')}
                  className="flex items-center justify-center gap-2 p-3 bg-purple-100 rounded-lg hover:bg-purple-200"
                >
                  <Shield className="w-5 h-5" />
                  Block as Contessa
                </button>
              )}
            </div>
          </div>
        )}

        {pendingAction.state === 'waiting_for_challenges' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Time to challenge: {Math.ceil(timeLeft / 1000)}s
            </p>
            <button
              onClick={() => challengeAction(sourcePlayer.id)}
              className="w-full flex items-center justify-center gap-2 p-3 bg-red-100 rounded-lg hover:bg-red-200"
            >
              <AlertTriangle className="w-5 h-5" />
              Challenge
            </button>
          </div>
        )}
      </div>
    </div>
  );
};