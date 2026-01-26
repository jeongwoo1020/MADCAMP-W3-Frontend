import { Player } from '@/app/types';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Coins } from 'lucide-react';

interface BatterCardProps {
    player: Player;
}

export function BatterCard({ player }: BatterCardProps) {
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
                                {player.position}
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

            <div className="mt-4 grid grid-cols-4 gap-3 text-sm">
                {player.stats?.avg !== undefined && (
                    <div className="text-center bg-gray-50 rounded p-1">
                        <div className="text-gray-500 text-xs uppercase tracking-wider">AVG</div>
                        <div className="font-bold">{player.stats.avg.toFixed(3)}</div>
                    </div>
                )}
                {player.stats?.ops !== undefined && (
                    <div className="text-center bg-blue-50 rounded p-1">
                        <div className="text-blue-500 text-xs uppercase tracking-wider">OPS</div>
                        <div className="font-bold text-blue-700">{player.stats.ops.toFixed(3)}</div>
                    </div>
                )}
                {player.stats?.hr !== undefined && (
                    <div className="text-center bg-gray-50 rounded p-1">
                        <div className="text-gray-500 text-xs uppercase tracking-wider">HR</div>
                        <div className="font-bold">{player.stats.hr}</div>
                    </div>
                )}
                {player.stats?.rbi !== undefined && (
                    <div className="text-center bg-gray-50 rounded p-1">
                        <div className="text-gray-500 text-xs uppercase tracking-wider">RBI</div>
                        <div className="font-bold">{player.stats.rbi}</div>
                    </div>
                )}
            </div>
        </Card>
    );
}
