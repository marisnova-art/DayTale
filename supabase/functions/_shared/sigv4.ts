// AWS Signature V4 (R2는 S3와 같은 방식). WebCrypto만 써요.
const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
export const sha256 = async (data: string | Uint8Array) => hex(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? enc.encode(data) : data));
async function hmac(key: ArrayBuffer | Uint8Array, msg: string) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', k, enc.encode(msg));
}
const uriEncode = (s: string, slash = true) => encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase()).replace(slash ? /%2F/g : /$^/, '/');

export async function sign(o: { method: string; url: string; headers: Record<string, string>; body?: Uint8Array | string; accessKey: string; secretKey: string; region: string; service?: string; date?: Date; payloadHash?: string }) {
  const u = new URL(o.url), service = o.service || 's3';
  const d = (o.date || new Date()).toISOString().replace(/[:-]|\.\d{3}/g, '');
  const day = d.slice(0, 8);
  const payloadHash = o.payloadHash || await sha256(o.body || '');
  const headers: Record<string, string> = { ...Object.fromEntries(Object.entries(o.headers).map(([k, v]) => [k.toLowerCase(), String(v).trim()])), host: u.host, 'x-amz-date': d, 'x-amz-content-sha256': payloadHash };
  const names = Object.keys(headers).sort();
  const query = [...u.searchParams].map(([k, v]) => [uriEncode(k, false), uriEncode(v, false)]).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : 1).map(([k, v]) => `${k}=${v}`).join('&');
  const canonical = [o.method, uriEncode(decodeURIComponent(u.pathname)), query, names.map(n => `${n}:${headers[n]}\n`).join(''), names.join(';'), payloadHash].join('\n');
  const scope = `${day}/${o.region}/${service}/aws4_request`;
  const toSign = ['AWS4-HMAC-SHA256', d, scope, await sha256(canonical)].join('\n');
  let k: ArrayBuffer = await hmac(enc.encode('AWS4' + o.secretKey), day);
  for (const p of [o.region, service, 'aws4_request']) k = await hmac(k, p);
  const signature = hex(await hmac(k, toSign));
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${o.accessKey}/${scope}, SignedHeaders=${names.join(';')}, Signature=${signature}`;
  delete headers.host;
  return { headers, signature };
}
