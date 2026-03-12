# ⚾ 치고 달려라

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**치고 달려라**는 사용자가 직접 야구 구단의 감독이 되어 실시간으로 경기를 지휘하고 시뮬레이션하는 매니지먼트 게임입니다. 정교한 라인업 구성부터 경기 중 실시간 작전 지시까지, 데이터 기반의 야구 시뮬레이션을 경험해보세요.

---

## ✨ 주요 기능 (Key Features)

### 1. 실시간 경기 시뮬레이션 (Real-time Simulation)
- **WebSocket(StompJS)** 기반의 실시간 데이터 중계
- 매 투구(Pitch)와 타석(At-bat) 결과의 정교한 시뮬레이션 및 데이터 시각화
- 상황별 중계 텍스트 제공
<img width="1410" height="827" alt="simulation" src="https://github.com/user-attachments/assets/e7e8f32f-27e4-448b-8ea9-3fc63d0f1d91" />


### 2. 전략적 라인업 빌더 (Lineup Builder)
- **Drag & Drop** 인터페이스를 통한 간편한 선수 배치
- **Credit System**: 제한된 예산 내에서 최적의 선수 조합을 찾는 밸런싱 재미
- 타순 및 수비 위치(선발/벤치/불펜) 커스텀 설정
<img width="1361" height="881" alt="lineupBuilder" src="https://github.com/user-attachments/assets/63c685a0-91e3-44de-8cec-740d0cd61ecf" />

### 3. 감독 전술 지시 (Tactical Management)
- 경기 상황에 따른 실시간 커맨드: **번트, 도루, 고의 사구** 등
- 투수 및 타자 교체 시스템(Substitution)

### 4. 사후 분석 및 결과 (Match Analysis)
- 경기 요약 및 박스스코어 제공
- 주요 장면 하이라이트 로그 아카이빙
- MVP 및 승리/패전 투수 기록 확인

---

## 🛠 기술 스택 (Tech Stack)

### Frontend Core
- **Framework**: React 18.3 (Vite 6)
- **Language**: TypeScript
- **State Management**: React Hook Form

### Styling & UI/UX
- **CSS**: Tailwind CSS 4 (Beta version integration)
- **Components**: MUI (Material UI), Radix UI
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Network & Real-time
- **Communication**: Axios
- **Real-time**: StompJS, SockJS-client
- **Auth**: Google OAuth 2.0

---

## 📂 프로젝트 구조 (Project Structure)

```text
src/
├── app/                # 주요 페이지 컴포넌트 (Login, Lobby, Lineup, Game 등)
├── components/         # 재사용 가능한 공통 UI 컴포넌트
├── lib/                # 외부 라이브러리 설정 (API Client, WebSocket 등)
├── styles/             # 전역 스타일 및 Tailwind 설정
└── main.tsx            # 애플리케이션 엔트리 포인트
```
