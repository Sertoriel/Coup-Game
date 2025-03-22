import { ReactNode } from 'react';

export type Character = 'Duke' | 'Assassin' | 'Contessa' | 'Captain' | 'Ambassador';

export type Action = 
  | 'income'
  | 'foreign_aid'
  | 'coup'
  | 'tax'
  | 'assassinate'
  | 'steal'
  | 'exchange';

export type ActionState = 
  | 'selecting_target'
  | 'waiting_for_blocks'
  | 'waiting_for_challenges'
  | 'resolving_block'
  | 'resolving_challenge'
  | 'selecting_influence_to_lose'
  | 'selecting_influence_to_exchange'
  | 'complete';

export interface Card {
  character: Character;
  revealed: boolean;
}

export interface Player {
  id: string;
  name: string;
  coins: number;
  influences: Card[];
}

export interface PendingAction {
  type: Action;
  sourcePlayerId: string;
  targetPlayerId?: string;
  character?: Character;
  blockingPlayerId?: string;
  blockingCharacter?: Character;
  challengingPlayerId?: string;
  state: ActionState;
  blockWindow?: number;
  challengeWindow?: number;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  deck: Character[];
  discardPile: Character[];
  gameStarted: boolean;
  winner: string | null;
  pendingAction: PendingAction | null;
  playerToLoseInfluence: string | null;
  exchangeCards: Character[];
  gameHistory: GameEvent[];
}

export interface CharacterAbility {
  character: Character;
  action: Action;
  blockableBy: Character[];
  description: ReactNode;
}

export type GameEvent = {
  type: 'action' | 'block' | 'challenge' | 'reveal' | 'exchange';
  playerId: string;
  targetPlayerId?: string;
  details: string;
  timestamp: number;
};

export type ChallengeResult = {
  challengerId: string;
  challengedId: string;
  successful: boolean;
  lostInfluence?: Character;
};

export type TargetedAction = Extract<Action, 'steal' | 'assassinate' | 'coup'>;

export const CHARACTER_ABILITIES: CharacterAbility[] = [
  {
    character: 'Duke',
    action: 'tax',
    blockableBy: [],
    description: 'Take 3 coins from the treasury'
  },
  {
    character: 'Assassin',
    action: 'assassinate',
    blockableBy: ['Contessa'],
    description: 'Pay 3 coins to assassinate another player'
  },
  {
    character: 'Captain',
    action: 'steal',
    blockableBy: ['Captain', 'Ambassador'],
    description: 'Steal 2 coins from another player'
  },
  {
    character: 'Ambassador',
    action: 'exchange',
    blockableBy: [],
    description: 'Exchange cards with the court deck'
  },
  {
    character: 'Contessa',
    action: 'block',
    blockableBy: [],
    description: 'Block assassination attempts'
  }
];

export const BLOCK_WINDOW_MS = 5000;
export const CHALLENGE_WINDOW_MS = 5000;

export const getInitialDeck = (playerCount: number): Character[] => {
  const charactersPerType = playerCount > 6 ? 5 : 3;
  const characters: Character[] = ['Duke', 'Assassin', 'Contessa', 'Captain', 'Ambassador'];
  return characters.flatMap(char => Array(charactersPerType).fill(char));
};

export type ExchangeStep = 'select' | 'confirm';

export interface InfluenceSelectionProps {
  isExchange?: boolean;
  maxSelection?: number;
}