import { useState, useEffect, useRef } from 'react';
import { Lineup, MatchInfo, Hitter, Pitcher, Stadium, MatchRecord } from '@/app/types';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { TEAM_THEMES } from '@/app/data/teamThemes';
import { BaseballField } from '@/app/components/BaseballField';
import { PitcherCard } from '@/app/components/lineup/PitcherCard';
import { BatterCard } from '@/app/components/lineup/BatterCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/app/components/ui/dialog';
import { Repeat, User, Users, Wind } from 'lucide-react';
import { Switch } from '@/app/components/ui/switch';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface SimulationGameProps {
  myLineup: Lineup;
  opponentLineup: Lineup;
  stadium: Stadium;
  isHome: boolean;
  matchId: string; // ⭐ 추가
  onGameEnd: (finalScore: { home: number; away: number }, history: MatchRecord[]) => void;
}


// management player card component
const SimulationPlayerCard = ({
  player,
  onClick,
  type = 'hitter',
  theme
}: {
  player: any, // ⭐ Type casting to any for flexibility with stats property
  onClick: () => void,
  type?: 'hitter' | 'pitcher',
  theme: any
}) => {
  const primaryStat = type === 'hitter'
    ? (player.stats?.avg?.toFixed(3) || player.avg?.toFixed(3) || '.000')
    : (player.stats?.era?.toFixed(2) || player.era?.toFixed(2) || '0.00');

  const statLabel = type === 'hitter' ? 'AVG' : 'ERA';

  return (
    <div
      onClick={onClick}
      className="relative w-40 h-64 cursor-pointer group transition-all hover:scale-105 active:scale-95"
    >
      {/* 카드 배경 프레임 (스포츠 카드 스타일) */}
      <div
        className="absolute inset-0 bg-slate-900 border-2 rounded-lg shadow-2xl overflow-hidden"
        style={{ borderColor: theme?.primary || '#ccc' }}
      >
        {/* 상단 장식 그라데이션 */}
        <div
          className="absolute top-0 left-0 w-full h-1/2 opacity-30 bg-gradient-to-b"
          style={{ backgroundImage: `linear-gradient(to bottom, ${theme?.primary || '#3b82f6'}, transparent)` }}
        />

        {/* 배경 로고 패턴 (희미하게) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <span className="text-8xl">⚾</span>
        </div>

        {/* 상단 정보 영역 */}
        <div className="relative p-3 flex flex-col items-center">
          <div className="flex w-full justify-between items-start">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-white leading-none">{primaryStat.replace('0.', '.')}</span>
              <span className="text-[10px] font-bold text-gray-400 mt-0.5">{statLabel}</span>
            </div>
            <Badge className="bg-white/10 text-[10px] px-1.5 py-0 border-0 text-white">LIVE</Badge>
          </div>
        </div>

        {/* 선수 이미지 영역 */}
        <div className="absolute inset-0 mt-8 flex items-center justify-center">
          {player.image_url ? (
            <img
              src={player.image_url}
              alt={player.name}
              className="w-full h-full object-cover object-top mask-image-gradient"
              style={{ maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)' }}
            />
          ) : (
            <span className="text-6xl grayscale opacity-20">👤</span>
          )}
        </div>

        {/* 하단 띠 & 이름 */}
        <div className="absolute bottom-0 left-0 w-full bg-white p-2">
          <div className="text-center">
            <div className="text-[10px] font-bold text-gray-400 leading-none mb-1">
              {type === 'hitter' ? (player as Hitter).position : (player as Pitcher).pitcherRole}
            </div>
            <div className="text-sm font-black text-gray-900 truncate">
              {player.name}
            </div>
          </div>

          {/* 팀 컬러 하단 바 */}
          <div
            className="absolute bottom-0 left-0 w-full h-1"
            style={{ backgroundColor: theme?.primary }}
          />
        </div>
      </div>

      {/* 카드 테두리 글로우 효과 (호버 시) */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-40 transition-opacity blur-md -z-10"
        style={{ backgroundColor: theme?.primary }}
      />
    </div>
  );
};

export function SimulationGame({
  myLineup,
  opponentLineup,
  stadium,
  isHome,
  matchId, // ⭐ Props에서 받음
  onGameEnd,
}: SimulationGameProps) {
  // DB 스키마에 맞춘 MatchInfo 상태
  const stompClient = useRef<Client | null>(null);

  const [matchInfo, setMatchInfo] = useState<MatchInfo>({
    match_id: matchId, // ⭐ 전달받은 경기 ID 사용
    status: 'PLAYING',
    score: { home: 0, away: 0 },
    inning: 1,
    is_top: true, // true: 초, false: 말
    runners: [null, null, null], // [1루, 2루, 3루]
    active_lineup: {
      batting: myLineup.batting,
      pitcher: myLineup.pitchers.starter,
      bench: myLineup.bench,
    },
    ball_count: { b: 0, s: 0, o: 0 },
    currentBatter: 0,
    pitches: 0,
    currentPitcher: {
      stamina: 100,
      pitchTypes: ['직구', '슬라이더', '커브', '체인지업', '포크볼'],
    },
  });

  const isMyTeamBatting = isHome !== matchInfo.is_top;

  const [gameLog, setGameLog] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Dialog states
  const [showPitcherDialog, setShowPitcherDialog] = useState(false);
  const [showPinchHitterDialog, setShowPinchHitterDialog] = useState(false);
  const [showPinchRunnerDialog, setShowPinchRunnerDialog] = useState(false);
  const [showBaseRunningDialog, setShowBaseRunningDialog] = useState(false);
  const [selectedRunnerBase, setSelectedRunnerBase] = useState<0 | 1 | 2 | null>(null);
  const [isAggressive, setIsAggressive] = useState(false);

  const currentLineup = isMyTeamBatting ? myLineup : opponentLineup;
  const currentBatter = currentLineup.batting[matchInfo.currentBatter];
  const currentPitcher = isMyTeamBatting
    ? opponentLineup.pitchers.starter
    : myLineup.pitchers.starter;

  const myTeam = myLineup.batting[0]?.team || '';
  const opponentTeam = opponentLineup.batting[0]?.team || '';
  const myTheme = TEAM_THEMES[myTeam];
  const opponentTheme = TEAM_THEMES[opponentTeam];

  // 게임 종료 체크
  const isGameOver = matchInfo.status === 'FINISHED' || matchInfo.inning > 9;

  const handleStartGame = () => {
    const userIdStr = localStorage.getItem('userId');
    const userId = userIdStr ? Number(userIdStr) : 0;

    console.log(`[DEBUG] Game Start Requested - matchId: ${matchId}, userId: ${userId}`);

    if (!stompClient.current?.connected || isSimulating || isGameOver) {
      console.warn(`[DEBUG] Cannot Start - connected: ${stompClient.current?.connected}, simulating: ${isSimulating}, gameOver: ${isGameOver}`);
      return;
    }

    setIsSimulating(true);

    // GameMessage structure for starting simulation
    const payload = {
      matchId: matchId,
      senderId: userId,
      type: 'START_SIMULATION',
      inning: matchInfo.inning,
      data: {}
    };

    console.log("[DEBUG] Sending START_SIMULATION payload:", payload);

    stompClient.current.publish({
      destination: `/app/match/${matchId}/command`,
      body: JSON.stringify(payload),
    });
  };


  useEffect(() => {
    // 1. 소켓 객체 생성
    const socket = new SockJS('http://localhost:8080/ws-baseball');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => console.log(`[STOMP DEBUG] ${str}`), // ⭐ STOMP 디버그 로그 추가
      onConnect: () => {
        console.log(`✅ 경기장(${matchId}) 연결 성공!`);

        // 2. 구독 (서버가 보내주는 결과 받기)
        client.subscribe(`/topic/match/${matchId}`, (message) => {
          console.log(`📩 [DEBUG] Received message on /topic/match/${matchId}`);
          const response = JSON.parse(message.body);
          console.log("[DEBUG] Response body:", response);

          // GameResponse structure: { eventType, description, data, inning, matchId }
          const { eventType, description, data, inning } = response;

          // 서버가 보내준 최신 경기 상태로 화면 동기화
          if (data && data.matchInfo) {
            const info = data.matchInfo;

            setMatchInfo(prev => {
              const updatedInfo = {
                ...prev,
                ...info,
                match_id: info.matchId || info.match_id || matchId,
                score: info.score || prev.score,
                is_top: info.top ?? info.is_top ?? prev.is_top,
                inning: info.inning || inning || prev.inning,
                ball_count: info.ballCount || info.ball_count || prev.ball_count,
                runners: (info.runners?.runnerIds || [null, null, null]).map((id: any) => {
                  if (id === null || id === undefined) return null;
                  const idNum = Number(id);
                  return (myLineup.batting.find(p => p?.id === idNum) ||
                    opponentLineup.batting.find(p => p?.id === idNum) ||
                    { id: idNum, name: '주자', team: '', position: '타자', image_url: '', stats: { avg: 0, ops: 0 } }) as any;
                }),
                currentBatter: info.currentBatterIndex ?? info.currentBatter ?? prev.currentBatter,
              };
              console.log("[DEBUG] Updated matchInfo state via GameResponse:", updatedInfo);
              return updatedInfo;
            });
          }

          // 중계 멘트 추가
          if (description) {
            setGameLog((prev) => [description, ...prev]);
          }

          // 시뮬레이션 종료 체크
          if (eventType === 'SIMULATION_END' || eventType === 'GAME_OVER') {
            setIsSimulating(false);
          }
        });
      },
    });

    client.activate();
    stompClient.current = client;

    return () => {
      client.deactivate();
    }; // 컴포넌트 나갈 때 연결 해제
  }, [matchId]);

  // 자동 진행 로직 제거 (서버 푸시 모델)

  useEffect(() => {
    if (isGameOver) {
      onGameEnd(matchInfo.score, []);
    }
  }, [isGameOver, matchInfo.score, onGameEnd]);

  // 교체 핸들러들
  const handlePitcherChange = (pitcher: Pitcher) => {
    console.log(`[DEBUG] Pitcher Change Requested - In: ${pitcher.name}(${pitcher.id})`);

    if (stompClient.current?.connected) {
      const userIdStr = localStorage.getItem('userId');
      const userId = userIdStr ? Number(userIdStr) : 0;

      stompClient.current.publish({
        destination: `/app/match/${matchId}/command`,
        body: JSON.stringify({
          matchId: matchId,
          senderId: userId,
          type: 'MANAGEMENT',
          inning: matchInfo.inning,
          data: {
            command: 'SUBSTITUTION',
            out_player_id: currentPitcher?.id,
            in_player_id: pitcher.id
          }
        }),
      });
    }

    setGameLog((prev) => [`[교체] ${currentPitcher?.name} → ${pitcher.name} 투수 교체`, ...prev]);

    setShowPitcherDialog(false);
  };

  const handleBunt = () => {
    console.log(`[DEBUG] Bunt Requested - matchId: ${matchId}`);

    if (stompClient.current?.connected) {
      const userIdStr = localStorage.getItem('userId');
      const userId = userIdStr ? Number(userIdStr) : 0;

      stompClient.current.publish({
        destination: `/app/match/${matchId}/command`,
        body: JSON.stringify({
          matchId: matchId,
          senderId: userId,
          type: 'MANAGEMENT',
          inning: matchInfo.inning,
          data: {
            command: 'BUNT'
          }
        }),
      });
      setGameLog((prev) => [`[작전] 번트 명령 하달`, ...prev]);
    }
  };

  const handleBaseRunning = (baseIndex: 0 | 1 | 2, aggressive: boolean) => {
    console.log(`[DEBUG] Base Running Requested - Base: ${baseIndex + 1}, Aggressive: ${aggressive}`);

    if (stompClient.current?.connected) {
      const userIdStr = localStorage.getItem('userId');
      const userId = userIdStr ? Number(userIdStr) : 0;

      stompClient.current.publish({
        destination: `/app/match/${matchId}/command`,
        body: JSON.stringify({
          matchId: matchId,
          senderId: userId,
          type: 'MANAGEMENT',
          inning: matchInfo.inning,
          data: {
            command: 'BASERUNNING',
            base: baseIndex + 1,
            is_aggressive: aggressive
          }
        }),
      });
      const runner = matchInfo.runners[baseIndex];
      setGameLog((prev) => [`[작전] ${runner?.name || (baseIndex + 1) + '루 주자'} ${aggressive ? '적극적' : '일반'} 주루 명령 하달`, ...prev]);
    }
    setShowBaseRunningDialog(false);
  };

  const handlePinchHitter = (player: Hitter) => {
    console.log(`[DEBUG] Pinch Hitter Requested - In: ${player.name}(${player.id})`);

    if (stompClient.current?.connected) {
      const userIdStr = localStorage.getItem('userId');
      const userId = userIdStr ? Number(userIdStr) : 0;

      stompClient.current.publish({
        destination: `/app/match/${matchId}/command`,
        body: JSON.stringify({
          matchId: matchId,
          senderId: userId,
          type: 'MANAGEMENT',
          inning: matchInfo.inning,
          data: {
            command: 'PINCH_HITTER',
            out_player_id: currentBatter?.id,
            in_player_id: player.id
          }
        }),
      });
    }

    setGameLog((prev) => [`[교체] ${currentBatter?.name} → ${player.name} 대타`, ...prev]);
    setShowPinchHitterDialog(false);
  };

  const handlePinchRunner = (player: Hitter, base: 0 | 1 | 2) => {
    const oldRunner = matchInfo.runners[base];
    console.log(`[DEBUG] Pinch Runner Requested - In: ${player.name}(${player.id}) at base ${base + 1}`);

    if (stompClient.current?.connected) {
      const userIdStr = localStorage.getItem('userId');
      const userId = userIdStr ? Number(userIdStr) : 0;

      stompClient.current.publish({
        destination: `/app/match/${matchId}/command`,
        body: JSON.stringify({
          matchId: matchId,
          senderId: userId,
          type: 'MANAGEMENT',
          inning: matchInfo.inning,
          data: {
            command: 'PINCH_RUNNER',
            out_player_id: oldRunner?.id,
            in_player_id: player.id,
            base: base
          }
        }),
      });
    }

    setGameLog((prev) => [`[교체] ${oldRunner?.name} → ${player.name} 대주자 (${base + 1}루)`, ...prev]);
    setShowPinchRunnerDialog(false);
    setSelectedRunnerBase(null);
  };

  return (
    <div
      className="min-h-screen flex flex-col p-4 gap-4 relative overflow-hidden bg-black"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1729280968440-367f2775afce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXNlYmFsbCUyMGZpZWxkJTIwZ3Jhc3N8ZW58MXx8fHwxNzY5MzE1MTY1fDA&ixlib=rb-4.1.0&q=80&w=1080)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/80" />

      {/* 상단 헤더 */}
      <div className="w-full max-w-[1600px] relative z-10 pt-2 px-6 mx-auto">
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h2 className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(57,255,20,0.6)] tracking-tighter">
              게임 시뮬레이션
            </h2>
          </div>
          <p className="text-white text-lg">실시간 경기 중계를 보고 작전을 세워보세요</p>
        </div>
      </div>

      {/* 상단 영역: 7:3 비율 그리드 */}
      <div className="h-[70vh] min-h-[500px] grid grid-cols-10 gap-4 relative z-10">

        {/* 좌측: 야구장 다이아몬드 (7칸) */}
        <div className="col-span-7 flex items-center justify-center overflow-hidden rounded-2xl bg-black/20 backdrop-blur-sm border border-white/5 shadow-2xl">
          <div className="w-full h-full flex items-center justify-center p-4">
            <BaseballField
              lineup={currentLineup.batting as any}
              fieldPositions={isMyTeamBatting ? opponentLineup.fieldPositions : myLineup.fieldPositions}
              currentBatter={currentBatter as any}
              currentPitcher={currentPitcher as any}
            />
          </div>
        </div>

        {/* 우측: 통합 정보 패널 (3칸) */}
        <div className="col-span-3 flex flex-col gap-3 h-full overflow-y-auto pr-1">

          {/* 1. 스코어보드 & BSO (Light Theme) */}
          <div className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xl shrink-0">
            {/* Top: Scoreboard */}
            <div className="flex-col justify-center px-5 py-4 border-b border-gray-100">
              {/* Away Team */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  <div className="w-12 h-12 relative flex items-center justify-center">
                    <img
                      src={`/assets/logos/${(isHome ? opponentTeam : myTeam).trim()}.png`}
                      alt="Away Team Logo"
                      className="w-full h-full object-contain drop-shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-10 h-10 rounded-full flex items-center justify-center text-lg font-black text-white"
                      style={{ backgroundColor: (isHome ? opponentTheme : myTheme)?.primary || '#94a3b8' }}>
                      {(isHome ? opponentTeam : myTeam)?.trim()[0]}
                    </div>
                  </div>
                  {/* Name */}
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-[10px] font-bold tracking-wider uppercase">AWAY</span>
                    <span className="text-gray-900 font-black text-xl tracking-tight leading-none">
                      {isHome ? opponentTeam : myTeam}
                    </span>
                  </div>
                </div>
                <span className="text-3xl font-black text-gray-900 tabular-nums tracking-tighter">
                  {matchInfo.score.away}
                </span>
              </div>

              {/* Home Team */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  <div className="w-12 h-12 relative flex items-center justify-center">
                    <img
                      src={`/assets/logos/${(isHome ? myTeam : opponentTeam).trim()}.png`}
                      alt="Home Team Logo"
                      className="w-full h-full object-contain drop-shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-10 h-10 rounded-full flex items-center justify-center text-lg font-black text-white"
                      style={{ backgroundColor: (isHome ? myTheme : opponentTheme)?.primary || '#94a3b8' }}>
                      {(isHome ? myTeam : opponentTeam)?.trim()[0]}
                    </div>
                  </div>
                  {/* Name */}
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-[10px] font-bold tracking-wider uppercase">HOME</span>
                    <span className="text-gray-900 font-black text-xl tracking-tight leading-none">
                      {isHome ? myTeam : opponentTeam}
                    </span>
                  </div>
                </div>
                <span className="text-3xl font-black text-gray-900 tabular-nums tracking-tighter">
                  {matchInfo.score.home}
                </span>
              </div>
            </div>

            {/* Bottom: Game Status (Bases & BSO) */}
            <div className="h-[120px] flex bg-gray-50 border-t border-gray-100">
              {/* Left: Base & Inning */}
              <div className="w-1/2 border-r border-gray-200 flex flex-col items-center justify-center p-2 relative">
                {/* Bases Container */}
                <div className="relative w-24 h-16 mb-1">
                  {/* 2nd Base */}
                  <div
                    className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 rotate-45 border-2 transition-all duration-300 ${matchInfo.runners[1] ? 'bg-yellow-400 border-yellow-500 shadow-md' : 'bg-white border-gray-300'}`}
                  />
                  {/* 3rd Base */}
                  <div
                    className={`absolute bottom-1 left-4 w-6 h-6 rotate-45 border-2 transition-all duration-300 ${matchInfo.runners[2] ? 'bg-yellow-400 border-yellow-500 shadow-md' : 'bg-white border-gray-300'}`}
                  />
                  {/* 1st Base */}
                  <div
                    className={`absolute bottom-1 right-4 w-6 h-6 rotate-45 border-2 transition-all duration-300 ${matchInfo.runners[0] ? 'bg-yellow-400 border-yellow-500 shadow-md' : 'bg-white border-gray-300'}`}
                  />
                </div>

                {/* Inning */}
                <div className="flex items-center gap-2 font-black text-xl text-gray-800">
                  <span>{matchInfo.inning}회</span>
                  {matchInfo.is_top ? (
                    <span className="text-red-500 text-lg">▲</span> /* Top */
                  ) : (
                    <span className="text-blue-500 text-lg">▼</span> /* Bottom */
                  )}
                </div>
              </div>

              {/* Right: BSO */}
              <div className="w-1/2 flex flex-col justify-center px-4 space-y-2">
                {/* Ball */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-800 font-black text-lg w-4">B</span>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full transition-all duration-200 border ${i < matchInfo.ball_count.b
                          ? 'bg-green-500 border-green-600 shadow-[0_0_6px_#22c55e]'
                          : 'bg-white border-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                </div>
                {/* Strike */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-800 font-black text-lg w-4">S</span>
                  <div className="flex gap-1.5">
                    {[0, 1].map((i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full transition-all duration-200 border ${i < matchInfo.ball_count.s
                          ? 'bg-yellow-400 border-yellow-500 shadow-[0_0_6px_#facc15]'
                          : 'bg-white border-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                </div>
                {/* Out */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-800 font-black text-lg w-4">O</span>
                  <div className="flex gap-1.5">
                    {[0, 1].map((i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full transition-all duration-200 border ${i < matchInfo.ball_count.o
                          ? 'bg-red-500 border-red-600 shadow-[0_0_6px_#ef4444]'
                          : 'bg-white border-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 투수 정보 (Shared Component) */}
          <div className="flex-1 flex flex-col gap-2 shrink-0">
            {currentPitcher && (
              <div className="relative">
                {/* @ts-ignore - Player type compatibility */}
                <PitcherCard player={currentPitcher} />
              </div>
            )}
          </div>

          {/* 3. 타자 정보 (Shared Component) */}
          <div className="flex-1 flex flex-col gap-2 shrink-0">
            {currentBatter && (
              <div className="relative">
                {/* @ts-ignore - Player type compatibility */}
                <BatterCard player={currentBatter as any} />
              </div>
            )}
            {/* Batting Context (Optional - could add Hot/Cold zones later) */}
          </div>
        </div>
      </div>

      {/* 하단 영역: 경기 로그 & Management */}
      <div className="grid grid-cols-10 gap-4">
        {/* 경기 로그 (탭 구조) - 7칸 */}
        <div className="col-span-7">
          <Card className="p-4 bg-white/70 backdrop-blur-md border border-white/20 shadow-2xl">
            <Tabs defaultValue="log" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-3 bg-black/5">
                <TabsTrigger value="log" className="text-base font-bold h-10 data-[state=active]:bg-white data-[state=active]:text-black">경기 로그</TabsTrigger>
                <TabsTrigger value="lineup" className="text-base font-bold h-10 data-[state=active]:bg-white data-[state=active]:text-black">라인업</TabsTrigger>
              </TabsList>
              <TabsContent value="log">
                <ScrollArea className="h-[250px]">
                  <div className="space-y-1.5">
                    {gameLog.map((log, idx) => (
                      <div
                        key={idx}
                        className="text-sm p-2.5 bg-white/50 rounded border border-black/5 text-gray-800"
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="lineup">
                <ScrollArea className="h-[250px]">
                  <div className="grid grid-cols-2 gap-4">
                    {/* 우리팀 라인업 */}
                    <div>
                      <h4 className="font-extrabold text-lg text-black mb-3 flex items-center gap-2">
                        <div className="w-6 h-6 relative flex items-center justify-center">
                          <img
                            src={`/assets/logos/${myTeam.trim()}.png`}
                            alt="My Team Logo"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                            style={{ backgroundColor: myTheme?.primary || '#94a3b8' }}>
                            {myTeam?.[0]}
                          </div>
                        </div>
                        {myTeam}
                      </h4>
                      <div className="space-y-1">
                        {myLineup.batting.map((player, idx) => (
                          player ? (
                            <div key={idx} className="text-m p-2.5 bg-white/50 rounded border border-black/5 text-gray-800 flex justify-between">
                              <span>{idx + 1}. {player.name} ({player.position})</span>
                              <span className="text-blue-600 font-bold">{(player as any).stats?.avg?.toFixed(3) || (player as any).avg?.toFixed(3) || '.000'}</span>
                            </div>
                          ) : null
                        ))}
                      </div>
                    </div>

                    {/* 상대팀 라인업 */}
                    <div>
                      <h4 className="font-extrabold text-lg text-black mb-3 flex items-center gap-2">
                        <div className="w-6 h-6 relative flex items-center justify-center">
                          <img
                            src={`/assets/logos/${opponentTeam.trim()}.png`}
                            alt="Opponent Team Logo"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                            style={{ backgroundColor: opponentTheme?.primary || '#94a3b8' }}>
                            {opponentTeam?.[0]}
                          </div>
                        </div>
                        {opponentTeam}
                      </h4>
                      <div className="space-y-1">
                        {opponentLineup.batting.map((player, idx) => (
                          player ? (
                            <div key={idx} className="text-m p-2.5 bg-white/50 rounded border border-black/5 text-gray-800 flex justify-between">
                              <span>{idx + 1}. {player.name} ({player.position})</span>
                              <span className="text-blue-600 font-bold">{(player as any).stats?.avg?.toFixed(3) || (player as any).avg?.toFixed(3) || '.000'}</span>
                            </div>
                          ) : null
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Management - 3칸 */}
        <div className="col-span-3">
          <Card className="p-4 bg-white/70 backdrop-blur-md border border-white/20 shadow-2xl">
            <h3 className="font-bold text-lg mb-3 text-black flex items-center gap-2">
              <Users className="w-5 h-5" />
              Management
            </h3>
            <div className="space-y-2">
              {/* 경기 시작 버튼 */}
              <Button
                onClick={handleStartGame}
                disabled={isSimulating || isGameOver}
                className="w-full h-12 font-black text-base shadow-xl text-white border-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: myTheme?.primary || '#22c55e',
                  boxShadow: `0 0 20px ${myTheme?.primary}60`
                }}
              >
                {isSimulating ? '경기 진행 중...' : '⚾ 경기 시작'}
              </Button>

              <Separator className="my-2 bg-black/10" />

              {/* 교체 버튼들 */}
              <Button
                onClick={() => setShowPitcherDialog(true)}
                className="w-full h-9 bg-white/80 hover:bg-white font-bold text-sm border-2 shadow-sm text-black transition-colors"
                style={{ borderColor: myTheme?.primary }}
              >
                <Repeat className="w-4 h-4 mr-1" style={{ color: myTheme?.primary }} />
                투수교체
              </Button>

              <Button
                onClick={() => setShowPinchHitterDialog(true)}
                className="w-full h-9 bg-white/80 hover:bg-white font-bold text-sm border-2 shadow-sm text-black transition-colors"
                style={{ borderColor: myTheme?.primary }}
              >
                <User className="w-4 h-4 mr-1" style={{ color: myTheme?.primary }} />
                대타
              </Button>

              <Button
                onClick={() => setShowPinchRunnerDialog(true)}
                className="w-full h-9 bg-white/80 hover:bg-white font-bold text-sm border-2 shadow-sm text-black transition-colors"
                style={{ borderColor: myTheme?.primary }}
              >
                <User className="w-4 h-4 mr-1" style={{ color: myTheme?.primary }} />
                대주자
              </Button>

              <Separator className="my-2 bg-black/10" />

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleBunt}
                  disabled={!isMyTeamBatting || isSimulating || isGameOver}
                  className="h-9 bg-slate-900 border-0 hover:bg-slate-800 text-white font-bold text-xs"
                >
                  번트
                </Button>
                <Button
                  onClick={() => setShowBaseRunningDialog(true)}
                  disabled={!isMyTeamBatting || isSimulating || isGameOver || !matchInfo.runners.some(r => r !== null)}
                  className="h-9 bg-slate-900 border-0 hover:bg-slate-800 text-white font-bold text-xs"
                >
                  주루/도루
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Management Dialogs */}
      <Dialog open={showPitcherDialog} onOpenChange={setShowPitcherDialog}>
        <DialogContent className="max-w-5xl bg-slate-950/95 border-white/10 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white">투수 교체</DialogTitle>
            <DialogDescription className="text-gray-400 font-bold">교체할 투수를 선택하세요 (BULLPEN)</DialogDescription>
          </DialogHeader>
          <div className="flex overflow-x-auto gap-6 p-6 pb-8 scrollbar-hide">
            {myLineup.pitchers.middle.map((pitcher, idx) =>
              pitcher ? (
                <SimulationPlayerCard
                  key={idx}
                  player={pitcher}
                  type="pitcher"
                  theme={myTheme}
                  onClick={() => handlePitcherChange(pitcher)}
                />
              ) : null
            )}
            {myLineup.pitchers.closer && (
              <SimulationPlayerCard
                player={myLineup.pitchers.closer}
                type="pitcher"
                theme={myTheme}
                onClick={() => handlePitcherChange(myLineup.pitchers.closer!)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPinchHitterDialog} onOpenChange={setShowPinchHitterDialog}>
        <DialogContent className="max-w-5xl bg-slate-950/95 border-white/10 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white">대타 투입</DialogTitle>
            <DialogDescription className="text-gray-400 font-bold">교체할 대타를 선택하세요 (BENCH)</DialogDescription>
          </DialogHeader>
          <div className="flex overflow-x-auto gap-6 p-6 pb-8 scrollbar-hide">
            {myLineup.bench.map((player, idx) =>
              player ? (
                <SimulationPlayerCard
                  key={idx}
                  player={player}
                  type="hitter"
                  theme={myTheme}
                  onClick={() => handlePinchHitter(player)}
                />
              ) : null
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPinchRunnerDialog} onOpenChange={setShowPinchRunnerDialog}>
        <DialogContent className="max-w-5xl bg-slate-950/95 border-white/10 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white">대주자 투입</DialogTitle>
            <DialogDescription className="text-gray-400 font-bold">교체할 대주자를 선택하세요 (BENCH)</DialogDescription>
          </DialogHeader>
          <div className="flex overflow-x-auto gap-6 p-6 pb-8 scrollbar-hide">
            {myLineup.bench.map((player, idx) =>
              player ? (
                <SimulationPlayerCard
                  key={idx}
                  player={player}
                  type="hitter"
                  theme={myTheme}
                  onClick={() => handlePinchRunner(player, selectedRunnerBase as 0 | 1 | 2)}
                />
              ) : null
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBaseRunningDialog} onOpenChange={setShowBaseRunningDialog}>
        <DialogContent className="max-w-md bg-slate-950/95 border-white/10 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white">주루 작전</DialogTitle>
            <DialogDescription className="text-gray-400 font-bold">주루 명령을 내릴 베이스를 선택하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Wind className="w-5 h-5 text-cyber-yellow" />
                <div>
                  <div className="text-white font-bold text-sm">적극적 주루/도루</div>
                  <div className="text-[10px] text-gray-400">성공 확률이 변동되나 공격적인 진루를 시도합니다</div>
                </div>
              </div>
              <Switch checked={isAggressive} onCheckedChange={setIsAggressive} />
            </div>

            <div className="grid grid-cols-1 gap-3">
              {matchInfo.runners.map((runner, idx) => (
                runner && (
                  <Button
                    key={idx}
                    onClick={() => handleBaseRunning(idx as 0 | 1 | 2, isAggressive)}
                    className="w-full h-16 bg-white/5 hover:bg-white/10 border-white/10 text-white flex justify-between px-6 transition-all border group"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">{idx + 1}B RUNNER</span>
                      <span className="font-black text-base">{runner.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30 px-2 py-0.5 rounded font-black">명령 하달</span>
                    </div>
                  </Button>
                )
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}