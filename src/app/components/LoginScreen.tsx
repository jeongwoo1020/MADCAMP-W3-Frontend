import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";

interface LoginScreenProps {
  onLogin: (user: {
    name: string;
    email: string;
    profileImage: string;
  }) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const handleGoogleLogin = () => {
    // 실제 구현에서는 Google OAuth를 사용
    // 여기서는 Mock 데이터로 로그인 시뮬레이션
    const mockUser = {
      name: "야구팬",
      email: "baseball@example.com",
      profileImage:
        "https://ui-avatars.com/api/?name=Baseball+Fan&background=random",
    };
    onLogin(mockUser);
  };

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
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

      {/* 게임 로고/타이틀 영역 */}
      <div className="relative z-10 w-full max-w-5xl">
        {/* 메인 타이틀 */}
        <div className="text-center mb-12 animate-in fade-in duration-1000">
          <div className="mb-6">
            <div className="text-8xl mb-4 drop-shadow-lg animate-bounce">⚾</div>
            <h1 className="text-7xl font-black mb-4 text-white drop-shadow-2xl tracking-tight">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                BASEBALL
              </span>
            </h1>
            <h2 className="text-4xl font-bold text-white drop-shadow-xl mb-2">
              프로야구 시뮬레이션 PvP
            </h2>
            <p className="text-xl text-gray-300 font-medium">
              실시간 대결로 최고의 감독이 되어보세요
            </p>
          </div>
        </div>

        {/* 게임 특징 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-md border-2 border-blue-400/30 rounded-xl p-6 text-center transform hover:scale-105 transition-transform">
            <div className="text-5xl mb-3">🎮</div>
            <div className="text-white font-bold text-lg mb-1">실시간 PvP</div>
            <div className="text-gray-300 text-sm">친구와 실시간 대결</div>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-md border-2 border-green-400/30 rounded-xl p-6 text-center transform hover:scale-105 transition-transform">
            <div className="text-5xl mb-3">📊</div>
            <div className="text-white font-bold text-lg mb-1">실제 선수 데이터</div>
            <div className="text-gray-300 text-sm">KBO 리그 선수 통계</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-md border-2 border-purple-400/30 rounded-xl p-6 text-center transform hover:scale-105 transition-transform">
            <div className="text-5xl mb-3">⚡</div>
            <div className="text-white font-bold text-lg mb-1">전략적 매니지먼트</div>
            <div className="text-gray-300 text-sm">투수교체, 대타/대주자</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-600/20 to-orange-800/20 backdrop-blur-md border-2 border-yellow-400/30 rounded-xl p-6 text-center transform hover:scale-105 transition-transform">
            <div className="text-5xl mb-3">🏆</div>
            <div className="text-white font-bold text-lg mb-1">랭킹 시스템</div>
            <div className="text-gray-300 text-sm">실력을 겨루세요</div>
          </div>
        </div>

        {/* 로그인 버튼 영역 */}
        <div className="max-w-md mx-auto">
          <Card className="p-8 bg-black/60 backdrop-blur-xl border-2 border-white/20 shadow-2xl">
            <Button
              onClick={handleGoogleLogin}
              className="w-full h-16 text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg transform hover:scale-105 transition-transform"
              size="lg"
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              게임 시작하기
            </Button>

            <p className="text-xs text-gray-400 text-center mt-6">
              로그인하면{" "}
              <span className="underline text-gray-300">이용약관</span> 및{" "}
              <span className="underline text-gray-300">개인정보 처리방침</span>
              에 동의하게 됩니다
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}