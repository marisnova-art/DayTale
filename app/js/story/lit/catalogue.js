/* 문학 한 구절 목록 (언어와 상관없는 부분). 글은 언어별 묶음(lit/ko.js 등)에 id로 들어 있어요.
   저작권이 끝난 작가(사망 70년 이상)의 글만. 번역은 모두 직접 했어요. docs/content-packs.md 참고.
   id  바꾸지 않는 번호 (기기에 '최근 나온 줄'로 저장돼요). 새 줄은 맨 끝 번호 다음으로
   a   작가 (아래 AUTHORS) — 같은 작가는 사흘쯤 쉬어요
   o   원문 언어 (ISO 639-1). 그 언어 사용자에게는 '그 나라 작가'(30%)예요. REGIONAL(ko·ja)은 다른 언어 사용자에게 '다른 나라 작가'(10%), 나머지는 '세계 고전'(60%). 'world' = 늘 세계 고전
   s 계절 · t 시간대(morning/day/evening/night, 여러 개면 배열) · w 날씨(clear/cloud/rain/snow) — 비어 있으면 언제든
   sun 1 = 햇빛·푸른 하늘이 나오는 줄 (해가 진 뒤에는 나오지 않아요). t 'night' 줄은 해가 진 저녁에도 나와요
   work 작품 이름 (알 때만) */
const AUTHORS = {
  rilke: { name: 'Rainer Maria Rilke', c: 'AT', lang: 'de', years: '1875–1926' },
  yun_dongju: { name: 'Yun Dong-ju', c: 'KR', lang: 'ko', years: '1917–1945' },
  kim_sowol: { name: 'Kim Sowol', c: 'KR', lang: 'ko', years: '1902–1934' },
  lee_hyoseok: { name: 'Lee Hyo-seok', c: 'KR', lang: 'ko', years: '1907–1942' },
  kim_yujeong: { name: 'Kim Yu-jeong', c: 'KR', lang: 'ko', years: '1908–1937' },
  jeong_jiyong: { name: 'Jeong Ji-yong', c: 'KR', lang: 'ko', years: '1902–1950' },
  han_yongun: { name: 'Han Yong-un', c: 'KR', lang: 'ko', years: '1879–1944' },
  yi_yuksa: { name: 'Yi Yuk-sa', c: 'KR', lang: 'ko', years: '1904–1944' },
  kim_yeongrang: { name: 'Kim Yeong-rang', c: 'KR', lang: 'ko', years: '1903–1950' },
  yi_sanghwa: { name: 'Yi Sang-hwa', c: 'KR', lang: 'ko', years: '1901–1943' },
  hwang_jini: { name: 'Hwang Jini', c: 'KR', lang: 'ko', years: '16th c.' },
  bang_jeonghwan: { name: 'Bang Jeong-hwan', c: 'KR', lang: 'ko', years: '1899–1931' },
  yun_seondo: { name: 'Yun Seon-do', c: 'KR', lang: 'ko', years: '1587–1671' },
  yi_jonyeon: { name: 'Yi Jo-nyeon', c: 'KR', lang: 'ko', years: '1269–1343' },
  seong_hon: { name: 'Seong Hon', c: 'KR', lang: 'ko', years: '1535–1598' },
  maeng_sasung: { name: 'Maeng Sa-seong', c: 'KR', lang: 'ko', years: '1360–1438' },
  song_sun: { name: 'Song Sun', c: 'KR', lang: 'ko', years: '1493–1582' },
  wolsan: { name: 'Grand Prince Wolsan', c: 'KR', lang: 'ko', years: '1454–1488' },
  li_bai: { name: 'Li Bai', c: 'CN', lang: 'zh', years: '701–762' },
  du_fu: { name: 'Du Fu', c: 'CN', lang: 'zh', years: '712–770' },
  meng_haoran: { name: 'Meng Haoran', c: 'CN', lang: 'zh', years: '689–740' },
  wang_wei: { name: 'Wang Wei', c: 'CN', lang: 'zh', years: '699–761' },
  tao_yuanming: { name: 'Tao Yuanming', c: 'CN', lang: 'zh', years: '365?–427' },
  su_shi: { name: 'Su Shi', c: 'CN', lang: 'zh', years: '1037–1101' },
  bai_juyi: { name: 'Bai Juyi', c: 'CN', lang: 'zh', years: '772–846' },
  du_mu: { name: 'Du Mu', c: 'CN', lang: 'zh', years: '803–852' },
  wang_zhihuan: { name: 'Wang Zhihuan', c: 'CN', lang: 'zh', years: '688–742' },
  he_zhizhang: { name: 'He Zhizhang', c: 'CN', lang: 'zh', years: '659–744' },
  basho: { name: 'Matsuo Bashō', c: 'JP', lang: 'ja', years: '1644–1694' },
  issa: { name: 'Kobayashi Issa', c: 'JP', lang: 'ja', years: '1763–1828' },
  buson: { name: 'Yosa Buson', c: 'JP', lang: 'ja', years: '1716–1784' },
  shiki: { name: 'Masaoka Shiki', c: 'JP', lang: 'ja', years: '1867–1902' },
  yosano: { name: 'Yosano Akiko', c: 'JP', lang: 'ja', years: '1878–1942' },
  soseki: { name: 'Natsume Sōseki', c: 'JP', lang: 'ja', years: '1867–1916' },
  miyazawa: { name: 'Miyazawa Kenji', c: 'JP', lang: 'ja', years: '1896–1933' },
  akutagawa: { name: 'Akutagawa Ryūnosuke', c: 'JP', lang: 'ja', years: '1892–1927' },
  takuboku: { name: 'Ishikawa Takuboku', c: 'JP', lang: 'ja', years: '1886–1912' },
  chiyo: { name: 'Kaga no Chiyo', c: 'JP', lang: 'ja', years: '1703–1775' },
  thoreau: { name: 'Henry David Thoreau', c: 'US', lang: 'en', years: '1817–1862' },
  woolf: { name: 'Virginia Woolf', c: 'GB', lang: 'en', years: '1882–1941' },
  fitzgerald: { name: 'F. Scott Fitzgerald', c: 'US', lang: 'en', years: '1896–1940' },
  mansfield: { name: 'Katherine Mansfield', c: 'NZ', lang: 'en', years: '1888–1923' },
  dickinson: { name: 'Emily Dickinson', c: 'US', lang: 'en', years: '1830–1886' },
  keats: { name: 'John Keats', c: 'GB', lang: 'en', years: '1795–1821' },
  wordsworth: { name: 'William Wordsworth', c: 'GB', lang: 'en', years: '1770–1850' },
  shelley: { name: 'Percy Bysshe Shelley', c: 'GB', lang: 'en', years: '1792–1822' },
  rossetti: { name: 'Christina Rossetti', c: 'GB', lang: 'en', years: '1830–1894' },
  yeats: { name: 'W. B. Yeats', c: 'IE', lang: 'en', years: '1865–1939' },
  montgomery: { name: 'L. M. Montgomery', c: 'CA', lang: 'en', years: '1874–1942' },
  burnett: { name: 'Frances Hodgson Burnett', c: 'GB', lang: 'en', years: '1849–1924' },
  grahame: { name: 'Kenneth Grahame', c: 'GB', lang: 'en', years: '1859–1932' },
  barrie: { name: 'J. M. Barrie', c: 'GB', lang: 'en', years: '1860–1937' },
  carroll: { name: 'Lewis Carroll', c: 'GB', lang: 'en', years: '1832–1898' },
  twain: { name: 'Mark Twain', c: 'US', lang: 'en', years: '1835–1910' },
  alcott: { name: 'Louisa May Alcott', c: 'US', lang: 'en', years: '1832–1888' },
  austen: { name: 'Jane Austen', c: 'GB', lang: 'en', years: '1775–1817' },
  stevenson: { name: 'Robert Louis Stevenson', c: 'GB', lang: 'en', years: '1850–1894' },
  whitman: { name: 'Walt Whitman', c: 'US', lang: 'en', years: '1819–1892' },
  wilde: { name: 'Oscar Wilde', c: 'IE', lang: 'en', years: '1854–1900' },
  emily_bronte: { name: 'Emily Brontë', c: 'GB', lang: 'en', years: '1818–1848' },
  charlotte_bronte: { name: 'Charlotte Brontë', c: 'GB', lang: 'en', years: '1816–1855' },
  hardy: { name: 'Thomas Hardy', c: 'GB', lang: 'en', years: '1840–1928' },
  emerson: { name: 'Ralph Waldo Emerson', c: 'US', lang: 'en', years: '1803–1882' },
  proust: { name: 'Marcel Proust', c: 'FR', lang: 'fr', years: '1871–1922' },
  verlaine: { name: 'Paul Verlaine', c: 'FR', lang: 'fr', years: '1844–1896' },
  apollinaire: { name: 'Guillaume Apollinaire', c: 'FR', lang: 'fr', years: '1880–1918' },
  hugo: { name: 'Victor Hugo', c: 'FR', lang: 'fr', years: '1802–1885' },
  baudelaire: { name: 'Charles Baudelaire', c: 'FR', lang: 'fr', years: '1821–1867' },
  montaigne: { name: 'Michel de Montaigne', c: 'FR', lang: 'fr', years: '1533–1592' },
  becquer: { name: 'Gustavo Adolfo Bécquer', c: 'ES', lang: 'es', years: '1836–1870' },
  machado: { name: 'Antonio Machado', c: 'ES', lang: 'es', years: '1875–1939' },
  lorca: { name: 'Federico García Lorca', c: 'ES', lang: 'es', years: '1898–1936' },
  dario: { name: 'Rubén Darío', c: 'NI', lang: 'es', years: '1867–1916' },
  goethe: { name: 'Johann Wolfgang von Goethe', c: 'DE', lang: 'de', years: '1749–1832' },
  heine: { name: 'Heinrich Heine', c: 'DE', lang: 'de', years: '1797–1856' },
  pushkin: { name: 'Alexander Pushkin', c: 'RU', lang: 'ru', years: '1799–1837' },
  tagore: { name: 'Rabindranath Tagore', c: 'IN', lang: 'bn', years: '1861–1941' },
  gibran: { name: 'Kahlil Gibran', c: 'LB', lang: 'world', years: '1883–1931' },
  chekhov: { name: 'Anton Chekhov', c: 'RU', lang: 'ru', years: '1860–1904' },
  tolstoy: { name: 'Leo Tolstoy', c: 'RU', lang: 'ru', years: '1828–1910' },
  turgenev: { name: 'Ivan Turgenev', c: 'RU', lang: 'ru', years: '1818–1883' },
  van_gogh: { name: 'Vincent van Gogh', c: 'NL', lang: 'nl', years: '1853–1890' },
  klee: { name: 'Paul Klee', c: 'CH', lang: 'de', years: '1879–1940' },
  kandinsky: { name: 'Wassily Kandinsky', c: 'RU', lang: 'de', years: '1866–1944' },
  marcus_aurelius: { name: 'Marcus Aurelius', c: 'IT', lang: 'grc', years: '121–180' },
  seneca: { name: 'Seneca', c: 'IT', lang: 'la', years: 'c. 4 BC–65' },
  andersen: { name: 'Hans Christian Andersen', c: 'DK', lang: 'da', years: '1805–1875' },
};

const CATALOGUE = [
  // Rainer Maria Rilke
  { id: 0, a: 'rilke', o: 'de', s: 'autumn', work: 'Autumn Day' },
  { id: 1, a: 'rilke', o: 'de', s: 'autumn' },
  { id: 2, a: 'rilke', o: 'de', s: 'autumn' },
  { id: 3, a: 'rilke', o: 'de' },
  { id: 4, a: 'rilke', o: 'de' },
  // Yun Dong-ju
  { id: 5, a: 'yun_dongju', o: 'ko', t: 'night', work: 'Prologue' },
  { id: 6, a: 'yun_dongju', o: 'ko', s: 'autumn', work: 'Counting the Stars at Night' },
  { id: 7, a: 'yun_dongju', o: 'ko', t: 'night', w: 'clear' },
  { id: 8, a: 'yun_dongju', o: 'ko', t: 'morning', work: 'A New Road' },
  { id: 9, a: 'yun_dongju', o: 'ko', s: 'autumn', work: 'Boy' },
  { id: 10, a: 'yun_dongju', o: 'ko', s: 'autumn', t: 'night' },
  // Kim Sowol
  { id: 11, a: 'kim_sowol', o: 'ko', t: 'night' },
  { id: 12, a: 'kim_sowol', o: 'ko', s: 'spring' },
  { id: 13, a: 'kim_sowol', o: 'ko', t: 'day', sun: 1 },
  // Lee Hyo-seok
  { id: 14, a: 'lee_hyoseok', o: 'ko', s: 'autumn', t: 'night', work: 'When the Buckwheat Blooms' },
  { id: 15, a: 'lee_hyoseok', o: 'ko', s: 'autumn', work: 'Burning Fallen Leaves' },
  // Kim Yu-jeong
  { id: 16, a: 'kim_yujeong', o: 'ko', s: 'spring', work: 'Camellias' },
  // Jeong Ji-yong
  { id: 17, a: 'jeong_jiyong', o: 'ko', t: 'evening', work: 'Nostalgia' },
  { id: 18, a: 'jeong_jiyong', o: 'ko', work: 'Lake' },
  { id: 19, a: 'jeong_jiyong', o: 'ko' },
  // Han Yong-un
  { id: 20, a: 'han_yongun', o: 'ko', s: 'autumn', work: 'I Do Not Know' },
  { id: 21, a: 'han_yongun', o: 'ko', w: 'cloud', sun: 1 },
  // Yi Yuk-sa
  { id: 22, a: 'yi_yuksa', o: 'ko', s: 'summer', work: 'Green Grapes' },
  // Kim Yeong-rang
  { id: 23, a: 'kim_yeongrang', o: 'ko', s: 'spring', sun: 1 },
  { id: 24, a: 'kim_yeongrang', o: 'ko', s: 'spring' },
  { id: 25, a: 'kim_yeongrang', o: 'ko', s: 'autumn' },
  // Yi Sang-hwa
  { id: 26, a: 'yi_sanghwa', o: 'ko', s: 'spring', sun: 1 },
  // Hwang Jini
  { id: 27, a: 'hwang_jini', o: 'ko', s: 'winter', t: 'night' },
  // Li Bai
  { id: 28, a: 'li_bai', o: 'zh', t: 'night', work: 'Quiet Night Thought' },
  // Du Fu
  { id: 29, a: 'du_fu', o: 'zh', w: 'rain' },
  // Meng Haoran
  { id: 30, a: 'meng_haoran', o: 'zh', s: 'spring', t: 'morning' },
  // Wang Wei
  { id: 31, a: 'wang_wei', o: 'zh', t: 'day', work: 'Deer Park' },
  // Tao Yuanming
  { id: 32, a: 'tao_yuanming', o: 'zh', t: 'evening' },
  // Matsuo Bashō
  { id: 33, a: 'basho', o: 'ja', s: 'spring' },
  { id: 34, a: 'basho', o: 'ja', s: 'summer' },
  { id: 35, a: 'basho', o: 'ja', s: 'summer', t: 'night' },
  { id: 36, a: 'basho', o: 'ja', s: 'summer' },
  // Kobayashi Issa
  { id: 37, a: 'issa', o: 'ja', s: 'spring' },
  { id: 38, a: 'issa', o: 'ja' },
  // Yosa Buson
  { id: 39, a: 'buson', o: 'ja', s: 'spring', t: 'evening', sun: 1 },
  { id: 40, a: 'buson', o: 'ja', s: 'spring' },
  // Matsuo Bashō
  { id: 41, a: 'basho', o: 'ja', s: 'winter', w: 'snow' },
  // Masaoka Shiki
  { id: 42, a: 'shiki', o: 'ja', s: 'autumn' },
  // Yosano Akiko
  { id: 43, a: 'yosano', o: 'ja', s: 'spring', t: 'night' },
  // Natsume Sōseki
  { id: 44, a: 'soseki', o: 'ja', t: 'day', work: 'Kusamakura' },
  { id: 45, a: 'soseki', o: 'ja', t: 'night', work: 'Ten Nights of Dreams' },
  // Miyazawa Kenji
  { id: 46, a: 'miyazawa', o: 'ja', w: 'rain' },
  { id: 47, a: 'miyazawa', o: 'ja', t: 'night', w: 'clear' },
  // Akutagawa Ryūnosuke
  { id: 48, a: 'akutagawa', o: 'ja', s: 'winter', t: ['day','evening'], sun: 1, work: 'Mandarins' },
  // Henry David Thoreau
  { id: 49, a: 'thoreau', o: 'en', sun: 1, work: 'Walden' },
  { id: 50, a: 'thoreau', o: 'en' },
  { id: 51, a: 'thoreau', o: 'en', t: 'morning' },
  { id: 52, a: 'thoreau', o: 'en', t: ['morning','day'] },
  // Virginia Woolf
  { id: 53, a: 'woolf', o: 'en', t: 'morning', work: 'The Waves' },
  { id: 54, a: 'woolf', o: 'en', t: 'morning' },
  { id: 55, a: 'woolf', o: 'en', t: 'morning' },
  { id: 56, a: 'woolf', o: 'en', work: 'To the Lighthouse' },
  // F. Scott Fitzgerald
  { id: 57, a: 'fitzgerald', o: 'en', s: 'summer' },
  { id: 58, a: 'fitzgerald', o: 'en', s: 'summer', t: 'night' },
  // Katherine Mansfield
  { id: 59, a: 'mansfield', o: 'en', sun: 1, work: 'The Garden Party' },
  { id: 60, a: 'mansfield', o: 'en', t: ['morning','day'] },
  // Emily Dickinson
  { id: 61, a: 'dickinson', o: 'en', w: 'cloud' },
  { id: 62, a: 'dickinson', o: 'en', s: 'winter', t: 'day', sun: 1 },
  { id: 63, a: 'dickinson', o: 'en' },
  // John Keats
  { id: 64, a: 'keats', o: 'en', s: 'autumn' },
  // William Wordsworth
  { id: 65, a: 'wordsworth', o: 'en', s: 'spring' },
  // Percy Bysshe Shelley
  { id: 66, a: 'shelley', o: 'en', s: 'winter' },
  // Christina Rossetti
  { id: 67, a: 'rossetti', o: 'en' },
  { id: 68, a: 'rossetti', o: 'en', s: 'winter', w: 'snow' },
  // W. B. Yeats
  { id: 69, a: 'yeats', o: 'en' },
  { id: 70, a: 'yeats', o: 'en', s: 'spring' },
  { id: 71, a: 'yeats', o: 'en', t: 'night' },
  // John Keats
  { id: 72, a: 'keats', o: 'en' },
  // L. M. Montgomery
  { id: 73, a: 'montgomery', o: 'en', s: 'autumn' },
  { id: 74, a: 'montgomery', o: 'en', t: ['morning','night'] },
  { id: 75, a: 'montgomery', o: 'en', sun: 1 },
  // Frances Hodgson Burnett
  { id: 76, a: 'burnett', o: 'en', s: 'spring', work: 'The Secret Garden' },
  // Kenneth Grahame
  { id: 77, a: 'grahame', o: 'en', s: 'spring', t: 'morning', work: 'The Wind in the Willows' },
  { id: 78, a: 'grahame', o: 'en', s: 'summer', work: 'The Wind in the Willows' },
  // J. M. Barrie
  { id: 79, a: 'barrie', o: 'en', t: 'night' },
  // Lewis Carroll
  { id: 80, a: 'carroll', o: 'en' },
  // Mark Twain
  { id: 81, a: 'twain', o: 'en', t: 'morning', w: 'clear', sun: 1, work: 'Tom Sawyer' },
  // Louisa May Alcott
  { id: 82, a: 'alcott', o: 'en', w: 'rain', work: 'Little Women' },
  // Jane Austen
  { id: 83, a: 'austen', o: 'en', s: 'summer', t: 'day', sun: 1, work: 'Mansfield Park' },
  // Louisa May Alcott
  { id: 84, a: 'alcott', o: 'en', s: 'winter', t: ['morning','day'], work: 'Little Women' },
  // Robert Louis Stevenson
  { id: 85, a: 'stevenson', o: 'en' },
  { id: 86, a: 'stevenson', o: 'en', t: 'day', w: 'clear', sun: 1 },
  // Walt Whitman
  { id: 87, a: 'whitman', o: 'en', work: 'Miracles' },
  // Oscar Wilde
  { id: 88, a: 'wilde', o: 'en', t: 'night' },
  // Marcel Proust
  { id: 89, a: 'proust', o: 'fr', t: ['day','evening'] },
  // Johann Wolfgang von Goethe
  { id: 90, a: 'goethe', o: 'de', s: 'spring' },
  // Heinrich Heine
  { id: 91, a: 'heine', o: 'de', s: 'spring' },
  // Alexander Pushkin
  { id: 92, a: 'pushkin', o: 'ru', s: 'winter', t: 'morning', w: 'clear', sun: 1, work: 'Winter Morning' },
  // Paul Verlaine
  { id: 93, a: 'verlaine', o: 'fr', w: 'rain' },
  { id: 94, a: 'verlaine', o: 'fr', s: 'autumn' },
  // Guillaume Apollinaire
  { id: 95, a: 'apollinaire', o: 'fr', t: ['evening','night'] },
  // Gustavo Adolfo Bécquer
  { id: 96, a: 'becquer', o: 'es', s: 'spring' },
  // Antonio Machado
  { id: 97, a: 'machado', o: 'es' },
  // Federico García Lorca
  { id: 98, a: 'lorca', o: 'es', s: 'summer' },
  // Rabindranath Tagore
  { id: 99, a: 'tagore', o: 'bn', t: 'evening', w: 'cloud', sun: 1 },
  { id: 100, a: 'tagore', o: 'bn' },
  { id: 101, a: 'tagore', o: 'bn', t: 'night' },
  // Kahlil Gibran
  { id: 102, a: 'gibran', o: 'world', s: 'summer' },
  // Emily Brontë
  { id: 103, a: 'emily_bronte', o: 'en', s: 'summer', t: 'evening', work: 'Wuthering Heights' },
  // Anton Chekhov
  { id: 104, a: 'chekhov', o: 'ru', t: ['evening','night'], work: 'Three Sisters' },
  { id: 105, a: 'chekhov', o: 'ru', s: 'winter', t: 'night', work: 'Uncle Vanya' },
  // Thomas Hardy
  { id: 106, a: 'hardy', o: 'en', s: 'winter' },
  // Marcel Proust
  { id: 107, a: 'proust', o: 'fr', t: ['morning','day'] },
  // Vincent van Gogh
  { id: 108, a: 'van_gogh', o: 'nl', t: 'night', w: 'clear' },
  { id: 109, a: 'van_gogh', o: 'nl', t: 'night' },
  { id: 110, a: 'van_gogh', o: 'nl' },
  // Paul Klee
  { id: 111, a: 'klee', o: 'de', sun: 1 },
  // Wassily Kandinsky
  { id: 112, a: 'kandinsky', o: 'de' },
  // Kim Sowol
  { id: 113, a: 'kim_sowol', o: 'ko', s: 'autumn', t: 'night', work: 'Parents' },
  { id: 114, a: 'kim_sowol', o: 'ko', w: 'rain', work: 'Wangsimni' },
  { id: 115, a: 'kim_sowol', o: 'ko', work: 'The Way I Go' },
  { id: 116, a: 'kim_sowol', o: 'ko', s: 'spring' },
  { id: 117, a: 'kim_sowol', o: 'ko', work: 'Song of My Beloved' },
  { id: 118, a: 'kim_sowol', o: 'ko', s: 'summer', work: 'Picking Grass' },
  // Han Yong-un
  { id: 119, a: 'han_yongun', o: 'ko' },
  { id: 120, a: 'han_yongun', o: 'ko' },
  { id: 121, a: 'han_yongun', o: 'ko', t: 'evening', sun: 1 },
  { id: 122, a: 'han_yongun', o: 'ko', s: 'autumn' },
  // Yi Sang-hwa
  { id: 123, a: 'yi_sanghwa', o: 'ko', s: 'spring' },
  { id: 124, a: 'yi_sanghwa', o: 'ko', s: 'spring' },
  { id: 125, a: 'yi_sanghwa', o: 'ko', s: 'spring' },
  { id: 126, a: 'yi_sanghwa', o: 'ko', s: 'spring' },
  // Jeong Ji-yong
  { id: 127, a: 'jeong_jiyong', o: 'ko', t: 'night', work: 'Shooting Star' },
  { id: 128, a: 'jeong_jiyong', o: 'ko', w: 'rain', work: 'Grandfather' },
  { id: 129, a: 'jeong_jiyong', o: 'ko', s: 'spring' },
  { id: 130, a: 'jeong_jiyong', o: 'ko', t: 'day' },
  // Bang Jeong-hwan
  { id: 131, a: 'bang_jeonghwan', o: 'ko', s: 'spring' },
  // Hwang Jini
  { id: 132, a: 'hwang_jini', o: 'ko', t: 'night' },
  { id: 133, a: 'hwang_jini', o: 'ko' },
  // Yun Seon-do
  { id: 134, a: 'yun_seondo', o: 'ko', work: 'Song of Five Friends' },
  { id: 135, a: 'yun_seondo', o: 'ko' },
  { id: 136, a: 'yun_seondo', o: 'ko', t: 'night' },
  { id: 137, a: 'yun_seondo', o: 'ko', s: 'spring', work: 'The Fisherman’s Four Seasons' },
  // Yi Jo-nyeon
  { id: 138, a: 'yi_jonyeon', o: 'ko', s: 'spring', t: 'night' },
  // Seong Hon
  { id: 139, a: 'seong_hon', o: 'ko' },
  // Maeng Sa-seong
  { id: 140, a: 'maeng_sasung', o: 'ko', s: 'summer' },
  { id: 141, a: 'maeng_sasung', o: 'ko', s: 'winter', w: 'snow' },
  // Song Sun
  { id: 142, a: 'song_sun', o: 'ko' },
  // Grand Prince Wolsan
  { id: 143, a: 'wolsan', o: 'ko', s: 'autumn', t: 'night' },
  // Natsume Sōseki
  { id: 144, a: 'soseki', o: 'ja', s: 'spring', work: 'Kusamakura' },
  { id: 145, a: 'soseki', o: 'ja' },
  { id: 146, a: 'soseki', o: 'ja' },
  // Akutagawa Ryūnosuke
  { id: 147, a: 'akutagawa', o: 'ja', s: 'spring', t: 'evening', work: 'Tu Tze-chun' },
  { id: 148, a: 'akutagawa', o: 'ja' },
  // Miyazawa Kenji
  { id: 149, a: 'miyazawa', o: 'ja', t: 'morning', sun: 1 },
  { id: 150, a: 'miyazawa', o: 'ja' },
  { id: 151, a: 'miyazawa', o: 'ja', work: 'Spring and Asura' },
  { id: 152, a: 'miyazawa', o: 'ja', work: 'Wild Pear' },
  // Masaoka Shiki
  { id: 153, a: 'shiki', o: 'ja', s: 'winter', w: 'snow' },
  { id: 154, a: 'shiki', o: 'ja', s: 'autumn', t: 'day', w: 'clear', sun: 1 },
  { id: 155, a: 'shiki', o: 'ja', s: 'summer' },
  { id: 156, a: 'shiki', o: 'ja', s: 'spring' },
  { id: 157, a: 'shiki', o: 'ja', s: 'spring' },
  // Yosano Akiko
  { id: 158, a: 'yosano', o: 'ja', s: 'autumn', t: 'evening', sun: 1 },
  { id: 159, a: 'yosano', o: 'ja', s: 'autumn', t: 'evening' },
  { id: 160, a: 'yosano', o: 'ja' },
  // Ishikawa Takuboku
  { id: 161, a: 'takuboku', o: 'ja' },
  { id: 162, a: 'takuboku', o: 'ja' },
  { id: 163, a: 'takuboku', o: 'ja', t: 'day' },
  { id: 164, a: 'takuboku', o: 'ja' },
  // Matsuo Bashō
  { id: 165, a: 'basho', o: 'ja', s: 'spring' },
  { id: 166, a: 'basho', o: 'ja', s: 'summer', w: 'rain' },
  { id: 167, a: 'basho', o: 'ja', s: 'autumn', t: 'night' },
  { id: 168, a: 'basho', o: 'ja', s: 'spring' },
  // Kobayashi Issa
  { id: 169, a: 'issa', o: 'ja', s: 'summer' },
  { id: 170, a: 'issa', o: 'ja', s: 'spring' },
  { id: 171, a: 'issa', o: 'ja', s: 'autumn', t: 'night' },
  { id: 172, a: 'issa', o: 'ja', s: 'winter', w: 'snow' },
  // Yosa Buson
  { id: 173, a: 'buson', o: 'ja', s: 'spring', w: 'rain' },
  { id: 174, a: 'buson', o: 'ja', s: 'summer', w: 'rain' },
  { id: 175, a: 'buson', o: 'ja', s: 'autumn', t: 'night' },
  { id: 176, a: 'buson', o: 'ja', s: 'summer' },
  // Kaga no Chiyo
  { id: 177, a: 'chiyo', o: 'ja', s: 'summer', t: 'morning' },
  // Li Bai
  { id: 178, a: 'li_bai', o: 'zh', t: 'morning' },
  { id: 179, a: 'li_bai', o: 'zh' },
  { id: 180, a: 'li_bai', o: 'zh', s: 'spring', sun: 1 },
  { id: 181, a: 'li_bai', o: 'zh', t: 'night' },
  { id: 182, a: 'li_bai', o: 'zh' },
  // Du Fu
  { id: 183, a: 'du_fu', o: 'zh', s: 'spring', sun: 1 },
  { id: 184, a: 'du_fu', o: 'zh', s: 'spring', t: 'day', sun: 1 },
  { id: 185, a: 'du_fu', o: 'zh', s: 'spring' },
  { id: 186, a: 'du_fu', o: 'zh' },
  // Wang Wei
  { id: 187, a: 'wang_wei', o: 'zh', s: 'autumn', t: 'night' },
  { id: 188, a: 'wang_wei', o: 'zh', t: 'night' },
  { id: 189, a: 'wang_wei', o: 'zh', s: 'spring', t: 'night' },
  { id: 190, a: 'wang_wei', o: 'zh' },
  { id: 191, a: 'wang_wei', o: 'zh', s: 'winter' },
  // Tao Yuanming
  { id: 192, a: 'tao_yuanming', o: 'zh' },
  { id: 193, a: 'tao_yuanming', o: 'zh', t: 'evening' },
  { id: 194, a: 'tao_yuanming', o: 'zh' },
  { id: 195, a: 'tao_yuanming', o: 'zh', t: 'evening', work: 'Returning Home' },
  { id: 196, a: 'tao_yuanming', o: 'zh', s: 'spring' },
  // Su Shi
  { id: 197, a: 'su_shi', o: 'zh', s: 'spring' },
  { id: 198, a: 'su_shi', o: 'zh' },
  { id: 199, a: 'su_shi', o: 'zh' },
  { id: 200, a: 'su_shi', o: 'zh', t: 'night' },
  { id: 201, a: 'su_shi', o: 'zh', w: 'rain' },
  { id: 202, a: 'su_shi', o: 'zh', s: 'autumn' },
  { id: 203, a: 'su_shi', o: 'zh', s: 'spring', t: 'night' },
  // Bai Juyi
  { id: 204, a: 'bai_juyi', o: 'zh', s: 'spring' },
  { id: 205, a: 'bai_juyi', o: 'zh', s: 'spring', t: 'morning', sun: 1 },
  { id: 206, a: 'bai_juyi', o: 'zh', t: 'evening', sun: 1 },
  { id: 207, a: 'bai_juyi', o: 'zh', s: 'autumn', t: 'night' },
  // Meng Haoran
  { id: 208, a: 'meng_haoran', o: 'zh' },
  { id: 209, a: 'meng_haoran', o: 'zh', t: 'night' },
  // Du Mu
  { id: 210, a: 'du_mu', o: 'zh', s: 'autumn', t: 'evening' },
  // Wang Zhihuan
  { id: 211, a: 'wang_zhihuan', o: 'zh', t: 'evening', sun: 1 },
  // He Zhizhang
  { id: 212, a: 'he_zhizhang', o: 'zh', s: 'spring' },
  // Emily Dickinson
  { id: 213, a: 'dickinson', o: 'en', t: 'morning', sun: 1 },
  { id: 214, a: 'dickinson', o: 'en', s: 'autumn' },
  { id: 215, a: 'dickinson', o: 'en', s: 'summer' },
  { id: 216, a: 'dickinson', o: 'en' },
  { id: 217, a: 'dickinson', o: 'en' },
  // Walt Whitman
  { id: 218, a: 'whitman', o: 'en' },
  { id: 219, a: 'whitman', o: 'en', t: ['morning','day'] },
  { id: 220, a: 'whitman', o: 'en', s: 'summer' },
  { id: 221, a: 'whitman', o: 'en', t: 'night' },
  // Henry David Thoreau
  { id: 222, a: 'thoreau', o: 'en', t: 'morning', work: 'Walden' },
  { id: 223, a: 'thoreau', o: 'en', t: 'morning' },
  { id: 224, a: 'thoreau', o: 'en' },
  { id: 225, a: 'thoreau', o: 'en' },
  // Ralph Waldo Emerson
  { id: 226, a: 'emerson', o: 'en' },
  { id: 227, a: 'emerson', o: 'en' },
  { id: 228, a: 'emerson', o: 'en' },
  { id: 229, a: 'emerson', o: 'en' },
  // Louisa May Alcott
  { id: 230, a: 'alcott', o: 'en', work: 'Little Women' },
  { id: 231, a: 'alcott', o: 'en' },
  // L. M. Montgomery
  { id: 232, a: 'montgomery', o: 'en', work: 'Anne of Green Gables' },
  { id: 233, a: 'montgomery', o: 'en' },
  { id: 234, a: 'montgomery', o: 'en' },
  { id: 235, a: 'montgomery', o: 'en' },
  // Jane Austen
  { id: 236, a: 'austen', o: 'en', s: 'autumn', work: 'Persuasion' },
  { id: 237, a: 'austen', o: 'en', work: 'Emma' },
  { id: 238, a: 'austen', o: 'en' },
  { id: 239, a: 'austen', o: 'en', work: 'Pride and Prejudice' },
  // Charlotte Brontë
  { id: 240, a: 'charlotte_bronte', o: 'en', s: 'winter', w: 'rain', work: 'Jane Eyre' },
  // Emily Brontë
  { id: 241, a: 'emily_bronte', o: 'en', s: 'autumn' },
  { id: 242, a: 'emily_bronte', o: 'en', s: 'summer', t: 'day', sun: 1, work: 'Wuthering Heights' },
  // John Keats
  { id: 243, a: 'keats', o: 'en' },
  { id: 244, a: 'keats', o: 'en', s: 'autumn' },
  { id: 245, a: 'keats', o: 'en', t: 'night' },
  // William Wordsworth
  { id: 246, a: 'wordsworth', o: 'en', t: 'morning' },
  { id: 247, a: 'wordsworth', o: 'en' },
  { id: 248, a: 'wordsworth', o: 'en' },
  // Percy Bysshe Shelley
  { id: 249, a: 'shelley', o: 'en', w: 'rain' },
  { id: 250, a: 'shelley', o: 'en' },
  { id: 251, a: 'shelley', o: 'en', s: 'spring', t: ['morning','day'] },
  // Christina Rossetti
  { id: 252, a: 'rossetti', o: 'en', w: 'cloud' },
  { id: 253, a: 'rossetti', o: 'en' },
  { id: 254, a: 'rossetti', o: 'en', s: 'spring' },
  // Robert Louis Stevenson
  { id: 255, a: 'stevenson', o: 'en', s: 'summer', t: 'evening' },
  { id: 256, a: 'stevenson', o: 'en', w: 'rain' },
  { id: 257, a: 'stevenson', o: 'en' },
  { id: 258, a: 'stevenson', o: 'en' },
  // Katherine Mansfield
  { id: 259, a: 'mansfield', o: 'en', t: 'morning', sun: 1, work: 'At the Bay' },
  { id: 260, a: 'mansfield', o: 'en' },
  // Virginia Woolf
  { id: 261, a: 'woolf', o: 'en', t: 'evening', work: 'A Room of One’s Own' },
  { id: 262, a: 'woolf', o: 'en', s: 'summer' },
  { id: 263, a: 'woolf', o: 'en', work: 'To the Lighthouse' },
  // Anton Chekhov
  { id: 264, a: 'chekhov', o: 'ru', t: 'morning', work: 'Three Sisters' },
  { id: 265, a: 'chekhov', o: 'ru', t: 'day' },
  // Leo Tolstoy
  { id: 266, a: 'tolstoy', o: 'ru', t: 'night', work: 'War and Peace' },
  { id: 267, a: 'tolstoy', o: 'ru' },
  // Ivan Turgenev
  { id: 268, a: 'turgenev', o: 'ru', s: 'spring', t: 'morning' },
  // Vincent van Gogh
  { id: 269, a: 'van_gogh', o: 'nl' },
  { id: 270, a: 'van_gogh', o: 'nl' },
  { id: 271, a: 'van_gogh', o: 'nl', s: 'summer' },
  // Marcel Proust
  { id: 272, a: 'proust', o: 'fr', t: 'night', work: 'Swann’s Way' },
  { id: 273, a: 'proust', o: 'fr' },
  // Rabindranath Tagore
  { id: 274, a: 'tagore', o: 'bn', s: 'summer' },
  { id: 275, a: 'tagore', o: 'bn' },
  { id: 276, a: 'tagore', o: 'bn', w: 'rain' },
  // Kahlil Gibran
  { id: 277, a: 'gibran', o: 'world', t: 'day', work: 'The Prophet' },
  { id: 278, a: 'gibran', o: 'world', t: 'morning' },
  { id: 279, a: 'gibran', o: 'world' },
  // Antonio Machado
  { id: 280, a: 'machado', o: 'es', s: 'spring' },
  { id: 281, a: 'machado', o: 'es' },
  { id: 282, a: 'machado', o: 'es', s: 'spring' },
  // Rubén Darío
  { id: 283, a: 'dario', o: 'es' },
  // Gustavo Adolfo Bécquer
  { id: 284, a: 'becquer', o: 'es' },
  { id: 285, a: 'becquer', o: 'es' },
  // Victor Hugo
  { id: 286, a: 'hugo', o: 'fr', sun: 1, work: 'Les Misérables' },
  // Charles Baudelaire
  { id: 287, a: 'baudelaire', o: 'fr', w: 'cloud' },
  { id: 288, a: 'baudelaire', o: 'fr' },
  // Paul Verlaine
  { id: 289, a: 'verlaine', o: 'fr', t: 'day', sun: 1 },
  { id: 290, a: 'verlaine', o: 'fr', t: 'night' },
  // Michel de Montaigne
  { id: 291, a: 'montaigne', o: 'fr' },
  { id: 292, a: 'montaigne', o: 'fr' },
  { id: 293, a: 'montaigne', o: 'fr' },
  { id: 294, a: 'montaigne', o: 'fr', t: ['evening','night'] },
  // Marcus Aurelius
  { id: 295, a: 'marcus_aurelius', o: 'grc', t: 'morning' },
  { id: 296, a: 'marcus_aurelius', o: 'grc' },
  { id: 297, a: 'marcus_aurelius', o: 'grc' },
  { id: 298, a: 'marcus_aurelius', o: 'grc', t: 'night' },
  // Seneca
  { id: 299, a: 'seneca', o: 'la' },
  { id: 300, a: 'seneca', o: 'la' },
  // Johann Wolfgang von Goethe
  { id: 301, a: 'goethe', o: 'de', t: 'night' },
  { id: 302, a: 'goethe', o: 'de' },
  { id: 303, a: 'goethe', o: 'de', s: 'spring', t: ['morning','day'], sun: 1, work: 'May Song' },
  // Heinrich Heine
  { id: 304, a: 'heine', o: 'de', s: 'spring' },
  { id: 305, a: 'heine', o: 'de' },
  // Hans Christian Andersen
  { id: 306, a: 'andersen', o: 'da' },
  { id: 307, a: 'andersen', o: 'da', t: ['morning','day'], sun: 1 },
  // Lewis Carroll
  { id: 308, a: 'carroll', o: 'en', t: 'morning' },
  { id: 309, a: 'carroll', o: 'en' },
  { id: 310, a: 'carroll', o: 'en' },
];

export { AUTHORS, CATALOGUE };
