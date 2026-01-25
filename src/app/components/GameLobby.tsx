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

  // 초대 코드 생성 /api/rooms POST
  const handleCreateWithCode = async () => {
    try {
      // TODO: 백엔드 연결 시 주석 해제
      // const response = await api.post('/api/rooms', { user_id: 1 });
      // setGeneratedCode(response.data.match_id);

      // Mock Data for UI Testing
      const mockMatchId = Math.random().toString(36).substring(2, 8).toUpperCase();
      await new Promise(resolve => setTimeout(resolve, 500)); // 0.5초 딜레이 시뮬레이션
      setGeneratedCode(mockMatchId);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('방 생성에 실패했습니다.');
    }
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
    <div 
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1729280968440-367f2775afce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXNlYmFsbCUyMGZpZWxkJTIwZ3Jhc3N8ZW58MXx8fHwxNzY5MzE1MTY1fDA&ixlib=rb-4.1.0&q=80&w=1080)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-black/80" />

      <div className="w-full max-w-4xl relative z-10">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20 animate-pulse">
              <span className="text-4xl">⚾</span>
            </div>
          </div>
          <h1 className="text-6xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-3 drop-shadow-2xl">
            게임 로비
          </h1>
          <p className="text-2xl text-white font-bold drop-shadow-lg">라인업을 구성하고 친구와 대결하세요!</p>
        </div>

        {/* 메인 카드 */}
        <Card className="p-8 bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border-2 border-white/20 shadow-2xl">
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-black/40 p-1">
              <TabsTrigger 
                value="create" 
                className="text-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white"
              >
                게임 만들기
              </TabsTrigger>
              <TabsTrigger 
                value="join" 
                className="text-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white"
              >
                게임 참여하기
              </TabsTrigger>
            </TabsList>

            {/* 게임 만들기 탭 */}
            <TabsContent value="create">
              <div className="space-y-4">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-white">게임 모드 선택</h3>
                  <p className="text-sm text-gray-300">
                    원하는 방식으로 상대를 찾아보세요
                  </p>
                </div>

                {/* 플레이어 이름 입력 */}
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2 text-white">플레이어 이름</label>
                  <Input
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="text-lg bg-black/40 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                {/* 게임 모드 선택 버튼들 */}
                <div className="grid grid-cols-1 gap-4">
                  {/* 친구 초대 */}
                  <Card className="p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-blue-500/30 hover:border-blue-500 bg-gradient-to-br from-blue-900/30 to-blue-800/20 backdrop-blur">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Users className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xl mb-1 text-white">친구와 함께</h4>
                        <p className="text-sm text-gray-300 mb-3">
                          1:1로 친구와 직접 대결하세요
                        </p>
                        {!generatedCode ? (
                          <Button onClick={handleCreateWithCode} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold">
                            초대 코드 생성
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                value={generatedCode}
                                readOnly
                                className="font-mono text-2xl text-center font-bold bg-black/60 border-blue-400/50 text-yellow-400"
                              />
                              <Button onClick={handleCopyCode} variant="outline" size="icon" className="border-blue-400/50 hover:bg-blue-500/20">
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-gray-300 text-center">
                              친구에게 이 코드를 공유하세요
                            </p>
                            <Button
                              onClick={() => onCreateGame('invite')}
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-bold"
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
                  <Card className="p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-green-500/30 hover:border-green-500 bg-gradient-to-br from-green-900/30 to-green-800/20 backdrop-blur">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Shuffle className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xl mb-1 text-white">랜덤 매칭</h4>
                        <p className="text-sm text-gray-300 mb-3">
                          실력이 비슷한 상대와 자동 매칭됩니다
                        </p>
                        <Button
                          onClick={() => onCreateGame('random')}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 font-bold"
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
                  <h3 className="text-2xl font-bold mb-2 text-white">초대 코드로 참여</h3>
                  <p className="text-sm text-gray-300">
                    친구가 공유한 6자리 코드를 입력하세요
                  </p>
                </div>

                {/* 플레이어 이름 입력 */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-white">플레이어 이름</label>
                  <Input
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="text-lg bg-black/40 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                {/* 초대 코드 입력 */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-white">초대 코드</label>
                  <Input
                    type="text"
                    placeholder="6자리 코드 입력"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-3xl text-center font-mono font-bold uppercase bg-black/60 border-green-400/50 text-yellow-400"
                  />
                </div>

                <Button
                  onClick={handleJoin}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 font-bold"
                  size="lg"
                  disabled={inviteCode.length !== 6 || !playerName}
                >
                  게임 참여하기 <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-center text-gray-400">
                    초대 코드는 게임 생성 시 자동으로 발급됩니다
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* 하단 정보 */}
        <div className="mt-6 text-center text-yellow-400 text-lg font-bold drop-shadow-lg">
          <p>🏆 크레딧을 효율적으로 사용해서 최강의 라인업을 만드세요! 🏆</p>
        </div>
      </div>
    </div>
  );
}