import { useDrop } from 'react-dnd';
import { Player } from '@/app/types';
import { Coins, X } from 'lucide-react';
import { DraggablePlayerProps, ItemTypes } from './DraggablePlayer';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/app/components/ui/select';

// 수비 포지션 목록 (자주 쓰이므로 constants로 빼는 것이 좋으나 일단 여기에 둠)
export const FIELD_POSITIONS = [
    { value: '1B', label: '1루수' },
    { value: '2B', label: '2루수' },
    { value: '3B', label: '3루수' },
    { value: 'SS', label: '유격수' },
    { value: 'LF', label: '좌익수' },
    { value: 'CF', label: '중견수' },
    { value: 'RF', label: '우익수' },
    { value: 'C', label: '포수' },
    { value: 'P', label: '투수' },
    { value: 'DH', label: '지명타자' },
];

export interface LineupSlotProps {
    index: number;
    player: Player | null;
    fieldPosition: string | null;
    onDrop: (player: Player, index: number) => void;
    onRemove: (index: number) => void;
    onPositionChange: (index: number, position: string) => void;
    label: string;
    usedPositions: (string | null)[];
}

export function LineupSlot({
    index,
    player,
    fieldPosition,
    onDrop,
    onRemove,
    onPositionChange,
    label,
    usedPositions
}: LineupSlotProps) {
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

    const availablePositions = FIELD_POSITIONS.filter((pos) => {
        return !usedPositions.some((used, idx) => used === pos.value && idx !== index);
    });

    return (
        <div
            ref={drop}
            className={`min-h-[100px] rounded-lg border-2 border-dashed p-3 transition-colors text-base bg-white/90 text-black shadow-sm ${isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-400'
                }`}
        >
            <div className="text-sm text-gray-700 font-bold mb-2">{label}</div>
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

                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold text-lg truncate text-black">{player.name}</span>
                                <span className="text-gray-600 text-sm whitespace-nowrap">({player.position})</span>
                            </div>
                            <button
                                onClick={() => onRemove(index)}
                                className="p-1 hover:bg-red-100 rounded-full transition-colors flex-shrink-0"
                                title="제거"
                            >
                                <X className="w-4 h-4 text-red-600" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <Select value={fieldPosition || ''} onValueChange={(val) => onPositionChange(index, val)}>
                                <SelectTrigger className="h-8 text-sm w-[130px] border-gray-300 text-black bg-white">
                                    <SelectValue placeholder="포지션 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availablePositions.map((pos) => (
                                        <SelectItem key={pos.value} value={pos.value} className="text-sm">
                                            {pos.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1 text-amber-600 font-bold text-sm">
                                <Coins className="w-4 h-4" />
                                {player.salary}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-[60px] text-base text-gray-500 font-medium">
                    드래그하여 선수 추가
                </div>
            )}
        </div>
    );
}
