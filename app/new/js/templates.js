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
  { id: 'rebus', fmt: 'rebus', name: '멤피스 타이포', kind: '디자인', pop: 2, added: '2026-10-21', motion: true,
    desc: ['물결선 · 반원 · 마름모가 낱말 곁에 붙는 80년대 멤피스 스타일 타이포.', '셔플 한 번에 새로운 도형과 색,', '하루 한 줄을 포스터처럼.'], paid: true,
    tags: ['짧은글', '감성'], words: ['멤피스', '리버스', '그림 문장', '그림', '문장', '아이콘', '귀여운', '도형', '낱말', '알록달록', '포스터', '80년대'],
    ex: ['친구랑 통화를 <b>오래</b> 했다. 별일 없는 이야기에 <mark>웃음</mark>이 많은 밤.',
      '아침에 <b>창문</b>을 열었더니 공기가 <mark>차가웠다</mark>. 겨울이 오나 보다.',
      '<b>비</b> 오는 날엔 <mark>따뜻한</mark> 차 한 잔.'] },
  { id: 'art', fmt: 'art', name: '오로라 커튼', kind: '아트', pop: 1, added: '2026-10-23', motion: true,
    desc: ['오로라 빛줄기가 커튼처럼 천천히 흐르는 아트.', '셔플마다 새로 번지는 빛,', '늦은 밤 짧은 글과 어울리는 분위기.'], paid: true,
    tags: ['밤', '감성'], words: ['오로라', '커튼', '그라데이션', '번지는 빛', '빛', '무지개', '몽환', '새벽', '네온', '번짐', '흐르는', '디지털 아트'],
    ex: [['창밖 불빛이 번지는 밤.', 11, '916'], ['퇴근길 하늘이 보라색이었다.', 42, '45'], ['오늘은 아무것도 하지 않아도 괜찮았다.', 77, '11']] },
];
// 시험 중 미리 보기 (11-20): 관리자에 '숨김'으로 올린 새 템플릿을 앤드류가 폰에서 써 볼 수 있게, 서버 목록에 아직 없으면 앞에 붙여요.
// 공개하면 서버 것이 대신해요(같은 id). 오픈 전에 DUMMY와 같이 꺼요
const PREVIEW = [
  { id: 'hilite', fmt: 'hilite', name: '하이라이트 노트', kind: '디자인', pop: 3, added: '2026-11-20', motion: true, paid: true,
    desc: ['형광펜 · 박스 · 밑줄 · 동그라미로 책에 표시하듯 꾸민 노트.', '셔플마다 새로운 표시 자리와 색 조합,', '글 길이에 맞춘 글자 크기까지.'],
    tags: ['짧은글', '감성'], words: ['하이라이트', '형광펜', '마커', '밑줄', '공부', '노트', '공책', '책', '표시', '동그라미', '박스', '점선', '물결', '에디토리얼'],
    ex: ['오늘 7시에 일어나서 강변까지 천천히 걸었다. 바람은 차가웠지만 머리가 맑아지는 아침이었다.',
      '점심에 회사 앞에 새로 생긴 국숫집에 갔다. 12시 10분인데 벌써 줄이 길었다. 기다린 보람이 있을 만큼 국물이 진했다.',
      '시험까지 딱 3주가 남았다. 아침 9시에 도서관 자리를 잡고 지난주에 틀린 문제부터 다시 풀었다. 처음엔 하나도 모르겠더니 두 번째 보니까 조금씩 길이 보였다. 내일도 오늘만큼만 하자.'],
    preview: true },
  { id: 'slit', fmt: 'slit', name: '슬릿스캔', kind: '아트', pop: 4, added: '2026-11-20', motion: true, paid: true,
    desc: ['가로 띠가 겹겹이 쌓인 풍경이 천천히 숨 쉬는 슬릿스캔 아트.', '셔플마다 새로운 띠 모양과 색 묶음,', '노을 · 황금빛 · 새벽 · 밤 바다까지.'],
    tags: ['감성', '밤'], words: ['노을', '슬릿스캔', '띠', '줄무늬', '풍경', '하늘', '저녁', '바다', '숲', '도시', '겨울', '그라데이션', '필름'],
    ex: [['퇴근길 하늘이 이상하게 예뻐서 버스를 한 정거장 일찍 내렸다.', 5, '45'], ['새벽에 눈이 일찍 떠져서 창밖이 밝아오는 걸 오래 봤다.', 21, '916'], ['오늘은 걷기만 했는데도 좋은 하루였다.', 13, '11']],
    preview: true },
  { id: 'float', fmt: 'float', name: '플로팅 셰이프', kind: '아트', pop: 33, added: '2026-11-26', motion: true, paid: true,
    desc: ['면마다 색이 다른 3D 도형들이 공간에 둥실 떠 있는 그림.', '셔플마다 구름 · 구 · 스파이럴 · 고리 배치와 색,', '무리 전체가 천천히 돌고 도형마다 자전하는 모션.'],
    tags: ['감성', '짧은글'], words: ['도형', '3D', '우주', '둥실', '입체', '큐브', '구슬', '도넛', '장난감', '꿈', '기분', '추상'],
    ex: [['오늘은 아무 생각 없이 창밖만 보았다. 구름이 천천히 흘렀다.', 10, '45'], ['오후 내내 카페에 앉아 있었다. 창에 비친 불빛들이 번지고 겹치면서 둥실 떠다니듯 보였다.', 21, '916'], ['둥실한 하루.', 30, '11']],
    preview: true },
  { id: 'liquid', fmt: 'liquid', name: '리퀴드', kind: '아트', pop: 32, added: '2026-11-26', motion: true, paid: true,
    desc: ['녹아 엉긴 광택 액체 덩어리가 카드를 채운 그림.', '셔플마다 새로운 덩어리 · 휘는 정도 · 색,', '덩어리가 천천히 녹아 흐르는 모션.'],
    tags: ['감성', '짧은글'], words: ['액체', '녹다', '흐름', '광택', '물감', '용암', '젤리', '쨍한', '꿈', '기분', '몽환', '추상'],
    ex: [['오늘은 아무 생각 없이 창밖만 보았다. 구름이 천천히 흘렀다.', 10, '45'], ['오후 내내 카페에 앉아 있었다. 창에 비친 불빛들이 번지고 겹치면서 녹아내리듯 보였다.', 21, '916'], ['녹아내린 하루.', 30, '11']],
    preview: true },
  { id: 'field', fmt: 'field', name: '컬러 필드', kind: '아트', pop: 31, added: '2026-11-26', motion: true, paid: true,
    desc: ['크고 작은 색 블록이 빈틈없이 맞물린 쨍한 색면 그림.', '셔플마다 새로운 블록 배치 · 칠 · 색,', '블록마다 그라데이션이 천천히 도는 모션.'],
    tags: ['감성', '짧은글'], words: ['색', '블록', '색면', '그라데이션', '모자이크', '쨍한', '네온', '원색', '조각', '기분', '팝', '추상'],
    ex: [['오늘은 아무 생각 없이 창밖만 보았다. 구름이 천천히 흘렀다.', 10, '45'], ['오후 내내 카페에 앉아 있었다. 창에 비친 불빛들이 번지고 겹치면서 색 조각처럼 보였다.', 21, '916'], ['쨍한 하루.', 32, '11']],
    preview: true },
  { id: 'lens', fmt: 'lens', name: '웨이브 렌즈', kind: '아트', pop: 30, added: '2026-11-26', motion: true, paid: true,
    desc: ['원 밖은 흐르는 물결, 원 안은 팽팽한 직선으로 펴지는 빛의 줄무늬.', '셔플마다 물결 스타일 · 선 종류 · 색,', '물결이 흐르고 원이 숨 쉬는 모션.'],
    tags: ['감성', '짧은글'], words: ['물결', '원', '렌즈', '빛', '줄무늬', '네온', '질서', '변화', '고요', '파동', '밤', '추상'],
    ex: [['오늘은 아무 생각 없이 창밖만 보았다. 구름이 천천히 흘렀다.', 11, '45'], ['오후 내내 카페에 앉아 있었다. 창에 비친 불빛들이 번지고 겹치면서 물결처럼 보였다.', 24, '916'], ['고요한 하루.', 33, '11']],
    preview: true },
  { id: 'blob', fmt: 'blob', name: '컬러 블롭', kind: '아트', pop: 29, added: '2026-11-26', motion: true, paid: true,
    desc: ['몽글몽글한 색 얼룩이 색띠를 두르며 퍼진 열화상 같은 그림.', '셔플마다 새로운 얼룩 · 크기 · 색,', '잔잔히 흐르며 숨 쉬듯 부풀었다 가라앉는 모션.'],
    tags: ['감성', '짧은글'], words: ['얼룩', '색', '열화상', '번짐', '물감', '몽글', '파스텔', '네온', '꿈', '기분', '온도', '추상'],
    ex: [['오늘은 아무 생각 없이 창밖만 보았다. 구름이 천천히 흘렀다.', 10, '45'], ['오후 내내 카페에 앉아 있었다. 창에 비친 불빛들이 번지고 겹쳐서 색 덩어리처럼 보였다.', 23, '916'], ['몽글한 하루.', 34, '11']],
    preview: true },
  { id: 'city', fmt: 'city', name: '3D 시티', kind: '아트', pop: 28, added: '2026-11-26', motion: true, paid: true,
    desc: ['높낮이가 다른 빌딩 숲을 위에서 내려다본 입체 도시.', '셔플마다 새로운 배치 · 거리 · 각도 · 색,', '카메라가 천천히 돌고 색이 섞이는 모션.'],
    tags: ['감성', '밤'], words: ['도시', '빌딩', '야경', '전망대', '퇴근', '야근', '입체', '안개', '건물', '거리', '하늘', '네온'],
    ex: [['야근하고 나오니 도시가 조용했다. 빌딩 불빛만 남아 있었다.', 10, '45'], ['오랜만에 전망대에 올라갔다. 빌딩들이 장난감처럼 작게 보였다.', 21, '916'], ['도시의 밤.', 32, '11']],
    preview: true },
  { id: 'spec', fmt: 'spec', name: '스펙트럼 커브', kind: '아트', pop: 27, added: '2026-11-26', motion: true, paid: true,
    desc: ['모서리에서 활처럼 휘어 퍼지는 매끈한 색띠.', '셔플마다 새로운 방향 · 휘는 정도 · 색,', '색이 띠를 따라 천천히 흐르는 모션.'],
    tags: ['감성', '짧은글'], words: ['스펙트럼', '무지개', '그라데이션', '색', '노을', '하늘', '빛', '파스텔', '흐름', '곡선', '꿈', '추상'],
    ex: [['해 질 녘에 강가를 걸었다. 하늘 색이 천천히 바뀌었다.', 10, '45'], ['퇴근길에 하늘이 분홍에서 보라로, 다시 파랑으로 천천히 바뀌었다.', 21, '916'], ['물든 하루.', 35, '11']],
    preview: true },
  { id: 'wint', fmt: 'wint', name: '웨이브 인터퍼런스', kind: '아트', pop: 26, added: '2026-11-26', motion: true, paid: true,
    desc: ['가로 물결과 세로 물결이 겹쳐 빛나는 간섭무늬.', '셔플마다 차분한 파도 · 전기장 · 코스모스 · 네온 결과 색,', '물결이 엇갈리며 흐르고 잔상이 남는 모션.'],
    tags: ['감성', '밤'], words: ['물결', '파동', '간섭', '빛', '네온', '전기', '우주', '바다', '리듬', '모아레', '흐름', '추상'],
    ex: [['오늘은 바닷가에 오래 앉아 물결을 보았다.', 13, '45'], ['퇴근길에 비가 그쳤다. 웅덩이에 가로등 불빛이 번지고, 작은 물결이 겹쳐 무늬가 생겼다.', 31, '916'], ['잔잔한 하루.', 52, '11']],
    preview: true },
  { id: 'bmod', fmt: 'bmod', name: '블록 모더니즘', kind: '아트', pop: 25, added: '2026-11-26', motion: true, paid: true,
    desc: ['판과 기둥 모양 박스가 겹겹이 쌓인 입체 구성.', '셔플마다 새로운 배치 · 각도 · 색,', '천천히 돌며 숨 쉬는 박스 모션.'],
    tags: ['감성', '밤'], words: ['블록', '박스', '모더니즘', '건축', '입체', '기하학', '구성', '빛', '그림자', '미술관', '도시', '추상'],
    ex: [['새로 지은 미술관에 다녀왔다.', 15, '45'], ['비 오는 오후, 창가에 앉아 음악을 들었다. 마음이 편했다.', 30, '916'], ['반듯한 하루.', 49, '11']],
    preview: true },
  { id: 'ccomp', fmt: 'ccomp', name: '큐브 컴포지션', kind: '아트', pop: 24, added: '2026-11-26', motion: true, paid: true,
    desc: ['크고 작은 입체 상자가 격자를 빈틈없이 채운 기하학 구성.', '셔플마다 새로운 격자 · 상자 크기 · 색,', '두께가 물결처럼 깊어지는 모션.'],
    tags: ['짧은글', '감성'], words: ['큐브', '상자', '격자', '기하학', '입체', '패턴', '모자이크', '바우하우스', '구성', '블록', '정리', '레트로'],
    ex: [['오늘은 방을 정리하고 상자들을 차곡차곡 쌓았다.', 14, '45'], ['비 오는 오후, 창가에 앉아 음악을 들었다. 마음이 편했다.', 29, '916'], ['차곡차곡.', 48, '11']],
    preview: true },
  { id: 'cube', fmt: 'cube', name: '미니멀 큐브', kind: '아트', pop: 23, added: '2026-11-26', motion: true, paid: true,
    desc: ['빈 스튜디오 바닥 위에 놓인 단색 큐브 하나.', '셔플마다 새로운 크기 · 자리 · 각도 · 색,', '공간이 함께 돌고 큐브가 구르는 모션.'],
    tags: ['짧은글', '감성'], words: ['큐브', '미니멀', '3D', '정육면체', '스튜디오', '그림자', '단순', '여백', '오브제', '보색', '조용', '정리'],
    ex: [['책상을 비우고 컵 하나만 올려 두었다.', 13, '45'], ['비 오는 오후, 창가에 앉아 음악을 들었다. 마음이 편했다.', 28, '916'], ['단순하게.', 47, '11']],
    preview: true },
  { id: 'gband', fmt: 'gband', name: '그라데이션 밴드', kind: '아트', pop: 22, added: '2026-11-26', motion: true, paid: true,
    desc: ['세로 띠마다 빛이 수평선으로 모여드는 대칭 그라데이션.', '셔플마다 새로운 띠 수 · 물결 폭 · 색,', '옆으로 천천히 흐르는 물결 모션.'],
    tags: ['감성', '밤'], words: ['그라데이션', '띠', '밴드', '노을', '수평선', '물결', '하늘', '바다', '빛', '대칭', '저녁', '몽환'],
    ex: [['해 질 무렵 강가를 오래 걸었다.', 12, '45'], ['비 오는 오후, 창가에 앉아 음악을 들었다. 마음이 편했다.', 27, '916'], ['고요한 저녁.', 46, '11']],
    preview: true },
  { id: 'retro', fmt: 'retro', name: '레트로 픽셀', kind: '아트', pop: 21, added: '2026-11-26', motion: true, paid: true,
    desc: ['네모 픽셀이 진동판 마디선처럼 켜지는 대칭 무늬.', '셔플마다 새로운 무늬 · 픽셀 크기 · 색,', '두 무늬 사이를 천천히 오가는 모션.'],
    tags: ['짧은글', '감성'], words: ['픽셀', '레트로', '도트', '8비트', '게임', '대칭', '무늬', '격자', '진동', '패턴', '무지개', '디지털'],
    ex: [['오늘은 오래된 게임기를 꺼냈다.', 11, '45'], ['비 오는 오후, 창가에 앉아 음악을 들었다. 마음이 편했다.', 25, '916'], ['작은 반짝임.', 44, '11']],
    preview: true },
  { id: 'fractal', fmt: 'fractal', name: '프랙탈 패턴', kind: '아트', pop: 20, added: '2026-11-26', motion: true, paid: true,
    desc: ['실이 얽힌 듯한 섬세한 무늬가 타일처럼 이어지며 천천히 흐르는 패턴.', '셔플 한 번에 무늬 · 크기 · 색까지 새롭게,', '글 둘레는 옅게.'],
    tags: ['감성', '밤'], words: ['프랙탈', '패턴', '무늬', '실', '타일', '레이스', '수학', '반복', '섬세', '빛', '기하학', '추상'],
    ex: [['오늘은 생각이 실타래처럼 엉켰다가 천천히 풀렸다.', 11, '45'], ['비 오는 오후, 창가에 앉아 음악을 들었다. 마음이 편했다.', 26, '916'], ['작은 반복이 쌓인 하루.', 45, '11']],
    preview: true },
  { id: 'plasma', fmt: 'plasma', name: '플라즈마', kind: '아트', pop: 19, added: '2026-11-26', motion: true, paid: true,
    desc: ['바다와 숲처럼 깊은 색에 빛이 번지듯 일렁이는 플라즈마.', '셔플마다 새로운 물결 크기 · 방향 · 빛 번짐,', '색은 11가지.'],
    tags: ['감성', '밤'], words: ['플라즈마', '그라데이션', '물결', '바다', '숲', '빛', '번짐', '오로라', '노을', '새벽', '안개', '몽환'],
    ex: [['오늘은 바다를 오래 보고 왔다.', 9, '45'], ['비 오는 오후, 창가에 앉아 음악을 들었다. 마음이 편했다.', 24, '916'], ['조용한 밤.', 43, '11']],
    preview: true },
  { id: 'pixel', fmt: 'pixel', name: '픽셀 체커', kind: '아트', pop: 18, added: '2026-11-26', motion: true, paid: true,
    desc: ['굵은 픽셀 바둑판이 물결처럼 자리를 바꾸는 레트로 아트.', '셔플마다 새로운 칸 · 픽셀 크기와 색,', '글 둘레는 연하게.'],
    tags: ['짧은글', '감성'], words: ['픽셀', '바둑판', '체크', '도트', '레트로', '게임', '디지털', '격자', '무지개', '패턴', '8비트', '모니터'],
    ex: [['오늘은 오래된 게임을 다시 해 봤다.', 7, '45'], ['비 오는 오후, 창가에 앉아 음악을 들었다. 마음이 편했다.', 22, '916'], ['작은 성공 하나.', 41, '11']],
    preview: true },
  { id: 'mesh', fmt: 'mesh', name: '네온 메시', kind: '아트', pop: 17, added: '2026-11-26', motion: true, paid: true,
    desc: ['형광 선 그물이 천천히 녹아 흐르는 네온 아트.', '셔플마다 정돈된 그물과 자유로운 그물,', '두 색 묶음은 10가지.'],
    tags: ['감성', '밤'], words: ['네온', '형광', '그물', '물결', '선', '액체', '흐름', '패턴', '레이브', '밤', '클럽', '몽환'],
    ex: [['오늘은 음악을 크게 틀고 걸었다.', 8, '45'], ['새벽까지 친구들과 이야기를 나눴다. 시간이 순식간이었다.', 19, '916'], ['기분 좋은 피곤함.', 31, '11']],
    preview: true },
  { id: 'eclipse', fmt: 'eclipse', name: '이클립스 링', kind: '아트', pop: 16, added: '2026-11-25', motion: true, paid: true,
    desc: ['번진 빛의 고리 안에 어두운 원이 비켜 선 초승달 아트.', '고리를 따라 천천히 도는 색,', '셔플마다 새로운 방향 · 굵기 · 색 묶음.'],
    tags: ['감성', '밤'], words: ['고리', '링', '일식', '초승달', '달', '무지개', '빛', '번짐', '그라데이션', '몽환', '우주', '밤'],
    ex: [['오늘 하늘이 유난히 맑았다.', 6, '45'], ['오래된 친구에게서 연락이 왔다. 반가웠다.', 15, '916'], ['조용한 밤, 혼자 차를 마셨다.', 22, '11']],
    preview: true },
  { id: 'tunnel', fmt: 'tunnel', name: '라이트 터널', kind: '아트', pop: 15, added: '2026-11-25', motion: true, paid: true,
    desc: ['가운데 한 점에서 가는 빛줄기가 뻗어 나오는 빛의 터널.', '셔플마다 새로운 부채꼴 빛과 빛줄기,', '색 묶음은 10가지.'],
    tags: ['감성', '밤'], words: ['터널', '빛', '빛줄기', '우주', '하이퍼스페이스', '속도', '별', '소실점', '네온', '몽환', '여행', '밤'],
    ex: [['오늘은 하루가 정말 빨리 지나갔다.', 10, '45'], ['새로운 일을 시작하는 첫날, 설레고 조금 떨렸다.', 4, '916'], ['밤하늘을 오래 올려다봤다.', 27, '11']],
    preview: true },
  { id: 'neon', fmt: 'neon', name: '네온 플로우', kind: '아트', pop: 14, added: '2026-11-25', motion: true, paid: true,
    desc: ['흐린 네온 빛이 부드러운 꼬리를 남기며 흐르는 아트.', '셔플마다 새로운 빛 덩어리 수와 흐르는 길,', '색 묶음은 10가지.'],
    tags: ['감성', '밤'], words: ['네온', '빛', '흐름', '잔상', '꼬리', '밤', '도시', '불빛', '몽환', '그라데이션', '파스텔', '옵아트'],
    ex: [['늦은 밤 버스 창밖으로 불빛이 길게 흘러갔다.', 21, '45'], ['오늘은 음악을 크게 틀고 방 청소를 했다.', 3, '916'], ['아침 햇살이 커튼 사이로 들어왔다.', 18, '11']],
    preview: true },
  { id: 'swirl', fmt: 'swirl', name: '라이트 스월', kind: '아트', pop: 13, added: '2026-11-25', motion: true, paid: true,
    desc: ['가운데서 번지는 빛 둘레로 작은 반짝임이 도는 소용돌이.', '셔플마다 새로운 소용돌이 모양과 물결,', '색은 20가지.'],
    tags: ['감성', '밤'], words: ['소용돌이', '빛', '반짝임', '물결', '파장', '은하', '우주', '몽환', '그라데이션', '네온', '파스텔', '셰이더'],
    ex: [['창문을 열었더니 바람이 차가웠다. 따뜻한 차를 끓여 오래 마셨다.', 3, '45'], ['오늘은 아무것도 하지 않아도 괜찮은 날이었다.', 15, '916'], ['밤 산책길에 별이 유난히 많았다.', 37, '11']],
    preview: true },
  { id: 'pill', fmt: 'pill', name: '그라데이션 필', kind: '디자인', pop: 5, added: '2026-11-25', motion: true, paid: true,
    desc: ['글 속 낱말 몇 개를 두 색 그라데이션 알약에 담은 타이포.', '셔플마다 새로운 알약 자리와 색 · 방향,', '배경은 칩이나 직접 고른 색으로.'],
    tags: ['짧은글', '감성'], words: ['그라데이션', '알약', '캡슐', '태그', '라벨', '파스텔', '컬러', '하이라이트', '키워드', '잡지', '포스터', '타이포'],
    ex: ['아침에 창문을 열었더니 공기가 차가웠다. 출근길에 따뜻한 라떼를 사서 공원을 한 바퀴 돌았다.', '오늘은 일이 일찍 끝나서 친구랑 저녁을 먹었다. 오랜만에 많이 웃었다.', '주말 내내 방 정리를 했다. 버릴 것과 남길 것을 나누다 보니 마음도 조금 가벼워졌다.'],
    preview: true },
  { id: 'dots', fmt: 'dots', name: '서클 인덱스', kind: '디자인', pop: 6, added: '2026-11-25', motion: true, paid: true,
    desc: ['문장마다 첫 글자를 색 동그라미에 담은 잡지 목차 스타일.', '셔플마다 새로운 동그라미 색과 줄바꿈,', '한글도 영문도 글자 그대로.'],
    tags: ['짧은글', '감성'], words: ['동그라미', '목차', '첫 글자', '이니셜', '잡지', '에디토리얼', '컬러', '원', '점', '타이포', '리스트', '하루 정리'],
    ex: ['아침에 창문을 열었더니 공기가 차가웠다. 출근길에 라떼를 샀다. 점심은 회사 앞 국숫집. 퇴근길 하늘이 예뻤다.', 'Woke up early and walked to the river. The air was cold but clear. Coffee with Mina at noon. Slept early.', '오늘은 쉬는 날. 늦잠을 잤다. 오후엔 책을 조금 읽었다. 저녁은 엄마랑 김밥.'],
    preview: true },
  { id: 'wave', fmt: 'wave', name: '웨이브 타이포', kind: '디자인', pop: 7, added: '2026-11-25', motion: true, paid: true,
    desc: ['반듯한 줄 대신 곡선과 물결을 따라 흐르는 글자.', '셔플마다 새로운 물결 모양과 기울인 글씨,', '피드에서는 옆으로 천천히 지나가는 물결.'],
    tags: ['짧은글', '감성'], words: ['물결', '곡선', '웨이브', '타이포', '포스터', '흐르는', '파도', '리듬', '손글씨', '자유로운', '밑줄', '이탤릭'],
    ex: ['오늘은 아침부터 비가 와서 우산을 쓰고 천천히 걸었다. 따뜻한 라떼를 마시며 창밖을 오래 봤다.', '퇴근길 하늘이 분홍색이었다. 버스를 한 정거장 일찍 내려서 걸어왔다.', '별일 없는 하루였지만 마음이 조용해서 좋았다.'],
    preview: true },
  { id: 'tower', fmt: 'tower', name: '타이포 타워', kind: '디자인', pop: 8, added: '2026-11-25', motion: true, paid: true,
    desc: ['둥근 덩어리로 끊긴 글이 굽이치며 쌓이는 글자 탑.', '날짜를 켜면 탑 끝에 날짜까지,', '피드에서는 위로 천천히 흐르는 탑.'],
    tags: ['짧은글', '감성'], words: ['탑', '쌓기', '덩어리', '블록', '스티커', '라벨', '날짜', '포스터', '타이포', '세로', '흐르는', '말풍선'],
    ex: ['퇴근길 하늘이 분홍색이었다. 버스를 한 정거장 일찍 내려서 걸어왔다.', '오늘은 늦잠을 잤다. 오후엔 책을 조금 읽었다.', '친구랑 오래 통화했다. 별일 없는 이야기에 많이 웃었다.'],
    preview: true },
  { id: 'symbol', fmt: 'symbol', name: '심볼 타이포', kind: '디자인', pop: 9, added: '2026-11-25', motion: true, paid: true,
    desc: ['가늘고 큰 글씨 사이사이에 선으로 그린 기호가 끼어드는 타이포.', '셔플마다 새로운 기호 종류와 자리,', '피드에서는 살짝 움직이는 기호.'],
    tags: ['짧은글', '감성'], words: ['기호', '심볼', '아이콘', '타이포', '포스터', '실험', '스마일', '화살표', '점선', '빗금', '모던', '그래픽'],
    ex: ['오늘은 아침부터 비가 와서 우산을 쓰고 천천히 걸었다. 강변 카페에서 따뜻한 라떼를 마시며 창밖을 오래 봤다.', '퇴근길 하늘이 분홍색이었다. 버스를 한 정거장 일찍 내려서 걸어왔다.', '별일 없는 하루였지만 마음이 조용해서 좋았다.'],
    preview: true },
  { id: 'label', fmt: 'label', name: '라벨 콜라주', kind: '디자인', pop: 10, added: '2026-11-25', motion: true, paid: true,
    desc: ['문장을 흰 띠 라벨에 담아 여기저기 붙인 콜라주.', '셔플마다 새로운 라벨 자리와 줄 나눔,', '피드에서는 테이프처럼 차례로 붙는 라벨.'],
    tags: ['짧은글', '감성'], words: ['라벨', '테이프', '스티커', '띠', '조각', '포스터', '타이포', '콜라주', '레터링', '굵은', '빨강', '메모'],
    ex: ['대부분의 사람은 딱 맞는 때를 기다리다 하루를 보낸다. 오늘은 그냥 해 보기로 했다. 퇴근길 버스 대신 한 정거장 걸었다.', '비 오는 아침 강변 카페. 라떼 한 잔. 창밖을 오래 봤다.', '친구랑 오래 통화했다. 별일 없는 이야기에 많이 웃었다.'],
    preview: true },
  { id: 'typer', fmt: 'typer', name: '타이프라이터', kind: '디자인', pop: 11, added: '2026-11-25', motion: true, paid: true,
    desc: ['점으로 찍힌 바랜 풍경 위에 놓인 타자기 글씨.', '셔플마다 숲 · 바다 · 들판 · 산 · 구름 하늘,', '피드에서는 한 자씩 찍히는 글자.'],
    tags: ['짧은글', '감성'], words: ['타자기', '타이핑', '메모', '레트로', '빈티지', '고정폭', '풍경', '바랜', '노랑', '종이', '편지', '디더링', '숲', '바다'],
    ex: ['아침에 창문을 열었더니 공기가 차가웠다. 출근길에 따뜻한 라떼를 샀다. 퇴근길 하늘이 분홍색이었다.', '친구랑 오래 통화했다. 별일 없는 이야기에 많이 웃었다.', 'Slow Sunday. Coffee by the window, a long walk by the river.'],
    preview: true },
  { id: 'vset', fmt: 'vset', name: '비디오 세팅', kind: '디자인', pop: 13, added: '2026-11-25', motion: true, paid: true,
    desc: ['내 하루를 옛 비디오 설정 화면처럼 담은 디자인.', '셔플마다 새로운 반전 낱말과 켜진 탭,', '피드에서는 깜빡이는 ▶와 녹화 점.'],
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
// '디자인 멤피스 타이포' → '멤피스 타이포' (프로필 '자주 쓴 템플릿')
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
// 카드 이름표: '기본' 또는 '디자인 · 멤피스 타이포'
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
