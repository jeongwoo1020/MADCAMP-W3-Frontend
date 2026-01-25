import { Lineup, GameHistory } from '@/app/types';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { TEAM_THEMES } from '@/app/data/teamThemes';
import { Trophy, TrendingUp, Calendar } from 'lucide-react';

interface GameResultProps {
  myLineup: Lineup;
  opponentLineup: Lineup;
  finalScore: { home: number; away: number };
  isHome: boolean;
  gameHistory: GameHistory[];
  onNewGame: () => void;
}

export function GameResult({
  myLineup,
  opponentLineup,
  finalScore,
  isHome,
  gameHistory,
  onNewGame,
}: GameResultProps) {
  const myTeam = myLineup.batting[0]?.team || '내 팀';
  const opponentTeam = opponentLineup.batting[0]?.team || '상대 팀';
  const myTheme = TEAM_THEMES[myTeam];
  const opponentTheme = TEAM_THEMES[opponentTeam];

  const myScore = isHome ? finalScore.home : finalScore.away;
  const opponentScore = isHome ? finalScore.away : finalScore.home;
  const isWin = myScore > opponentScore;

  // 하이라이트 추출 (홈런, 삼진 등)
  const highlights = gameHistory.filter(
    (h) => h.result.type === 'homerun' || h.result.type === 'strikeout' || h.result.type === 'triple'
  );

  // 통계 계산
  const myHits = gameHistory.filter(
    (h) =>
      h.isHome === isHome &&
      (h.result.type === 'single' ||
        h.result.type === 'double' ||
        h.result.type === 'triple' ||
        h.result.type === 'homerun')
  ).length;

  const opponentHits = gameHistory.filter(
    (h) =>
      h.isHome !== isHome &&
      (h.result.type === 'single' ||
        h.result.type === 'double' ||
        h.result.type === 'triple' ||
        h.result.type === 'homerun')
  ).length;

  const myHomeRuns = gameHistory.filter(
    (h) => h.isHome === isHome && h.result.type === 'homerun'
  ).length;

  const opponentHomeRuns = gameHistory.filter(
    (h) => h.isHome !== isHome && h.result.type === 'homerun'
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1200px] mx-auto">
        {/* 결과 헤더 */}
        <Card
          className={`p-6 mb-6 ${
            isWin
              ? 'bg-gradient-to-r from-green-500 to-green-600'
              : 'bg-gradient-to-r from-red-500 to-red-600'
          } text-white`}
        >
          <div className="text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-2">{isWin ? '승리!' : '패배'}</h1>
            <p className="text-sm opacity-90">
              {isWin ? '축하합니다! 경기에서 승리하였습니다.' : '아쉽게 패배하였습니다. 다음 경기에서 승리하세요!'}
            </p>
          </div>

          {/* 최종 스코어 */}
          <div className="mt-6 flex items-center justify-center gap-12">
            <div className="text-center">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: myTheme?.primary }}
                />
                <span className="text-base font-semibold">{myTeam}</span>
              </div>
              <div className="text-4xl font-bold">{myScore}</div>
            </div>
            <div className="text-2xl font-bold">:</div>
            <div className="text-center">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: opponentTheme?.primary }}
                />
                <span className="text-base font-semibold">{opponentTeam}</span>
              </div>
              <div className="text-4xl font-bold">{opponentScore}</div>
            </div>
          </div>
        </Card>

        {/* 상세 정보 탭 */}
        <Card className="p-6">
          <Tabs defaultValue="summary">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">경기 요약</TabsTrigger>
              <TabsTrigger value="highlights">하이라이트</TabsTrigger>
              <TabsTrigger value="stats">상세 통계</TabsTrigger>
            </TabsList>

            {/* 경기 요약 */}
            <TabsContent value="summary">
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    경기 정보
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">경기 날짜</div>
                      <div className="font-semibold">
                        {new Date().toLocaleDateString('ko-KR')}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">경기 시간</div>
                      <div className="font-semibold">약 {Math.round(gameHistory.length / 3)}분</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">총 이닝</div>
                      <div className="font-semibold">9이닝</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">총 타석</div>
                      <div className="font-semibold">{gameHistory.length}타석</div>
                    </Card>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-bold text-lg mb-4">기본 통계</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div
                        className="font-semibold mb-3 flex items-center gap-2"
                        style={{ color: myTheme?.primary }}
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: myTheme?.primary }}
                        />
                        {myTeam}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">안타</span>
                          <span className="font-semibold">{myHits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">홈런</span>
                          <span className="font-semibold">{myHomeRuns}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">득점</span>
                          <span className="font-semibold">{myScore}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div
                        className="font-semibold mb-3 flex items-center gap-2"
                        style={{ color: opponentTheme?.primary }}
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: opponentTheme?.primary }}
                        />
                        {opponentTeam}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">안타</span>
                          <span className="font-semibold">{opponentHits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">홈런</span>
                          <span className="font-semibold">{opponentHomeRuns}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">득점</span>
                          <span className="font-semibold">{opponentScore}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 하이라이트 */}
            <TabsContent value="highlights">
              <div className="space-y-3">
                <h3 className="font-bold text-lg mb-4">경기 하이라이트</h3>
                {highlights.length > 0 ? (
                  highlights.map((highlight, idx) => (
                    <Card key={idx} className="p-4">
                      <div className="flex items-start gap-3">
                        <Badge
                          variant={highlight.result.type === 'homerun' ? 'default' : 'secondary'}
                        >
                          {highlight.inning}회 {highlight.isHome ? '말' : '초'}
                        </Badge>
                        <div className="flex-1">
                          <div className="font-semibold mb-1">{highlight.result.description}</div>
                          <div className="text-xs text-muted-foreground">
                            타자: {highlight.batter} / 투수: {highlight.pitcher}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    하이라이트가 없습니다
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 상세 통계 */}
            <TabsContent value="stats">
              <div className="space-y-4">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  이닝별 득점
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">팀</th>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((inning) => (
                          <th key={inning} className="text-center p-2">
                            {inning}
                          </th>
                        ))}
                        <th className="text-center p-2 font-bold">R</th>
                        <th className="text-center p-2">H</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2 font-semibold">{isHome ? opponentTeam : myTeam}</td>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((inning) => (
                          <td key={inning} className="text-center p-2">
                            -
                          </td>
                        ))}
                        <td className="text-center p-2 font-bold">
                          {isHome ? opponentScore : myScore}
                        </td>
                        <td className="text-center p-2">
                          {isHome ? opponentHits : myHits}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold">{isHome ? myTeam : opponentTeam}</td>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((inning) => (
                          <td key={inning} className="text-center p-2">
                            -
                          </td>
                        ))}
                        <td className="text-center p-2 font-bold">
                          {isHome ? myScore : opponentScore}
                        </td>
                        <td className="text-center p-2">
                          {isHome ? myHits : opponentHits}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <Separator className="my-6" />

                <div>
                  <h4 className="font-bold mb-3">전체 이벤트</h4>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {gameHistory.map((event, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2 hover:bg-gray-50 rounded flex items-start gap-2"
                      >
                        <Badge variant="outline" className="text-xs">
                          {event.inning}회 {event.isHome ? '말' : '초'}
                        </Badge>
                        <span className="flex-1">{event.result.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* 하단 버튼 */}
        <div className="mt-6 flex gap-4 justify-center">
          <Button onClick={onNewGame} size="lg" className="px-8">
            새 게임 시작
          </Button>
          <Button variant="outline" size="lg" className="px-8">
            라인업 수정
          </Button>
        </div>
      </div>
    </div>
  );
}