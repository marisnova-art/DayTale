// 브라우저 쪽: supabase-js 흉내. 모든 쿼리를 Node(window.__pg)로 보내 실제 Postgres에서 그 사용자로 실행해요.
(() => {
  let user = JSON.parse(localStorage.getItem('fake.user') || 'null');
  const subs = [];
  class Q {
    constructor(table) { this.r = { table, op: 'select', cols: '*', filters: [], order: [], ret: null }; }
    select(c = '*') { if (this.r.op === 'select') this.r.cols = c; else this.r.ret = c; return this; }
    insert(rows) { this.r.op = 'insert'; this.r.rows = Array.isArray(rows) ? rows : [rows]; return this; }
    upsert(rows, o = {}) { this.r.op = 'upsert'; this.r.rows = Array.isArray(rows) ? rows : [rows]; this.r.onConflict = o.onConflict || 'id'; return this; }
    update(v) { this.r.op = 'update'; this.r.values = v; return this; }
    delete() { this.r.op = 'delete'; return this; }
    eq(c, v) { this.r.filters.push(['=', c, v]); return this; }
    neq(c, v) { this.r.filters.push(['<>', c, v]); return this; }
    gt(c, v) { this.r.filters.push(['>', c, v]); return this; }
    gte(c, v) { this.r.filters.push(['>=', c, v]); return this; }
    lt(c, v) { this.r.filters.push(['<', c, v]); return this; }
    in(c, v) { this.r.filters.push(['in', c, v]); return this; }
    not(c, op, v) { if (op === 'is' && v === null) this.r.filters.push(['notnull', c]); else throw new Error('fake not() supports only is null'); return this; }
    order(c, o = {}) { this.r.order.push([c, o.ascending !== false]); return this; }
    limit(n) { this.r.limit = n; return this; }
    range(a, b) { this.r.offset = a; this.r.limit = b - a + 1; return this; }
    single() { this.r.single = 'one'; return this; }
    maybeSingle() { this.r.single = 'maybe'; return this; }
    then(res, rej) { return window.__pg(user, this.r).then(res, rej); }
  }
  const fire = (ev, s) => subs.forEach(f => f(ev, s));
  const session = () => user ? { user, access_token: 'fake' } : null;
  const auth = {
    getSession: async () => ({ data: { session: session() } }), getUser: async () => ({ data: { user } }),
    onAuthStateChange: f => { subs.push(f); setTimeout(() => f('INITIAL_SESSION', session()), 0); return { data: { subscription: { unsubscribe() {} } } }; },
    refreshSession: async () => ({}),
    signInWithPassword: async ({ email, password }) => { const u = await window.__login(email, password); if (!u) return { data: {}, error: { message: 'Invalid login credentials' } }; user = u; localStorage.setItem('fake.user', JSON.stringify(u)); fire('SIGNED_IN', session()); return { data: { session: session() }, error: null }; },
    signUp: async () => ({ data: { session: null }, error: null }),
    resetPasswordForEmail: async () => ({ error: null }), updateUser: async () => ({ error: null }), signInWithOAuth: async () => ({ error: null }),
    signOut: async () => { user = null; localStorage.removeItem('fake.user'); sessionStorage.setItem('fake.out', '1'); fire('SIGNED_OUT', null); return {}; }
  };
  window.supabase = { createClient: () => ({ auth, from: t => new Q(t), rpc: (fn, args) => window.__pg(user, { op: 'rpc', fn, args: args || {} }) }) };
})();
