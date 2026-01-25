import { useDrop } from 'react-dnd';
import { Player } from '@/app/types';
import { Coins, X } from 'lucide-react';
import { ItemTypes, DraggablePlayerProps } from './DraggablePlayer';

export interface PitcherSlotProps {
    player: Player | null;
    onDrop: (player: Player) => void;
    onRemove: () => void;
    role: 'starter' | 'middle' | 'closer';
    label: string;
}

export function PitcherSlot({ player, onDrop, onRemove, role, label }: PitcherSlotProps) {
    const [{ isOver }, drop] = useDrop({
        accept: ItemTypes.PLAYER,
        drop: (item: DraggablePlayerProps) => {
            if (item.player.position === '투수' && item.player.pitcherRole === role) {
                onDrop(item.player);
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    return (
        <div
            ref={drop}
            className={`min-h-[50px] rounded border-2 border-dashed p-2 transition-colors text-sm bg-white/90 text-black ${isOver ? 'border-green-500 bg-green-50' : 'border-gray-400'
                }`}
        >
            <div className="text-xs font-bold text-gray-600 mb-1">{label}</div>
            {player ? (
                <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs flex-1 text-black">{player.name}</span>
                    <div className="flex items-center gap-1">
                        <div className="flex items-center gap-1 text-amber-600 text-xs font-bold">
                            <Coins className="w-3 h-3" />
                            {player.salary}
                        </div>
                        <button
                            onClick={onRemove}
                            className="p-0.5 hover:bg-red-100 rounded transition-colors"
                            title="제거"
                        >
                            <X className="w-3 h-3 text-red-600" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center text-xs text-gray-500 font-medium">
                    드래그
                </div>
            )}
        </div>
    );
}
