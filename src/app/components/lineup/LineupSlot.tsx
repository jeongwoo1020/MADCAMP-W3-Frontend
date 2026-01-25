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
            className={`min-h-[70px] rounded border-2 border-dashed p-2 transition-colors text-sm bg-white/90 text-black ${isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-400'
                }`}
        >
            <div className="text-xs text-gray-600 font-bold mb-1">{label}</div>
            {player ? (
                <div className="space-y-1">
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
                    <Select value={fieldPosition || ''} onValueChange={(val) => onPositionChange(index, val)}>
                        <SelectTrigger className="h-7 text-xs border-gray-300 text-black">
                            <SelectValue placeholder="수비 포지션 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            {availablePositions.map((pos) => (
                                <SelectItem key={pos.value} value={pos.value} className="text-xs">
                                    {pos.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-xs text-gray-500 font-medium">
                    드래그
                </div>
            )}
        </div>
    );
}
