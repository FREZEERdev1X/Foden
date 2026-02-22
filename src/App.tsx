import { useState, useCallback, useEffect } from 'react';
import { GameState, Difficulty } from '@/types/game';
import { 
  generateBoard, 
  getLevelConfig, 
  findAllMatches, 
  canSwap, 
  swapTiles, 
  removeMatches, 
  dropTiles, 
  calculateScore,
  hasValidMoves,
  shuffleBoard
} from '@/utils/gameUtils';
import { GameBoard } from '@/components/GameBoard';

const INITIAL_STATE: GameState = {
  board: [],
  score: 0,
  moves: 0,
  level: 1,
  difficulty: 'medium',
  isAnimating: false,
  selectedTile: null,
  gameStatus: 'menu',
};

export function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [highScores, setHighScores] = useState<Record<number, number>>({});

  const startGame = useCallback((level: number, difficulty: Difficulty) => {
    const levelConfig = getLevelConfig(level, difficulty);
    const board = generateBoard(levelConfig);
    
    setGameState({
      board,
      score: 0,
      moves: levelConfig.moves,
      level,
      difficulty,
      isAnimating: false,
      selectedTile: null,
      gameStatus: 'playing',
    });
  }, []);

  const handleTileClick = useCallback((row: number, col: number) => {
    if (gameState.isAnimating || gameState.gameStatus !== 'playing') return;

    const { selectedTile, board, moves } = gameState;

    if (!selectedTile) {
      setGameState(prev => ({ ...prev, selectedTile: { row, col } }));
      return;
    }

    if (selectedTile.row === row && selectedTile.col === col) {
      setGameState(prev => ({ ...prev, selectedTile: null }));
      return;
    }

    if (!canSwap(board, selectedTile.row, selectedTile.col, row, col)) {
      setGameState(prev => ({ ...prev, selectedTile: { row, col } }));
      return;
    }

    // Perform swap
    const newBoard = swapTiles(board, selectedTile.row, selectedTile.col, row, col);
    const matches = findAllMatches(newBoard);

    if (matches.length === 0) {
      // Invalid move - no matches
      setGameState(prev => ({ ...prev, selectedTile: { row, col } }));
      return;
    }

    // Valid move
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      moves: moves - 1,
      selectedTile: null,
      isAnimating: true,
    }));
  }, [gameState]);

  // Process matches and cascades
  useEffect(() => {
    if (!gameState.isAnimating || gameState.gameStatus !== 'playing') return;

    const processMatches = async () => {
      let currentBoard = gameState.board;
      let totalScore = gameState.score;
      let hasMoreMatches = true;

      while (hasMoreMatches) {
        const matches = findAllMatches(currentBoard);
        
        if (matches.length === 0) {
          hasMoreMatches = false;
          continue;
        }

        // Add score
        totalScore += calculateScore(matches);

        // Remove matches
        const boardWithoutMatches = removeMatches(currentBoard, matches);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Drop tiles
        const levelConfig = getLevelConfig(gameState.level, gameState.difficulty);
        const { board: droppedBoard } = dropTiles(boardWithoutMatches, levelConfig.tileTypes);
        currentBoard = droppedBoard;
        
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // Check for valid moves
      if (!hasValidMoves(currentBoard)) {
        const levelConfig = getLevelConfig(gameState.level, gameState.difficulty);
        currentBoard = shuffleBoard(currentBoard, levelConfig.tileTypes);
      }

      const levelConfig = getLevelConfig(gameState.level, gameState.difficulty);
      
      // Check win/lose conditions
      let newStatus: 'playing' | 'won' | 'lost' = 'playing';
      
      if (totalScore >= levelConfig.targetScore) {
        newStatus = 'won';
        // Unlock next level
        setUnlockedLevels(prev => {
          const nextLevel = gameState.level + 1;
          if (nextLevel <= 100 && !prev.includes(nextLevel)) {
            return [...prev, nextLevel];
          }
          return prev;
        });
        // Update high score
        setHighScores(prev => ({
          ...prev,
          [gameState.level]: Math.max(prev[gameState.level] || 0, totalScore),
        }));
      } else if (gameState.moves - 1 <= 0) {
        newStatus = 'lost';
      }

      setGameState(prev => ({
        ...prev,
        board: currentBoard,
        score: totalScore,
        isAnimating: false,
        gameStatus: newStatus,
      }));
    };

    processMatches();
  }, [gameState.isAnimating, gameState.level, gameState.difficulty, gameState.moves, gameState.board, gameState.score]);

  const goToMenu = () => {
    setGameState(prev => ({ ...prev, gameStatus: 'menu' }));
  };

  const goToLevelSelect = () => {
    setGameState(prev => ({ ...prev, gameStatus: 'levelSelect' }));
  };

  const nextLevel = () => {
    if (gameState.level < 100) {
      startGame(gameState.level + 1, gameState.difficulty);
    }
  };

  const retryLevel = () => {
    startGame(gameState.level, gameState.difficulty);
  };

  // Main Menu
  if (gameState.gameStatus === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2 drop-shadow-lg">
            FREEZER CRASH
          </h1>
          <p className="text-blue-200 text-lg">Match 3 or more to freeze the competition!</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-md border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">Select Difficulty</h2>
          
          <div className="grid grid-cols-3 gap-2 mb-6">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
              <button
                key={diff}
                onClick={() => setGameState(prev => ({ ...prev, difficulty: diff }))}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  gameState.difficulty === diff
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg scale-105'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() => startGame(1, gameState.difficulty)}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-xl rounded-xl hover:scale-105 transition-transform shadow-lg mb-3"
          >
            🎮 New Game
          </button>

          <button
            onClick={goToLevelSelect}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:scale-105 transition-transform shadow-lg"
          >
            📋 Select Level (100 Levels)
          </button>
        </div>

        <div className="mt-8 text-center text-blue-200/60 text-sm">
          <p>🧊 Match 3+ tiles of the same type</p>
          <p>❄️ Reach the target score before running out of moves</p>
        </div>
      </div>
    );
  }

  // Level Select
  if (gameState.gameStatus === 'levelSelect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white">Select Level</h2>
            <button
              onClick={goToMenu}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
            >
              ← Back
            </button>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {Array.from({ length: 100 }, (_, i) => i + 1).map((level) => {
              const isUnlocked = unlockedLevels.includes(level);
              const hasHighScore = highScores[level];
              
              return (
                <button
                  key={level}
                  onClick={() => isUnlocked && startGame(level, gameState.difficulty)}
                  disabled={!isUnlocked}
                  className={`aspect-square rounded-lg font-bold text-sm transition-all ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white hover:scale-110 shadow-lg'
                      : 'bg-white/10 text-white/30'
                  } ${hasHighScore ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  {isUnlocked ? level : '🔒'}
                </button>
              );
            })}
          </div>

          <div className="mt-4 text-center text-blue-200/60 text-sm">
            <p>Unlocked: {unlockedLevels.length} / 100 levels</p>
          </div>
        </div>
      </div>
    );
  }

  // Game Screen
  const levelConfig = getLevelConfig(gameState.level, gameState.difficulty);
  const progress = Math.min((gameState.score / levelConfig.targetScore) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col items-center p-4">
      {/* Header */}
      <div className="w-full max-w-lg mb-4">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={goToMenu}
            className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition text-sm"
          >
            ← Menu
          </button>
          <div className="text-white font-semibold">
            Level {gameState.level}
          </div>
          <div className="text-white/60 text-sm capitalize">
            {gameState.difficulty}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/10 rounded-full h-4 overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stats */}
        <div className="flex justify-between text-white">
          <div className="bg-white/10 px-4 py-2 rounded-lg">
            <span className="text-white/60 text-sm">Score</span>
            <div className="font-bold text-lg">{gameState.score}</div>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-lg">
            <span className="text-white/60 text-sm">Target</span>
            <div className="font-bold text-lg">{levelConfig.targetScore}</div>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-lg">
            <span className="text-white/60 text-sm">Moves</span>
            <div className="font-bold text-lg">{gameState.moves}</div>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <GameBoard
        board={gameState.board}
        selectedTile={gameState.selectedTile}
        onTileClick={handleTileClick}
        isAnimating={gameState.isAnimating}
      />

      {/* Win Modal */}
      {gameState.gameStatus === 'won' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 max-w-sm w-full text-center text-white shadow-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-2">Level Complete!</h2>
            <p className="text-green-100 mb-4">
              Score: {gameState.score} / {levelConfig.targetScore}
            </p>
            <div className="flex gap-2">
              <button
                onClick={retryLevel}
                className="flex-1 py-3 bg-white/20 rounded-xl font-semibold hover:bg-white/30 transition"
              >
                Retry
              </button>
              {gameState.level < 100 && (
                <button
                  onClick={nextLevel}
                  className="flex-1 py-3 bg-yellow-500 rounded-xl font-semibold hover:bg-yellow-400 transition text-yellow-900"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lose Modal */}
      {gameState.gameStatus === 'lost' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl p-6 max-w-sm w-full text-center text-white shadow-2xl">
            <div className="text-6xl mb-4">😢</div>
            <h2 className="text-3xl font-bold mb-2">Out of Moves!</h2>
            <p className="text-red-100 mb-4">
              Score: {gameState.score} / {levelConfig.targetScore}
            </p>
            <div className="flex gap-2">
              <button
                onClick={goToMenu}
                className="flex-1 py-3 bg-white/20 rounded-xl font-semibold hover:bg-white/30 transition"
              >
                Menu
              </button>
              <button
                onClick={retryLevel}
                className="flex-1 py-3 bg-white rounded-xl font-semibold hover:bg-white/90 transition text-red-600"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
