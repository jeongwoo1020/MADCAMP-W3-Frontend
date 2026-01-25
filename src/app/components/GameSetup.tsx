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
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1645536727800-7049be76bccf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXNlYmFsbCUyMHN0YWRpdW0lMjBlbnRyYW5jZXxlbnwxfHx8fDE3NjkzMTU5NjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/85 to-black/90" />

      <div className="max-w-[1600px] mx-auto p-6 relative z-10">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-yellow-400" />
            <h2 className="text-6xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              경기 준비
            </h2>
            <Trophy className="w-12 h-12 text-yellow-400" />
          </div>
          <p className="text-white/80 text-xl font-semibold">경기 시작 전 라인업과 설정을 확인하세요</p>
        </div>

        {/* 팀 대결 카드 */}
        <div className="grid grid-cols-3 gap-6 mb-8 items-center">
          {/* 우리 팀 */}
          <Card 
            className="p-6 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl border-4 shadow-2xl"
            style={{ borderColor: myTheme?.primary }}
          >
            <div className="text-center mb-4">
              <Badge className="mb-2 text-xs" style={{ backgroundColor: myTheme?.primary }}>
                내 팀
              </Badge>
              <div 
                className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-3 border-4"
                style={{ 
                  backgroundColor: myTheme?.primary,
                  borderColor: myTheme?.primary,
                }}
              >
                <Users className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-black mb-2">{myTeam}</h3>
              <div className="flex items-center justify-center gap-1 text-amber-600 font-bold">
                <Coins className="w-4 h-4" />
                <span>{myCredits} 크레딧</span>
              </div>
            </div>

            <Separator className="my-4" />

            {/* 타순 미리보기 */}
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-muted-foreground">선발 라인업</h4>
              {myLineup.batting.slice(0, 5).map((player, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                  <span className="font-semibold">{idx + 1}. {player?.name}</span>
                  <Badge variant="secondary" className="text-xs">{player?.position}</Badge>
                </div>
              ))}
              <div className="text-center text-xs text-muted-foreground pt-1">
                +4명
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs font-bold mb-1">선발투수</div>
                <div className="text-xs bg-green-50 p-2 rounded">
                  {myLineup.pitchers.starter?.name}
                </div>
              </div>
            </div>
          </Card>

          {/* VS 중앙 */}
          <div className="text-center">
            <div className="text-8xl font-black bg-gradient-to-b from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent animate-pulse">
              VS
            </div>
          </div>

          {/* 상대 팀 */}
          {opponentLineup ? (
            <Card 
              className="p-6 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl border-4 shadow-2xl"
              style={{ borderColor: opponentTheme?.primary }}
            >
              <div className="text-center mb-4">
                <Badge className="mb-2 text-xs" style={{ backgroundColor: opponentTheme?.primary }}>
                  상대 팀
                </Badge>
                <div 
                  className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-3 border-4"
                  style={{ 
                    backgroundColor: opponentTheme?.primary,
                    borderColor: opponentTheme?.primary,
                  }}
                >
                  <Users className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-2">{opponentTeam}</h3>
                <div className="flex items-center justify-center gap-1 text-amber-600 font-bold">
                  <Coins className="w-4 h-4" />
                  <span>{opponentCredits} 크레딧</span>
                </div>
              </div>

              <Separator className="my-4" />

              {/* 타순 미리보기 */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-muted-foreground">선발 라인업</h4>
                {opponentLineup.batting.slice(0, 5).map((player, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                    <span className="font-semibold">{idx + 1}. {player?.name}</span>
                    <Badge variant="secondary" className="text-xs">{player?.position}</Badge>
                  </div>
                ))}
                <div className="text-center text-xs text-muted-foreground pt-1">
                  +4명
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs font-bold mb-1">선발투수</div>
                  <div className="text-xs bg-green-50 p-2 rounded">
                    {opponentLineup.pitchers.starter?.name}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 bg-white/90 backdrop-blur-xl flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <div className="text-6xl mb-4 animate-bounce">⏳</div>
                <div className="text-lg font-bold">상대를 찾고 있습니다...</div>
              </div>
            </Card>
          )}
        </div>

        {/* 게임 설정 섹션 */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* 구장 선택 */}
          <Card className="p-6 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl border-2 border-white/30">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-black">구장 선택</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {STADIUMS.map((stadium) => (
                <div
                  key={stadium.id}
                  onClick={() => setSelectedStadium(stadium)}
                  className={`cursor-pointer rounded-xl overflow-hidden border-4 transition-all shadow-lg hover:scale-105 ${
                    selectedStadium.id === stadium.id
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
                    <div className="font-bold text-sm">{stadium.name}</div>
                    <div className="text-xs text-muted-foreground">{stadium.city}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 홈/원정 선택 */}
          <Card className="p-6 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl border-2 border-white/30">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-purple-600" />
              <h3 className="text-2xl font-black">홈/원정 선택</h3>
            </div>
            <RadioGroup
              value={homeAway}
              onValueChange={(v) =>
                setHomeAway(v as "home" | "away")
              }
              className="space-y-4"
            >
              <div 
                className={`p-6 border-4 rounded-xl cursor-pointer transition-all ${
                  homeAway === "home" 
                    ? "border-blue-500 bg-blue-50 ring-4 ring-blue-300" 
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
                onClick={() => setHomeAway("home")}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="home" id="home" className="w-6 h-6" />
                  <Label
                    htmlFor="home"
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-black text-xl">🏠 홈 (후공)</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      홈 팀으로 플레이합니다. 후공으로 경기를 진행합니다.
                    </div>
                  </Label>
                </div>
              </div>
              <div 
                className={`p-6 border-4 rounded-xl cursor-pointer transition-all ${
                  homeAway === "away" 
                    ? "border-purple-500 bg-purple-50 ring-4 ring-purple-300" 
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
                onClick={() => setHomeAway("away")}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="away" id="away" className="w-6 h-6" />
                  <Label
                    htmlFor="away"
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-black text-xl">✈️ 원정 (선공)</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      원정 팀으로 플레이합니다. 선공으로 경기를 시작합니다.
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {/* 선택된 구장 정보 */}
            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl">
              <div className="text-sm font-bold text-yellow-800 mb-1">선택된 구장</div>
              <div className="font-black text-lg">{selectedStadium.name}</div>
              <div className="text-xs text-muted-foreground">{selectedStadium.city}</div>
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
