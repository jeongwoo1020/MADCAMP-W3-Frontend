// [1] 유저 및 시스템 영역
export interface User {
  id: number;
  email: string; // Google Email (Unique)
  provider_id: string; // Google Sub ID
  nickname: string;
  profile_image: string;
  role: "USER" | "ADMIN";
  created_at: Date;
  last_login: Date;
}

export interface UserStats {
  user_id: number; // FK
  rating: number; // MMR (Default 1000)
  wins: number;
  loses: number;
  draws: number;
}

export interface MatchQueue {
  user_id: number; // FK
  rating: number;
  joined_at: Date;
}

// [2] 선수 영역
export interface Hitter {
  id: number;
  name: string;
  team: string;
  position: string;
  image_url: string; // 선수 사진 URL
  credit: number;
  avg: number;
  pa: number;
  hit: number;
  doubleHit: number;
  tripleHit: number;
  homeRun: number;
  strikeOut: number;
  walk: number;
  hbp: number;
  ops: number;
  sb: number;
  cs: number;
  error: number;
  fpct: number;
  speed: number; // 주력 (계산됨)
}

export interface Pitcher {
  id: number;
  name: string;
  team: string;
  image_url: string; // 선수 사진 URL
  credit: number;
  pitcherRole?: "starter" | "middle" | "closer"; // 투수 역할 (추가 필드)
  ip: number;
  h: number;
  hr: number;
  bb: number;
  so: number;
  go: number;
  ao: number;
  error: number;
  max_pitch_count: number; // 한계 투구수 (계산됨)
  // 계산용 필드 추가
  era?: number;
  whip?: number;
}

// [3] 라인업 (클라이언트 전용)
export interface Lineup {
  batting: (Hitter | null)[];
  pitchers: {
    starter: Pitcher | null;
    middle: (Pitcher | null)[];
    closer: Pitcher | null;
  };
  bench: (Hitter | null)[]; // 대타/대주자
  fieldPositions: (string | null)[]; // 각 타순의 수비 포지션 (9개)
  hasDH: boolean; // 지명타자 사용 여부
}

// [4] 구장
export interface Stadium {
  id: string;
  name: string;
  image: string;
  city: string;
}

// [5] 경기 및 로그 영역
export interface Room {
  match_id: string; // PK, 초대 코드
  host_id: number;
  status: "WAITING" | "PLAYING" | "FINISHED";
  created_at: Date;
}

export interface MatchInfo {
  match_id: string; // FK (ROOM 참조)
  status: "READY" | "PLAYING" | "FINISHED";
  score: { home: number; away: number }; // JSON
  inning: number;
  is_top: boolean; // true: 초, false: 말
  runners: (number | null)[]; // [1루 선수id, 2루 선수id, 3루 선수id]
  active_lineup: {
    // JSON: 현 필드 10명 + 벤치
    batting: (Hitter | null)[];
    pitcher: Pitcher | null;
    bench: (Hitter | null)[];
  };
  ball_count: { b: number; s: number; o: number }; // JSON
  // 추가 클라이언트용 필드
  currentBatter: number; // 타순 인덱스
  pitches: number; // 총 투구수
  currentPitcher: {
    stamina: number;
    pitchTypes: string[];
  };
}

export interface MatchRecord {
  match_id: string; // FK (ROOM 참조)
  inning: number;
  event_type: "PITCH" | "AT_BAT" | "MANAGEMENT";
  data: any; // JSON: 이벤트별 상세 데이터
  actor_id: number; // 선수 혹은 유저 ID
  description: string; // 중계용 텍스트
}

// [6] 타석 결과 (이벤트 데이터)
export interface AtBatResult {
  type:
    | "single"
    | "double"
    | "triple"
    | "homerun"
    | "out"
    | "walk"
    | "strikeout";
  description: string;
}

// [7] 게임룸 (클라이언트용 - Room 확장)
export interface GameRoom {
  id: string;
  hostId: string;
  hostName: string;
  inviteCode?: string;
  status: "waiting" | "ready" | "playing" | "finished";
  createdAt: Date;
}

// [8] 레거시 호환용 타입 (기존 코드에서 사용)
export type Player = Hitter &
  Pitcher & {
    salary: number; // mockPlayers calculates this
    recentForm?: number; // mockPlayers has this
    stats?: {
      // mockPlayers nested stats
      avg?: number;
      ops?: number;
      hr?: number;
      rbi?: number;
      era?: number;
      whip?: number;
      k?: number;
      [key: string]: any;
    };
  };
export type GameState = MatchInfo; // 임시 호환용
export type GameHistory = MatchRecord; // 임시 호환용