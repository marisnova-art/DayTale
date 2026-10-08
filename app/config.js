/* Daytale 설정. 여기엔 공개(anon) 키만 넣어요. service_role 키는 절대 넣지 않아요. */
window.APP_CONFIG = {
  BRAND: { name: "Daytale", nameKo: "데이테일", tagline: "하루가 이야기가 되는 곳" }, // 임시 이름, 나중에 여기서만 바꾸면 돼요
  SUPABASE_URL: "https://qovcfpvitifbbmizdqop.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdmNmcHZpdGlmYmJtaXpkcW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NTA3MzksImV4cCI6MjEwNzAyNjczOX0.GhbBBj_ENOUiDZ7B_eHtESjX_8cirCNGEQw6HGOK6K8",
  CONTACT: "24story@gmail.com",
  SITE_URL: "",
  PHOTOS_URL: "",                       // R2 공개 주소 (4단계에서 채움)
  PADDLE: {
    environment: "sandbox",
    clientToken: "",
    prices: { monthly: "", yearly: "" },
    display: { monthly: 3.99, yearly: 39.9, currency: "USD" }
  }
};
