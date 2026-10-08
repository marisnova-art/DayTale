/* 폴더 만들기·이름 바꾸기·지우기 */
import { S, addFolder, deleteFolder, saveFolder } from '../data/store.js';
import { t } from '../core/i18n.js';
import { confirmDlg, promptDlg } from '../ui/feedback.js';
import { go } from '../ui/router.js';

async function newFolderDialog() {
  const name = await promptDlg(t('folder.new'), { placeholder: t('folder.name'), maxlength: 40 });
  if (!name) return null;
  const f = await addFolder(name); if (f) go('/folder/' + f.id); return f;
}
async function renameFolder(id) {
  const f = S.folders.get(id); if (!f) return;
  const name = await promptDlg(t('folder.rename'), { value: f.name, maxlength: 40 }); if (!name || name === f.name) return;
  await saveFolder({ ...f, name });
}
async function removeFolder(id) {
  if (!await confirmDlg(t('folder.deleteQ'), t('folder.deleteBody'), t('folder.delete'), { danger: true })) return;
  await deleteFolder(id); go('/all');
}

export { newFolderDialog, removeFolder, renameFolder };
