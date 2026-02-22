import { Tile as TileType } from '@/types/game';
import { TILE_EMOJIS, TILE_COLORS, TILE_BORDER_COLORS } from '@/utils/gameUtils';
import { cn } from '@/utils/cn';

interface TileProps {
  tile: TileType;
  isSelected: boolean;
  onClick: () => void;
  size: number;
}

export function Tile({ tile, isSelected, onClick, size }: TileProps) {
  if (tile.isMatched) {
    return (
      <div
        className="opacity-0 transition-opacity duration-200"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-lg border-2 transition-all duration-150',
        'hover:scale-105 active:scale-95',
        'shadow-md hover:shadow-lg',
        TILE_COLORS[tile.type],
        TILE_BORDER_COLORS[tile.type],
        isSelected && 'ring-4 ring-yellow-400 ring-opacity-100 scale-110',
        tile.isFalling && 'animate-pulse'
      )}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      <span className="drop-shadow-md">{TILE_EMOJIS[tile.type]}</span>
    </button>
  );
}
