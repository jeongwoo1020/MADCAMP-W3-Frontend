# WebSocket 게임 설정 API 문서

## 📋 개요

라인업 확정, 구장 선택, 홈/원정 선택을 위한 WebSocket API입니다.

---

## 🎯 1. WebSocket 엔드포인트

### 기존 (게임 플레이용)
```
/app/match/{matchId}/command
```

### 새로 추가 (게임 설정용)
```
/app/match/{matchId}/setup
```

**구독 엔드포인트는 동일:**
```
/topic/match/{matchId}
```

---

## 📝 2. 메시지 타입

### (1) 라인업 확정 - `LINEUP_CONFIRM`

#### 보내기
```javascript
stompClient.send(`/app/match/${matchId}/setup`, {}, JSON.stringify({
  type: 'LINEUP_CONFIRM',
  senderId: userId,
  matchId: matchId
}));
```

#### 받기
```javascript
{
  eventType: 'LINEUP_STATUS',
  matchId: 'ABC123',
  inning: 0,
  description: '양쪽 라인업 확정 완료!', // 또는 '상대방 라인업 대기 중...'
  data: {
    home_confirmed: true,
    away_confirmed: true,
    both_confirmed: true  // ⭐ 이게 true면 다음 화면으로!
  },
  timestamp: 1234567890
}
```

---

### (2) 구장 선택 - `STADIUM_SELECT`

#### 보내기
```javascript
stompClient.send(`/app/match/${matchId}/setup`, {}, JSON.stringify({
  type: 'STADIUM_SELECT',
  senderId: userId,
  matchId: matchId,
  data: {
    stadium: '인천 SSG 랜더스필드'  // 구장 이름
  }
}));
```

#### 받기
```javascript
{
  eventType: 'STADIUM_SELECTED',
  matchId: 'ABC123',
  inning: 0,
  description: '구장: 인천 SSG 랜더스필드',
  data: {
    stadium: '인천 SSG 랜더스필드'
  },
  timestamp: 1234567890
}
```

**⭐ 중요:** 상대방도 같은 메시지를 받아서 자동으로 구장이 설정됨

---

### (3) 홈/원정 선택 - `HOME_AWAY_SELECT`

#### 보내기
```javascript
stompClient.send(`/app/match/${matchId}/setup`, {}, JSON.stringify({
  type: 'HOME_AWAY_SELECT',
  senderId: userId,
  matchId: matchId,
  data: {
    is_home: true  // true면 홈, false면 원정
  }
}));
```

#### 받기
```javascript
{
  eventType: 'HOME_AWAY_SELECTED',
  matchId: 'ABC123',
  inning: 0,
  description: '홈팀 선택', // 또는 '원정팀 선택'
  data: {
    home_team_id: 1,  // 홈팀 userId
    away_team_id: 2   // 원정팀 userId
  },
  timestamp: 1234567890
}
```

**⭐ 중요:** 내 userId와 비교해서 자동으로 홈/원정 판단

---

### (4) 게임 시작 준비 확인 - `CHECK_READY`

#### 보내기
```javascript
stompClient.send(`/app/match/${matchId}/setup`, {}, JSON.stringify({
  type: 'CHECK_READY',
  senderId: userId,
  matchId: matchId
}));
```

#### 받기
```javascript
{
  eventType: 'READY_STATUS',
  matchId: 'ABC123',
  inning: 0,
  description: '게임 시작 준비 완료!', // 또는 '설정 진행 중...'
  data: {
    ready: true,  // ⭐ 모든 설정 완료 여부
    home_confirmed: true,
    away_confirmed: true,
    stadium: '인천 SSG 랜더스필드',
    home_team_id: 1,
    away_team_id: 2
  },
  timestamp: 1234567890
}
```

---

## 🔄 3. 화면별 구현 예시

### 라인업 화면 (`/lineup/${matchId}`)

```javascript
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function LineupScreen() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [stompClient, setStompClient] = useState(null);
  const userId = getUserId(); // 사용자 ID 가져오기

  useEffect(() => {
    // WebSocket 연결
    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);

    client.connect({}, () => {
      // 메시지 구독
      client.subscribe(`/topic/match/${matchId}`, (message) => {
        const response = JSON.parse(message.body);
        
        if (response.eventType === 'LINEUP_STATUS') {
          if (response.data.both_confirmed) {
            // ⭐ 양쪽 모두 확정 → 게임 설정 화면으로 이동
            navigate(`/setup/${matchId}`);
          } else {
            // 상대방 대기 중 메시지 표시
            alert('상대방 라인업 대기 중...');
          }
        }
      });

      setStompClient(client);
    });

    return () => client?.disconnect();
  }, [matchId]);

  // "라인업 확정" 버튼 클릭
  const handleConfirm = () => {
    if (!stompClient) return;

    stompClient.send(`/app/match/${matchId}/setup`, {}, JSON.stringify({
      type: 'LINEUP_CONFIRM',
      senderId: userId,
      matchId: matchId
    }));
  };

  return (
    <div>
      {/* 라인업 설정 UI */}
      <button onClick={handleConfirm}>라인업 확정 및 경기 시작</button>
    </div>
  );
}
```

---

### 게임 설정 화면 (`/setup/${matchId}`)

```javascript
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function SetupScreen() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [stompClient, setStompClient] = useState(null);
  const [stadium, setStadium] = useState('');
  const [isHome, setIsHome] = useState(null);
  const userId = getUserId();

  useEffect(() => {
    // WebSocket 연결
    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);

    client.connect({}, () => {
      // 메시지 구독
      client.subscribe(`/topic/match/${matchId}`, (message) => {
        const response = JSON.parse(message.body);
        
        // 구장 선택 동기화
        if (response.eventType === 'STADIUM_SELECTED') {
          setStadium(response.data.stadium);
        }
        
        // 홈/원정 선택 동기화
        if (response.eventType === 'HOME_AWAY_SELECTED') {
          const myIsHome = (userId === response.data.home_team_id);
          setIsHome(myIsHome);
        }
        
        // 게임 시작 준비 확인
        if (response.eventType === 'READY_STATUS') {
          if (response.data.ready) {
            // ⭐ 모든 설정 완료 → 게임 화면으로 이동
            navigate(`/game/${matchId}`);
          } else {
            alert('설정을 완료해주세요!');
          }
        }
      });

      setStompClient(client);
    });

    return () => client?.disconnect();
  }, [matchId]);

  // 구장 선택
  const handleStadiumSelect = (selectedStadium) => {
    if (!stompClient) return;

    stompClient.send(`/app/match/${matchId}/setup`, {}, JSON.stringify({
      type: 'STADIUM_SELECT',
      senderId: userId,
      matchId: matchId,
      data: { stadium: selectedStadium }
    }));
  };

  // 홈/원정 선택
  const handleHomeAwaySelect = (selectHome) => {
    if (!stompClient) return;

    stompClient.send(`/app/match/${matchId}/setup`, {}, JSON.stringify({
      type: 'HOME_AWAY_SELECT',
      senderId: userId,
      matchId: matchId,
      data: { is_home: selectHome }
    }));
  };

  // "경기 시작하기" 버튼 클릭
  const handleGameStart = () => {
    if (!stompClient) return;

    stompClient.send(`/app/match/${matchId}/setup`, {}, JSON.stringify({
      type: 'CHECK_READY',
      senderId: userId,
      matchId: matchId
    }));
  };

  return (
    <div>
      <h1>경기 준비 설정</h1>
      
      {/* 구장 선택 */}
      <div>
        <h2>구장 선택</h2>
        <button onClick={() => handleStadiumSelect('인천 SSG 랜더스필드')}>
          인천 SSG 랜더스필드
        </button>
        <button onClick={() => handleStadiumSelect('서울 잠실야구장')}>
          서울 잠실야구장
        </button>
        {stadium && <p>선택된 구장: {stadium}</p>}
      </div>
      
      {/* 홈/원정 선택 */}
      <div>
        <h2>홈/원정 선택</h2>
        <button onClick={() => handleHomeAwaySelect(true)}>홈</button>
        <button onClick={() => handleHomeAwaySelect(false)}>원정</button>
        {isHome !== null && <p>{isHome ? '홈팀' : '원정팀'}</p>}
      </div>
      
      {/* 경기 시작 */}
      <button onClick={handleGameStart}>경기 시작하기</button>
    </div>
  );
}
```

---

## 💡 4. 주요 포인트

### ✅ 구장 선택
- **한 명이 선택하면 양쪽 모두 자동 적용**
- 상대방이 선택한 것도 내 화면에 자동 반영
- 먼저 선택한 사람의 구장으로 고정

### ✅ 홈/원정 선택
- **한 명이 홈 선택하면 상대는 자동으로 원정**
- `home_team_id`와 내 `userId` 비교해서 자동 판단
- 먼저 선택한 사람이 원하는 쪽으로 선택

### ✅ 게임 시작
- **모든 설정 완료 후 `CHECK_READY` 보내기**
- `ready: true`면 게임 화면으로 자동 이동
- 하나라도 설정 안 되면 경고 메시지

---

## 🎯 5. 화면 흐름

```
1. 로비
   ↓ (초대 코드 입력)
   
2. 라인업 설정 화면
   - 선수 9명 선택
   - "라인업 확정" 버튼 클릭
   ↓ (WebSocket: LINEUP_CONFIRM)
   
3. both_confirmed === true
   ↓ (자동 이동)
   
4. 게임 설정 화면
   - 구장 선택 (양쪽 동기화)
   - 홈/원정 선택 (자동 반대)
   - "경기 시작하기" 버튼 클릭
   ↓ (WebSocket: CHECK_READY)
   
5. ready === true
   ↓ (자동 이동)
   
6. 게임 화면
   - 실제 게임 진행
```

---

## 📌 6. 에러 처리

```javascript
client.subscribe(`/topic/match/${matchId}`, (message) => {
  const response = JSON.parse(message.body);
  
  if (response.eventType === 'ERROR') {
    alert(response.description);
  }
});
```

---

## 🔍 7. 디버깅

### 백엔드 로그 확인
```bash
docker logs baseball-app -f
```

**주요 로그:**
```
✅ 라인업 확정: matchId=ABC123, userId=1, isHome=true, both=true
🏟️ 구장 선택: matchId=ABC123, stadium=인천 SSG 랜더스필드
⚾ 홈/원정 선택: matchId=ABC123, userId=1, isHome=true
```

### 프론트엔드 디버깅
```javascript
client.subscribe(`/topic/match/${matchId}`, (message) => {
  console.log('📨 받은 메시지:', message.body);
  const response = JSON.parse(message.body);
  console.log('eventType:', response.eventType);
  console.log('data:', response.data);
});
```

---

## ⚠️ 8. 주의사항

1. **WebSocket 연결 확인**
   - `client.connect()` 성공 후에만 메시지 전송

2. **matchId 일치**
   - 보내는 matchId와 구독하는 matchId가 동일해야 함

3. **userId 정확성**
   - senderId는 현재 로그인한 사용자의 실제 ID여야 함

4. **타이밍 이슈**
   - 상대방이 아직 연결 안 됐을 수도 있으니 대기 메시지 표시

5. **화면 전환**
   - `both_confirmed: true`일 때만 자동 이동
   - `ready: true`일 때만 게임 시작

---

## 📞 문의

백엔드 관련 문제 발생 시:
- Docker 로그 확인: `docker logs baseball-app --tail 50`
- 백엔드 개발자에게 로그 전달

---

**작성일:** 2026-01-28  
**백엔드 버전:** v1.0  
**문서 버전:** 1.0
