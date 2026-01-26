import { useState, useEffect, useRef } from 'react';
import { Lineup, MatchInfo, AtBatResult, Hitter, Pitcher, Stadium, MatchRecord } from '@/app/types';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
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
import { Repeat, User, Users, TrendingUp, Target, Play, Pause } from 'lucide-react';
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

const PITCH_TYPES = [
  { name: '직구', speed: 145 },
  { name: '슬라이더', speed: 135 },
  { name: '커브', speed: 120 },
  { name: '체인지업', speed: 130 },
  { name: '포크볼', speed: 125 },
];

interface PitchInfo {
  type: string;
  speed: number;
  location: string;
}

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
      pitchTypes: PITCH_TYPES.map((p) => p.name),
    },
  });

  // const [isHomeTeam, setIsHomeTeam] = useState(!isHome);
  const isMyTeamBatting = isHome !== matchInfo.is_top;

  const [lastResult, setLastResult] = useState<AtBatResult | null>(null);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [matchRecords, setMatchRecords] = useState<MatchRecord[]>([]);
  const [currentPitch, setCurrentPitch] = useState<PitchInfo | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  // Dialog states
  const [showPitcherDialog, setShowPitcherDialog] = useState(false);
  const [showPinchHitterDialog, setShowPinchHitterDialog] = useState(false);
  const [showPinchRunnerDialog, setShowPinchRunnerDialog] = useState(false);
  const [selectedRunnerBase, setSelectedRunnerBase] = useState<0 | 1 | 2 | null>(null);

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
  const isGameOver = matchInfo.inning > 9;

  // 투구 정보 생성
  const generatePitch = (): PitchInfo => {
    const pitch = PITCH_TYPES[Math.floor(Math.random() * PITCH_TYPES.length)];
    const speedVariation = Math.floor(Math.random() * 10) - 5;
    const locations = ['스트라이크 존', '볼 존 바깥쪽', '볼 존 안쪽', '높은 코스', '낮은 코스'];
    return {
      type: pitch.name,
      speed: pitch.speed + speedVariation,
      location: locations[Math.floor(Math.random() * locations.length)],
    };
  };

  const simulateAtBat = (): AtBatResult => {
    if (!currentBatter || !currentPitcher) {
      return { type: 'out', description: '타자 정보 없음' };
    }

    const pitch = generatePitch();
    setCurrentPitch(pitch);

    const batterOBP = currentBatter.stats.obp || 0.3;
    const batterSLG = currentBatter.stats.slg || 0.4;
    const pitcherWHIP = currentPitcher.stats.whip || 1.2;

    const baseSuccess = batterOBP * (1 / pitcherWHIP);
    const random = Math.random();

    let result: AtBatResult;

    if (random < baseSuccess * 0.15) {
      result = {
        type: 'homerun',
        description: `${currentBatter.name}의 시원한 홈런! 담장을 넘어갑니다!`,
      };
    } else if (random < baseSuccess * 0.35) {
      const isTriple = Math.random() < 0.2;
      result = {
        type: isTriple ? 'triple' : 'double',
        description: `${currentBatter.name}의 깔끔한 ${isTriple ? '3루타' : '2루타'}!`,
      };
    } else if (random < baseSuccess) {
      result = {
        type: 'single',
        description: `${currentBatter.name}의 안타! 주자가 진루합니다.`,
      };
    } else if (random < baseSuccess + 0.1) {
      result = {
        type: 'walk',
        description: `${currentBatter.name}, 볼넷으로 출루!`,
      };
    } else if (random < 0.75) {
      result = {
        type: 'strikeout',
        description: `${currentBatter.name}, 삼진 아웃!`,
      };
    } else {
      result = {
        type: 'out',
        description: `${currentBatter.name}, 아웃!`,
      };
    }

    // 투구 정보를 로그에 추가
    const pitchLog = `${currentPitcher.name}: ${pitch.type} ${pitch.speed}km/h (${pitch.location})`;
    setGameLog((prev) => [`[투구] ${pitchLog}`, ...prev]);

    return result;
  };

  const updateGameState = (result: AtBatResult) => {
    const newState = { ...matchInfo };
    let runsScored = 0;

    switch (result.type) {
      case 'homerun':
        runsScored = 1;
        if (newState.runners[0]) runsScored++;
        if (newState.runners[1]) runsScored++;
        if (newState.runners[2]) runsScored++;
        newState.runners = [null, null, null];
        break;

      case 'triple':
        if (newState.runners[0]) runsScored++;
        if (newState.runners[1]) runsScored++;
        if (newState.runners[2]) runsScored++;
        newState.runners = [null, null, currentBatter];
        break;

      case 'double':
        if (newState.runners[1]) runsScored++;
        if (newState.runners[2]) runsScored++;
        newState.runners = [
          null,
          currentBatter,
          newState.runners[0] ? currentBatter : null,
        ];
        break;

      case 'single':
        if (newState.runners[2]) runsScored++;
        if (newState.runners[1]) runsScored++;
        newState.runners = [
          currentBatter,
          newState.runners[0] ? currentBatter : null,
          newState.runners[1] ? currentBatter : null,
        ];
        break;

      case 'walk':
        if (newState.runners[0] && newState.runners[1] && newState.runners[2]) {
          runsScored++;
        }
        if (newState.runners[0] && newState.runners[1]) {
          newState.runners[2] = currentBatter;
        }
        if (newState.runners[0]) {
          newState.runners[1] = currentBatter;
        }
        newState.runners[0] = currentBatter;
        break;

      case 'out':
      case 'strikeout':
        newState.ball_count.o++;
        if (newState.ball_count.o >= 3) {
          newState.ball_count.o = 0;
          newState.runners = [null, null, null];
          newState.currentBatter = 0;

          // Inning Flip Logic
          if (newState.is_top) {
            newState.is_top = false;
          } else {
            newState.is_top = true;
            newState.inning++;
          }
        }
        break;
    }

    if (runsScored > 0) {
      if (matchInfo.is_top) {
        newState.score.away += runsScored;
      } else {
        newState.score.home += runsScored;
      }
    }

    if (result.type !== 'out' && result.type !== 'strikeout') {
      newState.currentBatter = (newState.currentBatter + 1) % 9;
    } else if (newState.ball_count.o < 3) {
      newState.currentBatter = (newState.currentBatter + 1) % 9;
    }

    newState.pitches += Math.floor(Math.random() * 5) + 3;
    newState.currentPitcher.stamina = Math.max(0, 100 - (newState.pitches / 100) * 100);

    return newState;
  };

  const handlePitch = () => {
    const userIdStr = localStorage.getItem('userId');
    const userId = userIdStr ? Number(userIdStr) : 0;

    console.log(`[DEBUG] Pitch Requested - matchId: ${matchId}, userId: ${userId}`);

    if (!stompClient.current?.connected || isSimulating || isGameOver) {
      console.warn(`[DEBUG] Cannot Pitch - connected: ${stompClient.current?.connected}, simulating: ${isSimulating}, gameOver: ${isGameOver}`);
      return;
    }

    setIsSimulating(true);

    const payload = {
      matchId: matchId,
      type: 'PITCH',
      senderId: userId,
      inning: matchInfo.inning
    };

    console.log("[DEBUG] Sending PITCH payload:", payload);

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

          // 서버가 보내준 최신 경기 상태로 화면 동기화
          if (response.matchInfo) {
            const info = response.matchInfo;

            // 백엔드(Java/Kotlin) 객체를 프론트엔드 MatchInfo 타입으로 정밀 매핑
            setMatchInfo(prev => {
              const updatedInfo = {
                ...prev,
                ...info,
                match_id: info.matchId || info.match_id || matchId,
                score: info.score || prev.score,
                is_top: info.top ?? info.is_top ?? prev.is_top,
                inning: info.inning || prev.inning,
                ball_count: info.ballCount || info.ball_count || prev.ball_count,
                // 백엔드의 runnerIds(ID)를 프론트엔드의 Hitter 객체로 매핑
                runners: (info.runners?.runnerIds || [null, null, null]).map((id: any) => {
                  if (id === null || id === undefined) return null;
                  const idNum = Number(id);
                  return myLineup.batting.find(p => p?.id === idNum) ||
                    opponentLineup.batting.find(p => p?.id === idNum) ||
                    { id: idNum, name: '주자', team: '', position: '타자', image_url: '', stats: { avg: 0, ops: 0 } } as any;
                }),
                currentBatter: info.currentBatterIndex ?? info.currentBatter ?? prev.currentBatter,
              };
              console.log("[DEBUG] Updated matchInfo state:", updatedInfo);
              return updatedInfo;
            });
          }

          // 중계 멘트 추가
          if (response.description) {
            setGameLog((prev) => [response.description, ...prev]);
          }

          setIsSimulating(false); // 투구 애니메이션 종료
        });
      },
    });

    client.activate();
    stompClient.current = client;

    return () => client.deactivate(); // 컴포넌트 나갈 때 연결 해제
  }, [matchId]);

  // 자동 진행
  useEffect(() => {
    if (autoPlay && !isSimulating && !isGameOver) {
      const timer = setTimeout(() => {
        handlePitch();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, isSimulating, matchInfo, isGameOver]);

  useEffect(() => {
    if (isGameOver) {
      setAutoPlay(false);
      onGameEnd(matchInfo.score, matchRecords);
    }
  }, [isGameOver]);

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
          type: 'SUBSTITUTION',
          senderId: userId,
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
    // ... 생략 ...
    setShowPitcherDialog(false);
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
          type: 'SUBSTITUTION',
          senderId: userId,
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
          type: 'SUBSTITUTION',
          senderId: userId,
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
              lineup={isMyTeamBatting ? opponentLineup.batting : myLineup.batting}
              fieldPositions={isMyTeamBatting ? opponentLineup.fieldPositions : myLineup.fieldPositions}
              currentBatter={currentBatter}
              currentPitcher={currentPitcher}
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
                      src={`/assets/logos/${isHome ? opponentTeam : myTeam}.png`}
                      alt="Away Team Logo"
                      className="w-full h-full object-contain drop-shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                      {isHome ? opponentTeam?.[0] : myTeam?.[0]}
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
                      src={`/assets/logos/${isHome ? myTeam : opponentTeam}.png`}
                      alt="Home Team Logo"
                      className="w-full h-full object-contain drop-shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                      {isHome ? myTeam?.[0] : opponentTeam?.[0]}
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
                <BatterCard player={currentBatter} />
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
                            src={`/assets/logos/${myTeam}.png`}
                            alt={myTeam}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div
                            className="hidden w-4 h-4 rounded-full"
                            style={{ backgroundColor: myTheme?.primary }}
                          />
                        </div>
                        {myTeam}
                      </h4>
                      <div className="space-y-1">
                        {myLineup.batting.map((player, idx) => (
                          <div key={idx} className="text-m p-2.5 bg-white/50 rounded border border-black/5 text-gray-800 flex justify-between">
                            <span>{idx + 1}. {player.name} ({player.position})</span>
                            <span className="text-blue-600 font-bold">{player.stats.avg.toFixed(3)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 상대팀 라인업 */}
                    <div>
                      <h4 className="font-extrabold text-lg text-black mb-3 flex items-center gap-2">
                        <div className="w-6 h-6 relative flex items-center justify-center">
                          <img
                            src={`/assets/logos/${opponentTeam}.png`}
                            alt={opponentTeam}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div
                            className="hidden w-4 h-4 rounded-full"
                            style={{ backgroundColor: opponentTheme?.primary }}
                          />
                        </div>
                        {opponentTeam}
                      </h4>
                      <div className="space-y-1">
                        {opponentLineup.batting.map((player, idx) => (
                          <div key={idx} className="text-m p-2.5 bg-white/50 rounded border border-black/5 text-gray-800 flex justify-between">
                            <span>{idx + 1}. {player.name} ({player.position})</span>
                            <span className="text-blue-600 font-bold">{player.stats.avg.toFixed(3)}</span>
                          </div>
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
              {/* 투구 버튼 */}
              <Button
                onClick={handlePitch}
                disabled={isSimulating || isGameOver}
                className="w-full h-12 font-black text-base shadow-xl text-white border-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: myTheme?.primary || '#22c55e',
                  boxShadow: `0 0 20px ${myTheme?.primary}60`
                }}
              >
                {isSimulating ? '투구 중...' : '⚾ 투구'}
              </Button>

              {/* 자동 진행 */}
              <Button
                onClick={() => setAutoPlay(!autoPlay)}
                disabled={isGameOver}
                variant={autoPlay ? 'destructive' : 'default'}
                className={`w-full h-10 font-bold text-sm ${autoPlay ? '' : 'bg-black hover:bg-gray-800 text-white'}`}
              >
                {autoPlay ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    중지
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    자동
                  </>
                )}
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
            </div>
          </Card>
        </div>
      </div>

      {/* Management Dialogs */}
      <Dialog open={showPitcherDialog} onOpenChange={setShowPitcherDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>투수 교체</DialogTitle>
            <DialogDescription>교체할 투수를 선택하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {myLineup.pitchers.middle.map((pitcher, idx) =>
              pitcher ? (
                <Button key={idx} variant="outline" className="w-full justify-start" onClick={() => handlePitcherChange(pitcher)}>
                  {pitcher.name} - ERA: {pitcher.stats.era.toFixed(2)}
                </Button>
              ) : null
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPinchHitterDialog} onOpenChange={setShowPinchHitterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>대타</DialogTitle>
            <DialogDescription>대타를 선택하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {myLineup.bench.map((player, idx) =>
              player ? (
                <Button key={idx} variant="outline" className="w-full justify-start" onClick={() => handlePinchHitter(player)}>
                  {player.name} - AVG: {player.stats.avg.toFixed(3)}
                </Button>
              ) : null
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPinchRunnerDialog} onOpenChange={setShowPinchRunnerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>대주자</DialogTitle>
            <DialogDescription>대주자를 선택하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {myLineup.bench.map((player, idx) =>
              player ? (
                <Button key={idx} variant="outline" className="w-full justify-start" onClick={() => handlePinchRunner(player, selectedRunnerBase as 0 | 1 | 2)}>
                  {player.name}
                </Button>
              ) : null
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}