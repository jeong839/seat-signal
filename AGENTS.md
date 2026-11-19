
## 이 앱
- seat-signal: 카페 의자 20개(테이블 5×4석)를 초록·빨강·노랑 램프로 보여 주는 좌석 앱. 로그인 없음, 발표 시연용.
- 화면: `/` 입구 키오스크(안내 배너, 인원 선택, 잔여 좌석, 규칙, 좌석도), `/simulator` 의자 클릭으로 센서 흉내와 알림 로그, `/staff` 소지품 보관 알림·처리 완료·자리 비움 목록·상태 이력.
- 데이터는 사용자 Supabase 프로젝트(서울, 이름 "카페자리비움알림서비스 좌석")에 저장. 테이블: chairs(의자 상태), app_settings(시연 모드), staff_logs(직원 알림), chair_events(상태 이력). SQL은 supabase/migrations.
- 익명 사용자는 읽기만 가능하고 변경은 서버 함수(tap_chair, expire_chairs 등)로만 한다. 시간 계산은 서버 시각 기준. 시간 초과 처리는 화면이 열려 있는 동안 화면이 함수를 불러서 일어남.
- 브라우저에는 공개 키(anon)만 쓴다. 키는 .env.local(깃에 안 올림), 예시는 .env.example.
- 배포: 사용자가 Vercel에서 GitHub 저장소를 가져온다(vercel.json 포함). Vercel 환경변수 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 필요. 이 환경에서는 Vercel에 직접 배포하지 않는다.
- 이 템플릿의 worker/ 와 /admin 은 쓰지 않는다.
