# Daytale v1.0 (임시 이름)

배포 순서는 [DEPLOY.md](DEPLOY.md)에 있어요. `dist/`에는 Cloudflare Pages에 바로 올릴 수 있는 zip 두 개가 있어요 (다시 만들 때: 앱·관리자 폴더를 그대로 압축).

폴더
- `app/` 앱 (빌드 없음, Cloudflare Pages에 그대로 올려요). 이름·키는 `app/config.js` 한 곳에만 있어요.
- `admin/` 관리자 페이지 (6단계)
- `supabase/schema.sql` 데이터베이스 전체 (여러 번 실행해도 안전)
- `supabase/functions/` 서버 함수 (날씨·사진·결제 웹훅, 4~5단계)
- `app/en|ko|ja|es|fr/` 언어별 소개 페이지 (`node tools/build-site.mjs`로 만들어요. 이름·가격·문구는 그 파일 위쪽에서 고쳐요)
- `app/legal/` 이용약관·개인정보 처리방침 (영어 원문 + 한국어). `[ ]` 안은 출시 전에 채울 곳이에요
- 앱 언어: 한국어·영어·일본어·스페인어·프랑스어 (`app/js/i18n`, 이야기 문장 `app/js/story`)
- `tools/sql-test` DB 권한 검사 44개, `tools/e2e` 브라우저 검사 (PGlite로 Supabase 흉내)

## Supabase 준비 (한 번)
1. Supabase → SQL Editor → `supabase/schema.sql` 내용을 붙여 넣고 Run.
   - `24story@gmail.com`으로 가입하면 자동으로 관리자(owner)가 돼요. 비밀번호는 본인이 가입할 때 정해요.
2. Authentication → URL Configuration
   - Site URL: 배포 주소 (예: `https://daytale.pages.dev`)
   - Redirect URLs: 같은 주소 + 로컬 테스트 주소
3. (선택) Authentication → Providers → Google 켜기 (Google Cloud에서 OAuth 클라이언트 만들기)
4. 서버 함수 두 개 배포: `supabase functions deploy weather` / `supabase functions deploy photos`
   - 비밀 값(Edge Functions → Secrets): `WEATHER_CONTACT`(운영 메일), `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `CRON_SECRET`(아무 긴 문자열), `APP_ORIGIN`(배포 주소)
   - `SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`·`SUPABASE_ANON_KEY`는 Supabase가 자동으로 넣어 줘요. 서비스 키는 서버 함수 안에서만 쓰고 앱에는 절대 넣지 않아요.

## 알림 (웹 푸시, 앱을 닫아도 와요 · 무료)
- `supabase/push.sql`: 기기 푸시 주소(`push_subs`), 보낸 기록(`push_sent`), 열쇠(`push_config`, 서버만 읽음), 지금 보낼 알림을 고르는 `push_due()`, 1분마다 부르는 pg_cron 작업.
- 서버 함수 `push` (verify_jwt 꺼짐): GET = 앱에 줄 공개 키 (처음 불릴 때 VAPID 열쇠를 만들어 DB에 저장), POST = cron 토큰 확인 후 보내기.
- 따로 넣을 비밀 값은 없어요. 아이폰은 iOS 16.4 이상, 홈 화면에 설치한 앱에서만 받아요.

## 사진 (Cloudflare R2, 무료 10GB · 내려받기 요금 없음)
1. Cloudflare → R2 → 버킷 만들기 (예: `daytale-photos`) → 공개 접근: r2.dev 주소 켜기(나중에 `photos.도메인`으로 바꾸기)
2. R2 → API 토큰 만들기(이 버킷만 읽기·쓰기) → 키 두 개를 위 Secrets에 넣기
3. `app/config.js`의 `PHOTOS_URL`에 공개 주소 넣기
4. 하루 한 번 정리: Supabase → Integrations → Cron에서 `photos?action=sweep`을 `x-cron-secret` 헤더와 함께 POST (뺀 사진·지운 기록의 사진을 R2에서도 지워요)
- 파일 경로는 `사용자id/사진id.webp`처럼 추측할 수 없는 주소예요. 앱이 줄여서 보내요: 본문 ≈200KB(긴 변 1600), 미리보기 ≈30KB. 사파리는 jpg로 보내요.

## 구독 (Paddle, 먼저 샌드박스)
1. Paddle 샌드박스 계정 → Catalog에서 상품 1개, 가격 2개 (월 3.99 USD, 연 39.90 USD). 나라별 가격은 Paddle에서 설정.
2. Developer tools → Authentication에서 client-side token 만들기 → `app/config.js`의 `PADDLE.clientToken`, `PADDLE.prices.monthly/yearly`에 넣기
3. Notifications → 새 목적지: `https://<project>.supabase.co/functions/v1/paddle-webhook`, 구독 이벤트 전부 → 받은 비밀 값을 `PADDLE_WEBHOOK_SECRET`, 가격 id를 `PADDLE_PRICE_MONTHLY`/`PADDLE_PRICE_YEARLY` Secrets로
4. `supabase functions deploy paddle-webhook --no-verify-jwt`
- 키를 넣기 전에는 구독 화면이 가격만 보여 주고, 결제 버튼은 "결제 준비 중" 안내를 띄워요.

## 검사
```
npm i @electric-sql/pglite playwright
node tools/sql-test/run.mjs      # DB 권한·잠금·한도
node tools/e2e/app.mjs shots/    # 로그인 → 홈 → 질문 입력 → 동기화 → 체험 끝 잠금
node tools/e2e/phase3.mjs shots/ # 편집기 · 목록 · 폴더 · 찾기 · 휴지통
node --experimental-strip-types tools/e2e/phase4.mjs shots/   # 캘린더 · 날씨 · 사진(진짜 서버 함수 + 가짜 R2) · 백업
node --experimental-strip-types tools/fn-test/weather.test.mjs
node --experimental-strip-types tools/fn-test/photos.test.mjs
node --experimental-strip-types tools/fn-test/paddle.test.mjs
node --experimental-strip-types tools/e2e/phase5.mjs shots/   # 설정 · 알림 · 알림함 · 구독 · 설치 안내 · 계정 삭제
node --experimental-strip-types tools/e2e/phase7.mjs shots/   # 영어·일본어·스페인어·프랑스어: 빠진 번역 · 화면 넘침 · 이야기
```
공유 폴더에는 node_modules·심볼릭 링크를 둘 수 없어 작업 폴더에 복사해서 돌려요.

## 배포 전
- `node tools/update-precache.mjs` (오프라인 캐시 목록)
- 개발 확인용 `window.__daytale`은 검사 주소(app.test·localhost)에서만 생겨요
