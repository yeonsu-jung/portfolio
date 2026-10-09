#!/usr/bin/env node
// Posters for index.html, and a check that index.html still works.
//
//     node tools/site.mjs posters [id ...]    screenshots of the viewers -> posters/, posters/thumbs/
//     node tools/site.mjs check               open index.html, run every slide and every "view to
//                                             try", then try the page's own behaviour: viewers
//                                             starting as they are scrolled to, scrolling past
//                                             one, clicking into it, full screen, no JavaScript,
//                                             a touch screen, and a reader who wants less motion
//
// Needs Node 22 or later and google-chrome on the PATH; nothing to install.  Chrome runs
// headless with software WebGL, so no display or GPU is needed, but the viewers still fetch
// three.js from their CDN.
//
// The slides are read from index.html: every <article class="slide"> gives the page to open
// (data-src), the kind of page (data-kind), and for the replay viewers the state to draw
// (data-shot, the viewer's own URL hash: run, t, cam, ...).  The other pages keep no state in
// their URL, so what to do before their picture is taken is in PAGES below.

import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Pages that are documents, not full-screen viewers: the element whose picture is taken, and
// what to do first.
const PAGES = {
  linking: { clip: '#stage', prep: `const s = document.getElementById('scrub'); s.value = s.max; s.dispatchEvent(new Event('input', { bubbles: true }));` },
  lattice: { clip: 'canvas#stage', prep: `const s = document.getElementById('step'); s.value = 30; s.dispatchEvent(new Event('input', { bubbles: true }));` },
  scan:    { clip: '#stage', prep: '' },
  segment: { clip: '#stage-b', prep: '' },
};
const HIDE_PANELS = '.panel, #controls, #divider, #heads { display: none !important; }';

// ------------------------------------------------------------------ the slides in index.html

function slides() {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const unesc = s => s.replaceAll('&amp;', '&').replaceAll('&quot;', '"');
  return [...html.matchAll(/<article class="slide"([^>]*)>/g)].map(m => {
    const a = Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(x => [x[1], unesc(x[2])]));
    return { id: a.id, name: a['data-name'], kind: a['data-kind'], src: a['data-src'], hash: a['data-hash'] || '',
             shot: a['data-shot'] || '', bytes: +a['data-bytes'] };
  });
}

// ------------------------------------------------------------------ Chrome, over its DevTools protocol

async function chrome({ width = 1280, height = 720 } = {}) {
  const profile = mkdtempSync(join(tmpdir(), 'portfolio-chrome-'));
  const proc = spawn('google-chrome', [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, `--window-size=${width},${height}`,
    '--hide-scrollbars', '--mute-audio', '--no-first-run', '--ignore-gpu-blocklist',
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    'about:blank'], { stdio: 'ignore' });
  const portFile = join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 150 && !existsSync(portFile); i++) await sleep(100);
  if (!existsSync(portFile)) { proc.kill(); throw new Error('google-chrome did not start'); }
  const [port, path] = readFileSync(portFile, 'utf8').trim().split('\n');
  const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('no DevTools connection')); });
  let id = 0;
  const pending = new Map(), listeners = [];
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    } else for (const l of listeners) l(msg);
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    pending.set(++id, { res, rej });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

  async function page({ w = width, h = height, scale = 1, scheme = 'light', mobile = false, reduce = false } = {}) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const S = (m, p) => send(m, p, sessionId);
    const logs = [], contexts = new Map();
    listeners.push(msg => {
      if (msg.sessionId !== sessionId) return;
      const p = msg.params;
      if (msg.method === 'Runtime.executionContextCreated' && p.context.auxData?.isDefault) contexts.set(p.context.auxData.frameId, p.context.id);
      if (msg.method === 'Runtime.consoleAPICalled' && (p.type === 'error' || p.type === 'warning'))
        logs.push(`console.${p.type}: ` + p.args.map(a => a.value ?? a.description ?? '').join(' '));
      if (msg.method === 'Runtime.exceptionThrown') logs.push('exception: ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text));
      if (msg.method === 'Log.entryAdded' && p.entry.level === 'error') logs.push(`error: ${p.entry.text} ${p.entry.url || ''}`);
    });
    await S('Page.enable'); await S('Runtime.enable'); await S('Log.enable');
    await S('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: scale, mobile });
    if (mobile) await S('Emulation.setTouchEmulationEnabled', { enabled: true });
    await S('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme },
                                                        { name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
    const evaluate = async (expression, contextId) => {
      const r = await S('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true, ...(contextId ? { contextId } : {}) });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    };
    return {
      logs, send: S, eval: evaluate,
      async goto(url) {
        let timer;
        const loaded = new Promise(res => listeners.push(msg => { if (msg.sessionId === sessionId && msg.method === 'Page.loadEventFired') res(); }));
        await S('Page.navigate', { url });
        await Promise.race([loaded, new Promise(res => { timer = setTimeout(res, 90000); })]);
        clearTimeout(timer);          // or the process would wait for it before it could end
      },
      async until(expression, ms = 60000) {
        for (const t0 = Date.now(); Date.now() - t0 < ms; await sleep(150)) if (await evaluate(expression).catch(() => false)) return true;
        return false;
      },
      // the result of an expression inside the <iframe> that shows `file` (a stage that has
      // scrolled away keeps its frame for a few seconds, so there can be more than one)
      async inFrame(file, expression) {
        const { frameTree } = await S('Page.getFrameTree');
        const child = (frameTree.childFrames || []).filter(c => c.frame.url.split('#')[0].endsWith('/' + file)).pop();
        if (!child) return { urls: (frameTree.childFrames || []).map(c => c.frame.url) };
        if (!contexts.has(child.frame.id)) return { url: child.frame.url };
        return { url: child.frame.url, value: await evaluate(expression, contexts.get(child.frame.id)).catch(() => undefined) };
      },
      async shot(file, { clip, quality = 82 } = {}) {
        const format = file.endsWith('.png') ? 'png' : file.endsWith('.jpg') ? 'jpeg' : 'webp';
        const { data } = await S('Page.captureScreenshot', { format, ...(format === 'png' ? {} : { quality }), ...(clip ? { clip: { scale: 1, ...clip } } : {}) });
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, Buffer.from(data, 'base64'));
      },
      async click(x, y) {
        for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased'])
          await S('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1 });
      },
      wheel: (x, y, deltaY) => S('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY }),
      // a finger put down at (x, y) and moved up by `up` px; up = 0 is a tap
      // (Input.synthesizeScrollGesture does nothing in headless Chrome, hence the single events)
      async swipe(x, y, up) {
        await S('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        for (let k = 1; up && k <= 10; k++) {
          await S('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - up * k / 10 }] });
          await sleep(16);
        }
        await S('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      },
      key: (key, code) => S('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: code })
        .then(() => S('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: code })),
      scripts: on => S('Emulation.setScriptExecutionDisabled', { value: !on }),
      close: () => send('Target.closeTarget', { targetId }),
    };
  }
  // A fresh profile drops the https requests it makes in its first moments
  // (net::ERR_CERT_VERIFIER_CHANGED), and a viewer that loses three.js that way never starts:
  // fetch one CDN file, again if need be, before any page is opened.
  const warm = await page();
  for (let i = 0; i < 6; i++) {
    await warm.goto('https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js');
    if (await warm.eval(`!!document.body && document.body.innerText.length > 1000`).catch(() => false)) break;
    await sleep(1500);
  }
  await warm.close();

  async function close() {
    await send('Browser.close').catch(() => {});
    await sleep(300);
    try { proc.kill(); } catch {}
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  }
  return { page, close };
}

// ------------------------------------------------------------------ posters

async function posters(only) {
  const todo = slides().filter(s => !only.length || only.includes(s.id));
  const unknown = only.filter(id => !todo.some(s => s.id === id));
  if (unknown.length) throw new Error(`no slide called ${unknown[0]} in index.html`);
  const b = await chrome();
  try {
    for (const s of todo) {
      const url = pathToFileURL(join(ROOT, s.src)).href;
      if (s.kind === 'app') {
        // a replay viewer at the state its hash names, with its panels put away: the scene alone
        const p = await b.page({ w: 1280, h: 720, scale: 1.25 });
        let started = false;
        for (let attempt = 0; attempt < 3 && !started; attempt++) {
          if (attempt) await p.goto('about:blank');
          await p.goto(url + '#' + (s.shot || s.hash));
          started = await p.until(`!!window.viewer && document.getElementById('status').classList.contains('hidden')`, 25000);
        }
        if (!started) throw new Error(`${s.id}: the viewer did not start (no connection to its CDN?)`);
        const framed = /(^|&)cam=/.test(s.shot);
        await p.eval(`(() => {
          const st = document.createElement('style');
          st.textContent = ${JSON.stringify(HIDE_PANELS)};
          document.head.appendChild(st);
          window.dispatchEvent(new Event('resize'));
          const v = window.viewer;
          if (!${framed}) { if (v.setView) v.setView(((v.PAGE || {}).views || [{ id: 'iso' }])[0].id); else document.getElementById('view-iso').click(); }
          if (v.refresh) v.refresh();
        })()`);
        await sleep(1500);
        await p.shot(join(ROOT, 'posters', `${s.id}.webp`));
        await p.shot(join(ROOT, 'posters', 'thumbs', `${s.id}.webp`), { clip: { x: 0, y: 0, width: 1280, height: 720, scale: 480 / 1600 }, quality: 78 });
        await p.close();
        console.log(`${s.id}: posters/${s.id}.webp  (${s.src}#${s.shot || s.hash})`);
      } else {
        // a document: its 3-D view alone, cut to 16:10, once for each colour scheme
        const how = PAGES[s.id];
        if (!how) throw new Error(`${s.id}: say in PAGES (tools/site.mjs) which element to take the picture of`);
        for (const scheme of ['light', 'dark']) {
          const p = await b.page({ w: 1280, h: 900, scale: 2, scheme });
          await p.goto(url);
          await sleep(2500);
          if (how.prep) await p.eval(`(() => { ${how.prep} })()`);
          const r = await p.eval(`(() => {
            const e = document.querySelector(${JSON.stringify(how.clip)});
            e.scrollIntoView({ block: 'center' });
            const q = e.getBoundingClientRect();
            return { x: q.left + scrollX, y: q.top + scrollY, w: q.width, h: q.height };
          })()`);
          await sleep(2500);
          let w = r.w, h = w / 1.6;
          if (h > r.h) { h = r.h; w = 1.6 * h; }
          const clip = { x: r.x + (r.w - w) / 2, y: r.y + (r.h - h) / 2, width: w, height: h };
          const name = s.id + (scheme === 'dark' ? '-dark' : '');
          await p.shot(join(ROOT, 'posters', `${name}.webp`), { clip: { ...clip, scale: 1600 / (2 * w) } });
          await p.shot(join(ROOT, 'posters', 'thumbs', `${name}.webp`), { clip: { ...clip, scale: 480 / (2 * w) }, quality: 78 });
          await p.close();
          console.log(`${s.id}: posters/${name}.webp  (${s.src}, ${how.clip}, ${scheme})`);
        }
      }
    }
  } finally { await b.close(); }
}

// ------------------------------------------------------------------ check

async function check() {
  const all = slides(), bad = [];
  const fail = msg => { bad.push(msg); console.log('  FAIL  ' + msg); };

  console.log('files');
  for (const s of all) {
    const f = join(ROOT, s.src);
    if (!existsSync(f)) { fail(`${s.id}: ${s.src} is missing`); continue; }
    if (statSync(f).size !== s.bytes) fail(`${s.id}: ${s.src} is ${statSync(f).size} bytes, index.html says ${s.bytes} (rebuilt? update data-bytes, the size label and the poster)`);
    for (const img of [`posters/${s.id}.webp`, `posters/thumbs/${s.id}.webp`, ...(s.kind === 'page' ? [`posters/${s.id}-dark.webp`, `posters/thumbs/${s.id}-dark.webp`] : [])])
      if (!existsSync(join(ROOT, img))) fail(`${s.id}: ${img} is missing (node tools/site.mjs posters ${s.id})`);
  }
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  for (const m of html.matchAll(/(?:src|poster|srcset)="((?:posters|media)\/[^"]+)"/g))
    if (!existsSync(join(ROOT, m[1]))) fail(`index.html refers to ${m[1]}, which is missing`);
  for (const m of html.matchAll(/href="#([\w-]+)"/g))
    if (!new RegExp(`id="${m[1]}"`).test(html)) fail(`index.html links to #${m[1]}, which is not on the page`);
  for (const m of html.matchAll(/href="(index_\w+\.html)#([^"]*)"\s+data-hash="([^"]*)"/g))
    if (m[2] !== m[3]) fail(`a preset's link (${m[1]}#${m[2]}) and its data-hash (${m[3]}) differ`);

  console.log('index.html in Chrome, 1440 x 900');
  const b = await chrome({ width: 1440, height: 900 });
  try {
    const p = await b.page({ w: 1440, h: 900 });
    await p.goto(pathToFileURL(join(ROOT, 'index.html')).href);
    await sleep(1200);
    const broken = await p.eval(`[...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.getAttribute('src'))`);
    for (const src of broken) fail(`image did not load: ${src}`);
    for (const s of all) {
      // each slide, each of its presets: the frame must load that page, and a replay viewer must start
      const presets = await p.eval(`[...document.querySelectorAll('#${s.id} .presets a')].map(a => a.dataset.hash)`);
      for (const hash of [null, ...presets]) {
        const what = `${s.id}${hash ? ' · ' + hash : ''}`;
        await p.eval(hash === null
          ? `(() => { location.hash = '#${s.id}'; })()`
          : `document.querySelector('#${s.id} .presets a[data-hash="${hash}"]').click()`);
        await sleep(300);
        if (hash === null) await p.eval(`document.querySelector('#${s.id} .poster').click()`);
        if (!await p.until(`!!document.querySelector('#${s.id} .screen.is-loaded iframe')`, 90000)) { fail(`${what}: the frame did not load`); continue; }
        let f = {};
        for (let i = 0; i < 100; i++) {
          f = await p.inFrame(s.src, s.kind === 'app'
            ? `!!(window.viewer && document.getElementById('status').classList.contains('hidden')) && { run: viewer.panes.map(q => q.run && q.run.m.id).join('+'), metric: viewer.state.metric, color: viewer.state.color, ...(viewer.state.toggles || {}) }`
            : `document.querySelectorAll('canvas').length > 0 && { canvases: document.querySelectorAll('canvas').length }`);
          if (f.value) break;
          await sleep(200);
        }
        if (!f.url) fail(`${what}: no frame shows ${s.src} (frames: ${(f.urls || []).join(', ') || 'none'})`);
        else if (!f.value) fail(`${what}: the page inside the frame did not start`);
        else {
          const q = new URLSearchParams(hash ?? s.hash), got = f.value;
          const runs = [q.get('run'), q.get('run2')].filter(Boolean).join('+');
          if (s.kind === 'app' && runs && got.run !== runs) fail(`${what}: the viewer shows run ${got.run}`);
          else if (q.get('metric') && got.metric !== q.get('metric')) fail(`${what}: the viewer plots ${got.metric}`);
          else if (q.get('color') && got.color !== q.get('color')) fail(`${what}: the viewer colours by ${got.color}`);
          else if ([...q].some(([k, v]) => typeof got[k] === 'boolean' && got[k] !== (v !== '0'))) fail(`${what}: a switch is not as asked: ${JSON.stringify(got)}`);
          else console.log(`  ok    ${what}  ${JSON.stringify(got)}`);
        }
      }
    }
    for (const line of p.logs) fail('index.html: ' + line);
    await p.close();
    await behaviour(b, fail);
  } finally { await b.close(); }
  console.log(bad.length ? `\n${bad.length} problem(s)` : '\nall good');
  return bad.length ? 1 : 0;
}

// What index.html does, tried the way a visitor would: by scrolling, wheel, click and touch.
async function behaviour(b, fail) {
  const expect = (name, cond, detail) => cond ? console.log('  ok    ' + name) : fail(name + (detail === undefined ? '' : ': ' + JSON.stringify(detail)));
  // the state of slide `id`, and of the page around it
  const slide = id => `(() => {
    const s = document.getElementById('${id}'), screen = s.querySelector('.screen'), q = screen.getBoundingClientRect();
    return { live: screen.classList.contains('is-loaded'), active: screen.classList.contains('is-active'),
             frames: [...document.querySelectorAll('iframe')].map(f => f.getAttribute('src')),
             marked: s.querySelectorAll('.presets a[aria-current]').length, y: Math.round(scrollY),
             x0: q.left + q.width / 2, y0: q.top + q.height / 2, h: Math.round(q.height), win: innerHeight,
             full: document.fullscreenElement === s.querySelector('.frame'), bar: s.querySelector('.slide-head').getBoundingClientRect().height > 0 };
  })()`;
  const loaded = id => `!!document.querySelector('#${id} .screen.is-loaded')`;
  const go = id => `(() => { location.hash = ''; location.hash = '#${id}'; })()`;
  const file = pathToFileURL(join(ROOT, 'index.html')).href;

  console.log('behaviour, from disk');
  let p = await b.page({ w: 1440, h: 900 });
  await p.goto(file + '#whip');
  let t = await p.eval(`({ all: document.querySelectorAll('.slide').length, shown: [...document.querySelectorAll('.slide')].filter(e => e.querySelector('.screen').getBoundingClientRect().height > 0).length, tabs: document.querySelectorAll('[role=tab], [role=tablist]').length })`);
  expect('every viewer has its own place on the page, none behind a tab', t.all > 0 && t.shown === t.all && t.tabs === 0, t);
  await p.until(loaded('whip'), 30000);
  let s = await p.eval(slide('whip'));
  expect('a viewer scrolled to starts by itself and leaves the mouse alone', s.live && !s.active, s);
  await p.wheel(s.x0, s.y0, 240); await sleep(900);
  t = await p.eval(slide('whip'));
  expect('the wheel over a running viewer scrolls the page', t.y > s.y + 100, [s.y, t.y]);
  await p.eval(`scrollTo({ top: ${s.y}, behavior: 'instant' })`); await sleep(400);
  await p.click(s.x0, s.y0); await sleep(500);
  t = await p.eval(slide('whip'));
  expect('a click on the view makes it interactive', t.active, t);
  await p.wheel(s.x0, s.y0, 240); await sleep(900);
  t = await p.eval(slide('whip'));
  expect('and then the wheel goes to the viewer', Math.abs(t.y - s.y) < 5, [s.y, t.y]);
  await p.click(40, 500); await sleep(400);
  t = await p.eval(slide('whip'));
  expect('a click outside gives the wheel back', t.live && !t.active, t);
  await p.eval(go('catflip'));
  await p.until(loaded('catflip'), 30000);
  await p.until(`!document.querySelector('#whip iframe')`, 12000);
  t = await p.eval(slide('catflip'));
  expect('scrolling on starts the next viewer and puts the last one away', t.frames.join() === 'index_catflip.html#run=planned' && t.marked === 1, t);
  await p.eval(`document.querySelector('#catflip .frame').requestFullscreen().then(() => new Promise(res => setTimeout(res, 900)))`).catch(() => {});
  t = await p.eval(slide('catflip'));
  expect('full screen fills the window with one viewer and its title bar, and takes input', t.full && t.active && t.bar && t.h > t.win - 110, t);
  await p.eval(`document.exitFullscreen()`).catch(() => {});
  for (const line of p.logs) fail('index.html: ' + line);
  await p.close();

  console.log('behaviour, scripts off');
  p = await b.page({ w: 1440, h: 900 });
  await p.scripts(false);
  await p.goto(file);
  await p.scripts(true);                 // only to look: the page's own scripts never ran
  t = await p.eval(`({ tools: document.querySelectorAll('.tools').length, shown: [...document.querySelectorAll('.slide')].filter(e => e.getBoundingClientRect().height > 0).length,
                       linked: [...document.querySelectorAll('.slide')].filter(e => e.querySelector('.poster').getAttribute('href').startsWith(e.dataset.src)).length, all: document.querySelectorAll('.slide').length })`);
  expect('every slide is shown, as a picture that links to its page', t.tools === 0 && t.shown === t.all && t.linked === t.all, t);
  await p.close();

  console.log('behaviour, over http');
  const types = { '.html': 'text/html; charset=utf-8', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };
  const server = createServer((req, res) => {
    const f = resolve(ROOT, decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(ROOT + sep) || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream', 'content-length': statSync(f).size });
    createReadStream(f).pipe(res);
  });
  await new Promise(res => server.listen(0, '127.0.0.1', res));
  try {
    p = await b.page({ w: 1440, h: 900 });
    await p.goto(`http://127.0.0.1:${server.address().port}/index.html#packing`);
    await p.until(loaded('packing'), 60000);
    t = await p.eval(slide('packing'));
    expect('the largest page (21 MB) starts by itself as well', t.frames.join() === 'index_entangle.html#run=AR025-entangle' && !t.active, t);
    for (const line of p.logs) fail('index.html over http: ' + line);
    await p.close();
  } finally { server.close(); server.closeAllConnections(); }

  console.log('behaviour, touch screen (390 x 844)');
  p = await b.page({ w: 390, h: 844, mobile: true });
  await p.goto(file + '#whip');
  await p.until(loaded('whip'), 30000);
  s = await p.eval(slide('whip'));
  expect('a viewer scrolled to starts by itself and leaves the finger alone', s.live && !s.active, s);
  await p.swipe(s.x0, s.y0, 300); await sleep(700);
  t = await p.eval(slide('whip'));
  expect('a swipe over a running viewer scrolls the page', t.y > s.y + 100, [s.y, t.y]);
  await p.eval(`scrollTo({ top: ${s.y}, behavior: 'instant' })`); await sleep(400);
  await p.swipe(s.x0, s.y0, 0); await sleep(600);
  t = await p.eval(slide('whip'));
  expect('a tap on the view makes it interactive', t.active, t);
  await p.swipe(s.x0, s.y0, 300); await sleep(700);
  t = await p.eval(slide('whip'));
  expect('and then a swipe goes to the viewer', Math.abs(t.y - s.y) < 5, [s.y, t.y]);
  await p.eval(go('packing')); await sleep(3500);
  t = await p.eval(slide('packing'));
  expect('the 21 MB page waits for a tap', !t.frames.some(f => f.startsWith('index_entangle.html')), t);
  await p.eval(`document.querySelector('#packing .poster').click()`);
  await p.until(loaded('packing'), 60000);
  t = await p.eval(slide('packing'));
  expect('and loads on that tap, taking input', t.live && t.active, t);
  for (const line of p.logs) fail('index.html, touch: ' + line);
  await p.close();

  console.log('behaviour, reduced motion');
  p = await b.page({ w: 1440, h: 900, reduce: true });
  await p.goto(file + '#whip'); await sleep(3500);
  t = await p.eval(slide('whip'));
  expect('nothing starts by itself', t.frames.length === 0, t);
  await p.eval(`document.querySelector('#whip .poster').click()`);
  await p.until(loaded('whip'), 30000);
  t = await p.eval(slide('whip'));
  expect('a click on the picture still runs it', t.live && t.active, t);
  await p.close();
}

// ------------------------------------------------------------------ main

const [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === 'posters') await posters(rest);
  else if (cmd === 'check') process.exitCode = await check();
  else { console.log('usage: node tools/site.mjs posters [id ...] | check'); process.exitCode = 2; }
} catch (e) { console.error(String(e.message || e)); process.exitCode = 1; }
