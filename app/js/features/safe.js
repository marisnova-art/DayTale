/* 신뢰 표시: 지금 저장 상태 한 줄 (메뉴 프로필 아래 · 설정 › 데이터) */
import { t } from '../core/i18n.js';
import { S } from '../data/store.js';

function saveState() {
  const n = [...S.entries.values()].filter(e => e._dirty).length;
  if (S.sync === 'syncing') return { ic: 'refresh-cw', text: t('safe.saving') };
  if (!navigator.onLine || S.sync === 'offline' || (S.sync === 'pending' && n)) return { ic: 'cloud-off', text: n ? t('safe.localN', { n }) : t('safe.local'), off: true };
  if (S.sync === 'error') return { ic: 'circle-alert', text: t('safe.late'), bad: true };
  return { ic: 'cloud-check', text: t('safe.saved') };
}
export { saveState };
