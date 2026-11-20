// AI 글쓰기 (11-20): 키워드 · 주제 + 짧게/길게 → 오늘 하루 일기처럼 쓴 글 한 편.
// 앱 → 이 함수 → Gemini API. 키는 서버 설정(Secrets)의 GEMINI_API_KEY 에만 있어요 (앱 · 코드 · 대화에 없음).
// 모델: GEMINI_MODELS 순서대로 (아래 handle 참고). 한도가 차거나 늦으면 다음 모델로. 모두 같은 키.
// 나중에 Claude 등으로 바꿀 때는 이 파일의 call() 한 곳만 바꿔요.
// ⚠️ 무료 키는 구글이 입력 글을 서비스 개선에 쓸 수 있어요 → 시험용. 출시 전에 유료 키 또는 Claude로 (런치 체크리스트)
// 하루 횟수 제한 · 유료 사용자만은 결제를 붙일 때 서버 표와 같이 넣어요 (지금은 시험 중이라 모두 열림)

type Deps = { fetch: typeof fetch; env: (k: string) => string | undefined };

const LANG: Record<string, string> = { ko: '한국어', en: 'English', ja: '日本語', es: 'Español', fr: 'Français' };
const ALLOW = /^https:\/\/([a-z0-9-]+\.)?(todaytale|daytale)\.pages\.dev$|^http:\/\/localhost(:\d+)?$/;

export function prompt(o: { topic: string; len: 's' | 'l'; lang: string; date?: string; design?: boolean }) {
  const lang = LANG[o.lang] || LANG.ko;
  const size = o.len === 'l'
    ? (o.lang === 'ko' || o.lang === 'ja' ? '350~500자, 2~3문단' : '120~180 words, 2-3 short paragraphs')
    : (o.lang === 'ko' || o.lang === 'ja' ? '60~110자, 1~2문장' : '20-40 words, 1-2 sentences');
  return [
    `너는 사용자를 대신해 오늘 하루 일기를 짧게 써 주는 도우미야. 아래 키워드 · 주제로 사용자 자신이 쓴 것처럼 일기 한 편을 ${lang}로 써 줘.`,
    `- 길이: ${size}`,
    '- 1인칭(나), 담백하고 따뜻한 말투. 과장 · 교훈 · 명언 · 이모지 · 해시태그 · 제목 · 따옴표 없이 본문만.',
    '- 구체적인 장면 하나(시간, 장소, 감각)를 넣어 실제 하루처럼. 종교 · 정치 · 술 이야기는 넣지 않아요.',
    o.design ? '- 한 덩어리 글로 (줄바꿈 없이).' : (o.len === 'l' ? '- 문단 사이는 빈 줄 하나.' : '- 줄바꿈 없이.'),
    o.date ? `- 계절 참고용 날짜: ${o.date} (날짜 · 요일은 글에 쓰지 않아요, 카드에 따로 있어요)` : '',
    `키워드 · 주제: ${o.topic}`,
  ].filter(Boolean).join('\n');
}

async function call(deps: Deps, model: string, key: string, text: string, len: 's' | 'l', ms: number) {
  const r = await deps.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text }] }], generationConfig: { temperature: 0.9, maxOutputTokens: model.startsWith('gemma') ? 4096 : len === 'l' ? 2048 : 1024,
      ...(model.startsWith('gemini') ? { thinkingConfig: { thinkingBudget: 0 } } : {}) } }),   // 일기 한 편엔 생각 단계가 필요 없어요 (빠르고 싸게)
    signal: AbortSignal.timeout(ms),   // 정해 둔 시간 안에 답이 없으면 다음 모델로
  });
  console.log('ai-write', model, r.status);   // 모델 · 상태만 (글 내용은 남기지 않아요)
  if (!r.ok) return { ok: false as const, status: r.status };
  const j = await r.json();
  const out = (j?.candidates?.[0]?.content?.parts || []).filter((p: any) => !p.thought).map((p: any) => p.text || '').join('').trim();
  return out ? { ok: true as const, text: out } : { ok: false as const, status: 502 };
}

// 글 다듬기: 제목 · 따옴표 · 마크다운 · 이모지 빼고, 줄은 최대 빈 줄 하나
export function tidy(s: string, design: boolean) {
  let t = s.replace(/\r/g, '').replace(/^#+\s.*\n+/, '').replace(/\*\*|__|`/g, '').replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();
  t = t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (design) t = t.replace(/\s*\n+\s*/g, ' ');
  return t.slice(0, 1200);
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const origin = req.headers.get('origin') || '';
  const cors: Record<string, string> = { 'access-control-allow-origin': ALLOW.test(origin) ? origin : 'https://todaytale.pages.dev', 'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info', 'access-control-allow-methods': 'POST, OPTIONS', vary: 'origin' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405, cors);
  let b: any; try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400, cors); }
  const topic = String(b?.topic || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (!topic) return json({ error: 'no_topic' }, 400, cors);
  const len = b?.len === 'l' ? 'l' : 's', lang = LANG[b?.lang] ? b.lang : 'ko', design = !!b?.design;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(b?.date || '') ? b.date : undefined;
  const key = deps.env('GEMINI_API_KEY'); if (!key) return json({ error: 'no_key' }, 503, cors);
  const text = prompt({ topic, len, lang, date, design });
  // 11-20 시험: 무료 키에서 3.8 · 3.7 flash는 45초 넘게 답이 안 와요. 3.6 flash 2초 · 3 flash 1초 → 3.6이 1순위 (지금 되는 것 중 가장 좋은 것).
  // 순서: 3.6 flash → 3 flash → 3.1 flash lite → Gemma 4 31B (느려요, 생각 단계 때문에 15~40초). 서버 설정 GEMINI_MODELS로 바꿀 수 있어요 (쉼표로)
  const list = (deps.env('GEMINI_MODELS') || 'gemini-3.6-flash,gemini-3-flash-preview,gemini-3.1-flash-lite,gemma-4-31b-it').split(',').map(x => x.trim()).filter(Boolean);
  const models = list.map(m => ({ m, ms: m.startsWith('gemma') ? 40000 : 10000 }));
  let last = 0;
  for (const { m, ms } of models) {
    try {
      const r = await call(deps, m, key, text, len, ms);
      if (r.ok) return json({ text: tidy(r.text, design), model: m }, 200, cors);
      last = r.status;
      if (r.status === 401 || r.status === 403) break;   // 키 문제는 다음 모델도 같아요
    } catch (e) { console.log('ai-write', m, 'error', String((e as Error)?.name || e)); last = 502; }
  }
  return json({ error: last === 429 ? 'busy' : 'upstream', status: last }, last === 429 ? 429 : 502, cors);
}
const json = (b: unknown, status: number, h: Record<string, string>) => new Response(JSON.stringify(b), { status, headers: { ...h, 'content-type': 'application/json', 'cache-control': 'no-store' } });

// @ts-ignore Deno 실행 때만
if (typeof Deno !== 'undefined') Deno.serve(req => handle(req, { fetch, env: k => Deno.env.get(k) }));
