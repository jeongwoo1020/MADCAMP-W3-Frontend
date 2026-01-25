import { useDrop } from 'react-dnd';
import { Player } from '@/app/types';
import { Coins, X } from 'lucide-react';
import { ItemTypes, DraggablePlayerProps } from './DraggablePlayer';

export interface BenchSlotProps {
    index: number;
    player: Player | null;
    onDrop: (player: Player, index: number) => void;
    onRemove: (index: number) => void;
    label: string;
}

export function BenchSlot({ index, player, onDrop, onRemove, label }: BenchSlotProps) {
    const [{ isOver }, drop] = useDrop({
        accept: ItemTypes.PLAYER,
        drop: (item: DraggablePlayerProps) => {
            if (item.player.position !== '투수') {
                onDrop(item.player, index);
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    return (
        <div
            ref={drop}
            className={`min-h-[50px] rounded border-2 border-dashed p-2 transition-colors text-sm bg-white/90 text-black ${isOver ? 'border-purple-500 bg-purple-50' : 'border-gray-400'
                }`}
        >
            <div className="text-xs text-gray-600 font-bold mb-1">{label}</div>
            {player ? (
                <div className="flex items-center justify-between gap-2">
                    <div className="text-xs flex-1">
                        <span className="font-semibold text-black">{player.name}</span>
                        <span className="text-gray-600 ml-1">({player.position})</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="flex items-center gap-1 text-amber-600 text-xs font-bold">
                            <Coins className="w-3 h-3" />
                            {player.salary}
                        </div>
                        <button
                            onClick={() => onRemove(index)}
                            className="p-0.5 hover:bg-red-100 rounded transition-colors"
                            title="제거"
                        >
                            <X className="w-3 h-3 text-red-600" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-xs text-gray-500 font-medium">
                    드래그
                </div>
            )}
        </div>
    );
}
