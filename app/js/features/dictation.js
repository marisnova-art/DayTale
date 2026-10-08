/* 말로 입력: 브라우저 음성 인식(무료)으로 글자만 받아요. 소리는 저장하지 않아요. */
import { S } from '../data/store.js';
import { locale } from '../core/i18n.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const supported = () => !!SR && S.prefs.dictation !== false;
let active = null;
/* onText(최종 글자), onState(true|false) */
function listen({ onText, onPartial, onState }) {
  if (active) { active.stop(); return; }
  const r = new SR(); r.lang = locale(); r.interimResults = true; r.continuous = false;
  r.onresult = e => { let fin = '', part = ''; for (const res of e.results) (res.isFinal ? (fin += res[0].transcript) : (part += res[0].transcript)); if (part) onPartial?.(part); if (fin) onText(fin); };
  r.onend = () => { active = null; onState?.(false); };
  r.onerror = () => { active = null; onState?.(false); };
  active = r; onState?.(true); r.start();
}

export { listen, supported };
