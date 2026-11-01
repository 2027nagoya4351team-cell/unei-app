// ===================================================================
// 整理パック 1(2026-11-02)  v10.65 の画面に重ねて読み込む
//   1. 同じものが2か所にあるのをやめる(予定を1つに・割り勘は「使う」の中へ)
//   2. 答えるもの(出欠・アンケート・日程調整・本番の振り返り)を「回答」に集める
//   3. メニューの階層を浅く(中継の画面をなくし、メニューから直接開く)
//   4. ホームを「対応待ち・今日明日・お知らせ」中心に
//   5. 班まわりを「班」の画面に集める
//   6. 管理・自分のメニューを減らす
//   9. 言葉をそろえる(予定・日程調整・提案)
//   ＋ 文章の中のURLを押せるように・リンク欄のリンクを一覧にも出す・https:// を自動で付ける
//   ＋ 使い方ガイドの整理
// ※ 元の関数は消さずに「包んで」使う(元に戻すときはこのファイルを外すだけ)
// ===================================================================
var SEIRI_VER = '整理1 (2026-11-02)';
(function () {
  'use strict';
  var A = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var has = function (n) { return typeof window[n] === 'function'; };
  var safe = function (f, d) { try { return f(); } catch (e) { return d; } };
  var n0 = function (f) { return safe(f, 0) || 0; };

  // ---------------------------------------------------------------- 見た目
  var css = document.createElement('style');
  css.textContent = [
    'a.autolink{color:var(--blue,#1a73e8);text-decoration:underline;word-break:break-all}',
    '.lchips{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}',
    '.lchip{display:inline-flex;align-items:center;gap:3px;max-width:100%;font-size:12px;line-height:1.3;padding:2px 8px;border-radius:12px;background:#eef4fd;color:#1a5fb4;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    'html.dark .lchip{background:#24324a;color:#9cc3ff}',
    '#evSeg button[data-v="up"]{display:none}',
    '#v-events.s1up #evSeg{display:none}',
    '#scSeg{display:none}',
    '.gseg button{font-size:14px}',
    '.s1hub .mitem .note{display:block}',
    '.s1lay{float:right;border:0;background:none;color:var(--muted);font-size:13px;cursor:pointer;padding:2px 4px}',
    '.s1guide details{background:#fff;border-radius:12px;margin:8px 0;padding:2px 12px;box-shadow:0 1px 2px rgba(0,0,0,.06)}',
    'html.dark .s1guide details{background:#1e1e21}',
    '.s1guide summary{padding:10px 0;font-weight:bold;cursor:pointer}',
    '.s1guide .gq{border-top:1px solid var(--line);padding:8px 0}',
    '.s1guide .gq b{display:block;margin-bottom:2px}',
    '.s1guide .gq p{margin:2px 0;line-height:1.6;font-size:13px}'
  ].join('');
  document.head.appendChild(css);

  // ================================================================ リンク
  // 文章の中の URL を押せるように(画面に出た文字をあとから見て、URL の部分だけリンクにする)
  var URL_RE = /(https?:\/\/[^\s<>"'「」『』（）【】、。]+|www\.[a-z0-9-]+\.[^\s<>"'「」『』（）【】、。]+)/gi;
  var SKIP = 'a,button,textarea,input,select,option,script,style,code,pre,[contenteditable],.nolink,.cal,.gwrap,#tabs,#gseg';
  function trimUrl(u) { var t = ''; while (/[).,!?:;）』」]$/.test(u)) { t = u.slice(-1) + t; u = u.slice(0, -1); } return [u, t]; }
  function linkifyText(node) {
    var s = node.data; URL_RE.lastIndex = 0; if (!URL_RE.test(s)) return; URL_RE.lastIndex = 0;
    var frag = document.createDocumentFragment(), last = 0, m;
    while ((m = URL_RE.exec(s))) {
      var p = trimUrl(m[0]), url = p[0]; if (url.length < 8) continue;
      if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
      var a = document.createElement('a'); a.className = 'autolink'; a.href = /^www\./i.test(url) ? 'https://' + url : url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = url;
      frag.appendChild(a); if (p[1]) frag.appendChild(document.createTextNode(p[1]));
      last = m.index + m[0].length;
    }
    if (!last) return;
    if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
  function linkifyIn(root) {
    if (!root || root.nodeType === 3) { if (root && root.parentNode && !(root.parentNode.closest && root.parentNode.closest(SKIP))) linkifyText(root); return; }
    if (root.nodeType !== 1 || (root.closest && root.closest(SKIP))) return;
    if ((root.textContent || '').search(/https?:\/\/|www\./i) < 0) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [], t;
    while ((t = w.nextNode())) { if (t.data.length < 20000 && /https?:\/\/|www\./i.test(t.data) && !(t.parentNode.closest && t.parentNode.closest(SKIP))) list.push(t); }
    list.forEach(linkifyText);
  }
  var pend = [], tick = 0;
  function wording(n) { if (n.nodeType !== 1) return; A('button', n).concat(n.tagName === 'BUTTON' ? [n] : []).forEach(function (b) { if (b.textContent === '＋ 練習・予定') b.textContent = '＋ 予定'; }); }
  function flush() { tick = 0; var l = pend; pend = []; l.forEach(function (n) { if (n.isConnected) { linkifyIn(n); wording(n); } }); }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1 || n.nodeType === 3) pend.push(n); }); });
    if (pend.length && !tick) tick = requestAnimationFrame(flush);
  }).observe(document.body, { childList: true, subtree: true });
  // リンクを押したときに、行そのもの(タスクや予定を開く)が反応しないようにする
  window.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a.autolink,a.lchip'); if (a) e.stopPropagation(); }, true);

  // リンク欄:https:// が無くても、ドメインの形なら自動で付ける(入力欄を離れたとき)
  function fixUrl(v) { v = String(v || '').trim(); if (!v || /^https?:\/\//i.test(v)) return v; if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+([\/?#].*)?$/i.test(v)) return 'https://' + v; return v; }
  function isUrlInput(el) { return el && el.tagName === 'INPUT' && (/https?:\/\//.test(el.placeholder || '') || /^(hfL|sfU)$/.test(el.id) || el.type === 'url'); }
  document.addEventListener('focusout', function (e) { var el = e.target; if (!isUrlInput(el)) return; var v = fixUrl(el.value); if (v !== el.value) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); } }, true);
  if (has('linkEditor')) {
    var linkEditor0 = linkEditor;
    linkEditor = function (box) {
      var o = linkEditor0.apply(this, arguments);
      if (o && typeof o.get === 'function') {
        var g = o.get;
        o.get = function () { A('input', box).forEach(function (el) { if (!isUrlInput(el)) return; var v = fixUrl(el.value); if (v !== el.value) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); } }); return g.apply(this, arguments); };
      }
      return o;
    };
  }

  // リンク欄に入れたリンクを、一覧(タスク・予定・お知らせ)にも小さく出す
  function linksOf(x) { var l = x && x.links; if (typeof l === 'string') l = safe(function () { return JSON.parse(l); }, []); return Array.isArray(l) ? l.filter(function (k) { return k && /^https?:\/\//i.test(k.u); }) : []; }
  function chipsHtml(l) {
    if (!l.length) return '';
    return '<div class="lchips">' + l.slice(0, 4).map(function (k) { return '<a class="lchip" href="' + esc(k.u) + '" target="_blank" rel="noopener">' + (has('linkIcon') ? linkIcon(k.u) : '🔗') + ' ' + esc(k.n || k.u.replace(/^https?:\/\//, '').slice(0, 30)) + '</a>'; }).join('') + (l.length > 4 ? '<span class="note">ほか' + (l.length - 4) + '件</span>' : '') + '</div>';
  }
  // リンク欄で名前を入れなかったリンクも、URLを名前の代わりに出す(アイコンだけにならないように)
  if (has('linksHtml')) {
    var linksHtml0 = linksHtml;
    linksHtml = function (l) { return linksHtml0((l || []).map(function (k) { return k && !String(k.n || '').trim() ? { n: String(k.u || '').replace(/^https?:\/\//, '').slice(0, 40), u: k.u } : k; })); };
  }
  if (has('taskRow')) {
    var taskRow0 = taskRow;
    taskRow = function (e) {
      var el = taskRow0.apply(this, arguments);
      try { var src = (D.tasks || []).filter(function (x) { return x.id === e.id; })[0] || e, l = linksOf(src); if (l.length && el && el.querySelector('.tmain')) el.querySelector('.tmain').insertAdjacentHTML('beforeend', chipsHtml(l)); } catch (x) { }
      return el;
    };
  }
  if (has('eventCard')) {
    var eventCard0 = eventCard;
    eventCard = function (e) {
      var el = eventCard0.apply(this, arguments);
      try { var l = linksOf(e); if (l.length && el && el.nodeType === 1) { var v = el.querySelector('.votes'); var h = chipsHtml(l); v ? v.insertAdjacentHTML('beforebegin', h) : el.insertAdjacentHTML('beforeend', h); } } catch (x) { }
      return el;
    };
  }
  if (has('noticeCard')) {
    var noticeCard0 = noticeCard;
    noticeCard = function (e) {
      var el = noticeCard0.apply(this, arguments);
      try { var l = linksOf(e); if (l.length && el && el.nodeType === 1) el.insertAdjacentHTML('beforeend', chipsHtml(l)); } catch (x) { }
      return el;
    };
  }

  // ================================================================ 9. 言葉
  TITLES.events = '予定'; TITLES.sched = '予定'; TITLES.todo = '提案';

  // ================================================================ 1. 下のタブ(予定を1つに・ガントはタスクの横へ)
  var VK = {
    tasks: { g: 'do', t: '📋 タスク', go: function () { TAB = 'tasks'; } },
    gantt: { g: 'do', t: '📊 ガント', go: function () { TAB = 'sched'; scView = 'gantt'; } },
    todo: { g: 'do', t: '💡 提案', go: function () { TAB = 'todo'; if (TODO_VIEW === 'polls') TODO_VIEW = 'open'; } },
    up: { g: 'plan', t: 'これから', go: function () { TAB = 'events'; evView = 'up'; } },
    cal: { g: 'plan', t: 'カレンダー', go: function () { TAB = 'sched'; scView = 'cal'; } },
    year: { g: 'plan', t: '年間', go: function () { TAB = 'sched'; scView = 'year'; } },
    past: { g: 'plan', t: '過去・出席率', go: function () { TAB = 'events'; if (evView === 'up') evView = 'past'; } }
  };
  var GRP = { do: ['tasks', 'gantt', 'todo'], plan: ['up', 'cal', 'year', 'past'] };
  function curVk() {
    if (TAB === 'tasks') return 'tasks'; if (TAB === 'todo') return 'todo';
    if (TAB === 'sched') return scView === 'gantt' ? 'gantt' : scView === 'year' ? 'year' : 'cal';
    if (TAB === 'events') return evView === 'up' ? 'up' : 'past';
    return '';
  }
  function goVk(k) {
    var v = VK[k]; if (!v) return; v.go();
    store.set('wbs_s1_' + v.g, k); store.set('wbs_tab', TAB); scrollTop0();
    if (TAB === 'sched' && has('renderSched')) { /* 表示の切り替えは render の中で行われる */ }
    D ? render() : tabsMark();
  }
  function grpGo(g) { var k = store.get('wbs_s1_' + g); goVk(GRP[g].indexOf(k) >= 0 ? k : GRP[g][0]); }
  window.goVk = goVk;
  function bindTabs() {
    A('#tabs button').forEach(function (b) {
      if (b.dataset.s1) return; b.dataset.s1 = '1';
      b.onclick = function () {
        if (b.dataset.g) { var c = curVk(); if (c && VK[c].g === b.dataset.g) { scrollTop0(); return; } grpGo(b.dataset.g); }
        else { TAB = b.dataset.v; store.set('wbs_tab', TAB); scrollTop0(); D ? render() : tabsMark(); }
      };
    });
  }
  tabsMark = function () {
    bindTabs();
    var k = curVk(), g = k ? VK[k].g : '';
    A('#tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.g ? b.dataset.g === g : b.dataset.v === TAB); });
    var seg = $('gseg'); if (!seg) return;
    if (!g) { seg.classList.add('hidden'); return; }
    store.set('wbs_s1_' + g, k);
    var badge = { up: safe(function () { return unvoted().length; }, 0), todo: '' };
    seg.classList.remove('hidden');
    seg.innerHTML = GRP[g].map(function (x) { return '<button data-k="' + x + '" class="' + (x === k ? 'on' : '') + '">' + VK[x].t + (badge[x] ? '<span class="gb">' + esc(String(badge[x])) + '</span>' : '') + '</button>'; }).join('');
    A('button', seg).forEach(function (b) { b.onclick = function () { if (b.dataset.k !== curVk()) goVk(b.dataset.k); }; });
    var ve = $('v-events'); if (ve) ve.classList.toggle('s1up', TAB === 'events' && evView === 'up');
    if (TAB === 'sched' && $('title')) $('title').textContent = (window.innerWidth >= 420 ? '運営管理ツール ・ ' : '') + (scView === 'gantt' ? 'タスクのガント' : '予定');
  };
  // 予定の画面の切り替え(カレンダー/ガント/年間)を、上のボタンに合わせて反映
  if (has('renderSched')) {
    var renderSched0 = renderSched;
    renderSched = function () {
      A('#scSeg button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === scView); });
      var r = renderSched0.apply(this, arguments);
      try { $('scCal') && $('scCal').classList.toggle('hidden', scView !== 'cal'); $('scGantt') && $('scGantt').classList.toggle('hidden', scView !== 'gantt'); $('scYear') && $('scYear').classList.toggle('hidden', scView !== 'year'); } catch (e) { }
      return r;
    };
  }
  // 「過去・出席率」の中で、終わった予定と出席率を切り替える
  if (has('renderEvents')) {
    var renderEvents0 = renderEvents;
    renderEvents = function () { var r = renderEvents0.apply(this, arguments); try { var ve = $('v-events'); ve && ve.classList.toggle('s1up', evView === 'up'); } catch (e) { } return r; };
  }

  // ================================================================ 2. 回答(答えるものを1か所に)
  function ansCounts() {
    return {
      att: n0(function () { return unvoted().length; }),
      polls: fon('polls') ? n0(function () { return unansweredPolls().length; }) : 0,
      scheds: fon('scheds') ? n0(function () { return unansweredScheds().length; }) : 0,
      reviews: fon('reviews') ? n0(function () { return rvOn() ? pendingReviews().length : 0; }) : 0
    };
  }
  function openAnswers() {
    var c = ansCounts(), rv = fon('reviews') && safe(function () { return rvOn() || can('settings.manage'); }, false);
    var rows = [
      ['att', '🙋', '出欠', '練習・本番などの予定に、参加・不参加を答える', c.att],
      fon('polls') ? ['polls', '🗳', 'アンケート', 'チームからの質問に答える・作る', c.polls] : null,
      fon('scheds') ? ['scheds', '🗓', '日程調整', '候補日の中から都合を答える・作る', c.scheds] : null,
      rv ? ['reviews', '📝', '本番の振り返り', '本番のあとに全員で答えるアンケート', c.reviews] : null
    ].filter(Boolean);
    var total = rows.reduce(function (s, r) { return s + r[4]; }, 0);
    var h = '<button class="x" onclick="closeSheet()">✕</button><h2>🙋 回答</h2><p class="note">答えることがあるものを、ここにまとめています。' + (total ? 'まだ答えていないものが <b>' + total + '件</b> あります。' : 'いま答えるものはありません 🎉') + '</p>';
    h += '<div class="mlist s1hub">' + rows.map(function (r) { return '<div class="mitem" data-a="' + r[0] + '"><b>' + r[1] + '</b><span>' + r[2] + (r[4] ? ' <span class="badge b-未入金">未回答 ' + r[4] + '</span>' : '') + '<span class="note">' + r[3] + '</span></span><i>›</i></div>'; }).join('') + '</div>';
    openSheet(h);
    A('#panel [data-a]').forEach(function (el) {
      el.onclick = function () {
        var k = el.dataset.a;
        if (k === 'att') { closeSheet(); goVk('up'); }
        else if (k === 'polls') openPolls(); else if (k === 'scheds') openScheds(); else if (k === 'reviews') openReviews();
      };
    });
  }
  window.openAnswers = openAnswers;
  // 「提案」の画面からアンケートのボタンを外す(アンケートは「回答」へ)
  if (has('renderTodo')) {
    var renderTodo0s = renderTodo;
    renderTodo = function () {
      if (TODO_VIEW === 'polls') TODO_VIEW = 'open';
      var r = renderTodo0s.apply(this, arguments);
      try { A('#tdSeg button[data-v="polls"]').forEach(function (b) { b.remove(); }); } catch (e) { }
      return r;
    };
  }

  // ================================================================ 5. 班
  function openTeamHub() {
    var mine = safe(function () { return myTeamList(); }, []), all = safe(function () { return teamListNow(); }, []);
    var h = '<button class="x" onclick="closeSheet()">✕</button><h2>🧩 班</h2>';
    if (!all.length) h += '<div class="empty">まだ班がありません' + (can('member.manage') ? '。下の「班の構成」から作れます' : '') + '</div>';
    else h += '<p class="note">' + (mine.length ? 'あなたの班:<b>' + esc(mine.join('・')) + '</b>' : 'あなたはまだどの班にも入っていません') + '</p>';
    mine.forEach(function (t) {
      var us = safe(function () { return activeUsers().filter(function (u) { return teamTokens(u).indexOf(t) >= 0; }); }, []);
      h += '<div class="box" style="box-shadow:none;border:1px solid var(--line)"><b>' + esc(t) + '</b> <span class="note">' + us.length + '人</span><div class="note" style="margin-top:4px">' + (esc(us.map(function (u) { return u.name; }).join('、')) || 'まだいません') + '</div></div>';
    });
    if (mine.length) h += '<h3>班のやること</h3><div id="s1Team"><div id="hTeam"></div></div>';
    var rows = [
      ['teams', '🧩', '班の構成(全部の班とメンバー)', can('member.manage') ? '班を作る・人を入れる' : 'だれがどの班か'],
      fon('msgs') ? ['msgs', '📮', '班からの連絡', '練習日誌に書いた連絡事項'] : null,
      can('member.manage') ? ['assign', '🔑', '班とロールの割り当て', '班に権限を付ける・役職'] : null
    ].filter(Boolean);
    h += '<div class="mlist s1hub" style="margin-top:10px">' + rows.map(function (r) { return '<div class="mitem" data-t="' + r[0] + '"><b>' + r[1] + '</b><span>' + r[2] + '<span class="note">' + r[3] + '</span></span><i>›</i></div>'; }).join('') + '</div>';
    openSheet(h);
    try {
      if (mine.length && has('bindTeamHome')) {
        // ホームにも同じ名前の欄があるので、いったん名前を外してから、この画面の欄に描く
        var homeT = document.querySelector('#v-home #hTeam'); if (homeT) homeT.id = 'hTeamHome';
        try { bindTeamHome(); } finally { if (homeT) homeT.id = 'hTeam'; }
        var ht = document.querySelector('#s1Team #hTeam'); if (ht && !ht.textContent.trim()) ht.innerHTML = '<div class="note">期限が近いタスク・期限切れのタスクはありません</div>';
      }
    } catch (e) { }
    A('#panel [data-t]').forEach(function (el) {
      el.onclick = function () { var k = el.dataset.t; if (k === 'teams') openTeams(); else if (k === 'msgs') openMsgs(); else if (k === 'assign') openAssign(); };
    });
  }
  window.openTeamHub = openTeamHub;

  // ================================================================ 1. 割り勘は「使う」の中へ
  if (has('openSpends')) {
    var openSpends0 = openSpends;
    openSpends = function () {
      var r = openSpends0.apply(this, arguments);
      try {
        if (fon('advances') && !$('s1Adv')) {
          var h2 = document.querySelector('#panel h2');
          var n = n0(function () { return advBadge(); });
          h2 && h2.insertAdjacentHTML('afterend', '<div class="mlist msm s1hub" style="margin:6px 0 10px"><div class="mitem" id="s1Adv"><b>🍱</b><span>メンバー同士の割り勘' + (n ? ' <span class="badge b-new">精算待ち ' + n + '</span>' : '') + '<span class="note">チームのお金を使わない、メンバーどうしの立て替え・割り勘はこちら</span></span><i>›</i></div></div>');
          $('s1Adv') && ($('s1Adv').onclick = function () { openAdvances(); });
        }
      } catch (e) { }
      return r;
    };
  }

  // ================================================================ 3. メニュー(中継の画面をなくして直接開く)
  var menuModel0s = menuModel, menuOpenMap0s = menuOpenMap, menuNb0s = menuNb;
  function acctView() { return fon('ledger') && (can('acct.view') || can('acct.manage')); }
  MENU_SHORT.notices = 'お知らせ'; MENU_SHORT.msgs = '班からの連絡'; MENU_SHORT.mtgs = '会議・議事録'; MENU_SHORT.answers = '回答';
  MENU_SHORT.shows = 'タイムテーブル'; MENU_SHORT.diaries = '練習日誌'; MENU_SHORT.report = 'シーズンの振り返り'; MENU_SHORT.heat = '熱中症の注意';
  MENU_SHORT.spends = '使う(支出)'; MENU_SHORT.cols = '集める(集金)'; MENU_SHORT.ledger = '帳簿'; MENU_SHORT.budget = '予算と実費'; MENU_SHORT.acctm = '月次レポート'; MENU_SHORT.invest = '出資と回収';
  MENU_SHORT.equip = '衣装・備品・採寸'; MENU_SHORT.teams = '班';
  menuModel = function () {
    var o = menuModel0s(), t = fon;
    var team = [
      ['📢', 'notices'], t('msgs') ? ['📮', 'msgs'] : null, ['📝', 'mtgs'], ['🙋', 'answers'],
      t('shows') ? ['🎌', 'shows'] : null, t('diaries') ? ['📓', 'diaries'] : null, t('dance') ? ['💃', 'dance'] : null, t('trips') ? ['🚐', 'trips'] : null,
      t('health') && can('health.view') ? ['🩹', 'health'] : null, t('heat') ? ['🌡', 'heat'] : null, t('report') ? ['📈', 'report'] : null,
      ['💸', 'spends'], t('cols') ? ['💰', 'cols'] : null, acctView() ? ['📒', 'ledger'] : null, safe(function () { return canBudget(); }, false) ? ['📊', 'budget'] : null,
      acctView() ? ['📅', 'acctm'] : null, t('invest') && can('invest.manage') ? ['🏦', 'invest'] : null,
      t('equip') ? ['👘', 'equip'] : null, ['🖼', 'albums'], t('links') ? ['📎', 'links'] : null, t('history') ? ['📜', 'history'] : null,
      ['🧩', 'teams']
    ].filter(Boolean);
    // 元のメニューにある機能だけ出す(使わない機能に設定したものは出さない)
    var origKeys = {}; (o.team || []).forEach(function (x) { if (x) origKeys[x[1]] = 1; });
    team = team.filter(function (x) { return x[1] !== 'albums' || origKeys.albums; });
    // 自分・アプリ:通知は1つに。ホームの並び替えはホームへ、ホーム画面に追加はガイドへ
    var self = [['🔔', '通知(設定・届いた通知の履歴)', 'push'], ['📘', '使い方ガイド', 'tour'], t('fb') ? ['💬', 'アプリへの要望・質問', 'fb'] : null, ['🗑', 'ゴミ箱(削除したものを戻す)', 'trash']].filter(Boolean);
    // 管理:アプリ名・データの控え・引き継ぎ資料・タスクのコピーは「設定」の中へ
    var moveIn = can('settings.manage') ? { appname: 1, fbbackup: 1, handover: 1, copy: 1 } : { copy: 1 };
    var adm = (o.adm || []).filter(function (x) { return x && !moveIn[x[2]]; });
    return { team: team, self: self, adm: adm };
  };
  MENU_GROUPS = [
    ['📢 連絡・回答', ['notices', 'msgs', 'mtgs', 'answers']],
    ['🎌 練習・本番', ['shows', 'diaries', 'dance', 'trips', 'health', 'heat', 'report']],
    ['💴 お金', ['spends', 'cols', 'ledger', 'budget', 'acctm', 'invest']],
    ['👘 もの・記録', ['equip', 'albums', 'links', 'history']],
    ['🧩 班', ['teams']]
  ];
  ADM_GROUPS = [['🧭 状況と対応', ['ops']], ['👥 メンバー', ['members', 'assign', 'mentors']], ['⚙️ アプリの管理', ['settings', 'roles', 'periods', 'log', 'export']]];
  menuOpenMap = function () {
    var m = menuOpenMap0s();
    m.answers = openAnswers; m.teams = openTeamHub; m.tour = function () { openGuide(); };
    m.shows = function () { openShows(); }; m.heat = function () { openHeat(); }; m.report = function () { openReport(); }; m.diaries = function () { openDiaries(); };
    m.spends = function () { openSpends(); }; m.cols = function () { openCols(); }; m.ledger = function () { openLedger(); };
    m.budget = function () { openBudget(); }; m.acctm = function () { openAcctMonthly(); }; m.invest = function () { openInvest(); };
    return m;
  };
  menuNb = function (k) {
    var c;
    if (k === 'answers') { c = ansCounts(); return c.polls + c.scheds + c.reviews; } // 出欠は「予定」のタブに数が出るので、ここには足さない
    if (k === 'spends') return safe(function () { return (isExec() ? spendWaitMine().length : 0) + spendBackMine().length + spendMyPay().length + (can('acct.manage') ? spendPayWaitAcct().length + spendRefundWait().length : 0) + advBadge(); }, 0);
    if (k === 'cols') return n0(function () { return myUnpaid().length; });
    if (k === 'teams') return fon('msgs') ? n0(function () { return menuNb0s('msgs'); }) : 0;
    if (k === 'push') return 0;
    return menuNb0s(k);
  };
  // 「よく使う」の数え方が新しい名前でも動くように(古い名前は新しい名前に読み替え)
  // ※ 中継の画面(連絡・お金・本番・日誌と振り返り)はメニューから外したが、関数は残してある(ほかの画面のボタンから使われるため)

  // ================================================================ 6. 設定の中に、管理の細かいものをまとめる
  if (has('openSettings')) {
    var openSettings0 = openSettings;
    openSettings = function () {
      var r = openSettings0.apply(this, arguments);
      try {
        if ($('s1Set')) return r;
        var m = menuOpenMap0s(), o = menuModel0s(), keys = {};
        (o.adm || []).forEach(function (x) { if (x) keys[x[2]] = x; });
        var rows = [['appname', '✏️', 'アプリの名前'], ['fbbackup', '🛟', 'データの控え(戻す)'], ['handover', '📒', '引き継ぎ資料'], ['copy', '📄', 'タスクのコピー(前の期間から)']].filter(function (x) { return keys[x[0]] && m[x[0]]; });
        if (rows.length) {
          var h2 = document.querySelector('#panel h2');
          h2 && h2.insertAdjacentHTML('afterend', '<div class="mlist msm" id="s1Set" style="margin:6px 0 12px">' + rows.map(function (x) { return '<div class="mitem" data-s1k="' + x[0] + '"><b>' + x[1] + '</b><span>' + x[2] + '</span><i>›</i></div>'; }).join('') + '</div>');
          A('#s1Set [data-s1k]').forEach(function (el) { el.onclick = function () { m[el.dataset.s1k](); }; });
        }
      } catch (e) { }
      return r;
    };
  }
  if (has('openPush')) {
    var openPush0 = openPush;
    openPush = function () {
      var r = openPush0.apply(this, arguments);
      try {
        var p = $('panel');
        if (p && !$('s1PushLog') && has('openPushLog')) {
          p.insertAdjacentHTML('beforeend', '<div class="mlist msm" style="margin-top:14px"><div class="mitem" id="s1PushLog"><b>📨</b><span>届いた通知の履歴</span><i>›</i></div>' + (has('openPwa') ? '<div class="mitem" id="s1Pwa"><b>📱</b><span>ホーム画面に追加する方法(通知を受け取るために必要な端末もあります)</span><i>›</i></div>' : '') + '</div>');
          $('s1PushLog').onclick = function () { openPushLog(); };
          $('s1Pwa') && ($('s1Pwa').onclick = function () { openPwa(); });
        }
      } catch (e) { }
      return r;
    };
  }

  // ================================================================ 4. ホーム
  var HOME_DEF_HIDE = ['show', 'poll', 'sched', 'pay', 'unv', 'mine', 'team', 'prog']; // 「対応待ち」にまとめて出るので、最初は隠す(並び替えの画面で出せる)
  if (has('homeLay')) {
    var homeLay0 = homeLay;
    homeLay = function () {
      var raw = null; try { raw = store.get('wbs_homelay'); } catch (e) { }
      if (!raw) return { o: [], h: HOME_DEF_HIDE.slice(), c: [] };
      return homeLay0.apply(this, arguments);
    };
  }
  HOME_SECS.forEach(function (s) { if (s[0] === 'todo') s[1] = '🔴 あなたの対応待ち'; });
  if (has('homeTodoHtml')) {
    var homeTodoHtml0 = homeTodoHtml;
    homeTodoHtml = function () {
      var h = homeTodoHtml0.apply(this, arguments);
      return String(h).replace('<b>✅ 今日やること</b>', '<b>🔴 あなたの対応待ち</b>').replace('いまやることはありません 🎉', 'いま対応が必要なことはありません 🎉');
    };
  }
  function homeAfter() {
    var v = $('v-home'); if (!v || v.querySelector('.s1lay')) return;
    // ホームの並び替えは、ホームの右上(あいさつの欄)に置く
    var bl = $('hLay'); if (bl) (bl.closest('div') || bl).style.display = 'none'; // 下の「並び替え」ボタンは、右上に移したので隠す
    var hi = v.querySelector('.box');
    if (hi && has('openHomeLayout')) {
      var b = document.createElement('button'); b.className = 's1lay'; b.title = 'ホームに出す欄を選ぶ'; b.textContent = '⚙ 表示';
      b.onclick = function (e) { e.stopPropagation(); openHomeLayout(); };
      hi.insertBefore(b, hi.firstChild);
    }
  }

  // ================================================================ 使い方ガイド
  // ツアー(はじめての方へ)を、今の画面の形に合わせて作り直す
  tourSteps = function () {
    var e = [
      ['👋', 'ようこそ！', esc(D.me.name) + 'さん、チームの運営アプリへようこそ。<br>練習の出欠・お知らせ・集金・タスクなどが、ここ1つでわかります。<br><br>下の4つのボタンで画面を切り替えます。<div class="tsk"><span>🏠 ホーム</span>あなたの対応待ち・今日と明日<br><span>📋 やること</span>タスク・ガント・提案<br><span>📅 予定</span>これから・カレンダー・年間<br><span>☰ メニュー</span>連絡・回答・お金・班など</div>'],
      ['🔴', 'まずはホームの「対応待ち」', '出欠の回答・未読のお知らせ・アンケート・集金など、<b>あなたがやること</b>はホームの「🔴 あなたの対応待ち」にまとめて出ます。<br><br>押すとその画面が開きます。ここが空になればOKです。', 'home', 'ホームを開く'],
      ['🙋', '出欠の答え方', '「📅 予定」で、予定ごとに <b>参加 / 不参加 / 未定</b> を押すだけです。あとから何度でも変えられます。<br><br>当日の遅刻・早退・急な欠席は、予定を開いて <b>🏃 遅刻・早退・欠席の連絡</b> から。<br>アンケートや日程調整は「メニュー → 🙋 回答」にまとまっています。', 'events', '予定を開く'],
      ['📢', 'お知らせと連絡', '大事な連絡は「メニュー → 📢 お知らせ」に届きます。読んだら「確認しました」を押してください。<br><br>文章の中のURL(https://〜)は、押すとそのページが開きます。お知らせやコメントには <b>☺＋</b> でスタンプも付けられます。'],
      ['🔔', '通知をオンにしよう', 'スマホの通知をオンにすると、新しいお知らせ・出欠の催促・本番の出番前などがすぐ届きます。<br><br>iPhone は、先に<b>ホーム画面に追加</b>してから通知をオンにします(「メニュー → 📘 使い方ガイド」に方法があります)。', 'push', '通知を設定する'],
      ['💡', '困ったときは', '・「こんなことできる？」と思ったら → メニューの <b>🔎 これできる？</b> で探せます<br>・使い方 → <b>メニュー → 📘 使い方ガイド</b>(目的別にまとめています)<br>・文字が小さい・画面がまぶしい → <b>マイページ</b>で変えられます<br>・要望・困ったこと → <b>メニュー → 💬 要望・質問</b>(名前を出さずに送れます)']
    ];
    if (can('member.manage') || can('att.record') || can('settings.manage')) e.splice(5, 0, ['🛠', '運営の方へ', '・対応が必要なこと・数字・催促 → <b>メニュー → 🛠 管理 → 🧭 運営の状況</b><br>・出欠を電話で聞いた → 予定を開いて <b>✍ 代わりに回答する</b><br>・メンバーの追加・権限 → <b>👥 メンバー管理</b><br>・アプリ名・データの控え・引き継ぎ資料 → <b>⚙️ 設定</b>の一番上']);
    return e;
  };
  // 「これできる？」の説明文を、新しい画面の名前に合わせる
  function fixAskText(s) {
    return String(s).replace(/「練習・予定」タブ/g, '「📅 予定」タブ').replace(/「練習・予定」/g, '「📅 予定」').replace(/「スケジュール」タブ/g, '「📅 予定」→「カレンダー」').replace(/「スケジュール」/g, '「📅 予定」→「カレンダー」')
      .replace(/今日やること/g, 'あなたの対応待ち').replace(/「TODO」/g, '「💡 提案」').replace(/TODO/g, '提案')
      .replace(/メニュー(の|→)\s*「?📮 ?各班からの連絡事項」?/g, 'メニュー → 📮 班からの連絡').replace(/「お金」→「💸 使う」/g, '「メニュー → 💸 使う」').replace(/「お金」→「💰 集める」/g, '「メニュー → 💰 集める」')
      .replace(/メニューの「📢 連絡」に、お知らせ\(全員へ\)・班からの連絡\(練習日誌の連絡事項\)・会議・議事録がまとまっています。どれに書けばいいかの案内もあります。/, 'メニューの「📢 連絡・回答」に、お知らせ(全員へ)・班からの連絡(練習日誌の連絡事項)・会議・議事録が並んでいます。全員に知らせたいことはお知らせ、練習で出た班の連絡は練習日誌の連絡事項、話し合いの内容は会議・議事録に書きます。');
  }
  function fixAsk() { try { ASK.forEach(function (a) { a[0] = fixAskText(a[0]); a[2] = fixAskText(a[2]); }); } catch (e) { } }
  fixAsk();
  ASK.push(['アンケートや日程調整に答えたい', 'アンケート 日程調整 回答 答える 投票 振り返り', '「メニュー → 🙋 回答」に、出欠・アンケート・日程調整・本番の振り返りがまとまっています。まだ答えていないものには数が出ます。', 'answers']);
  ASK.push(['文章の中のリンクを開きたい', 'リンク URL 開く 押す http', 'タスク・提案・お知らせ・コメントなどの文章に書いた https://〜 は、押すとそのページが開きます。リンク欄に入れたリンクは、一覧にも小さく表示されます。', '']);
  if (has('askGo')) {
    var askGo0 = askGo;
    askGo = function (a) { if (a && a[3] === 'answers') { openAnswers(); return; } return askGo0.apply(this, arguments); };
  }
  if (has('askCan')) {
    var askCan0 = askCan;
    askCan = function (a) { if (a && a[3] === 'answers') return true; return askCan0.apply(this, arguments); };
  }
  var GUIDE_CATS = [
    ['🙋 出欠・予定', /出欠|予定|遅刻|欠席|カレンダー|練習|代わり|回答期限/],
    ['📢 連絡・回答', /お知らせ|連絡|会議|議事録|コメント|スタンプ|アンケート|日程|メール|リンク/],
    ['💴 お金', /集金|立て替え|割り勘|会計|支出|予算|お金|レシート|返金|出資/],
    ['📋 タスク・提案', /タスク|提案|ガント|チェック/],
    ['🧩 班・メンバー', /班|メンバー|権限|ロール|役職|休会|入会|招待|お世話/],
    ['🎌 本番・衣装', /本番|衣装|備品|採寸|遠征|救護|熱中症|振付|タイムテーブル/],
    ['🔔 通知・設定・その他', /./]
  ];
  function openGuide() {
    var used = {}, cats = GUIDE_CATS.map(function (c) { var l = []; ASK.forEach(function (a, i) { if (!used[i] && c[1].test(a[0] + ' ' + a[1])) { used[i] = 1; l.push(i); } }); return [c[0], l]; });
    var h = '<button class="x" onclick="closeSheet()">✕</button><div class="s1guide"><h2>📘 使い方ガイド</h2>';
    h += '<div class="mlist s1hub">' +
      '<div class="mitem" data-g="tour"><b>🔰</b><span>はじめての方へ(1分で全体を案内)<span class="note">画面の切り替え・出欠の答え方・通知</span></span><i>›</i></div>' +
      (has('openPwa') ? '<div class="mitem" data-g="pwa"><b>📱</b><span>ホーム画面に追加する<span class="note">アプリのように開ける・iPhoneは通知に必要</span></span><i>›</i></div>' : '') +
      '<div class="mitem" data-g="push"><b>🔔</b><span>通知を受け取る<span class="note">お知らせ・催促・出番前がスマホに届く</span></span><i>›</i></div>' +
      '<div class="mitem" data-g="ask"><b>🔎</b><span>これできる？(やりたいことから探す)</span><i>›</i></div>' +
      '</div><h3>目的別の使い方</h3>';
    cats.forEach(function (c, ci) {
      if (!c[1].length) return;
      h += '<details><summary>' + c[0] + ' <span class="note">(' + c[1].length + ')</span></summary>' + c[1].map(function (i) {
        var a = ASK[i], ok = safe(function () { return askCan(a); }, false);
        return '<div class="gq"><b>' + esc(a[0]) + '</b><p>' + esc(a[2]) + '</p>' + (ok && a[3] ? '<button class="btn sm line" data-ai="' + i + '">この画面を開く ›</button>' : '') + '</div>';
      }).join('') + '</details>';
    });
    if (fon('fb')) h += '<div class="box" style="box-shadow:none;background:#f6f6f6;margin-top:10px"><div class="note">わからないこと・要望は、運営に聞けます(名前を出さずにも送れます)。</div><button class="btn line full" id="s1Fb" style="margin-top:6px">💬 要望・質問を送る</button></div>';
    h += '</div>';
    openSheet(h);
    A('#panel [data-g]').forEach(function (el) {
      el.onclick = function () { var k = el.dataset.g; if (k === 'tour') openTour(0); else if (k === 'pwa') openPwa(); else if (k === 'push') openPush(); else if (k === 'ask') openAsk(''); };
    });
    A('#panel [data-ai]').forEach(function (el) { el.onclick = function () { askGo(ASK[+el.dataset.ai]); }; });
    $('s1Fb') && ($('s1Fb').onclick = function () { openFeedback(); });
  }
  window.openGuide = openGuide;

  // ================================================================ バッジ(下のタブ・アプリのアイコン)
  badgesFix = function () {
    if (!D || !$('mnDot')) return;
    var t = menuBadgeTotal();
    $('mnDot').textContent = t; $('mnDot').classList.toggle('hidden', !t);
    var o = $('evDot'), e = $('tdDot');
    var i = o && !o.classList.contains('hidden') && +o.textContent || 0, s = e && !e.classList.contains('hidden') && +e.textContent || 0;
    try { setIconBadge(i + s + t - (can('settings.manage') && D.errNew || 0)); } catch (x) { }
  };

  // ================================================================ 描き直しのあとに
  var render0s = render;
  render = function () {
    var r = render0s.apply(this, arguments);
    try { if (TAB === 'home') homeAfter(); } catch (e) { }
    try { var f = $('v-menu') && $('v-menu').querySelector('p.note:last-of-type'); if (TAB === 'menu' && f && f.textContent.indexOf('整理') < 0) f.insertAdjacentText('beforeend', ' ・ ' + SEIRI_VER); } catch (e) { }
    return r;
  };
  // 前の版で保存したタブの位置を、新しい形に読み替える
  try {
    if (TAB === 'sched' && scView === 'gantt') store.set('wbs_s1_do', 'gantt');
    tabsBuild(); bindTabs(); if (D) render(); else tabsMark();
  } catch (e) { }
})();
