
import { api } from './api';

export interface MatchStatusResponse {
    status: 'WAITING' | 'MATCHED' | 'CANCELLED';
    matchId?: string;
    opponentId?: number;
}

export const matchmakingService = {
    // 대기열 참가
    joinQueue: async (userId: number): Promise<{ status: string }> => {
        const response = await api.post('/matchmaking', { user_id: userId });
        return response.data;
    },

    // 매칭 상태 확인 (Polling)
    checkStatus: async (userId: number): Promise<MatchStatusResponse> => {
        const response = await api.get('/matchmaking/status', {
            params: { userId },
        });
        return response.data;
    },

    // 대기 취소
    cancelQueue: async (userId: number): Promise<{ status: string }> => {
        const response = await api.delete('/matchmaking', {
            params: { userId },
        });
        return response.data;
    },
};
