import { useEffect, useRef, useState } from "react";
import { Lineup } from "@/app/types";
import { TEAM_THEMES, getFullTeamName } from "@/app/data/teamThemes";
import { Badge } from "@/app/components/ui/badge";
import { Coins, Trophy } from "lucide-react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface VSPageProps {
    myLineup: Lineup;
    opponentLineup: Lineup;
    matchId: string;
    userId: number;
    onGameReady: (isHome: boolean) => void;
    onComplete: () => void;
}

export function VSPage({ myLineup, opponentLineup, matchId, userId, onGameReady, onComplete }: VSPageProps) {
    const stompClient = useRef<Client | null>(null);
    const [isSettingsReceived, setIsSettingsReceived] = useState(false);
    const [isTimerFinished, setIsTimerFinished] = useState(false);
    const myTeam = getFullTeamName(myLineup.batting[0]?.team || "내 팀");
    const opponentTeam = getFullTeamName(opponentLineup?.batting[0]?.team || "상대 팀");
    const myTheme = TEAM_THEMES[myTeam];
    const opponentTheme = TEAM_THEMES[opponentTeam];

    const calculateLineupCredits = (lineup: Lineup) => {
        let total = 0;
        lineup.batting.forEach((p) => {
            if (p) total += (p as any).credit || (p as any).salary || 0;
        });
        if (lineup.pitchers.starter)
            total += (lineup.pitchers.starter as any).credit || (lineup.pitchers.starter as any).salary || 0;
        lineup.pitchers.middle.forEach((p) => {
            if (p) total += (p as any).credit || (p as any).salary || 0;
        });
        if (lineup.pitchers.closer)
            total += (lineup.pitchers.closer as any).credit || (lineup.pitchers.closer as any).salary || 0;
        lineup.bench.forEach((p) => {
            if (p) total += (p as any).credit || (p as any).salary || 0;
        });
        return total;
    };

    const myCredits = calculateLineupCredits(myLineup);
    const opponentCredits = calculateLineupCredits(opponentLineup);

    // 1. 소켓 연결 및 CHECK_READY 전송
    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws-baseball');
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            onConnect: () => {
                console.log(`✅ [VS] matchId(${matchId}) 연결 성공!`);

                // 구독
                client.subscribe(`/topic/match/${matchId}`, (message) => {
                    const response = JSON.parse(message.body);
                    console.log("📨 [VS] 받은 메시지:", response);

                    if (response.eventType === 'READY_STATUS' && response.data.ready) {
                        const isHome = Number(response.data.home_team_id) === userId;
                        console.log(`⭐ [VS] 경기 준비 완료! 홈 여부: ${isHome}`);
                        onGameReady(isHome);
                        setIsSettingsReceived(true);
                    }
                });

                // CHECK_READY 전송
                client.publish({
                    destination: `/app/match/${matchId}/setup`,
                    body: JSON.stringify({
                        type: 'CHECK_READY',
                        senderId: userId,
                        matchId: matchId
                    })
                });
                console.log("🚀 [VS] CHECK_READY 전송 완료");
            },
        });

        client.activate();
        stompClient.current = client;

        return () => {
            client.deactivate();
        };
    }, [matchId, userId, onGameReady]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsTimerFinished(true);
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    // 3. 타이머 종료와 설정 수신이 모두 완료되면 넘어가기
    useEffect(() => {
        if (isSettingsReceived && isTimerFinished) {
            console.log("🚀 [VS] 모든 준비 완료! 게임 시작!");
            onComplete();
        }
    }, [isSettingsReceived, isTimerFinished, onComplete]);

    return (
        <div
            className="min-h-screen relative overflow-hidden bg-black flex items-center justify-center p-10"
            style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1729280968440-367f2775afce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXNlYmFsbCUyMGZpZWxkJTIwZ3Jhc3N8ZW58MXx8fHwxNzY5MzE1MTY1fDA&ixlib=rb-4.1.0&q=80&w=1080)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

            <div className="w-full max-w-[1400px] grid grid-cols-3 gap-8 items-center relative z-10 animate-in fade-in duration-1000">

                {/* 우리 팀 */}
                <div className="p-8 relative">
                    <div className="text-center mb-6 relative z-10">
                        <Badge className="mb-3 text-sm px-3 py-1" style={{ backgroundColor: myTheme?.primary }}>
                            HOME TEAM
                        </Badge>
                        <div className="w-40 h-40 mx-auto mb-6 relative flex items-center justify-center">
                            {/* Logo Image */}
                            <img
                                src={`/assets/logos/${myTeam.trim()}.png`}
                                alt={myTeam}
                                className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.3)] relative z-10"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                                    if (fallback) fallback.classList.remove('hidden');
                                }}
                            />
                            {/* Fallback Icon */}
                            <div
                                className="fallback-icon hidden absolute inset-0 rounded-full flex items-center justify-center border-4 shadow-lg text-white font-black text-4xl"
                                style={{
                                    backgroundColor: myTheme?.primary,
                                    borderColor: myTheme?.secondary || '#ffffff',
                                    boxShadow: `0 0 30px ${myTheme?.primary}60`
                                }}
                            >
                                {myTeam.trim()[0]}
                            </div>
                        </div>

                        <h3 className="text-5xl font-black mb-2 text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] tracking-tight">{myTeam}</h3>
                        <div className="flex items-center justify-center gap-2 text-white/90 font-bold w-fit mx-auto px-4 py-1">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <span className="text-lg shadow-black drop-shadow-md">{myCredits.toLocaleString()} Credits</span>
                        </div>
                    </div>

                    {/* Key Player Preview */}
                    <div className="space-y-4 mt-8">
                        <div className="text-white font-bold text-lg mb-2 flex items-center gap-2 drop-shadow-md">
                            <Trophy className="w-5 h-5 text-yellow-500" /> KEY PLAYERS
                        </div>
                        <div className="space-y-2">
                            {myLineup.batting.slice(0, 3).map((player, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm text-white border-b border-white/20 pb-2">
                                    <span className="font-bold text-xl drop-shadow-md">{idx + 1}. {player?.name}</span>
                                    <span className="text-sm text-white/80 font-medium">{player?.position}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-4">
                            <div className="text-sm font-bold mb-2 text-white/60 uppercase tracking-widest">Starter Pitcher</div>
                            <div className="text-2xl font-black text-white drop-shadow-md flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                                {myLineup.pitchers.starter?.name}
                            </div>
                        </div>
                    </div>
                </div>

                {/* VS Center */}
                <div className="text-center relative">
                    <div className="absolute inset-0 bg-red-500/20 blur-[120px] animate-pulse rounded-full" />
                    <div className="relative z-10 text-[10rem] font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 drop-shadow-[0_0_30px_rgba(255,50,50,0.8)] animate-bounce tracking-tighter" style={{ WebkitTextStroke: '2px white' }}>
                        VS
                    </div>
                    <div className="mt-8">
                        <div className="inline-block px-6 py-2 bg-red-600 text-white font-black text-xl rounded-full animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.6)]">
                            SUPER MATCH
                        </div>
                    </div>
                    <div className="mt-10 text-white/50 text-sm font-mono animate-pulse">
                        {!isSettingsReceived ? "Waiting for Game Settings..." : "Loading Stadium Resources..."}
                    </div>
                </div>

                {/* 상대 팀 */}
                <div className="p-8 relative">
                    <div className="text-center mb-6 relative z-10">
                        <Badge className="mb-3 text-sm px-3 py-1" style={{ backgroundColor: opponentTheme?.primary }}>
                            AWAY TEAM
                        </Badge>
                        <div className="w-40 h-40 mx-auto mb-6 relative flex items-center justify-center">
                            {/* Logo Image */}
                            <img
                                src={`/assets/logos/${opponentTeam.trim()}.png`}
                                alt={opponentTeam}
                                className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.3)] relative z-10"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                                    if (fallback) fallback.classList.remove('hidden');
                                }}
                            />
                            {/* Fallback Icon */}
                            <div
                                className="fallback-icon hidden absolute inset-0 rounded-full flex items-center justify-center border-4 shadow-lg text-white font-black text-4xl"
                                style={{
                                    backgroundColor: opponentTheme?.primary,
                                    borderColor: opponentTheme?.secondary || '#ffffff',
                                    boxShadow: `0 0 30px ${opponentTheme?.primary}60`
                                }}
                            >
                                {opponentTeam.trim()[0]}
                            </div>
                        </div>

                        <h3 className="text-5xl font-black mb-2 text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] tracking-tight">{opponentTeam}</h3>
                        <div className="flex items-center justify-center gap-2 text-white/90 font-bold w-fit mx-auto px-4 py-1">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <span className="text-lg shadow-black drop-shadow-md">{opponentCredits.toLocaleString()} Credits</span>
                        </div>
                    </div>

                    {/* Key Player Preview */}
                    <div className="space-y-4 mt-8">
                        <div className="text-white font-bold text-lg mb-2 flex items-center gap-2 drop-shadow-md">
                            <Trophy className="w-5 h-5 text-yellow-500" /> KEY PLAYERS
                        </div>
                        <div className="space-y-2">
                            {opponentLineup.batting.slice(0, 3).map((player, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm text-white border-b border-white/20 pb-2">
                                    <span className="font-bold text-xl drop-shadow-md">{idx + 1}. {player?.name}</span>
                                    <span className="text-sm text-white/80 font-medium">{player?.position}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-4">
                            <div className="text-sm font-bold mb-2 text-white/60 uppercase tracking-widest">Starter Pitcher</div>
                            <div className="text-2xl font-black text-white drop-shadow-md flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                                {opponentLineup.pitchers.starter?.name}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}