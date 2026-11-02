// ===================================================================
// 整理パック 2(2026-11-02)  seiri1.js のあとに読み込む
//   2. 予定の詳細:運営向けの機能を「🛠 運営用」にたたむ
//   4. 設定:4つ(機能・メンバーと権限・通知とメール・データと年度)に分ける
//   5. 右上のボタン:スマホでは「↻」を隠す(引っぱって更新)/ポータルのアイコンを変える
//   6. マイページを3つ(プロフィール・表示とアカウント・記録)に分ける/通知の種類を4つにまとめる
//   7. 「＋ 回答を集める」から、アンケートか日程調整を選んで作る
//   ＋ 直し:「回答」→「アンケート」を押すと、アンケートの一覧が開くように(整理1で開けなくなっていた)
// ===================================================================
var SEIRI2_VER = '整理2 (2026-11-02)';
(function () {
  'use strict';
  var A = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var has = function (n) { return typeof window[n] === 'function'; };
  var safe = function (f, d) { try { return f(); } catch (e) { return d; } };
  var txt = function (el) { return (el && (el.innerText || el.textContent) || '').replace(/\s+/g, ' ').trim(); };
  var sget = function (k) { try { return store.get(k); } catch (e) { return null; } };
  var sset = function (k, v) { try { store.set(k, v); } catch (e) { } };

  var css = document.createElement('style');
  css.textContent = [
    '@media (pointer:coarse){#reload{display:none!important}}',
    'details.s2box{background:#fff;border-radius:12px;margin:10px 0;padding:0 12px;box-shadow:0 1px 2px rgba(0,0,0,.06);border:1px solid var(--line)}',
    'html.dark details.s2box{background:#1e1e21}',
    'details.s2box>summary{padding:12px 0;font-weight:bold;cursor:pointer;list-style:none}',
    'details.s2box>summary::-webkit-details-marker{display:none}',
    'details.s2box>summary:after{content:"▾";float:right;color:var(--muted)}',
    'details.s2box[open]>summary:after{content:"▴"}',
    'details.s2box>summary .note{font-weight:normal;display:block;margin-top:2px}',
    'details.s2box>.s2in{padding-bottom:10px}',
    '.s2seg{display:flex;gap:4px;margin:4px 0 12px;background:var(--line);border-radius:10px;padding:3px}',
    '.s2seg button{flex:1;border:0;background:none;padding:8px 2px;border-radius:8px;font-size:13px;color:var(--muted)}',
    '.s2seg button.on{background:#fff;color:var(--red);font-weight:bold;box-shadow:0 1px 2px rgba(0,0,0,.1)}',
    'html.dark .s2seg button.on{background:#2a2a2e}',
    '.s2hide{display:none!important}'
  ].join('');
  document.head.appendChild(css);

  // 折りたたみの箱を作る(開いているかどうかは、この端末に覚えておく)
  function box(key, title, note, nodes, openDef) {
    var d = document.createElement('details'); d.className = 's2box'; d.dataset.k = key;
    var st = sget('wbs_s2_' + key); d.open = st === null ? !!openDef : st === '1';
    d.innerHTML = '<summary>' + title + (note ? '<span class="note">' + note + '</span>' : '') + '</summary><div class="s2in"></div>';
    var inn = d.querySelector('.s2in'); nodes.forEach(function (n) { inn.appendChild(n); });
    d.addEventListener('toggle', function () { sset('wbs_s2_' + key, d.open ? '1' : '0'); });
    return d;
  }

  // ================================================================ 直し:アンケートの一覧をシートで開く
  if (has('renderTodoPolls')) {
    openPolls = function () {
      openSheet('<button class="x" onclick="closeSheet()">✕</button><h2>🗳 アンケート</h2><div id="s2Pl"></div>');
      try { renderTodoPolls($('s2Pl')); } catch (e) { $('s2Pl').innerHTML = '<div class="empty">表示できませんでした</div>'; }
    };
  }

  // ================================================================ 7. 回答を集める(アンケートか日程調整を選ぶ)
  function canPoll() { return safe(function () { return canPollNew(); }, false); }
  function canSched() { return fon('scheds') && safe(function () { return canAddEv(); }, false); }
  function openCollect() {
    var rows = [
      fon('polls') && canPoll() ? ['poll', '🗳', 'アンケート', '質問を作って答えてもらう(1つ選ぶ・複数選ぶ・意見を出し合う)'] : null,
      canSched() ? ['sched', '🗓', '日程調整', '候補日を出して、みんなの都合を聞く(決まったら予定になる)'] : null
    ].filter(Boolean);
    openSheet('<button class="x" onclick="closeSheet()">✕</button><h2>＋ 回答を集める</h2><p class="note">何を聞きますか？</p><div class="mlist s1hub">' + rows.map(function (r) { return '<div class="mitem" data-c="' + r[0] + '"><b>' + r[1] + '</b><span>' + r[2] + '<span class="note">' + r[3] + '</span></span><i>›</i></div>'; }).join('') + '</div>');
    A('#panel [data-c]').forEach(function (el) { el.onclick = function () { el.dataset.c === 'poll' ? openPollForm(null) : openSchedForm(null); }; });
  }
  window.openCollect = openCollect;
  if (has('openAnswers')) {
    var openAnswers0 = openAnswers;
    openAnswers = function () {
      var r = openAnswers0.apply(this, arguments);
      try { if ((fon('polls') && canPoll()) || canSched()) { var l = document.querySelector('#panel .mlist'); l && l.insertAdjacentHTML('afterend', '<button class="btn pri full" id="s2Col" style="margin-top:12px">＋ 回答を集める(アンケート・日程調整を作る)</button>'); $('s2Col') && ($('s2Col').onclick = openCollect); } } catch (e) { }
      return r;
    };
    try { var mm = menuOpenMap; menuOpenMap = function () { var m = mm.apply(this, arguments); m.answers = openAnswers; return m; }; } catch (e) { }
  }

  // ================================================================ 2. 予定の詳細:運営用をたたむ
  if (has('openEvent')) {
    var openEvent0 = openEvent;
    openEvent = function () {
      var r = openEvent0.apply(this, arguments);
      try { tidyEvent(); } catch (e) { }
      return r;
    };
  }
  function tidyEvent() {
    var p = $('panel'); if (!p || p.querySelector('details.s2box[data-k="evadm"]')) return;
    var kids = A(':scope > *', p), adm = [];
    var isAdm = function (el) {
      if (/^(evPx|edPx|edRemind|edNz|edMtg|edShow)$/.test(el.id || '')) return true;
      var t = txt(el);
      if (el.classList.contains('note') && /名前を押すと、その人だけに催促/.test(t)) return true;
      if (el.classList.contains('box') && /参加費/.test(t) && el.querySelector('button')) return true;
      if (el.classList.contains('row') && el.querySelector('button') && /(編集|中止にする|削除|日付を移動|コピー)/.test(t) && !/送信/.test(t)) return true;
      return false;
    };
    kids.forEach(function (el) { if (isAdm(el)) adm.push(el); });
    if (adm.length < 2) return; // 一般の人(運営の機能がない)はそのまま
    // 遅刻・早退・欠席の連絡は、自分の出欠のすぐ下へ
    var q = $('edQ'), cm = $('edCm') || $('edV');
    if (q && cm) cm.parentNode.insertBefore(q, cm.nextSibling);
    var d = box('evadm', '🛠 運営用', '代わりに回答・催促・参加費・会議・タイムテーブル・編集', adm, false);
    // 運営用の箱は、いちばん下(「登録:」の上)に置く。出欠・回答状況・コメントが先に見えるように
    var reg = A(':scope > p', p).filter(function (x) { return /登録:/.test(txt(x)); })[0];
    reg ? p.insertBefore(d, reg) : p.appendChild(d);
  }

  // ================================================================ 4. 設定を4つに分ける
  var SET_SEC = [
    ['feat', '⚙️ 機能', '使う機能・カテゴリ・予定の種類・会計の科目'],
    ['mem', '👥 メンバーと権限', '権限・お世話係・公式パート・入力のお願い'],
    ['ntf', '🔔 通知とメール', 'メール・リマインド・前日や当日のお知らせ・週1まとめ'],
    ['data', '🗂 データと年度', 'アプリ名・引き継ぎ・期間・新年度・バックアップ・システムの状態']
  ];
  function secOfH3(t) {
    if (/カテゴリ|練習・予定の種類|会計の科目/.test(t)) return 'feat';
    if (/メール|リマインド/.test(t)) return 'ntf';
    if (/公式パート/.test(t)) return 'mem';
    if (/バックアップ|アプリのURL|カレンダー/.test(t)) return 'data';
    return '';
  }
  function secOverride(el) {
    var t = txt(el);
    if (el.tagName === 'LABEL' || el.tagName === 'P') {
      if (/マイページ.*使えないように|入会時アンケート.*使えないように/.test(t)) return 'mem';
      if (/回答期限が過ぎたら、集計|本番の当日、タイムテーブル|週1回の運営まとめ/.test(t)) return 'ntf';
      if (/^対象:期限が近い/.test(t)) return 'ntf';
      if (/古い記録の自動整理/.test(t)) return 'data';
      if (/表示範囲は、メニューの「期間/.test(t)) return 'data';
    }
    return '';
  }
  function secOfItem(t) {
    if (/権限|お世話係/.test(t)) return 'mem';
    if (/期間|新年度|システムの状態|名前|引き継ぎ|タスクのコピー|データの控え/.test(t)) return 'data';
    return 'feat';
  }
  if (has('openSettings')) {
    var openSettings0 = openSettings;
    openSettings = function () {
      var r = openSettings0.apply(this, arguments);
      try { tidySettings(); } catch (e) { }
      return r;
    };
  }
  function tidySettings() {
    var p = $('panel'); if (!p || p.querySelector('details.s2box[data-k^="set_"]')) return;
    var h2 = p.querySelector('h2'); if (!h2 || !/設定/.test(txt(h2))) return;
    var save = $('sSave');
    var groups = { feat: [], mem: [], ntf: [], data: [] }, cur = 'feat', after = false, kids = A(':scope > *', p);
    kids.forEach(function (el) {
      if (el === h2 || el.classList.contains('x') || el === save) return;
      if (el.tagName === 'H3') { var s = secOfH3(txt(el)); if (/機能ごとの設定|全体の設定/.test(txt(el))) { el.remove(); return; } cur = s || cur; groups[cur].push(el); return; }
      if (el.classList.contains('mlist')) {
        // 一覧は、項目ごとに分けて入れ直す
        var by = {};
        A(':scope > .mitem', el).forEach(function (it) { var k = secOfItem(txt(it)); (by[k] = by[k] || []).push(it); });
        Object.keys(by).forEach(function (k) { var l = document.createElement('div'); l.className = el.className; by[k].forEach(function (it) { l.appendChild(it); }); groups[k].unshift(l); });
        el.remove(); return;
      }
      var o = secOverride(el); groups[o || cur].push(el);
    });
    var anchor = save || null;
    SET_SEC.forEach(function (s, i) {
      if (!groups[s[0]].length) return;
      var d = box('set_' + s[0], s[1], s[2], groups[s[0]], false);
      anchor ? p.insertBefore(d, anchor) : p.appendChild(d);
    });
    if (save) save.insertAdjacentHTML('beforebegin', '<p class="note" style="margin-top:10px">※ チェックや入力を変えたら、最後に「設定を保存」を押してください(開いていない箱の中も、そのまま保存されます)。</p>');
  }

  // ================================================================ 5. 右上のボタン
  try {
    var pt = $('ptl'); if (pt) { pt.textContent = '🏮'; pt.title = 'チームのきまり(ポータル)'; pt.setAttribute('aria-label', 'チームのきまり(ポータル)'); }
  } catch (e) { }

  // ================================================================ 6. マイページを3つに分ける
  var ME_TABS = [['prof', '👤 プロフィール'], ['acct', '⚙️ 表示とアカウント'], ['rec', '📊 記録']];
  function meSec(t) {
    if (/催促|出席率/.test(t)) return 'rec';
    if (/文字の大きさ|画面の明るさ|ログインID|パスワード|ログインしている端末|カレンダー|休会・復帰・脱退/.test(t)) return 'acct';
    return 'prof';
  }
  if (has('openMe')) {
    var openMe0 = openMe;
    openMe = function () {
      var r = openMe0.apply(this, arguments);
      try { tidyMe(); } catch (e) { }
      return r;
    };
  }
  function tidyMe() {
    var p = $('panel'); if (!p || $('s2MeSeg')) return;
    var h2 = p.querySelector('h2'); if (!h2 || !/マイページ/.test(txt(h2))) return;
    var cur = 'prof', kids = A(':scope > *', p), map = [];
    kids.forEach(function (el) {
      if (el === h2 || el.classList.contains('x')) return;
      if (el.tagName === 'H3') cur = meSec(txt(el));
      el.dataset.s2me = cur; map.push(el);
    });
    var seg = document.createElement('div'); seg.className = 's2seg'; seg.id = 's2MeSeg';
    seg.innerHTML = ME_TABS.map(function (t) { return '<button type="button" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('');
    h2.parentNode.insertBefore(seg, h2.nextSibling);
    // プロフィールの欄は、ひと目でわかるように並べ替え(プロフィール → 緊急連絡先 → 入会時アンケート)
    var show = function (k) {
      sset('wbs_s2_me', k);
      A('button', seg).forEach(function (b) { b.classList.toggle('on', b.dataset.t === k); });
      map.forEach(function (el) { el.classList.toggle('s2hide', el.dataset.s2me !== k); });
    };
    A('button', seg).forEach(function (b) { b.onclick = function () { show(b.dataset.t); }; });
    var st = sget('wbs_s2_me'); show(ME_TABS.some(function (t) { return t[0] === st; }) ? st : 'prof');
  }

  // 通知の種類を4つにまとめる(細かく選ぶこともできる)
  var PUSH_GRP = [
    ['imp', '📢 大事な連絡', 'お知らせ・アンケート、予定の変更や中止、@で呼ばれたとき、コメントへの返信', ['notice', 'event', 'mention', 'reply']],
    ['rem', '📣 催促・お願い', '出欠・集金・確認のお願い', ['remind']],
    ['show', '🎌 練習・本番の前', '前日のお知らせ、本番の出番前、熱中症の注意', ['tomorrow', 'show', 'heat']],
    ['etc', '🤝 その他', '毎朝のまとめ、遅刻・欠席の連絡(記録する人あて)、新人のお世話係', null]
  ];
  function tidyPush() {
    var sv = $('puSave'); if (!sv || $('s2PuG')) return false;
    var bx = sv.parentNode, cbs = A('input[data-pc]', bx); if (!cbs.length) return true;
    var known = {}; PUSH_GRP.forEach(function (g) { (g[3] || []).forEach(function (c) { known[c] = 1; }); });
    var mem = function (g) { return cbs.filter(function (c) { return g[3] ? g[3].indexOf(c.dataset.pc) >= 0 : !known[c.dataset.pc]; }); };
    var w = document.createElement('div'); w.id = 's2PuG';
    PUSH_GRP.forEach(function (g) {
      var ms = mem(g); if (!ms.length) return;
      var l = document.createElement('label'); l.className = 'cl';
      l.innerHTML = '<input type="checkbox"><span><b>' + g[1] + '</b><br><span class="note">' + g[2] + '</span></span>';
      var c = l.querySelector('input');
      var sync = function () { var n = ms.filter(function (m) { return m.checked; }).length; c.checked = n === ms.length; c.indeterminate = n > 0 && n < ms.length; };
      sync(); c.onchange = function () { ms.forEach(function (m) { m.checked = c.checked; }); };
      ms.forEach(function (m) { m.addEventListener('change', sync); });
      w.appendChild(l);
    });
    var det = document.createElement('details'); det.className = 'hdet'; det.innerHTML = '<summary class="note" style="cursor:pointer;margin:6px 0">細かく選ぶ(' + cbs.length + '種類)</summary>';
    cbs.forEach(function (c) { det.appendChild(c.closest('label')); });
    bx.insertBefore(w, bx.firstChild); bx.insertBefore(det, sv);
    return true;
  }
  if (has('openPush')) {
    var openPush0s = openPush;
    openPush = function () {
      var r = openPush0s.apply(this, arguments), n = 0;
      var t = setInterval(function () { if (tidyPush() || ++n > 40) clearInterval(t); }, 250); // 読み込みが終わってから整える
      return r;
    };
  }

  // メニューの下の版の表示
  try {
    var render0s2 = render;
    render = function () {
      var r = render0s2.apply(this, arguments);
      try { var f = $('v-menu') && $('v-menu').querySelector('p.note:last-of-type'); if (TAB === 'menu' && f && f.textContent.indexOf('整理2') < 0) f.insertAdjacentText('beforeend', ' ・ 整理2'); } catch (e) { }
      return r;
    };
  } catch (e) { }
})();
