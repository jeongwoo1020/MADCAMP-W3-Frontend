import { useEffect } from "react";
import { Lineup } from "@/app/types";
import { TEAM_THEMES } from "@/app/data/teamThemes";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { Users, Coins, Trophy } from "lucide-react";

interface VSPageProps {
    myLineup: Lineup;
    opponentLineup: Lineup;
    onComplete: () => void;
}

export function VSPage({ myLineup, opponentLineup, onComplete }: VSPageProps) {
    const myTeam = myLineup.batting[0]?.team || "내 팀";
    const opponentTeam = opponentLineup?.batting[0]?.team || "상대 팀";
    const myTheme = TEAM_THEMES[myTeam];
    const opponentTheme = TEAM_THEMES[opponentTeam];

    const calculateLineupCredits = (lineup: Lineup) => {
        let total = 0;
        lineup.batting.forEach((p) => {
            if (p) total += p.salary;
        });
        if (lineup.pitchers.starter)
            total += lineup.pitchers.starter.salary;
        lineup.pitchers.middle.forEach((p) => {
            if (p) total += p.salary;
        });
        if (lineup.pitchers.closer)
            total += lineup.pitchers.closer.salary;
        lineup.bench.forEach((p) => {
            if (p) total += p.salary;
        });
        return total;
    };

    const myCredits = calculateLineupCredits(myLineup);
    const opponentCredits = calculateLineupCredits(opponentLineup);

    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onComplete]);

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
                <Card
                    className="p-8 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl overflow-hidden relative"
                    style={{
                        borderBottomWidth: '6px',
                        borderColor: myTheme?.primary
                    }}
                >
                    <div
                        className="absolute top-0 left-0 w-full h-2 opacity-50"
                        style={{ backgroundColor: myTheme?.primary }}
                    />

                    <div className="text-center mb-6 relative z-10">
                        <Badge className="mb-3 text-sm px-3 py-1" style={{ backgroundColor: myTheme?.primary }}>
                            HOME TEAM
                        </Badge>
                        <div
                            className="w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4 border-4 shadow-lg"
                            style={{
                                backgroundColor: myTheme?.primary,
                                borderColor: myTheme?.secondary || '#ffffff',
                                boxShadow: `0 0 30px ${myTheme?.primary}60`
                            }}
                        >
                            <Users className="w-16 h-16 text-white" />
                        </div>
                        <h3 className="text-4xl font-black mb-2 text-white drop-shadow-md">{myTeam}</h3>
                        <div className="flex items-center justify-center gap-2 text-white/80 font-bold bg-black/30 w-fit mx-auto px-4 py-1 rounded-full">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span>{myCredits.toLocaleString()} Credits</span>
                        </div>
                    </div>

                    <Separator className="my-6 bg-white/10" />

                    {/* Key Player Preview */}
                    <div className="space-y-4">
                        <div className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" /> KEY PLAYERS
                        </div>
                        {myLineup.batting.slice(0, 3).map((player, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm bg-black/40 p-3 rounded-lg border border-white/5 backdrop-blur-sm">
                                <span className="font-bold text-white text-base">{idx + 1}. {player?.name}</span>
                                <Badge variant="outline" className="text-xs border-white/30 text-white/70">{player?.position}</Badge>
                            </div>
                        ))}

                        <div className="mt-6 pt-4 border-t border-white/10">
                            <div className="text-sm font-bold mb-2 text-white/60">STARTER PITCHER</div>
                            <div className="text-lg font-black bg-gradient-to-r from-green-900/50 to-emerald-900/50 p-4 rounded-xl text-emerald-400 border border-emerald-500/30 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                {myLineup.pitchers.starter?.name}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* VS Center */}
                <div className="text-center relative">
                    <div className="absolute inset-0 bg-red-500/20 blur-[100px] animate-pulse rounded-full" />
                    <div className="relative z-10 text-9xl font-black italic text-white drop-shadow-[0_0_20px_rgba(255,50,50,0.8)] animate-bounce tracking-tighter">
                        VS
                    </div>
                    <div className="mt-8">
                        <div className="inline-block px-6 py-2 bg-red-600 text-white font-black text-xl rounded-full animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.6)]">
                            SUPER MATCH
                        </div>
                    </div>
                    <div className="mt-10 text-white/50 text-sm font-mono animate-pulse">
                        Loading Stadium Resources...
                    </div>
                </div>

                {/* 상대 팀 */}
                <Card
                    className="p-8 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl overflow-hidden relative"
                    style={{
                        borderBottomWidth: '6px',
                        borderColor: opponentTheme?.primary
                    }}
                >
                    <div
                        className="absolute top-0 left-0 w-full h-2 opacity-50"
                        style={{ backgroundColor: opponentTheme?.primary }}
                    />

                    <div className="text-center mb-6 relative z-10">
                        <Badge className="mb-3 text-sm px-3 py-1" style={{ backgroundColor: opponentTheme?.primary }}>
                            AWAY TEAM
                        </Badge>
                        <div
                            className="w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4 border-4 shadow-lg"
                            style={{
                                backgroundColor: opponentTheme?.primary,
                                borderColor: opponentTheme?.secondary || '#ffffff',
                                boxShadow: `0 0 30px ${opponentTheme?.primary}60`
                            }}
                        >
                            <Users className="w-16 h-16 text-white" />
                        </div>
                        <h3 className="text-4xl font-black mb-2 text-white drop-shadow-md">{opponentTeam}</h3>
                        <div className="flex items-center justify-center gap-2 text-white/80 font-bold bg-black/30 w-fit mx-auto px-4 py-1 rounded-full">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span>{opponentCredits.toLocaleString()} Credits</span>
                        </div>
                    </div>

                    <Separator className="my-6 bg-white/10" />

                    <div className="space-y-4">
                        <div className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" /> KEY PLAYERS
                        </div>
                        {opponentLineup.batting.slice(0, 3).map((player, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm bg-black/40 p-3 rounded-lg border border-white/5 backdrop-blur-sm">
                                <span className="font-bold text-white text-base">{idx + 1}. {player?.name}</span>
                                <Badge variant="outline" className="text-xs border-white/30 text-white/70">{player?.position}</Badge>
                            </div>
                        ))}
                        <div className="mt-6 pt-4 border-t border-white/10">
                            <div className="text-sm font-bold mb-2 text-white/60">STARTER PITCHER</div>
                            <div className="text-lg font-black bg-gradient-to-r from-green-900/50 to-emerald-900/50 p-4 rounded-xl text-emerald-400 border border-emerald-500/30 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                {opponentLineup.pitchers.starter?.name}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}