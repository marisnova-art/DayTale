// Node 쪽: 가짜 클라이언트 요청을 PGlite(실제 Postgres)에서 그 사용자 권한(RLS)으로 실행해요.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
export async function makeDb() {
  const db = new PGlite();
  await db.exec(readFileSync(new URL('../sql-test/supabase-mock.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../../supabase/schema.sql', import.meta.url), 'utf8'));
  return db;
}
const id = s => { if (!/^[a-z_][a-z0-9_]*$/.test(s)) throw new Error('bad identifier ' + s); return s; };
const cols = c => c === '*' ? '*' : c.split(',').map(x => id(x.trim())).join(',');
const fix = v => v instanceof Date ? v.toISOString() : v;
const out = rows => rows.map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, fix(v)])));
export function handler(db, log) {
  return async (user, r) => {
    const params = []; const p = v => { params.push(v); return '$' + params.length; };
    let sql;
    const where = () => r.filters.length ? ' where ' + r.filters.map(([op, c, v]) => op === 'in' ? `${id(c)}::text = any(${p(v.map(String))}::text[])` : op === 'notnull' ? `${id(c)} is not null` : `${id(c)} ${op} ${p(v)}`).join(' and ') : '';
    if (r.op === 'rpc') {
      const names = Object.keys(r.args); sql = `select * from public.${id(r.fn)}(${names.map(n => `${id(n)} => ${p(r.args[n])}`).join(', ')})`;
    } else if (r.op === 'select') {
      sql = `select ${cols(r.cols)} from public.${id(r.table)}${where()}${r.order.length ? ' order by ' + r.order.map(([c, a]) => `${id(c)} ${a ? 'asc' : 'desc'}`).join(', ') : ''}${r.limit ? ' limit ' + (+r.limit) : ''}${r.offset ? ' offset ' + (+r.offset) : ''}`;
    } else if (r.op === 'insert' || r.op === 'upsert') {
      const keys = [...new Set(r.rows.flatMap(Object.keys))].map(id);
      sql = `insert into public.${id(r.table)} (${keys}) select ${keys} from jsonb_populate_recordset(null::public.${id(r.table)}, ${p(JSON.stringify(r.rows))}::jsonb)`;
      if (r.op === 'upsert') sql += ` on conflict (${id(r.onConflict)}) do update set ${keys.map(k => `${k} = excluded.${k}`).join(', ')}`;
      if (r.ret) sql += ` returning ${cols(r.ret)}`;
    } else if (r.op === 'update') {
      const keys = Object.keys(r.values).map(id);
      sql = `update public.${id(r.table)} set ${keys.map(k => `${k} = (jsonb_populate_record(null::public.${id(r.table)}, ${p(JSON.stringify(r.values))}::jsonb)).${k}`).join(', ')}${where()}${r.ret ? ' returning ' + cols(r.ret) : ''}`;
    } else if (r.op === 'delete') {
      sql = `delete from public.${id(r.table)}${where()}${r.ret ? ' returning ' + cols(r.ret) : ''}`;
    }
    try {
      const rows = await db.transaction(async tx => {
        if (user) await tx.query(`select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)`, [user.id, JSON.stringify({ sub: user.id, email: user.email })]);
        await tx.exec('set local role ' + (user ? 'authenticated' : 'anon'));
        return (await tx.query(sql, params)).rows;
      });
      let data = out(rows);
      if (r.op === 'rpc') { const k = data[0] && Object.keys(data[0]); data = data.length === 1 && k.length === 1 && k[0] === r.fn ? data[0][r.fn] : data; }
      if (['insert', 'upsert', 'update', 'delete'].includes(r.op) && !r.ret) data = null;
      if (r.single === 'one') { if (!data?.length) return { data: null, error: { message: 'no rows', code: 'PGRST116' } }; data = data[0]; }
      if (r.single === 'maybe') data = data?.[0] || null;
      return { data, error: null };
    } catch (e) {
      log?.(`SQL error [${user?.email}] ${e.code} ${e.message} :: ${sql.slice(0, 160)}`);
      return { data: null, error: { message: e.message, code: e.code } };
    }
  };
}
/* 테스트용 사용자 만들기 (auth.users → profiles 트리거) */
export async function addUser(db, { id, email, name, daysAgo = 0, trialEndsIn = 30 }) {
  await db.query(`insert into auth.users(id, email, created_at, raw_user_meta_data) values ($1, $2, now() - make_interval(days => $3), $4)`, [id, email, daysAgo, JSON.stringify({ lang: 'ko', full_name: name || '' })]);
  await db.query(`update public.profiles set trial_ends_at = now() + make_interval(days => $2), created_at = now() - make_interval(days => $3) where id = $1`, [id, trialEndsIn, daysAgo]);
}
