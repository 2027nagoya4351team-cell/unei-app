// ===================================================================
// 整理パック 4(2026-11-02)  お金まわりの導線   seiri1〜3 のあとに読み込む
//   1. 入口を3つに:💳 払う(全員)/💸 使う(全員が申請)/📒 会計(会計・幹部だけ)
//   2. 「＋ お金の入力」:何をしたかを選ぶと、正しい入力画面が開く
// ===================================================================
var SEIRI4_VER = '整理4 (2026-11-02)';
(function () {
  'use strict';
  var A = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var has = function (n) { return typeof window[n] === 'function'; };
  var safe = function (f, d) { try { return f(); } catch (e) { return d; } };
  var n0 = function (f) { return safe(f, 0) || 0; };

  function canAcct() { return safe(function () { return (fon('ledger') && (can('acct.view') || can('acct.manage'))) || can('pay.manage') || (fon('invest') && can('invest.manage')); }, false); }
  function myAdvOwe() { return safe(function () { var me = D.me.uid; return advNet().filter(function (t) { return t.a === me; }); }, []); }
  function payCount() { return n0(function () { return myUnpaid().length; }) + (fon('advances') ? myAdvOwe().length : 0); }

  // ---------------------------------------------------------------- 2. ＋ お金の入力
  function entryRows() {
    return [
      ['pre', '🛒', 'これから買う(事前に申請)', 'チームのお金で買いたい物がある → 幹部が承認', true],
      ['post', '🧾', 'もう買った・立て替えた(事後に申請)', 'チームの物を自分のお金で買った → 返金してもらう', true],
      ['col', '💰', 'みんなから集めたい(集金)', '部費・衣装代などを、人ごとに金額を決めて集める', safe(function () { return fon('cols') && can('pay.manage'); }, false)],
      ['adv', '🍱', 'メンバー同士で立て替えた(割り勘)', 'チームのお金を使わない、メンバーどうしの精算', fon('advances')],
      ['led', '📒', 'その他の入出金を帳簿に書く', '上のどれにも当てはまらない入金・出金(会計用)', safe(function () { return fon('ledger') && can('acct.manage'); }, false)]
    ].filter(function (r) { return r[4]; });
  }
  function openMoneyEntry() {
    var rows = entryRows();
    openSheet('<button class="x" onclick="closeSheet()">✕</button><h2>＋ お金の入力</h2><p class="note">何をしましたか？(何をしたいですか？)選ぶと、入力する画面が開きます。</p><div class="mlist s1hub">' +
      rows.map(function (r) { return '<div class="mitem" data-m="' + r[0] + '"><b>' + r[1] + '</b><span>' + r[2] + '<span class="note">' + r[3] + '</span></span><i>›</i></div>'; }).join('') + '</div>' +
      '<p class="note" style="margin-top:10px">迷ったら:チームのために使ったお金は「申請」、メンバーから集めるのは「集金」、友だちどうしの貸し借りは「割り勘」です。</p>');
    A('#panel [data-m]').forEach(function (el) {
      el.onclick = function () {
        var k = el.dataset.m;
        if (k === 'pre' || k === 'post') { openSpendForm(null); setTimeout(function () { var b = document.querySelector('#sfWhen button[data-w="' + (k === 'post' ? 1 : 0) + '"]'); b && b.click(); }, 60); }
        else if (k === 'col') openColForm(null);
        else if (k === 'adv') openAdvanceForm(null);
        else if (k === 'led') openLedgerForm(null);
      };
    });
  }
  window.openMoneyEntry = openMoneyEntry;
  function entryBtn(where) {
    var h2 = document.querySelector('#panel h2'); if (!h2 || $('s4Ent')) return;
    h2.insertAdjacentHTML('afterend', '<button class="btn line full" id="s4Ent" style="margin:4px 0 10px">＋ お金の入力(何をしたか選ぶ)</button>');
    $('s4Ent').onclick = openMoneyEntry;
  }

  // ---------------------------------------------------------------- 1. 払う(あなたの支払い)
  function openPay() {
    var pays = safe(function () { return myUnpaid(); }, []), owe = fon('advances') ? myAdvOwe() : [];
    var h = '<button class="x" onclick="closeSheet()">✕</button><h2>💳 あなたの支払い</h2>';
    h += '<p class="note">集金・参加費・割り勘で、あなたが払うものをまとめています。' + (pays.length + owe.length ? '' : 'いま払うものはありません 🎉') + '</p>';
    if (pays.length) h += '<h3>集金・参加費(' + pays.length + ')</h3><div id="s4Pays"></div>';
    if (owe.length) h += '<h3>割り勘の精算(' + owe.length + ')</h3><div class="mlist s1hub">' + owe.map(function (t) { return '<div class="mitem" data-adv="1"><b>🍱</b><span>' + esc(uname(t.b)) + 'さんへ ' + yen(t.amt) + '<span class="note">メンバー同士の立て替え</span></span><i>›</i></div>'; }).join('') + '</div>';
    h += '<div class="mlist msm" style="margin-top:14px"><div class="mitem" id="s4AllCols"><b>📜</b><span>これまでの集金(払ったものも見る)</span><i>›</i></div></div>';
    openSheet(h);
    try { pays.forEach(function (p) { $('s4Pays').appendChild(payCard(p)); }); } catch (e) { }
    A('#panel [data-adv]').forEach(function (el) { el.onclick = function () { openAdvances(); }; });
    $('s4AllCols') && ($('s4AllCols').onclick = function () { openCols(); });
  }
  window.openPay = openPay;

  // ---------------------------------------------------------------- 1. 会計(まとめ)
  function openAcctHub() {
    var rows = [
      safe(function () { return fon('cols') && can('pay.manage'); }, false) ? ['cols', '💰', '集める(集金)', '集金を作る・入金を確認する・催促', n0(function () { return D.cols.filter(function (c) { return !c.closed; }).length; }), ''] : null,
      safe(function () { return fon('ledger') && (can('acct.view') || can('acct.manage')); }, false) ? ['ledger', '📒', '帳簿(収支)', '入金・出金の記録', 0] : null,
      safe(function () { return canBudget(); }, false) ? ['budget', '📊', '予算と実費', '予算・見積もり・実際にかかったお金', 0] : null,
      safe(function () { return fon('ledger') && (can('acct.view') || can('acct.manage')); }, false) ? ['month', '📅', '月次レポート', '月ごとのまとめ', 0] : null,
      safe(function () { return fon('invest') && can('invest.manage'); }, false) ? ['invest', '🏦', '出資と回収・参加費の計画', '幹部の出資と、その回収の計画', 0] : null,
      safe(function () { return can('acct.manage'); }, false) ? ['spendpay', '💸', '支払い・返金の対応', '承認された申請の支払いと、立て替えの返金', n0(function () { return spendPayWaitAcct().length + spendRefundWait().length; })] : null
    ].filter(Boolean);
    openSheet('<button class="x" onclick="closeSheet()">✕</button><h2>📒 会計</h2><p class="note">会計・幹部の人が使う画面をまとめています。</p><div class="mlist s1hub">' +
      rows.map(function (r) { return '<div class="mitem" data-a="' + r[0] + '"><b>' + r[1] + '</b><span>' + r[2] + (r[0] === 'spendpay' && r[4] ? ' <span class="badge b-new">' + r[4] + '</span>' : '') + '<span class="note">' + r[3] + '</span></span><i>›</i></div>'; }).join('') + '</div>');
    entryBtn('acct');
    A('#panel [data-a]').forEach(function (el) {
      el.onclick = function () {
        var k = el.dataset.a;
        if (k === 'cols') openCols(); else if (k === 'ledger') openLedger(); else if (k === 'budget') openBudget(); else if (k === 'month') openAcctMonthly(); else if (k === 'invest') openInvest(); else if (k === 'spendpay') openSpends();
      };
    });
  }
  window.openAcctHub = openAcctHub;

  // 「使う」の画面にも「＋ お金の入力」
  if (has('openSpends')) {
    var openSpends0s4 = openSpends;
    openSpends = function () { var r = openSpends0s4.apply(this, arguments); try { entryBtn('spend'); } catch (e) { } return r; };
  }
  if (has('openCols')) {
    var openCols0s4 = openCols;
    openCols = function () { var r = openCols0s4.apply(this, arguments); try { if (can('pay.manage')) entryBtn('cols'); } catch (e) { } return r; };
  }

  // ---------------------------------------------------------------- メニュー:お金は3つの入口に
  MENU_SHORT.pay = '払う'; MENU_SHORT.spends = '使う(申請)'; MENU_SHORT.acct = '会計'; MENU_SHORT.moneyin = '＋ お金の入力';
  var MONEY_OLD = { spends: 1, cols: 1, ledger: 1, budget: 1, acctm: 1, invest: 1 };
  var menuModel0s4 = menuModel, menuOpenMap0s4 = menuOpenMap, menuNb0s4 = menuNb;
  menuModel = function () {
    var o = menuModel0s4(), team = [], put = false;
    (o.team || []).forEach(function (x) {
      if (x && MONEY_OLD[x[1]]) {
        if (!put) { put = true; team.push(['💳', 'pay'], ['💸', 'spends']); if (canAcct()) team.push(['📒', 'acct']); team.push(['➕', 'moneyin']); }
        return;
      }
      team.push(x);
    });
    o.team = team; return o;
  };
  MENU_GROUPS = MENU_GROUPS.map(function (g) { return /お金/.test(g[0]) ? ['💴 お金', ['pay', 'spends', 'acct', 'moneyin']] : g; });
  menuOpenMap = function () { var m = menuOpenMap0s4(); m.pay = openPay; m.acct = openAcctHub; m.moneyin = openMoneyEntry; return m; };
  menuNb = function (k) {
    if (k === 'pay') return payCount();
    if (k === 'acct') return safe(function () { return can('acct.manage') ? spendPayWaitAcct().length + spendRefundWait().length : 0; }, 0);
    if (k === 'moneyin') return 0;
    if (k === 'spends') return safe(function () { return (isExec() ? spendWaitMine().length : 0) + spendBackMine().length + spendMyPay().length; }, 0);
    return menuNb0s4(k);
  };
  // ホームの「対応待ち」:集金と割り勘の支払いは「💳 あなたの支払い」1行に
  if (has('homeTodos')) {
    var homeTodos0s4 = homeTodos;
    homeTodos = function () {
      var rows = homeTodos0s4.apply(this, arguments), out = [], n = payCount(), put = false;
      rows.forEach(function (r) {
        if (/集金の支払い|割り勘の支払い/.test(r[1])) { if (!put && n) { put = true; out.push(['💳', 'あなたの支払い(集金・参加費・割り勘)', n, 's4Pay', openPay]); } return; }
        out.push(r);
      });
      return out;
    };
  }
  // ASK(これできる？)にも
  try {
    ASK.push(['お金の入力をどこからすればいいかわからない', 'お金 入力 支払い 申請 集金 立て替え 割り勘 帳簿 レシート', 'メニューの「💴 お金」→「➕ お金の入力」で、何をしたかを選ぶと正しい画面が開きます。自分が払うものは「💳 払う」にまとまっています。', 'moneyin']);
    var askGo0s4 = askGo, askCan0s4 = askCan;
    askGo = function (a) { if (a && a[3] === 'moneyin') return openMoneyEntry(); return askGo0s4.apply(this, arguments); };
    askCan = function (a) { if (a && a[3] === 'moneyin') return true; return askCan0s4.apply(this, arguments); };
  } catch (e) { }

  try {
    var render0s4 = render;
    render = function () {
      var r = render0s4.apply(this, arguments);
      try { var f = $('v-menu') && $('v-menu').querySelector('p.note:last-of-type'); if (TAB === 'menu' && f && f.textContent.indexOf('整理4') < 0) f.insertAdjacentText('beforeend', ' ・ 整理4'); } catch (e) { }
      return r;
    };
    if (D) render();
  } catch (e) { }
})();
