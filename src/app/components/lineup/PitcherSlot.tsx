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
            className={`min-h-[100px] rounded-lg border-2 border-dashed p-3 transition-colors text-base bg-white/90 text-black shadow-sm ${isOver ? 'border-green-500 bg-green-50' : 'border-gray-400'
                }`}
        >
            <div className="text-sm font-bold text-gray-700 mb-2">{label}</div>
            {player ? (
                <div className="flex items-center gap-3">
                    {/* Image */}
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                        {player.image_url ? (
                            <img
                                src={player.image_url}
                                alt={player.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                                    const icon = document.createElement('span');
                                    icon.textContent = '⚾';
                                    icon.style.fontSize = '24px';
                                    e.currentTarget.parentElement?.appendChild(icon);
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">⚾</div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="font-bold text-lg truncate text-black">{player.name}</div>
                            <button
                                onClick={onRemove}
                                className="p-1 hover:bg-red-100 rounded-full transition-colors flex-shrink-0"
                                title="제거"
                            >
                                <X className="w-4 h-4 text-red-600" />
                            </button>
                        </div>
                        <div className="flex items-center gap-1 text-amber-600 text-sm font-bold">
                            <Coins className="w-4 h-4" />
                            {player.salary}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-[60px] text-base text-gray-500 font-medium">
                    드래그
                </div>
            )}
        </div>
    );
}
