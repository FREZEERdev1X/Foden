import { Tile, TileType, Level, Difficulty } from '@/types/game';

export const TILE_TYPES: TileType[] = ['ice', 'snowflake', 'crystal', 'penguin', 'fish', 'star'];

export const TILE_COLORS: Record<TileType, string> = {
  ice: 'bg-cyan-400',
  snowflake: 'bg-blue-300',
  crystal: 'bg-purple-400',
  penguin: 'bg-slate-700',
  fish: 'bg-orange-400',
  star: 'bg-yellow-400',
};

export const TILE_EMOJIS: Record<TileType, string> = {
  ice: '🧊',
  snowflake: '❄️',
  crystal: '💎',
  penguin: '🐧',
  fish: '🐟',
  star: '⭐',
};

export const TILE_BORDER_COLORS: Record<TileType, string> = {
  ice: 'border-cyan-300',
  snowflake: 'border-blue-200',
  crystal: 'border-purple-300',
  penguin: 'border-slate-500',
  fish: 'border-orange-300',
  star: 'border-yellow-300',
};

let tileIdCounter = 0;

export function createTile(row: number, col: number, types: TileType[]): Tile {
  return {
    id: `tile-${tileIdCounter++}`,
    type: types[Math.floor(Math.random() * types.length)],
    row,
    col,
    isMatched: false,
    isFalling: false,
  };
}

export function generateBoard(level: Level): Tile[][] {
  const board: Tile[][] = [];
  for (let row = 0; row < level.boardSize; row++) {
    board[row] = [];
    for (let col = 0; col < level.boardSize; col++) {
      board[row][col] = createTile(row, col, level.tileTypes);
    }
  }
  
  // Remove initial matches
  let hasMatches = true;
  while (hasMatches) {
    const matches = findAllMatches(board);
    if (matches.length === 0) {
      hasMatches = false;
    } else {
      for (const match of matches) {
        board[match.row][match.col] = createTile(match.row, match.col, level.tileTypes);
      }
    }
  }
  
  return board;
}

export function getLevelConfig(levelNum: number, difficulty: Difficulty): Level {
  const difficultyMultiplier = {
    easy: 0.7,
    medium: 1,
    hard: 1.4,
  };

  const baseScore = 500 + (levelNum * 150);
  const baseMoves = 20 + Math.floor(levelNum / 10) * 2;
  const boardSize = levelNum <= 20 ? 6 : levelNum <= 50 ? 7 : 8;
  
  const tileCount = Math.min(3 + Math.floor(levelNum / 20), 6);
  const tileTypes = TILE_TYPES.slice(0, tileCount);
  
  const multiplier = difficultyMultiplier[difficulty];
  
  return {
    id: levelNum,
    targetScore: Math.floor(baseScore * multiplier),
    moves: Math.max(10, Math.floor(baseMoves / multiplier)),
    boardSize,
    tileTypes,
  };
}

export function findAllMatches(board: Tile[][]): { row: number; col: number }[] {
  const matches = new Set<string>();
  const rows = board.length;
  const cols = board[0]?.length || 0;

  // Check horizontal matches
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols - 2; col++) {
      const type = board[row][col]?.type;
      if (
        type &&
        board[row][col + 1]?.type === type &&
        board[row][col + 2]?.type === type
      ) {
        let i = col;
        while (i < cols && board[row][i]?.type === type) {
          matches.add(`${row}-${i}`);
          i++;
        }
      }
    }
  }

  // Check vertical matches
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows - 2; row++) {
      const type = board[row][col]?.type;
      if (
        type &&
        board[row + 1][col]?.type === type &&
        board[row + 2][col]?.type === type
      ) {
        let i = row;
        while (i < rows && board[i][col]?.type === type) {
          matches.add(`${i}-${col}`);
          i++;
        }
      }
    }
  }

  return Array.from(matches).map((key) => {
    const [row, col] = key.split('-').map(Number);
    return { row, col };
  });
}

export function calculateScore(matches: { row: number; col: number }[]): number {
  const baseScore = 10;
  const matchCount = matches.length;
  
  if (matchCount === 3) return baseScore * 3;
  if (matchCount === 4) return baseScore * 4 * 1.5;
  return baseScore * matchCount * 2;
}

export function canSwap(
  _board: Tile[][],
  row1: number,
  col1: number,
  row2: number,
  col2: number
): boolean {
  const rowDiff = Math.abs(row1 - row2);
  const colDiff = Math.abs(col1 - col2);
  
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

export function swapTiles(
  board: Tile[][],
  row1: number,
  col1: number,
  row2: number,
  col2: number
): Tile[][] {
  const newBoard = board.map((row) => [...row]);
  const temp = newBoard[row1][col1];
  newBoard[row1][col1] = newBoard[row2][col2];
  newBoard[row2][col2] = temp;
  
  newBoard[row1][col1] = { ...newBoard[row1][col1], row: row1, col: col1 };
  newBoard[row2][col2] = { ...newBoard[row2][col2], row: row2, col: col2 };
  
  return newBoard;
}

export function removeMatches(
  board: Tile[][],
  matches: { row: number; col: number }[]
): Tile[][] {
  const newBoard = board.map((row) => row.map((tile) => ({ ...tile })));
  
  for (const { row, col } of matches) {
    newBoard[row][col] = { ...newBoard[row][col], isMatched: true };
  }
  
  return newBoard;
}

export function dropTiles(board: Tile[][], tileTypes: TileType[]): { board: Tile[][]; dropped: boolean } {
  const rows = board.length;
  const cols = board[0]?.length || 0;
  const newBoard = board.map((row) => row.map((tile) => ({ ...tile })));
  let dropped = false;

  for (let col = 0; col < cols; col++) {
    let emptyRow = rows - 1;
    
    for (let row = rows - 1; row >= 0; row--) {
      if (!newBoard[row][col].isMatched) {
        if (row !== emptyRow) {
          newBoard[emptyRow][col] = { ...newBoard[row][col], row: emptyRow, isFalling: true };
          newBoard[row][col] = { ...newBoard[row][col], isMatched: true };
          dropped = true;
        }
        emptyRow--;
      }
    }
    
    for (let row = emptyRow; row >= 0; row--) {
      newBoard[row][col] = createTile(row, col, tileTypes);
      newBoard[row][col].isFalling = true;
      dropped = true;
    }
  }

  return { board: newBoard, dropped };
}

export function hasValidMoves(board: Tile[][]): boolean {
  const rows = board.length;
  const cols = board[0]?.length || 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Try swap right
      if (col < cols - 1) {
        const testBoard = swapTiles(board, row, col, row, col + 1);
        if (findAllMatches(testBoard).length > 0) return true;
      }
      // Try swap down
      if (row < rows - 1) {
        const testBoard = swapTiles(board, row, col, row + 1, col);
        if (findAllMatches(testBoard).length > 0) return true;
      }
    }
  }

  return false;
}

export function shuffleBoard(existingBoard: Tile[][], tileTypes: TileType[]): Tile[][] {
  const rows = existingBoard.length;
  const cols = existingBoard[0]?.length || 0;
  const newBoard: Tile[][] = [];

  for (let row = 0; row < rows; row++) {
    newBoard[row] = [];
    for (let col = 0; col < cols; col++) {
      newBoard[row][col] = createTile(row, col, tileTypes);
    }
  }

  return newBoard;
}
