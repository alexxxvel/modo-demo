/* Макеты volt-market: данные поставщика (shared/data.js), карточки, корзина, сравнение, фильтры в адресе.
   Вид карточки задаёт направление: body[data-v="a"|"b"]. Корзина и сравнение — localStorage (в рабочем сайте заказ — в базе).
   Круг 2: одна ось шкалы 0–150 км, кнопка в карточке графитовая (лайм — только «в корзине» и одна главная кнопка экрана). */
(function () {
  'use strict';
  var D = window.VM_DATA || { items: [], counts: {}, ranges: {} };
  var V = document.body.dataset.v || 'a';
  var ROOT = '../';
  var MAXKM = 150;
  var CATS = [
    { id: 'scooter', name: 'Электроскутеры', short: 'Скутеры' },
    { id: 'bike', name: 'Электровелосипеды', short: 'Велосипеды' },
    { id: 'kick', name: 'Электросамокаты', short: 'Самокаты' },
    { id: 'moto', name: 'Электромотоциклы', short: 'Мотоциклы' },
    { id: 'quad', name: 'Электроквадроциклы', short: 'Квадроциклы' },
    { id: 'acc', name: 'Аксессуары и комплектующие', short: 'Аксессуары' }
  ];
  var byName = {}; CATS.forEach(function (c) { byName[c.name] = c; });
  D.items.forEach(function (it, i) {
    it.c = (byName[it.cat] || CATS[5]).id;
    it.n = i;
    var nm = it.name.toLowerCase();
    it.sub = /трехкол|трёхкол|трицикл|trike/.test(nm) ? 'Трёхколёсные' : /грузов/.test(nm) ? 'Грузовые' : 'Двухколёсные';
    it.model = it.name.replace(/^(Трехколесный|Трёхколесный|Грузовой|Детский)\s+/i, '').replace(/^(электроскутер|электровелосипед|электросамокат|электромотоцикл|электроквадроцикл|Электротрицикл|Электроскутер|Электровелосипед|Электросамокат|Электромотоцикл|Электроквадроцикл)\s+/i, '');
    var bi = it.brand ? it.name.toLowerCase().indexOf(it.brand.toLowerCase() + ' ') : -1;
    if (bi >= 0) it.model = it.name.slice(bi + it.brand.length + 1);
    it.s = it.stock.indexOf('в наличии') === 0 ? 'supplier' : it.stock.indexOf('предзаказ') === 0 ? 'order' : it.stock.indexOf('нет') === 0 ? 'none' : 'check';
  });
  var ST = { our: 'В наличии у нас', supplier: 'Доступен у поставщика', order: 'Под заказ', none: 'Нет в наличии', check: 'Наличие уточняется' };
  var STS = { our: 'В наличии', supplier: 'У поставщика', order: 'Под заказ', none: 'Нет', check: 'Уточняется' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function money(v) { return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function price(it) { return it.price ? '<b class="pr">' + money(it.price) + '<i class="byn" aria-label="руб."></i></b>' : '<b class="pr pr-ask">Уточнить цену</b>'; }
  function km(it) { return it.range ? Math.round(it.range) : null; }
  function v(k) { return Math.min(k / MAXKM, 1).toFixed(3); }
  function bar(k, cls) { return '<div class="chg anim ' + (cls || '') + '" style="--v:' + v(k) + '" role="img" aria-label="Заявленный запас хода ' + k + ' км из шкалы 150"><i></i></div>'; }
  function charge(it) {
    var k = km(it);
    if (!k) return '<p class="kmv kmv-none">Запас хода: нет данных</p>';
    return '<div class="chg-wrap"><p class="chg-row"><span class="kmv"><b>' + k + '</b> км</span><span class="kml">заявлено</span></p>' + bar(k) + '</div>';
  }
  function st(it) { return '<span class="st" data-s="' + it.s + '" title="' + ST[it.s] + '"><span class="st-l">' + ST[it.s] + '</span><span class="st-s">' + STS[it.s] + '</span></span>'; }
  function specs(it) {
    var out = [];
    if (it.speed) out.push(Math.round(it.speed) + ' км/ч');
    if (it.load) out.push(Math.round(it.load) + ' кг');
    if (it.power) out.push(Math.round(it.power) + ' Вт');
    return out.slice(0, 3);
  }
  function canBuy(it) { return (it.s === 'supplier' || it.s === 'our' || it.s === 'order') && it.price; }
  var CART = '<svg viewBox="0 0 22 22" width="22" height="22" aria-hidden="true"><path d="M3 4h2.4l2 10.2h9.4L19 7H6.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8.5" cy="18" r="1.4" fill="currentColor"/><circle cx="15.5" cy="18" r="1.4" fill="currentColor"/></svg>';
  var CMP_ICON = '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M5 3v14M15 3v14M2 7h6M12 12h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  function buy(it) {
    return canBuy(it) ? '<button class="btn btn-buy btn-sm" type="button" data-add="' + it.id + '">' + CART + '<span>В корзину</span></button>'
      : '<a class="btn btn-quiet btn-sm" href="#">Узнать</a>';
  }
  function cmp(it, cls) { return '<button class="' + (cls || 'card-cmp') + '" type="button" data-cmp="' + it.id + '" aria-pressed="false" title="Сравнить">' + CMP_ICON + '<span class="vh">Сравнить</span></button>'; }

  /* ---- корзина и сравнение ---- */
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } }
  function save(k, val) { try { localStorage.setItem(k, JSON.stringify(val)); } catch (e) {} }
  var cart = load('vm-cart'), cmpl = load('vm-cmp');
  function byId(id) { return D.items.filter(function (x) { return x.id === id; })[0]; }
  function syncBadges() {
    document.querySelectorAll('[data-cart-n]').forEach(function (el) { el.textContent = cart.length; el.hidden = !cart.length; });
    document.querySelectorAll('[data-cmp-n]').forEach(function (el) { el.textContent = cmpl.length; el.hidden = !cmpl.length; });
    document.querySelectorAll('[data-add]').forEach(function (b) {
      var on = cart.indexOf(b.dataset.add) >= 0; b.classList.toggle('is-in', on);
      var t = b.querySelector('span'); if (t) t.textContent = on ? 'В корзине' : 'В корзину';
    });
    document.querySelectorAll('[data-cmp]').forEach(function (b) { var on = cmpl.indexOf(b.dataset.cmp) >= 0; b.setAttribute('aria-pressed', on); b.title = on ? 'Убрать из сравнения' : 'Сравнить'; });
    var cb = document.querySelector('[data-cmpbar]');
    if (cb) {
      cb.hidden = !cmpl.length;
      var list = cb.querySelector('[data-cmplist]');
      if (list) list.innerHTML = cmpl.map(function (id) { var it = byId(id); return it ? '<li><img src="' + ROOT + it.cut + '" alt="" width="56" height="40"><span>' + esc(it.model) + '</span></li>' : ''; }).join('') +
        (cmpl.length < 4 ? '<li class="cmp-slot">ещё ' + (4 - cmpl.length) + '</li>' : '');
    }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-add]');
    if (a) { var i = cart.indexOf(a.dataset.add); if (i >= 0) cart.splice(i, 1); else cart.push(a.dataset.add); save('vm-cart', cart); syncBadges(); return; }
    var c = e.target.closest('[data-cmp]');
    if (c) {
      var j = cmpl.indexOf(c.dataset.cmp);
      if (j >= 0) cmpl.splice(j, 1); else if (cmpl.length < 4) cmpl.push(c.dataset.cmp);
      else { var cb = document.querySelector('[data-cmpbar]'); if (cb) { cb.classList.remove('shake'); void cb.offsetWidth; cb.classList.add('shake'); } }
      save('vm-cmp', cmpl); syncBadges(); return;
    }
    if (e.target.closest('[data-cmpclear]')) { cmpl = []; save('vm-cmp', cmpl); syncBadges(); }
  });

  /* ---- А: карточка ---- */
  function cardA(it) {
    var sp = specs(it);
    return '<article class="card" data-id="' + it.id + '">' +
      '<div class="card-ph"><img src="' + ROOT + it.cut + '" alt="" loading="lazy" width="600" height="420"></div>' + cmp(it) +
      '<div class="card-b"><h3 class="card-t"><a href="#"><span class="card-brand">' + esc(it.brand || '') + '</span>' + esc(it.model) + '</a></h3>' +
      charge(it) + (sp.length ? '<p class="card-sp">' + '<span>' + sp.join('</span><i aria-hidden="true"></i><span>') + '</span>' + '</p>' : '') +
      '<div class="card-f"><div class="card-pr">' + price(it) + st(it) + '</div>' + buy(it) + '</div></div></article>';
  }
  /* ---- Б: строка (каталог) ---- */
  function rowB(it) {
    var k = km(it);
    var cell = function (val, u, l) { return '<div class="ins"><b>' + (val == null ? '—' : val) + '</b><span>' + (val == null ? '' : u) + '</span><em>' + (val == null ? l + ': нет данных' : l) + '</em></div>'; };
    return '<article class="row" data-id="' + it.id + '">' +
      '<div class="row-ph"><img src="' + ROOT + it.cut + '" alt="" loading="lazy" width="600" height="420"></div>' +
      '<div class="row-t"><h3><a href="#"><span class="card-brand">' + esc(it.brand || '') + ', ' + esc(it.sub.toLowerCase()) + '</span>' + esc(it.model) + '</a></h3>' + st(it) + '</div>' +
      '<div class="row-ins"><div class="ins ins-km"><b>' + (k || '—') + '</b><span>' + (k ? 'км' : '') + '</span><em>' + (k ? 'заявлено' : 'запас хода: нет данных') + '</em>' + (k ? bar(k) : '') + '</div>' +
      cell(it.speed ? Math.round(it.speed) : null, 'км/ч', 'скорость') + cell(it.load ? Math.round(it.load) : null, 'кг', 'нагрузка') + cell(it.power ? Math.round(it.power) : null, 'Вт', 'мотор') + '</div>' +
      '<div class="row-buy">' + price(it) + '<div class="row-act">' + buy(it) + cmp(it, 'row-cmp') + '</div></div></article>';
  }
  /* ---- Б: плита (главная) — предмет крупно, запас хода прибором ---- */
  function tileB(it) {
    var k = km(it), sp = specs(it);
    return '<article class="tile" data-id="' + it.id + '">' +
      '<div class="tile-ph"><img src="' + ROOT + it.cut + '" alt="" loading="lazy" width="600" height="420"></div>' + cmp(it) +
      '<div class="tile-b"><h3><a href="#"><span class="card-brand">' + esc(it.brand || '') + '</span>' + esc(it.model) + '</a></h3>' +
      (k ? '<p class="tile-km"><b>' + k + '</b><span>км, заявлено</span></p>' + bar(k) : '<p class="kmv-none">Запас хода: нет данных</p>') +
      (sp.length ? '<p class="card-sp">' + '<span>' + sp.join('</span><i aria-hidden="true"></i><span>') + '</span>' + '</p>' : '') +
      '<div class="card-f"><div class="card-pr">' + price(it) + st(it) + '</div>' + buy(it) + '</div></div></article>';
  }
  function skel(n) { var s = ''; for (var i = 0; i < n; i++) s += '<div class="skel" aria-hidden="true"><i class="sk-ph"></i><i class="sk-l"></i><i class="sk-l"></i><i class="sk-b"></i></div>'; return s; }
  var tpl = V === 'b' ? rowB : cardA;
  window.VM = { D: D, CATS: CATS, ST: ST, card: cardA, row: rowB, tile: tileB, tpl: tpl, price: price, charge: charge, bar: bar, st: st, specs: specs, esc: esc, money: money, root: ROOT, MAXKM: MAXKM, skel: skel, byId: byId };

  /* ---- шкала заряда наполняется при появлении (единственное «кино» на сайте) ---- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('on'); io.unobserve(en.target); } });
  }, { threshold: .6 }) : null;
  function watch(root) { (root || document).querySelectorAll('.chg.anim:not(.on)').forEach(function (el) { if (io) io.observe(el); else el.classList.add('on'); }); }
  window.VM.watch = watch;

  /* ---- ползунок-батарея: подпись и заполнение ---- */
  function bsl(root) {
    (root || document).querySelectorAll('.bsl').forEach(function (b) {
      var inp = b.querySelector('input'), out = b.querySelector('.bsl-v b'), ch = b.querySelector('.chg');
      if (!inp || b.dataset.ready) return; b.dataset.ready = 1;
      var upd = function () { var k = +inp.value; if (out) out.textContent = k; if (ch) ch.style.setProperty('--v', v(k)); b.classList.toggle('has', k > 0); };
      inp.addEventListener('input', upd); upd();
    });
  }
  window.VM.bsl = bsl;

  /* ---- списки по атрибуту data-list ---- */
  /* Подборки «по задаче» в рабочем сайте ставит администратор (ТЗ п. 4); в макете — по характеристикам поставщика */
  var TASKS = {
    city: function (it) { return (it.c === 'scooter' || it.c === 'bike' || it.c === 'kick') && it.sub === 'Двухколёсные' && (it.range || 0) >= 40 && (it.speed || 0) <= 45; },
    out: function (it) { return it.c === 'moto' || it.c === 'quad' || /fat|spyder/i.test(it.name) || (it.range || 0) >= 70; },
    cargo: function (it) { return it.sub !== 'Двухколёсные' || (it.load || 0) >= 200; },
    two: function (it) { return /двухмест|пассаж|model 44|a031/i.test(it.name) || (it.load || 0) >= 250; }
  };
  function pick(spec) {
    var p = spec.split(':'), kind = p[0], arg = p[1], n = +(p[2] || 4);
    var src = D.items.filter(function (it) { return it.c !== 'acc' && it.id !== 'ps-Shtenli_Model_15'; }); // у CityGo 15 на фото остался призрак тени — в подборки не берём до замены фото
    if (kind === 'ids') return arg.split(',').map(byId).filter(Boolean);
    if (kind === 'cat') return D.items.filter(function (it) { return it.c === arg; }).slice(0, n);
    if (kind === 'task') { var seen = {}; return src.filter(TASKS[arg]).filter(function (it) { var k = it.brand + it.model.split(' ')[0]; if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, n); } // одна модель линейки — без одинаковых фото подряд
    return src.slice(0, n);
  }
  window.VM.TASKS = TASKS; window.VM.pick = pick;
  var TPL = { row: rowB, card: cardA, tile: tileB };
  document.querySelectorAll('[data-list]').forEach(function (el) { el.innerHTML = pick(el.dataset.list).map(TPL[el.dataset.tpl] || tpl).join(''); });
  document.querySelectorAll('[data-count]').forEach(function (el) { var c = CATS.filter(function (x) { return x.id === el.dataset.count; })[0]; el.textContent = c ? (D.counts[c.name] || 0) : ''; });
  /* диапазон запаса хода раздела: «25–120 км» и полоса от минимума до максимума */
  document.querySelectorAll('[data-range]').forEach(function (el) {
    var c = CATS.filter(function (x) { return x.id === el.dataset.range; })[0], r = c && D.ranges && D.ranges[c.name];
    if (!r) { el.hidden = true; return; }
    el.innerHTML = '<span class="cr-v"><b>' + r[0] + '–' + r[1] + '</b> км</span><span class="chg span" style="--from:' + v(r[0]) + ';--v:' + v(r[1]) + '" role="img" aria-label="Заявленный запас хода моделей раздела от ' + r[0] + ' до ' + r[1] + ' км"><i></i></span>';
  });
  document.addEventListener('vm:sync', function () { syncBadges(); bsl(); });
  watch(); bsl(); syncBadges();
})();
