import React from 'react';
import { PlayerSetup } from './components/PlayerSetup';
import { GameBoard } from './components/GameBoard';
import { useGameStore } from './store/gameStore';

function App() {
  const { gameStarted } = useGameStore();

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {!gameStarted ? (
        <PlayerSetup />
      ) : (
        <GameBoard />
      )}
    </div>
  );
}

export default App;