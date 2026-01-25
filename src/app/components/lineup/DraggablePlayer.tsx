import { useDrag } from 'react-dnd';
import { Player } from '@/app/types';
import { BatterCard } from './BatterCard';
import { PitcherCard } from './PitcherCard';

export const ItemTypes = {
    PLAYER: 'player',
};

export interface DraggablePlayerProps {
    player: Player;
}

export function DraggablePlayer({ player }: DraggablePlayerProps) {
    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.PLAYER,
        item: { player },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    return (
        <div ref={drag as any} className={isDragging ? 'opacity-50' : ''}>
            {player.position === '투수' ? (
                <PitcherCard player={player} />
            ) : (
                <BatterCard player={player} />
            )}
        </div>
    );
}
