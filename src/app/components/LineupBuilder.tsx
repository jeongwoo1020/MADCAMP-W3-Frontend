import { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Player, Lineup } from '@/app/types';
import { TEAMS, getFieldPlayers, getPitchersByRole } from '@/app/data/mockPlayers';
import { TEAM_THEMES } from '@/app/data/teamThemes';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Progress } from '@/app/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { Coins, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

const ItemTypes = {
  PLAYER: 'player',
};

const MAX_CREDITS = 2000; // 최대 크레딧 (테스트용)

// 수비 포지션 목록
const FIELD_POSITIONS = [
  { value: '1B', label: '1루수' },
  { value: '2B', label: '2루수' },
  { value: '3B', label: '3루수' },
  { value: 'SS', label: '유격수' },
  { value: 'LF', label: '좌익수' },
  { value: 'CF', label: '중견수' },
  { value: 'RF', label: '우익수' },
  { value: 'C', label: '포수' },
  { value: 'P', label: '투수' },
  { value: 'DH', label: '지명타자' },
];

interface DraggablePlayerProps {
  player: Player;
}

function DraggablePlayer({ player }: DraggablePlayerProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.PLAYER,
    item: { player },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div ref={drag} className={isDragging ? 'opacity-50' : ''}>
      <Card className="p-3 cursor-move hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">{player.name}</span>
              <Badge variant="outline" className="text-xs">
                {player.position}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{player.team}</div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-amber-600 font-bold">
              <Coins className="w-3 h-3" />
              <span className="text-sm">{player.salary}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              폼 {player.recentForm}/10
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
          {player.stats.avg !== undefined && (
            <div>
              <div className="text-muted-foreground">AVG</div>
              <div className="font-semibold">{player.stats.avg.toFixed(3)}</div>
            </div>
          )}
          {player.stats.ops !== undefined && (
            <div>
              <div className="text-muted-foreground">OPS</div>
              <div className="font-semibold text-blue-600">{player.stats.ops.toFixed(3)}</div>
            </div>
          )}
          {player.stats.hr !== undefined && (
            <div>
              <div className="text-muted-foreground">HR</div>
              <div className="font-semibold">{player.stats.hr}</div>
            </div>
          )}
          {player.stats.rbi !== undefined && (
            <div>
              <div className="text-muted-foreground">RBI</div>
              <div className="font-semibold">{player.stats.rbi}</div>
            </div>
          )}
          {player.stats.era !== undefined && (
            <div>
              <div className="text-muted-foreground">ERA</div>
              <div className="font-semibold text-green-600">{player.stats.era.toFixed(2)}</div>
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
              <div className="text-muted-foreground">K</div>
              <div className="font-semibold">{player.stats.k}</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

interface LineupSlotProps {
  index: number;
  player: Player | null;
  fieldPosition: string | null;
  onDrop: (player: Player, index: number) => void;
  onRemove: (index: number) => void;
  onPositionChange: (index: number, position: string) => void;
  label: string;
  usedPositions: (string | null)[];
}

function LineupSlot({ 
  index, 
  player, 
  fieldPosition,
  onDrop, 
  onRemove, 
  onPositionChange,
  label,
  usedPositions 
}: LineupSlotProps) {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.PLAYER,
    drop: (item: { player: Player }) => {
      if (item.player.position !== '투수') {
        onDrop(item.player, index);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // 사용 가능한 포지션 필터링
  const availablePositions = FIELD_POSITIONS.filter((pos) => {
    // 이미 선택된 포지션이면 현재 인덱스가 아닌 경우에만 제외
    return !usedPositions.some((used, idx) => used === pos.value && idx !== index);
  });

  return (
    <div
      ref={drop}
      className={`min-h-[70px] rounded border-2 border-dashed p-2 transition-colors text-sm ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
    >
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      {player ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs flex-1">
              <span className="font-semibold">{player.name}</span>
              <span className="text-muted-foreground ml-1">({player.position})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 text-amber-600 text-xs font-bold">
                <Coins className="w-3 h-3" />
                {player.salary}
              </div>
              <button
                onClick={() => onRemove(index)}
                className="p-0.5 hover:bg-red-100 rounded transition-colors"
                title="제거"
              >
                <X className="w-3 h-3 text-red-600" />
              </button>
            </div>
          </div>
          <Select value={fieldPosition || ''} onValueChange={(val) => onPositionChange(index, val)}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="수비 포지션 선택" />
            </SelectTrigger>
            <SelectContent>
              {availablePositions.map((pos) => (
                <SelectItem key={pos.value} value={pos.value} className="text-xs">
                  {pos.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
          드래그
        </div>
      )}
    </div>
  );
}

interface PitcherSlotProps {
  player: Player | null;
  onDrop: (player: Player) => void;
  onRemove: () => void;
  role: 'starter' | 'middle' | 'closer';
  label: string;
}

function PitcherSlot({ player, onDrop, onRemove, role, label }: PitcherSlotProps) {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.PLAYER,
    drop: (item: { player: Player }) => {
      if (item.player.position === '투수' && item.player.pitcherRole === role) {
        onDrop(item.player);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`min-h-[50px] rounded border-2 border-dashed p-2 transition-colors text-sm ${
        isOver ? 'border-green-500 bg-green-50' : 'border-gray-300'
      }`}
    >
      <div className="text-xs font-bold text-muted-foreground mb-1">{label}</div>
      {player ? (
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-xs flex-1">{player.name}</span>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 text-amber-600 text-xs font-bold">
              <Coins className="w-3 h-3" />
              {player.salary}
            </div>
            <button
              onClick={onRemove}
              className="p-0.5 hover:bg-red-100 rounded transition-colors"
              title="제거"
            >
              <X className="w-3 h-3 text-red-600" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          드래그
        </div>
      )}
    </div>
  );
}

interface BenchSlotProps {
  index: number;
  player: Player | null;
  onDrop: (player: Player, index: number) => void;
  onRemove: (index: number) => void;
  label: string;
}

function BenchSlot({ index, player, onDrop, onRemove, label }: BenchSlotProps) {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.PLAYER,
    drop: (item: { player: Player }) => {
      if (item.player.position !== '투수') {
        onDrop(item.player, index);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`min-h-[50px] rounded border-2 border-dashed p-2 transition-colors text-sm ${
        isOver ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
      }`}
    >
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      {player ? (
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs flex-1">
            <span className="font-semibold">{player.name}</span>
            <span className="text-muted-foreground ml-1">({player.position})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 text-amber-600 text-xs font-bold">
              <Coins className="w-3 h-3" />
              {player.salary}
            </div>
            <button
              onClick={() => onRemove(index)}
              className="p-0.5 hover:bg-red-100 rounded transition-colors"
              title="제거"
            >
              <X className="w-3 h-3 text-red-600" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
          드래그
        </div>
      )}
    </div>
  );
}

interface LineupBuilderProps {
  onLineupComplete: (lineup: Lineup) => void;
}

export function LineupBuilder({ onLineupComplete }: LineupBuilderProps) {
  const [lineup, setLineup] = useState<Lineup>({
    batting: Array(9).fill(null),
    pitchers: {
      starter: null,
      middle: Array(5).fill(null),
      closer: null,
    },
    bench: Array(5).fill(null),
    fieldPositions: Array(9).fill(null), // 수비 포지션
    hasDH: false, // 지명타자 사용 여부
  });

  // 자동 생성 함수
  const handleAutoGenerate = () => {
    // 전체 선수 풀 가져오기
    const allBatters: Player[] = [];
    const allStarters: Player[] = [];
    const allMiddles: Player[] = [];
    const allClosers: Player[] = [];

    // 모든 팀에서 선수 수집
    TEAMS.forEach((team) => {
      allBatters.push(...getFieldPlayers(team));
      allStarters.push(...getPitchersByRole(team, 'starter'));
      allMiddles.push(...getPitchersByRole(team, 'middle'));
      allClosers.push(...getPitchersByRole(team, 'closer'));
    });

    // 크레딧 기준으로 정렬 (낮은 순)
    allBatters.sort((a, b) => a.salary - b.salary);
    allStarters.sort((a, b) => a.salary - b.salary);
    allMiddles.sort((a, b) => a.salary - b.salary);
    allClosers.sort((a, b) => a.salary - b.salary);

    let totalCredits = 0;
    const selectedBatting: Player[] = [];
    const selectedBench: Player[] = [];
    const selectedFieldPositions: (string | null)[] = Array(9).fill(null);
    
    // 수비 포지션 배열 (9명)
    const requiredPositions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
    const usedPlayerIds = new Set<string>();

    // 각 수비 포지션에 맞는 선수 배치
    for (let i = 0; i < 9; i++) {
      const position = requiredPositions[i];
      
      // 해당 포지션을 할 수 있는 선수 찾기 (아직 선택 안 된 선수)
      let selectedPlayer: Player | null = null;
      
      for (const player of allBatters) {
        if (
          !usedPlayerIds.has(player.id) &&
          totalCredits + player.salary <= MAX_CREDITS - 800 && // 투수와 벤치를 위해 여유분 남김
          (player.position === position || position === 'DH') // DH는 아무나 가능
        ) {
          selectedPlayer = player;
          usedPlayerIds.add(player.id);
          selectedBatting.push(player);
          selectedFieldPositions[i] = position;
          totalCredits += player.salary;
          break;
        }
      }
      
      // 해당 포지션을 찾지 못하면 DH나 다른 포지션으로 대체
      if (!selectedPlayer) {
        for (const player of allBatters) {
          if (
            !usedPlayerIds.has(player.id) &&
            totalCredits + player.salary <= MAX_CREDITS - 800
          ) {
            selectedPlayer = player;
            usedPlayerIds.add(player.id);
            selectedBatting.push(player);
            selectedFieldPositions[i] = position;
            totalCredits += player.salary;
            break;
          }
        }
      }
    }

    // 벤치 선수 선택 (5명)
    for (let i = 0; i < 5; i++) {
      for (const player of allBatters) {
        if (
          !usedPlayerIds.has(player.id) &&
          totalCredits + player.salary <= MAX_CREDITS - 300 // 투수를 위해 여유분
        ) {
          usedPlayerIds.add(player.id);
          selectedBench.push(player);
          totalCredits += player.salary;
          break;
        }
      }
    }

    // 투수 선택
    let selectedStarter: Player | null = null;
    for (const pitcher of allStarters) {
      if (totalCredits + pitcher.salary <= MAX_CREDITS - 250) {
        selectedStarter = pitcher;
        totalCredits += pitcher.salary;
        break;
      }
    }

    // 중간 계투 선택 (5명)
    const selectedMiddles: Player[] = [];
    for (let i = 0; i < 5; i++) {
      for (const pitcher of allMiddles) {
        if (
          !selectedMiddles.includes(pitcher) &&
          totalCredits + pitcher.salary <= MAX_CREDITS - (40 * (5 - i))
        ) {
          selectedMiddles.push(pitcher);
          totalCredits += pitcher.salary;
          break;
        }
      }
    }

    // 마무리 선택
    let selectedCloser: Player | null = null;
    for (const pitcher of allClosers) {
      if (totalCredits + pitcher.salary <= MAX_CREDITS) {
        selectedCloser = pitcher;
        totalCredits += pitcher.salary;
        break;
      }
    }

    // 라인업 구성 실패 시
    if (
      selectedBatting.length < 9 ||
      selectedBench.length < 5 ||
      !selectedStarter ||
      selectedMiddles.length < 5 ||
      !selectedCloser
    ) {
      alert('크레딧 내에서 라인업을 구성할 수 없습니다. 다시 시도해주세요.');
      return;
    }

    setLineup({
      batting: selectedBatting,
      pitchers: {
        starter: selectedStarter,
        middle: selectedMiddles,
        closer: selectedCloser,
      },
      bench: selectedBench,
      fieldPositions: selectedFieldPositions,
      hasDH: selectedFieldPositions.includes('DH'),
    });

    alert(`자동 생성 완료! 총 ${totalCredits} 크레딧 사용`);
  };

  // 총 사용 크레딧 계산
  const calculateTotalCredits = () => {
    let total = 0;
    
    // 타자
    lineup.batting.forEach((player) => {
      if (player) total += player.salary;
    });
    
    // 투수
    if (lineup.pitchers.starter) total += lineup.pitchers.starter.salary;
    lineup.pitchers.middle.forEach((player) => {
      if (player) total += player.salary;
    });
    if (lineup.pitchers.closer) total += lineup.pitchers.closer.salary;
    
    // 벤치
    lineup.bench.forEach((player) => {
      if (player) total += player.salary;
    });
    
    return total;
  };

  const usedCredits = calculateTotalCredits();
  const remainingCredits = MAX_CREDITS - usedCredits;
  const creditPercentage = (usedCredits / MAX_CREDITS) * 100;

  const handleBatterDrop = (player: Player | null, index: number) => {
    if (!player) {
      // 제거
      const newBatting = [...lineup.batting];
      newBatting[index] = null;
      setLineup({ ...lineup, batting: newBatting });
      return;
    }

    // 크레딧 체크
    const currentPlayerCost = lineup.batting[index]?.salary || 0;
    if (usedCredits - currentPlayerCost + player.salary > MAX_CREDITS) {
      alert('크레딧이 부족합니다!');
      return;
    }
    
    const newBatting = [...lineup.batting];
    newBatting[index] = player;
    setLineup({ ...lineup, batting: newBatting });
  };

  const handleStarterDrop = (player: Player | null) => {
    if (!player) {
      // 제거
      setLineup({
        ...lineup,
        pitchers: { ...lineup.pitchers, starter: null },
      });
      return;
    }

    const currentPlayerCost = lineup.pitchers.starter?.salary || 0;
    if (usedCredits - currentPlayerCost + player.salary > MAX_CREDITS) {
      alert('크레딧이 부족합니다!');
      return;
    }
    setLineup({
      ...lineup,
      pitchers: { ...lineup.pitchers, starter: player },
    });
  };

  const handleMiddleDrop = (player: Player | null, index: number) => {
    if (!player) {
      // 제거
      const newMiddle = [...lineup.pitchers.middle];
      newMiddle[index] = null;
      setLineup({
        ...lineup,
        pitchers: { ...lineup.pitchers, middle: newMiddle },
      });
      return;
    }

    const currentPlayerCost = lineup.pitchers.middle[index]?.salary || 0;
    if (usedCredits - currentPlayerCost + player.salary > MAX_CREDITS) {
      alert('크레딧이 부족합니다!');
      return;
    }
    const newMiddle = [...lineup.pitchers.middle];
    newMiddle[index] = player;
    setLineup({
      ...lineup,
      pitchers: { ...lineup.pitchers, middle: newMiddle },
    });
  };

  const handleCloserDrop = (player: Player | null) => {
    if (!player) {
      // 제거
      setLineup({
        ...lineup,
        pitchers: { ...lineup.pitchers, closer: null },
      });
      return;
    }

    const currentPlayerCost = lineup.pitchers.closer?.salary || 0;
    if (usedCredits - currentPlayerCost + player.salary > MAX_CREDITS) {
      alert('크레딧이 부족합니다!');
      return;
    }
    setLineup({
      ...lineup,
      pitchers: { ...lineup.pitchers, closer: player },
    });
  };

  const handleBenchDrop = (player: Player | null, index: number) => {
    if (!player) {
      // 제거
      const newBench = [...lineup.bench];
      newBench[index] = null;
      setLineup({ ...lineup, bench: newBench });
      return;
    }

    const currentPlayerCost = lineup.bench[index]?.salary || 0;
    if (usedCredits - currentPlayerCost + player.salary > MAX_CREDITS) {
      alert('크레딧이 부족합니다!');
      return;
    }
    const newBench = [...lineup.bench];
    newBench[index] = player;
    setLineup({ ...lineup, bench: newBench });
  };

  const handleSubmit = () => {
    if (
      lineup.batting.every((p) => p !== null) &&
      lineup.pitchers.starter &&
      lineup.pitchers.middle.every((p) => p !== null) &&
      lineup.pitchers.closer &&
      lineup.bench.every((p) => p !== null)
    ) {
      onLineupComplete(lineup);
    } else {
      alert('모든 포지션을 채워주세요!');
    }
  };

  const handleClear = () => {
    setLineup({
      batting: Array(9).fill(null),
      pitchers: {
        starter: null,
        middle: Array(5).fill(null),
        closer: null,
      },
      bench: Array(5).fill(null),
      fieldPositions: Array(9).fill(null), // 수비 포지션 초기화
      hasDH: false, // 지명타자 사용 여부 초기화
    });
  };

  const myTeam = lineup.batting[0]?.team || '';
  const myTheme = TEAM_THEMES[myTeam];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">라인업 빌더</h2>
          
          {/* 크레딧 표시 */}
          <Card className="px-6 py-3">
            <div className="flex items-center gap-3">
              <Coins className="w-6 h-6 text-amber-600" />
              <div>
                <div className="text-xs text-muted-foreground">남은 크레딧</div>
                <div className={`text-2xl font-bold ${remainingCredits < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {remainingCredits} / {MAX_CREDITS}
                </div>
              </div>
            </div>
            <Progress 
              value={creditPercentage} 
              className="mt-2 h-2"
            />
          </Card>
        </div>

        {/* 70-30 레이아웃 */}
        <div className="grid grid-cols-10 gap-6">
          {/* 좌측 70% - 선수 목록 */}
          <div className="col-span-7">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">선수 목록</h3>
              <p className="text-sm text-muted-foreground mb-4">
                팀을 선택하고 선수를 드래그해서 라인업으로 구성하세요. (최대 {MAX_CREDITS} 크레딧)
              </p>

              <Tabs defaultValue="batters">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="batters" className="text-base">
                    타자
                  </TabsTrigger>
                  <TabsTrigger value="pitchers" className="text-base">
                    투수
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="batters">
                  <Accordion type="single" collapsible className="w-full">
                    {TEAMS.map((team) => {
                      const theme = TEAM_THEMES[team];
                      const players = getFieldPlayers(team);
                      return (
                        <AccordionItem key={team} value={team}>
                          <AccordionTrigger
                            className="hover:no-underline"
                            style={{
                              backgroundColor: `${theme.primary}10`,
                            }}
                          >
                            <div className="flex items-center gap-3 w-full px-2">
                              <div
                                className="w-5 h-5 rounded-full"
                                style={{ backgroundColor: theme.primary }}
                              />
                              <span className="font-bold">{team}</span>
                              <Badge variant="secondary" className="ml-auto mr-2">
                                {players.length}명
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2 max-h-[400px] overflow-y-auto">
                              {players.map((player) => (
                                <DraggablePlayer key={player.id} player={player} />
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </TabsContent>

                <TabsContent value="pitchers">
                  <Accordion type="single" collapsible className="w-full">
                    {TEAMS.map((team) => {
                      const theme = TEAM_THEMES[team];
                      const starters = getPitchersByRole(team, 'starter');
                      const middles = getPitchersByRole(team, 'middle');
                      const closers = getPitchersByRole(team, 'closer');
                      const totalPitchers = starters.length + middles.length + closers.length;

                      return (
                        <AccordionItem key={team} value={team}>
                          <AccordionTrigger
                            className="hover:no-underline"
                            style={{
                              backgroundColor: `${theme.primary}10`,
                            }}
                          >
                            <div className="flex items-center gap-3 w-full px-2">
                              <div
                                className="w-5 h-5 rounded-full"
                                style={{ backgroundColor: theme.primary }}
                              />
                              <span className="font-bold">{team}</span>
                              <Badge variant="secondary" className="ml-auto mr-2">
                                {totalPitchers}명
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-2 max-h-[400px] overflow-y-auto">
                              <div>
                                <h4 className="font-bold mb-2 text-green-700 text-sm">
                                  선발 투수
                                </h4>
                                <div className="space-y-2">
                                  {starters.map((player) => (
                                    <DraggablePlayer key={player.id} player={player} />
                                  ))}
                                </div>
                              </div>

                              <Separator />

                              <div>
                                <h4 className="font-bold mb-2 text-green-700 text-sm">
                                  중간 계투
                                </h4>
                                <div className="space-y-2">
                                  {middles.map((player) => (
                                    <DraggablePlayer key={player.id} player={player} />
                                  ))}
                                </div>
                              </div>

                              <Separator />

                              <div>
                                <h4 className="font-bold mb-2 text-green-700 text-sm">마무리</h4>
                                <div className="space-y-2">
                                  {closers.map((player) => (
                                    <DraggablePlayer key={player.id} player={player} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* 우측 30% - 내 라인업 */}
          <div className="col-span-3">
            <Card
              className="p-4 sticky top-4"
              style={{ borderColor: myTheme?.primary || '#ccc', borderWidth: '2px' }}
            >
              <div className="flex items-center gap-2 mb-4">
                {myTheme && (
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: myTheme.primary }}
                  />
                )}
                <h3 className="text-lg font-bold">내 라인업</h3>
              </div>

              {/* 투수진 */}
              <div className="mb-4">
                <h4 className="font-bold mb-2 text-green-700 text-sm">투수진</h4>
                <div className="space-y-1">
                  <PitcherSlot
                    player={lineup.pitchers.starter}
                    onDrop={handleStarterDrop}
                    onRemove={() => handleStarterDrop(null)}
                    role="starter"
                    label="선발"
                  />
                  {lineup.pitchers.middle.map((player, idx) => (
                    <PitcherSlot
                      key={idx}
                      player={player}
                      onDrop={(p) => handleMiddleDrop(p, idx)}
                      onRemove={() => handleMiddleDrop(null, idx)}
                      role="middle"
                      label={`계투${idx + 1}`}
                    />
                  ))}
                  <PitcherSlot
                    player={lineup.pitchers.closer}
                    onDrop={handleCloserDrop}
                    onRemove={() => handleCloserDrop(null)}
                    role="closer"
                    label="마무리"
                  />
                </div>
              </div>

              <Separator className="my-4" />

              {/* 타순 */}
              <div className="mb-4">
                <h4 className="font-bold mb-2 text-blue-700 text-sm">타순</h4>
                <div className="space-y-1">
                  {lineup.batting.map((player, index) => (
                    <LineupSlot 
                      key={index} 
                      index={index} 
                      player={player} 
                      onDrop={handleBatterDrop}
                      onRemove={() => handleBatterDrop(null, index)}
                      onPositionChange={(idx, pos) => {
                        const newPositions = [...lineup.fieldPositions];
                        newPositions[idx] = pos;
                        setLineup({ ...lineup, fieldPositions: newPositions });
                      }}
                      label={`${index + 1}번`}
                      usedPositions={lineup.fieldPositions}
                    />
                  ))}
                </div>
              </div>

              <Separator className="my-4" />

              {/* 벤치 (대타/대주자) */}
              <div className="mb-4">
                <h4 className="font-bold mb-2 text-purple-700 text-sm">벤치 (대타/대주자)</h4>
                <div className="space-y-1">
                  {lineup.bench.map((player, index) => (
                    <BenchSlot
                      key={index}
                      index={index}
                      player={player}
                      onDrop={handleBenchDrop}
                      onRemove={() => handleBenchDrop(null, index)}
                      label={`벤치${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleSubmit} 
                  className="w-full" 
                  size="lg"
                  disabled={remainingCredits < 0}
                >
                  라인업 완성
                </Button>
                <Button onClick={handleClear} variant="outline" className="w-full">
                  초기화
                </Button>
                <Button onClick={handleAutoGenerate} variant="outline" className="w-full">
                  자동 생성
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}