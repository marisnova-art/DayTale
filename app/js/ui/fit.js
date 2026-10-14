// 한 줄 영역(막대 · 머리줄)이 언어에 따라 넘칠 때, 단계별로 조여요.
// 단계 이름은 class 로 붙고, 각 단계에서 무엇을 줄일지는 CSS 가 정해요 (예: .fit-1 아이콘 숨김, .fit-2 여백 줄임)
// 글자 크기를 무작정 줄이지 않고, 덜 중요한 것부터 접어요
const WATCH = new WeakSet();
const over = el => el.scrollWidth > el.clientWidth + 1 || [...el.children].some(c => c.scrollWidth > c.clientWidth + 1);   // 자식이 잘리는(overflow: hidden) 경우도 넘친 것으로 봐요
function fit(el, steps = 3, tries = 0) {
  if (!el) return;
  if (!el.isConnected || !el.clientWidth) { if (tries < 20) requestAnimationFrame(() => fit(el, steps, tries + 1)); return; }
  for (let i = 1; i <= steps; i++) el.classList.remove('fit-' + i);
  for (let i = 1; i <= steps && over(el); i++) el.classList.add('fit-' + i);
  if (!WATCH.has(el) && 'ResizeObserver' in window) {
    WATCH.add(el); let w = el.clientWidth;
    new ResizeObserver(() => { if (Math.abs(el.clientWidth - w) > 2) { w = el.clientWidth; fit(el, steps); } }).observe(el);
    document.fonts?.ready.then(() => fit(el, steps));
  }
}
export { fit };
