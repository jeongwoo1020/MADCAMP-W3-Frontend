import { useDrag } from 'react-dnd';
import { Player } from '@/app/types';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Coins } from 'lucide-react';

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
        <div ref={drag} className={isDragging ? 'opacity-50' : ''}>
            <Card className="p-3 cursor-move hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-base">{player.name}</span>
                            <Badge variant="outline" className="text-xs">
                                {player.position}
                            </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{player.team}</div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-amber-600 font-bold">
                            <Coins className="w-3 h-3" />
                            <span className="text-sm">{player.salary}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            폼 {player.recentForm}/10
                        </div>
                    </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                    {player.stats.avg !== undefined && (
                        <div>
                            <div className="text-muted-foreground">AVG</div>
                            <div className="font-semibold">{player.stats.avg.toFixed(3)}</div>
                        </div>
                    )}
                    {player.stats.ops !== undefined && (
                        <div>
                            <div className="text-muted-foreground">OPS</div>
                            <div className="font-semibold text-blue-600">{player.stats.ops.toFixed(3)}</div>
                        </div>
                    )}
                    {player.stats.hr !== undefined && (
                        <div>
                            <div className="text-muted-foreground">HR</div>
                            <div className="font-semibold">{player.stats.hr}</div>
                        </div>
                    )}
                    {player.stats.rbi !== undefined && (
                        <div>
                            <div className="text-muted-foreground">RBI</div>
                            <div className="font-semibold">{player.stats.rbi}</div>
                        </div>
                    )}
                    {player.stats.era !== undefined && (
                        <div>
                            <div className="text-muted-foreground">ERA</div>
                            <div className="font-semibold text-green-600">{player.stats.era.toFixed(2)}</div>
                        </div>
                    )}
                    {player.stats.whip !== undefined && (
                        <div>
                            <div className="text-muted-foreground">WHIP</div>
                            <div className="font-semibold">{player.stats.whip.toFixed(2)}</div>
                        </div>
                    )}
                    {player.stats.k !== undefined && (
                        <div>
                            <div className="text-muted-foreground">K</div>
                            <div className="font-semibold">{player.stats.k}</div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
