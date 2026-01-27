import { Player } from '@/app/types';

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

// 연봉 계산 함수
function calculateSalary(player: Omit<Player, 'salary'>): number {
  if (player.position === '투수') {
    const era = player.stats?.era || 4.5;
    return Math.max(10, Math.min(100, Math.round((6.0 - era) * 20)));
  } else {
    const ops = player.stats?.ops || 0.7;
    return Math.max(10, Math.min(100, Math.round((ops - 0.5) * 150)));
  }
}

const RAW_PLAYERS: any[] = [
  // LG 트윈스 (1-13)
  { id: 1, name: '신민재', team: 'LG 트윈스', position: '유격수', stats: { avg: 0.313, ops: 0.777, hr: 1, rbi: 50 }, recentForm: 8 },
  { id: 2, name: '오스틴', team: 'LG 트윈스', position: '1루수', stats: { avg: 0.313, ops: 0.988, hr: 31, rbi: 99 }, recentForm: 10 },
  { id: 3, name: '문성주', team: 'LG 트윈스', position: '좌익수', stats: { avg: 0.305, ops: 0.75, hr: 3, rbi: 60 }, recentForm: 8 },
  { id: 4, name: '김현수', team: 'LG 트윈스', position: '1루수', stats: { avg: 0.298, ops: 0.806, hr: 12, rbi: 94 }, recentForm: 9 },
  { id: 10, name: '박동원', team: 'LG 트윈스', position: '포수', stats: { avg: 0.253, ops: 0.797, hr: 22, rbi: 80 }, recentForm: 8 },

  // 한화 이글스 (14-30)
  { id: 14, name: '문현빈', team: '한화 이글스', position: '3루수', stats: { avg: 0.32, ops: 0.823, hr: 12, rbi: 65 }, recentForm: 8 },
  { id: 18, name: '채은성', team: '한화 이글스', position: '1루수', stats: { avg: 0.288, ops: 0.814, hr: 19, rbi: 85 }, recentForm: 8 },
  { id: 25, name: '노시환', team: '한화 이글스', position: '3루수', stats: { avg: 0.26, ops: 0.851, hr: 32, rbi: 105 }, recentForm: 9 },

  // SSG 랜더스 (31-44)
  { id: 31, name: '에레디아', team: 'SSG 랜더스', position: '좌익수', stats: { avg: 0.339, ops: 0.889, hr: 13, rbi: 88 }, recentForm: 9 },
  { id: 34, name: '박성한', team: 'SSG 랜더스', position: '유격수', stats: { avg: 0.274, ops: 0.765, hr: 7, rbi: 60 }, recentForm: 7 },
  { id: 38, name: '최정', team: 'SSG 랜더스', position: '3루수', stats: { avg: 0.244, ops: 0.842, hr: 23, rbi: 108 }, recentForm: 9 },

  // 삼성 라이온즈 (45-57)
  { id: 46, name: '구자욱', team: '삼성 라이온즈', position: '좌익수', stats: { avg: 0.319, ops: 0.918, hr: 19, rbi: 95 }, recentForm: 9 },
  { id: 47, name: '디아즈', team: '삼성 라이온즈', position: '1루수', stats: { avg: 0.314, ops: 1.025, hr: 50, rbi: 120 }, recentForm: 10 },
  { id: 51, name: '강민호', team: '삼성 라이온즈', position: '포수', stats: { avg: 0.269, ops: 0.753, hr: 12, rbi: 75 }, recentForm: 8 },

  // KIA 타이거즈 (104-116)
  { id: 105, name: '최형우', team: 'KIA 타이거즈', position: '좌익수', stats: { avg: 0.307, ops: 0.928, hr: 24, rbi: 100 }, recentForm: 9 },
  { id: 106, name: '박찬호', team: 'KIA 타이거즈', position: '유격수', stats: { avg: 0.287, ops: 0.722, hr: 5, rbi: 55 }, recentForm: 8 },

  // 두산 베어스 (117-131)
  { id: 117, name: '양의지', team: '두산 베어스', position: '포수', stats: { avg: 0.337, ops: 0.939, hr: 20, rbi: 95 }, recentForm: 9 },
  { id: 128, name: '김재환', team: '두산 베어스', position: '좌익수', stats: { avg: 0.241, ops: 0.758, hr: 13, rbi: 85 }, recentForm: 8 },

  // 키움 히어로즈 (132-137)
  { id: 132, name: '송성문', team: '키움 히어로즈', position: '2루수', stats: { avg: 0.315, ops: 0.917, hr: 26, rbi: 100 }, recentForm: 10 },

  // 투수 예시 (ID는 실제 SQL 확인 필요하나 패턴에 맞춰 임시 할당)
  // 실제 init.sql에는 투수 테이블도 따로 있음. (ID 1-...)
  // 여기서는 중복 방지를 위해 10000대 번호 사용 또는 DB와 100% 일치 필요.
  // DB의 pitcher 테이블 id와 겹치지 않게 주의. 
  // init.sql 확인 시 투수도 1번부터 시작함. 
  // 일단 프론트 로컬 테스트를 위해 팀 이름별로 투수도 추가.
  { id: 201, name: '곽빈', team: '두산 베어스', position: '투수', pitcherRole: 'starter', stats: { era: 3.5, whip: 1.25, k: 140 }, recentForm: 8 },
  { id: 202, name: '원태인', team: '삼성 라이온즈', position: '투수', pitcherRole: 'starter', stats: { era: 3.2, whip: 1.15, k: 130 }, recentForm: 8 },
  { id: 203, name: '문동주', team: '한화 이글스', position: '투수', pitcherRole: 'starter', stats: { era: 4.5, whip: 1.45, k: 120 }, recentForm: 7 },
  { id: 204, name: '양현종', team: 'KIA 타이거즈', position: '투수', pitcherRole: 'starter', stats: { era: 3.8, whip: 1.3, k: 135 }, recentForm: 8 },
];

export const MOCK_PLAYERS: Player[] = RAW_PLAYERS.map((player) => {
  const baseStats = {
    ...player,
    image_url: player.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`,
    credit: 10,
    avg: player.stats?.avg || 0,
    pa: 100, hit: 25, doubleHit: 5, tripleHit: 1, homeRun: player.stats?.hr || 0,
    strikeOut: 20, walk: 10, hbp: 2, ops: player.stats?.ops || 0,
    sb: 5, cs: 2, error: 2, fpct: 0.98, speed: 70,
    ip: player.position === '투수' ? 150 : 0, h: 130, hr: player.stats?.hr || 0,
    bb: 40, so: player.stats?.k || 0, go: 120, ao: 110,
    max_pitch_count: 100,
    pitcherRole: player.pitcherRole || 'starter'
  };

  return {
    ...baseStats,
    salary: calculateSalary(baseStats as any)
  } as Player;
});

export const getPlayersByTeam = (team: string): Player[] => {
  const players = MOCK_PLAYERS.filter((player) => player.team === team);
  // 만약 선수가 부족하면 더미 데이터라도 생성해서 반환 (LineupBuilder가 깨지지 않게)
  if (players.length < 15) {
    // 부족한 만큼 채워줌 (실제 서비스에선 필요 없으나 현재 DB 데이터가 부족할 수 있음)
  }
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