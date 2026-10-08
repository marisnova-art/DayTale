// 언어별 소개 페이지를 만들어요: app/{en,ko,ja,es,fr}/index.html
// 이름·가격을 바꾸면 이 파일 위쪽만 고치고 다시 실행: node tools/build-site.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'app');
const BRAND = { name: 'Daytale', ko: '데이테일' };          // 임시 이름 (app/config.js와 같이 바꿔요)
const SITE = '';                                             // 배포 주소 (예: https://daytale.app). 비우면 상대 주소
const PRICE = { monthly: 3.99, yearly: 39.9, currency: 'USD' };
const LANGS = { en: 'English', ko: '한국어', ja: '日本語', es: 'Español', fr: 'Français' };
const LOCALE = { en: 'en-US', ko: 'ko-KR', ja: 'ja-JP', es: 'es-ES', fr: 'fr-FR' };

const ICON = {
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/>',
  book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  img: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z"/><path d="m2 2 20 20" opacity="0"/>',
};
const money = (n, l) => new Intl.NumberFormat(LOCALE[l], { style: 'currency', currency: PRICE.currency }).format(n);
const perMonth = l => money(Math.floor(PRICE.yearly / 12 * 100) / 100, l);
const save = Math.round((1 - PRICE.yearly / (PRICE.monthly * 12)) * 100);

/* 문구: 언어마다 표준 높임 문체, 유행어 없음 */
const C = {
  en: {
    title: `${BRAND.name}: your day, as a short story`, desc: 'A gentle, text-first journal. Write one line, and each morning your notes, plans and memories come back as a short story.',
    open: 'Open the app', kicker: 'A text-first journal for everyday life',
    h1: 'Write one line.<br>Your day becomes a story.', lead: 'Notes, to-dos, plans and where you left things. All in one quiet place, told back to you each day as a few warm sentences.',
    start: 'Try free for a month', startSub: 'No card needed. After the trial you can still read and export everything.',
    demo: { when: 'Thursday, October 8', time: '8:20 AM', p: ['Good morning, <b>Sam</b>. In Seattle it is <b>{st:cloud}cloudy <span class="n">14°</span></b>, a calm day.', 'You have <b>{st:event}<span class="n">1</span> event</b> today. Don’t forget <b>Dentist</b> at <span class="n">2 PM</span>.', 'A year ago today, you wrote <b>First autumn walk</b>.'], q: 'Any thought the moment you woke up?', ph: 'Write a line' },
    fEye: 'What it does', fH: 'Built to keep, made to feel good', fSub: 'Solid tools underneath, a calm story on top.',
    f: [['pen', 'One question a day', 'A small question for the morning, afternoon, evening and night. One line is enough.'], ['book', 'Your day as a story', 'Weather, plans, what you kept and a memory from the past, in a few sentences.'], ['pin', 'Where you put things', 'Note where the spare key went. Search finds it in a second.'], ['cal', 'Calendar and to-dos', 'Events and to-dos sit right next to your notes, by week or month.'], ['img', 'Up to 4 photos', 'One cover and three small photos per record, kept light.'], ['cloud', 'Works offline', 'Write without internet. It syncs across phone and computer later.']],
    pEye: 'Your records are yours', pH: 'No ads. No selling your data.', pSub: 'We make money from subscriptions only, so we never need your attention or your data.',
    p: [['No ads, no tracking', 'There are no ad or analytics trackers in the app.'], ['Take it with you anytime', 'Export to JSON, Markdown or PDF, even after your trial.'], ['Private by design', 'Our team cannot browse your records. Admin tools show counts only.'], ['Easy to leave', 'Delete your account in settings and everything goes with it.']],
    prEye: 'Pricing', prH: 'One simple plan', prSub: 'Everything is included during the free month. Then pick the plan that suits you.',
    yearly: 'Yearly', monthly: 'Monthly', best: `Save ${save}%`, perYear: '/ year', perMo: '/ month', about: m => `About ${m} a month`, cancel: 'Cancel anytime',
    fine: 'Prices are in US dollars. At checkout you see the tax-inclusive price for your country. Payments are handled by Paddle, our reseller.',
    qH: 'Questions', q: [['What happens when the trial ends?', 'Writing and editing pause until you subscribe. Reading, search, export and deletion always keep working.'], ['Do I need to install anything?', 'No. It runs in your browser, and you can add it to your home screen to use it like an app.'], ['Which languages are supported?', 'English, Korean, Japanese, Spanish and French. It follows your device language.'], ['What if I stop using it?', 'Unsubscribed accounts are removed one year after the last sign-in. We email you 30 and 7 days before, and you can export at any time.']],
    final: 'Start with one line today.', terms: 'Terms', privacy: 'Privacy', contact: 'Contact', weather: 'Weather data from MET Norway'
  },
  ko: {
    title: `${BRAND.ko}: 하루가 이야기가 되는 곳`, desc: '한 줄만 적으면, 메모와 일정과 지난 기억이 매일 짧은 이야기로 돌아와요. 글 중심의 차분한 기록 앱.',
    open: '앱 열기', kicker: '일상을 글로 남기는 기록 앱',
    h1: '한 줄만 적어 두세요.<br>하루가 이야기가 돼요.', lead: '메모, 할 일, 일정, 물건 둔 곳까지 한곳에 모아요. 그리고 매일 몇 문장의 따뜻한 이야기로 다시 들려줘요.',
    start: '한 달 무료로 시작하기', startSub: '카드 없이 시작해요. 체험이 끝나도 기록은 언제든 읽고 내보낼 수 있어요.',
    demo: { when: '10월 8일 목요일', time: '오전 8:20', p: ['아침이 밝았어요, <b>바다별</b> 님. 서울은 <b>{st:cloud}흐리고 <span class="n">14°</span></b>, 차분한 날이에요.', '오늘은 <b>{st:event}일정 <span class="n">1</span>개</b>가 있어요. <span class="n">오후 2시</span> <b>치과 예약</b>을 잊지 마세요.', '1년 전 오늘은 <b>가을 첫 산책</b>을 적었어요.'], q: '눈뜨자마자 떠오른 생각이 있나요?', ph: '한 줄로 적어 두세요' },
    fEye: '할 수 있는 일', fH: '기능은 단단하게, 경험은 감성적으로', fSub: '아래는 튼튼한 도구, 위는 차분한 이야기예요.',
    f: [['pen', '하루 한 질문', '아침, 오후, 저녁, 밤마다 작은 질문을 건네요. 한 줄이면 충분해요.'], ['book', '이야기가 되는 하루', '날씨, 일정, 쌓아 온 기록, 지난 추억을 몇 문장으로 들려줘요.'], ['pin', '물건 둔 곳', '여분 열쇠를 어디 뒀는지 적어 두면, 찾기에서 바로 나와요.'], ['cal', '캘린더와 할 일', '일정과 할 일이 기록 바로 옆에 있어요. 주간과 월간으로 봐요.'], ['img', '사진은 4장까지', '기록마다 표지 1장과 작은 사진 3장. 가볍게 보관해요.'], ['cloud', '인터넷 없이도', '인터넷이 없어도 적을 수 있어요. 나중에 휴대폰과 컴퓨터가 맞춰져요.']],
    pEye: '기록은 내 것', pH: '광고도, 데이터 판매도 없어요.', pSub: '구독료로만 운영해요. 그래서 사용자의 시간이나 데이터가 필요하지 않아요.',
    p: [['광고·추적 없음', '앱에는 광고나 분석용 추적 도구가 없어요.'], ['언제든 가져가기', 'JSON, Markdown, PDF로 내보낼 수 있어요. 체험이 끝나도요.'], ['처음부터 비공개', '운영팀도 기록을 열어 볼 수 없어요. 관리 화면엔 개수만 보여요.'], ['떠나기도 쉽게', '설정에서 계정을 지우면 모든 기록이 함께 지워져요.']],
    prEye: '가격', prH: '하나의 간단한 구독', prSub: '무료 한 달 동안 모든 기능을 써 보세요. 그다음 맞는 방식을 고르면 돼요.',
    yearly: '연간', monthly: '월간', best: `${save}% 절약`, perYear: '/ 년', perMo: '/ 월', about: m => `한 달에 약 ${m}`, cancel: '언제든 해지',
    fine: '가격은 미국 달러 기준이에요. 결제할 때 나라에 맞는 세금 포함 가격이 표시돼요. 결제는 판매 대행사 Paddle이 처리해요.',
    qH: '자주 묻는 질문', q: [['무료 체험이 끝나면 어떻게 되나요?', '구독하기 전까지 새로 쓰기와 고치기가 멈춰요. 읽기, 찾기, 내보내기, 삭제는 언제나 돼요.'], ['설치해야 하나요?', '아니요. 브라우저에서 바로 쓰고, 홈 화면에 추가하면 앱처럼 열려요.'], ['어떤 언어를 지원하나요?', '한국어, 영어, 일본어, 스페인어, 프랑스어예요. 기기 언어를 따라가요.'], ['그만 쓰게 되면요?', '구독하지 않는 계정은 마지막 로그인 1년 뒤에 정리돼요. 30일 전과 7일 전에 메일로 알려 드리고, 내보내기는 언제든 할 수 있어요.']],
    final: '오늘, 한 줄로 시작해 보세요.', terms: '이용약관', privacy: '개인정보 처리방침', contact: '문의', weather: '날씨 정보: MET Norway'
  },
  ja: {
    title: `${BRAND.name}：一日が小さな物語になる`, desc: '一行書くだけで、メモや予定、過去の記録が毎日短い物語になって戻ってきます。文章中心の落ち着いた記録アプリです。',
    open: 'アプリを開く', kicker: '毎日を文章で残す記録アプリ',
    h1: '一行だけ書いてください。<br>一日が物語になります。', lead: 'メモ、ToDo、予定、物を置いた場所まで、ひとつの場所にまとめます。そして毎日、数行のやさしい物語にしてお届けします。',
    start: '1か月無料で始める', startSub: 'カード登録は不要です。体験期間が終わっても、記録はいつでも読んだり書き出したりできます。',
    demo: { when: '10月8日 木曜日', time: '8:20', p: ['おはようございます、<b>さくら</b>さん。東京は<b>{st:cloud}くもり <span class="n">17°</span></b>、穏やかな一日です。', '今日は<b>{st:event}予定が<span class="n">1</span>件</b>あります。<span class="n">14:00</span>の<b>歯医者</b>をお忘れなく。', '1年前の今日は<b>秋のはじめての散歩</b>について書いていました。'], q: '目覚めてすぐ浮かんだことはありますか？', ph: '一行で書いてみましょう' },
    fEye: 'できること', fH: '機能はしっかり、体験はやさしく', fSub: '土台には確かな道具を、表面には落ち着いた物語を。',
    f: [['pen', '一日ひとつの問いかけ', '朝・昼・夕方・夜に小さな問いかけをします。一行で十分です。'], ['book', '物語になる一日', '天気、予定、積み重ねた記録、過去の思い出を数行でお伝えします。'], ['pin', '物を置いた場所', '合鍵の場所を書いておけば、検索ですぐに見つかります。'], ['cal', 'カレンダーとToDo', '予定とToDoが記録のすぐ隣に。週表示と月表示があります。'], ['img', '写真は4枚まで', '記録ごとに表紙1枚と小さな写真3枚。軽く保存します。'], ['cloud', 'オフラインでも', 'インターネットがなくても書けます。あとでスマホとパソコンが同期されます。']],
    pEye: '記録はあなたのもの', pH: '広告も、データの販売もありません。', pSub: '収益はサブスクリプションのみです。そのため、利用者の時間やデータを必要としません。',
    p: [['広告・追跡なし', 'アプリには広告や分析用のトラッカーがありません。'], ['いつでも持ち出せる', 'JSON、Markdown、PDFで書き出せます。体験期間が終わった後も。'], ['はじめから非公開', '運営チームも記録を閲覧できません。管理画面には件数だけが表示されます。'], ['やめるのも簡単', '設定からアカウントを削除すると、すべての記録も一緒に削除されます。']],
    prEye: '料金', prH: 'シンプルなひとつのプラン', prSub: '無料の1か月間はすべての機能を使えます。その後、合うプランをお選びください。',
    yearly: '年額', monthly: '月額', best: `${save}%お得`, perYear: '/ 年', perMo: '/ 月', about: m => `月あたり約${m}`, cancel: 'いつでも解約できます',
    fine: '価格は米ドル表示です。お支払い時に、お住まいの国の税込価格が表示されます。決済は販売代理店のPaddleが行います。',
    qH: 'よくある質問', q: [['無料体験が終わるとどうなりますか？', '購読するまで新規作成と編集が止まります。閲覧、検索、書き出し、削除はいつでもできます。'], ['インストールは必要ですか？', 'いいえ。ブラウザですぐに使え、ホーム画面に追加するとアプリのように開きます。'], ['対応言語は？', '日本語、英語、韓国語、スペイン語、フランス語です。端末の言語設定に合わせます。'], ['使わなくなったら？', '購読していないアカウントは、最後のログインから1年後に削除されます。30日前と7日前にメールでお知らせし、書き出しはいつでもできます。']],
    final: '今日、一行から始めてみませんか。', terms: '利用規約', privacy: 'プライバシーポリシー', contact: 'お問い合わせ', weather: '天気データ：MET Norway'
  },
  es: {
    title: `${BRAND.name}: su día, contado como una breve historia`, desc: 'Un diario sencillo centrado en el texto. Escriba una línea y cada día sus notas, planes y recuerdos vuelven como una breve historia.',
    open: 'Abrir la app', kicker: 'Un diario de texto para el día a día',
    h1: 'Escriba una línea.<br>Su día se convierte en una historia.', lead: 'Notas, tareas, planes y el lugar donde dejó las cosas, todo en un lugar tranquilo. Cada día se lo contamos en unas pocas frases cálidas.',
    start: 'Pruébelo gratis un mes', startSub: 'Sin tarjeta. Al terminar la prueba podrá seguir leyendo y exportando todo.',
    demo: { when: 'jueves, 8 de octubre', time: '8:20', p: ['Buenos días, <b>Lucía</b>. En Madrid está <b>{st:cloud}nublado y hace <span class="n">16°</span></b>, un día tranquilo.', 'Hoy tiene <b>{st:event}<span class="n">1</span> evento</b>. No olvide <b>Dentista</b> a las <span class="n">14:00</span>.', 'Hace un año, tal día como hoy, escribió <b>Primer paseo de otoño</b>.'], q: '¿Qué fue lo primero que pensó al despertar?', ph: 'Escriba una línea' },
    fEye: 'Qué hace', fH: 'Sólido por dentro, agradable por fuera', fSub: 'Herramientas fiables debajo y una historia tranquila encima.',
    f: [['pen', 'Una pregunta al día', 'Una pequeña pregunta por la mañana, la tarde, el atardecer y la noche. Basta con una línea.'], ['book', 'Su día como historia', 'El tiempo, los planes, lo que ha guardado y un recuerdo, en pocas frases.'], ['pin', 'Dónde dejó las cosas', 'Anote dónde guardó la llave de repuesto. La búsqueda la encuentra al instante.'], ['cal', 'Calendario y tareas', 'Eventos y tareas junto a sus notas, por semana o por mes.'], ['img', 'Hasta 4 fotos', 'Una portada y tres fotos pequeñas por registro, siempre ligeras.'], ['cloud', 'Funciona sin conexión', 'Escriba sin internet. Después se sincroniza entre el móvil y el ordenador.']],
    pEye: 'Sus registros son suyos', pH: 'Sin anuncios. Sin vender sus datos.', pSub: 'Solo nos financiamos con suscripciones, así que no necesitamos su atención ni sus datos.',
    p: [['Sin anuncios ni rastreo', 'La app no contiene rastreadores de publicidad ni de analítica.'], ['Lléveselo cuando quiera', 'Exporte a JSON, Markdown o PDF, incluso después de la prueba.'], ['Privado desde el principio', 'Nuestro equipo no puede ver sus registros. Las herramientas internas solo muestran cifras.'], ['Fácil de dejar', 'Elimine su cuenta en los ajustes y todo se borrará con ella.']],
    prEye: 'Precios', prH: 'Un único plan sencillo', prSub: 'Durante el mes gratuito todo está incluido. Después elija el plan que mejor le convenga.',
    yearly: 'Anual', monthly: 'Mensual', best: `Ahorre un ${save} %`, perYear: '/ año', perMo: '/ mes', about: m => `Unos ${m} al mes`, cancel: 'Cancele cuando quiera',
    fine: 'Precios en dólares estadounidenses. En el pago verá el precio con impuestos de su país. Los pagos los gestiona Paddle, nuestro revendedor.',
    qH: 'Preguntas', q: [['¿Qué pasa cuando termina la prueba?', 'Escribir y editar se detienen hasta que se suscriba. Leer, buscar, exportar y eliminar siguen funcionando siempre.'], ['¿Tengo que instalar algo?', 'No. Funciona en el navegador y puede añadirla a la pantalla de inicio para usarla como una app.'], ['¿Qué idiomas admite?', 'Español, inglés, coreano, japonés y francés. Sigue el idioma de su dispositivo.'], ['¿Y si dejo de usarla?', 'Las cuentas sin suscripción se eliminan un año después del último inicio de sesión. Le avisamos por correo 30 y 7 días antes, y puede exportar en cualquier momento.']],
    final: 'Empiece hoy con una línea.', terms: 'Términos', privacy: 'Privacidad', contact: 'Contacto', weather: 'Datos meteorológicos: MET Norway'
  },
  fr: {
    title: `${BRAND.name} : votre journée, racontée comme une courte histoire`, desc: 'Un journal simple, centré sur le texte. Écrivez une ligne, et chaque jour vos notes, projets et souvenirs reviennent sous forme de courte histoire.',
    open: 'Ouvrir l’app', kicker: 'Un journal écrit pour le quotidien',
    h1: 'Écrivez une ligne.<br>Votre journée devient une histoire.', lead: 'Notes, tâches, rendez-vous et l’endroit où vous avez rangé les choses, réunis dans un lieu calme. Chaque jour, tout vous revient en quelques phrases chaleureuses.',
    start: 'Essayer gratuitement un mois', startSub: 'Sans carte bancaire. Après l’essai, vous pouvez toujours tout lire et exporter.',
    demo: { when: 'jeudi 8 octobre', time: '8:20', p: ['Bonjour, <b>Camille</b>. À Paris, le temps est <b>{st:cloud}couvert, <span class="n">13°</span></b>, une journée calme.', 'Vous avez <b>{st:event}<span class="n">1</span> rendez-vous</b> aujourd’hui. N’oubliez pas <b>Dentiste</b> à <span class="n">14 h</span>.', 'Il y a un an jour pour jour, vous écriviez <b>Première promenade d’automne</b>.'], q: 'Une pensée en vous réveillant ?', ph: 'Écrivez une ligne' },
    fEye: 'Ce qu’elle fait', fH: 'Solide à l’intérieur, agréable à vivre', fSub: 'Des outils fiables en dessous, une histoire paisible au-dessus.',
    f: [['pen', 'Une question par jour', 'Une petite question le matin, l’après-midi, le soir et la nuit. Une ligne suffit.'], ['book', 'Votre journée en histoire', 'La météo, vos projets, ce que vous avez noté et un souvenir, en quelques phrases.'], ['pin', 'Où sont les choses', 'Notez où se trouve le double des clés. La recherche le retrouve en un instant.'], ['cal', 'Calendrier et tâches', 'Rendez-vous et tâches juste à côté de vos notes, par semaine ou par mois.'], ['img', 'Jusqu’à 4 photos', 'Une couverture et trois petites photos par note, toujours légères.'], ['cloud', 'Fonctionne hors ligne', 'Écrivez sans internet. La synchronisation entre téléphone et ordinateur se fait ensuite.']],
    pEye: 'Vos notes vous appartiennent', pH: 'Pas de publicité. Pas de revente de données.', pSub: 'Nous vivons uniquement des abonnements : nous n’avons besoin ni de votre attention ni de vos données.',
    p: [['Ni publicité ni pistage', 'L’app ne contient aucun traceur publicitaire ou analytique.'], ['Emportez tout à tout moment', 'Exportez en JSON, Markdown ou PDF, même après l’essai.'], ['Privé dès la conception', 'Notre équipe ne peut pas consulter vos notes. Les outils internes n’affichent que des chiffres.'], ['Facile à quitter', 'Supprimez votre compte dans les réglages : tout part avec lui.']],
    prEye: 'Tarifs', prH: 'Une seule formule, simple', prSub: 'Tout est inclus pendant le mois gratuit. Choisissez ensuite la formule qui vous convient.',
    yearly: 'Annuel', monthly: 'Mensuel', best: `${save} % d’économie`, perYear: '/ an', perMo: '/ mois', about: m => `Environ ${m} par mois`, cancel: 'Résiliable à tout moment',
    fine: 'Prix en dollars américains. Au paiement, vous verrez le prix TTC de votre pays. Les paiements sont gérés par Paddle, notre revendeur.',
    qH: 'Questions', q: [['Que se passe-t-il à la fin de l’essai ?', 'L’écriture et la modification sont suspendues jusqu’à l’abonnement. La lecture, la recherche, l’export et la suppression restent toujours possibles.'], ['Faut-il installer quelque chose ?', 'Non. Elle fonctionne dans le navigateur, et vous pouvez l’ajouter à l’écran d’accueil pour l’utiliser comme une app.'], ['Quelles langues sont disponibles ?', 'Français, anglais, coréen, japonais et espagnol. Elle suit la langue de votre appareil.'], ['Et si j’arrête de l’utiliser ?', 'Les comptes sans abonnement sont supprimés un an après la dernière connexion. Nous vous prévenons par e-mail 30 et 7 jours avant, et l’export reste possible à tout moment.']],
    final: 'Commencez aujourd’hui par une ligne.', terms: 'Conditions', privacy: 'Confidentialité', contact: 'Contact', weather: 'Données météo : MET Norway'
  }
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icon = n => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
const legal = (l, doc) => `../legal/${doc}${l === 'ko' ? '.ko' : ''}.html`;

function page(l) {
  const c = C[l], name = l === 'ko' ? BRAND.ko : BRAND.name, abs = p => (SITE ? SITE.replace(/\/$/, '') : '') + p;
  const alt = Object.keys(LANGS).map(x => `<link rel="alternate" hreflang="${x}" href="${abs(`/${x}/`)}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${abs('/en/')}">`;
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#2A1418">
<title>${esc(c.title)}</title>
<meta name="description" content="${esc(c.desc)}">
<meta property="og:title" content="${esc(c.title)}">
<meta property="og:description" content="${esc(c.desc)}">
<meta property="og:type" content="website">
<meta property="og:image" content="${abs('/icons/icon-512.png')}">
${SITE ? `<link rel="canonical" href="${abs(`/${l}/`)}">\n` : ''}${alt}
<link rel="icon" href="../icons/icon-192.png">
<link rel="apple-touch-icon" href="../icons/icon-180.png">
<link rel="stylesheet" href="../fonts/pretendard.css">
<link rel="stylesheet" href="../site/site.css">
</head>
<body>
<header class="top"><div class="wrap">
  <a class="brand" href="./"><i></i>${esc(name)}</a><span class="sp"></span>
  <details class="langs"><summary>${esc(LANGS[l])} ▾</summary><ul>${Object.entries(LANGS).map(([x, n]) => `<li><a href="../${x}/" lang="${x}"${x === l ? ' aria-current="page"' : ''}>${n}</a></li>`).join('')}</ul></details>
  <a class="btn ghost" href="../#/home">${esc(c.open)}</a>
</div></header>

<main>
<section class="hero"><div class="wrap">
  <div>
    <p class="kicker">${esc(c.kicker)}</p>
    <h1>${c.h1}</h1>
    <p class="lead">${esc(c.lead)}</p>
    <div class="cta"><a class="btn light big" href="../#/signup">${esc(c.start)}</a><small>${esc(c.startSub)}</small></div>
  </div>
  <div class="story" aria-label="${esc(name)}">
    <div class="when">${esc(c.demo.when)}<b>${esc(c.demo.time)}</b></div>
    ${c.demo.p.map(p => `<p>${p.replace(/\{st:(\w+)\}/g, (_, n) => `<img class="st" src="../stickers/fluent/${n}.webp" alt="">`)}</p>`).join('\n    ')}
    <div class="q">${esc(c.demo.q)}</div>
    <div class="ask">${esc(c.demo.ph)}</div>
  </div>
</div></section>

<section id="features"><div class="wrap">
  <p class="eyebrow">${esc(c.fEye)}</p><h2>${esc(c.fH)}</h2><p class="sub">${esc(c.fSub)}</p>
  <div class="grid">${c.f.map(([i, h, p]) => `
    <div class="card"><div class="ic">${icon(i)}</div><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('')}
  </div>
</div></section>

<section id="privacy"><div class="wrap split">
  <div><p class="eyebrow">${esc(c.pEye)}</p><h2>${esc(c.pH)}</h2><p class="sub" style="margin:0">${esc(c.pSub)}</p></div>
  <ul class="checks">${c.p.map(([h, p]) => `<li><div>${esc(h)}<span>${esc(p)}</span></div></li>`).join('')}</ul>
</div></section>

<section id="pricing"><div class="wrap">
  <p class="eyebrow">${esc(c.prEye)}</p><h2>${esc(c.prH)}</h2><p class="sub">${esc(c.prSub)}</p>
  <div class="plans">
    <div class="plan on"><span class="tag">${esc(c.best)}</span><h3>${esc(c.yearly)}</h3><div class="price">${money(PRICE.yearly, l)}<small>${esc(c.perYear)}</small></div><div class="per">${esc(c.about(perMonth(l)))}</div></div>
    <div class="plan"><h3>${esc(c.monthly)}</h3><div class="price">${money(PRICE.monthly, l)}<small>${esc(c.perMo)}</small></div><div class="per">${esc(c.cancel)}</div></div>
  </div>
  <p class="fine">${esc(c.fine)}</p>
</div></section>

<section id="faq"><div class="wrap">
  <h2>${esc(c.qH)}</h2>
  <div class="faq">${c.q.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
</div></section>

<section class="final"><div class="wrap">
  <h2>${esc(c.final)}</h2>
  <a class="btn light big" href="../#/signup">${esc(c.start)}</a>
</div></section>
</main>

<footer><div class="wrap">
  <span>© ${new Date().getFullYear()} ${esc(name)}</span><span class="sp"></span>
  <a href="${legal(l, 'terms')}">${esc(c.terms)}</a><a href="${legal(l, 'privacy')}">${esc(c.privacy)}</a><a href="mailto:24story@gmail.com">${esc(c.contact)}</a>
  <a href="https://www.met.no/en" rel="noopener">${esc(c.weather)}</a>
</div></footer>
</body>
</html>
`;
}

for (const l of Object.keys(LANGS)) {
  const f = join(ROOT, l, 'index.html'); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, page(l));
}
// 검색엔진: 주소가 정해지면(SITE) sitemap도 만들어요. 앱 화면(#/…)은 색인하지 않아요.
writeFileSync(join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n${SITE ? `Sitemap: ${SITE.replace(/\/$/, '')}/sitemap.xml\n` : ''}`);
if (SITE) writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...Object.keys(LANGS).map(l => `/${l}/`), '/legal/terms.html', '/legal/privacy.html'].map(u => `  <url><loc>${SITE.replace(/\/$/, '')}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log('site:', Object.keys(LANGS).map(l => `/${l}/`).join(' '));
