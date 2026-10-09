# 데이테일 v1.0 배포 안내

순서대로 하면 돼요. ★ 표시는 대표님 계정이 있어야 해서 직접 하셔야 하는 일이에요. 나머지는 제가 하거나 같이 해요.
비밀번호와 비밀 키(service_role, R2 키, Paddle 키)는 대화창에 붙여 넣지 말고, 각 서비스의 설정 화면에만 넣어 주세요.

---

## 0. 코드 올릴 곳 정하기
- **권장: GitHub 비공개 저장소** ★ 빈 저장소를 하나 만들고 이 프로젝트에 연결해 주세요. 그러면 제가 코드를 올리고, 이후 고친 내용도 자동으로 배포돼요.
- 대안: GitHub 없이 `dist/` 폴더의 zip 두 개를 Cloudflare Pages에 끌어다 놓기(직접 업로드). 고칠 때마다 다시 올려야 해요.

## 1. Supabase (데이터베이스·로그인)
1. ★ SQL Editor → `supabase/schema.sql` 전체를 붙여 넣고 Run → 이어서 `supabase/admin.sql` Run (여러 번 실행해도 안전해요)
2. ★ Authentication → URL Configuration
   - Site URL: 앱 주소 (예: `https://daytale.pages.dev`)
   - Redirect URLs: 같은 주소 하나 더
3. ★ (선택) Authentication → Providers → Google 켜기 (Google Cloud Console에서 OAuth 클라이언트 만들기, 승인된 리디렉션 URI는 Supabase 화면에 나오는 주소)
4. ★ 앱에서 `24story@gmail.com`으로 가입 → **확인 메일의 링크를 누르면** 관리자(owner)가 돼요(Google로 가입하면 바로). 비밀번호는 가입할 때 직접 정해요.
5. 알아 둘 것: Supabase 기본 메일(가입 확인·비밀번호 재설정)은 **시간당 몇 통만** 보낼 수 있어요. 시험할 때는 괜찮지만, 실제 사용자를 받기 전에는 메일 서비스(SMTP)를 연결해야 해요 → 아래 6번.

## 2. 사진 저장소 (Cloudflare R2, 무료 10GB)
1. ★ Cloudflare → R2 → 버킷 만들기 `daytale-photos` → Settings → Public access: r2.dev 주소 켜기
2. ★ R2 → Manage API tokens → 이 버킷만 Object Read & Write → Access Key ID / Secret 복사(다음 단계 Secrets에만 넣기)
3. 공개 주소(`https://pub-….r2.dev`)를 알려 주시면 제가 `app/config.js`의 `PHOTOS_URL`에 넣어요.

## 3. 서버 함수 4개 (날씨·사진·결제 웹훅·관리자)
컴퓨터에 Node.js가 있으면 터미널에서:
```
npx supabase login
npx supabase link --project-ref qovcfpvitifbbmizdqop
npx supabase functions deploy weather
npx supabase functions deploy photos
npx supabase functions deploy admin-api
npx supabase functions deploy paddle-webhook --no-verify-jwt
```
★ Edge Functions → Secrets 에 넣을 값:

| 이름 | 값 |
|---|---|
| `APP_ORIGIN` | 앱 주소 |
| `ADMIN_ORIGIN` | 관리자 주소 |
| `WEATHER_CONTACT` | 운영 메일 (MET Norway 규칙) |
| `CRON_SECRET` | 아무 긴 문자열 (아래 매일 작업에 같은 값) |
| `R2_ACCOUNT_ID` · `R2_ACCESS_KEY_ID` · `R2_SECRET_ACCESS_KEY` · `R2_BUCKET` | 2단계 값 |
| `PADDLE_WEBHOOK_SECRET` · `PADDLE_PRICE_MONTHLY` · `PADDLE_PRICE_YEARLY` | 4단계 값 |
| (선택) `PADDLE_API_KEY` · `PADDLE_ENV` | 관리자 화면에서 구독 해지할 때 |

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`는 Supabase가 자동으로 넣어요. 앱 코드에는 절대 들어가지 않아요.

**매일 작업** 체험 7일·3일 전 앱 알림은 DB 예약 작업(`daytale-ops-daily`, 매시간)으로 이미 돌아가요(5개 언어). 사진 정리만 R2 연결 후 ★ Integrations → Cron → 새 작업 1개 (하루 한 번, HTTP POST, 헤더 두 개: `x-cron-secret: <CRON_SECRET>`, `Authorization: Bearer <anon 키>`)
- `…/functions/v1/photos?action=sweep` : 지운 사진을 R2에서도 정리

## 4. 결제 (Paddle, 먼저 샌드박스)
1. ★ sandbox-vendors.paddle.com 가입 → Catalog: 상품 1개, 가격 2개 (월 3.99 USD, 연 39.90 USD)
2. ★ Developer tools → Authentication → **client-side token** 만들기 → 토큰과 가격 ID 두 개를 알려 주세요(공개해도 되는 값이에요). 제가 `config.js`에 넣어요.
3. ★ Notifications → 새 목적지 `https://qovcfpvitifbbmizdqop.supabase.co/functions/v1/paddle-webhook`, subscription.* 이벤트 전부 → 받은 secret을 3단계 Secrets에
4. 샌드박스 시험 카드(4242 4242 4242 4242)로 결제 → 앱에 "구독 중"이 뜨는지 확인

## 5. 웹사이트 두 개 (Cloudflare Pages)
Cloudflare → Workers & Pages → Create → **Pages** → Connect to Git → 이 GitHub 저장소 고르기. 같은 저장소로 프로젝트를 두 번 만들어요.

| 프로젝트 | Framework preset | Build command | **Build output directory** |
|---|---|---|---|
| 앱 + 소개 페이지 (예: `daytale`) | None | 비움 | `app` |
| 관리자 (예: `daytale-admin`) | None | 비움 | `admin/site` |

- `index.html`은 저장소 맨 위가 아니라 `app` 폴더 안에 있어요. Build output directory를 비워 두면 "index를 못 찾는" 화면이 나와요.
- GitHub Pages는 폴더를 맨 위나 `/docs`만 고를 수 있어서 이 구조에는 맞지 않아요. Cloudflare Pages를 써요.

- 관리자 사이트는 ★ Cloudflare Zero Trust → Access로 **내 이메일만** 들어오게 막는 것을 권해요(무료).
- 주소가 정해지면 Supabase Site URL·Secrets의 `APP_ORIGIN`/`ADMIN_ORIGIN`도 맞춰요.

## 6. 실제 사용자 받기 전 (출시 체크리스트)
- [ ] ★ 이름·도메인 확정 → `app/config.js`, `tools/build-site.mjs` 위쪽, 아이콘 교체 (제가 해요)
- [ ] ★ 메일 서비스 연결 (예: Resend 무료 월 3,000통) → Supabase Auth SMTP + 안내 메일
- [ ] ★ 약관의 `[ ]` 채우기: 운영자·주소·보호책임자·준거법·Supabase 지역·메일 서비스
- [ ] ★ 법률·세무 검토
- [ ] ★ Paddle 본 계정 승인 → `environment: "production"`, 본 토큰·가격 ID
- [ ] ★ 첫 유료 사용자가 생기면 Supabase Pro($25/월) — 자동 백업
- [ ] 1년 미접속 계정 실제 삭제를 켤지 결정 (지금은 개수만 보여 줘요)

## 확인 방법 (배포 뒤 5분 점검)
1. 앱 주소에서 가입 → 확인 메일 → 홈에 이야기가 보임
2. 한 줄 쓰기 → 다른 기기(또는 다른 브라우저)에서 로그인해 같은 기록이 보임
3. 사진 1장 넣기 → 목록에 미리보기
4. 설정 › 데이터 → JSON 내보내기
5. 관리자 주소 → 같은 계정으로 로그인 → 대시보드 숫자 확인
