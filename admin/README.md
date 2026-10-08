# Daytale 관리자 페이지 (v1)

앞서 만든 관리자 화면(record-service/admin)의 모양과 흐름은 그대로 두고, v1 데이터와 백서 운영 계획에 맞췄어요. 앱과 **따로** 배포해요.

## 무엇이 있나
| 화면 | 내용 |
|---|---|
| 대시보드 | 전체 회원, 신규 가입, 유료 구독, 기록, 7일 접속, **나라별 회원·유료·전환**, 가입 추이, 예상 월 매출, 무료 체험 중/끝 |
| 회원 | 검색, 거르기(체험 중 · 체험 끝 · 유료 · 결제 실패 · 11개월 미접속 · 정지 · 관리자), 나라·언어 |
| 회원 상세 | 기록·사진·폴더 **개수만**(내용은 관리자도 못 봐요), 구독, 체험 끝 날짜, 정지/해제, **체험 연장**(owner), 계정 삭제(owner) |
| 구독·결제 | Paddle 웹훅이 쓴 구독 목록, 해지(Paddle API 키가 있을 때) |
| 운영 | **무료 한도 게이지**(Supabase DB 500MB · 월간 활성 50,000 · R2 10GB). 70%가 넘으면 대시보드 맨 위에 경고. 1년 미접속 정리 대상 수, 언어별 회원 |
| 공지 | 앱 알림함에 공지 올리기·내리기(언어별 가능, owner) |
| 관리 기록 | 정지·삭제·해지·체험 연장·공지가 누가/언제/왜로 남아요 |

## 설치 (직접 하실 일)
1. SQL Editor에서 `supabase/schema.sql` 다음에 `supabase/admin.sql` 실행
2. `24story@gmail.com`으로 앱에 가입하면 자동으로 owner가 돼요(비밀번호는 가입할 때 직접 정해요)
3. `supabase functions deploy admin-api` (JWT 검사는 켠 채로) + Secrets: `ADMIN_ORIGIN`(관리자 주소), `CRON_SECRET`, (선택) `PADDLE_API_KEY`, `PADDLE_ENV`
4. 매일 운영: Supabase → Integrations → Cron에서 하루 한 번 `admin-api`를 `x-cron-secret` 헤더로 POST → 체험 7일·3일 전 앱 알림
5. Cloudflare Pages에 **새 프로젝트**로 `admin/site/`만 올리기. (권장) Cloudflare Access로 내 이메일만 허용

## 검사
```
node --experimental-strip-types test/api.test.mjs     # 권한·API 41개
node --experimental-strip-types test/ui.mjs shots/    # 브라우저 화면
```

## 메모
- 안내 메일(체험 종료, 1년 미접속 30일·7일 전)은 메일 서비스(예: Resend, 월 3,000통 무료)를 연결한 뒤 보내요. 연결 여부는 대표가 정해요.
- 1년 미접속 계정의 실제 삭제는 되돌릴 수 없어서, 대표 확인 전에는 자동으로 돌리지 않아요.
