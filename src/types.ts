
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type GameState = 'start' | 'playing' | 'suit_selection' | 'game_over';
export type Turn = 'player' | 'ai';

export interface GameStatus {
  winner: Turn | null;
  reason: string;
}
