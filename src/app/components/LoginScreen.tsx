import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { authService } from "@/app/lib/auth";

interface LoginScreenProps {
  onLogin: (user: {
    name: string;
  }) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [playerName, setPlayerName] = useState("");


  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage:
          'url(https://images.unsplash.com/photo-1660892425121-e7461fc9991c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXNlYmFsbCUyMHN0YWRpdW0lMjBuaWdodHxlbnwxfHx8fDE3NjkzMTUxNjN8MA&ixlib=rb-4.1.0&q=80&w=1080)',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-dark-charcoal/90" />

      {/* 게임 로고/타이틀 영역 */}
      <div className="relative z-10 w-full max-w-5xl">
        {/* 메인 타이틀 */}
        <div className="text-center mb-12 animate-in fade-in duration-1000">
          <div className="mb-6">
            <div className="text-8xl mb-4 drop-shadow-[0_0_15px_rgba(255,49,49,0.5)] animate-bounce text-white">⚾</div>
            <h1 className="text-7xl font-black mb-4 text-white drop-shadow-2xl tracking-tight">
              <span className="bg-gradient-to-r from-sonic-red via-cyber-yellow to-voltage-blue bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,49,49,0.3)]">
                BASEBALL
              </span>
            </h1>
            <h2 className="text-4xl font-bold text-white drop-shadow-xl mb-2">
              프로야구 시뮬레이션 PvP
            </h2>
            <p className="text-xl text-gray-400 font-medium">
              실시간 대결로 최고의 감독이 되어보세요
            </p>
          </div>
        </div>

        {/* 게임 특징 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-card/50 backdrop-blur-md border border-sonic-red/30 rounded-xl p-6 text-center transform hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,49,49,0.1)] hover:shadow-[0_0_20px_rgba(255,49,49,0.3)]">
            <div className="text-5xl mb-3 text-sonic-red drop-shadow-[0_0_10px_rgba(255,49,49,0.5)]">🎮</div>
            <div className="text-white font-bold text-lg mb-1">실시간 PvP</div>
            <div className="text-gray-400 text-sm">친구와 실시간 대결</div>
          </div>
          <div className="bg-card/50 backdrop-blur-md border border-cyber-yellow/30 rounded-xl p-6 text-center transform hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,240,31,0.1)] hover:shadow-[0_0_20px_rgba(255,240,31,0.3)]">
            <div className="text-5xl mb-3 text-cyber-yellow drop-shadow-[0_0_10px_rgba(255,240,31,0.5)]">📊</div>
            <div className="text-white font-bold text-lg mb-1">실제 선수 데이터</div>
            <div className="text-gray-400 text-sm">KBO 리그 선수 통계</div>
          </div>
          <div className="bg-card/50 backdrop-blur-md border border-voltage-blue/30 rounded-xl p-6 text-center transform hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,212,255,0.1)] hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]">
            <div className="text-5xl mb-3 text-voltage-blue drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">⚡</div>
            <div className="text-white font-bold text-lg mb-1">전략적 매니지먼트</div>
            <div className="text-gray-400 text-sm">투수교체, 대타/대주자</div>
          </div>
          <div className="bg-card/50 backdrop-blur-md border border-white/20 rounded-xl p-6 text-center transform hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <div className="text-5xl mb-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">🏆</div>
            <div className="text-white font-bold text-lg mb-1">랭킹 시스템</div>
            <div className="text-gray-400 text-sm">실력을 겨루세요</div>
          </div>
        </div>

        {/* 로그인 버튼 영역 */}
        <div className="max-w-md mx-auto">
          <Card className="p-8 bg-card/80 backdrop-blur-xl border border-voltage-blue/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sonic-red via-cyber-yellow to-voltage-blue" />

            {/* 플레이어 이름 입력 추가 */}
            <div className="mb-12">
              <label className="block text-xl font-black mb-3 text-white uppercase tracking-wider">플레이어 이름</label>
              <Input
                type="text"
                placeholder="이름을 입력하세요"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="text-2xl h-14 bg-black/40 border-white/20 text-white placeholder:text-gray-500 focus:border-voltage-blue focus:ring-voltage-blue font-bold px-6 mb-6"
              />
            </div>

            <div className="flex justify-center w-full">
              <Button
                disabled={!playerName.trim()}
                onClick={async () => {
                  try {
                    const { user, access_token } = await authService.devLogin();
                    localStorage.setItem('token', access_token);
                    localStorage.setItem('userId', String(user.id));
                    // 닉네임 대신 직접 입력한 이름을 사용
                    onLogin({ name: playerName.trim() });
                  } catch (e) {
                    console.error(e);
                    alert("로그인 실패 (백엔드 연결 확인 필요)");
                  }
                }}
                className="w-full h-16 text-lg font-bold bg-white hover:bg-gray-200 text-black border-0 shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)] transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                size="lg"
              >
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google 계정으로 시작하기 (Dev)
              </Button>
            </div>

            {/* <p className="text-xs text-gray-400 text-center mt-6">
              로그인하면{" "}
              <span className="underline text-gray-300 hover:text-white cursor-pointer">이용약관</span> 및{" "}
              <span className="underline text-gray-300 hover:text-white cursor-pointer">개인정보 처리방침</span>
              에 동의하게 됩니다
            </p> */}
          </Card>
        </div>
      </div>
    </div>
  );
}