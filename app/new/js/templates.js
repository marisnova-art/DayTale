// 템플릿 목록 (10-31): 이름 = 그 템플릿만의 디자인 용어 · 장면, 소개 = 3줄(생김새 · 셔플로 바뀌는 것 · 언제 좋은지). pop = 인기 순서(서버 사용 수가 쌓이기 전까지 우리가 정해요).
// 포맷(기본 · 디자인 · 아트) 안의 작품 하나하나. 나중에 관리자 '템플릿' 메뉴에서 오는 값과 같은 모양이에요.
// 태그 = 칩 · 메인 줄에 보이는 것 (템플릿마다 2~3개, 아래 TAGS 안에서만). words = 관련 검색어 (검색에만 써요, 안 보여요)
// 템플릿 틀 (11-06): 템플릿 하나 = 정보 한 줄 (서버 표 dz_templates, 관리자 '템플릿' 메뉴가 같은 표를 써요).
// 이름 · 종류 · 설명 · 태그 · 관련 검색어 · 유료 · 날짜 · 예시 3개 · 도구 · 모션 · 그림 파일 · 숨김/공개.
// 카드는 쓴 템플릿 id(card.tpl)를 저장해요. 그리는 틀(fmt)은 앱 안 코드라, 같은 틀로 템플릿을 여러 개 둘 수 있어요.
// 목록: 앱 안 기본값(아래) → 폰에 저장해 둔 서버 목록 → 앱을 열 때 서버에서 새로 받아요 (인터넷이 없으면 저장해 둔 것)
import * as S from './store.js';
import { sampleCard, FORMATS, failed, onFail } from './formats.js';

const BUILTIN = [
  { id: 'rebus', fmt: 'rebus', name: '멤피스 문장', kind: '디자인', pop: 2, added: '2026-10-21', motion: true,
    desc: ['80년대 이탈리아 멤피스 디자인처럼|물결선, 반원, 마름모가 낱말 옆에 붙어요.', '셔플할 때마다|도형 모양과 색이 새로 바뀌어요.', '짧은 하루 한 줄을|포스터처럼 남기고 싶을 때 좋아요.'], paid: true,
    tags: ['짧은글', '감성'], words: ['멤피스', '리버스', '그림 문장', '그림', '문장', '아이콘', '귀여운', '도형', '낱말', '알록달록', '포스터', '80년대'],
    ex: ['친구랑 통화를 <b>오래</b> 했다. 별일 없는 이야기에 <mark>웃음</mark>이 많은 밤.',
      '아침에 <b>창문</b>을 열었더니 공기가 <mark>차가웠다</mark>. 겨울이 오나 보다.',
      '<b>비</b> 오는 날엔 <mark>따뜻한</mark> 차 한 잔.'] },
  { id: 'art', fmt: 'art', name: '오로라 커튼', kind: '아트', pop: 1, added: '2026-10-23', motion: true,
    desc: ['오로라 그라데이션으로 그린 세로 빛줄기가|커튼처럼 천천히 흘러요.', '셔플할 때마다 새 빛이 번져요.', '늦은 밤|짧은 글과 잘 어울려요.'], paid: true,
    tags: ['밤', '감성'], words: ['오로라', '커튼', '그라데이션', '번지는 빛', '빛', '무지개', '몽환', '새벽', '네온', '번짐', '흐르는', '디지털 아트'],
    ex: [['창밖 불빛이 번지는 밤.', 11, '916'], ['퇴근길 하늘이 보라색이었다.', 42, '45'], ['오늘은 아무것도 하지 않아도 괜찮았다.', 77, '11']] },
];
// 시험 중 미리 보기 (11-20): 관리자에 '숨김'으로 올린 새 템플릿을 앤드류가 폰에서 써 볼 수 있게, 서버 목록에 아직 없으면 앞에 붙여요.
// 공개하면 서버 것이 대신해요(같은 id). 오픈 전에 DUMMY와 같이 꺼요
const PREVIEW = [
  { id: 'hilite', fmt: 'hilite', name: '하이라이트 문장', kind: '디자인', pop: 3, added: '2026-11-20', motion: true, paid: true,
    desc: ['공부하며 책에 표시하듯|형광펜, 박스, 밑줄, 동그라미가 낱말 위에 그어져요.', '셔플할 때마다|표시 자리와 색 조합이 새로 바뀌어요.', '짧은 한 줄도 긴 하루도|글 길이에 맞춰 크기가 맞춰져요.'],
    tags: ['짧은글', '감성'], words: ['하이라이트', '형광펜', '마커', '밑줄', '공부', '노트', '공책', '책', '표시', '동그라미', '박스', '점선', '물결', '에디토리얼'],
    ex: ['오늘 7시에 일어나서 강변까지 천천히 걸었다. 바람은 차가웠지만 머리가 맑아지는 아침이었다.',
      '점심에 회사 앞에 새로 생긴 국숫집에 갔다. 12시 10분인데 벌써 줄이 길었다. 기다린 보람이 있을 만큼 국물이 진했다.',
      '시험까지 딱 3주가 남았다. 아침 9시에 도서관 자리를 잡고 지난주에 틀린 문제부터 다시 풀었다. 처음엔 하나도 모르겠더니 두 번째 보니까 조금씩 길이 보였다. 내일도 오늘만큼만 하자.'],
    preview: true },
  { id: 'slit', fmt: 'slit', name: '노을 띠', kind: '아트', pop: 4, added: '2026-11-20', motion: true, paid: true,
    desc: ['슬릿스캔 사진처럼|가로 띠가 겹겹이 쌓인 풍경이 천천히 숨 쉬어요.', '셔플할 때마다|띠 모양과 색 묶음(노을 · 붉은 저녁 · 황금빛 · 새벽 · 밤 바다)이 바뀌어요.', '글자색은 배경 밝기에 맞춰|저절로 또렷해져요.'],
    tags: ['감성', '밤'], words: ['노을', '슬릿스캔', '띠', '줄무늬', '풍경', '하늘', '저녁', '바다', '숲', '도시', '겨울', '그라데이션', '필름'],
    ex: [['퇴근길 하늘이 이상하게 예뻐서 버스를 한 정거장 일찍 내렸다.', 5, '45'], ['새벽에 눈이 일찍 떠져서 창밖이 밝아오는 걸 오래 봤다.', 21, '916'], ['오늘은 걷기만 했는데도 좋은 하루였다.', 13, '11']],
    preview: true },
  { id: 'plasma', fmt: 'plasma', name: '플라즈마', kind: '아트', pop: 19, added: '2026-11-26', motion: true, paid: true,
    desc: ['바다 · 숲처럼 깊은 색이|빛이 번지듯 천천히 일렁여요.', '셔플할 때마다|물결 크기 · 방향 · 빛 번짐 · 색(11가지)이 바뀌어요.', '글 둘레는 은은하게 옅어져서|글이 또렷하게 읽혀요.'],
    tags: ['감성', '밤'], words: ['플라즈마', '그라데이션', '물결', '바다', '숲', '빛', '번짐', '오로라', '노을', '새벽', '안개', '몽환'],
    ex: [['오늘은 바다를 오래 보고 왔다.', 9, '45'], ['비 오는 오후, 창가에 앉아 음악을 들었다. 마음이 편했다.', 24, '916'], ['조용한 밤.', 43, '11']],
    preview: true },
  { id: 'pixel', fmt: 'pixel', name: '픽셀 체크', kind: '아트', pop: 18, added: '2026-11-26', motion: true, paid: true,
    desc: ['굵은 픽셀 바둑판이|물결처럼 천천히 자리를 바꿔요.', '셔플할 때마다|칸 크기 · 픽셀 크기 · 칸 모양 · 색(10가지)이 바뀌어요.', '글 둘레는 무늬가 연해져서|글이 또렷하게 읽혀요.'],
    tags: ['짧은글', '감성'], words: ['픽셀', '바둑판', '체크', '도트', '레트로', '게임', '디지털', '격자', '무지개', '패턴', '8비트', '모니터'],
    ex: [['오늘은 오래된 게임을 다시 해 봤다.', 7, '45'], ['비 오는 오후, 창가에 앉아 음악을 들었다. 마음이 편했다.', 22, '916'], ['작은 성공 하나.', 41, '11']],
    preview: true },
  { id: 'mesh', fmt: 'mesh', name: '형광 물결망', kind: '아트', pop: 17, added: '2026-11-26', motion: true, paid: true,
    desc: ['형광 선 그물이|천천히 녹듯이 흘러가요.', '셔플할 때마다|정돈된 그물 · 자유로운 그물 · 두 색 묶음(10가지)이 바뀌어요.', '글 자리는 선이 옅어져서|또렷하게 읽혀요.'],
    tags: ['감성', '밤'], words: ['네온', '형광', '그물', '물결', '선', '액체', '흐름', '패턴', '레이브', '밤', '클럽', '몽환'],
    ex: [['오늘은 음악을 크게 틀고 걸었다.', 8, '45'], ['새벽까지 친구들과 이야기를 나눴다. 시간이 순식간이었다.', 19, '916'], ['기분 좋은 피곤함.', 31, '11']],
    preview: true },
  { id: 'eclipse', fmt: 'eclipse', name: '빛 고리', kind: '아트', pop: 16, added: '2026-11-25', motion: true, paid: true,
    desc: ['번진 빛의 고리 안에|어두운 원이 비켜 선 초승달이에요.', '색이 고리를 따라 천천히 돌고,|셔플하면 방향 · 굵기 · 색 묶음(10가지)이 바뀌어요.', '글은 안쪽 원 가운데에|또렷하게 놓여요.'],
    tags: ['감성', '밤'], words: ['고리', '링', '일식', '초승달', '달', '무지개', '빛', '번짐', '그라데이션', '몽환', '우주', '밤'],
    ex: [['오늘 하늘이 유난히 맑았다.', 6, '45'], ['오래된 친구에게서 연락이 왔다. 반가웠다.', 15, '916'], ['조용한 밤, 혼자 차를 마셨다.', 22, '11']],
    preview: true },
  { id: 'tunnel', fmt: 'tunnel', name: '빛 터널', kind: '아트', pop: 15, added: '2026-11-25', motion: true, paid: true,
    desc: ['가운데 한 점에서|가는 빛줄기가 천천히 뻗어 나와요.', '셔플할 때마다|부채꼴 빛과 빛줄기 · 색 묶음(10가지)이 바뀌어요.', '글자색은 배경 밝기에 맞춰|저절로 또렷해져요.'],
    tags: ['감성', '밤'], words: ['터널', '빛', '빛줄기', '우주', '하이퍼스페이스', '속도', '별', '소실점', '네온', '몽환', '여행', '밤'],
    ex: [['오늘은 하루가 정말 빨리 지나갔다.', 10, '45'], ['새로운 일을 시작하는 첫날, 설레고 조금 떨렸다.', 4, '916'], ['밤하늘을 오래 올려다봤다.', 27, '11']],
    preview: true },
  { id: 'neon', fmt: 'neon', name: '네온 흐름', kind: '아트', pop: 14, added: '2026-11-25', motion: true, paid: true,
    desc: ['흐린 네온 빛이|부드러운 꼬리를 남기며 천천히 흘러요.', '셔플할 때마다|빛 덩어리 수와 흐르는 길 · 색 묶음(10가지)이 바뀌어요.', '글자색은 배경 밝기에 맞춰|저절로 또렷해져요.'],
    tags: ['감성', '밤'], words: ['네온', '빛', '흐름', '잔상', '꼬리', '밤', '도시', '불빛', '몽환', '그라데이션', '파스텔', '옵아트'],
    ex: [['늦은 밤 버스 창밖으로 불빛이 길게 흘러갔다.', 21, '45'], ['오늘은 음악을 크게 틀고 방 청소를 했다.', 3, '916'], ['아침 햇살이 커튼 사이로 들어왔다.', 18, '11']],
    preview: true },
  { id: 'swirl', fmt: 'swirl', name: '빛 소용돌이', kind: '아트', pop: 13, added: '2026-11-25', motion: true, paid: true,
    desc: ['가운데서 번지는 빛 둘레로|작은 반짝임이 천천히 돌아요.', '셔플할 때마다|소용돌이 모양과 물결 · 색(20가지)이 바뀌어요.', '글자색은 배경 밝기에 맞춰|저절로 또렷해져요.'],
    tags: ['감성', '밤'], words: ['소용돌이', '빛', '반짝임', '물결', '파장', '은하', '우주', '몽환', '그라데이션', '네온', '파스텔', '셰이더'],
    ex: [['창문을 열었더니 바람이 차가웠다. 따뜻한 차를 끓여 오래 마셨다.', 3, '45'], ['오늘은 아무것도 하지 않아도 괜찮은 날이었다.', 15, '916'], ['밤 산책길에 별이 유난히 많았다.', 37, '11']],
    preview: true },
  { id: 'pill', fmt: 'pill', name: '그라데이션 알약', kind: '디자인', pop: 5, added: '2026-11-25', motion: true, paid: true,
    desc: ['쓴 글의 낱말 몇 개가|두 색 그라데이션 알약에 담겨요.', '셔플할 때마다|알약 자리와 색 · 방향이 새로 바뀌어요.', '배경색은 칩으로 고르거나|직접 고른 색에 맞춰 어울리게.'],
    tags: ['짧은글', '감성'], words: ['그라데이션', '알약', '캡슐', '태그', '라벨', '파스텔', '컬러', '하이라이트', '키워드', '잡지', '포스터', '타이포'],
    ex: ['아침에 창문을 열었더니 공기가 차가웠다. 출근길에 따뜻한 라떼를 사서 공원을 한 바퀴 돌았다.', '오늘은 일이 일찍 끝나서 친구랑 저녁을 먹었다. 오랜만에 많이 웃었다.', '주말 내내 방 정리를 했다. 버릴 것과 남길 것을 나누다 보니 마음도 조금 가벼워졌다.'],
    preview: true },
  { id: 'dots', fmt: 'dots', name: '동그라미 목차', kind: '디자인', pop: 6, added: '2026-11-25', motion: true, paid: true,
    desc: ['문장마다 첫 글자가|색 동그라미 안에 들어가요.', '셔플할 때마다|동그라미 색과 줄바꿈이 새로 바뀌어요.', '한글은 한글, 영문은 영문 글자 그대로|잡지 목차처럼.'],
    tags: ['짧은글', '감성'], words: ['동그라미', '목차', '첫 글자', '이니셜', '잡지', '에디토리얼', '컬러', '원', '점', '타이포', '리스트', '하루 정리'],
    ex: ['아침에 창문을 열었더니 공기가 차가웠다. 출근길에 라떼를 샀다. 점심은 회사 앞 국숫집. 퇴근길 하늘이 예뻤다.', 'Woke up early and walked to the river. The air was cold but clear. Coffee with Mina at noon. Slept early.', '오늘은 쉬는 날. 늦잠을 잤다. 오후엔 책을 조금 읽었다. 저녁은 엄마랑 김밥.'],
    preview: true },
  { id: 'wave', fmt: 'wave', name: '물결 문장', kind: '디자인', pop: 7, added: '2026-11-25', motion: true, paid: true,
    desc: ['글자가 반듯한 줄 대신|곡선과 물결을 따라 흘러가요.', '셔플할 때마다|물결 모양과 기울인 글씨, 밑줄 자리가 바뀌어요.', '피드에서는|물결이 옆으로 천천히 지나가요.'],
    tags: ['짧은글', '감성'], words: ['물결', '곡선', '웨이브', '타이포', '포스터', '흐르는', '파도', '리듬', '손글씨', '자유로운', '밑줄', '이탤릭'],
    ex: ['오늘은 아침부터 비가 와서 우산을 쓰고 천천히 걸었다. 따뜻한 라떼를 마시며 창밖을 오래 봤다.', '퇴근길 하늘이 분홍색이었다. 버스를 한 정거장 일찍 내려서 걸어왔다.', '별일 없는 하루였지만 마음이 조용해서 좋았다.'],
    preview: true },
  { id: 'tower', fmt: 'tower', name: '글 탑', kind: '디자인', pop: 8, added: '2026-11-25', motion: true, paid: true,
    desc: ['쓴 글이 둥근 덩어리로 끊겨|굽이치는 탑처럼 쌓여요.', '날짜를 켜면|탑 끝에 휴대폰 언어로 날짜가 붙어요.', '피드에서는|탑이 위로 천천히 흘러 이어져요.'],
    tags: ['짧은글', '감성'], words: ['탑', '쌓기', '덩어리', '블록', '스티커', '라벨', '날짜', '포스터', '타이포', '세로', '흐르는', '말풍선'],
    ex: ['퇴근길 하늘이 분홍색이었다. 버스를 한 정거장 일찍 내려서 걸어왔다.', '오늘은 늦잠을 잤다. 오후엔 책을 조금 읽었다.', '친구랑 오래 통화했다. 별일 없는 이야기에 많이 웃었다.'],
    preview: true },
  { id: 'symbol', fmt: 'symbol', name: '기호 문장', kind: '디자인', pop: 9, added: '2026-11-25', motion: true, paid: true,
    desc: ['가늘고 큰 글씨 사이사이에|선으로 그린 기호가 끼어들어요.', '셔플할 때마다|기호 종류와 자리가 바뀌어요.', '피드에서는|기호만 살짝 움직여요.'],
    tags: ['짧은글', '감성'], words: ['기호', '심볼', '아이콘', '타이포', '포스터', '실험', '스마일', '화살표', '점선', '빗금', '모던', '그래픽'],
    ex: ['오늘은 아침부터 비가 와서 우산을 쓰고 천천히 걸었다. 강변 카페에서 따뜻한 라떼를 마시며 창밖을 오래 봤다.', '퇴근길 하늘이 분홍색이었다. 버스를 한 정거장 일찍 내려서 걸어왔다.', '별일 없는 하루였지만 마음이 조용해서 좋았다.'],
    preview: true },
  { id: 'label', fmt: 'label', name: '라벨 조각', kind: '디자인', pop: 10, added: '2026-11-25', motion: true, paid: true,
    desc: ['문장마다 끊어 흰 띠 라벨에 담고|카드 여기저기 붙여요.', '셔플할 때마다|라벨 자리와 줄 나눔이 바뀌어요.', '피드에서는|라벨이 테이프처럼 차례로 붙어요.'],
    tags: ['짧은글', '감성'], words: ['라벨', '테이프', '스티커', '띠', '조각', '포스터', '타이포', '콜라주', '레터링', '굵은', '빨강', '메모'],
    ex: ['대부분의 사람은 딱 맞는 때를 기다리다 하루를 보낸다. 오늘은 그냥 해 보기로 했다. 퇴근길 버스 대신 한 정거장 걸었다.', '비 오는 아침 강변 카페. 라떼 한 잔. 창밖을 오래 봤다.', '친구랑 오래 통화했다. 별일 없는 이야기에 많이 웃었다.'],
    preview: true },
  { id: 'typer', fmt: 'typer', name: '타자 메모', kind: '디자인', pop: 11, added: '2026-11-25', motion: true, paid: true,
    desc: ['타자기 글씨로 쓴 글이|점으로 찍힌 바랜 풍경 위에 놓여요.', '셔플하면|숲 · 바다 · 들판 · 산 · 구름 하늘이 바뀌어요.', '피드에서는|글자가 타자 치듯 한 자씩 찍혀요.'],
    tags: ['짧은글', '감성'], words: ['타자기', '타이핑', '메모', '레트로', '빈티지', '고정폭', '풍경', '바랜', '노랑', '종이', '편지', '디더링', '숲', '바다'],
    ex: ['아침에 창문을 열었더니 공기가 차가웠다. 출근길에 따뜻한 라떼를 샀다. 퇴근길 하늘이 분홍색이었다.', '친구랑 오래 통화했다. 별일 없는 이야기에 많이 웃었다.', 'Slow Sunday. Coffee by the window, a long walk by the river.'],
    preview: true },
  { id: 'vset', fmt: 'vset', name: '비디오 세팅', kind: '디자인', pop: 13, added: '2026-11-25', motion: true, paid: true,
    desc: ['내 하루가 옛 비디오|설정 화면처럼 보여요.', '셔플할 때마다|반전 낱말과 켜진 탭이 바뀌어요.', '피드에서는|▶와 녹화 점이 깜빡이고 초가 흘러요.'],
    tags: ['짧은글', '감성'], words: ['비디오', '레트로', '픽셀', '화면', '메뉴', '설정', '테이프', '파랑', '녹화', '재생', '게임', '도트'],
    ex: ['아침에 창문을 열었더니 공기가 차가웠다. 출근길에 따뜻한 라떼를 샀다. 퇴근길 하늘이 분홍색이었다.', '친구랑 오래 통화했다. 별일 없는 이야기에 많이 웃었다.', 'Slow Sunday. Coffee by the window and a long walk by the river.'],
    preview: true },
];

// 테스트용 더미 (10-31 앤드류: 2개로는 전체 볼륨을 몰라요). 같은 두 템플릿을 그림 · 태그 · 날짜만 바꿔 채워요. 오픈 전에 false
const DUMMY = true;   // 오픈 전에 false (런치 체크리스트)
const dummies = base => {
  const TG = [['밤', '감성'], ['비', '짧은글'], ['아침', '감성'], ['겨울', '밤'], ['가을', '짧은글'], ['눈', '감성'], ['봄', '아침'], ['여름', '비']], out = [];
  const two = ['rebus', 'art'].map(id => base.find(t => t.id === id) || BUILTIN.find(t => t.id === id));
  for (let i = 0; i < 16; i++) {
    const b = two[i % 2], ex = Array.isArray(b.ex[0]) ? b.ex.map(([t, sd, r]) => [t, (sd + i * 23) % 97, r]) : [...b.ex.slice(i % 3), ...b.ex.slice(0, i % 3)];
    out.push({ ...b, id: `${b.id}-${i + 1}`, pop: 3 + ((i * 7) % 16), added: `2026-10-${String(20 - i).padStart(2, '0')}`, tags: TG[i % TG.length], ex, dummy: true });
  }
  return out;
};

// 보이는 목록 (공개만). 배열은 그대로 두고 안의 것만 바꿔요 (다른 파일이 같은 배열을 봐요)
export const TEMPLATES = [];
const KNOWN = new Map();   // 지금 안 보여도(숨김 등) 내 카드 이름표를 찾을 수 있게 본 적 있는 것 전부
const CK = 'dz.tpl.v1';
// 서버 한 줄 → 앱 모양. 그리는 틀이 이 앱에 없으면(앱이 더 오래됨) 빼요
function fromRow(r) {
  if (!r || !r.id || !/^[a-z0-9-]{2,40}$/.test(r.fmt || '') || failed(r.fmt) || !r.name) return null;   // 틀은 볼 때 불러와요 (폴더가 없으면 그때 빼요)
  const arr = (v, d = []) => Array.isArray(v) ? v : d;
  const ex = arr(r.ex); if (!ex.length) return null;
  return { id: r.id, fmt: r.fmt, kind: r.kind, name: r.name, desc: arr(r.descr ?? r.desc), tags: arr(r.tags), words: arr(r.words), ex,
    tools: r.tools && typeof r.tools === 'object' ? r.tools : {}, assets: r.assets || {}, paid: !!r.paid, motion: !!r.motion,
    pop: r.pop ?? 99, sort: r.sort ?? 0, added: String(r.added || '2026-01-01').slice(0, 10),
    thumb: typeof r.assets?.thumb === 'string' ? r.assets.thumb : '' };   // 목록용 정지 그림 (공개할 때 자동으로 만들어요)
}
function use(list) {
  const base = list.length ? list : BUILTIN, pre = DUMMY ? PREVIEW.filter(t => !base.some(b => b.id === t.id)) : [];
  TEMPLATES.splice(0, TEMPLATES.length, ...pre, ...base, ...(DUMMY ? dummies(base) : []));
  TEMPLATES.forEach(t => KNOWN.set(t.id, t));
}
[...BUILTIN, ...PREVIEW].forEach(t => KNOWN.set(t.id, t));
// 이 앱에 그 틀 폴더가 없으면(서버가 앞서 감) 목록에서 빼요
onFail(f => { const n = TEMPLATES.length; for (let i = TEMPLATES.length - 1; i >= 0; i--) if (TEMPLATES[i].fmt === f) TEMPLATES.splice(i, 1); if (TEMPLATES.length !== n) onUpd?.(); });
try { const c = JSON.parse(localStorage.getItem(CK) || 'null'); use((c?.rows || []).map(fromRow).filter(Boolean)); } catch { use([]); }

// 서버에서 받아 오기 (공개만). 1,000개가 넘어도 가볍게: 먼저 id · 고친 때만 받고(작아요), 새로 생기거나 바뀐 것만 내용을 받아요.
// 서버 목록에 없는 건(숨김 · 지움) 폰 사본에서도 빼요. 표가 아직 없거나 비었으면 앱 안 기본값 그대로
let onUpd = null;
export const onUpdate = f => { onUpd = f; };
export async function refresh() {
  const C = window.APP_CONFIG || {};
  if (!/^https:\/\//.test(C.SUPABASE_URL || '') || !C.SUPABASE_ANON_KEY) return false;
  const rest = tb => q => fetch(`${C.SUPABASE_URL}/rest/v1/${tb}?${q}`, { headers: { apikey: C.SUPABASE_ANON_KEY, authorization: `Bearer ${C.SUPABASE_ANON_KEY}` } }).then(r => r.ok ? r.json() : Promise.reject(r.status));
  const get = rest('dz_templates'), getK = rest('dz_kinds'), getT = rest('dz_tags');
  try {
    try {   // 종류 순서 (작아요). 표가 없으면 그대로
      const ks = await getK('select=name&order=sort.asc');
      if (Array.isArray(ks) && ks.length) { KORDER = ks.map(k => k.name).filter(Boolean); localStorage.setItem(KK, JSON.stringify(KORDER)); }
    } catch {}
    try {   // 태그 목록 · 순서 · 이때 앞으로 (작아요). 표가 없으면 그대로
      const ts = await getT('select=id,cond&order=sort.asc');
      if (Array.isArray(ts) && ts.length) { TAGS = tagsFrom(ts); localStorage.setItem(TK, JSON.stringify(ts)); }
    } catch {}
    const ids = await get('select=id,updated_at&state=eq.public&limit=5000');
    if (!Array.isArray(ids) || !ids.length) return false;
    let cache = {}; try { cache = JSON.parse(localStorage.getItem(CK) || '{}'); } catch {}
    const have = new Map((cache.rows || []).map(r => [r.id, r]));
    const want = ids.filter(x => have.get(x.id)?.updated_at !== x.updated_at).map(x => x.id);
    for (let i = 0; i < want.length; i += 100) {   // 바뀐 것만 100개씩
      const part = want.slice(i, i + 100).map(id => `"${id}"`).join(',');
      (await get(`select=*&state=eq.public&id=in.(${encodeURIComponent(part)})`)).forEach(r => have.set(r.id, r));
    }
    const live = new Set(ids.map(x => x.id));
    const rows = [...have.values()].filter(r => live.has(r.id)).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || String(b.added).localeCompare(String(a.added)));
    const list = rows.map(fromRow).filter(Boolean); if (!list.length) return false;
    const was = JSON.stringify(TEMPLATES.filter(t => !t.dummy));
    try { localStorage.setItem(CK, JSON.stringify({ at: Date.now(), rows })); } catch {}
    use(list);
    if (JSON.stringify(TEMPLATES.filter(t => !t.dummy)) !== was) onUpd?.();
    return true;
  } catch { return false; }
}

// 종류 (11-06): 디자인 · 아트 … 관리자가 정하는 목록 (서버 표 dz_kinds: 이름 · 순서). 새 종류를 넣으면 칩 · 홈 줄 · 프로필 그래프가 저절로 따라와요.
// 보이는 건 공개 템플릿이 1개 이상 있는 종류만. 목록에 없는 종류를 쓴 템플릿은 맨 뒤에 붙어요
const KK = 'dz.kinds.v1';
let KORDER = ['디자인', '아트'];
try { const k = JSON.parse(localStorage.getItem(KK) || 'null'); if (Array.isArray(k) && k.length) KORDER = k; } catch {}
export function kinds() {
  const used = [...new Set(TEMPLATES.map(t => t.kind).filter(Boolean))];
  return [...KORDER.filter(k => used.includes(k)), ...used.filter(k => !KORDER.includes(k))];
}
// '디자인 멤피스 문장' → '멤피스 문장' (프로필 '자주 쓴 템플릿')
export const stripKind = s => { const k = [...KORDER, ...kinds()].find(k => s.startsWith(k + ' ')); return k ? s.slice(k.length + 1) : s; };

// 칩 · 메인 줄 키워드. when = 이때 앞으로 와요 (날씨 · 시간 · 계절)
// 11-06: 관리자 '템플릿 > 종류 · 태그'에서 고쳐요 (서버 표 dz_tags: id · cond · sort). 아래는 표가 없거나 못 받을 때 기본값
export let TAGS = [
  { id: '밤', when: { time: ['evening', 'night'] } },
  { id: '비', when: { wx: ['rain', 'thunder'] } },
  { id: '눈', when: { wx: ['snow'] } },
  { id: '아침', when: { time: ['morning'] } },
  { id: '겨울', when: { season: ['winter'] } },
  { id: '봄', when: { season: ['spring'] } },
  { id: '여름', when: { season: ['summer'] } },
  { id: '가을', when: { season: ['autumn'] } },
  { id: '짧은글' }, { id: '감성' },
];
const TK = 'dz.tags.v1';
const tagsFrom = rows => rows.filter(r => r && r.id).map(r => r.cond && Object.keys(r.cond).length ? { id: r.id, when: r.cond } : { id: r.id });
try { const t = JSON.parse(localStorage.getItem(TK) || 'null'); if (Array.isArray(t) && t.length) TAGS = tagsFrom(t); } catch {}

export const tpl = id => TEMPLATES.find(t => t.id === id) || KNOWN.get(id);
// 카드의 템플릿: 저장한 id → (예전 카드) 같은 틀의 첫 템플릿
export const tplOfCard = c => !c || c.fmt === 'text' ? null : (c.tpl && KNOWN.get(c.tpl)) || TEMPLATES.find(t => t.fmt === c.fmt && !t.dummy) || [...KNOWN.values()].find(t => t.fmt === c.fmt);
// 카드 이름표: '기본' 또는 '디자인 · 멤피스 문장'
export const labelOf = c => { if (!c) return ''; if (c.fmt === 'text') return '기본'; const t = tplOfCard(c); return t ? `${t.kind} · ${t.name}` : ''; };
// 이 카드를 쓸 때 도구: 틀 기본값 + 템플릿이 바꾼 것
export const toolsOf = c => ({ ...(FORMATS[c?.fmt]?.tools || {}), ...(tplOfCard(c)?.tools || {}) });

// 지금: 시간대 · 계절 · 날씨(예전 앱이 남긴 값)
export function now(d = new Date()) {
  const h = d.getHours(), m = d.getMonth() + 1;
  let wx = null; try { const w = JSON.parse(localStorage.getItem('daytale.wx') || 'null'); if (w && Date.now() - w.at < 3 * 3600e3) wx = w.kind; } catch {}
  return { time: h >= 5 && h < 11 ? 'morning' : h < 17 ? 'day' : h < 21 ? 'evening' : 'night',
    season: m >= 3 && m <= 5 ? 'spring' : m <= 8 && m >= 6 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter', wx };
}
// 이 태그가 지금과 얼마나 맞는지: 날씨 3 · 시간 2 · 계절 1
const fit = (t, n) => !t.when ? 0 : (t.when.wx?.includes(n.wx) ? 3 : 0) + (t.when.time?.includes(n.time) ? 2 : 0) + (t.when.season?.includes(n.season) ? 1 : 0);

// 칩 순서: 지금 맞는 것 최대 2개 → 내가 자주 쓰는 것 → 나머지 (정해 둔 순서). 템플릿이 하나도 없는 태그는 빼요
export function tagOrder(n = now()) {
  const used = new Set(TEMPLATES.flatMap(t => t.tags));
  const live = TAGS.filter(t => used.has(t.id));
  const hot = live.map(t => [t, fit(t, n)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0].id);
  const cnt = {}; S.cards().forEach(c => tplOfCard(c)?.tags.forEach(g => { cnt[g] = (cnt[g] || 0) + 1; }));
  const mine = live.map(t => t.id).filter(g => cnt[g] && !hot.includes(g)).sort((a, b) => cnt[b] - cnt[a]);
  return [...hot, ...mine, ...live.map(t => t.id).filter(g => !hot.includes(g) && !mine.includes(g))];
}
// 지금 맞는 템플릿 점수 (태그 중 가장 잘 맞는 것)
const score = (t, n) => Math.max(0, ...t.tags.map(g => fit(TAGS.find(x => x.id === g) || {}, n)));
const dayNo = () => Math.floor(new Date(S.today() + 'T00:00:00').getTime() / 864e5);

// 위 판 3장: 오늘 무료(유료 사용자는 오늘 추천) · 지금 추천 · 새로 나온. 같은 템플릿은 한 번만
export function heroes(n = now()) {
  const paid = TEMPLATES.filter(t => t.paid);
  const best = Math.max(...paid.map(t => score(t, n)));
  const pool = paid.filter(t => score(t, n) === best);
  const free = pool[dayNo() % pool.length];   // 날마다 하나, 그날은 그대로 (사용자가 고르지 않아요)
  const out = free ? [{ k: 'free', t: free }] : [];   // 유료 템플릿이 없으면 '오늘 무료' 판은 빼요
  const rec = TEMPLATES.filter(t => t !== free).sort((a, b) => score(b, n) - score(a, n))[0];
  if (rec) out.push({ k: 'now', t: rec });
  const nw = newest().find(t => !out.some(o => o.t === t));
  if (nw) out.push({ k: 'new', t: nw });
  return out;
}
export const newest = () => [...TEMPLATES].sort((a, b) => b.added.localeCompare(a.added));
// 내가 쓴 카드 수 (템플릿별)
export const mineCount = () => { const n = {}; S.cards().forEach(c => { const t = tplOfCard(c); if (t) n[t.id] = (n[t.id] || 0) + 1; }); return n; };
// 줄 탭 순서: 새로 나온(30일 안) · 인기 · 자주 쓴(내가 쓴 것만)
export function sorted(k) {
  if (k === 'pop') return [...TEMPLATES].sort((a, b) => (a.pop || 99) - (b.pop || 99));
  if (k === 'mine') { const n = mineCount(); return TEMPLATES.filter(t => n[t.id]).sort((a, b) => n[b.id] - n[a.id]); }
  return newest().filter(t => (new Date(S.today()) - new Date(t.added)) / 864e5 <= 30);
}

// 예시 카드 (작은 칸: 아트는 글 없이, 디자인은 글 그대로). i = 몇 번째 예시
// rnd (92차, 앤드류): 템플릿 홈 · 고르기 칸은 볼 때마다 다른 색 조합 · 그림 (씨앗을 바꿔요)
export function exCard(t, i = 0, bare = false, rnd = 0) {
  const c = sampleCard(t.fmt, S.today()); const e = t.ex[i % t.ex.length]; c.tpl = t.id;
  if (typeof e === 'string') { c.html = e; c.seed = rnd || 7 + i * 14; if (!bare || rnd) c.pal = undefined; return c; }   // 한 덩어리 글 (디자인). 예시마다 색 조합도 달라요, 정지 그림(bare)은 틀이 정한 색 (91차)
  const [txt, seed, ratio] = e;
  c.pages = [bare ? '' : txt]; c.bg = { ...c.bg, seed: rnd || seed }; if (!bare && ratio) c.ratio = ratio;
  return c;
}
// 소개 줄의 | = 줄이 넘칠 때 내려갈 자리 (뜻이 끊기지 않게). 화면에선 안 보여요
export const line = d => d.replace(/\|/g, ' ');
// 검색: 이름 · 종류 · 설명 · 태그 · 검색어
export const hit = (t, q) => !q || [t.name, t.kind, ...t.desc.map(line), ...t.tags, ...t.words].some(s => s.toLowerCase().includes(q.toLowerCase()));

export const favs = () => S.pref('favT', []);
export const isFav = id => favs().includes(id);
export const toggleFav = id => { const f = favs(); S.setPref('favT', f.includes(id) ? f.filter(x => x !== id) : [id, ...f]); return !f.includes(id); };
