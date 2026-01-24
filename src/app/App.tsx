import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Lineup, Stadium, MatchRecord } from '@/app/types';
import { LoginScreen } from '@/app/components/LoginScreen';
import { GameLobby } from '@/app/components/GameLobby';
import { LineupBuilder } from '@/app/components/LineupBuilder';
import { GameSetup } from '@/app/components/GameSetup';
import { SimulationGame } from '@/app/components/SimulationGame';
import { GameResult } from '@/app/components/GameResult';
import { MOCK_PLAYERS } from '@/app/data/mockPlayers';

type GamePhase = 'login' | 'lobby' | 'my-lineup' | 'game-setup' | 'simulation' | 'result';

export default function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('login');
  const [user, setUser] = useState<{ name: string; email: string; profileImage: string } | null>(null);
  const [gameMode, setGameMode] = useState<'friend' | 'invite' | 'random' | null>(null);
  const [myLineup, setMyLineup] = useState<Lineup | null>(null);
  const [opponentLineup, setOpponentLineup] = useState<Lineup | null>(null);
  const [stadium, setStadium] = useState<Stadium | null>(null);
  const [isHome, setIsHome] = useState(true);
  const [finalScore, setFinalScore] = useState<{ home: number; away: number } | null>(null);
  const [gameHistory, setGameHistory] = useState<MatchRecord[]>([]);

  // 상대방 라인업 자동 생성 (랜덤 매칭/AI용)
  const generateOpponentLineup = (): Lineup => {
    const availablePlayers = MOCK_PLAYERS.filter((p) => p.position !== '투수');
    const availablePitchers = MOCK_PLAYERS.filter((p) => p.position === '투수');

    const shuffled = [...availablePlayers].sort(() => Math.random() - 0.5);
    const batting = shuffled.slice(0, 9);
    const bench = shuffled.slice(9, 14);

    const starters = availablePitchers.filter((p) => p.pitcherRole === 'starter');
    const middles = availablePitchers.filter((p) => p.pitcherRole === 'middle');
    const closers = availablePitchers.filter((p) => p.pitcherRole === 'closer');

    const starter = starters[Math.floor(Math.random() * starters.length)];
    const middle = middles.sort(() => Math.random() - 0.5).slice(0, 5);
    const closer = closers[Math.floor(Math.random() * closers.length)];

    return {
      batting,
      pitchers: {
        starter,
        middle,
        closer,
      },
      bench,
    };
  };

  const handleCreateGame = (mode: 'friend' | 'invite' | 'random') => {
    setGameMode(mode);
    if (mode === 'random') {
      // 랜덤 매칭의 경우 상대 라인업 자동 생성
      const opponent = generateOpponentLineup();
      setOpponentLineup(opponent);
    }
    setGamePhase('my-lineup');
  };

  const handleJoinGame = (inviteCode: string) => {
    console.log('Join game with code:', inviteCode);
    // TODO: 초대 코드로 게임 참여 로직 (Supabase 연동 후 구현)
    setGameMode('invite');
    setGamePhase('my-lineup');
  };

  const handleMyLineupComplete = (lineup: Lineup) => {
    setMyLineup(lineup);
    
    // 랜덤 매칭의 경우 상대가 이미 있으므로 바로 게임 설정으로
    if (gameMode === 'random' && opponentLineup) {
      setGamePhase('game-setup');
    } else {
      // 친구 대결의 경우 대기 (실제로는 Supabase로 동기화)
      setGamePhase('game-setup');
      // TODO: 친구가 라인업을 완성할 때까지 대기
      // 데모용으로 AI 라인업 생성
      if (!opponentLineup) {
        const opponent = generateOpponentLineup();
        setOpponentLineup(opponent);
      }
    }
  };

  const handleGameStart = (selectedStadium: Stadium, selectedIsHome: boolean) => {
    setStadium(selectedStadium);
    setIsHome(selectedIsHome);
    setGamePhase('simulation');
  };

  const handleGameEnd = (score: { home: number; away: number }, history: MatchRecord[]) => {
    setFinalScore(score);
    setGameHistory(history);
    setGamePhase('result');
  };

  const handleNewGame = () => {
    setGamePhase('lobby');
    setGameMode(null);
    setMyLineup(null);
    setOpponentLineup(null);
    setStadium(null);
    setIsHome(true);
    setFinalScore(null);
    setGameHistory([]);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        {gamePhase === 'login' && (
          <LoginScreen onLogin={(loggedInUser) => {
            setUser(loggedInUser);
            setGamePhase('lobby');
          }} />
        )}

        {gamePhase === 'lobby' && (
          <GameLobby onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} />
        )}

        {gamePhase === 'my-lineup' && (
          <LineupBuilder onLineupComplete={handleMyLineupComplete} />
        )}

        {gamePhase === 'game-setup' && myLineup && opponentLineup && (
          <GameSetup
            myLineup={myLineup}
            opponentLineup={opponentLineup}
            onGameStart={handleGameStart}
          />
        )}

        {gamePhase === 'simulation' && myLineup && opponentLineup && stadium && (
          <SimulationGame
            myLineup={myLineup}
            opponentLineup={opponentLineup}
            stadium={stadium}
            isHome={isHome}
            onGameEnd={handleGameEnd}
          />
        )}

        {gamePhase === 'result' && myLineup && opponentLineup && finalScore && (
          <GameResult
            myLineup={myLineup}
            opponentLineup={opponentLineup}
            finalScore={finalScore}
            isHome={isHome}
            gameHistory={gameHistory}
            onNewGame={handleNewGame}
          />
        )}
      </div>
    </DndProvider>
  );
}