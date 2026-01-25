import { useState } from "react";
import { Lineup, Stadium } from "@/app/types";
import { STADIUMS } from "@/app/data/stadiums";
import { TEAM_THEMES } from "@/app/data/teamThemes";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/app/components/ui/radio-group";
import { Label } from "@/app/components/ui/label";
import { Coins, Users, Trophy, MapPin } from "lucide-react";

interface GameSetupProps {
  myLineup: Lineup;
  opponentLineup?: Lineup;
  onGameStart: (stadium: Stadium, isHome: boolean) => void;
}

export function GameSetup({
  myLineup,
  opponentLineup,
  onGameStart,
}: GameSetupProps) {
  const [selectedStadium, setSelectedStadium] =
    useState<Stadium>(STADIUMS[0]);
  const [homeAway, setHomeAway] = useState<"home" | "away">(
    "home",
  );

  const myTeam = myLineup.batting[0]?.team || "내 팀";
  const opponentTeam =
    opponentLineup?.batting[0]?.team || "상대 팀";
  const myTheme = TEAM_THEMES[myTeam];
  const opponentTheme = TEAM_THEMES[opponentTeam];

  const calculateLineupCredits = (lineup: Lineup) => {
    let total = 0;
    lineup.batting.forEach((p) => {
      if (p) total += p.salary;
    });
    if (lineup.pitchers.starter)
      total += lineup.pitchers.starter.salary;
    lineup.pitchers.middle.forEach((p) => {
      if (p) total += p.salary;
    });
    if (lineup.pitchers.closer)
      total += lineup.pitchers.closer.salary;
    lineup.bench.forEach((p) => {
      if (p) total += p.salary;
    });
    return total;
  };

  const myCredits = calculateLineupCredits(myLineup);
  const opponentCredits = opponentLineup
    ? calculateLineupCredits(opponentLineup)
    : 0;

  const handleStart = () => {
    onGameStart(selectedStadium, homeAway === "home");
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-black"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1729280968440-367f2775afce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXNlYmFsbCUyMGZpZWxkJTIwZ3Jhc3N8ZW58MXx8fHwxNzY5MzE1MTY1fDA&ixlib=rb-4.1.0&q=80&w=1080)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/80" />

      <div className="max-w-[1600px] mx-auto p-6 relative z-10">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-yellow-500" />
            <h2 className="text-6xl font-black text-white drop-shadow-[0_0_10px_rgba(255,49,49,0.3)]">
              경기 준비
            </h2>
            <Trophy className="w-12 h-12 text-yellow-500" />
          </div>
          <p className="text-white/80 text-xl font-semibold">경기 시작 전 라인업과 설정을 확인하세요</p>
        </div>

        {/* 게임 설정 섹션 */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* 구장 선택 */}
          {/* 구장 선택 */}
          <Card className="p-6 bg-white/70 backdrop-blur-md border border-white/20 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-black text-black">구장 선택</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {STADIUMS.map((stadium) => (
                <div
                  key={stadium.id}
                  onClick={() => setSelectedStadium(stadium)}
                  className={`cursor-pointer rounded-xl overflow-hidden border-4 transition-all shadow-lg hover:scale-105 ${selectedStadium.id === stadium.id
                    ? "border-blue-500 ring-4 ring-blue-300"
                    : "border-gray-200 hover:border-gray-400"
                    }`}
                >
                  <img
                    src={stadium.image}
                    alt={stadium.name}
                    className="w-full h-28 object-cover"
                  />
                  <div className="p-3 bg-white">
                    <div className="font-bold text-sm text-black">{stadium.name}</div>
                    <div className="text-xs text-gray-500">{stadium.city}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 홈/원정 선택 */}
          <Card className="p-6 bg-white/70 backdrop-blur-md border border-white/20 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-purple-600" />
              <h3 className="text-2xl font-black text-black">홈/원정 선택</h3>
            </div>
            <RadioGroup
              value={homeAway}
              onValueChange={(v) =>
                setHomeAway(v as "home" | "away")
              }
              className="space-y-4"
            >
              <div
                className={`p-6 border-4 rounded-xl cursor-pointer transition-all ${homeAway === "home"
                  ? "border-blue-500 bg-blue-50/80 ring-4 ring-blue-300"
                  : "border-gray-200 bg-white/60 hover:border-gray-400"
                  }`}
                onClick={() => setHomeAway("home")}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="home" id="home" className="w-6 h-6" />
                  <Label
                    htmlFor="home"
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-black text-xl text-black">🏠 홈 (후공)</div>
                    <div className="text-sm text-gray-600 mt-1">
                      홈 팀으로 플레이합니다. 후공으로 경기를 진행합니다.
                    </div>
                  </Label>
                </div>
              </div>
              <div
                className={`p-6 border-4 rounded-xl cursor-pointer transition-all ${homeAway === "away"
                  ? "border-purple-500 bg-purple-50/80 ring-4 ring-purple-300"
                  : "border-gray-200 bg-white/60 hover:border-gray-400"
                  }`}
                onClick={() => setHomeAway("away")}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="away" id="away" className="w-6 h-6" />
                  <Label
                    htmlFor="away"
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-black text-xl text-black">✈️ 원정 (선공)</div>
                    <div className="text-sm text-gray-600 mt-1">
                      원정 팀으로 플레이합니다. 선공으로 경기를 시작합니다.
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {/* 선택된 구장 정보 */}
            <div className="mt-6 p-4 bg-orange-50/80 border border-orange-200 rounded-xl">
              <div className="text-sm font-bold text-orange-800 mb-1">선택된 구장</div>
              <div className="font-black text-lg text-black">{selectedStadium.name}</div>
              <div className="text-xs text-gray-600">{selectedStadium.city}</div>
            </div>
          </Card>
        </div>

        {/* 게임 시작 버튼 */}
        <div className="text-center">
          <Button
            onClick={handleStart}
            size="lg"
            className="h-20 px-16 text-2xl font-black bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 hover:from-green-700 hover:via-green-600 hover:to-emerald-700 shadow-2xl transform hover:scale-105 transition-all"
          >
            ⚾ 경기 시작하기
          </Button>
        </div>
      </div>
    </div>
  );
}
