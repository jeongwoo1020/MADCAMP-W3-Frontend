import { useState } from 'react';
import { Lineup, Stadium } from '@/app/types';
import { STADIUMS } from '@/app/data/stadiums';
import { TEAM_THEMES } from '@/app/data/teamThemes';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Label } from '@/app/components/ui/label';
import { Coins, Users } from 'lucide-react';

interface GameSetupProps {
  myLineup: Lineup;
  opponentLineup?: Lineup;
  onGameStart: (stadium: Stadium, isHome: boolean) => void;
}

export function GameSetup({ myLineup, opponentLineup, onGameStart }: GameSetupProps) {
  const [selectedStadium, setSelectedStadium] = useState<Stadium>(STADIUMS[0]);
  const [homeAway, setHomeAway] = useState<'home' | 'away'>('home');

  const myTeam = myLineup.batting[0]?.team || '내 팀';
  const opponentTeam = opponentLineup?.batting[0]?.team || '상대 팀';
  const myTheme = TEAM_THEMES[myTeam];
  const opponentTheme = TEAM_THEMES[opponentTeam];

  const calculateLineupCredits = (lineup: Lineup) => {
    let total = 0;
    lineup.batting.forEach((p) => {
      if (p) total += p.salary;
    });
    if (lineup.pitchers.starter) total += lineup.pitchers.starter.salary;
    lineup.pitchers.middle.forEach((p) => {
      if (p) total += p.salary;
    });
    if (lineup.pitchers.closer) total += lineup.pitchers.closer.salary;
    lineup.bench.forEach((p) => {
      if (p) total += p.salary;
    });
    return total;
  };

  const myCredits = calculateLineupCredits(myLineup);
  const opponentCredits = opponentLineup ? calculateLineupCredits(opponentLineup) : 0;

  const handleStart = () => {
    onGameStart(selectedStadium, homeAway === 'home');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <h2 className="text-3xl font-bold mb-6">게임 설정</h2>

        <div className="grid grid-cols-10 gap-6">
          {/* 좌측 40% - 게임 설정 */}
          <div className="col-span-4">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">게임 설정</h3>

              {/* 구장 선택 */}
              <div className="mb-6">
                <h4 className="font-bold mb-3">구장 선택</h4>
                <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto">
                  {STADIUMS.map((stadium) => (
                    <div
                      key={stadium.id}
                      onClick={() => setSelectedStadium(stadium)}
                      className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedStadium.id === stadium.id
                          ? 'border-blue-500 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={stadium.image}
                        alt={stadium.name}
                        className="w-full h-24 object-cover"
                      />
                      <div className="p-2">
                        <div className="font-semibold text-sm">{stadium.name}</div>
                        <div className="text-xs text-muted-foreground">{stadium.city}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-4" />

              {/* 홈/원정 선택 */}
              <div className="mb-6">
                <h4 className="font-bold mb-3">홈/원정 선택</h4>
                <RadioGroup value={homeAway} onValueChange={(v) => setHomeAway(v as 'home' | 'away')}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="home" id="home" />
                    <Label htmlFor="home" className="flex-1 cursor-pointer">
                      <div className="font-semibold">홈 (후공)</div>
                      <div className="text-xs text-muted-foreground">
                        홈 팀으로 플레이합니다. 후공으로 경기를 진행합니다.
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="away" id="away" />
                    <Label htmlFor="away" className="flex-1 cursor-pointer">
                      <div className="font-semibold">원정 (선공)</div>
                      <div className="text-xs text-muted-foreground">
                        원정 팀으로 플레이합니다. 선공으로 경기를 시작합니다.
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button onClick={handleStart} className="w-full" size="lg">
                ⚾ 게임 시작하기
              </Button>
            </Card>
          </div>

          {/* 우측 60% - 라인업 비교 */}
          <div className="col-span-6">
            <div className="grid grid-cols-2 gap-4">
              {/* 우리 팀 */}
              <Card 
                className="p-4" 
                style={{ 
                  borderColor: myTheme?.primary, 
                  borderWidth: '3px',
                  backgroundColor: `${myTheme?.primary}05`
                }}
              >
                <div className="flex items-center gap-3 mb-3 pb-3 border-b-2" style={{ borderColor: myTheme?.primary }}>
                  {myTheme && (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: myTheme.primary }}
                    >
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-muted-foreground">우리 팀</div>
                    <h3 className="text-lg font-bold">{myTeam}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-600 text-sm mb-3">
                  <Coins className="w-4 h-4" />
                  <span className="font-semibold">{myCredits} 크레딧</span>
                </div>

                {/* 타순 - 간결하게 */}
                <div className="mb-3">
                  <h4 className="font-bold mb-1 text-xs">타순</h4>
                  <div className="space-y-0.5">
                    {myLineup.batting.map((player, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-1 bg-white rounded">
                        <span className="truncate">
                          {idx + 1}. {player?.name}
                        </span>
                        <span className="text-muted-foreground text-xs ml-1">
                          {player?.position}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-2" />

                {/* 투수진 - 간결하게 */}
                <div>
                  <h4 className="font-bold mb-1 text-xs">투수진</h4>
                  <div className="space-y-0.5">
                    <div className="text-xs p-1 bg-white rounded truncate">
                      선발: {myLineup.pitchers.starter?.name}
                    </div>
                    <div className="text-xs p-1 bg-white rounded truncate">
                      계투: {myLineup.pitchers.middle.map(p => p?.name).join(', ')}
                    </div>
                    <div className="text-xs p-1 bg-white rounded truncate">
                      마무리: {myLineup.pitchers.closer?.name}
                    </div>
                  </div>
                </div>
              </Card>

              {/* 상대 팀 */}
              {opponentLineup ? (
                <Card 
                  className="p-4" 
                  style={{ 
                    borderColor: opponentTheme?.primary, 
                    borderWidth: '3px',
                    backgroundColor: `${opponentTheme?.primary}05`
                  }}
                >
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b-2" style={{ borderColor: opponentTheme?.primary }}>
                    {opponentTheme && (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: opponentTheme.primary }}
                      >
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-muted-foreground">상대 팀</div>
                      <h3 className="text-lg font-bold">{opponentTeam}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-amber-600 text-sm mb-3">
                    <Coins className="w-4 h-4" />
                    <span className="font-semibold">{opponentCredits} 크레딧</span>
                  </div>

                  {/* 타순 - 간결하게 */}
                  <div className="mb-3">
                    <h4 className="font-bold mb-1 text-xs">타순</h4>
                    <div className="space-y-0.5">
                      {opponentLineup.batting.map((player, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-1 bg-white rounded">
                          <span className="truncate">
                            {idx + 1}. {player?.name}
                          </span>
                          <span className="text-muted-foreground text-xs ml-1">
                            {player?.position}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* 투수진 - 간결하게 */}
                  <div>
                    <h4 className="font-bold mb-1 text-xs">투수진</h4>
                    <div className="space-y-0.5">
                      <div className="text-xs p-1 bg-white rounded truncate">
                        선발: {opponentLineup.pitchers.starter?.name}
                      </div>
                      <div className="text-xs p-1 bg-white rounded truncate">
                        계투: {opponentLineup.pitchers.middle.map(p => p?.name).join(', ')}
                      </div>
                      <div className="text-xs p-1 bg-white rounded truncate">
                        마무리: {opponentLineup.pitchers.closer?.name}
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="text-4xl mb-2">⏳</div>
                    <div>상대를 찾고 있습니다...</div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
