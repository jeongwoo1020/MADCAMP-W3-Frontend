import axios from 'axios';

// 공통 Axios 인스턴스 생성
export const api = axios.create({
    baseURL: '/api', // 개발 환경에서는 프록시가 처리, 배포 시에는 절대 경로 사용
    headers: {
        'Content-Type': 'application/json; charset=UTF-8',
    },
    withCredentials: true, // 세션 쿠키 사용 시 필요
});

// 요청 인터셉터
api.interceptors.request.use(
    (config) => {
        // 필요한 경우 여기에 인증 토큰 추가
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // 전역 에러 처리 (예: 401 발생 시 리다이렉트)
        if (error.response?.status === 401) {
            console.warn('Unauthorized access');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
