// 배포 전에: node v1/tools/update-precache.mjs  → app/sw.js 의 SHELL 목록을 채워요 (글꼴 조각은 빼고, 쓸 때 캐시)
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
const root = new URL('../app/', import.meta.url).pathname;
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(root).map(p => './' + relative(root, p)).filter(p => /\.(html|js|css|webmanifest|webp|svg|png)$/.test(p) && !/^\.\/(sw\.js|(legal|site|en|ko|ja|es|fr)\/|icons\/maskable)/.test(p)).sort();
const sw = join(root, 'sw.js');
const src = readFileSync(sw, 'utf8').replace(/\/\* PRECACHE:START[^]*?PRECACHE:END \*\//, `/* PRECACHE:START (tools/update-precache.mjs 가 만들어요) */\nconst SHELL = ${JSON.stringify(files)};\n/* PRECACHE:END */`);
writeFileSync(sw, src); console.log(files.length, 'files');
