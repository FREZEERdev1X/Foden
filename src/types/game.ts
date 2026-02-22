export type TileType = 'ice' | 'snowflake' | 'crystal' | 'penguin' | 'fish' | 'star';

export interface Tile {
  id: string;
  type: TileType;
  row: number;
  col: number;
  isMatched: boolean;
  isFalling: boolean;
}

export interface Level {
  id: number;
  targetScore: number;
  moves: number;
  boardSize: number;
  tileTypes: TileType[];
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  board: Tile[][];
  score: number;
  moves: number;
  level: number;
  difficulty: Difficulty;
  isAnimating: boolean;
  selectedTile: { row: number; col: number } | null;
  gameStatus: 'playing' | 'won' | 'lost' | 'menu' | 'levelSelect';
}
