import { create } from 'zustand';
import { Character, GameState, Player, Action, PendingAction, CHARACTER_ABILITIES, BLOCK_WINDOW_MS, CHALLENGE_WINDOW_MS, getInitialDeck } from '../types/game';

const INITIAL_COINS = 2;

interface GameStore extends GameState {
  addPlayer: (name: string) => void;
  startGame: () => void;
  drawInitialCards: () => void;
  nextTurn: () => void;
  resetGame: () => void;
  initiateAction: (action: Action, character?: Character) => void;
  selectTarget: (targetPlayerId: string) => void;
  blockAction: (playerId: string, character: Character) => void;
  challengeAction: (challengingPlayerId: string) => void;
  resolveChallenge: (successful: boolean) => void;
  loseInfluence: (playerId: string, cardIndex: number) => void;
  completeAction: () => void;
  drawCard: () => Character;
}

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const hasCharacter = (player: Player, character: Character): boolean => {
  return player.influences.some(card => !card.revealed && card.character === character);
};

export const useGameStore = create<GameStore>((set, get) => ({
  players: [],
  currentPlayerIndex: 0,
  deck: [],
  discardPile: [],
  gameStarted: false,
  winner: null,
  pendingAction: null,
  playerToLoseInfluence: null,

  addPlayer: (name) => {
    if (get().players.length >= 10) return;
    
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      coins: INITIAL_COINS,
      influences: []
    };

    set((state) => ({
      players: [...state.players, newPlayer]
    }));
  },

  startGame: () => {
    const { players } = get();
    if (players.length < 2) return;
    
    const deck = shuffleArray(getInitialDeck(players.length));
    set({ gameStarted: true, deck });
    get().drawInitialCards();
  },

  drawCard: () => {
    const { deck, discardPile } = get();
    if (deck.length === 0) {
      // Shuffle discard pile back into deck
      const newDeck = shuffleArray([...discardPile]);
      set({ deck: newDeck, discardPile: [] });
    }
    const card = get().deck.pop()!;
    set(state => ({ deck: state.deck }));
    return card;
  },

  drawInitialCards: () => {
    const { players } = get();
    const updatedPlayers = players.map(player => ({
      ...player,
      influences: [
        { character: get().drawCard(), revealed: false },
        { character: get().drawCard(), revealed: false }
      ]
    }));

    set({ players: updatedPlayers });
  },

  initiateAction: (action: Action, character?: Character) => {
    const { players, currentPlayerIndex } = get();
    const currentPlayer = players[currentPlayerIndex];
    
    const ability = CHARACTER_ABILITIES.find(a => a.action === action);
    const requiresCharacter = Boolean(ability);
    
    if (requiresCharacter && !character) {
      console.error('Character required for this action');
      return;
    }

    const pendingAction: PendingAction = {
      type: action,
      sourcePlayerId: currentPlayer.id,
      character,
      state: action === 'income' ? 'complete' : 'waiting_for_challenges',
      blockWindow: BLOCK_WINDOW_MS,
      challengeWindow: CHALLENGE_WINDOW_MS
    };

    if (['assassinate', 'coup', 'steal'].includes(action)) {
      pendingAction.state = 'selecting_target';
    }

    set({ pendingAction });

    if (pendingAction.state === 'complete') {
      get().completeAction();
    }
  },

  selectTarget: (targetPlayerId: string) => {
    set(state => ({
      pendingAction: state.pendingAction ? {
        ...state.pendingAction,
        targetPlayerId,
        state: 'waiting_for_blocks'
      } : null
    }));
  },

  blockAction: (playerId: string, character: Character) => {
    set(state => ({
      pendingAction: state.pendingAction ? {
        ...state.pendingAction,
        blockingPlayerId: playerId,
        blockingCharacter: character,
        state: 'waiting_for_challenges'
      } : null
    }));
  },

  challengeAction: (challengingPlayerId: string) => {
    const { pendingAction, players } = get();
    if (!pendingAction) return;

    const challengedPlayerId = pendingAction.blockingPlayerId || pendingAction.sourcePlayerId;
    const challengedPlayer = players.find(p => p.id === challengedPlayerId);
    const claimedCharacter = pendingAction.blockingCharacter || pendingAction.character;

    if (!challengedPlayer || !claimedCharacter) return;

    const hasClaimedCard = hasCharacter(challengedPlayer, claimedCharacter);

    if (hasClaimedCard) {
      // Challenger loses influence
      set({ playerToLoseInfluence: challengingPlayerId });
      
      // Return claimed card to deck and draw new one
      const playerIndex = players.findIndex(p => p.id === challengedPlayerId);
      const cardIndex = challengedPlayer.influences.findIndex(
        card => !card.revealed && card.character === claimedCharacter
      );

      if (cardIndex !== -1) {
        const updatedPlayers = [...players];
        const oldCard = updatedPlayers[playerIndex].influences[cardIndex].character;
        updatedPlayers[playerIndex].influences[cardIndex].character = get().drawCard();
        set(state => ({
          players: updatedPlayers,
          discardPile: [...state.discardPile, oldCard]
        }));
      }
    } else {
      // Challenged player loses influence
      set({ playerToLoseInfluence: challengedPlayerId });
    }
  },

  loseInfluence: (playerId: string, cardIndex: number) => {
    const { players, pendingAction } = get();
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const updatedPlayers = players.map(p =>
      p.id === playerId
        ? {
            ...p,
            influences: p.influences.map((card, index) =>
              index === cardIndex
                ? { ...card, revealed: true }
                : card
            )
          }
        : p
    );

    const revealedCard = player.influences[cardIndex].character;
    set(state => ({
      players: updatedPlayers,
      playerToLoseInfluence: null,
      discardPile: [...state.discardPile, revealedCard]
    }));

    // Check for game over
    const activePlayers = updatedPlayers.filter(player =>
      player.influences.some(card => !card.revealed)
    );

    if (activePlayers.length === 1) {
      set({ winner: activePlayers[0].id });
    } else if (pendingAction?.blockingPlayerId && hasCharacter(player, pendingAction.blockingCharacter!)) {
      // If it was a challenge against a block and the blocker was right
      set({ pendingAction: null });
      get().nextTurn();
    } else {
      get().completeAction();
    }
  },

  completeAction: () => {
    const { pendingAction, players } = get();
    if (!pendingAction) return;

    const sourcePlayer = players.find(p => p.id === pendingAction.sourcePlayerId);
    const targetPlayer = pendingAction.targetPlayerId
      ? players.find(p => p.id === pendingAction.targetPlayerId)
      : null;

    if (!sourcePlayer) return;

    const updatedPlayers = [...players];
    const sourceIndex = players.findIndex(p => p.id === sourcePlayer.id);
    const targetIndex = targetPlayer
      ? players.findIndex(p => p.id === targetPlayer.id)
      : -1;

    switch (pendingAction.type) {
      case 'income':
        updatedPlayers[sourceIndex] = {
          ...sourcePlayer,
          coins: sourcePlayer.coins + 1
        };
        break;

      case 'foreign_aid':
        updatedPlayers[sourceIndex] = {
          ...sourcePlayer,
          coins: sourcePlayer.coins + 2
        };
        break;

      case 'tax':
        updatedPlayers[sourceIndex] = {
          ...sourcePlayer,
          coins: sourcePlayer.coins + 3
        };
        break;

      case 'steal':
        if (targetPlayer && targetIndex !== -1) {
          const stealAmount = Math.min(2, targetPlayer.coins);
          updatedPlayers[sourceIndex] = {
            ...sourcePlayer,
            coins: sourcePlayer.coins + stealAmount
          };
          updatedPlayers[targetIndex] = {
            ...targetPlayer,
            coins: targetPlayer.coins - stealAmount
          };
        }
        break;

      case 'assassinate':
        if (targetPlayer && targetIndex !== -1) {
          updatedPlayers[sourceIndex] = {
            ...sourcePlayer,
            coins: sourcePlayer.coins - 3
          };
          set({ playerToLoseInfluence: targetPlayer.id });
        }
        break;

      case 'coup':
        if (targetPlayer && targetIndex !== -1) {
          updatedPlayers[sourceIndex] = {
            ...sourcePlayer,
            coins: sourcePlayer.coins - 7
          };
          set({ playerToLoseInfluence: targetPlayer.id });
        }
        break;
    }

    set({ players: updatedPlayers, pendingAction: null });
    if (!get().playerToLoseInfluence) {
      get().nextTurn();
    }
  },

  nextTurn: () => {
    const { players } = get();
    set((state) => {
      let nextIndex = (state.currentPlayerIndex + 1) % players.length;
      while (
        nextIndex !== state.currentPlayerIndex &&
        !players[nextIndex].influences.some(card => !card.revealed)
      ) {
        nextIndex = (nextIndex + 1) % players.length;
      }
      return { currentPlayerIndex: nextIndex };
    });
  },

  resolveChallenge: (successful: boolean) => {
    const { pendingAction, players } = get();
    if (!pendingAction) return;

    const challengedPlayerId = pendingAction.blockingPlayerId || pendingAction.sourcePlayerId;
    const challengedPlayer = players.find(p => p.id === challengedPlayerId);

    if (!challengedPlayer) return;

    if (successful) {
      // Challenger was correct, challenged player loses influence
      set({ playerToLoseInfluence: challengedPlayerId });
    } else {
      // Challenger was wrong, challenger loses influence
      set({ playerToLoseInfluence: pendingAction.sourcePlayerId });
    }
  },

  resetGame: () => {
    set({
      players: [],
      currentPlayerIndex: 0,
      deck: [],
      discardPile: [],
      gameStarted: false,
      winner: null,
      pendingAction: null,
      playerToLoseInfluence: null
    });
  }
}));
