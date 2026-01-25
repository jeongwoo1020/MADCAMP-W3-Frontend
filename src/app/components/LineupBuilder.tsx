import { useState, useEffect } from "react";
import { Player, Lineup } from "@/app/types";
import { TEAM_THEMES } from "@/app/data/teamThemes";
import { MOCK_PLAYERS } from "@/app/data/mockPlayers";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Progress } from "@/app/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import { Coins, Users } from "lucide-react";

import { DraggablePlayer } from "./lineup/DraggablePlayer";
import { LineupSlot } from "./lineup/LineupSlot";
import { PitcherSlot } from "./lineup/PitcherSlot";
import { BenchSlot } from "./lineup/BenchSlot";

const MAX_CREDITS = 2000; // 최대 크레딧 (테스트용)

interface LineupBuilderProps {
  onLineupComplete: (lineup: Lineup) => void;
}

export function LineupBuilder({
  onLineupComplete,
}: LineupBuilderProps) {
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

  // API 데이터 상태
  const [groupedBatters, setGroupedBatters] = useState<{
    [team: string]: Player[];
  }>({});
  const [groupedPitchers, setGroupedPitchers] = useState<{
    [team: string]: Player[];
  }>({});
  const [loading, setLoading] = useState(true);

  // 데이터 처리 함수
  const processPlayers = (players: Player[]) => {
    const batters = players.filter(
      (p) => p.position !== "투수",
    );
    const pitchers = players.filter(
      (p) => p.position === "투수",
    );

    const battersByTeam: { [key: string]: Player[] } = {};
    batters.forEach((p) => {
      if (!battersByTeam[p.team]) battersByTeam[p.team] = [];
      battersByTeam[p.team].push(p);
    });

    const pitchersByTeam: { [key: string]: Player[] } = {};
    pitchers.forEach((p) => {
      if (!pitchersByTeam[p.team]) pitchersByTeam[p.team] = [];
      pitchersByTeam[p.team].push(p);
    });

    setGroupedBatters(battersByTeam);
    setGroupedPitchers(pitchersByTeam);
  };

  // 데이터 로드
  useEffect(() => {
    const loadMockData = () => {
      console.log("Using mock data fallback (Full Data)");
      processPlayers(MOCK_PLAYERS);
      setLoading(false);
    };

    loadMockData();
  }, []);

  const TEAMS = Array.from(
    new Set([
      ...Object.keys(groupedBatters),
      ...Object.keys(groupedPitchers),
    ]),
  );

  // 자동 생성 함수
  const handleAutoGenerate = () => {
    // 전체 선수 풀 수집 (API 데이터 기반)
    const allBatters: Player[] =
      Object.values(groupedBatters).flat();
    const allPitchers: Player[] =
      Object.values(groupedPitchers).flat();

    const allStarters = allPitchers.filter(
      (p) => p.pitcherRole === "starter",
    );
    const allMiddles = allPitchers.filter(
      (p) => p.pitcherRole === "middle",
    );
    const allClosers = allPitchers.filter(
      (p) => p.pitcherRole === "closer",
    );

    if (allBatters.length === 0 || allPitchers.length === 0) {
      alert("선수 데이터가 없습니다.");
      return;
    }

    // 크레딧 기준으로 정렬 (낮은 순)
    allBatters.sort((a, b) => a.salary - b.salary);
    allStarters.sort((a, b) => a.salary - b.salary);
    allMiddles.sort((a, b) => a.salary - b.salary);
    allClosers.sort((a, b) => a.salary - b.salary);

    let totalCredits = 0;
    const selectedBatting: Player[] = [];
    const selectedBench: Player[] = [];
    const selectedFieldPositions: (string | null)[] =
      Array(9).fill(null);

    // 수비 포지션 배열 (9명)
    const requiredPositions = [
      "C",
      "1B",
      "2B",
      "3B",
      "SS",
      "LF",
      "CF",
      "RF",
      "DH",
    ];
    const usedPlayerIds = new Set<string>();

    // 각 수비 포지션에 맞는 선수 배치
    for (let i = 0; i < 9; i++) {
      const position = requiredPositions[i];
      let selectedPlayer: Player | null = null;

      for (const player of allBatters) {
        if (
          !usedPlayerIds.has(String(player.id)) &&
          totalCredits + player.salary <= MAX_CREDITS - 800 &&
          (player.position === position || position === "DH")
        ) {
          selectedPlayer = player;
          usedPlayerIds.add(String(player.id));
          selectedBatting.push(player);
          selectedFieldPositions[i] = position;
          totalCredits += player.salary;
          break;
        }
      }

      // 해당 포지션을 찾지 못하면 대체 (DH나 다른 포지션)
      if (!selectedPlayer) {
        for (const player of allBatters) {
          if (
            !usedPlayerIds.has(String(player.id)) &&
            totalCredits + player.salary <= MAX_CREDITS - 800
          ) {
            selectedPlayer = player;
            usedPlayerIds.add(String(player.id));
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
          !usedPlayerIds.has(String(player.id)) &&
          totalCredits + player.salary <= MAX_CREDITS - 300
        ) {
          usedPlayerIds.add(String(player.id));
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
          totalCredits + pitcher.salary <=
          MAX_CREDITS - 40 * (5 - i)
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

    // 라인업 업데이트 (검증 로직 생략하고 우선 적용 - 부족하면 빈칸)
    setLineup({
      batting: selectedBatting.concat(
        Array(9 - selectedBatting.length).fill(null),
      ),
      pitchers: {
        starter: selectedStarter,
        middle: selectedMiddles.concat(
          Array(5 - selectedMiddles.length).fill(null),
        ),
        closer: selectedCloser,
      },
      bench: selectedBench.concat(
        Array(5 - selectedBench.length).fill(null),
      ),
      fieldPositions: selectedFieldPositions,
      hasDH: selectedFieldPositions.includes("DH"),
    });

    if (
      selectedStarter &&
      selectedCloser &&
      selectedBatting.length === 9
    ) {
      alert(`자동 생성 완료! 총 ${totalCredits} 크레딧 사용`);
    } else {
      alert(
        "조건에 맞는 선수가 부족하여 일부 슬롯이 비었습니다.",
      );
    }
  };

  // 총 사용 크레딧 계산
  const calculateTotalCredits = () => {
    let total = 0;

    // 타자
    lineup.batting.forEach((player) => {
      if (player) total += (player as Player).salary;
    });

    // 투수
    if (lineup.pitchers.starter)
      total += (lineup.pitchers.starter as Player).salary;
    lineup.pitchers.middle.forEach((player) => {
      if (player) total += (player as Player).salary;
    });
    if (lineup.pitchers.closer)
      total += (lineup.pitchers.closer as Player).salary;

    // 벤치
    lineup.bench.forEach((player) => {
      if (player) total += (player as Player).salary;
    });

    return total;
  };

  const usedCredits = calculateTotalCredits();
  const remainingCredits = MAX_CREDITS - usedCredits;
  const creditPercentage = (usedCredits / MAX_CREDITS) * 100;

  const handleBatterDrop = (
    player: Player | null,
    index: number,
  ) => {
    if (!player) {
      // 제거
      const newBatting = [...lineup.batting];
      newBatting[index] = null;
      setLineup({ ...lineup, batting: newBatting });
      return;
    }

    // 크레딧 체크
    const currentPlayerCost =
      lineup.batting[index]?.salary || 0;
    if (
      usedCredits - currentPlayerCost + player.salary >
      MAX_CREDITS
    ) {
      alert("크레딧이 부족합니다!");
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

    const currentPlayerCost =
      lineup.pitchers.starter?.salary || 0;
    if (
      usedCredits - currentPlayerCost + player.salary >
      MAX_CREDITS
    ) {
      alert("크레딧이 부족합니다!");
      return;
    }
    setLineup({
      ...lineup,
      pitchers: { ...lineup.pitchers, starter: player },
    });
  };

  const handleMiddleDrop = (
    player: Player | null,
    index: number,
  ) => {
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

    const currentPlayerCost =
      lineup.pitchers.middle[index]?.salary || 0;
    if (
      usedCredits - currentPlayerCost + player.salary >
      MAX_CREDITS
    ) {
      alert("크레딧이 부족합니다!");
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

    const currentPlayerCost =
      lineup.pitchers.closer?.salary || 0;
    if (
      usedCredits - currentPlayerCost + player.salary >
      MAX_CREDITS
    ) {
      alert("크레딧이 부족합니다!");
      return;
    }
    setLineup({
      ...lineup,
      pitchers: { ...lineup.pitchers, closer: player },
    });
  };

  const handleBenchDrop = (
    player: Player | null,
    index: number,
  ) => {
    if (!player) {
      // 제거
      const newBench = [...lineup.bench];
      newBench[index] = null;
      setLineup({ ...lineup, bench: newBench });
      return;
    }

    const currentPlayerCost = lineup.bench[index]?.salary || 0;
    if (
      usedCredits - currentPlayerCost + player.salary >
      MAX_CREDITS
    ) {
      alert("크레딧이 부족합니다!");
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
      alert("모든 포지션을 채워주세요!");
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

  return (
    <div
      className="p-6 min-h-screen relative overflow-hidden bg-black"
      style={{
        backgroundImage:
          'url(https://images.unsplash.com/photo-1729280968440-367f2775afce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXNlYmFsbCUyMGZpZWxkJTIwZ3Jhc3N8ZW58MXx8fHwxNzY5MzE1MTY1fDA&ixlib=rb-4.1.0&q=80&w=1080)',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/80" />

      <div className="max-w-[1600px] mx-auto relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,49,49,0.3)] border-2 border-sonic-red backdrop-blur-md">
              <Users className="w-8 h-8 text-sonic-white" />
            </div>
            <h2 className="text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(255,49,49,0.3)]">
              <span className="text-sonic-red">라인업</span> 빌더
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Button
              size="lg"
              onClick={handleSubmit}
              className="h-16 px-8 text-lg bg-sonic-red hover:bg-red-600 font-bold shadow-lg shadow-sonic-red/20 text-white border-0"
            >
              라인업 확정 및 경기 시작
            </Button>
          </div>
        </div>

        {/* 70-30 레이아웃 */}
        <div className="grid grid-cols-10 gap-6">
          {/* 좌측 70% - 선수 목록 */}
          <div className="col-span-7">
            <Card className="p-6 min-h-[800px] flex flex-col bg-white/70 backdrop-blur-md border-white/20 shadow-2xl">
              <h3 className="text-2xl font-bold mb-2 text-black">
                선수 목록
              </h3>

              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 border-l-sonic-red"></div>
                </div>
              ) : (
                <Tabs
                  defaultValue="batters"
                  className="flex-1 flex flex-col"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-4 bg-black/10 border border-black/5">
                    <TabsTrigger
                      value="batters"
                      className="text-base data-[state=active]:bg-white data-[state=active]:text-black text-gray-600 font-bold"
                    >
                      타자
                    </TabsTrigger>
                    <TabsTrigger
                      value="pitchers"
                      className="text-base data-[state=active]:bg-white data-[state=active]:text-black text-gray-600 font-bold"
                    >
                      투수
                    </TabsTrigger>
                  </TabsList>

                  <p className="text-sm text-gray-700 mb-4">
                    선수를 드래그해서 라인업으로 구성하세요. (최대 {MAX_CREDITS} 크레딧)
                  </p>

                  <TabsContent
                    value="batters"
                    className="flex-1 overflow-y-auto pr-2"
                  >
                    <Accordion
                      type="single"
                      collapsible
                      className="w-full space-y-2"
                    >
                      {TEAMS.map((team) => {
                        const theme = TEAM_THEMES[team] || {
                          primary: "#333",
                        };
                        const players =
                          groupedBatters[team] || [];
                        if (players.length === 0) return null;

                        return (
                          <AccordionItem
                            key={team}
                            value={team}
                            className="border border-black/10 rounded-lg overflow-hidden"
                          >
                            <AccordionTrigger
                              className="hover:no-underline px-4 bg-white/40 hover:bg-white/60 text-black"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div
                                  className="w-5 h-5 rounded-full ring-2 ring-black/10"
                                  style={{
                                    backgroundColor:
                                      theme.primary,
                                  }}
                                />
                                <span className="font-bold">
                                  {team}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="ml-auto bg-black/10 text-black hover:bg-black/20"
                                >
                                  {players.length}명
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-3 bg-white/30">
                              <div className="grid grid-cols-1 gap-2">
                                {players.map((player) => (
                                  <DraggablePlayer
                                    key={player.id}
                                    player={player}
                                  />
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </TabsContent>

                  <TabsContent
                    value="pitchers"
                    className="flex-1 overflow-y-auto pr-2"
                  >
                    <Accordion
                      type="single"
                      collapsible
                      className="w-full space-y-2"
                    >
                      {TEAMS.map((team) => {
                        const theme = TEAM_THEMES[team] || {
                          primary: "#333",
                        };
                        const players =
                          groupedPitchers[team] || [];
                        if (players.length === 0) return null;

                        const starters = players.filter(
                          (p) => p.pitcherRole === "starter",
                        );
                        const middles = players.filter(
                          (p) => p.pitcherRole === "middle",
                        );
                        const closers = players.filter(
                          (p) => p.pitcherRole === "closer",
                        );
                        const totalPitchers = players.length;

                        return (
                          <AccordionItem
                            key={team}
                            value={team}
                            className="border border-black/10 rounded-lg overflow-hidden"
                          >
                            <AccordionTrigger
                              className="hover:no-underline px-4 bg-white/40 hover:bg-white/60 text-black"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div
                                  className="w-5 h-5 rounded-full ring-2 ring-black/10"
                                  style={{
                                    backgroundColor:
                                      theme.primary,
                                  }}
                                />
                                <span className="font-bold">
                                  {team}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="ml-auto bg-black/10 text-black hover:bg-black/20"
                                >
                                  {totalPitchers}명
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-3 bg-white/30">
                              <div className="space-y-4 pt-2">
                                {starters.length > 0 && (
                                  <div>
                                    <h4 className="font-bold mb-2 text-voltage-blue text-sm">
                                      선발 투수
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                      {starters.map(
                                        (player) => (
                                          <DraggablePlayer
                                            key={player.id}
                                            player={player}
                                          />
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                                {middles.length > 0 && (
                                  <>
                                    <Separator className="bg-black/10" />
                                    <div className="mt-2">
                                      <h4 className="font-bold mb-2 text-voltage-blue text-sm">
                                        중간 계투
                                      </h4>
                                      <div className="grid grid-cols-1 gap-2">
                                        {middles.map(
                                          (player) => (
                                            <DraggablePlayer
                                              key={player.id}
                                              player={player}
                                            />
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                                {closers.length > 0 && (
                                  <>
                                    <Separator className="bg-black/10" />
                                    <div className="mt-2">
                                      <h4 className="font-bold mb-2 text-voltage-blue text-sm">
                                        마무리 투수
                                      </h4>
                                      <div className="grid grid-cols-1 gap-2">
                                        {closers.map(
                                          (player) => (
                                            <DraggablePlayer
                                              key={player.id}
                                              player={player}
                                            />
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </TabsContent>
                </Tabs>
              )}
            </Card>
          </div>

          {/* 우측 30% - 라인업 슬롯 */}
          <div className="col-span-3 space-y-4">
            {/* 크레딧 표시 */}
            <Card className="p-4 bg-white/70 backdrop-blur-md border border-white/20 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-cyber-yellow" />
                  <span className="font-bold text-black">남은 크레딧</span>
                </div>
                <div
                  className={`text-xl font-bold ${remainingCredits < 0 ? "text-red-500" : "text-black"}`}
                >
                  {remainingCredits} / {MAX_CREDITS}
                </div>
              </div>
              <Progress
                value={creditPercentage}
                className="h-2 bg-black/10"
              />
            </Card>

            {/* 라인업 슬롯 - 아코디언 */}
            <Accordion
              type="single"
              collapsible
              defaultValue="batting"
              className="w-full space-y-4"
            >
              {/* 타자 라인업 */}
              <AccordionItem value="batting" className="border-0">
                <AccordionTrigger className="hover:no-underline px-4 bg-white/70 hover:bg-white/90 border-0 rounded-t-lg transition-colors">
                  <span className="font-bold flex items-center justify-between w-full pr-4 text-black">
                    <span>선발 타자 (1~9번)</span>
                    <span className="text-xs text-black bg-white/50 px-2 py-1 rounded-full">
                      {lineup.batting.filter(Boolean).length}/9
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-white/30 border border-white/20 border-t-0 rounded-b-lg">
                  <div className="space-y-2">
                    {lineup.batting.map((player, index) => (
                      <LineupSlot
                        key={`batter-${index}`}
                        index={index}
                        player={player as Player}
                        fieldPosition={
                          lineup.fieldPositions[index]
                        }
                        onDrop={handleBatterDrop}
                        onRemove={() =>
                          handleBatterDrop(null, index)
                        }
                        onPositionChange={(idx, val) => {
                          const newPositions = [
                            ...lineup.fieldPositions,
                          ];
                          newPositions[idx] = val;
                          setLineup({
                            ...lineup,
                            fieldPositions: newPositions,
                            hasDH: newPositions.includes("DH"),
                          });
                        }}
                        label={`${index + 1}번 타자`}
                        usedPositions={lineup.fieldPositions}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 투수 라인업 */}
              <AccordionItem value="pitchers" className="border-0">
                <AccordionTrigger className="hover:no-underline px-4 bg-white/70 hover:bg-white/90 border-0 rounded-t-lg transition-colors">
                  <span className="font-bold flex items-center justify-between w-full pr-4 text-black">
                    <span>투수진</span>
                    <span className="text-xs text-black bg-white/50 px-2 py-1 rounded-full">
                      {
                        [
                          lineup.pitchers.starter,
                          ...lineup.pitchers.middle,
                          lineup.pitchers.closer,
                        ].filter(Boolean).length
                      }
                      /7
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-white/30 border border-white/20 border-t-0 rounded-b-lg">
                  <div className="space-y-2">
                    <PitcherSlot
                      player={lineup.pitchers.starter}
                      onDrop={handleStarterDrop}
                      onRemove={() => handleStarterDrop(null)}
                      role="starter"
                      label="선발 투수 (SP)"
                    />
                    <div className="flex flex-col gap-2 mb-4">
                      {lineup.pitchers.middle.map(
                        (player, index) => (
                          <PitcherSlot
                            key={`middle-${index}`}
                            player={player}
                            onDrop={(p) =>
                              handleMiddleDrop(p, index)
                            }
                            onRemove={() =>
                              handleMiddleDrop(null, index)
                            }
                            role="middle"
                            label={`RP${index + 1}`}
                          />
                        ),
                      )}
                    </div>
                    <PitcherSlot
                      player={lineup.pitchers.closer}
                      onDrop={handleCloserDrop}
                      onRemove={() => handleCloserDrop(null)}
                      role="closer"
                      label="마무리 투수 (CP)"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 벤치 */}
              <AccordionItem value="bench" className="border-0">
                <AccordionTrigger className="hover:no-underline px-4 bg-white/70 hover:bg-white/90 border-0 rounded-t-lg transition-colors">
                  <span className="font-bold flex items-center justify-between w-full pr-4 text-black">
                    <span>벤치 멤버</span>
                    <span className="text-xs text-black bg-white/50 px-2 py-1 rounded-full">
                      {lineup.bench.filter(Boolean).length}/5
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-white/30 border border-white/20 border-t-0 rounded-b-lg">
                  <div className="flex flex-col gap-2 mb-4">
                    {lineup.bench.map((player, index) => (
                      <BenchSlot
                        key={`bench-${index}`}
                        index={index}
                        player={player}
                        onDrop={handleBenchDrop}
                        onRemove={() =>
                          handleBenchDrop(null, index)
                        }
                        label={`B${index + 1}`}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-white hover:bg-gray-200 text-black border-0 font-bold"
                onClick={handleAutoGenerate}
              >
                자동 생성
              </Button>
              <Button
                variant="destructive"
                className="flex-1 font-bold"
                onClick={handleClear}
              >
                초기화
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}