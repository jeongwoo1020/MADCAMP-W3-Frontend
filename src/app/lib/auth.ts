
import { api } from './api';
import { User } from '../types';

interface LoginResponse {
    access_token: string;
    user: {
        id: number;
        nickname: string;
    };
}

export const authService = {
    // 구글 로그인 (실제로는 idToken을 받아서 서버에 검증 요청)
    googleLogin: async (idToken: string): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/auth/login/google', {
            idToken,
        });
        return response.data;
    },

    // 개발용 테스트 로그인 (임시 토큰 전송)
    devLogin: async (): Promise<LoginResponse> => {
        // 백엔드 AuthService.kt에 임시 로직이 있으므로 아무 문자열이나 보내도 됨
        return authService.googleLogin('TEST_ID_TOKEN');
    }
};
