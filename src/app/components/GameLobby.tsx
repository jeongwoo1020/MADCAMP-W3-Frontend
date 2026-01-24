import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Users, Copy, Shuffle, ArrowRight } from 'lucide-react';

interface GameLobbyProps {
  onCreateGame: (mode: 'friend' | 'invite' | 'random') => void;
  onJoinGame: (inviteCode: string) => void;
}

export function GameLobby({ onCreateGame, onJoinGame }: GameLobbyProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [playerName, setPlayerName] = useState('');

  const handleCreateWithCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedCode(code);
    onCreateGame('invite');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    alert('초대 코드가 복사되었습니다!');
  };

  const handleJoin = () => {
    if (inviteCode.length === 6) {
      onJoinGame(inviteCode);
    } else {
      alert('6자리 초대 코드를 입력해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl">⚾</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            야구 시뮬레이션 게임
          </h1>
          <p className="text-xl text-slate-300">라인업을 구성하고 친구와 대결하세요!</p>
        </div>

        {/* 메인 카드 */}
        <Card className="p-8">
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="create" className="text-lg">
                게임 만들기
              </TabsTrigger>
              <TabsTrigger value="join" className="text-lg">
                게임 참여하기
              </TabsTrigger>
            </TabsList>

            {/* 게임 만들기 탭 */}
            <TabsContent value="create">
              <div className="space-y-4">
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">게임 모드 선택</h3>
                  <p className="text-sm text-muted-foreground">
                    원하는 방식으로 상대를 찾아보세요
                  </p>
                </div>

                {/* 플레이어 이름 입력 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">플레이어 이름</label>
                  <Input
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="text-lg"
                  />
                </div>

                {/* 게임 모드 선택 버튼들 */}
                <div className="grid grid-cols-1 gap-4">
                  {/* 친구 초대 */}
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-1">친구와 함께</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          1:1로 친구와 직접 대결하세요
                        </p>
                        {!generatedCode ? (
                          <Button onClick={handleCreateWithCode} className="w-full">
                            초대 코드 생성
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                value={generatedCode}
                                readOnly
                                className="font-mono text-2xl text-center font-bold"
                              />
                              <Button onClick={handleCopyCode} variant="outline" size="icon">
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                              친구에게 이 코드를 공유하세요
                            </p>
                            <Button
                              onClick={() => onCreateGame('invite')}
                              className="w-full"
                              size="lg"
                            >
                              라인업 구성하기 <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* 랜덤 매칭 */}
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-500">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Shuffle className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-1">랜덤 매칭</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          실력이 비슷한 상대와 자동 매칭됩니다
                        </p>
                        <Button
                          onClick={() => onCreateGame('random')}
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={!playerName}
                        >
                          매칭 시작하기 <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* 게임 참여하기 탭 */}
            <TabsContent value="join">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">초대 코드로 참여</h3>
                  <p className="text-sm text-muted-foreground">
                    친구가 공유한 6자리 코드를 입력하세요
                  </p>
                </div>

                {/* 플레이어 이름 입력 */}
                <div>
                  <label className="block text-sm font-medium mb-2">플레이어 이름</label>
                  <Input
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="text-lg"
                  />
                </div>

                {/* 초대 코드 입력 */}
                <div>
                  <label className="block text-sm font-medium mb-2">초대 코드</label>
                  <Input
                    type="text"
                    placeholder="6자리 코드 입력"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-2xl text-center font-mono font-bold uppercase"
                  />
                </div>

                <Button
                  onClick={handleJoin}
                  className="w-full"
                  size="lg"
                  disabled={inviteCode.length !== 6 || !playerName}
                >
                  게임 참여하기 <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="pt-4 border-t">
                  <p className="text-xs text-center text-muted-foreground">
                    초대 코드는 게임 생성 시 자동으로 발급됩니다
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* 하단 정보 */}
        <div className="mt-6 text-center text-blue-100 text-sm">
          <p>💡 팁: 크레딧을 효율적으로 사용해서 최강의 라인업을 만드세요!</p>
        </div>
      </div>
    </div>
  );
}