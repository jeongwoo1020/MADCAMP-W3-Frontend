import { useState, useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/app/components/ui/dialog';
import { Repeat, User, Users, TrendingUp, Target, Play, Pause } from 'lucide-react';

interface SimulationGameProps {
  myLineup: Lineup;
  opponentLineup: Lineup;
  stadium: Stadium;
  isHome: boolean;
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
  onGameEnd,
}: SimulationGameProps) {
  // DB 스키마에 맞춘 MatchInfo 상태
  const [matchInfo, setMatchInfo] = useState<MatchInfo>({
    match_id: 'temp-' + Date.now(),
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

  const [isHomeTeam, setIsHomeTeam] = useState(!isHome);
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

  const currentLineup = isHomeTeam ? myLineup : opponentLineup;
  const currentBatter = currentLineup.batting[matchInfo.currentBatter];
  const currentPitcher = isHomeTeam
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

          if (isHomeTeam) {
            setIsHomeTeam(false);
          } else {
            setIsHomeTeam(true);
            newState.inning++;
            newState.is_top = true;
          }
        }
        break;
    }

    if (runsScored > 0) {
      if (isHomeTeam) {
        newState.score.home += runsScored;
      } else {
        newState.score.away += runsScored;
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
    if (isSimulating || isGameOver) return;

    setIsSimulating(true);
    setTimeout(() => {
      const result = simulateAtBat();
      setLastResult(result);
      const newState = updateGameState(result);
      setMatchInfo(newState);

      setGameLog((prev) => [
        `[${newState.inning}회 ${isHomeTeam ? '말' : '초'}] ${result.description}`,
        ...prev,
      ]);

      setMatchRecords((prev) => [
        ...prev,
        {
          match_id: matchInfo.match_id,
          inning: newState.inning,
          event_type: 'AT_BAT',
          data: { result, pitch: currentPitch },
          actor_id: currentBatter?.id || 0,
          description: result.description,
        },
      ]);

      setIsSimulating(false);
    }, 800);
  };

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
    setGameLog((prev) => [`[교체] ${currentPitcher?.name} → ${pitcher.name} 투수 교체`, ...prev]);
    setMatchRecords((prev) => [
      ...prev,
      {
        match_id: matchInfo.match_id,
        inning: matchInfo.inning,
        event_type: 'SUBSTITUTION',
        data: { type: 'pitcher', player: pitcher },
        actor_id: pitcher.id,
        description: `투수 교체: ${pitcher.name}`,
      },
    ]);
    setShowPitcherDialog(false);
  };

  const handlePinchHitter = (player: Hitter) => {
    const newLineup = { ...currentLineup };
    newLineup.batting[matchInfo.currentBatter] = player;
    setGameLog((prev) => [`[교체] ${currentBatter?.name} → ${player.name} 대타`, ...prev]);
    setMatchRecords((prev) => [
      ...prev,
      {
        match_id: matchInfo.match_id,
        inning: matchInfo.inning,
        event_type: 'SUBSTITUTION',
        data: { type: 'pinch_hitter', player: player },
        actor_id: player.id,
        description: `대타: ${player.name}`,
      },
    ]);
    setShowPinchHitterDialog(false);
  };

  const handlePinchRunner = (player: Hitter, base: 0 | 1 | 2) => {
    const newRunners = [...matchInfo.runners];
    const oldRunner = newRunners[base];
    newRunners[base] = player;
    setMatchInfo({ ...matchInfo, runners: newRunners });
    setGameLog((prev) => [`[교체] ${oldRunner?.name} → ${player.name} 대주자 (${base + 1}루)`, ...prev]);
    setMatchRecords((prev) => [
      ...prev,
      {
        match_id: matchInfo.match_id,
        inning: matchInfo.inning,
        event_type: 'SUBSTITUTION',
        data: { type: 'pinch_runner', player: player, base },
        actor_id: player.id,
        description: `대주자: ${player.name} (${base + 1}루)`,
      },
    ]);
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
      <div className="w-full max-w-[1600px] relative z-10 pt-10 px-6 mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h2 className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(57,255,20,0.6)] tracking-tighter">
              게임 시뮬레이션
            </h2>
          </div>
          <p className="text-white text-2xl">실시간 경기 중계를 보고 작전을 세워보세요</p>
        </div>
      </div>

      {/* 상단 영역: 2:6:2 비율 그리드 */}
      <div className="flex-1 grid grid-cols-10 gap-4 relative z-10">
        {/* 좌측: 스코어보드 & BSO (2칸) */}
        <div className="col-span-2 flex flex-col gap-4">
          {/* 스코어보드 */}
          <Card className="p-4 bg-white/70 backdrop-blur-md border border-white/20 shadow-2xl">
            {/* 원정팀 */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-black/10">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white/40"
                  style={{
                    backgroundColor: isHome ? opponentTheme?.primary : myTheme?.primary,
                  }}
                />
                <div>
                  <div className="text-xs text-gray-600 font-bold">원정</div>
                  <div className="font-black text-black text-sm">{isHome ? opponentTeam : myTeam}</div>
                </div>
              </div>
              <div className="text-4xl font-black text-black ml-4">{matchInfo.score.away}</div>
            </div>

            {/* 홈팀 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white/40"
                  style={{ backgroundColor: isHome ? myTheme?.primary : opponentTheme?.primary }}
                />
                <div>
                  <div className="text-xs text-gray-600 font-bold">홈</div>
                  <div className="font-black text-black text-sm">{isHome ? myTeam : opponentTeam}</div>
                </div>
              </div>
              <div className="text-4xl font-black text-black ml-4">{matchInfo.score.home}</div>
            </div>
          </Card>

          {/* BSO 카운트 & 이닝 */}
          {/* BSO 카운트 & 이닝 */}
          <Card className="flex-1 p-4 bg-white/70 backdrop-blur-md border border-white/20 shadow-2xl overflow-auto">
            {/* 이닝 */}
            <div className="text-center mb-3 pb-3 border-b border-black/10">
              <div className="text-xs text-yellow-600 font-bold">{stadium.name}</div>
              <div className="text-2xl font-black text-black">
                {matchInfo.inning}회 {isHomeTeam ? '말' : '초'}
              </div>
            </div>

            {/* BSO */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-black font-black text-sm w-4">B</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full border-2 ${i < matchInfo.ball_count.b
                        ? 'bg-green-500 border-green-400 shadow-lg shadow-green-500/50'
                        : 'bg-black/10 border-black/20'
                        }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-black font-black text-sm w-4">S</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full border-2 ${i < matchInfo.ball_count.s
                        ? 'bg-yellow-500 border-yellow-400 shadow-lg shadow-yellow-500/50'
                        : 'bg-black/10 border-black/20'
                        }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-black font-black text-sm w-4">O</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full border-2 ${i < matchInfo.ball_count.o
                        ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/50'
                        : 'bg-black/10 border-black/20'
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 주자 상황 */}
            <Separator className="my-3 bg-black/10" />
            <div className="flex justify-center">
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* 2루 */}
                  <rect
                    x="42"
                    y="5"
                    width="16"
                    height="16"
                    fill={matchInfo.runners[1] ? '#22c55e' : '#e5e7eb'}
                    stroke={matchInfo.runners[1] ? '#16a34a' : '#9ca3af'}
                    strokeWidth="2"
                    transform="rotate(45 50 13)"
                  />
                  {/* 3루 */}
                  <rect
                    x="5"
                    y="42"
                    width="16"
                    height="16"
                    fill={matchInfo.runners[2] ? '#22c55e' : '#e5e7eb'}
                    stroke={matchInfo.runners[2] ? '#16a34a' : '#9ca3af'}
                    strokeWidth="2"
                    transform="rotate(45 13 50)"
                  />
                  {/* 1루 */}
                  <rect
                    x="79"
                    y="42"
                    width="16"
                    height="16"
                    fill={matchInfo.runners[0] ? '#22c55e' : '#e5e7eb'}
                    stroke={matchInfo.runners[0] ? '#16a34a' : '#9ca3af'}
                    strokeWidth="2"
                    transform="rotate(45 87 50)"
                  />
                  {/* 홈 */}
                  <rect
                    x="42"
                    y="79"
                    width="16"
                    height="16"
                    fill="#fbbf24"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    transform="rotate(45 50 87)"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* 중앙: 야구장 다이아몬드 (6칸) */}
        <div className="col-span-6 flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center">
            <BaseballField
              runners={matchInfo.runners}
              currentBatter={currentBatter}
              currentPitcher={currentPitcher}
            />
          </div>
        </div>

        {/* 우측: 투수 & 타자 (2칸) */}
        <div className="col-span-2 flex flex-col gap-4">
          {/* 투수 정보 */}
          <Card className="flex-1 p-4 bg-white/70 backdrop-blur-md border border-white/20 shadow-2xl overflow-auto">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-black">투수</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-black text-xl text-black">{currentPitcher?.name}</span>
                <Badge className="bg-purple-600 text-white text-xs">{currentPitcher?.pitcherRole}</Badge>
              </div>
              <div className="text-xs text-gray-600">{currentPitcher?.team}</div>
              <Separator className="bg-black/10" />
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/50 border border-black/5 p-2 rounded">
                  <div className="text-gray-500 text-xs font-bold">ERA</div>
                  <div className="font-black text-black text-sm">{currentPitcher?.stats.era?.toFixed(2)}</div>
                </div>
                <div className="bg-white/50 border border-black/5 p-2 rounded">
                  <div className="text-gray-500 text-xs font-bold">WHIP</div>
                  <div className="font-black text-black text-sm">{currentPitcher?.stats.whip?.toFixed(2)}</div>
                </div>
                <div className="bg-white/50 border border-black/5 p-2 rounded">
                  <div className="text-gray-500 text-xs font-bold">K</div>
                  <div className="font-black text-black text-sm">{currentPitcher?.stats.k}</div>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1 text-black font-bold">
                  <span>스태미나</span>
                  <span>{Math.round(matchInfo.currentPitcher.stamina)}%</span>
                </div>
                <Progress value={matchInfo.currentPitcher.stamina} className="h-2 bg-black/10" />
              </div>
              <div className="text-xs text-gray-600 text-center bg-white/50 border border-black/5 p-1.5 rounded">
                {matchInfo.pitches} 투구
              </div>
            </div>
          </Card>

          {/* 타자 정보 */}
          <Card className="flex-1 p-4 bg-white/70 backdrop-blur-md border border-white/20 shadow-2xl overflow-auto">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-black">타자</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-black text-xl text-black">{currentBatter?.name}</span>
                <Badge variant="outline" className="border-blue-600 text-blue-600 text-sm font-bold">{matchInfo.currentBatter + 1}번</Badge>
              </div>
              <div className="text-xs text-gray-600">
                {currentBatter?.team} • {currentBatter?.position}
              </div>
              <Separator className="bg-black/10" />
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/50 border border-black/5 p-2 rounded">
                  <div className="text-gray-500 text-xs font-bold">AVG</div>
                  <div className="font-black text-black text-sm">{currentBatter?.stats.avg?.toFixed(3)}</div>
                </div>
                <div className="bg-white/50 border border-black/5 p-2 rounded">
                  <div className="text-gray-500 text-xs font-bold">OPS</div>
                  <div className="font-black text-blue-600 text-sm">
                    {currentBatter?.stats.ops?.toFixed(3)}
                  </div>
                </div>
                <div className="bg-white/50 border border-black/5 p-2 rounded">
                  <div className="text-gray-500 text-xs font-bold">HR</div>
                  <div className="font-black text-black text-sm">{currentBatter?.stats.hr}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 하단 영역: 경기 로그 & Management */}
      <div className="grid grid-cols-10 gap-4">
        {/* 경기 로그 (탭 구조) - 7칸 */}
        <div className="col-span-7">
          <Card className="p-4 bg-white/70 backdrop-blur-md border border-white/20 shadow-2xl">
            <Tabs defaultValue="log" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-3 bg-black/5">
                <TabsTrigger value="log" className="data-[state=active]:bg-white data-[state=active]:text-black">경기 로그</TabsTrigger>
                <TabsTrigger value="lineup" className="data-[state=active]:bg-white data-[state=active]:text-black">라인업</TabsTrigger>
              </TabsList>
              <TabsContent value="log">
                <ScrollArea className="h-[200px]">
                  <div className="space-y-1.5">
                    {gameLog.map((log, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2 bg-white/50 rounded border border-black/5 text-gray-800"
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="lineup">
                <ScrollArea className="h-[200px]">
                  <div className="grid grid-cols-2 gap-4">
                    {/* 우리팀 라인업 */}
                    <div>
                      <h4 className="font-bold text-black mb-2 flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: myTheme?.primary }}
                        />
                        {myTeam}
                      </h4>
                      <div className="space-y-1">
                        {myLineup.batting.map((player, idx) => (
                          <div key={idx} className="text-xs p-2 bg-white/50 rounded border border-black/5 text-gray-800 flex justify-between">
                            <span>{idx + 1}. {player.name} ({player.position})</span>
                            <span className="text-blue-600">{player.stats.avg.toFixed(3)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 상대팀 라인업 */}
                    <div>
                      <h4 className="font-bold text-black mb-2 flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: opponentTheme?.primary }}
                        />
                        {opponentTeam}
                      </h4>
                      <div className="space-y-1">
                        {opponentLineup.batting.map((player, idx) => (
                          <div key={idx} className="text-xs p-2 bg-white/50 rounded border border-black/5 text-gray-800 flex justify-between">
                            <span>{idx + 1}. {player.name} ({player.position})</span>
                            <span className="text-blue-600">{player.stats.avg.toFixed(3)}</span>
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

      {/* Dialogs */}
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