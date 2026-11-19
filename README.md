# seat-signal

지하주차장 빈자리 표시등 원리를 카페 의자에 적용한 좌석 안내 웹앱 (React + Vite + Supabase).

## 시작하기
1. Supabase 프로젝트를 만들고 `supabase/migrations/001_create_chairs.sql`을 SQL Editor에서 실행합니다.
2. `.env.example`을 `.env.local`로 복사해 URL과 anon 키를 넣습니다.
3. `npm install && npm run dev`

## Vercel 배포
저장소를 Import한 뒤 환경변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 넣고 Deploy 합니다.
`service_role` 키는 사용하지 않습니다.
