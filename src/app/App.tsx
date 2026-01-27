import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Lineup, Stadium, MatchRecord } from "@/app/types";
import { LoginScreen } from "@/app/components/LoginScreen";
import { GameLobby } from "@/app/components/GameLobby";
import { LineupBuilder } from "@/app/components/LineupBuilder";
import { GameSetup } from "@/app/components/GameSetup";
import { SimulationGame } from "@/app/components/SimulationGame";
import { GameResult } from "@/app/components/GameResult";
import { VSPage } from "@/app/components/vs";
import { MOCK_PLAYERS } from "@/app/data/mockPlayers";

function AppRoutes() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null); // ⭐ Match ID 추가
  const [gameMode, setGameMode] = useState<
    "friend" | "invite" | "random" | null
  >(null);
  const [myLineup, setMyLineup] = useState<Lineup | null>(null);
  const [opponentLineup, setOpponentLineup] =
    useState<Lineup | null>(null);
  const [stadium, setStadium] = useState<Stadium | null>(null);
  const [isHome, setIsHome] = useState(true);
  const [finalScore, setFinalScore] = useState<{
    home: number;
    away: number;
  } | null>(null);
  const [gameHistory, setGameHistory] = useState<MatchRecord[]>(
    [],
  );

  // 상대방 라인업 자동 생성 (랜덤 매칭/AI용)
  const generateOpponentLineup = (): Lineup => {
    // 1. 투수와 타자 분류
    const availableBatters = MOCK_PLAYERS.filter((p) => p.position !== "투수");
    const availablePitchers = MOCK_PLAYERS.filter((p) => p.position === "투수");

    // 2. 랜덤 셔플
    const shuffledBatters = [...availableBatters].sort(() => Math.random() - 0.5);

    // 3. 타순 구성 (9명)
    const batting = shuffledBatters.slice(0, 9);
    const bench = shuffledBatters.slice(9, 14);

    // 4. 투수진 구성
    const starters = availablePitchers.filter((p) => p.pitcherRole === "starter");
    const middles = availablePitchers.filter((p) => p.pitcherRole === "middle");
    const closers = availablePitchers.filter((p) => p.pitcherRole === "closer");

    const starter = starters[Math.floor(Math.random() * starters.length)] || availablePitchers[0];
    const middle = middles.length > 0 ? middles.slice(0, 5) : availablePitchers.slice(1, 6);
    const closer = closers[Math.floor(Math.random() * closers.length)] || availablePitchers[availablePitchers.length - 1];

    // 5. 수비 포지션 할당 (한글 -> 영문 변환)
    let ofCount = 0;
    const fieldPositions = batting.map((p) => {
      if (!p) return null;

      switch (p.position) {
        case '포수': return 'C';
        case '1루수': return '1B';
        case '2루수': return '2B';
        case '3루수': return '3B';
        case '유격수': return 'SS';
        case '외야수':
          const pos = ['LF', 'CF', 'RF'][ofCount % 3];
          ofCount++;
          return pos;
        default: return null; // 지명타자(DH) 등
      }
    });

    return {
      batting,
      pitchers: {
        starter,
        middle,
        closer,
      },
      bench,
      fieldPositions,
      hasDH: false,
    };
  };

  const handleCreateGame = (
    mode: "friend" | "invite" | "random",
    newMatchId?: string
  ) => {
    setGameMode(mode);
    if (newMatchId) setMatchId(newMatchId);

    if (mode === "random" || mode === "friend") {
      // 랜덤 매칭은 로비에서 이미 매칭됨 (newMatchId가 전달됨)
      // 친구 모드도 바로 라인업으로
      // const opponent = generateOpponentLineup();
      // setOpponentLineup(opponent);
    }
    navigate("/lineup");
  };

  const handleJoinGame = (inviteCode: string) => {
    console.log("Join game with code:", inviteCode);
    setGameMode("invite");
    setMatchId(inviteCode);
    navigate("/lineup");
  };

  const handleMyLineupComplete = async (lineup: Lineup) => {
    setMyLineup(lineup);

    // ⭐ 백엔드에 라인업 저장
    if (matchId && user) {
      try {
        // @ts-ignore
        let apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';

        // 브라우저에서는 host.docker.internal을 해석할 수 없으므로 localhost로 변환
        if (apiUrl.includes('host.docker.internal')) {
          apiUrl = apiUrl.replace('host.docker.internal', 'localhost');
        }

        // 수비 포지션 매핑 (starters Map 구성)
        const startersMap: Record<string, number> = {};

        // 1. 투수 매핑
        if (lineup.pitchers.starter) {
          startersMap["P"] = Number(lineup.pitchers.starter.id);
        }

        // 2. 타자 수비 포지션 매핑
        lineup.batting.forEach((player, idx) => {
          const pos = lineup.fieldPositions[idx];
          if (player && pos) {
            startersMap[pos] = Number(player.id);
          }
        });

        // 백엔드 SaveLineupRequest DTO 형식에 맞춤
        const payload = {
          match_id: matchId,
          user_id: user.id, // 유저 ID 포함 (이미 백엔드에 수정됨)
          active_lineup: {
            starters: startersMap,
            batting_order: lineup.batting.map(p => p ? p.id : 0),
            bench: lineup.bench.map(p => p ? p.id : 0).filter(id => id !== 0),
            bullpen: [
              ...(lineup.pitchers.middle.map(p => p ? p.id : 0)),
              lineup.pitchers.closer ? lineup.pitchers.closer.id : 0
            ].filter(id => id !== 0)
          }
        };

        console.log("DEBUG: Sending lineup to:", apiUrl);
        console.log("Team Lineup POST Payload:", payload);

        const response = await fetch(`${apiUrl}/api/team/lineup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Lineup saved successfully!", result);
        } else {
          console.error("Lineup save failed with status:", response.status);
          const errorText = await response.text();
          console.error("Error response details:", errorText);
        }
      } catch (e) {
        console.error("Failed to save lineup:", e);
      }
    }

    if (gameMode === "random") {
      // 랜덤 모드는 상대방이 이미 있다고 가정 (혹은 기다림)
      // 여기선 일단 AI로 채움 (나중에 백엔드에서 받아와야 함)
      const opponent = generateOpponentLineup();
      setOpponentLineup(opponent);
      navigate("/setup");
    } else {
      setTimeout(() => {
        // TODO: 친구가 라인업을 완성할 때까지 대기
        if (!opponentLineup) {
          const opponent = generateOpponentLineup();
          setOpponentLineup(opponent);
        }
        navigate("/setup");
      }, 500);
    }
  };

  const handleGameStart = (
    selectedStadium: Stadium,
    selectedIsHome: boolean,
  ) => {
    setStadium(selectedStadium);
    setIsHome(selectedIsHome);
    navigate("/vs");
  };

  const handleVsComplete = () => {
    navigate("/game");
  };

  const handleGameEnd = (
    score: { home: number; away: number },
    history: MatchRecord[],
  ) => {
    setFinalScore(score);
    setGameHistory(history);
    navigate("/result");
  };

  const handleNewGame = () => {
    setGameMode(null);
    setMyLineup(null);
    setOpponentLineup(null);
    setStadium(null);
    setIsHome(true);
    setFinalScore(null);
    setGameHistory([]);
    navigate("/lobby");
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/lobby" replace />
            ) : (
              <LoginScreen
                onLogin={(loggedInUser) => {
                  // loggedInUser { name: string } 에서 { id: number, name: string } 로 변환
                  const userId = localStorage.getItem('userId');
                  setUser({
                    id: userId ? Number(userId) : 0,
                    name: loggedInUser.name
                  });
                  navigate("/lobby");
                }}
              />
            )
          }
        />

        <Route
          path="/lobby"
          element={
            user ? (
              <GameLobby
                onCreateGame={handleCreateGame}
                onJoinGame={handleJoinGame}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/lineup"
          element={
            user && gameMode ? (
              <LineupBuilder
                onLineupComplete={handleMyLineupComplete}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/setup"
          element={
            user && myLineup && opponentLineup ? (
              <GameSetup
                myLineup={myLineup}
                opponentLineup={opponentLineup}
                onGameStart={handleGameStart}
              />
            ) : (
              <Navigate to="/lobby" replace />
            )
          }
        />

        <Route
          path="/vs"
          element={
            user && myLineup && opponentLineup ? (
              <VSPage
                myLineup={myLineup}
                opponentLineup={opponentLineup}
                onComplete={handleVsComplete}
              />
            ) : (
              <Navigate to="/lobby" replace />
            )
          }
        />

        <Route
          path="/game"
          element={
            user && myLineup && opponentLineup && stadium ? (
              <SimulationGame
                myLineup={myLineup}
                opponentLineup={opponentLineup}
                stadium={stadium}
                isHome={isHome}
                matchId={matchId || ""} // ⭐ 추가
                onGameEnd={handleGameEnd}
              />
            ) : (
              <Navigate to="/lobby" replace />
            )
          }
        />

        <Route
          path="/result"
          element={
            user && myLineup && opponentLineup && finalScore ? (
              <GameResult
                myLineup={myLineup}
                opponentLineup={opponentLineup}
                finalScore={finalScore}
                isHome={isHome}
                gameHistory={gameHistory}
                onNewGame={handleNewGame}
              />
            ) : (
              <Navigate to="/lobby" replace />
            )
          }
        />
      </Routes>
    </DndProvider>
  );
}

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function App() {
  const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}