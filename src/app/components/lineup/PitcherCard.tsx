import { Player } from '@/app/types';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Coins } from 'lucide-react';

interface PitcherCardProps {
    player: Player;
}

export function PitcherCard({ player }: PitcherCardProps) {
    return (
        <Card className="p-4 cursor-move hover:shadow-lg transition-shadow bg-white text-black border-gray-200">
            <div className="flex items-center gap-4">
                {/* Player Image */}
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-gray-200 shadow-sm">
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
                        <div className="w-full h-full flex items-center justify-center text-2xl">⚾</div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-xl truncate">{player.name}</span>
                            <Badge className="text-sm px-2 py-0.5 bg-gray-200 text-gray-900 hover:bg-gray-300 border-0 flex-shrink-0 font-bold">
                                {player.pitcherRole === 'starter' ? '선발' :
                                    player.pitcherRole === 'middle' ? '계투' : '마무리'}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-600">{player.team}</div>
                        <div className="flex items-center gap-1 text-amber-600 font-bold flex-shrink-0 ml-2">
                            <Coins className="w-4 h-4" />
                            <span className="text-base">{player.salary}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                {player.stats?.era !== undefined && (
                    <div className="text-center bg-green-50 rounded p-1">
                        <div className="text-green-600 text-xs uppercase tracking-wider">ERA</div>
                        <div className="font-bold text-green-700">{player.stats.era.toFixed(2)}</div>
                    </div>
                )}
                {player.stats?.whip !== undefined && (
                    <div className="text-center bg-gray-50 rounded p-1">
                        <div className="text-gray-500 text-xs uppercase tracking-wider">WHIP</div>
                        <div className="font-bold">{player.stats.whip.toFixed(2)}</div>
                    </div>
                )}
                {player.stats?.k !== undefined && (
                    <div className="text-center bg-gray-50 rounded p-1">
                        <div className="text-gray-500 text-xs uppercase tracking-wider">K</div>
                        <div className="font-bold">{player.stats.k}</div>
                    </div>
                )}
            </div>
        </Card>
    );
}
