# SimulationGame WebSocket 연동 가이드

`SimulationGame.tsx`에서 백엔드의 게임 시뮬레이션 엔진과 실시간으로 통신하기 위한 WebSocket 연동 방법입니다.

## 1. 사전 준비 (라이브러리 설치)
프론트엔드 프로젝트(`MADCAMP-W3-Front`) 폴더에서 다음 패키지를 설치해야 합니다.

```bash
npm install sockjs-client @stomp/stompjs net
```
*(참고: `net`은 node polyfill 관련 이슈가 있을 수 있으니 필요 없으면 생략 가능. `sockjs-client`와 `@stomp/stompjs`만 있으면 됩니다.)*

---

## 2. 백엔드 연결 정보
*   **WebSocket Endpoint**: `http://localhost:8080/ws-baseball`
    *   (SockJS를 사용하므로 `ws://` 대신 `http://`URL을 사용해도 내부적으로 업그레이드 됩니다.)
*   **Subscribe Path (받기)**: `/topic/match/{matchId}`
    *   서버에서 보내는 게임 진행 상황(투구 결과, 아웃, 점수 등)을 수신하는 채널입니다.
*   **Publish Path (보내기)**: `/app/match/{matchId}/command`
    *   클라이언트가 서버로 액션(투구, 타격 시도 등)을 보낼 때 사용하는 경로입니다.

---

## 3. 연동 코드 (SimulationGame.tsx 예시)

`SimulationGame.tsx` 내부에 `useEffect`를 사용하여 소켓을 연결하고, 메시지를 주고받는 로직을 구현합니다.

### A. 클라이언트 객체 생성
```typescript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// ...

export function SimulationGame({ myLineup, opponentLineup, matchId, ... }: Props) {
  // 소켓 클라이언트 Ref
  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    // 1. SockJS + Stomp 클라이언트 생성
    const socketUrl = import.meta.env.VITE_API_URL 
      ? `${import.meta.env.VITE_API_URL}/ws-baseball` 
      : 'http://localhost:8080/ws-baseball';

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      // debug: (str) => console.log(str), // 디버깅 필요 시 주석 해제
      reconnectDelay: 5000, // 재연결 시도 간격
      onConnect: () => {
        console.log('✅ WebSocket Connected!');

        // 2. 구독 (Subscribe) - 게임 진행 상황 수신
        client.subscribe(`/topic/match/${matchId}`, (message) => {
          const response = JSON.parse(message.body);
          console.log("📩 Received Game Event:", response);
          
          // TODO: 여기서 setMatchInfo(response.data) 등으로 상태 업데이트
          // 예: response.eventType === 'AT_BAT_RESULT' -> handleAtBatResult(response.data)
        });
      },
      onStompError: (frame) => {
        console.error('❌ Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
    });

    client.activate(); // 연결 시작
    stompClient.current = client;

    // Cleanup: 컴포넌트 언마운트 시 연결 종료
    return () => {
      client.deactivate();
    };
  }, [matchId]);
```

### B. 행동(투구) 보내기
```typescript
  const handlePitch = () => {
    if (!stompClient.current || !stompClient.current.connected) {
      console.error("⚠️ Socket not connected");
      return;
    }

    const payload = {
      matchId: matchId,
      senderId: Number(localStorage.getItem("userId") || "0"),
      type: "PITCH", // 서버가 인식하는 액션 타입
      content: "FASTBALL", // 예: 구종
      inning: matchInfo.inning,
      data: { speed: 145 } // 추가 데이터
    };

    // 3. 발행 (Publish) - 서버로 메시지 전송
    stompClient.current.publish({
      destination: `/app/match/${matchId}/command`,
      body: JSON.stringify(payload),
    });
  };
```

---

## 4. 데이터 포맷 (참고)

### 보낼 때 (`GameMessage`)
```json
{
  "matchId": "M12345",
  "senderId": 1,
  "type": "PITCH",
  "content": "직구",
  "inning": 1,
  "data": { "foo": "bar" }
}
```

### 받을 때 (`GameResponse`)
```json
{
  "eventType": "AT_BAT_RESULT",
  "matchId": "M12345",
  "inning": 1,
  "description": "타자 안타! 1루 진루 성공.",
  "data": { "success": true },
  "timestamp": 1700001234567
}
```
