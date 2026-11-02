// ===================================================================
// 整理パック 3(2026-11-02)  seiri1.js・seiri2.js のあとに読み込む
//   1. 予定の一覧をコンパクトに(回答済みは1行)+ 出欠に「遅刻」「早退」(日程調整と同じ考え方)
//      ※ サーバーの形は変えない:遅刻・早退は「参加」+ ひとことの先頭に「遅刻」「早退」と記録する
//        (日程調整で決めたときと同じ記録のしかた。人数の集計・催促・出席率はそのまま動く)
//   2. ホームの「新着」と「対応待ち」をひとつに(新着の欄はなくし、対応待ちに NEW の印)
//      ログイン時の「新しいお知らせ」の画面は、重要なお知らせのときだけ出す
//   3. タスク:一覧の上のボタンを「⋯」にまとめる/詳細の空の欄・催促はたたむ
// ===================================================================
var SEIRI3_VER = '整理3 (2026-11-02)';
(function () {
  'use strict';
  var A = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var has = function (n) { return typeof window[n] === 'function'; };
  var safe = function (f, d) { try { return f(); } catch (e) { return d; } };
  var txt = function (el) { return (el && (el.innerText || el.textContent) || '').replace(/\s+/g, ' ').trim(); };

  var css = document.createElement('style');
  css.textContent = [
    '.votes.s3v{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}',
    '.votes.s3v button{padding:8px 0;font-size:12px;line-height:1.25;white-space:normal}',
    '.votes.s3v button b{display:block;font-size:16px;font-weight:normal}',
    '.votes.s3v button.on{outline:2px solid var(--red);font-weight:bold}',
    '.card.s3c{padding-top:8px;padding-bottom:8px}',
    '.card.s3c .m{display:inline;margin-left:4px}',
    '.s3me{display:inline-block;font-size:12px;border-radius:10px;padding:1px 8px;margin-left:6px;background:#eef7ee;color:#2e7d32;white-space:nowrap}',
    '.s3me.x{background:#fdecea;color:#c62828}.s3me.t{background:#fff4e0;color:#b26a00}.s3me.l{background:#e8f0fe;color:#1a5fb4}',
    '.s3new{display:inline-block;background:#c62828;color:#fff;border-radius:8px;font-size:10px;font-weight:bold;padding:0 5px;margin-left:4px;vertical-align:1px}',
    '#s3TMenu{position:relative;display:inline-block}',
    '#s3TMenu .pop{position:absolute;left:0;top:100%;z-index:20;background:#fff;border:1px solid var(--line);border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.15);padding:6px;display:none;min-width:170px}',
    'html.dark #s3TMenu .pop{background:#2a2a2e}',
    '#s3TMenu.open .pop{display:block}',
    '#s3TMenu .pop button{display:block;width:100%;text-align:left;margin:2px 0}'
  ].join('');
  document.head.appendChild(css);

  // ================================================================ 1. 出欠:遅刻・早退
  var LT = ['遅刻', '早退'];
  function lateOf(c) { var m = /^(遅刻|早退)(\s*\/\s*|\s+|$)/.exec(String(c || '')); return m ? m[1] : ''; }
  function stripLate(c) { return String(c || '').replace(/^(遅刻|早退)(\s*\/\s*|\s+|$)/, '').trim(); }
  function withLate(type, memo) { memo = stripLate(memo); return type ? (memo ? type + ' / ' + memo : type) : memo; }
  // 画面に出す5つ(参加・遅刻・早退・未定・不参加)
  var CH = [['参加', '', '⭕', '参加'], ['参加', '遅刻', '⏰', '遅刻'], ['参加', '早退', '🏃', '早退'], ['未定', '', '🔺', '未定'], ['不参加', '', '❌', '不参加']];
  function myChoice(a) { if (!a) return -1; var lt = a.status === '参加' ? lateOf(a.comment) : ''; for (var i = 0; i < CH.length; i++) if (CH[i][0] === a.status && CH[i][1] === lt) return i; return -1; }
  function votesHtml(sel) {
    return CH.map(function (c, i) { return '<button type="button" class="v-' + c[0] + (i === sel ? ' on' : '') + '" data-i="' + i + '"><b>' + c[2] + '</b>' + c[3] + '</button>'; }).join('');
  }
  function lateCounts(eid) {
    var on = {}, r = { 遅刻: 0, 早退: 0 };
    safe(function () { activeUsers().forEach(function (u) { on[u.uid] = 1; }); });
    D.att.forEach(function (a) { if (a.eventId === eid && on[a.uid] && a.status === '参加') { var l = lateOf(a.comment); if (l) r[l]++; } });
    return r;
  }
  function meChip(a) {
    var i = myChoice(a); if (i < 0) return '';
    var c = CH[i], cls = c[0] === '不参加' ? ' x' : c[0] === '未定' ? ' t' : c[1] ? ' l' : '';
    return '<span class="s3me' + cls + '">あなた:' + c[2] + ' ' + c[3] + '</span>';
  }
  function sendChoice(eid, i, memo, done) {
    var c = CH[i]; vote(eid, c[0], withLate(c[1], memo), done);
    if (c[1] && navigator.onLine !== false) toast('「' + c[3] + '」で回答しました');
  }
  if (has('eventCard')) {
    var eventCard0 = eventCard;
    eventCard = function (e, inPop) {
      var el = eventCard0.apply(this, arguments);
      try {
        if (!el || el.nodeType !== 1) return el;
        var mine = safe(function () { return myVote(e.id); }, null);
        var v = el.querySelector('.votes');
        // 回答済みで、これからの予定は1行にたたむ(押すと詳しい画面で変えられる)
        if (mine && !inPop && v && !e.canceled) {
          el.classList.add('s3c'); v.remove();
          var cnt = el.querySelector('.cnt'); if (cnt) cnt.remove();
          var qa = el.querySelector('.qa'); // 前日・当日の「遅刻・欠席の連絡」ボタンは残す
          var t = el.querySelector('.t'); if (t) t.insertAdjacentHTML('afterend', meChip(mine));
          if (qa) el.appendChild(qa);
          return el;
        }
        if (v) {
          v.classList.add('s3v'); v.innerHTML = votesHtml(myChoice(mine));
          A('button', v).forEach(function (b) {
            b.onclick = function (ev) {
              ev.stopPropagation();
              sendChoice(e.id, +b.dataset.i, mine ? mine.comment : '', function () { if (inPop) { el.remove(); var pl = $('popList'); if (pl && !pl.children.length) { closeSheet(); toast('回答ありがとうございます'); } } });
            };
          });
        }
        var cn = el.querySelector('.cnt');
        if (cn) { var lc = lateCounts(e.id); if (lc.遅刻 || lc.早退) { var b0 = cn.querySelector('b'); b0 && b0.insertAdjacentHTML('afterend', '<span class="note">(遅刻' + lc.遅刻 + '・早退' + lc.早退 + ')</span>'); } }
      } catch (x) { }
      return el;
    };
  }
  if (has('openEvent')) {
    var openEvent0s3 = openEvent;
    openEvent = function (id) {
      var r = openEvent0s3.apply(this, arguments);
      try {
        var ev = (D.events || []).filter(function (x) { return x.id === id; })[0], v = $('edV'), cm = $('edCm');
        if (ev && v) {
          var mine = safe(function () { return myVote(ev.id); }, null);
          if (cm) cm.value = stripLate(cm.value);
          v.classList.add('s3v'); v.innerHTML = votesHtml(myChoice(mine));
          A('button', v).forEach(function (b) { b.onclick = function () { sendChoice(ev.id, +b.dataset.i, cm ? cm.value : '', function () { openEvent(id); }); }; });
          if (cm && !cm.dataset.s3) { cm.dataset.s3 = '1'; cm.placeholder = 'ひとこと(遅れる時間・理由など)'; }
        }
        // 回答状況:遅刻・早退の人数も
        var cnt = ev && A('#panel .cnt')[0];
        if (cnt) { var lc = lateCounts(ev.id); if (lc.遅刻 || lc.早退) cnt.insertAdjacentHTML('beforeend', '<div class="note">参加のうち 遅刻 ' + lc.遅刻 + '人・早退 ' + lc.早退 + '人</div>'); }
      } catch (x) { }
      return r;
    };
  }

  // ================================================================ 2. 新着は「対応待ち」にまとめる
  if (has('newBoxHtml')) newBoxHtml = function () { return ''; };
  if (has('homeTodos')) {
    var homeTodos0s3 = homeTodos;
    homeTodos = function () {
      var rows = homeTodos0s3.apply(this, arguments);
      try {
        var nw = safe(function () { return newItems(); }, []), by = {};
        nw.forEach(function (n) { by[n.k] = (by[n.k] || 0) + 1; });
        rows = rows.map(function (r) {
          var k = /アンケート/.test(r[1]) ? 'アンケート' : /日程調整/.test(r[1]) ? '日程調整' : '';
          return k && by[k] ? [r[0], r[1] + ' 🆕', r[2], r[3], r[4]] : r;
        });
        var td = nw.filter(function (n) { return n.k === 'TODO' || n.k === '提案'; });
        if (td.length) rows.push(['💡', '新しい提案(意見を聞かせてください) 🆕', td.length, 's3NewTd', function () { try { nwMark(td.map(function (n) { return n.id; })); } catch (e) { } TODO_VIEW = 'open'; typeof goVk === 'function' ? goVk('todo') : goTab('todo'); }]);
      } catch (e) { }
      return rows;
    };
  }
  if (has('homeTodoHtml')) {
    var homeTodoHtml0s3 = homeTodoHtml;
    homeTodoHtml = function () { return String(homeTodoHtml0s3.apply(this, arguments)).replace(/ 🆕<\/span>/g, '<span class="s3new">NEW</span></span>'); };
  }
  if (has('maybeNoticePopup')) {
    var maybeNoticePopup0 = maybeNoticePopup;
    maybeNoticePopup = function () {
      // 重要なお知らせが未読のときだけ、開いたときに画面を出す(それ以外は「対応待ち」に出る)
      var imp = safe(function () { return unreadNotices().some(function (n) { return n.important; }); }, true);
      return imp ? maybeNoticePopup0.apply(this, arguments) : false;
    };
  }

  // ================================================================ 3. タスク
  function tidyTaskBar() {
    var ex = $('tExpand'); if (!ex || $('s3TMenu')) return;
    var btns = ['tExpand', 'tCollapse', 'tCopy', 'tBulk'].map($).filter(Boolean);
    var w = document.createElement('div'); w.id = 's3TMenu';
    w.innerHTML = '<button class="btn sm line" type="button">⋯ 表示・操作</button><div class="pop"></div>';
    ex.parentNode.insertBefore(w, ex);
    var pop = w.querySelector('.pop');
    btns.forEach(function (b) { pop.appendChild(b); b.addEventListener('click', function () { w.classList.remove('open'); }); });
    w.firstChild.onclick = function (e) { e.stopPropagation(); w.classList.toggle('open'); };
    document.addEventListener('click', function (e) { if (!w.contains(e.target)) w.classList.remove('open'); });
  }
  try { tidyTaskBar(); } catch (e) { }
  function foldSection(p, h3, key, title, note, open) {
    var list = [], n = h3.nextElementSibling;
    while (n && n.tagName !== 'H3' && !(n.tagName === 'BUTTON' && /この(小|中|大)?項目を削除/.test(txt(n)))) { list.push(n); n = n.nextElementSibling; }
    var d = document.createElement('details'); d.className = 's2box'; d.open = !!open;
    d.innerHTML = '<summary>' + title + (note ? '<span class="note">' + note + '</span>' : '') + '</summary><div class="s2in"></div>';
    var inn = d.querySelector('.s2in'); list.forEach(function (x) { inn.appendChild(x); });
    p.replaceChild(d, h3);
  }
  if (has('openTask')) {
    var openTask0s3 = openTask;
    openTask = function () {
      var r = openTask0s3.apply(this, arguments);
      try {
        var p = $('panel');
        A(':scope > h3', p).forEach(function (h) {
          var t = txt(h), next = h.nextElementSibling, nt = txt(next);
          if (/資料・リンク/.test(t) && /リンクはありません/.test(nt)) foldSection(p, h, 'tl', '🔗 資料・リンク', 'まだありません(押して追加)', false);
          else if (/チェックリスト/.test(t) && /チェック項目はありません/.test(nt)) foldSection(p, h, 'tc', '☑ チェックリスト', 'まだありません(押して追加)', false);
          else if (/催促/.test(t)) foldSection(p, h, 'tn', '📣 このタスクの催促', '担当の人にスマホへお知らせを送る', false);
        });
      } catch (e) { }
      return r;
    };
  }

  // メニューの下の版の表示
  try {
    var render0s3 = render;
    render = function () {
      var r = render0s3.apply(this, arguments);
      try { tidyTaskBar(); } catch (e) { }
      try { var f = $('v-menu') && $('v-menu').querySelector('p.note:last-of-type'); if (TAB === 'menu' && f && f.textContent.indexOf('整理3') < 0) f.insertAdjacentText('beforeend', ' ・ 整理3'); } catch (e) { }
      return r;
    };
    if (D) render();
  } catch (e) { }
})();
