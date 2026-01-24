import { useState, useEffect } from 'react';
import { Lineup, MatchInfo, AtBatResult, Hitter, Pitcher, Stadium, MatchRecord } from '@/app/types';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Separator } from '@/app/components/ui/separator';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { TEAM_THEMES } from '@/app/data/teamThemes';
import { BaseballField } from '@/app/components/BaseballField';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/app/components/ui/dialog';
import { Repeat, User, Users, TrendingUp, Target } from 'lucide-react';

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
  const [leftPanelTab, setLeftPanelTab] = useState<'current' | 'lineup'>('current');
  const [lineupSubTab, setLineupSubTab] = useState<'my' | 'opponent'>('my');

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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-[1600px] mx-auto">
        {/* 상단 점수판 */}
        <Card className="mb-4 p-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full"
                  style={{
                    backgroundColor: isHome ? opponentTheme?.primary : myTheme?.primary,
                  }}
                />
                <div>
                  <div className="text-xs opacity-70">원정</div>
                  <div className="font-bold">{isHome ? opponentTeam : myTeam}</div>
                </div>
              </div>
              <div className="text-4xl font-bold">{matchInfo.score.away}</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {matchInfo.inning}회 {isHomeTeam ? '말' : '초'}
              </div>
              <div className="text-sm opacity-70">{stadium.name}</div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">{matchInfo.score.home}</div>
              <div className="flex items-center gap-2">
                <div>
                  <div className="text-xs opacity-70">홈</div>
                  <div className="font-bold">{isHome ? myTeam : opponentTeam}</div>
                </div>
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: isHome ? myTheme?.primary : opponentTheme?.primary }}
                />
              </div>
            </div>
          </div>

          {/* 아웃카운트 & 주자 상황 */}
          <div className="mt-4 flex items-center justify-center gap-8">
            {/* BSO 카운트 */}
            <div className="flex flex-col gap-2 items-start bg-white/10 p-3 rounded">
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-70 font-bold w-4">B</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-5 h-5 rounded-full ${
                        i < matchInfo.ball_count.b ? 'bg-green-500' : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-70 font-bold w-4">S</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`w-5 h-5 rounded-full ${
                        i < matchInfo.ball_count.s ? 'bg-yellow-500' : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-70 font-bold w-4">O</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`w-5 h-5 rounded-full ${
                        i < matchInfo.ball_count.o ? 'bg-red-500' : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 베이스 다이아몬드 */}
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* 2루 */}
                <rect
                  x="42"
                  y="5"
                  width="16"
                  height="16"
                  fill={matchInfo.runners[1] ? '#22c55e' : '#ffffff20'}
                  transform="rotate(45 50 13)"
                />
                {/* 3루 */}
                <rect
                  x="5"
                  y="42"
                  width="16"
                  height="16"
                  fill={matchInfo.runners[2] ? '#22c55e' : '#ffffff20'}
                  transform="rotate(45 13 50)"
                />
                {/* 1루 */}
                <rect
                  x="79"
                  y="42"
                  width="16"
                  height="16"
                  fill={matchInfo.runners[0] ? '#22c55e' : '#ffffff20'}
                  transform="rotate(45 87 50)"
                />
                {/* 홈 */}
                <rect x="42" y="79" width="16" height="16" fill="#ffffff40" transform="rotate(45 50 87)" />
              </svg>
            </div>

            {/* 타자 및 타순 정보 */}
            <div className="bg-white/10 p-3 rounded text-center">
              <div className="text-2xl font-bold mb-1">{matchInfo.currentBatter + 1}번</div>
              <div className="text-sm opacity-70 whitespace-nowrap">{currentBatter?.name}</div>
              <div className="text-xs opacity-70 whitespace-nowrap mt-1">
                투수수 {currentPitcher?.name}
              </div>
            </div>
          </div>
        </Card>

        {/* 상단: 투수/타자 정보 | 경기장 (3:7) */}
        <div className="flex gap-4 mb-4" style={{ minHeight: '600px' }}>
          {/* 좌측: 투수/타자 정보 / 라인업 (30%) */}
          <div className="w-[30%] flex flex-col">
            {/* 탭 버튼 */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={leftPanelTab === 'current' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setLeftPanelTab('current')}
              >
                현재 상황
              </Button>
              <Button
                variant={leftPanelTab === 'lineup' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setLeftPanelTab('lineup')}
              >
                라인업
              </Button>
            </div>

            {/* 현재 상황 탭 */}
            {leftPanelTab === 'current' && (
              <div className="space-y-4">
                {/* 투수 정보 */}
                <Card className="p-4">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    투수
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">{currentPitcher?.name}</span>
                      <Badge>{currentPitcher?.pitcherRole}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{currentPitcher?.team}</div>
                    <Separator />
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">ERA</div>
                        <div className="font-bold">{currentPitcher?.stats.era?.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">WHIP</div>
                        <div className="font-bold">{currentPitcher?.stats.whip?.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">K</div>
                        <div className="font-bold">{currentPitcher?.stats.k}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>스태미나</span>
                        <span>{Math.round(matchInfo.currentPitcher.stamina)}%</span>
                      </div>
                      <Progress value={matchInfo.currentPitcher.stamina} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {matchInfo.pitches} 투구
                    </div>
                  </div>
                </Card>

                {/* 타자 정보 */}
                <Card className="p-4">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    타자
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">{currentBatter?.name}</span>
                      <Badge variant="outline">{matchInfo.currentBatter + 1}번</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {currentBatter?.team} • {currentBatter?.position}
                    </div>
                    <Separator />
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">AVG</div>
                        <div className="font-bold">{currentBatter?.stats.avg?.toFixed(3)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">OPS</div>
                        <div className="font-bold text-blue-600">
                          {currentBatter?.stats.ops?.toFixed(3)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">HR</div>
                        <div className="font-bold">{currentBatter?.stats.hr}</div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 투구 정보 */}
                {currentPitch && (
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      최근 투구
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">{currentPitch.type}</span>
                        <Badge variant="secondary" className="text-lg">
                          {currentPitch.speed}km/h
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{currentPitch.location}</div>
                    </div>
                  </Card>
                )}

                {/* 결과 표시 */}
                {lastResult && (
                  <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                    <h3 className="font-bold mb-2">타석 결과</h3>
                    <div className="text-sm">{lastResult.description}</div>
                  </Card>
                )}
              </div>
            )}

            {/* 라인업 탭 */}
            {leftPanelTab === 'lineup' && (
              <div className="flex-1 flex flex-col">
                {/* 서브 탭 버튼 */}
                <div className="flex gap-2 mb-3">
                  <Button
                    variant={lineupSubTab === 'my' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setLineupSubTab('my')}
                  >
                    내 라인업
                  </Button>
                  <Button
                    variant={lineupSubTab === 'opponent' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setLineupSubTab('opponent')}
                  >
                    상대 라인업
                  </Button>
                </div>

                <ScrollArea className="flex-1">
                  {/* 내 팀 라인업 */}
                  {lineupSubTab === 'my' && (
                    <Card className="p-4" style={{ borderLeft: `4px solid ${myTheme?.primary}` }}>
                      <h3 className="font-bold mb-3 flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: myTheme?.primary }}
                        />
                        {myTeam}
                      </h3>
                      
                      {/* 타선 */}
                      <div className="space-y-2 mb-3">
                        <div className="text-xs font-bold text-muted-foreground">타선</div>
                        {myLineup.batting.map((player, idx) => (
                          player && (
                            <div
                              key={idx}
                              className={`flex items-center justify-between text-sm p-2 rounded ${
                                !isHome && isHomeTeam === false && matchInfo.currentBatter === idx
                                  ? 'bg-blue-100 border border-blue-300'
                                  : isHome && isHomeTeam === true && matchInfo.currentBatter === idx
                                  ? 'bg-blue-100 border border-blue-300'
                                  : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs w-5">{idx + 1}</span>
                                <span className="font-medium">{player.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {player.position}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  .{Math.round((player.stats.avg || 0) * 1000)}
                                </span>
                              </div>
                            </div>
                          )
                        ))}
                      </div>

                      <Separator className="my-3" />

                      {/* 투수진 */}
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-muted-foreground">투수진</div>
                        {myLineup.pitchers.starter && (
                          <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                            <span className="font-medium">{myLineup.pitchers.starter.name}</span>
                            <Badge className="text-xs">선발</Badge>
                          </div>
                        )}
                        {myLineup.pitchers.middle.map((pitcher, idx) =>
                          pitcher ? (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
                            >
                              <span className="font-medium">{pitcher.name}</span>
                              <Badge variant="outline" className="text-xs">
                                중간
                              </Badge>
                            </div>
                          ) : null
                        )}
                        {myLineup.pitchers.closer && (
                          <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                            <span className="font-medium">{myLineup.pitchers.closer.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              마무리
                            </Badge>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* 상대 팀 라인업 */}
                  {lineupSubTab === 'opponent' && (
                    <Card className="p-4" style={{ borderLeft: `4px solid ${opponentTheme?.primary}` }}>
                      <h3 className="font-bold mb-3 flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: opponentTheme?.primary }}
                        />
                        {opponentTeam}
                      </h3>
                      
                      {/* 타선 */}
                      <div className="space-y-2 mb-3">
                        <div className="text-xs font-bold text-muted-foreground">타선</div>
                        {opponentLineup.batting.map((player, idx) => (
                          player && (
                            <div
                              key={idx}
                              className={`flex items-center justify-between text-sm p-2 rounded ${
                                isHome && isHomeTeam === false && matchInfo.currentBatter === idx
                                  ? 'bg-blue-100 border border-blue-300'
                                  : !isHome && isHomeTeam === true && matchInfo.currentBatter === idx
                                  ? 'bg-blue-100 border border-blue-300'
                                  : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs w-5">{idx + 1}</span>
                                <span className="font-medium">{player.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {player.position}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  .{Math.round((player.stats.avg || 0) * 1000)}
                                </span>
                              </div>
                            </div>
                          )
                        ))}
                      </div>

                      <Separator className="my-3" />

                      {/* 투수진 */}
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-muted-foreground">투수진</div>
                        {opponentLineup.pitchers.starter && (
                          <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                            <span className="font-medium">{opponentLineup.pitchers.starter.name}</span>
                            <Badge className="text-xs">선발</Badge>
                          </div>
                        )}
                        {opponentLineup.pitchers.middle.map((pitcher, idx) =>
                          pitcher ? (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
                            >
                              <span className="font-medium">{pitcher.name}</span>
                              <Badge variant="outline" className="text-xs">
                                중간
                              </Badge>
                            </div>
                          ) : null
                        )}
                        {opponentLineup.pitchers.closer && (
                          <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                            <span className="font-medium">{opponentLineup.pitchers.closer.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              마무리
                            </Badge>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>

          {/* 우측: 경기장 & 컨트롤 (70%) */}
          <div className="w-[70%] flex flex-col gap-4">
            {/* 실시간 수비 포지션 화면 */}
            <Card className="p-4 flex-1 flex flex-col">
              <div className="flex-1">
                <BaseballField
                  lineup={currentLineup.batting}
                  fieldPositions={currentLineup.fieldPositions}
                  currentBatter={currentBatter}
                  currentPitcher={currentPitcher}
                />
              </div>
            </Card>

            {/* 컨트롤 버튼 */}
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setAutoPlay(!autoPlay)}
                  variant={autoPlay ? 'default' : 'outline'}
                  className="w-full"
                  disabled={isGameOver}
                >
                  {autoPlay ? '⏸ 일시정지' : '▶ 자동 진행'}
                </Button>
                <Button onClick={handlePitch} disabled={isSimulating || autoPlay || isGameOver} className="w-full">
                  ⚾ 투구
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* 하단: 매니지먼트 | 게임 로그 (3:7) */}
        <div className="grid grid-cols-10 gap-4">
          {/* 좌측: 매니지먼트 (30%) */}
          <div className="col-span-3">
            <Card className="p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                매니지먼트
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setShowPitcherDialog(true)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isGameOver}
                >
                  <Repeat className="w-4 h-4 mr-1" />
                  투수 교체
                </Button>
                <Button
                  onClick={() => setShowPinchHitterDialog(true)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isGameOver}
                >
                  대타
                </Button>
                <Button
                  onClick={() => setShowPinchRunnerDialog(true)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isGameOver}
                >
                  대주자
                </Button>
                <Button 
                  onClick={() => {
                    setGameLog((prev) => [
                      `[매니지먼트] 도루 시도`,
                      ...prev,
                    ]);
                  }}
                  variant="outline" 
                  size="sm" 
                  className="w-full" 
                  disabled={isGameOver}
                >
                  도루
                </Button>
                <Button 
                  onClick={() => {
                    setGameLog((prev) => [
                      `[매니지먼트] 희생번트 지시`,
                      ...prev,
                    ]);
                  }}
                  variant="outline" 
                  size="sm" 
                  className="w-full col-span-2" 
                  disabled={isGameOver}
                >
                  희생번트
                </Button>
              </div>
            </Card>
          </div>

          {/* 우측: 게임 로그 (70%) */}
          <div className="col-span-7">
            <Card className="p-4">
              <h3 className="font-bold mb-3">게임 로그</h3>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {gameLog.map((log, idx) => (
                    <div
                      key={idx}
                      className={`text-sm p-2 rounded ${
                        log.includes('[투구]')
                          ? 'bg-blue-50 text-blue-900'
                          : log.includes('[매니지먼트]')
                          ? 'bg-purple-50 text-purple-900'
                          : 'bg-gray-50'
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>

      {/* 투수 교체 다이얼로그 */}
      <Dialog open={showPitcherDialog} onOpenChange={setShowPitcherDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>투수 교체</DialogTitle>
            <DialogDescription>교체할 투수를 선택하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {currentLineup.pitchers.middle.map((pitcher, idx) => 
              pitcher ? (
                <Button
                  key={idx}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => {
                    setGameLog((prev) => [
                      `[매니지먼트] 투수 교체: ${pitcher.name} 등판`,
                      ...prev,
                    ]);
                    setShowPitcherDialog(false);
                  }}
                >
                  <span className="font-bold">{pitcher.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ERA {pitcher.stats.era?.toFixed(2)}
                  </span>
                </Button>
              ) : null
            )}
            {currentLineup.pitchers.closer && (
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => {
                  setGameLog((prev) => [
                    `[매니지먼트] 투수 교체: ${currentLineup.pitchers.closer?.name} 등판 (마무리)`,
                    ...prev,
                  ]);
                  setShowPitcherDialog(false);
                }}
              >
                <span className="font-bold">{currentLineup.pitchers.closer.name}</span>
                <Badge>마무리</Badge>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 대타 다이얼로그 */}
      <Dialog open={showPinchHitterDialog} onOpenChange={setShowPinchHitterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>대타 선택</DialogTitle>
            <DialogDescription>대타로 내보낼 선수를 선택하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {currentLineup.bench.map((player, idx) => (
              player && (
                <Button
                  key={idx}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => {
                    setGameLog((prev) => [
                      `[매니지먼트] 대타: ${player.name} (${currentBatter?.name} → ${player.name})`,
                      ...prev,
                    ]);
                    setShowPinchHitterDialog(false);
                  }}
                >
                  <span className="font-bold">{player.name}</span>
                  <span className="text-sm text-muted-foreground">
                    AVG {player.stats.avg?.toFixed(3)}
                  </span>
                </Button>
              )
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 대주자 다이얼로그 */}
      <Dialog open={showPinchRunnerDialog} onOpenChange={setShowPinchRunnerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>대주자 선택</DialogTitle>
            <DialogDescription>대주자로 내보낼 선수를 선택하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {currentLineup.bench.map((player, idx) => (
              player && (
                <Button
                  key={idx}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => {
                    setGameLog((prev) => [`[매니지먼트] 대주자: ${player.name}`, ...prev]);
                    setShowPinchRunnerDialog(false);
                  }}
                >
                  <span className="font-bold">{player.name}</span>
                  <span className="text-sm text-muted-foreground">{player.position}</span>
                </Button>
              )
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}