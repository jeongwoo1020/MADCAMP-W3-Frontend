import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';

interface LoginScreenProps {
  onLogin: (user: { name: string; email: string; profileImage: string }) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const handleGoogleLogin = () => {
    // 실제 구현에서는 Google OAuth를 사용
    // 여기서는 Mock 데이터로 로그인 시뮬레이션
    const mockUser = {
      name: '야구팬',
      email: 'baseball@example.com',
      profileImage: 'https://ui-avatars.com/api/?name=Baseball+Fan&background=random',
    };
    onLogin(mockUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 bg-white/95 backdrop-blur">
        <div className="text-center space-y-6">
          {/* 로고/타이틀 */}
          <div className="space-y-2">
            <div className="text-6xl mb-4">⚾</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              야구 시뮬레이션
            </h1>
            <p className="text-muted-foreground">
              실시간 PvP 대결로 최고의 감독이 되어보세요
            </p>
          </div>

          {/* 특징 */}
          <div className="grid grid-cols-2 gap-4 py-6">
            <div className="space-y-1">
              <div className="text-2xl">🎮</div>
              <div className="text-sm font-medium">실시간 PvP</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl">📊</div>
              <div className="text-sm font-medium">실제 선수 데이터</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl">⚡</div>
              <div className="text-sm font-medium">전략적 매니지먼트</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl">🏆</div>
              <div className="text-sm font-medium">랭킹 시스템</div>
            </div>
          </div>

          {/* 구글 로그인 버튼 */}
          <Button
            onClick={handleGoogleLogin}
            className="w-full h-12 text-base bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
            size="lg"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 시작하기
          </Button>

          <p className="text-xs text-muted-foreground">
            로그인하면 <span className="underline">이용약관</span> 및{' '}
            <span className="underline">개인정보 처리방침</span>에 동의하게 됩니다
          </p>
        </div>
      </Card>
    </div>
  );
}
