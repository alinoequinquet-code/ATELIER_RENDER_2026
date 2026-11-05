// Build du front : React + appli Banc2Touche → build/ (Static Site Render, « Publish directory » = build)
// Variables d'environnement lues au build :
//   B2T_API_URL        adresse de l'API Flask (ex. https://b2t-api-xxx.onrender.com)
//   RENDER_GIT_COMMIT  fournie par Render, sert de numéro de version
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'build');
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
const version = `${stamp}-${(process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA || 'local').slice(0, 7)}`;
const apiUrl = (process.env.B2T_API_URL || '').trim().replace(/\/+$/, '');

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, 'public'), out, { recursive: true });

const result = await build({
  absWorkingDir: root,
  entryPoints: ['src/index.js'],
  bundle: true,
  minify: true,
  sourcemap: false,
  format: 'iife',
  target: ['safari15', 'chrome100'],
  jsx: 'automatic',
  loader: { '.js': 'jsx' },
  outdir: 'build/static',
  entryNames: 'app-[hash]',
  metafile: true,
  legalComments: 'none',
  logLevel: 'warning',
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.B2T_API_URL': JSON.stringify(apiUrl),
  },
});

const outputs = Object.keys(result.metafile.outputs).map((f) => path.relative(out, path.join(root, f)).split(path.sep).join('/'));
const js = outputs.find((f) => f.endsWith('.js'));
const css = outputs.find((f) => f.endsWith('.css'));

let html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
html = html.replaceAll('%B2T_VERSION%', version)
  .replace('</head>', `<link rel="stylesheet" href="${css}">\n</head>`)
  .replace('</body>', `<script src="${js}"></script>\n</body>`);
fs.writeFileSync(path.join(out, 'index.html'), html);

// Service worker : tous les fichiers du build, pour fonctionner sans réseau au bord du terrain
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const assets = ['./', ...walk(out).map((f) => path.relative(out, f).split(path.sep).join('/')).filter((f) => !f.endsWith('.txt')).sort()];
const sw = fs.readFileSync(path.join(root, 'src', 'sw.template.js'), 'utf8')
  .replaceAll('__VERSION__', version)
  .replace('__ASSETS__', JSON.stringify(assets));
fs.writeFileSync(path.join(out, 'sw.js'), sw);

const kb = (f) => Math.round(fs.statSync(path.join(out, f)).size / 1024);
console.log(`Banc2Touche ${version} · API ${apiUrl || '(à régler dans l’appli)'} · ${js} ${kb(js)} Ko · ${css} ${kb(css)} Ko · ${assets.length} fichiers hors connexion`);
