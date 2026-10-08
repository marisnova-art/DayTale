// 날씨: MET Norway Locationforecast (무료, 출처 표시 필요: "Weather data from MET Norway").
// 앱 → 이 함수 → (0.1도 칸마다 캐시) → api.met.no. 로그인한 사용자만 부를 수 있어요 (verify_jwt 기본값).
// 환경 변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (Supabase가 자동으로 넣어 줌), WEATHER_CONTACT (MET 요청 규칙: 연락처가 든 User-Agent)

type Deps = { fetch: typeof fetch; env: (k: string) => string | undefined; now?: () => number };

export function kindOf(symbol: string): string {
  const s = symbol || '';
  if (s.includes('thunder')) return 'thunder';
  if (s.includes('snow') || s.includes('sleet')) return 'snow';
  if (s.includes('rain')) return 'rain';
  if (s.startsWith('fog')) return 'fog';
  if (s.startsWith('cloudy')) return 'cloud';
  if (s.startsWith('partlycloudy')) return 'suncloud';
  return 'sun';   // clearsky, fair
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const origin = req.headers.get('origin') || '*';
  const cors = { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info', 'vary': 'origin' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get('lat')), lon = Number(u.searchParams.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return json({ error: 'bad_location' }, 400, cors);
  // 0.1도 칸 (약 11km): 위치를 정확히 남기지 않고, 같은 동네는 캐시를 나눠 써요
  const clat = Math.round(lat * 10) / 10, clon = Math.round(lon * 10) / 10, cell = `${clat.toFixed(1)},${clon.toFixed(1)}`;
  const base = deps.env('SUPABASE_URL'), key = deps.env('SUPABASE_SERVICE_ROLE_KEY');
  const now = deps.now ? deps.now() : Date.now();
  const sbh = { apikey: key!, authorization: `Bearer ${key}`, 'content-type': 'application/json' };
  try {
    const c = await deps.fetch(`${base}/rest/v1/weather_cache?cell=eq.${encodeURIComponent(cell)}&select=data,expires_at`, { headers: sbh });
    const rows = c.ok ? await c.json() : [];
    if (rows[0] && Date.parse(rows[0].expires_at) > now) return json(rows[0].data, 200, cors);
  } catch { /* 캐시가 안 되면 바로 받아요 */ }
  const ua = `Daytale/1.0 ${deps.env('WEATHER_CONTACT') || 'contact@example.com'}`;
  const r = await deps.fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${clat}&lon=${clon}`, { headers: { 'user-agent': ua, accept: 'application/json' } });
  if (!r.ok) return json({ error: 'upstream', status: r.status }, 502, cors);
  const j = await r.json();
  const ts = j?.properties?.timeseries || [];
  const first = ts.find((x: any) => Date.parse(x.time) >= now - 3600e3) || ts[0];
  if (!first) return json({ error: 'empty' }, 502, cors);
  const symbol = first.data?.next_1_hours?.summary?.symbol_code || first.data?.next_6_hours?.summary?.symbol_code || '';
  const next12 = ts.filter((x: any) => { const t = Date.parse(x.time); return t >= now && t < now + 12 * 3600e3; }).map((x: any) => x.data.instant.details.air_temperature);
  const out = { kind: kindOf(symbol), symbol, night: symbol.endsWith('_night'), temp: Math.round(first.data.instant.details.air_temperature),
    max: next12.length ? Math.round(Math.max(...next12)) : null, min: next12.length ? Math.round(Math.min(...next12)) : null, at: new Date(now).toISOString() };
  // MET은 Expires 헤더를 줘요. 없으면 30분.
  const exp = Date.parse(r.headers.get('expires') || '') || now + 30 * 60e3;
  deps.fetch(`${base}/rest/v1/weather_cache`, { method: 'POST', headers: { ...sbh, prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ cell, data: out, fetched_at: new Date(now).toISOString(), expires_at: new Date(Math.max(exp, now + 15 * 60e3)).toISOString() }) }).catch(() => {});
  return json(out, 200, cors);
}
const json = (b: unknown, status: number, h: Record<string, string>) => new Response(JSON.stringify(b), { status, headers: { ...h, 'content-type': 'application/json', 'cache-control': 'private, max-age=600' } });

// @ts-ignore Deno 실행 때만
if (typeof Deno !== 'undefined') Deno.serve(req => handle(req, { fetch, env: k => Deno.env.get(k) }));
