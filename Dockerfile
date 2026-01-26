FROM node:18-alpine

WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 포트 노출 (Vite 기본 포트)
EXPOSE 5173

# 개발 모드 실행
CMD ["npm", "run", "dev", "--", "--host"]
