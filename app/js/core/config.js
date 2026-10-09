/* 실행 설정(config.js), 한도, 버전 */
const CFG = Object.assign({ BRAND: { name: 'Daytale', nameKo: '데이테일', tagline: '' }, SUPABASE_URL: '', SUPABASE_ANON_KEY: '', CONTACT: '', SITE_URL: '', PHOTOS_URL: '', PADDLE: {} }, window.APP_CONFIG || {});
/* 서버(schema.sql)와 같은 값 */
const LIMITS = { entries: 50000, entryChars: 200000, titleChars: 300, folders: 50, tags: 20, tagLen: 40, photosPerEntry: 4, trialPhotos: 100, paidBytes: 1024 ** 3, trashDays: 30 };
const APP_VERSION = '1.0.0-dev.15';
const LANGS = ['ko', 'en', 'ja', 'es', 'fr'];
const brand = lang => lang === 'ko' ? CFG.BRAND.nameKo || CFG.BRAND.name : CFG.BRAND.name;

export { APP_VERSION, CFG, LANGS, LIMITS, brand };
