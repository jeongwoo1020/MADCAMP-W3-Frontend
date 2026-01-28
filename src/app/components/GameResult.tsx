import { useState, useEffect } from 'react';
import { Lineup } from '@/app/types';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { TEAM_THEMES, getFullTeamName } from '@/app/data/teamThemes';
import { Trophy, TrendingUp, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface GameResultProps {
  myLineup: Lineup;
  opponentLineup: Lineup;
  finalScore: { home: number; away: number };
  isHome: boolean;
  matchId: string | null;
  onNewGame: () => void;
}

export function GameResult({
  myLineup,
  opponentLineup,
  finalScore,
  isHome,
  matchId,
  onNewGame,
}: GameResultProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [backendHighlights, setBackendHighlights] = useState<any[]>([]);

  // 데이터 페칭
  useEffect(() => {
    const fetchData = async () => {
      if (!matchId) return;
      try {
        const [summaryRes, statsRes, highlightsRes] = await Promise.all([
          api.get(`/match/${matchId}/summary`),
          api.get(`/match/${matchId}/stats`),
          api.get(`/match/${matchId}/highlights`)
        ]);
        setSummary(summaryRes.data);
        setStats(statsRes.data);
        // 명세서 상 객체 내 배열이므로 .highlights 참조
        setBackendHighlights(highlightsRes.data.highlights || []);
      } catch (e) {
        console.error("Failed to fetch result data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [matchId]);

  const myTeam = myLineup.batting[0]?.team || '내 팀';
  const opponentTeam = opponentLineup.batting[0]?.team || '상대 팀';
  const myTheme = TEAM_THEMES[myTeam];
  const opponentTheme = TEAM_THEMES[opponentTeam];

  // summary API 데이터가 있으면 우선 사용, 없으면 props 사용
  const myScore = summary?.teams
    ? (isHome ? summary.teams.home.score : summary.teams.away.score)
    : (isHome ? finalScore.home : finalScore.away);
  const opponentScore = summary?.teams
    ? (isHome ? summary.teams.away.score : summary.teams.home.score)
    : (isHome ? finalScore.away : finalScore.home);
  const isWin = myScore > opponentScore;

  // 새 stats 데이터 구조에서 총 안타수 계산
  const getTotalHits = (batterStats: any[]) =>
    (batterStats || []).reduce((sum, b) => sum + (b.hit || 0), 0);

  const myHits = stats ? getTotalHits(stats[isHome ? 'home_batter_stats' : 'away_batter_stats']) : 0;
  const opponentHits = stats ? getTotalHits(stats[isHome ? 'away_batter_stats' : 'home_batter_stats']) : 0;


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <p className="text-xl font-bold">경기 결과를 불러오고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1200px] mx-auto">
        {/* 결과 헤더 */}
        <Card
          className={`p-6 mb-6 ${isWin
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
          <div className="mt-8 flex items-center justify-center gap-16">
            {/* 내 팀 */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 bg-white/10 rounded-full p-3 flex items-center justify-center backdrop-blur-md border-2 border-white/20 shadow-lg relative group">
                <img
                  src={`/assets/logos/${getFullTeamName(myTeam)}.png`}
                  alt={myTeam}
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div
                  className="hidden w-full h-full rounded-full flex items-center justify-center text-2xl font-black text-white"
                  style={{ backgroundColor: myTheme?.primary }}
                >
                  {myTeam[0]}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold tracking-tight mb-1">{myTeam}</span>
                <div className="text-5xl font-black drop-shadow-md">{myScore}</div>
              </div>
            </div>

            <div className="text-4xl font-black opacity-50 pb-8">:</div>

            {/* 상대 팀 */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 bg-white/10 rounded-full p-3 flex items-center justify-center backdrop-blur-md border-2 border-white/20 shadow-lg relative group">
                <img
                  src={`/assets/logos/${getFullTeamName(opponentTeam)}.png`}
                  alt={opponentTeam}
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div
                  className="hidden w-full h-full rounded-full flex items-center justify-center text-2xl font-black text-white"
                  style={{ backgroundColor: opponentTheme?.primary }}
                >
                  {opponentTeam[0]}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold tracking-tight mb-1">{opponentTeam}</span>
                <div className="text-5xl font-black drop-shadow-md">{opponentScore}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* 상세 정보 탭 */}
        <Card className="p-6">
          <Tabs defaultValue="highlights">
            <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200 p-1 h-12">
              <TabsTrigger
                value="highlights"
                className="text-black data-[state=active]:bg-gray-100 data-[state=active]:shadow-none font-bold"
              >
                하이라이트
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="text-black data-[state=active]:bg-gray-100 data-[state=active]:shadow-none font-bold"
              >
                상세 통계
              </TabsTrigger>
            </TabsList>


            {/* 하이라이트 */}
            <TabsContent value="highlights">
              <div className="space-y-3">
                <h3 className="font-bold text-lg mb-4">경기 하이라이트</h3>
                {backendHighlights.length > 0 ? (
                  backendHighlights.map((highlight: any, idx: number) => (
                    <Card key={idx} className="p-4">
                      <div className="flex items-start gap-3">
                        <Badge
                          variant={highlight.event === 'HOMERUN' ? 'default' : 'secondary'}
                        >
                          {highlight.inning}회
                        </Badge>
                        <div className="flex-1">
                          <div className="font-semibold mb-1">{highlight.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {highlight.event}
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
                          <td key={inning} className="text-center p-2">-</td>
                        ))}
                        <td className="text-center p-2 font-bold">{opponentScore}</td>
                        <td className="text-center p-2">{opponentHits}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold">{isHome ? myTeam : opponentTeam}</td>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((inning) => (
                          <td key={inning} className="text-center p-2">-</td>
                        ))}
                        <td className="text-center p-2 font-bold">{myScore}</td>
                        <td className="text-center p-2">{myHits}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <Separator className="my-6" />

                {/* 박스스코어: 타자 기록 */}
                <div>
                  <h4 className="font-bold mb-3">팀별 타자 기록</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 내 팀 타자 */}
                    <Card className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={`/assets/logos/${getFullTeamName(myTeam)}.png`}
                          alt={myTeam}
                          className="w-6 h-6 object-contain"
                          onError={(e: any) => e.currentTarget.style.display = 'none'}
                        />
                        <div className="text-sm font-bold" style={{ color: myTheme?.primary }}>{myTeam}</div>
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left font-bold py-1">선수</th>
                            <th className="text-right font-bold py-1">타수</th>
                            <th className="text-right font-bold py-1">안타</th>
                            <th className="text-right font-bold py-1">홈런</th>
                            <th className="text-right font-bold py-1">타점</th>
                            <th className="text-right font-bold py-1">득점</th>
                            <th className="text-right font-bold py-1">삼진</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(stats?.[isHome ? 'home_batter_stats' : 'away_batter_stats'] || []).map((b: any, idx: number) => (
                            <tr key={idx} className="border-b last:border-0 h-8">
                              <td className="py-1">{b.player_name} ({b.position})</td>
                              <td className="text-right py-1">{b.ab}</td>
                              <td className="text-right py-1">{b.hit}</td>
                              <td className="text-right py-1 font-semibold">{b.hr}</td>
                              <td className="text-right py-1">{b.rbi}</td>
                              <td className="text-right py-1">{b.run}</td>
                              <td className="text-right py-1 text-muted-foreground">{b.so}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>

                    {/* 상대 팀 타자 */}
                    <Card className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={`/assets/logos/${getFullTeamName(opponentTeam)}.png`}
                          alt={opponentTeam}
                          className="w-6 h-6 object-contain"
                          onError={(e: any) => e.currentTarget.style.display = 'none'}
                        />
                        <div className="text-sm font-bold" style={{ color: opponentTheme?.primary }}>{opponentTeam}</div>
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left font-bold py-1">선수</th>
                            <th className="text-right font-bold py-1">타수</th>
                            <th className="text-right font-bold py-1">안타</th>
                            <th className="text-right font-bold py-1">홈런</th>
                            <th className="text-right font-bold py-1">타점</th>
                            <th className="text-right font-bold py-1">득점</th>
                            <th className="text-right font-bold py-1">삼진</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(stats?.[isHome ? 'away_batter_stats' : 'home_batter_stats'] || []).map((b: any, idx: number) => (
                            <tr key={idx} className="border-b last:border-0 h-8">
                              <td className="py-1">{b.player_name} ({b.position})</td>
                              <td className="text-right py-1">{b.ab}</td>
                              <td className="text-right py-1">{b.hit}</td>
                              <td className="text-right py-1 font-semibold">{b.hr}</td>
                              <td className="text-right py-1">{b.rbi}</td>
                              <td className="text-right py-1">{b.run}</td>
                              <td className="text-right py-1 text-muted-foreground">{b.so}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* 박스스코어: 투수 기록 */}
                <div>
                  <h4 className="font-bold mb-3">팀별 투수 기록</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 내 팀 투수 */}
                    <Card className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={`/assets/logos/${getFullTeamName(myTeam)}.png`}
                          alt={myTeam}
                          className="w-6 h-6 object-contain"
                          onError={(e: any) => e.currentTarget.style.display = 'none'}
                        />
                        <div className="text-sm font-bold" style={{ color: myTheme?.primary }}>{myTeam}</div>
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left font-bold py-1">선수</th>
                            <th className="text-right font-bold py-1">이닝 (IP)</th>
                            <th className="text-right font-bold py-1">자책 (ER)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(stats?.[isHome ? 'home_pitcher_stats' : 'away_pitcher_stats'] || []).map((p: any, idx: number) => (
                            <tr key={idx} className="border-b last:border-0 h-8">
                              <td className="py-1">{p.player_name}</td>
                              <td className="text-right py-1">{p.ip}</td>
                              <td className="text-right py-1">{p.er}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>

                    {/* 상대 팀 투수 */}
                    <Card className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={`/assets/logos/${getFullTeamName(opponentTeam)}.png`}
                          alt={opponentTeam}
                          className="w-6 h-6 object-contain"
                          onError={(e: any) => e.currentTarget.style.display = 'none'}
                        />
                        <div className="text-sm font-bold" style={{ color: opponentTheme?.primary }}>{opponentTeam}</div>
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left font-bold py-1">선수</th>
                            <th className="text-right font-bold py-1">이닝 (IP)</th>
                            <th className="text-right font-bold py-1">자책 (ER)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(stats?.[isHome ? 'away_pitcher_stats' : 'home_pitcher_stats'] || []).map((p: any, idx: number) => (
                            <tr key={idx} className="border-b last:border-0 h-8">
                              <td className="py-1">{p.player_name}</td>
                              <td className="text-right py-1">{p.ip}</td>
                              <td className="text-right py-1">{p.er}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* <div>
                  <h4 className="font-bold mb-3">전체 상세 기록</h4>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {backendHighlights.length > 0 ? (
                      backendHighlights.map((event: any, idx: number) => (
                        <div
                          key={idx}
                          className="text-sm p-3 hover:bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-4 transition-colors"
                        >
                          <Badge variant={event.event === 'HOMERUN' ? 'default' : 'outline'} className="flex-shrink-0 mt-0.5">
                            {event.inning}회 {event.is_top ? '초' : '말'}
                          </Badge>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800">{event.description}</div>
                            {event.data?.detail && event.data.detail !== event.description && (
                              <div className="text-xs text-muted-foreground mt-1">{event.data.detail}</div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8 text-sm italic">
                        기록된 상세 이벤트가 없습니다
                      </div>
                    )}
                  </div>
                </div> */}
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