import { Player } from '@/app/types';

// 백엔드 데이터 타입 정의 (Batter.kt, Pitcher.kt 참조)
interface BackendBatter {
    id: number;
    name: string;
    team: string; // 한글 팀명
    position: string;
    avg: number;
    ops: number;
    pa: number;
    hit: number;
    doubleHit: number;
    tripleHit: number;
    homeRun: number;
    strikeOut: number;
    walk: number;
    hbp: number;
    sb: number;
    cs: number;
    error: number;
    fpct: number;
    go: number;
    ao: number;
}

interface BackendPitcher {
    id: number;
    name: string;
    team: string; // 한글 팀명
    ip: number;
    h: number;
    hr: number;
    bb: number;
    hbp: number;
    so: number;
    go: number;
    ao: number;
    error: number;
    fpct: number;
}

interface BackendPlayersResponse {
    batters: BackendBatter[];
    pitchers: BackendPitcher[];
}

// 팀 이름 한글 -> 풀네임 매핑 (백엔드 데이터 -> 프론트엔드 테마/에셋)
export const TEAM_NAME_MAP: Record<string, string> = {
    'LG': 'LG 트윈스',
    '한화': '한화 이글스',
    'SSG': 'SSG 랜더스',
    '삼성': '삼성 라이온즈',
    'NC': 'NC 다이노스',
    'KT': 'KT 위즈',
    '롯데': '롯데 자이언츠',
    'KIA': 'KIA 타이거즈',
    '두산': '두산 베어스',
    '키움': '키움 히어로즈'
};

function normalizeTeamName(team: string): string {
    const trimmed = team?.trim();
    return TEAM_NAME_MAP[trimmed] || trimmed || '내 팀';
}

// 연봉 계산 (mockPlayers.ts 로직 재사용 + 수정)
function calculateSalary(player: Player): number {
    if (player.position === '투수') {
        const era = player.stats?.era || 4.5;
        const salaryBase = Math.max(10, Math.min(100, (6.0 - era) * 25));
        const roleMultiplier =
            player.pitcherRole === 'starter' ? 1.5 :
                player.pitcherRole === 'closer' ? 1.3 :
                    1.0;
        return Math.round(salaryBase * roleMultiplier) * 10;
    } else {
        const ops = player.stats?.ops || 0.7;
        const salaryBase = Math.max(10, Math.min(100, (ops - 0.5) * 200));
        return Math.round(salaryBase) * 10;
    }
}

// URL 유틸리티 (필요시 이미지 매핑)
function getTeamLogoUrl(teamName: string): string {
    const normalized = normalizeTeamName(teamName);
    return `/assets/logos/${normalized}.png`;
}

export async function fetchAndAdaptPlayers(): Promise<{ batters: Player[], pitchers: Player[] }> {
    try {
        // @ts-ignore
        let apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';

        if (apiUrl.includes('host.docker.internal')) {
            apiUrl = apiUrl.replace('host.docker.internal', 'localhost');
        }
        console.log(`Fetching players from: ${apiUrl}/api/team/players`);

        const response = await fetch(`${apiUrl}/api/team/players`);
        if (!response.ok) {
            throw new Error(`Failed to fetch players: ${response.status}`);
        }

        const data: BackendPlayersResponse = await response.json();

        // 1. 타자 변환
        const batters: Player[] = data.batters.map((b) => {
            // 이미치 처리 (임시)
            const imageUrl = '';

            // stats 객체 구성
            const stats = {
                avg: b.avg,
                ops: b.ops,
                pa: b.pa,
                hit: b.hit,
                doubleHit: b.doubleHit,
                tripleHit: b.tripleHit,
                homeRun: b.homeRun,
                strikeOut: b.strikeOut,
                walk: b.walk,
                hbp: b.hbp,
                sb: b.sb,
                cs: b.cs,
                error: b.error,
                fpct: b.fpct,
                // 추가 필드 계산
                slg: (b.hit + b.doubleHit + b.tripleHit * 2 + b.homeRun * 3) / Math.max(1, (b.pa - b.walk)), //Approx
            };

            const player: Player = {
                id: b.id, // Number로 유지
                name: b.name,
                team: normalizeTeamName(b.team),
                position: b.position,
                image_url: imageUrl,
                credit: 0,
                salary: 0,
                avg: b.avg,
                pa: b.pa,
                hit: b.hit,
                doubleHit: b.doubleHit,
                tripleHit: b.tripleHit,
                homeRun: b.homeRun,
                strikeOut: b.strikeOut,
                walk: b.walk,
                hbp: b.hbp,
                ops: b.ops,
                sb: b.sb,
                cs: b.cs,
                error: b.error,
                fpct: b.fpct,
                speed: 10 + b.sb * 2,
                stats: stats,
                ip: 0, h: 0, hr: 0, bb: 0, so: 0, go: b.go, ao: b.ao, max_pitch_count: 0
            };

            player.salary = calculateSalary(player);
            player.credit = player.salary; // UI에서 credit 사용

            return player;
        });

        // 2. 투수 변환
        const pitchers: Player[] = data.pitchers.map((p) => {
            const imageUrl = '';

            // ERA 계산
            // 자책점이 없어서 hr(피홈런) * 9 로 대충 근사치 혹은 그냥 랜덤... 
            // -> Picher.kt (ip, h, hr, bb, so...)
            // WHIP = (H + BB) / IP
            const whip = p.ip > 0 ? (p.h + p.bb) / p.ip : 1.5;
            const tempEra = whip * 3.0; // 대략적 변환

            // 보직 결정 (로직)
            // 선발: 이닝이 많음
            // 마무리: 이닝 적음
            let role: 'starter' | 'middle' | 'closer' = 'middle';
            if (p.ip > 80) role = 'starter';
            else if (p.so > 20 && p.ip < 50) role = 'closer';

            const stats = {
                era: Number(tempEra.toFixed(2)),
                whip: Number(whip.toFixed(2)),
                k: p.so,
                ip: p.ip
            };

            const player: Player = {
                id: p.id,
                name: p.name,
                team: normalizeTeamName(p.team),
                position: '투수',
                image_url: imageUrl,
                credit: 0,
                salary: 0,
                pitcherRole: role,
                ip: p.ip,
                h: p.h,
                hr: p.hr,
                bb: p.bb,
                so: p.so,
                go: p.go,
                ao: p.ao,
                error: p.error,
                max_pitch_count: role === 'starter' ? 100 : (role === 'middle' ? 50 : 30),
                avg: 0, pa: 0, hit: 0, doubleHit: 0, tripleHit: 0, homeRun: 0, strikeOut: 0, walk: 0, hbp: p.hbp, ops: 0, sb: 0, cs: 0, fpct: p.fpct, speed: 0,
                stats: stats
            };

            player.salary = calculateSalary(player);
            player.credit = player.salary;

            return player;
        });

        return { batters, pitchers };

    } catch (e) {
        console.error("Failed to fetch players:", e);
        // 실패 시 빈 배열 반환 (에러 처리 필요 시 수정)
        return { batters: [], pitchers: [] };
    }
}
