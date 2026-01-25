import { Player } from '@/app/types';

interface BaseballFieldProps {
  lineup: (Player | null)[];
  fieldPositions: (string | null)[];
  currentBatter: Player | null;
  currentPitcher: Player | null;
}

// 수비 포지션별 좌표 (SVG viewBox 0-100 기준)
const POSITION_COORDINATES: Record<string, { x: number; y: number; label: string }> = {
  'P': { x: 50, y: 65, label: '투수' },
  'C': { x: 50, y: 88, label: '포수' },
  '1B': { x: 72, y: 72, label: '1루수' },
  '2B': { x: 60, y: 50, label: '2루수' },
  '3B': { x: 28, y: 72, label: '3루수' },
  'SS': { x: 40, y: 50, label: '유격수' },
  'LF': { x: 15, y: 25, label: '좌익수' },
  'CF': { x: 50, y: 15, label: '중견수' },
  'RF': { x: 85, y: 25, label: '우익수' },
};

export function BaseballField({ lineup, fieldPositions, currentBatter, currentPitcher }: BaseballFieldProps) {
  // 수비 포지션별로 선수 매핑
  const getPlayerByPosition = (position: string) => {
    if (!fieldPositions || !lineup) {
      return null;
    }
    const index = fieldPositions.findIndex((pos) => pos === position);
    if (index !== -1) {
      return lineup[index];
    }
    return null;
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-green-700 to-green-600 rounded-lg overflow-hidden">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* 외야 잔디 */}
        <ellipse cx="50" cy="90" rx="48" ry="45" fill="#92c483" opacity="0.6" />
        
        {/* 내야 흙 */}
        <path
          d="M 50 90 L 80 60 L 50 30 L 20 60 Z"
          fill="#c4a57b"
          opacity="0.8"
        />
        
        {/* 투수판 */}
        <circle cx="50" cy="65" r="2" fill="#ffffff" opacity="0.9" />
        
        {/* 베이스 라인 */}
        <line x1="50" y1="90" x2="80" y2="60" stroke="#ffffff" strokeWidth="0.3" opacity="0.5" />
        <line x1="50" y1="90" x2="20" y2="60" stroke="#ffffff" strokeWidth="0.3" opacity="0.5" />
        <line x1="80" y1="60" x2="50" y2="30" stroke="#ffffff" strokeWidth="0.3" opacity="0.5" />
        <line x1="20" y1="60" x2="50" y2="30" stroke="#ffffff" strokeWidth="0.3" opacity="0.5" />
        
        {/* 1루 베이스 */}
        <rect
          x="78"
          y="58"
          width="4"
          height="4"
          fill="#ffffff"
          transform="rotate(45 80 60)"
        />
        
        {/* 2루 베이스 */}
        <rect
          x="48"
          y="28"
          width="4"
          height="4"
          fill="#ffffff"
          transform="rotate(45 50 30)"
        />
        
        {/* 3루 베이스 */}
        <rect
          x="18"
          y="58"
          width="4"
          height="4"
          fill="#ffffff"
          transform="rotate(45 20 60)"
        />
        
        {/* 홈 베이스 */}
        <path
          d="M 50 90 L 48 88 L 48 86 L 52 86 L 52 88 Z"
          fill="#ffffff"
        />
      </svg>
      
      {/* 수비 포지션별 선수 배치 */}
      {Object.entries(POSITION_COORDINATES).map(([position, coords]) => {
        const player = position === 'P' ? currentPitcher : getPlayerByPosition(position);
        
        if (!player && position === 'DH') return null;
        
        return (
          <div
            key={position}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${coords.x}%`,
              top: `${coords.y}%`,
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg">
                {player?.name.slice(0, 2) || position}
              </div>
              <div className="bg-slate-800/80 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
                {coords.label}
              </div>
              {player && (
                <div className="bg-white/90 text-slate-800 text-[9px] px-1.5 py-0.5 rounded font-bold">
                  {player.name}
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* 타자 위치 */}
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2"
        style={{ left: '50%', top: '95%' }}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg">
            {currentBatter?.name.slice(0, 2)}
          </div>
          {currentBatter && (
            <div className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">
              {currentBatter.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}