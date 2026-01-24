import { Player } from '@/app/types';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Coins } from 'lucide-react';

interface PitcherCardProps {
    player: Player;
}

export function PitcherCard({ player }: PitcherCardProps) {
    return (
        <Card className="p-3 cursor-move hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-base">{player.name}</span>
                        <Badge variant="secondary" className="text-xs">
                            {player.pitcherRole === 'starter' ? '선발' :
                                player.pitcherRole === 'middle' ? '계투' : '마무리'}
                        </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{player.team}</div>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1 text-amber-600 font-bold">
                        <Coins className="w-3 h-3" />
                        <span className="text-sm">{player.salary}</span>
                    </div>
                    {/* <div className="text-xs text-muted-foreground mt-1">
                        폼 {player.recentForm}/10
                    </div> */}
                </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                {player.stats?.era !== undefined && (
                    <div>
                        <div className="text-muted-foreground">ERA</div>
                        <div className="font-semibold text-green-600">{player.stats.era.toFixed(2)}</div>
                    </div>
                )}
                {player.stats?.whip !== undefined && (
                    <div>
                        <div className="text-muted-foreground">WHIP</div>
                        <div className="font-semibold">{player.stats.whip.toFixed(2)}</div>
                    </div>
                )}
                {player.stats?.k !== undefined && (
                    <div>
                        <div className="text-muted-foreground">K</div>
                        <div className="font-semibold">{player.stats.k}</div>
                    </div>
                )}
                {/* 투수는 지표가 적을 수 있으므로 빈 칸 처리 등 가능 */}
            </div>
        </Card>
    );
}
