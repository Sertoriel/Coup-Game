import { create } from 'zustand';
import {
  Character,
  GameState,
  Player,
  Action,
  PendingAction,
  CHARACTER_ABILITIES,
  BLOCK_WINDOW_MS,
  CHALLENGE_WINDOW_MS,
  getInitialDeck,
  GameEvent,
  ChallengeResult
} from '../types/game';

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
  completeExchange: (selectedIndices: number[]) => void;
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
  exchangeCards: [],
  gameHistory: [],

  addPlayer: (name) => {
    if (get().players.length >= 6) return;

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
    let newDeck = [...deck];

    if (newDeck.length === 0 && discardPile.length > 0) {
      newDeck = shuffleArray(discardPile);
      set({ deck: newDeck, discardPile: [] });
    }

    if (newDeck.length === 0) throw new Error('No cards available');

    const card = newDeck.pop()!;
    set({ deck: newDeck });
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

    if (currentPlayer.influences.every(c => c.revealed)) return;

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

    if (action === 'exchange') {
      const newCards = [get().drawCard(), get().drawCard()];
      set({
        exchangeCards: newCards,
        pendingAction: {
          ...pendingAction,
          state: 'selecting_influence_to_exchange'
        }
      });
      return;
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
    const { pendingAction, players } = get();
    if (!pendingAction) return;

    let allowedBlockers: string[] = [];
    switch (pendingAction.type) {
      case 'foreign_aid':
        allowedBlockers = players.map(p => p.id);
        break;
      case 'steal':
      case 'assassinate':
        allowedBlockers = [pendingAction.targetPlayerId!];
        break;
      default:
        allowedBlockers = [];
    }

    if (!allowedBlockers.includes(playerId)) {
      console.error('Block not allowed for this player');
      return;
    }

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

    let allowedChallengers: string[] = [];
    switch (pendingAction.type) {
      case 'tax':
      case 'exchange':
        allowedChallengers = players.map(p => p.id);
        break;
      case 'steal':
      case 'assassinate':
        allowedChallengers = [pendingAction.targetPlayerId!];
        break;
      default:
        allowedChallengers = [];
    }

    if (!allowedChallengers.includes(challengingPlayerId)) {
      console.error('Challenge not allowed for this player');
      return;
    }

    const challengedPlayerId = pendingAction.blockingPlayerId || pendingAction.sourcePlayerId;
    const challengedPlayer = players.find(p => p.id === challengedPlayerId);
    const claimedCharacter = pendingAction.blockingCharacter || pendingAction.character;

    if (!challengedPlayer || !claimedCharacter) return;

    const hasClaimedCard = hasCharacter(challengedPlayer, claimedCharacter);
    const event: GameEvent = {
      type: 'challenge',
      playerId: challengingPlayerId,
      targetPlayerId: challengedPlayerId,
      details: `Challenged ${claimedCharacter} claim`,
      timestamp: Date.now()
    };

    if (hasClaimedCard) {
      set(state => ({
        playerToLoseInfluence: challengingPlayerId,
        gameHistory: [...state.gameHistory, event]
      }));

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
      set(state => ({
        playerToLoseInfluence: challengedPlayerId,
        gameHistory: [...state.gameHistory, event]
      }));
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

    const activeInfluences = updatedPlayers.find(p => p.id === playerId)
      ?.influences.filter(c => !c.revealed).length || 0;

    const revealedCard = player.influences[cardIndex].character;
    const event: GameEvent = {
      type: 'reveal',
      playerId,
      details: `Revealed ${revealedCard}`,
      timestamp: Date.now()
    };

    set(state => ({
      players: updatedPlayers,
      playerToLoseInfluence: null,
      discardPile: [...state.discardPile, revealedCard],
      gameHistory: [...state.gameHistory, event]
    }));

    if (activeInfluences === 0) {
      set(state => ({
        players: state.players.filter(p => p.id !== playerId)
      }));

      if (get().players.length === 1) {
        set({ winner: get().players[0].id });
        return;
      }
    }

    if (pendingAction?.blockingPlayerId && hasCharacter(player, pendingAction.blockingCharacter!)) {
      set({ pendingAction: null });
      get().nextTurn();
    } else {
      get().completeAction();
    }
  },

  completeExchange: (selectedIndices: number[]) => {
    const { players, currentPlayerIndex, exchangeCards } = get();
    const currentPlayer = players[currentPlayerIndex];

    const allCards = [...currentPlayer.influences.map(c => c.character), ...exchangeCards];
    const selectedCards = selectedIndices.map(i => allCards[i]);
    const returnedCards = allCards.filter((_, i) => !selectedIndices.includes(i));

    const updatedPlayers = players.map(p =>
      p.id === currentPlayer.id ? {
        ...p,
        influences: selectedCards.map(c => ({ character: c, revealed: false }))
      } : p
    );

    const event: GameEvent = {
      type: 'exchange',
      playerId: currentPlayer.id,
      details: `Exchanged ${returnedCards.length} cards`,
      timestamp: Date.now()
    };

    set({
      players: updatedPlayers,
      deck: [...get().deck, ...returnedCards],
      exchangeCards: [],
      gameHistory: [...get().gameHistory, event]
    });
    get().nextTurn();
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

    const event: GameEvent = {
      type: 'action',
      playerId: sourcePlayer.id,
      targetPlayerId: targetPlayer?.id,
      details: `Performed ${pendingAction.type}`,
      timestamp: Date.now()
    };

    switch (pendingAction.type) {
      case 'income':
        updatedPlayers[sourceIndex].coins += 1;
        break;
      case 'foreign_aid':
        updatedPlayers[sourceIndex].coins += 2;
        break;
      case 'tax':
        updatedPlayers[sourceIndex].coins += 3;
        break;
      case 'steal':
        if (targetPlayer && targetIndex !== -1) {
          const stealAmount = Math.min(2, targetPlayer.coins);
          updatedPlayers[sourceIndex].coins += stealAmount;
          updatedPlayers[targetIndex].coins -= stealAmount;
        }
        break;
      case 'assassinate':
        if (targetPlayer && targetIndex !== -1) {
          updatedPlayers[sourceIndex].coins -= 3;
          set({ playerToLoseInfluence: targetPlayer.id });
        }
        break;
      case 'coup':
        if (targetPlayer && targetIndex !== -1) {
          updatedPlayers[sourceIndex].coins -= 7;
          set({ playerToLoseInfluence: targetPlayer.id });
        }
        break;
    }

    set({
      players: updatedPlayers,
      pendingAction: null,
      gameHistory: [...get().gameHistory, event]
    });

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
        players[nextIndex].influences.every(c => c.revealed)
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
    const result: ChallengeResult = {
      challengerId: pendingAction.challengingPlayerId!,
      challengedId: challengedPlayerId,
      successful,
      lostInfluence: successful ? undefined : pendingAction.character
    };

    const event: GameEvent = {
      type: 'challenge',
      playerId: result.challengerId,
      targetPlayerId: result.challengedId,
      details: `Challenge ${result.successful ? 'successful' : 'failed'}`,
      timestamp: Date.now()
    };

    set(state => ({
      gameHistory: [...state.gameHistory, event]
    }));

    if (successful) {
      set({ playerToLoseInfluence: challengedPlayerId });
    } else {
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
      playerToLoseInfluence: null,
      exchangeCards: [],
      gameHistory: []
    });
  }
}));