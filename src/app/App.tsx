import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
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

export default function App() {
  const navigate = useNavigate();
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
      const opponent = generateOpponentLineup();
      setOpponentLineup(opponent);
    }
    navigate('/lineup');
  };

  const handleJoinGame = (inviteCode: string) => {
    console.log('Join game with code:', inviteCode);
    setGameMode('invite');
    navigate('/lineup');
  };

  const handleMyLineupComplete = (lineup: Lineup) => {
    setMyLineup(lineup);

    if (gameMode === 'random' && opponentLineup) {
      navigate('/setup');
    } else {
      setTimeout(() => {
        // TODO: 친구가 라인업을 완성할 때까지 대기
        if (!opponentLineup) {
          const opponent = generateOpponentLineup();
          setOpponentLineup(opponent);
        }
        navigate('/setup');
      }, 500);
    }
  };

  const handleGameStart = (selectedStadium: Stadium, selectedIsHome: boolean) => {
    setStadium(selectedStadium);
    setIsHome(selectedIsHome);
    navigate('/game');
  };

  const handleGameEnd = (score: { home: number; away: number }, history: MatchRecord[]) => {
    setFinalScore(score);
    setGameHistory(history);
    navigate('/result');
  };

  const handleNewGame = () => {
    setGameMode(null);
    setMyLineup(null);
    setOpponentLineup(null);
    setStadium(null);
    setIsHome(true);
    setFinalScore(null);
    setGameHistory([]);
    navigate('/lobby');
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Routes>
        <Route path="/" element={
          user ? <Navigate to="/lobby" replace /> :
            <LoginScreen onLogin={(loggedInUser) => {
              setUser(loggedInUser);
              navigate('/lobby');
            }} />
        } />

        <Route path="/lobby" element={
          user ? <GameLobby onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} /> : <Navigate to="/" replace />
        } />

        <Route path="/lineup" element={
          user && gameMode ? <LineupBuilder onLineupComplete={handleMyLineupComplete} /> : <Navigate to="/" replace />
        } />

        <Route path="/setup" element={
          user && myLineup && opponentLineup ?
            <GameSetup
              myLineup={myLineup}
              opponentLineup={opponentLineup}
              onGameStart={handleGameStart}
            /> : <Navigate to="/lobby" replace />
        } />

        <Route path="/game" element={
          user && myLineup && opponentLineup && stadium ?
            <SimulationGame
              myLineup={myLineup}
              opponentLineup={opponentLineup}
              stadium={stadium}
              isHome={isHome}
              onGameEnd={handleGameEnd}
            /> : <Navigate to="/lobby" replace />
        } />

        <Route path="/result" element={
          user && myLineup && opponentLineup && finalScore ?
            <GameResult
              myLineup={myLineup}
              opponentLineup={opponentLineup}
              finalScore={finalScore}
              isHome={isHome}
              gameHistory={gameHistory}
              onNewGame={handleNewGame}
            /> : <Navigate to="/lobby" replace />
        } />
      </Routes>
    </DndProvider>
  );
}