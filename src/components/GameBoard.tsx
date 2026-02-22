import { Tile as TileType } from '@/types/game';
import { Tile } from './Tile';
import { useEffect } from 'react';

interface GameBoardProps {
  board: TileType[][];
  selectedTile: { row: number; col: number } | null;
  onTileClick: (row: number, col: number) => void;
  isAnimating: boolean;
}

export function GameBoard({ board, selectedTile, onTileClick, isAnimating }: GameBoardProps) {
  const rows = board.length;
  const cols = board[0]?.length || 0;
  
  // Calculate tile size based on board size
  const containerSize = Math.min(480, window.innerWidth - 40);
  const tileSize = Math.floor((containerSize - (cols + 1) * 4) / cols);

  useEffect(() => {
    const handleResize = () => {
      // Force re-render on resize
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      className="relative bg-gradient-to-br from-blue-900/50 to-purple-900/50 p-2 rounded-xl backdrop-blur-sm border border-white/20"
      style={{ 
        width: tileSize * cols + (cols + 1) * 4,
      }}
    >
      <div 
        className="grid gap-1"
        style={{ 
          gridTemplateColumns: `repeat(${cols}, ${tileSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${tileSize}px)`,
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((tile, colIndex) => (
            <Tile
              key={tile.id}
              tile={tile}
              isSelected={selectedTile?.row === rowIndex && selectedTile?.col === colIndex}
              onClick={() => !isAnimating && onTileClick(rowIndex, colIndex)}
              size={tileSize}
            />
          ))
        )}
      </div>
      
      {isAnimating && (
        <div className="absolute inset-0 bg-black/20 rounded-xl pointer-events-none" />
      )}
    </div>
  );
}
