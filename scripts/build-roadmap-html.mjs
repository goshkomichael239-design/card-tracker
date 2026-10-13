// Builds ROADMAP.html (a standalone page for the artifacts gallery) from ROADMAP.md.
// Usage: node scripts/build-roadmap-html.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const source = readFileSync(new URL('../ROADMAP.md', import.meta.url), 'utf8');
const lines = source.split(/\r?\n/);

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const inline = (text) =>
  escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>');

let principle = '';
let footer = '';
const sections = [];
let current = null;
let inFooter = false;

for (const line of lines) {
  if (line.startsWith('# ')) continue;

  if (line.startsWith('## ')) {
    const title = line.slice(3).trim();

    if (title === 'Не делаем') {
      inFooter = true;
      current = null;
    } else {
      current = { title: title.replace(/^\d+\.\s*/, ''), items: [] };
      sections.push(current);
    }

    continue;
  }

  const item = line.match(/^- \[( |x)\] (.*)$/);

  if (item && current) {
    const isDone = item[1] === 'x';
    let text = item[2];
    const isCancelled = text.includes('~~');
    let note = '';
    const isPostponed = !isDone && text.includes('**отложено**');
    const split = text.split(/ — \*\*(?:сделано|отменено|отложено)\*\*:? ?/);

    if (split.length > 1) {
      text = split[0];
      note = split.slice(1).join(' ').replace(/^,\s*/, '');
    } else if (isCancelled) {
      const at = text.indexOf(' — ');

      if (at > -1) {
        note = text.slice(at + 3);
        text = text.slice(0, at);
      }
    }

    current.items.push({
      status: isCancelled
        ? 'dropped'
        : isDone
          ? 'done'
          : isPostponed
            ? 'postponed'
            : 'todo',
      text,
      note,
    });
    continue;
  }

  if (line.trim() && !line.startsWith('#')) {
    if (inFooter) footer += (footer ? ' ' : '') + line.trim();
    else if (!current) principle += (principle ? ' ' : '') + line.trim();
  }
}

const all = sections.flatMap((section) => section.items);
const done = all.filter((entry) => entry.status === 'done').length;
const todo = all.filter((entry) => entry.status === 'todo').length;
const dropped = all.filter((entry) => entry.status === 'dropped').length;
const postponed = all.filter((entry) => entry.status === 'postponed').length;
const counted = done + todo + postponed;
const percent = Math.round((done / counted) * 100);

const STATE_LABEL = {
  done: 'сделано',
  dropped: 'отменено',
  postponed: 'отложено',
  todo: 'впереди',
};

const sectionHtml = sections
  .map((section) => {
    const sDone = section.items.filter((entry) => entry.status === 'done').length;
    const sCounted = section.items.filter((entry) => entry.status !== 'dropped').length;
    const rows = section.items
      .map(
        (entry) => `
        <li class="item item--${entry.status}" data-status="${entry.status}">
          <span class="mark" aria-hidden="true"></span>
          <div class="body">
            <p class="text">${inline(entry.text)}</p>
            ${entry.note ? `<p class="note">${inline(entry.note)}</p>` : ''}
          </div>
          <span class="state">${STATE_LABEL[entry.status]}</span>
        </li>`,
      )
      .join('');

    return `
      <section class="block" data-block>
        <header class="block__head">
          <h2>${escapeHtml(section.title)}</h2>
          <span class="block__count">${sDone} из ${sCounted}</span>
        </header>
        <ul class="list">${rows}
        </ul>
      </section>`;
  })
  .join('');

const today = new Date().toLocaleDateString('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const html = `<title>Дорожная карта Card Tracker</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600&display=swap">
<style>
  /* One column of index-card blocks on the table's cloth: what is done, what is ahead. */
  :root {
    --bg: #dfe7de;
    --paper: #f7f3e8;
    --paper-edge: #d9d1bb;
    --ink: #26231d;
    --ink-soft: #6a6354;
    --line: rgba(60, 50, 30, 0.14);
    --cloth: #0f5a37;
    --gold: #a97b1c;
    --gold-soft: #f1dc9a;
    --todo: #8a8372;
    --font-display: 'Lora', Georgia, 'Times New Roman', serif;
    --font-mono: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #0b2418;
      --paper: #17382a;
      --paper-edge: #2a5640;
      --ink: #eef0e2;
      --ink-soft: #a9bcae;
      --line: rgba(238, 240, 226, 0.14);
      --cloth: #2fb36d;
      --gold: #e6bd5c;
      --gold-soft: #4a4020;
      --todo: #8aa391;
      color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --bg: #0b2418;
    --paper: #17382a;
    --paper-edge: #2a5640;
    --ink: #eef0e2;
    --ink-soft: #a9bcae;
    --line: rgba(238, 240, 226, 0.14);
    --cloth: #2fb36d;
    --gold: #e6bd5c;
    --gold-soft: #4a4020;
    --todo: #8aa391;
    color-scheme: dark;
  }

  body {
    background: var(--bg);
    color: var(--ink);
    font-family: var(--font-display);
    padding-inline: 16px;
    padding-block: 28px 56px;
  }
  .page { max-width: 760px; margin-inline: auto; display: grid; gap: 24px; }

  .head { display: grid; gap: 14px; }
  .eyebrow {
    font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--ink-soft);
  }
  h1 { font-size: clamp(28px, 6vw, 40px); line-height: 1.1; font-weight: 600; text-wrap: balance; }
  .principle { color: var(--ink-soft); max-width: 60ch; line-height: 1.5; }

  .progress { display: grid; gap: 10px; }
  .progress__nums { display: flex; flex-wrap: wrap; gap: 6px 20px; align-items: baseline; font-variant-numeric: tabular-nums; }
  .progress__main { font-size: 22px; font-weight: 600; }
  .progress__side { font-family: var(--font-mono); font-size: 12.5px; color: var(--ink-soft); letter-spacing: 0.04em; }
  .bar { height: 12px; border-radius: 7px; background: var(--paper-edge); box-shadow: inset 0 1px 3px rgba(0,0,0,0.25); overflow: hidden; }
  .bar > i { display: block; height: 100%; width: ${percent}%; background: var(--cloth); border-radius: 7px; }

  .filters { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip {
    font-family: var(--font-mono); font-size: 12.5px; letter-spacing: 0.08em; text-transform: uppercase;
    padding: 9px 14px; border-radius: 999px; border: 1px solid var(--paper-edge);
    background: var(--paper); color: var(--ink); cursor: pointer;
  }
  .chip[aria-pressed="true"] { background: var(--cloth); color: #fff; border-color: var(--cloth); }
  .chip:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

  .blocks { display: grid; gap: 22px; }
  .block { display: grid; gap: 0; }
  .block__head {
    display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 12px;
    padding: 10px 16px; background: var(--paper-edge); border-radius: 10px 10px 0 0;
  }
  .block__head h2 { font-size: 17px; font-weight: 600; }
  .block__count { font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.08em; color: var(--ink-soft); font-variant-numeric: tabular-nums; }
  .list { list-style: none; margin: 0; padding: 0; background: var(--paper); border: 1px solid var(--paper-edge); border-top: 0; border-radius: 0 0 10px 10px; }
  .item {
    display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; gap: 12px; align-items: start;
    padding: 12px 16px; border-top: 1px dashed var(--line);
  }
  .item:first-child { border-top: 0; }
  .mark {
    width: 20px; height: 20px; border-radius: 50%; margin-top: 1px;
    border: 2px solid var(--todo); display: grid; place-items: center;
  }
  .item--done .mark { background: var(--cloth); border-color: var(--cloth); }
  .item--done .mark::after { content: ''; width: 5px; height: 10px; border: solid #fff; border-width: 0 2px 2px 0; transform: translateY(-1px) rotate(45deg); }
  .item--dropped .mark { border-style: dashed; opacity: 0.6; }
  .item--postponed .mark { border-style: dotted; }
  .item--postponed .state { color: var(--gold); }
  .text { line-height: 1.4; overflow-wrap: anywhere; }
  .item--dropped .text { color: var(--ink-soft); }
  .note { margin-top: 4px; font-size: 14px; line-height: 1.4; color: var(--ink-soft); overflow-wrap: anywhere; }
  .state {
    font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
    padding-top: 3px; color: var(--todo); white-space: nowrap;
  }
  .item--done .state { color: var(--cloth); }
  code { font-family: var(--font-mono); font-size: 0.86em; background: var(--gold-soft); padding: 1px 5px; border-radius: 4px; }

  .footer { border-top: 1px solid var(--line); padding-top: 16px; color: var(--ink-soft); line-height: 1.5; }
  .footer strong { color: var(--ink); }

  @media (max-width: 480px) {
    .item { grid-template-columns: 22px minmax(0, 1fr); }
    .state { grid-column: 2; padding-top: 0; }
  }
  @media (prefers-reduced-motion: no-preference) {
    .bar > i { animation: grow 700ms ease-out; }
    @keyframes grow { from { width: 0; } }
  }
</style>

<main class="page">
  <header class="head">
    <p class="eyebrow">Card Tracker · состояние на ${today}</p>
    <h1>Дорожная карта</h1>
    <p class="principle">${inline(principle)}</p>
  </header>

  <div class="progress">
    <div class="progress__nums">
      <span class="progress__main">Сделано ${done} из ${counted}</span>
      <span class="progress__side">${percent}% · впереди ${todo} · отложено ${postponed} · отменено ${dropped}</span>
    </div>
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${counted}" aria-valuenow="${done}"><i></i></div>
  </div>

  <div class="filters" role="group" aria-label="Что показывать">
    <button type="button" class="chip" id="f-all" aria-pressed="true" data-filter="all">Всё</button>
    <button type="button" class="chip" id="f-done" aria-pressed="false" data-filter="done">Сделано</button>
    <button type="button" class="chip" id="f-todo" aria-pressed="false" data-filter="todo">Впереди</button>
    <button type="button" class="chip" id="f-postponed" aria-pressed="false" data-filter="postponed">Отложено</button>
  </div>

  <div class="blocks">${sectionHtml}
  </div>

  <footer class="footer">
    <strong>Не делаем.</strong> ${inline(footer)}
  </footer>
</main>

<script>
  (function () {
    var buttons = document.querySelectorAll('[data-filter]');
    var items = document.querySelectorAll('.item');
    var blocks = document.querySelectorAll('[data-block]');

    function apply(filter) {
      items.forEach(function (item) {
        var status = item.getAttribute('data-status');
        item.hidden = !(
          filter === 'all' ||
          (filter === 'done' && status === 'done') ||
          (filter === 'todo' && status === 'todo') ||
          (filter === 'postponed' && status === 'postponed')
        );
      });
      blocks.forEach(function (block) {
        block.hidden = block.querySelectorAll('.item:not([hidden])').length === 0;
      });
      buttons.forEach(function (button) {
        button.setAttribute('aria-pressed', String(button.getAttribute('data-filter') === filter));
      });
      try { localStorage.setItem('roadmap-filter', filter); } catch (e) {}
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () { apply(button.getAttribute('data-filter')); });
    });

    var saved = 'all';
    try { saved = localStorage.getItem('roadmap-filter') || 'all'; } catch (e) {}
    apply(saved === 'done' || saved === 'todo' || saved === 'postponed' ? saved : 'all');
  })();
</script>
`;

writeFileSync(new URL('../ROADMAP.html', import.meta.url), html);
console.log(`ROADMAP.html: done ${done}, todo ${todo}, postponed ${postponed}, dropped ${dropped}, ${percent}%`);
