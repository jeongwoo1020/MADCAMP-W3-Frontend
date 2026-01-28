import { useState } from 'react';
import { Player } from '@/app/types';

interface BaseballFieldProps {
  lineup: (Player | null)[];
  fieldPositions: Record<string, number>; // { "SS": 102, "2B": 103 ... }
  currentBatter: Player | null;
  currentPitcher: Player | null;
  currentRunners: (Player | null)[]; // [1루, 2루, 3루]
  onPlayerClick?: (player: Player | null, position: string) => void;
}

// 수비 포지션별 좌표 (SVG viewBox 0-100 기준)
const POSITION_COORDINATES: Record<string, { x: number; y: number; label: string }> = {
  // 외야: y를 15~25 사이로 내려서 중견수(CF)가 잘리지 않게 함
  'CF': { x: 50, y: 18, label: 'CF' },
  'LF': { x: 20, y: 28, label: 'LF' },
  'RF': { x: 80, y: 28, label: 'RF' },

  // 내야: 중앙으로 더 모아서 입체감 형성
  'SS': { x: 38, y: 35, label: 'SS' },
  '2B': { x: 62, y: 35, label: '2B' },
  'P': { x: 50, y: 55, label: 'P' },
  '3B': { x: 25, y: 55, label: '3B' },
  '1B': { x: 75, y: 55, label: '1B' },

  // 포수: y를 85 정도로 올려서 하단 여백 확보
  'C': { x: 50, y: 80, label: 'C' },
};

// Helper Component for Markers to handle Image Error State independently
const PlayerMarker = ({
  player,
  label,
  isPitcher,
  size = 'md',
  onClick
}: {
  player: Player | null,
  label: string,
  isPitcher?: boolean,
  size?: 'md' | 'lg',
  onClick?: () => void
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = size === 'lg' ? 'w-20 h-20' : 'w-16 h-16';
  const iconSize = size === 'lg' ? 'text-4xl' : 'text-3xl';
  const borderClass = isPitcher ? 'border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]' : (size === 'lg' ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]' : 'border-white shadow-xl');

  return (
    <div
      className="flex flex-col items-center group/player cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <div className={`${sizeClasses} rounded-full border-2 overflow-hidden bg-slate-800 flex items-center justify-center transition-transform group-hover/player:scale-110 ${borderClass}`}>
          {player?.image_url && !imgError ? (
            <img
              src={player.image_url}
              alt={player.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className={iconSize}>⚾</span>
          )}
        </div>

        <div className={`absolute -bottom-2 md:-bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-3 py-0.5 rounded-full border border-white/20 whitespace-nowrap min-w-[70px] text-center shadow-2xl ${size === 'lg' ? 'bg-blue-600 border-white/30' : ''}`}>
          <p className="text-[10px] md:text-[12px] font-bold leading-none opacity-60 mb-0.5">{label}</p>
          <p className={`${size === 'lg' ? 'text-base' : 'text-sm'} font-black leading-none tracking-tighter`}>
            {player?.name || (isPitcher ? '준비중' : '-')}
          </p>
        </div>
      </div>
    </div>
  );
};

export function BaseballField({ lineup, fieldPositions, currentBatter, currentPitcher, currentRunners, onPlayerClick }: BaseballFieldProps) {
  // 수비 포지션별로 선수 매핑 (ID 기반)
  const getPlayerByPosition = (position: string) => {
    if (!fieldPositions || !lineup) return null;

    const val = fieldPositions[position];
    if (!val) return null;

    // val이 숫자/문자열일 수도 있고, {id: 123} 형태의 객체일 수도 있음
    const playerId = typeof val === 'object' ? (val as any).id : val;
    if (!playerId) return null;

    const found = lineup.find(p => p && Number(p.id) === Number(playerId)) || null;
    console.log(`[DEBUG] Field Mapping - Pos: ${position}, ID: ${playerId}, Found: ${found?.name || 'No'}`);
    return found;
  };

  return (
    <div className="relative w-full aspect-[4/3] bg-[#2d5a27] rounded-2xl overflow-hidden border-4 border-[#1a3a17] shadow-2xl group">
      {/* 1. 그라운드 배경 */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 100%, #4a8c44 0%, #2d5a27 99%)',
        }}
      />

      {/* 2. 내야 흙 다이아몬드 및 베이스라인 */}
      <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 w-[75%] h-[80%] opacity-40 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 50 95 L 88 58 L 50 22 L 12 58 Z" fill="#c4a57b" />
          <path
            d="M 50 95 L 88 58 L 50 22 L 12 58 Z"
            fill="none"
            stroke="white"
            strokeWidth="0.6"
            strokeDasharray="2"
          />
        </svg>
      </div>

      {/* 3. 홈플레이트 디테일 */}
      <div className="absolute left-1/2 bottom-[5%] -translate-x-1/2 w-4 h-4 bg-white/90 rotate-45 border-2 border-slate-300 shadow-sm z-20" />

      {/* 4. 주자 표시 */}
      {[0, 1, 2].map((i) => {
        const runner = currentRunners[i];
        if (!runner) return null;

        // 베이스별 좌표 (1루, 2루, 3루)
        const runnerCoords = [
          { x: 88, y: 58 }, // 1B
          { x: 50, y: 22 }, // 2B
          { x: 12, y: 58 }  // 3B
        ];

        return (
          <div
            key={`runner-${i}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-40 transition-all duration-500 scale-[0.65]"
            style={{ left: `${runnerCoords[i].x}%`, top: `${runnerCoords[i].y}%` }}
          >
            <PlayerMarker
              player={runner}
              label={`${i + 1}B RUNNER`}
              onClick={() => onPlayerClick?.(runner, `RUNNER_${i + 1}`)}
            />
          </div>
        );
      })}

      {/* 5. 수비수 및 투수 마커 배치 */}
      {Object.entries(POSITION_COORDINATES).map(([position, coords]) => {
        // 투수(P)는 currentPitcher를, 나머지는 라인업에서 해당 포지션 선수를 가져옴
        const player = position === 'P' ? currentPitcher : getPlayerByPosition(position);
        if (!player && position === 'DH') return null;

        return (
          <div
            key={position}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-500"
            style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
          >
            <PlayerMarker
              player={player}
              label={coords.label}
              isPitcher={position === 'P'}
              onClick={() => onPlayerClick?.(player, position)}
            />
          </div>
        );
      })}

      <div
        className="absolute left-[34%] bottom-[5%] z-40 animate-in fade-in slide-in-from-bottom-4 duration-700"
        onClick={() => onPlayerClick?.(currentBatter, 'BATTER')}
      >
        <PlayerMarker player={currentBatter} label="BATTER" size="lg" />
      </div>
    </div>
  );
}
