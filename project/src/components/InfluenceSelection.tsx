import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Character, Card } from '../types/game';
import { Shield } from 'lucide-react';

export const InfluenceSelection = () => {
  const {
    players,
    playerToLoseInfluence,
    exchangeCards,
    loseInfluence,
    completeExchange
  } = useGameStore();

  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const currentPlayer = useGameStore(state =>
    state.players[state.currentPlayerIndex]
  );

  // Modo de troca do Embaixador
  if (exchangeCards.length > 0) {
    const allCards = [
      ...currentPlayer.influences.map(c => c.character),
      ...exchangeCards
    ];

    const maxSelection = currentPlayer.influences.filter(c => !c.revealed).length === 1 ? 1 : 2;

    const handleSelect = (index: number) => {
      const newSelection = new Set(selectedIndices);
      if (newSelection.has(index)) {
        newSelection.delete(index);
      } else {
        if (newSelection.size < maxSelection) {
          newSelection.add(index);
        }
      }
      setSelectedIndices(newSelection);
    };

    return (
      <div className= "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" >
      <div className="bg-white rounded-xl p-6 max-w-md w-full" >
        <h3 className="text-xl font-bold mb-4" > Select cards to keep({ maxSelection }) </h3>
          < div className = "grid grid-cols-2 gap-4" >
          {
            allCards.map((character, index) => (
              <button
                key= { index }
                onClick = {() => handleSelect(index)}
className = {`p-4 rounded-lg flex flex-col items-center transition-all ${selectedIndices.has(index)
    ? 'bg-blue-200 ring-2 ring-blue-500'
    : 'bg-gray-100 hover:bg-gray-200'
  }`}
              >
  <div className="w-16 h-24 bg-indigo-500 rounded-lg flex items-center justify-center mb-2" >
    {
      index<currentPlayer.influences.length ? (
        <span className= "text-white font-medium" > { character } </span>
                  ) : (
          <Shield className="w-8 h-8 text-white opacity-75" />
                  )}
</div>
  < span className = "text-sm" >
  {
    index<currentPlayer.influences.length
      ? 'Your current card'
      : 'New card'
  }
    </span>
    </button>
            ))}
</div>
  < button
onClick = {() => {
  completeExchange(Array.from(selectedIndices));
  setSelectedIndices(new Set());
}}
disabled = { selectedIndices.size !== maxSelection }
className = "mt-4 w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
  >
  Confirm Selection
    </button>
    </div>
    </div>
    );
  }

// Modo normal de perder influência
if (!playerToLoseInfluence) return null;

const player = players.find(p => p.id === playerToLoseInfluence);
if (!player) return null;

const availableCards = player.influences.filter(card => !card.revealed);

return (
  <div className= "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" >
  <div className="bg-white rounded-xl p-6 max-w-md w-full" >
    <h3 className="text-xl font-bold mb-4" >
      { player.name }, select an influence to lose
        </h3>
        < div className = "grid grid-cols-2 gap-4" >
        {
          availableCards.map((card, index) => (
            <button
              key= { index }
              onClick = {() => loseInfluence(player.id, index)}
className = "p-4 bg-red-100 rounded-lg hover:bg-red-200 flex flex-col items-center"
  >
  <div className="w-16 h-24 bg-red-500 rounded-lg flex items-center justify-center mb-2" >
    <span className="text-white font-medium" > { card.character } </span>
      </div>
      < span className = "text-sm text-red-700" > Reveal this card </span>
        </button>
          ))}
</div>
  </div>
  </div>
  );
};