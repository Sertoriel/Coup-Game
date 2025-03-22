import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Shield, AlertTriangle, User, Crosshair } from 'lucide-react';
import { Character, Action } from '../types/game';

export const ActionResolution = () => {
  const { 
    pendingAction, 
    players,
    currentPlayerIndex,
    blockAction,
    challengeAction,
    completeAction
  } = useGameStore();
  
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const currentPlayer = players[currentPlayerIndex];
  
  useEffect(() => {
    if (!pendingAction) return;

    const timer = pendingAction.state === 'waiting_for_blocks' 
      ? pendingAction.blockWindow 
      : pendingAction.challengeWindow;

    setTimeLeft(timer || 0);

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
  }, [pendingAction]);

  if (!pendingAction) return null;

  const sourcePlayer = players.find(p => p.id === pendingAction.sourcePlayerId);
  const targetPlayer = pendingAction.targetPlayerId 
    ? players.find(p => p.id === pendingAction.targetPlayerId)
    : null;

  // Determina quem pode bloquear/desafiar
  const getAllowedParticipants = () => {
    if (!pendingAction) return { blockers: [], challengers: [] };

    let blockers: string[] = [];
    let challengers: string[] = [];

    switch (pendingAction.type) {
      case 'foreign_aid':
        blockers = players.map(p => p.id);
        challengers = [];
        break;
      case 'tax':
      case 'exchange':
        challengers = players.map(p => p.id);
        break;
      case 'steal':
      case 'assassinate':
        blockers = [pendingAction.targetPlayerId!];
        challengers = [pendingAction.targetPlayerId!];
        break;
      default:
        break;
    }

    return { blockers, challengers };
  };

  const { blockers, challengers } = getAllowedParticipants();
  const canBlock = blockers.includes(currentPlayer.id);
  const canChallenge = challengers.includes(currentPlayer.id);

  const renderActionDetails = () => {
    if (!sourcePlayer) return null;

    const actionMap: Record<Action, string> = {
      income: 'Taking income',
      foreign_aid: 'Taking foreign aid',
      coup: 'Performing coup',
      tax: 'Collecting tax as Duke',
      assassinate: 'Assassinating',
      steal: 'Stealing',
      exchange: 'Exchanging cards'
    };

    return (
      <div className="mb-4">
        <div className="flex items-center gap-3 bg-gray-100 p-3 rounded-lg">
          <User className="w-5 h-5" />
          <span className="font-semibold">{sourcePlayer.name}</span>
          <span className="text-gray-600">{actionMap[pendingAction.type]}</span>
          {targetPlayer && (
            <>
              <Crosshair className="w-5 h-5" />
              <span className="font-semibold">{targetPlayer.name}</span>
            </>
          )}
        </div>

        {pendingAction.blockingPlayerId && (
          <div className="mt-3 bg-blue-100 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>
                {players.find(p => p.id === pendingAction.blockingPlayerId)?.name}
                {' '}blocked as {pendingAction.blockingCharacter}
              </span>
            </div>
          </div>
        )}

        {pendingAction.challengingPlayerId && (
          <div className="mt-3 bg-red-100 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>
                {players.find(p => p.id === pendingAction.challengingPlayerId)?.name}
                {' '}challenged the action!
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Action Resolution</h3>
        
        {renderActionDetails()}

        <div className="space-y-4">
          {(pendingAction.state === 'waiting_for_blocks' && canBlock) && (
            <>
              <p className="text-gray-600">
                Time to block: {Math.ceil(timeLeft / 1000)}s
              </p>
              <div className="grid grid-cols-1 gap-3">
                {pendingAction.type === 'foreign_aid' && (
                  <button
                    onClick={() => blockAction(currentPlayer.id, 'Duke')}
                    className="flex items-center justify-center gap-2 p-3 bg-blue-100 rounded-lg hover:bg-blue-200"
                  >
                    <Shield className="w-5 h-5" />
                    Block as Duke
                  </button>
                )}

                {pendingAction.type === 'steal' && (
                  <>
                    <button
                      onClick={() => blockAction(currentPlayer.id, 'Captain')}
                      className="flex items-center justify-center gap-2 p-3 bg-blue-100 rounded-lg hover:bg-blue-200"
                    >
                      <Shield className="w-5 h-5" />
                      Block as Captain
                    </button>
                    <button
                      onClick={() => blockAction(currentPlayer.id, 'Ambassador')}
                      className="flex items-center justify-center gap-2 p-3 bg-green-100 rounded-lg hover:bg-green-200"
                    >
                      <Shield className="w-5 h-5" />
                      Block as Ambassador
                    </button>
                  </>
                )}

                {pendingAction.type === 'assassinate' && (
                  <button
                    onClick={() => blockAction(currentPlayer.id, 'Contessa')}
                    className="flex items-center justify-center gap-2 p-3 bg-purple-100 rounded-lg hover:bg-purple-200"
                  >
                    <Shield className="w-5 h-5" />
                    Block as Contessa
                  </button>
                )}
              </div>
            </>
          )}

          {(pendingAction.state === 'waiting_for_challenges' && canChallenge) && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Time to challenge: {Math.ceil(timeLeft / 1000)}s
              </p>
              <button
                onClick={() => challengeAction(currentPlayer.id)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-red-100 rounded-lg hover:bg-red-200"
              >
                <AlertTriangle className="w-5 h-5" />
                Challenge as {currentPlayer.name}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};