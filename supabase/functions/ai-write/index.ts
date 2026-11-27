// AI 글쓰기 (11-20, 11-27; v6 146차 = AI 시트 v:2): 키워드 · 주제 + 제목 문장 / 2줄 문장 / 5줄 문장 → 오늘 하루 일기처럼 쓴 글.
// 앱 → 이 함수 → Gemini API. 키는 서버 설정(Secrets)의 GEMINI_API_KEY 에만 있어요 (앱 · 코드 · 대화에 없음).
// 모델: GEMINI_MODELS 순서대로 (아래 handle 참고). 한도가 차거나 늦으면 다음 모델로. 모두 같은 키.
// 나중에 Claude 등으로 바꿀 때는 이 파일의 call() 한 곳만 바꿔요.
// ⚠️ 무료 키는 구글이 입력 글을 서비스 개선에 쓸 수 있어요 → 시험용. 출시 전에 유료 키 또는 Claude로 (런치 체크리스트)
// 하루 횟수 제한 · 유료 사용자만은 결제를 붙일 때 서버 표와 같이 넣어요 (지금은 시험 중이라 모두 열림)

type Deps = { fetch: typeof fetch; env: (k: string) => string | undefined };

const LANG: Record<string, string> = { ko: '한국어', en: 'English', ja: '日本語', es: 'Español', fr: 'Français' };
const ALLOW = /^https:\/\/([a-z0-9-]+\.)?(todaytale|daytale)\.pages\.dev$|^http:\/\/localhost(:\d+)?$/;

// 길이 (11-27 앤드류): t = 제목 문장(3단어 이하) · 2 = 2줄 문장 · 5 = 5줄 문장 (기본 글씨 크기 기준). 예전 앱의 s/l은 2/5로
export type Len = 't' | '2' | '5';
export const lenOf = (v: unknown): Len => v === 't' ? 't' : v === '5' || v === 'l' ? '5' : '2';
// 식상하지 않게 (11-27 앤드류: "글자들이 너무 식상하다"): 흔한 표현 금지 · 구체적 장면 + 예상 밖 디테일 · 정리/교훈 끝맺음 금지 · 말투를 부를 때마다 무작위
const BAN: Record<string, string> = {
  ko: '소소한, 따스한 햇살, 따뜻한 햇살, 하루를 마무리, 감사한 하루, 행복한 하루, 새삼, 문득 깨달았다, 오늘도 수고, 힐링, 여유를 즐기, 소중함, 작은 행복, 일상의 행복, 마음이 따뜻해',
  en: 'simple joys, little things, grateful, cozy, a reminder that, warm sunlight, wrapping up the day, cherish, blessed, self-care, peaceful moment',
  ja: 'ささやかな幸せ, 暖かい日差し, 一日を締めくくる, 感謝, 癒し, 小さな幸せ, 改めて',
  es: 'pequeñas cosas, agradecido, acogedor, cálido sol, terminar el día, valorar',
  fr: 'petits bonheurs, reconnaissant, cosy, doux soleil, finir la journée, savourer',
};
const STYLES = [
  '관찰: 눈앞의 사물 하나를 카메라로 아주 가까이 찍듯 묘사해요.',
  '혼잣말: 나에게 툭 던지는 혼잣말 말투로 써요.',
  '대화 한 줄: 누군가 한 말 한마디를 따옴표 없이 옮기고 그 순간의 장면을 써요.',
  '시처럼: 짧게 끊어지는 문장들로, 명사로 끝나는 문장도 괜찮아요.',
  '메모: 메모장에 적듯 건조하고 짧게, 감정 낱말 없이 사실만으로 기분이 느껴지게 써요.',
  '엉뚱하게: 사소한 일을 아주 진지하게, 살짝 유머 있게 써요.',
];
export function prompt(o: { topic: string; len: Len; lang: string; date?: string; design?: boolean; style?: number }) {
  const lang = LANG[o.lang] || LANG.ko, cjk = o.lang === 'ko' || o.lang === 'ja', st = STYLES[(o.style ?? Math.floor(Math.random() * STYLES.length)) % STYLES.length];
  const ban = BAN[o.lang] || BAN.en;
  if (o.len === 't') return [
    `아래 키워드 · 주제로 오늘 하루 카드에 크게 올릴 제목 한 줄을 ${lang}로 써 줘.`,
    `- ${cjk ? '3어절 이하, 12자 이하' : 'at most 3 words'}. 마침표 · 따옴표 · 이모지 · 해시태그 없이 제목만.`,
    '- 광고 카피나 책 제목처럼 짧고 낯설게. 키워드를 그대로 되풀이하지 말고 살짝 비틀어요. 뻔한 말("행복한 하루" 같은)은 쓰지 않아요.',
    `- 쓰지 않을 표현: ${ban}`,
    '- 종교 · 정치 · 술은 넣지 않아요.',
    `키워드 · 주제: ${o.topic}`,
  ].join('\n');
  const size = o.len === '5' ? (cjk ? '70~90자 (카드에서 5줄쯤), 3~5문장' : '22-34 words (about 5 lines on the card)') : (cjk ? '24~34자 (카드에서 2줄쯤), 1~2문장' : '8-14 words (about 2 lines on the card)');
  return [
    `너는 사용자를 대신해 오늘 하루 일기를 써 주는 도우미야. 아래 키워드 · 주제로 사용자 자신이 쓴 것처럼 ${lang}로 써 줘.`,
    `- 길이: ${size}. 넘기지 마.`,
    `- 말투: ${st}`,
    '- 1인칭(나). 키워드를 구체적인 장면 · 사물 · 소리 · 냄새 하나로 바꾸고, 남들이 잘 쓰지 않는 예상 밖의 디테일을 꼭 하나 넣어요.',
    '- 끝에 정리 · 교훈 · 감상 요약을 붙이지 말고 장면 안에서 툭 끝내요.',
    `- 쓰지 않을 상투적 표현: ${ban}`,
    '- 명언 · 이모지 · 해시태그 · 제목 · 따옴표 없이 본문만. 종교 · 정치 · 술 이야기는 넣지 않아요.',
    '- 줄바꿈 없이 한 덩어리로.',
    o.date ? `- 계절 참고용 날짜: ${o.date} (날짜 · 요일은 글에 쓰지 않아요, 카드에 따로 있어요)` : '',
    `키워드 · 주제: ${o.topic}`,
  ].filter(Boolean).join('\n');
}

// ── 146차 (11-27 앤드류): AI 시트. 내용글 [없음/1~5줄] · 제목글 [없음/키워드/1줄/2줄] · 감성 · 주제 칩 · 추가 입력.
// 둘 다 고르면 내용글을 먼저 쓰고 그 글에서 제목글을 뽑아요 (한 번 부르기). 내용글 없음 + 이미 쓴 내용글이 있으면 그 글에서 제목글 (줄이기 · 키워드).
// prev = 앞서 만든 결과들 → '다시 생성'은 늘 다르게.
export type Head = '' | 'kw' | '1' | '2';
export type V2 = { body: number; head: Head; mood: string; topic: string; extra: string; src: string; prev: string[]; lang: string; date?: string };
export const headOf = (v: unknown): Head => v === 'kw' || v === '1' || v === '2' ? v : '';
export function prompt2(o: V2 & { style?: number }) {
  const lang = LANG[o.lang] || LANG.ko, cjk = o.lang === 'ko' || o.lang === 'ja', st = STYLES[(o.style ?? Math.floor(Math.random() * STYLES.length)) % STYLES.length];
  const ban = BAN[o.lang] || BAN.en;
  const about = [o.mood && `감성: ${o.mood}`, o.topic && `주제: ${o.topic}`, o.extra && `사용자가 적은 말(꼭 반영): ${o.extra}`].filter(Boolean).join(' / ') || '정한 주제 없음 → 날짜의 계절감이 나는 평범한 하루의 한 장면';
  const n = o.body, perLine = cjk ? [14, 18] : [5, 7];
  const headRule = o.head === 'kw' ? (cjk ? '키워드 1~2개, 8자 이하' : '1-2 keywords, at most 3 words')
    : o.head === '2' ? (cjk ? '짧은 두 줄 (줄마다 12자 이하, 줄바꿈 한 번)' : 'two short lines (each at most 5 words, one line break)')
    : (cjk ? '한 줄, 3어절 이하 12자 이하' : 'one line, at most 4 words');
  const L: string[] = [`너는 사용자를 대신해 오늘 하루 카드 글을 써 주는 도우미야. 사용자 자신이 쓴 것처럼 ${lang}로 써 줘.`];
  if (n > 0) L.push(`[내용글] 카드 아래에 붙는 글. 길이: 약 ${n}줄 (${cjk ? `${n * perLine[0]}~${n * perLine[1]}자` : `${n * perLine[0]}-${n * perLine[1]} words`}). 넘기지 마.`,
    `- 말투: ${st}`,
    '- 1인칭(나). 구체적인 장면 · 사물 · 소리 · 냄새 하나로, 남들이 잘 쓰지 않는 예상 밖의 디테일을 꼭 하나 넣어요.',
    '- 끝에 정리 · 교훈 · 감상 요약을 붙이지 말고 장면 안에서 툭 끝내요. 줄바꿈 없이 한 덩어리로.');
  if (o.head) L.push(`[제목글] 카드 위에 크게 올라가는 글: ${headRule}.`,
    n > 0 ? '- 위 내용글의 핵심을 짧게, 광고 카피나 책 제목처럼 살짝 낯설게. 내용글 문장을 그대로 베끼지 않아요.'
      : o.src ? `- 아래 사용자가 쓴 글의 핵심을 짧게 줄여요 (${o.head === 'kw' ? '핵심 낱말' : '광고 카피나 책 제목처럼'}). 글: ${o.src}`
      : '- 광고 카피나 책 제목처럼 짧고 살짝 낯설게.',
    '- 마침표 · 따옴표 · 이모지 · 해시태그 없이.');
  L.push(`- 쓰지 않을 상투적 표현: ${ban}`, '- 명언 · 이모지 · 해시태그 · 따옴표 없이. 종교 · 정치 · 술 이야기는 넣지 않아요.');
  if (o.date) L.push(`- 계절 참고용 날짜: ${o.date} (날짜 · 요일은 글에 쓰지 않아요)`);
  if (o.prev.length) L.push(`- 앞서 만든 결과와 소재 · 첫 낱말 · 말투가 겹치지 않게 아주 다르게 써요. 앞선 결과: ${o.prev.map(x => `「${x}」`).join(' ')}`);
  L.push(`쓸 거리: ${about}`);
  L.push('답은 아래 모양 그대로, 다른 말 없이:', ...(n > 0 ? ['<<BODY>>', '(내용글)'] : []), ...(o.head ? ['<<HEAD>>', '(제목글)'] : []));
  return L.join('\n');
}
export function parse2(raw: string, o: { body: number; head: Head }) {
  const s = raw.replace(/\r/g, '');
  const pick = (tag: string) => { const m = s.match(new RegExp(`<<${tag}>>\\s*([\\s\\S]*?)(?=<<[A-Z]+>>|$)`)); return m ? m[1].trim() : ''; };
  let body = o.body > 0 ? pick('BODY') : '', head = o.head ? pick('HEAD') : '';
  if (o.body > 0 && !body && !o.head) body = s.trim();
  if (o.head && !head && !o.body) head = s.trim();
  body = body ? tidy(body, false, '2') : '';
  if (head) {
    head = head.replace(/\*\*|__|`/g, '').replace(/^["'“”‘’「」]+|["'“”‘’「」]+$/gm, '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
    const lines = head.split(/\n+/).map(x => x.trim().replace(/[.。!！]+$/, '')).filter(Boolean);
    head = (o.head === '2' ? lines.slice(0, 2).join('\n') : lines.join(' ')).slice(0, 40);
  }
  return { body, head };
}

async function call(deps: Deps, model: string, key: string, text: string, len: Len, ms: number) {
  const r = await deps.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text }] }], generationConfig: { temperature: 1.05, maxOutputTokens: model.startsWith('gemma') ? 4096 : len === 't' ? 256 : 1024,
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
export function tidy(s: string, design: boolean, len: Len = '2') {
  let t = s.replace(/\r/g, '').replace(/^#+\s.*\n+/, '').replace(/\*\*|__|`/g, '').replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();
  t = t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  t = t.replace(/\s*\n+\s*/g, ' ');   // 11-27: 세 길이 모두 한 덩어리
  if (len === 't') t = t.replace(/[.。!！]+$/, '').slice(0, 40);
  return t.slice(0, 1200);
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const origin = req.headers.get('origin') || '';
  const cors: Record<string, string> = { 'access-control-allow-origin': ALLOW.test(origin) ? origin : 'https://todaytale.pages.dev', 'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info', 'access-control-allow-methods': 'POST, OPTIONS', vary: 'origin' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405, cors);
  let b: any; try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400, cors); }
  const one = (v: unknown, n: number) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n);
  if (b?.v === 2) {   // 146차 AI 시트
    const o: V2 = { body: Math.max(0, Math.min(5, Math.floor(+b.body || 0))), head: headOf(b.head), mood: one(b.mood, 20), topic: one(b.topic, 20), extra: one(b.extra, 80), src: one(b.src, 400),
      prev: (Array.isArray(b.prev) ? b.prev : []).slice(-3).map((x: unknown) => one(x, 200)).filter(Boolean), lang: LANG[b?.lang] ? b.lang : 'ko', date: /^\d{4}-\d{2}-\d{2}$/.test(b?.date || '') ? b.date : undefined };
    if (!o.body && !o.head) return json({ error: 'nothing' }, 400, cors);
    const key = deps.env('GEMINI_API_KEY'); if (!key) return json({ error: 'no_key' }, 503, cors);
    return run(deps, key, prompt2(o), o.body ? '5' : 't', cors, t => { const r = parse2(t, o); return (o.body && !r.body) || (o.head && !r.head) ? null : r; });
  }
  const topic = one(b?.topic, 80);
  if (!topic) return json({ error: 'no_topic' }, 400, cors);
  const len = lenOf(b?.len), lang = LANG[b?.lang] ? b.lang : 'ko', design = !!b?.design;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(b?.date || '') ? b.date : undefined;
  const key = deps.env('GEMINI_API_KEY'); if (!key) return json({ error: 'no_key' }, 503, cors);
  const text = prompt({ topic, len, lang, date, design });
  return run(deps, key, text, len, cors, t => ({ text: tidy(t, design, len) }));
}

async function run(deps: Deps, key: string, text: string, len: Len, cors: Record<string, string>, done: (t: string) => Record<string, unknown> | null) {
  // 11-20 시험: 무료 키에서 3.8 · 3.7 flash는 45초 넘게 답이 안 와요. 3.6 flash 2초 · 3 flash 1초 → 3.6이 1순위 (지금 되는 것 중 가장 좋은 것).
  // 순서: 3.6 flash → 3 flash → 3.1 flash lite → Gemma 4 31B (느려요, 생각 단계 때문에 15~40초). 서버 설정 GEMINI_MODELS로 바꿀 수 있어요 (쉼표로)
  // 149차 (11-27): 3.6 flash가 계속 10초 넘게 답이 없어서(매번 12초) 3 flash를 1순위로, 기다림 6초
  const list = (deps.env('GEMINI_MODELS') || 'gemini-3-flash-preview,gemini-3.6-flash,gemini-3.1-flash-lite,gemma-4-31b-it').split(',').map(x => x.trim()).filter(Boolean);
  const models = list.map(m => ({ m, ms: m.startsWith('gemma') ? 40000 : 6000 }));
  let last = 0;
  for (const { m, ms } of models) {
    try {
      const r = await call(deps, m, key, text, len, ms);
      if (r.ok) { const out = done(r.text); if (out) return json({ ...out, model: m }, 200, cors); last = 502; continue; }
      last = r.status;
      if (r.status === 401 || r.status === 403) break;   // 키 문제는 다음 모델도 같아요
    } catch (e) { console.log('ai-write', m, 'error', String((e as Error)?.name || e)); last = 502; }
  }
  return json({ error: last === 429 ? 'busy' : 'upstream', status: last }, last === 429 ? 429 : 502, cors);
}
const json = (b: unknown, status: number, h: Record<string, string>) => new Response(JSON.stringify(b), { status, headers: { ...h, 'content-type': 'application/json', 'cache-control': 'no-store' } });

// @ts-ignore Deno 실행 때만
if (typeof Deno !== 'undefined') Deno.serve(req => handle(req, { fetch, env: k => Deno.env.get(k) }));
