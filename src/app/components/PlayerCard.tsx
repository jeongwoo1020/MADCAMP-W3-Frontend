import { Player } from '@/app/types';
import { Badge } from '@/app/components/ui/badge';
import { Card } from '@/app/components/ui/card';

interface PlayerCardProps {
  player: Player;
  index?: number;
  isDragging?: boolean;
}

export function PlayerCard({ player, index, isDragging }: PlayerCardProps) {
  return (
    <Card
      className={`p-3 cursor-move hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {index !== undefined && (
            <span className="text-sm font-bold text-blue-600 mr-2">{index + 1}번</span>
          )}
          <span className="font-bold text-lg">{player.name}</span>
          <Badge variant="outline" className="ml-2 text-xs">
            {player.position}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">{player.team}</div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        {player.stats.avg !== undefined && (
          <div>
            <div className="text-muted-foreground">타율</div>
            <div className="font-semibold">{player.stats.avg.toFixed(3)}</div>
          </div>
        )}
        {player.stats.ops !== undefined && (
          <div>
            <div className="text-muted-foreground">OPS</div>
            <div className="font-semibold">{player.stats.ops.toFixed(3)}</div>
          </div>
        )}
        {player.stats.hr !== undefined && (
          <div>
            <div className="text-muted-foreground">홈런</div>
            <div className="font-semibold">{player.stats.hr}</div>
          </div>
        )}
        {player.stats.era !== undefined && (
          <div>
            <div className="text-muted-foreground">평균자책</div>
            <div className="font-semibold">{player.stats.era.toFixed(2)}</div>
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
            <div className="text-muted-foreground">삼진</div>
            <div className="font-semibold">{player.stats.k}</div>
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1">
        <span className="text-xs text-muted-foreground">최근폼:</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-4 rounded-sm ${
                i < player.recentForm ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}