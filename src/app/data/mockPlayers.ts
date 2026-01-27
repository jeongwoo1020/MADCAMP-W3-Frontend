import { Player, Hitter, Pitcher } from '@/app/types';

export const TEAMS = [
  'LG 트윈스',
  '한화 이글스',
  'SSG 랜더스',
  '삼성 라이온즈',
  'NC 다이노스',
  'KT 위즈',
  '롯데 자이언츠',
  'KIA 타이거즈',
  '두산 베어스',
  '키움 히어로즈',
];

// 연봉/크레딧 계산 함수 (5~25 사이의 정수)
function calculateCredit(player: Omit<Player, 'salary' | 'credit'>): number {
  if (player.position === '투수') {
    const era = player.stats?.era || 4.5;
    return Math.max(8, Math.min(25, Math.round((6.0 - era) * 5)));
  } else {
    const ops = player.stats?.ops || 0.7;
    return Math.max(5, Math.min(25, Math.round((ops - 0.4) * 30)));
  }
}

const RAW_PLAYERS: any[] = [
  // LG 트윈스 (1-13)
  { id: 1, name: '신민재', team: 'LG 트윈스', position: '유격수', credit: 14, stats: { avg: 0.313, ops: 0.777, hr: 1, rbi: 50 }, recentForm: 8 },
  { id: 2, name: '오스틴', team: 'LG 트윈스', position: '1루수', credit: 23, stats: { avg: 0.313, ops: 0.988, hr: 31, rbi: 99 }, recentForm: 10 },
  { id: 3, name: '문성주', team: 'LG 트윈스', position: '좌익수', credit: 13, stats: { avg: 0.305, ops: 0.75, hr: 3, rbi: 60 }, recentForm: 8 },
  { id: 4, name: '김현수', team: 'LG 트윈스', position: '1루수', credit: 16, stats: { avg: 0.298, ops: 0.806, hr: 12, rbi: 94 }, recentForm: 9 },
  { id: 10, name: '박동원', team: 'LG 트윈스', position: '포수', credit: 17, stats: { avg: 0.253, ops: 0.797, hr: 22, rbi: 80 }, recentForm: 8 },

  // 한화 이글스 (14-30)
  { id: 14, name: '문현빈', team: '한화 이글스', position: '3루수', credit: 18, stats: { avg: 0.32, ops: 0.823, hr: 12, rbi: 65 }, recentForm: 8 },
  { id: 18, name: '채은성', team: '한화 이글스', position: '1루수', credit: 17, stats: { avg: 0.288, ops: 0.814, hr: 19, rbi: 85 }, recentForm: 8 },
  { id: 25, name: '노시환', team: '한화 이글스', position: '3루수', credit: 23, stats: { avg: 0.26, ops: 0.851, hr: 32, rbi: 105 }, recentForm: 9 },

  //... 생략 (필요시 더 추가 가능)
  { id: 28, name: '류현진', team: '한화 이글스', position: '투수', credit: 25, pitcherRole: 'starter', stats: { era: 3.2, whip: 1.15, k: 180 }, recentForm: 9 },
  { id: 30, name: '최재훈', team: '한화 이글스', position: '포수', credit: 15, stats: { avg: 0.265, ops: 0.75, hr: 5, rbi: 45 }, recentForm: 7 },
  { id: 43, name: '채은성', team: '한화 이글스', position: '1루수', credit: 18, stats: { avg: 0.28, ops: 0.82, hr: 20, rbi: 80 }, recentForm: 8 },
  { id: 44, name: '안치홍', team: '한화 이글스', position: '2루수', credit: 17, stats: { avg: 0.29, ops: 0.8, hr: 12, rbi: 60 }, recentForm: 8 },
  { id: 55, name: '노시환', team: '한화 이글스', position: '3루수', credit: 23, stats: { avg: 0.285, ops: 0.92, hr: 35, rbi: 110 }, recentForm: 9 },
  { id: 86, name: '이도윤', team: '한화 이글스', position: '유격수', credit: 12, stats: { avg: 0.25, ops: 0.65, hr: 1, rbi: 30 }, recentForm: 7 },
  { id: 87, name: '최인호', team: '한화 이글스', position: '좌익수', credit: 13, stats: { avg: 0.27, ops: 0.72, hr: 4, rbi: 40 }, recentForm: 8 },
  { id: 102, name: '페라자', team: '한화 이글스', position: '중견수', credit: 20, stats: { avg: 0.31, ops: 0.95, hr: 28, rbi: 90 }, recentForm: 10 },
  { id: 103, name: '문현빈', team: '한화 이글스', position: '우익수', credit: 14, stats: { avg: 0.26, ops: 0.7, hr: 5, rbi: 50 }, recentForm: 8 },
  { id: 116, name: '김태연', team: '한화 이글스', position: '지명타자', credit: 15, stats: { avg: 0.28, ops: 0.81, hr: 15, rbi: 70 }, recentForm: 9 },
  { id: 201, name: '곽빈', team: '두산 베어스', position: '투수', credit: 18, pitcherRole: 'starter', stats: { era: 3.5, whip: 1.25, k: 140 }, recentForm: 8 },
];

export const MOCK_PLAYERS: Player[] = RAW_PLAYERS.map((player) => {
  const baseStats = {
    ...player,
    image_url: player.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`,
    avg: player.stats?.avg || 0,
    pa: 100, hit: 25, doubleHit: 5, tripleHit: 1, homeRun: player.stats?.hr || 0,
    strikeOut: 20, walk: 10, hbp: 2, ops: player.stats?.ops || 0,
    sb: 5, cs: 2, error: 2, fpct: 0.98, speed: 70,
    ip: player.position === '투수' ? 150 : 0, h: 130, hr: player.stats?.hr || 0,
    bb: 40, so: player.stats?.k || 0, go: 120, ao: 110,
    max_pitch_count: 100,
    pitcherRole: player.pitcherRole || 'starter'
  };

  const finalCredit = player.credit || calculateCredit(baseStats as any);

  return {
    ...baseStats,
    credit: finalCredit,
    salary: finalCredit // 호환성 유지
  } as Player;
});

export const getPlayersByTeam = (team: string): Player[] => {
  const players = MOCK_PLAYERS.filter((player) => player.team === team);
  return players;
};

export const getPitchers = (team: string): Player[] => {
  return MOCK_PLAYERS.filter((player) => player.team === team && player.position === '투수');
};

export const getPitchersByRole = (team: string, role: 'starter' | 'middle' | 'closer'): Player[] => {
  return MOCK_PLAYERS.filter(
    (player) => player.team === team && player.position === '투수' && player.pitcherRole === role
  );
};

export const getFieldPlayers = (team: string): Player[] => {
  return MOCK_PLAYERS.filter((player) => player.team === team && player.position !== '투수');
};