/* Daytale 관리자 — 설정
   앱(app/config.js)과 같은 Supabase 주소와 공개(anon) 키를 넣습니다.
   service_role 키는 절대 여기에 넣지 마세요. 관리자 권한은 서버(admin-api)가 판단합니다. */
window.ADMIN_CONFIG = {
  BRAND: "Daytale",
  SUPABASE_URL: "https://qovcfpvitifbbmizdqop.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdmNmcHZpdGlmYmJtaXpkcW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NTA3MzksImV4cCI6MjEwNzAyNjczOX0.GhbBBj_ENOUiDZ7B_eHtESjX_8cirCNGEQw6HGOK6K8",
  PRICES: { monthly: 3.99, yearly: 39.9, currency: "USD" }   // 예상 월 매출 계산용 (실제 금액은 Paddle 대시보드 기준)
};
