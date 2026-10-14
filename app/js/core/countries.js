/* 나라 표: 나라마다 다른 것을 한곳에 모아요 (나라가 늘어도 여기 한 줄만 더하면 돼요). docs/content-packs.md 참고.
   lang     기본 언어 (기기 언어가 앱에 없는 언어일 때 이 언어가 앱에 있으면 써요)
   temp     기온 단위 'F' | 'C' (기기 언어 설정의 지역 기준, 덥다·춥다 판단은 늘 섭씨)
   climate  'north' 북반구 계절 · 'south' 남반구(계절이 반대) · 'tropical' 열대(봄·여름·가을·겨울 말을 쓰지 않아요)
   city     도시를 시간대로 못 찾을 때 쓰는 기본 날씨 도시 (data/cities.js 의 도시 id)
   week     한 주의 첫 요일 0 일요일 · 1 월요일 (설정을 바꾸지 않은 새 사용자의 기본값)
   명절은 아직 나라별 목록이 없어요: 서버 이야기 문장(phrase_packs, 날짜 범위 조건)으로 언어별로 넣어요. */
import { seasonOf } from './utils.js';

const C = (lang, temp, climate, city, week) => ({ lang, temp, climate, city, week });
const COUNTRIES = {
  KR: C('ko', 'C', 'north', 'seoul', 0),
  US: C('en', 'F', 'north', 'newyork', 0),
  JP: C('ja', 'C', 'north', 'tokyo', 0),
  ES: C('es', 'C', 'north', 'madrid', 1),
  FR: C('fr', 'C', 'north', 'paris', 1),
  GB: C('en', 'C', 'north', 'london', 1),
  CA: C('en', 'C', 'north', 'toronto', 0),
  AU: C('en', 'C', 'south', 'sydney', 1),
  MX: C('es', 'C', 'north', 'mexicocity', 0),
  BR: C('pt', 'C', 'south', 'saopaulo', 0),
  DE: C('de', 'C', 'north', 'berlin', 1),
  TR: C('tr', 'C', 'north', 'istanbul', 1),
  ID: C('id', 'C', 'tropical', 'jakarta', 0),
  TH: C('th', 'C', 'tropical', 'bangkok', 0),
  IN: C('hi', 'C', 'north', 'delhi', 0),
  // 그 밖에 자주 오는 나라
  CN: C('zh', 'C', 'north', 'beijing', 1), TW: C('zh', 'C', 'north', 'taipei', 0), HK: C('zh', 'C', 'north', 'hongkong', 0),
  SG: C('en', 'C', 'tropical', 'singapore', 0), MY: C('ms', 'C', 'tropical', 'kualalumpur', 1), PH: C('en', 'C', 'tropical', 'manila', 0), VN: C('vi', 'C', 'tropical', 'hanoi', 1),
  IT: C('it', 'C', 'north', 'rome', 1), PT: C('pt', 'C', 'north', 'lisbon', 0), NL: C('nl', 'C', 'north', 'amsterdam', 1), BE: C('fr', 'C', 'north', 'brussels', 1),
  CH: C('de', 'C', 'north', 'zurich', 1), AT: C('de', 'C', 'north', 'vienna', 1), IE: C('en', 'C', 'north', 'dublin', 1),
  AR: C('es', 'C', 'south', 'buenosaires', 1), CL: C('es', 'C', 'south', 'santiago', 1), CO: C('es', 'C', 'tropical', 'bogota', 0), PE: C('es', 'C', 'south', 'lima', 0),
  NZ: C('en', 'C', 'south', 'auckland', 1), ZA: C('en', 'C', 'south', 'johannesburg', 0),
  // 화씨를 쓰는 미국령·그 밖 지역 (도시 목록에 없는 곳은 city 비움)
  PR: C('es', 'F', 'tropical', null, 0), GU: C('en', 'F', 'tropical', null, 0), VI: C('en', 'F', 'tropical', null, 0), AS: C('en', 'F', 'tropical', null, 0),
  MP: C('en', 'F', 'tropical', null, 0), UM: C('en', 'F', 'tropical', null, 0), LR: C('en', 'F', 'tropical', null, 1), BS: C('en', 'F', 'tropical', null, 0),
  KY: C('en', 'F', 'tropical', null, 1), PW: C('en', 'F', 'tropical', null, 0), FM: C('en', 'F', 'tropical', null, 0), MH: C('en', 'F', 'tropical', null, 0)
};
const row = cc => COUNTRIES[String(cc || '').toUpperCase()] || null;

/* 기기 언어 설정의 지역 ("en-US" → US, "ko" → KR로 짐작) */
const localeRegion = (tag = globalThis.navigator?.language || 'en') => {
  try { return new Intl.Locale(tag).maximize().region || null; } catch { return (String(tag).split('-')[1] || '').toUpperCase() || null; }
};
const tempUnit = (cc = localeRegion()) => row(cc)?.temp || 'C';
const defaultLang = (cc = localeRegion()) => row(cc)?.lang || null;
const defaultCity = cc => row(cc)?.city || null;
const firstWeekday = (cc = localeRegion()) => row(cc)?.week ?? 0;
/* 계절 기준: 나라 표 → (표에 없으면) 도시 위도 → 북반구 */
const climateOf = (cc, lat) => row(cc)?.climate || (lat == null ? 'north' : Math.abs(lat) < 23.44 ? 'tropical' : lat < 0 ? 'south' : 'north');
/* 오늘의 계절. 열대는 null (계절 문장·계절 문학 줄이 나오지 않아요) */
const seasonFor = (d = new Date(), { cc = localeRegion(), lat = null } = {}) => {
  const k = climateOf(cc, lat); return k === 'tropical' ? null : seasonOf(d, k === 'south');
};

export { COUNTRIES, climateOf, defaultCity, defaultLang, firstWeekday, localeRegion, seasonFor, tempUnit };
