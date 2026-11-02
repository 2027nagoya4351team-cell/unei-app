// ===================================================================
// 整理パック 5(2026-11-02)   seiri1〜4 のあとに読み込む
//   7. ホーム:見出しを押すとたたむ(前から)+「ぜんぶたたむ/ひらく」
//   8. 検索(上の🔍):集金・お金の申請・帳簿も探せるように
//   9. 入力の候補:場所・お店・帳簿の内容に、前に入れたものを候補で出す
//   +  予算の画面に「資金の見通し」/ 会計のまとめに「集金の入金を帳簿に自動で記録」のON/OFF
// ===================================================================
var SEIRI5_VER = '整理5 (2026-11-02)';
(function () {
  'use strict';
  var A = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var has = function (n) { return typeof window[n] === 'function'; };
  var safe = function (f, d) { try { return f(); } catch (e) { return d; } };
  var low = function (s) { return String(s || '').toLowerCase(); };
  var yenS = function (v) { return (v < 0 ? '−' : '') + '¥' + Math.abs(Math.round(+v || 0)).toLocaleString(); };

  // ---------------------------------------------------------------- 7. ホームを「ぜんぶたたむ/ひらく」
  function homeFoldBar() {
    var v = $('v-home'); if (!v || $('s5Fold')) return;
    var secs = A('#v-home .hsec h3'); if (secs.length < 3) return;
    var first = A('#v-home .hsec').filter(function (s) { return s.querySelector('h3'); })[0]; if (!first) return;
    first.insertAdjacentHTML('beforebegin', '<div id="s5Fold" style="display:flex;justify-content:flex-end;gap:6px;margin:2px 0 4px"><button class="btn sm line" data-f="0">▸ ぜんぶたたむ</button><button class="btn sm line" data-f="1">▾ ぜんぶひらく</button></div>');
    A('#s5Fold [data-f]').forEach(function (b) {
      b.onclick = function () {
        var open = b.dataset.f === '1';
        A('#v-home .hsec').forEach(function (s) {
          var h = s.querySelector('h3'), body = h && h.nextElementSibling; if (!h || !body) return;
          var shut = body.style.display === 'none' || s.classList.contains('col') || s.classList.contains('closed');
          if (open === shut) h.click(); // 前からある「見出しを押すとたたむ」をそのまま使う(状態も前と同じく覚える)
        });
      };
    });
  }

  // ---------------------------------------------------------------- 8. 検索の対象を増やす
  if (has('openSearch')) {
    var openSearch0s5 = openSearch;
    openSearch = function () {
      var r = openSearch0s5.apply(this, arguments);
      try {
        var q = $('sqQ'); if (!q) return r;
        q.placeholder = 'タスク・予定・お知らせ・メンバー・集金・申請など';
        var in0 = q.oninput;
        q.oninput = function () {
          var res = in0 ? in0.apply(this, arguments) : undefined;
          try { extraSearch(q.value.trim().toLowerCase()); } catch (e) { }
          return res;
        };
      } catch (e) { }
      return r;
    };
  }
  function extraSearch(k) {
    var box = $('sqR'); if (!box || !k) return;
    var t = function (s) { return low(s).indexOf(k) >= 0; };
    var groups = [];
    groups.push(['💰 集金', safe(function () {
      return (D.cols || []).filter(function (c) { return t(c.title + ' ' + (c.note || '')); }).map(function (c) {
        return { t: c.title, s: (c.closed ? '締め済み' : '受付中') + (c.due ? ' ・ 締切' + md(c.due) : ''), f: function () { openCol(c.id); } };
      });
    }, [])]);
    groups.push(['💸 お金の申請', safe(function () {
      return (D.spends || []).filter(function (x) { return t(x.title + ' ' + (x.vendor || '') + ' ' + (x.reason || '')); }).map(function (x) {
        return { t: x.title, s: (x.status || '') + ' ・ ' + yenS(x.total), f: function () { openSpend(x.id); } };
      });
    }, [])]);
    groups.push(['📒 帳簿', safe(function () {
      return (D.ledger || []).filter(function (l) { return t(l.title + ' ' + (l.cat || '') + ' ' + (l.note || '')); }).slice(0, 30).map(function (l) {
        return { t: l.title, s: l.date + ' ・ ' + (l.kind || '') + ' ' + yenS(l.amount), f: function () { has('openLedger') ? openLedger() : null; } };
      });
    }, [])]);
    A('#sqR .s5g').forEach(function (e) { e.remove(); });
    groups.forEach(function (g) {
      if (!g[1].length) return;
      var d = document.createElement('div'); d.className = 's5g';
      d.innerHTML = '<h3 style="margin:10px 0 4px">' + g[0] + '(' + g[1].length + ')</h3>' + g[1].slice(0, 20).map(function (x, i) { return '<div class="card" data-i="' + i + '" style="cursor:pointer;padding:8px 10px;margin:4px 0"><div>' + esc(x.t) + '</div>' + (x.s ? '<div class="note">' + esc(x.s) + '</div>' : '') + '</div>'; }).join('');
      box.appendChild(d);
      A('[data-i]', d).forEach(function (el) { el.onclick = function () { g[1][+el.dataset.i].f(); }; });
    });
    var em = box.querySelector('.empty'); if (em && A('#sqR .s5g').length) em.remove();
  }

  // ---------------------------------------------------------------- 9. 入力の候補(前に入れたもの)
  function uniq(list, max) {
    var seen = {}, out = [];
    list.forEach(function (v) { v = String(v || '').trim(); if (!v || seen[v]) return; seen[v] = 1; out.push(v); });
    return out.slice(0, max || 30);
  }
  function suggest(id, values) {
    var el = $(id); if (!el || el.getAttribute('list') || !values.length) return;
    var lid = 's5L_' + id, dl = $(lid);
    if (!dl) { dl = document.createElement('datalist'); dl.id = lid; document.body.appendChild(dl); }
    dl.innerHTML = values.map(function (v) { return '<option value="' + esc(v) + '"></option>'; }).join('');
    el.setAttribute('list', lid); el.setAttribute('autocomplete', 'off');
  }
  var byNew = function (a, b, k) { return String(a[k] || '') < String(b[k] || '') ? 1 : -1; };
  function fillSuggest() {
    if ($('eP')) suggest('eP', uniq(safe(function () { return D.events.slice().sort(function (a, b) { return byNew(a, b, 'date'); }).map(function (e) { return e.place; }); }, []).concat(safe(function () { return (D.places || []).map(function (p) { return p.name; }); }, []))));
    if ($('sfV')) suggest('sfV', uniq(safe(function () { return (D.spends || []).slice().sort(function (a, b) { return byNew(a, b, 'createdAt'); }).map(function (x) { return x.vendor; }); }, [])));
    if ($('lfT')) suggest('lfT', uniq(safe(function () { return (D.ledger || []).slice().sort(function (a, b) { return byNew(a, b, 'date'); }).map(function (l) { return l.title; }); }, [])));
    if ($('cT')) suggest('cT', uniq(safe(function () { return (D.cols || []).slice().sort(function (a, b) { return byNew(a, b, 'createdAt'); }).map(function (c) { return String(c.title).replace(/[((].*$/, '').trim(); }); }, [])));
  }
  ['openEventForm', 'openSpendForm', 'openLedgerForm', 'openColForm'].forEach(function (n) {
    if (!has(n)) return;
    var f0 = window[n];
    window[n] = function () { var r = f0.apply(this, arguments); setTimeout(function () { try { fillSuggest(); } catch (e) { } }, 30); return r; };
  });

  // ---------------------------------------------------------------- お金:予算の画面に「資金の見通し」
  if (has('openBudget')) {
    var openBudget0s5 = openBudget;
    openBudget = function (pid) {
      var r = openBudget0s5.apply(this, arguments);
      try {
        var sel = $('bgPer'), first = document.querySelector('#panel .box');
        if (!first || $('s5Fund')) return r;
        first.insertAdjacentHTML('afterend', '<div class="box" id="s5Fund" style="border:1px solid var(--line);box-shadow:none"><b>💴 資金の見通し</b> <span class="note">読み込み中…</span></div>');
        call('budgetFunds', { periodId: sel ? sel.value : (pid || '') }).then(function (f) {
          var el = $('s5Fund'); if (!el || !f) return;
          var nums = A('#panel .box b').map(function (b) { return +String(b.textContent).replace(/[^\d−-]/g, '').replace('−', '-') || 0; });
          var plan = safe(function () { var m = first.innerHTML.match(/見込み[^¥]*¥([\d,]+)/); return m ? +m[1].replace(/,/g, '') : 0; }, 0);
          var have = f.incSum + f.investNotInLedger, will = have + f.pending, left = will - plan;
          el.innerHTML = '<b>💴 資金の見通し</b>' + (f.period ? ' <span class="note">(' + esc(f.period) + ')</span>' : '') +
            '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center;margin-top:6px">' +
            '<div><div class="note">入ったお金</div><b>' + yenS(have) + '</b></div>' +
            '<div><div class="note">入る予定(集金の未入金)</div><b>' + yenS(f.pending) + '</b></div>' +
            '<div><div class="note">見込みとの差</div><b style="color:' + (left < 0 ? 'var(--bad,#c62828)' : 'inherit') + '">' + yenS(left) + '</b></div></div>' +
            '<div class="note" style="margin-top:6px">入ったお金の内訳:' + (f.inc.length ? f.inc.map(function (c) { return esc(c.k) + ' ' + yenS(c.v); }).join(' ・ ') : '帳簿の収入はまだありません') +
            (f.investNotInLedger ? ' ・ 幹部の出資(帳簿にまだ書いていない分) ' + yenS(f.investNotInLedger) : '') + '</div>' +
            (left < 0 ? '<div class="note" style="margin-top:4px">⚠ 集金がぜんぶ入っても、見込みより ' + yenS(-left) + ' 足りません</div>' : '');
        }).catch(function () { var el = $('s5Fund'); if (el) el.remove(); });
      } catch (e) { }
      return r;
    };
  }

  // ---------------------------------------------------------------- お金:集金の入金を帳簿に自動で記録(ON/OFF)
  if (has('openAcctHub')) {
    var openAcctHub0s5 = openAcctHub;
    openAcctHub = function () {
      var r = openAcctHub0s5.apply(this, arguments);
      try {
        if (!safe(function () { return can('acct.manage'); }, false) || $('s5CL')) return r;
        var on = safe(function () { return D.settings ? D.settings.colLedgerOn !== false : true; }, true);
        var lst = document.querySelector('#panel .mlist'); if (!lst) return r;
        lst.insertAdjacentHTML('afterend', '<label class="box" id="s5CL" style="display:flex;gap:8px;align-items:flex-start;border:1px solid var(--line);box-shadow:none;margin-top:10px"><input type="checkbox" id="s5CLc"' + (on ? ' checked' : '') + '><span>集金の入金を、帳簿の「収入」に自動で記録する<span class="note" style="display:block">入金を記録するたびに、その集金の合計を1行にまとめて書きます。この機能を入れたあとに作った集金が対象です(前からある集金は今まで通り)。</span></span></label>');
        $('s5CLc').onchange = function () {
          var c = this, v = c.checked; c.disabled = true;
          call('setColLedger', { on: v }).then(function () { c.disabled = false; try { if (D.settings) D.settings.colLedgerOn = v; } catch (e) { } toast(v ? '自動で記録します' : '自動の記録を止めました'); }).catch(function (e) { c.disabled = false; c.checked = !v; fail(e); });
        };
      } catch (e) { }
      return r;
    };
    try { MENU_GROUPS && 0; } catch (e) { }
  }

  // ---------------------------------------------------------------- 描画のたびに
  try {
    var render0s5 = render;
    render = function () {
      var r = render0s5.apply(this, arguments);
      try { if (TAB === 'home') homeFoldBar(); } catch (e) { }
      try { var f = $('v-menu') && $('v-menu').querySelector('p.note:last-of-type'); if (TAB === 'menu' && f && f.textContent.indexOf('整理5') < 0) f.insertAdjacentText('beforeend', ' ・ 整理5'); } catch (e) { }
      return r;
    };
    if (D) render();
  } catch (e) { }
})();
