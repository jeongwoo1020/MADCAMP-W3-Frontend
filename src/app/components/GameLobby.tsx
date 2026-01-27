import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Users, Copy, Shuffle, ArrowRight, Loader2, XCircle } from 'lucide-react';
import { matchmakingService } from '@/app/lib/matchmaking';
import { api } from '@/app/lib/api'; // ⭐ 추가
import { useRef, useEffect } from 'react';

interface GameLobbyProps {
  onCreateGame: (mode: 'friend' | 'invite' | 'random', matchId?: string) => void;
  onJoinGame: (inviteCode: string) => void;
}

export function GameLobby({ onCreateGame, onJoinGame }: GameLobbyProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  // 매칭 관련 상태
  const [isMatching, setIsMatching] = useState(false);
  const [matchStatus, setMatchStatus] = useState("IDLE");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 초대 코드 생성 /api/rooms POST
  const handleCreateWithCode = async () => {
    try {
      const userIdStr = localStorage.getItem('userId');
      const userId = userIdStr ? Number(userIdStr) : 1;

      const response = await api.post('/rooms', { user_id: userId });
      setGeneratedCode(response.data.invite_code);
      console.log("✅ Room Created, Invite Code:", response.data.invite_code);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('방 생성에 실패했습니다.');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    alert('초대 코드가 복사되었습니다!');
  };

  const handleJoin = async () => {
    if (inviteCode.trim().length >= 4) {
      try {
        const userIdStr = localStorage.getItem('userId');
        const userId = userIdStr ? Number(userIdStr) : 1;

        // 백엔드에 Join 요청
        const response = await api.post('/rooms/join', {
          invite_code: inviteCode,
          guest_id: userId
        });

        console.log("✅ Joined Room, Match ID:", response.data.match_id);
        onJoinGame(response.data.match_id); // 참가 후에는 내부 트래킹용 match_id 사용
      } catch (e) {
        console.error("Join Error:", e);
        alert("방 참여에 실패했습니다. 코드를 확인해주세요.");
      }
    } else {
      alert('초대 코드를 입력해주세요.');
    }
  };


  const handleRandomMatch = async () => {
    try {
      setIsMatching(true);
      setMatchStatus("WAITING");

      const userId = Number(localStorage.getItem("userId") || "0");
      if (userId === 0) {
        alert("로그인이 필요합니다.");
        setIsMatching(false);
        return;
      }

      await matchmakingService.joinQueue(userId);

      // 폴링 시작
      pollingRef.current = setInterval(async () => {
        try {
          const res = await matchmakingService.checkStatus(userId);
          console.log("Match Status:", res);

          if (res.status === "MATCHED") {
            clearInterval(pollingRef.current!);
            setMatchStatus("MATCHED");

            // 매칭 성공 시 라인업 화면으로 이동
            setTimeout(() => {
              onCreateGame('random', res.matchId); // ⭐ matchId 전달
            }, 1000);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 1000);

    } catch (error) {
      console.error("Join Queue failed:", error);
      alert("매칭 신청 실패!");
      setIsMatching(false);
    }
  };

  const cancelMatching = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    try {
      const userId = Number(localStorage.getItem("userId") || "0");
      await matchmakingService.cancelQueue(userId);
    } catch (e) {
      console.error(e);
    }
    setIsMatching(false);
    setMatchStatus("IDLE");
  };

  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, []);

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
      <div className="absolute inset-0 bg-dark-charcoal/90" />

      <div className="w-full max-w-4xl relative z-10">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            {/* <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,49,49,0.5)] border-4 border-sonic-red animate-pulse">
              <span className="text-4xl text-white">⚾</span>
            </div> */}
            <div className="text-8xl mb-4 drop-shadow-[0_0_15px_rgba(255,49,49,0.5)] animate-bounce text-white">⚾</div>
          </div>
          <h2 className="text-5xl font-black bg-gradient-to-r from-sonic-red via-cyber-yellow to-voltage-blue bg-clip-text text-transparent mb-4 drop-shadow-[0_0_15px_rgba(255,49,49,0.4)]">
            게임 로비
          </h2>
          <p className="text-2xl text-white font-black drop-shadow-2xl">라인업을 구성하고 친구와 대결하세요!</p>
        </div>

        {/* 메인 카드 */}
        <Card className="p-8 bg-card/80 backdrop-blur-xl border border-voltage-blue/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sonic-red via-cyber-yellow to-voltage-blue" />

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-black/40 p-1.5 border border-white/10 h-16">
              <TabsTrigger
                value="create"
                className="text-2xl data-[state=active]:bg-voltage-blue data-[state=active]:text-black text-gray-400 transition-all font-black"
              >
                게임 만들기
              </TabsTrigger>
              <TabsTrigger
                value="join"
                className="text-2xl data-[state=active]:bg-cyber-yellow data-[state=active]:text-black text-gray-400 transition-all font-black"
              >
                게임 참여하기
              </TabsTrigger>
            </TabsList>

            {/* 게임 만들기 탭 (Blue & White) */}
            <TabsContent value="create">
              <div className="space-y-4">

                {/* 게임 모드 선택 버튼들 */}
                <div className="grid grid-cols-1 gap-4">
                  {/* 친구 초대 */}
                  <Card className="p-6 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all cursor-pointer border border-voltage-blue/30 hover:border-voltage-blue bg-card/50 backdrop-blur group">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-voltage-blue/10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border border-voltage-blue/50 group-hover:bg-voltage-blue/20 transition-colors">
                        <Users className="w-7 h-7 text-voltage-blue" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-3xl mb-2 text-white group-hover:text-voltage-blue transition-colors italic">친구와 함께</h4>
                        <p className="text-lg text-gray-300 mb-4 font-medium">
                          1:1로 친구와 직접 대결하세요
                        </p>
                        {!generatedCode ? (
                          <Button onClick={handleCreateWithCode} className="w-full h-14 bg-white hover:bg-gray-200 text-black border-0 font-black text-xl shadow-lg shadow-voltage-blue/20">
                            초대 코드 생성
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                value={generatedCode}
                                readOnly
                                className="font-mono text-2xl text-center font-bold bg-black/60 border-voltage-blue text-voltage-blue"
                              />
                              <Button onClick={handleCopyCode} variant="outline" size="icon" className="border-voltage-blue text-voltage-blue hover:bg-voltage-blue hover:text-black">
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-gray-400 text-center">
                              친구에게 이 코드를 공유하세요
                            </p>
                            <Button
                              onClick={() => onCreateGame('invite', generatedCode)}
                              className="w-full h-16 bg-white hover:bg-gray-200 text-black border-0 font-black text-2xl shadow-lg shadow-voltage-blue/20 mt-4"
                            >
                              라인업 구성하기 <ArrowRight className="w-6 h-6 ml-2 stroke-[3]" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* 랜덤 매칭 */}
                  <Card className="p-6 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all cursor-pointer border border-voltage-blue/30 hover:border-voltage-blue bg-card/50 backdrop-blur group">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-voltage-blue/10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border border-voltage-blue/50 group-hover:bg-voltage-blue/20 transition-colors">
                        <Shuffle className="w-7 h-7 text-voltage-blue" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-3xl mb-2 text-white group-hover:text-voltage-blue transition-colors italic">랜덤 매칭</h4>
                        <p className="text-lg text-gray-300 mb-4 font-medium">
                          실력이 비슷한 상대와 자동 매칭됩니다
                        </p>

                        {!isMatching ? (
                          <Button
                            onClick={() => handleRandomMatch()}
                            className="w-full h-14 bg-white hover:bg-gray-200 text-black border-0 font-black text-xl shadow-lg shadow-voltage-blue/20"
                          >
                            매칭 시작하기 <ArrowRight className="w-6 h-6 ml-2 stroke-[3]" />
                          </Button>
                        ) : (
                          <div className="flex flex-col gap-3 mt-4">
                            <div className="flex items-center justify-center gap-3 text-white font-black animate-pulse py-3 bg-black/20 rounded-xl">
                              <Loader2 className="w-7 h-7 animate-spin text-cyber-yellow" />
                              <span className="text-xl">{matchStatus === "MATCHED" ? "매칭 성공!" : "상대방 찾는 중..."}</span>
                            </div>
                            <Button
                              variant="destructive"
                              onClick={cancelMatching}
                              className="w-full h-12 text-lg font-bold"
                            >
                              <XCircle className="w-5 h-5 mr-2" /> 매칭 취소
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* 게임 참여하기 탭 (Yellow & White) */}
            <TabsContent value="join">
              <div className="space-y-6">

                <div>
                  <p className="text-2xl mb-2 text-white font-black italic">
                    친구가 공유한 초대 코드를 입력하세요
                  </p>
                </div>

                {/* 초대 코드 입력 */}
                <div>
                  <label className="block text-xl font-black mb-3 text-white uppercase tracking-wider">초대 코드</label>
                  <Input
                    type="text"
                    placeholder="6자리 코드 입력"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-2xl h-24 text-center font-mono font-black uppercase bg-black/60 border-cyber-yellow text-cyber-yellow focus-visible:border-cyber-yellow focus-visible:ring-cyber-yellow tracking-widest"
                  />
                </div>

                <Button
                  onClick={handleJoin}
                  className="w-full h-16 bg-white hover:bg-gray-200 text-black font-black text-2xl border-0 shadow-lg shadow-cyber-yellow/20"
                  disabled={inviteCode.trim().length < 4}
                >
                  게임 참여하기 <ArrowRight className="w-6 h-6 ml-2 stroke-[3]" />
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
        {/* <div className="mt-6 text-center text-cyber-yellow text-lg font-bold drop-shadow-lg animate-pulse">
          <p>🏆 크레딧을 효율적으로 사용해서 최강의 라인업을 만드세요! 🏆</p>
        </div> */}
      </div>
    </div>
  );
}