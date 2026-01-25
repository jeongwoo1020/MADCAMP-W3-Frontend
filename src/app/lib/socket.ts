import { Client, IMessage } from '@stomp/stompjs';

export class BaseballSocket {
    private client: Client;
    private connected: boolean = false;
    private subscriptions: { [topic: string]: any } = {};

    constructor() {
        this.client = new Client({
            brokerURL: 'ws://localhost:8080/ws-baseball', // 백엔드 WebSocket URL에 맞춰 조정 필요
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        this.client.onConnect = (frame) => {
            console.log('Connected to WebSocket');
            this.connected = true;
        };

        this.client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        this.client.onWebSocketError = (event) => {
            console.error('WebSocket Error', event);
        };

        this.client.onDisconnect = () => {
            console.log('Disconnected from WebSocket');
            this.connected = false;
        };
    }

    // 서버 연결
    public connect(token?: string) {
        if (token) {
            this.client.connectHeaders = {
                Authorization: `Bearer ${token}`,
            };
        }
        this.client.activate();
    }

    // 경기 업데이트 구독
    public subscribeToMatch(matchId: string, callback: (message: any) => void) {
        if (!this.client.connected) {
            console.warn('Socket not connected, trying to subscribe pending connection...');
        }

        // 클라이언트가 연결되거나 재연결될 때마다 실행되는 콜백
        this.client.onConnect = () => {
            console.log('Connected, subscribing now...');
            this.connected = true;

            // Topic: /topic/match/{matchId}
            const topic = `/topic/match/${matchId}`;

            if (this.subscriptions[topic]) {
                return; // 이미 구독 중
            }

            const subscription = this.client.subscribe(topic, (message: IMessage) => {
                if (message.body) {
                    const parsedBody = JSON.parse(message.body);
                    callback(parsedBody);
                }
            });
            this.subscriptions[topic] = subscription;
        }

        // 이미 연결된 상태라면 즉시 구독 트리거
        if (this.client.connected) {
            this.client.onConnect({} as any);
        }
    }

    // 서버로 명령 전송 (Publish)
    public sendCommand(matchId: string, command: any) {
        if (!this.client.connected) {
            console.error('Cannot send message: Socket not connected');
            return;
        }

        // Destination: /app/match/{matchId}/command
        const destination = `/app/match/${matchId}/command`;
        this.client.publish({
            destination: destination,
            body: JSON.stringify(command),
        });
    }

    public disconnect() {
        this.client.deactivate();
    }
}

// 싱글톤 인스턴스
export const socketClient = new BaseballSocket();
