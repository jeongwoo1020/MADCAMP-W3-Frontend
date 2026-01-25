export interface TeamTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
}

export const TEAM_THEMES: Record<string, TeamTheme> = {
  'SSG 랜더스': {
    name: 'SSG 랜더스',
    primary: '#CE0E2D',
    secondary: '#003087',
    accent: '#FFD700',
    gradient: 'from-red-600 to-blue-800',
  },
  'LG 트윈스': {
    name: 'LG 트윈스',
    primary: '#C30452',
    secondary: '#000000',
    accent: '#FFFFFF',
    gradient: 'from-pink-600 to-gray-900',
  },
  '두산 베어스': {
    name: '두산 베어스',
    primary: '#131230',
    secondary: '#C4122E',
    accent: '#FFFFFF',
    gradient: 'from-slate-900 to-red-700',
  },
  'KT 위즈': {
    name: 'KT 위즈',
    primary: '#000000',
    secondary: '#ED1C24',
    accent: '#FFFFFF',
    gradient: 'from-black to-red-600',
  },
  '키움 히어로즈': {
    name: '키움 히어로즈',
    primary: '#820024',
    secondary: '#000000',
    accent: '#FFD700',
    gradient: 'from-red-900 to-gray-900',
  },
  'KIA 타이거즈': {
    name: 'KIA 타이거즈',
    primary: '#EA0029',
    secondary: '#000000',
    accent: '#FFFFFF',
    gradient: 'from-red-600 to-gray-900',
  },
  '삼성 라이온즈': {
    name: '삼성 라이온즈',
    primary: '#074CA1',
    secondary: '#FFFFFF',
    accent: '#FFD700',
    gradient: 'from-blue-700 to-blue-500',
  },
  'NC 다이노스': {
    name: 'NC 다이노스',
    primary: '#315288',
    secondary: '#C49A6C',
    accent: '#FFFFFF',
    gradient: 'from-blue-800 to-amber-700',
  },
  '롯데 자이언츠': {
    name: '롯데 자이언츠',
    primary: '#041E42',
    secondary: '#D00F31',
    accent: '#FFFFFF',
    gradient: 'from-blue-950 to-red-700',
  },
  '한화 이글스': {
    name: '한화 이글스',
    primary: '#FF6600',
    secondary: '#000000',
    accent: '#FFFFFF',
    gradient: 'from-orange-600 to-gray-900',
  },
};
