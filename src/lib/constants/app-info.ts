/**
 * 앱 정보 및 개발사 정보
 */

export const APP_INFO = {
  name: 'WINGS BASEBALL CLUB',
  fullName: '윙스야구동호회',
  version: '1.0.0',
  buildDate: '2024-12-17',
  description: '야구 동호회 커뮤니티 통합 관리 시스템',
} as const;

export const DEVELOPER_INFO = {
  company: 'KS컴퍼니',
  ceo: ['배종수', '석경선'],
  contactEmail: 'suhachi02@gmail.com',
  manager: '배종수',
  managerRole: '운영관리 책임자',
} as const;

export const FEATURES = [
  '동호회 운영 관리 (공지/일정/출석/투표/앨범)',
  '회비 및 회계 관리',
  '경기 기록 시스템 (라인업/타자/투수 기록)',
  '역할별 권한 관리',
  '실시간 데이터 동기화',
  'PWA 지원 (모바일 앱 설치 가능)',
] as const;

export const TECH_STACK = {
  frontend: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Motion/React'],
  backend: ['Firebase Auth', 'Firebase Firestore', 'Firebase Storage', 'Firebase Cloud Functions'],
  ui: ['shadcn/ui', 'Radix UI', 'Lucide Icons'],
} as const;

export const PRIVACY_POLICY = {
  lastUpdated: '2024-12-17',
  description: '본 서비스는 동호회 회원 전용 서비스로, 초대 코드를 통해서만 가입할 수 있습니다.',
  dataCollection: [
    '회원 정보 (이름, 닉네임, 연락처, 역할)',
    '게시글 및 댓글',
    '출석 및 투표 정보',
    '경기 기록',
    '회비 납부 정보',
  ],
  dataUsage: [
    '동호회 운영 및 관리',
    '회원 간 커뮤니케이션 지원',
    '경기 및 일정 관리',
    '회비 및 회계 관리',
  ],
} as const;
