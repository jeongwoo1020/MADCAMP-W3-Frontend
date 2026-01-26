# WebSocket 프로토콜 명세

## 1. 메시지 구조 (Client -> Server)
클라이언트가 `/app/match/{matchId}/command` 로 보낼 때 사용하는 JSON 포맷입니다.

| 필드명 | 타입 | 설명 | 필수 여부 |
|---|---|---|---|
| `matchId` | String | 매치 ID | **필수** |
| `senderId` | Number | 보낸 유저 ID | **필수** |
| `type` | String | 액션 종류 (아래 참조) | **필수** |
| `content` | String | 추가 내용 (예: 구종) | 선택 |
| `inning` | Number | 현재 이닝 (검증용) | 선택 |
| `data` | Object | 기타 데이터 | 선택 |

### 지원하는 액션 타입 (`type`)
현재 백엔드 로직(`GamePlayService`)상 어떤 타입을 보내든 **"다음 플레이 진행(투구 및 타격 결과 판정)"**으로 처리됩니다. 하지만 의미상 아래와 같이 구분해서 보내는 것을 권장합니다.

*   `PITCH`: 투수 투구 (일반적인 게임 진행)
    *   *현재는 이 메시지를 보내면 자동으로 타격 결과까지 계산되어 반환됩니다.*

*(추후 구현 예정: `SUBSTITUTION` 등)*

---

## 2. 응답 구조 (Server -> Client)
서버가 `/topic/match/{matchId}` 로 뿌려주는 JSON 포맷입니다.

| 필드명 | 타입 | 설명 |
|---|---|---|
| `eventType` | String | 이벤트 타입 (아래 참조) |
| `matchId` | String | 매치 ID |
| `inning` | Number | 결과 발생 이닝 |
| `description` | String | 텍스트 중계 (예: "안타! 주자 1루 진루") |
| `data` | Object | 상세 데이터 (`success`: boolean 등) |
| `timestamp` | Number | 발생 시간 (ms) |

### 발생 가능한 이벤트 타입 (`eventType`)

#### 1. `AT_BAT_RESULT` (타석 결과)
투구 및 타격 시뮬레이션이 완료되었을 때 발생합니다.
*   가장 빈번하게 발생하는 이벤트입니다.
*   `description`에 "안타", "홈런", "삼진" 등의 결과 텍스트가 담겨 옵니다.
*   점수 변경, 이닝 교체 등의 정보는 현재 `description` 텍스트에 포함되어 있거나 백엔드 내부 상태만 변경됩니다. (추후 `MatchInfo` 객체 전체를 반환하도록 개선될 수 있습니다.)

#### 2. `ERROR` (에러)
요청 처리 중 문제가 발생했을 때(예: 순서가 아닌데 요청함, 유저 정보 없음 등) 발생합니다.
*   `description`: 에러 메시지

---

## 3. 예시 시나리오

**상황: 사용자가 "투구" 버튼 클릭**

1.  **Client Send:**
    ```json
    {
      "matchId": "ABCD12",
      "senderId": 101,
      "type": "PITCH",
      "content": "FASTBALL"
    }
    ```

2.  **Server Process:**
    *   투수/타자 능력치 기반 시뮬레이션 수행
    *   결과: 안타

3.  **Server Broadcast (Receive):**
    ```json
    {
      "eventType": "AT_BAT_RESULT",
      "matchId": "ABCD12",
      "inning": 1,
      "description": "⚾ 추신수: 2루타! \n👏 1타점 적시타!",
      "data": { "success": true },
      "timestamp": 1706251234567
    }
    ```
