/* 쓰면서 스티커 추천: 낱말 → 스티커 (언어별). 한국어는 뒤에 조사가 붙어도 찾아요, 일본어는 띄어쓰기 없이 끝말로 찾아요.
   한 글자 낱말은 조사만 붙은 경우에만 맞춰요 (차 → 차가운 X). 기록 내용은 기기 밖으로 나가지 않아요. */
const W = {
  ko: {
    sun: '햇살,햇빛,맑음,맑은', cloud: '구름,흐림,흐린', suncloud: '구름조금', rain: '비,빗소리,소나기,장마', snow: '함박눈,폭설,눈길', thunder: '천둥,번개', fog: '안개',
    moon: '달,달빛,보름달', night: '밤,새벽,야경', sunrise: '아침,일출,해돋이', sunset: '노을,저녁놀,일몰', star: '별,별빛', rainbow: '무지개', umbrella: '우산',
    wind: '바람,태풍', alarm: '알람,자명종,기상', event: '일정,약속,예약,회의', note: '메모,노트,일기', todo: '할일,체크', idea: '아이디어,영감',
    coffee: '커피,카페,라떼', tea: '녹차,홍차,티타임', cake: '케이크,생일,생신', fire: '열정,불', sparkles: '반짝,특별', trophy: '우승,상장,트로피,합격',
    photo: '사진,셀카', item: '물건,택배,상자', personal: '비밀', scrap: '스크랩,기사', recall: '추억,회상',
    blossom: '벚꽃,꽃', tulip: '튤립', sprout: '새싹,씨앗', strawberry: '딸기', sunflower: '해바라기', watermelon: '수박', shell: '조개,바다', icecream: '아이스크림,빙수',
    leaf: '단풍,낙엽', ginkgo: '은행잎,은행나무', acorn: '도토리', mushroom: '버섯', snowman: '눈사람', mitten: '장갑', tangerine: '귤,감귤', snowflake: '눈송이,첫눈',
    book: '책,독서,소설', headphones: '음악,노래,헤드폰,플레이리스트', bread: '빵,토스트,베이커리', rice: '밥,점심,저녁밥,식사', apple: '사과', sneaker: '운동,산책,달리기,러닝,조깅',
    bicycle: '자전거', bus: '버스,출근,퇴근', plane: '비행기,여행,공항', house: '집,이사', bed: '잠,침대,낮잠', heart: '사랑,하트,고마워', gift: '선물', letter: '편지,카드',
    balloon: '풍선,파티', clover: '행운,네잎클로버', smile: '웃음,행복,기분좋', pencil: '연필,공부,숙제,시험', palette: '그림,미술,물감', film: '영화,드라마', gamepad: '게임',
    plant: '화분,식물,꽃집', laptop: '노트북,컴퓨터,코딩,야근', bag: '가방,학교', key: '열쇠', cat: '고양이,냥이', dog: '강아지,멍멍이', bird: '참새,비둘기,새소리', tree: '나무,숲',
    mountain: '산,등산', wave: '파도,서핑', butterfly: '나비', fish: '물고기,낚시,수족관'
  },
  en: {
    sun: 'sun,sunny,sunshine', cloud: 'cloud,cloudy', rain: 'rain,rainy', snow: 'snow,snowy', thunder: 'thunder,storm,lightning', fog: 'fog,foggy,mist', moon: 'moon,moonlight',
    night: 'night,midnight', sunrise: 'morning,sunrise', sunset: 'sunset,evening,dusk', star: 'star,stars', rainbow: 'rainbow', umbrella: 'umbrella', wind: 'wind,windy',
    alarm: 'alarm,wake', event: 'meeting,appointment,schedule', note: 'note,notes,journal,diary', todo: 'todo,checklist', idea: 'idea,ideas', coffee: 'coffee,latte,cafe',
    tea: 'tea', cake: 'cake,birthday', fire: 'fire', sparkles: 'special', trophy: 'won,win,trophy,award', photo: 'photo,photos,selfie', item: 'package,box', recall: 'memory,memories',
    blossom: 'blossom,flower,flowers', tulip: 'tulip', sprout: 'sprout,seed', strawberry: 'strawberry', sunflower: 'sunflower', watermelon: 'watermelon', shell: 'beach,shell',
    icecream: 'icecream', leaf: 'leaf,leaves,autumn,fall', ginkgo: 'ginkgo', acorn: 'acorn', mushroom: 'mushroom', snowman: 'snowman', mitten: 'mitten,mittens,gloves',
    tangerine: 'orange,tangerine', snowflake: 'snowflake', book: 'book,books,reading,read', headphones: 'music,song,playlist,podcast', bread: 'bread,toast,bakery',
    rice: 'rice,lunch,dinner,meal', apple: 'apple', sneaker: 'run,running,walk,workout,jog', bicycle: 'bike,bicycle,cycling', bus: 'bus,commute', plane: 'flight,plane,trip,travel,airport',
    house: 'home,house', bed: 'sleep,bed,nap', heart: 'love,heart,thanks', gift: 'gift,present', letter: 'letter,mail,card', balloon: 'party,balloon', clover: 'lucky,luck',
    smile: 'happy,smile,glad', pencil: 'study,homework,exam,test', palette: 'art,drawing,painting', film: 'movie,film,show', gamepad: 'game,games,gaming', plant: 'plant,plants,garden',
    laptop: 'work,laptop,coding', bag: 'bag,school', key: 'key,keys', cat: 'cat,kitty', dog: 'dog,puppy', bird: 'bird,birds', tree: 'tree,trees,forest', mountain: 'mountain,hike,hiking',
    wave: 'wave,waves,surf,ocean,sea', butterfly: 'butterfly', fish: 'fish,fishing,aquarium'
  },
  ja: {
    sun: '晴れ,太陽,日差し', cloud: '曇り,雲', rain: '雨', snow: '雪', thunder: '雷', fog: '霧', moon: '月', night: '夜', sunrise: '朝,日の出', sunset: '夕焼け,夕方', star: '星',
    rainbow: '虹', umbrella: '傘', wind: '風,台風', alarm: '目覚まし', event: '予定,約束,会議,予約', note: 'メモ,日記', todo: 'やること', idea: 'アイデア', coffee: 'コーヒー,カフェ',
    tea: 'お茶,紅茶,緑茶', cake: 'ケーキ,誕生日', trophy: '優勝,合格', photo: '写真', recall: '思い出', blossom: '桜,花', tulip: 'チューリップ', sprout: '芽', strawberry: 'いちご',
    sunflower: 'ひまわり', watermelon: 'スイカ', shell: '海,貝', icecream: 'アイス', leaf: '紅葉,落ち葉', ginkgo: 'いちょう', acorn: 'どんぐり', mushroom: 'きのこ', snowman: '雪だるま',
    mitten: '手袋', tangerine: 'みかん', snowflake: '初雪', book: '本,読書', headphones: '音楽,歌', bread: 'パン', rice: 'ご飯,ランチ,お昼', apple: 'りんご', sneaker: '散歩,ランニング,運動',
    bicycle: '自転車', bus: 'バス,通勤', plane: '旅行,飛行機,空港', house: '家', bed: '昼寝,寝る', heart: '大好き,ありがとう', gift: 'プレゼント', letter: '手紙', balloon: 'パーティー',
    clover: '幸運', smile: '嬉しい,楽しい,幸せ', pencil: '勉強,宿題,試験', palette: '絵,美術', film: '映画,ドラマ', gamepad: 'ゲーム', plant: '植物,観葉植物', laptop: 'パソコン,仕事',
    bag: 'かばん,学校', key: '鍵', cat: '猫,ねこ', dog: '犬,いぬ', bird: '鳥', tree: '木,森', mountain: '山,登山', wave: '波', butterfly: '蝶', fish: '魚,釣り'
  },
  es: {
    sun: 'sol,soleado', cloud: 'nube,nublado', rain: 'lluvia,llueve', snow: 'nieve,nieva', thunder: 'tormenta,trueno', fog: 'niebla', moon: 'luna', night: 'noche', sunrise: 'mañana,amanecer',
    sunset: 'atardecer,tarde', star: 'estrella,estrellas', rainbow: 'arcoíris', umbrella: 'paraguas', wind: 'viento', alarm: 'alarma,despertador', event: 'reunión,cita', note: 'nota,notas,diario',
    idea: 'idea,ideas', coffee: 'café', tea: 'té', cake: 'pastel,tarta,cumpleaños', trophy: 'premio,gané', photo: 'foto,fotos', recall: 'recuerdo,recuerdos', blossom: 'flor,flores',
    tulip: 'tulipán', strawberry: 'fresa,fresas', sunflower: 'girasol', watermelon: 'sandía', shell: 'playa', icecream: 'helado', leaf: 'otoño,hojas', acorn: 'bellota', mushroom: 'seta,setas',
    snowman: 'muñeco', tangerine: 'naranja,mandarina', book: 'libro,libros,leer,lectura', headphones: 'música,canción', bread: 'pan', rice: 'arroz,almuerzo,comida,cena', apple: 'manzana',
    sneaker: 'correr,caminar,paseo,ejercicio', bicycle: 'bici,bicicleta', bus: 'autobús', plane: 'viaje,avión,aeropuerto', house: 'casa,hogar', bed: 'dormir,siesta,cama', heart: 'amor,gracias',
    gift: 'regalo', letter: 'carta', balloon: 'fiesta', clover: 'suerte', smile: 'feliz,alegría', pencil: 'estudiar,examen,deberes', palette: 'dibujo,pintura,arte', film: 'película,cine,serie',
    gamepad: 'juego,videojuego', plant: 'planta,plantas,jardín', laptop: 'trabajo,ordenador,portátil', bag: 'mochila,bolso,escuela', key: 'llave,llaves', cat: 'gato,gata', dog: 'perro,perrito',
    bird: 'pájaro,pájaros', tree: 'árbol,bosque', mountain: 'montaña', wave: 'mar,ola,olas', butterfly: 'mariposa', fish: 'pez,pesca'
  },
  fr: {
    sun: 'soleil,ensoleillé', cloud: 'nuage,nuageux', rain: 'pluie,pleut', snow: 'neige', thunder: 'orage,tonnerre', fog: 'brouillard', moon: 'lune', night: 'nuit', sunrise: 'matin,aube',
    sunset: 'soir,crépuscule', star: 'étoile,étoiles', rainbow: 'arc-en-ciel', umbrella: 'parapluie', wind: 'vent', alarm: 'réveil', event: 'réunion,rendez-vous', note: 'note,notes,journal',
    idea: 'idée,idées', coffee: 'café', tea: 'thé', cake: 'gâteau,anniversaire', trophy: 'gagné,prix', photo: 'photo,photos', recall: 'souvenir,souvenirs', blossom: 'fleur,fleurs',
    tulip: 'tulipe', strawberry: 'fraise,fraises', sunflower: 'tournesol', watermelon: 'pastèque', shell: 'plage', icecream: 'glace', leaf: 'automne,feuilles', acorn: 'gland', mushroom: 'champignon',
    snowman: 'bonhomme', tangerine: 'orange,clémentine', book: 'livre,livres,lire,lecture', headphones: 'musique,chanson', bread: 'pain,baguette,boulangerie', rice: 'riz,déjeuner,dîner,repas',
    apple: 'pomme', sneaker: 'courir,marche,balade,sport', bicycle: 'vélo', bus: 'bus', plane: 'voyage,avion,aéroport', house: 'maison', bed: 'dormir,sieste,lit', heart: 'amour,merci',
    gift: 'cadeau', letter: 'lettre', balloon: 'fête', clover: 'chance', smile: 'heureux,heureuse,content', pencil: 'étudier,examen,devoirs', palette: 'dessin,peinture,art', film: 'film,cinéma,série',
    gamepad: 'jeu,jeux', plant: 'plante,plantes,jardin', laptop: 'travail,ordinateur', bag: 'sac,école', key: 'clé,clés', cat: 'chat,chatte', dog: 'chien,chiot', bird: 'oiseau,oiseaux',
    tree: 'arbre,forêt', mountain: 'montagne,randonnée', wave: 'mer,vague,vagues', butterfly: 'papillon', fish: 'poisson,pêche'
  }
};
const IDX = {};
const index = lang => IDX[lang] ||= Object.entries(W[lang] || W.en).flatMap(([st, ws]) => ws.split(',').map(w => [w.toLowerCase(), st])).sort((a, b) => b[0].length - a[0].length);
const KO_TAIL = /^(이|가|은|는|을|를|도|에|에서|와|과|랑|이랑|의|로|으로|만|까지|부터|처럼|같이|하고|이다|였|이었|예요|이에요|야|아|)$/;
/* 글자 앞부분(커서까지)에서 마지막 낱말로 스티커 찾기 → { st, len } (len = 지울 필요 없는 낱말 길이, 위치 표시용) */
function suggest(before, lang) {
  const list = index(lang);
  if (lang === 'ja') { for (const [w, st] of list) if (before.endsWith(w)) return { st, word: w }; return null; }
  const m = /([\p{L}\p{M}'-]+)$/u.exec(before); if (!m) return null;
  const tok = m[1].toLowerCase();
  for (const [w, st] of list) {
    if (lang === 'ko') { if (tok.startsWith(w) && (tok.length > w.length ? KO_TAIL.test(tok.slice(w.length)) || w.length >= 2 && !/^[가-힣]/.test(tok.slice(w.length)) : true)) return { st, word: m[1] }; }
    else if (tok === w || tok === w + 's' || tok === w + 'es') return { st, word: m[1] };
  }
  return null;
}
export { suggest, W as STICKER_WORDS };
