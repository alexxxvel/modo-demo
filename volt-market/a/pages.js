/* А: страница товара, сравнение и корзина с оформлением. Данные — VM (shared/app.js, shared/data.js). Макет: заказ не отправляется, в рабочем сайте — модуль shop движка.
   Круг 2 (09.11.2026, арт-директор 70–77): галерея фото поставщика, запас хода крупно, сцена у каждой модели, сравнение без плашек (лучшее — весом),
   на телефоне два столбца с выбором модели, корзина: форма + сводка с одной главной кнопкой, выбранное заливкой. */
(function () {
  'use strict';
  var VM = window.VM; if (!VM) return;
  var q = new URLSearchParams(location.search);
  var GT21 = 'ps-Shtenli_Model_21-pro';
  var esc = VM.esc, money = VM.money, ROOT = VM.root;
  var phone = window.matchMedia('(max-width: 720px)');
  function catOf(it) { return VM.CATS.filter(function (c) { return c.id === it.c; })[0] || { name: 'Каталог', short: 'Каталог' }; }
  function title(it) { return (it.brand ? it.brand + ' ' : '') + it.model; }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function plural(n, a, b, c) { var m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; }
  function canBuy(x) { return (x.s === 'supplier' || x.s === 'our' || x.s === 'order') && x.price; }
  function lc(t) { return t ? t.replace(/[А-ЯЁ][а-яё]*/g, function (w) { return w.toLowerCase(); }).replace(/двухколесн/g, 'двухколёсн').replace(/трехколесн/g, 'трёхколёсн').replace(/^\s+/, '') : ''; } // «Литиевая 48V» → «литиевая 48V», а не «48v»
  // \b в JS не видит кириллицу — граница слова через (?![а-яё]). Данные поставщика к одному виду (арт-директор, круг 2): «60V 20Ah» → «60 В · 20 А·ч», «20.8» → «20,8», «6-7 часов» → «6–7 ч», «Без Сиденья» → «без сиденья»
  function batt(t) { if (!t) return ''; var v = t.match(/(\d+(?:[.,]\d+)?)\s*V/i), a = t.match(/(\d+(?:[.,]\d+)?)\s*Ah/i), kind = lc(t.replace(/\d+(?:[.,]\d+)?\s*(V|Ah)(?![a-z])/gi, '').replace(/\s+/g, ' ').trim());
    var n = [v ? v[1].replace('.', ',') + '&nbsp;В' : '', a ? a[1].replace('.', ',') + '&nbsp;А·ч' : ''].filter(Boolean).join(' · '); return (kind ? esc(kind) + (n ? ', ' : '') : '') + n; }
  function hrs(t) { return t ? esc(t).replace(/(\d)\s*-\s*(\d)/g, '$1–$2').replace(/\s*час(ов|а)?(?![а-яё])/i, '&nbsp;ч') : ''; }
  function num1(v) { return String(Math.round(v * 10) / 10).replace('.', ','); }
  function shortName(x) { var m = x.model.replace(/^Model\s+/i, '').split(/\s+с\s+|\s*\(/)[0]; m = m.split(/\s+/).filter(function (w) { return !/^(\d+V\d*A?h?|\d+Ah|Li-?ion|SLA|\d+W)$/i.test(w); }).join(' '); return m.length > 18 ? m.slice(0, 17) + '…' : m; }
  function chargeOf(x) { return /час|ч\b/i.test(x.charge || '') ? x.charge : ''; }
  var ND = '<span class="nd">нет данных</span>';
  var CART_ICON = '<svg viewBox="0 0 22 22" width="22" height="22" aria-hidden="true"><path d="M3 4h2.4l2 10.2h9.4L19 7H6.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8.5" cy="18" r="1.4" fill="currentColor"/><circle cx="15.5" cy="18" r="1.4" fill="currentColor"/></svg>';

  /* ================= товар ================= */
  var P = document.querySelector('[data-product]');
  if (P) {
    var it = VM.byId(q.get('id')) || VM.byId(GT21);
    var cat = catOf(it);
    document.title = title(it) + ': купить с доставкой по Беларуси (макет А)';
    var set = function (k, html) { document.querySelectorAll('[data-p="' + k + '"]').forEach(function (el) { el.innerHTML = html; }); };
    set('cat', esc(cat.name)); set('catback', esc(cat.name)); set('brand', esc(it.brand || '')); set('model', esc(it.model)); set('name', esc(title(it)));
    set('price', VM.price(it)); set('st', VM.st(it));
    document.querySelectorAll('[data-p="add"]').forEach(function (b) { b.dataset.add = it.id; });
    document.querySelectorAll('[data-p="cmp"]').forEach(function (b) { b.dataset.cmp = it.id; });
    document.querySelectorAll('[data-p="one"]').forEach(function (a) { a.href = 'korzina.html?buy=' + encodeURIComponent(it.id); });
    if (!canBuy(it)) document.querySelectorAll('[data-p="add"]').forEach(function (b) { b.outerHTML = '<a class="btn btn-main" href="#">Узнать о&nbsp;поступлении</a>'; });
    // галерея: первым всегда вырез на плите (как у всех моделей), живые фото поставщика — в конце, на всю плиту, с подписью «Фото поставщика»
    var shots = [{ src: ROOT + it.cut, flat: false }].concat((it.gal || []).map(function (g) { var a = Array.isArray(g) ? g : [g, false]; return { src: ROOT + a[0], flat: !a[1], white: !!a[1] }; }));
    var ph = P.querySelector('[data-p="photo"]'), fig = P.querySelector('.pb-ph');
    var show = function (i) {
      var s = shots[i]; ph.src = s.src; ph.alt = it.name + (shots.length > 1 ? ', фото ' + (i + 1) + ' из ' + shots.length : '');
      fig.classList.toggle('flat', s.flat); fig.classList.toggle('white', !!s.white); fig.dataset.note = s.flat ? 'Фото поставщика' : '';
      P.querySelectorAll('.pb-th button').forEach(function (b, j) { b.setAttribute('aria-pressed', j === i); });
    };
    var th = P.querySelector('[data-p="thumbs"]');
    if (shots.length > 1) {
      th.innerHTML = shots.map(function (s, i) { return '<button type="button" class="' + (s.flat ? 'flat' : s.white ? 'white' : '') + '" aria-pressed="false" aria-label="Фото ' + (i + 1) + '" data-shot="' + i + '"><img src="' + s.src + '" alt="" width="88" height="66" loading="lazy"></button>'; }).join('');
      th.addEventListener('click', function (e) { var b = e.target.closest('[data-shot]'); if (b) show(+b.dataset.shot); });
    } else th.remove();
    show(0);
    // фирменная цифра — запас хода крупно, как в сцене, у каждой модели
    var k = it.range ? Math.round(it.range) : 0;
    set('km', k ? '<p class="pb-km-l">Запас хода, заявлено</p><p class="pb-km-v"><b>' + k + '</b> км</p>' + VM.bar(k) +
      '<p class="pb-km-s">' + [it.battery ? 'батарея ' + batt(it.battery) : '', chargeOf(it) ? 'зарядка ' + hrs(chargeOf(it)) : ''].filter(Boolean).join(', ') + '</p>' : '');
    // характеристики группами; пустое — «нет данных»
    var row = function (l, v) { return '<div><dt>' + l + '</dt><dd>' + (v || ND) + '</dd></div>'; };
    var u = function (v, s) { return v ? num1(v) + '&nbsp;' + s : ''; };
    set('specs',
      '<section><h3>Ход и&nbsp;батарея</h3><dl>' + row('Запас хода, заявлено', u(it.range, 'км')) + row('Батарея', batt(it.battery)) + row('Напряжение', u(it.volt, 'В')) + row('Ёмкость', u(it.ah, 'А·ч')) + row('Время зарядки', hrs(chargeOf(it))) + '</dl></section>' +
      '<section><h3>Мотор и&nbsp;скорость</h3><dl>' + row('Мощность мотора', u(it.power, 'Вт')) + row('Скорость', it.speed ? 'до&nbsp;' + u(it.speed, 'км/ч') : '') + '</dl></section>' +
      '<section><h3>Размеры и&nbsp;нагрузка</h3><dl>' + row('Нагрузка', it.load ? 'до&nbsp;' + u(it.load, 'кг') : '') + row('Масса', u(it.mass, 'кг')) + row('Колёса', u(it.wheel, 'дюймов')) + row('Тип', esc(lc(it.type || ''))) + '</dl></section>' +
      '<section><h3>Конструкция и&nbsp;гарантия</h3><dl>' + (it.more || []).map(function (m) { return row(esc(m[0]), esc(lc(m[1]))); }).join('') +
      row('Гарантия', it.warranty ? esc(it.warranty) : '<span class="todo">по&nbsp;документам, подтвердит заказчик</span>') + '</dl></section>');
    // сцена «Что стоит за цифрами» на странице товара: запас хода уже главный в колонке покупки — здесь не повторяем;
    // у каждой модели одинаково: батарея и зарядка, нагрузка и масса, скорость и колёса, мотор; фото — деталью (общий план уже в галерее)
    var sc = document.querySelector('[data-probe-sec]');
    if (sc) {
      sc.querySelectorAll('.probe-ln, .probe-dot').forEach(function (e) { e.remove(); });
      sc.classList.add('probe-any');
      var im = sc.querySelector('.probe-im'); im.src = ROOT + it.cut; im.alt = it.name + ', деталь';
      var lead = sc.querySelector('[data-probe-lead]'); if (lead) lead.innerHTML = esc(title(it)) + ': ещё четыре цифры, по&nbsp;которым удобно сравнивать модели.';
      var seat = (it.more || []).filter(function (m) { return /сиден/i.test(m[0]); })[0];
      var fill = function (c, label, valHtml, sub) { c.classList.remove('pc-big'); c.querySelector('dt').innerHTML = label; c.querySelector('dd').innerHTML = '<span class="pc-v">' + valHtml + '</span>' + (sub ? '<span class="pc-s">' + sub + '</span>' : ''); };
      sc.querySelectorAll('.probe-c').forEach(function (c) {
        var t = c.querySelector('dt').textContent;
        if (/Запас/.test(t)) fill(c, 'Батарея', it.ah ? '<b>' + num1(it.ah) + '</b> А·ч' : (it.battery ? batt(it.battery) : ND), [it.volt ? it.volt + '&nbsp;В' : '', chargeOf(it) ? 'зарядка ' + hrs(chargeOf(it)) : ''].filter(Boolean).join(', '));
        else if (/Скорость/.test(t)) fill(c, 'Скорость', it.speed ? 'до&nbsp;<b data-to="' + Math.round(it.speed) + '">' + Math.round(it.speed) + '</b> км/ч' : ND, it.wheel ? 'колёса ' + num1(it.wheel) + '&nbsp;дюймов' : '');
        else if (/Нагрузка/.test(t)) fill(c, 'Нагрузка', it.load ? 'до&nbsp;<b data-to="' + Math.round(it.load) + '">' + Math.round(it.load) + '</b> кг' : ND, [it.mass ? 'масса ' + Math.round(it.mass) + '&nbsp;кг' : '', seat ? esc(lc(seat[1])) : ''].filter(Boolean).join(', '));
        else if (/Мотор/.test(t)) fill(c, 'Мотор', it.power ? '<b data-to="' + Math.round(it.power) + '">' + Math.round(it.power) + '</b> Вт' : ND, 'по&nbsp;данным производителя');
      });
      sc.querySelectorAll('.chg').forEach(function (e) { e.remove(); });
    }
    // похожие: тот же вид, ближе по запасу хода
    var sim = VM.D.items.filter(function (x) { return x.c === it.c && x.id !== it.id; })
      .sort(function (a, b) { return Math.abs((a.range || 0) - k) - Math.abs((b.range || 0) - k); }).slice(0, 4);
    var sl = document.querySelector('[data-similar]'); if (sl) { if (sim.length) { sl.innerHTML = sim.map(VM.card).join(''); VM.watch(sl); } else sl.closest('section').remove(); }
    // липкая строка покупки: появляется, когда главная кнопка ушла из окна вверх
    var bar = document.querySelector('[data-pbar]'), main = P.querySelector('.pb-act');
    if (bar && main && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { var e = es[0]; bar.classList.toggle('on', !e.isIntersecting && e.boundingClientRect.top < 0); }).observe(main);
    }
    VM.watch(document); document.dispatchEvent(new Event('vm:sync'));
  }

  /* ================= сравнение ================= */
  var C = document.querySelector('[data-compare]');
  if (C) {
    var DEMO = [GT21, 'ps-AVM-Travel', 'ps-Model031_Li'];
    var pair = [0, 1]; // телефон: какие две модели в столбцах (как сравнение у Apple — выбор над каждым столбцом)
    var buyBtn = function (x) {
      return canBuy(x) ? '<button class="btn btn-buy btn-sm cc-buy" type="button" data-add="' + x.id + '" aria-label="В корзину: ' + esc(title(x)) + '">' + CART_ICON + '<span>В корзину</span></button>' : '<a class="btn btn-quiet btn-sm cc-buy" href="#">Узнать</a>';
    };
    var draw = function () {
      var ids = window.VM_cmp ? window.VM_cmp().slice() : [];
      var demo = !ids.length; if (demo) ids = DEMO;
      var all = ids.map(VM.byId).filter(Boolean).slice(0, 3);
      if (pair[0] >= all.length || pair[1] >= all.length || pair[0] === pair[1]) pair = [0, Math.min(1, all.length - 1)];
      var two = phone.matches && all.length > 2;
      var its = two ? [all[pair[0]], all[pair[1]]] : all;
      var note = document.querySelector('[data-cmp-demo]'); if (note) note.hidden = !demo;
      var onlyEl = C.querySelector('[data-diff]'), only = onlyEl && onlyEl.checked;
      var cols = its.length, slots = phone.matches ? 2 : 3;
      var pick = function (col) {
        if (!two) return '';
        return '<label class="cc-pick"><span class="vh">Модель в&nbsp;столбце ' + (col + 1) + '</span><select data-pick="' + col + '">' + all.map(function (x, i) {
          return '<option value="' + i + '"' + (i === pair[col] ? ' selected' : '') + (i === pair[1 - col] ? ' disabled' : '') + '>' + esc(shortName(x)) + '</option>'; }).join('') + '</select></label>';
      };
      var corner = '<div class="cc-corner"><p class="cc-count">' + all.length + ' ' + plural(all.length, 'модель', 'модели', 'моделей') + '</p>' +
        '<label class="ck cc-diff"><input type="checkbox" data-diff' + (only ? ' checked' : '') + '><span>Только различия</span></label></div>';
      var head = corner + its.map(function (x, col) {
        return '<div class="cc-h">' + pick(col) + '<a class="cc-ph" href="tovar.html?id=' + encodeURIComponent(x.id) + '"><img src="' + ROOT + x.cut + '" alt="" width="300" height="225" loading="lazy"></a>' +
          '<p class="cc-n"><a href="tovar.html?id=' + encodeURIComponent(x.id) + '"><span class="card-brand">' + esc(x.brand || '') + '</span>' + esc(x.model) + '</a></p>' +
          '<div class="cc-hf">' + VM.price(x) + buyBtn(x) + '</div>' +
          (demo ? '' : '<button class="cc-x" type="button" data-cmp="' + x.id + '" aria-label="Убрать из сравнения: ' + esc(title(x)) + '"></button>') + '</div>';
      }).join('') + (cols < slots ? '<a class="cc-add" href="catalog.html"><span>Добавить модель</span></a>' : '');
      var R = [
        ['Наличие', function (x) { return x.s; }, function (x) { return VM.st(x); }],
        ['Запас хода, заявлено', function (x) { return x.range || 0; }, function (x) { return x.range ? '<span class="pi-v"><b>' + Math.round(x.range) + '</b> км</span>' + VM.bar(Math.round(x.range)) : ND; }, 'max'],
        ['Скорость', function (x) { return x.speed || 0; }, function (x) { return x.speed ? 'до&nbsp;<b>' + Math.round(x.speed) + '</b>&nbsp;км/ч' : ND; }, 'max'],
        ['Нагрузка', function (x) { return x.load || 0; }, function (x) { return x.load ? 'до&nbsp;<b>' + Math.round(x.load) + '</b>&nbsp;кг' : ND; }, 'max'],
        ['Мотор', function (x) { return x.power || 0; }, function (x) { return x.power ? '<b>' + Math.round(x.power) + '</b>&nbsp;Вт' : ND; }, 'max'],
        ['Время зарядки', function (x) { return chargeOf(x); }, function (x) { return chargeOf(x) ? hrs(chargeOf(x)) : ND; }],
        ['Масса', function (x) { return x.mass || 0; }, function (x) { return x.mass ? '<b>' + Math.round(x.mass) + '</b>&nbsp;кг' : ND; }],
        ['Колёса', function (x) { return x.wheel || 0; }, function (x) { return x.wheel ? '<b>' + num1(x.wheel) + '</b>&nbsp;дюймов' : ND; }],
        ['Батарея', function (x) { return x.battery || ''; }, function (x) { return x.battery ? batt(x.battery) : ND; }]
      ];
      var body = R.map(function (r) {
        var vals = its.map(r[1]);
        var same = vals.every(function (v) { return v === vals[0]; });
        if (only && same) return '';
        // лучшее значение — весом, без плашек; отмечаем только при разнице от 10 %
        var best = null;
        if (r[3] && !same) {
          var ok = vals.filter(function (v) { return v; }).sort(function (a, b) { return b - a; });
          if (ok.length > 1 && ok[0] >= ok[1] * 1.1) best = ok[0];
        }
        return '<div class="cc-r' + (same ? ' same' : '') + (best !== null ? ' has-best' : '') + '"><dt>' + r[0] + '</dt>' + its.map(function (x, i) {
          return '<dd' + (best !== null && vals[i] === best ? ' class="best"' : '') + '><span class="cv">' + r[2](x) + '</span></dd>';
        }).join('') + (cols < slots ? '<dd class="cc-void" aria-hidden="true"></dd>' : '') + '</div>';
      }).join('');
      C.innerHTML = '<div class="cc-hd">' + head + '</div><dl class="cc-b">' + body + '</dl>';
      VM.watch(C); document.dispatchEvent(new Event('vm:sync'));
    };
    C.addEventListener('change', function (e) {
      if (e.target.matches('[data-diff]')) draw();
      var s = e.target.closest('[data-pick]'); if (s) { pair[+s.dataset.pick] = +s.value; draw(); }
    });
    document.addEventListener('click', function (e) { if (e.target.closest('.cc-x')) setTimeout(draw, 0); });
    if (phone.addEventListener) phone.addEventListener('change', draw);
    draw();
  }

  /* ================= корзина и оформление ================= */
  var K = document.querySelector('[data-cart]');
  if (K) {
    var one = q.get('buy');
    var qty = load('vm-qty', {});
    if (q.get('demo') && window.VM_cart && !window.VM_cart().length) window.VM_cartSet([GT21, 'ps-samokat-F3Plus']); // показ корзины на снимках
    var list = function () { return one ? [one] : (window.VM_cart ? window.VM_cart() : []); };
    var hd = document.querySelector('[data-cart-h]'); if (hd && one) hd.textContent = 'Купить в один клик';
    var drawCart = function () {
      var its = list().map(VM.byId).filter(Boolean);
      var box = K.querySelector('[data-lines]'), sum = K.querySelector('[data-sum]');
      document.body.classList.toggle('cart-empty', !its.length);
      if (!its.length) { box.innerHTML = ''; return; }
      var total = 0, ask = 0, n = 0;
      box.innerHTML = its.map(function (x) {
        var c = Math.max(1, Math.min(9, qty[x.id] || 1)); n += c;
        if (x.price) total += x.price * c; else ask++;
        var km = x.range ? Math.round(x.range) : 0;
        return '<li class="ln"><a class="ln-ph" href="tovar.html?id=' + encodeURIComponent(x.id) + '"><img src="' + ROOT + x.cut + '" alt="" width="96" height="72"></a>' +
          '<div class="ln-t"><p class="ln-n"><a href="tovar.html?id=' + encodeURIComponent(x.id) + '"><span class="card-brand">' + esc(x.brand || '') + '</span>' + esc(x.model) + '</a></p>' +
          (km ? '<p class="ln-km"><span><b>' + km + '</b> км</span>' + VM.bar(km) + '</p>' : '') + '</div>' +
          '<div class="ln-q" role="group" aria-label="Количество: ' + esc(title(x)) + '"><button type="button" data-q="-1" data-id="' + x.id + '" aria-label="Меньше"' + (c <= 1 ? ' disabled' : '') + '>−</button><output>' + c + '</output><button type="button" data-q="1" data-id="' + x.id + '" aria-label="Больше"' + (c >= 9 ? ' disabled' : '') + '>+</button></div>' +
          '<p class="ln-p">' + (x.price ? '<b class="pr">' + money(x.price * c) + '<i class="byn" aria-label="руб."></i></b>' : '<b class="pr pr-ask">Уточним цену</b>') + '</p>' +
          (one ? '' : '<button class="ln-x" type="button" data-rm="' + x.id + '" aria-label="Убрать из корзины: ' + esc(title(x)) + '"></button>') + '</li>';
      }).join('');
      sum.innerHTML = '<div><dt>' + n + ' ' + plural(n, 'товар', 'товара', 'товаров') + '</dt><dd>' + (total ? money(total) + '<i class="byn" aria-label="руб."></i>' : '—') + '</dd></div>' +
        '<div><dt>Доставка</dt><dd><span class="todo">назовём при звонке</span></dd></div>' +
        '<div class="sum-t"><dt>Итого' + (ask ? ', без моделей с ценой «уточним»' : '') + '</dt><dd><b class="pr">' + money(total) + '<i class="byn" aria-label="руб."></i></b></dd></div>';
      VM.watch(box);
    };
    K.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q]');
      if (b) { qty[b.dataset.id] = Math.max(1, Math.min(9, (qty[b.dataset.id] || 1) + +b.dataset.q)); save('vm-qty', qty); drawCart(); return; }
      var r = e.target.closest('[data-rm]');
      if (r && window.VM_cart) { window.VM_cartSet(window.VM_cart().filter(function (x) { return x !== r.dataset.rm; })); drawCart(); }
    });
    document.addEventListener('vm:cart', drawCart);
    // доставка: адрес спрашиваем только когда выбран способ доставки
    var f = K.querySelector('[data-order]'), go = K.querySelector('.cart-go');
    var dl = function () { var v = f.querySelector('input[name="dlv"]:checked'); var ad = f.querySelector('[data-addr]'); ad.hidden = !v; var inp = ad.querySelector('input'); inp.required = !!v; if (v) inp.placeholder = v.value === 'minsk' ? 'Улица, дом, квартира' : 'Город, улица, дом'; };
    f.addEventListener('change', function (e) { if (e.target.name === 'dlv') { dl(); e.target.closest('.opts').classList.remove('err'); } });
    go.addEventListener('change', function (e) { if (e.target.name === 'ok' && e.target.checked) e.target.closest('.cons').classList.remove('err'); });
    // ошибку снимаем во время набора, а не при уходе из поля: иначе текст ошибки исчезает в момент нажатия «Оформить», кнопка прыгает вверх и нажатие уходит мимо
    f.addEventListener('input', function (e) { var fl = e.target.closest('.fld'); if (fl) fl.classList.remove('err'); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      f.querySelectorAll('.fld').forEach(function (fl) {
        var inp = fl.querySelector('input,textarea'); if (!inp || fl.hidden) return;
        var v = (inp.value || '').trim(), ok = true;
        if (inp.required && !v) ok = false;
        if (ok && inp.name === 'phone') ok = v.replace(/\D/g, '').length >= 9;
        fl.classList.toggle('err', !ok); if (!ok && !bad) bad = inp;
      });
      var dset = f.querySelector('[data-need="dlv"]'), dv = f.querySelector('input[name="dlv"]:checked');
      dset.classList.toggle('err', !dv); if (!dv && !bad) bad = dset.querySelector('input');
      var cons = go.querySelector('[name="ok"]'); var cf = cons.closest('.cons'); cf.classList.toggle('err', !cons.checked); if (!cons.checked && !bad) bad = cons;
      if (bad) { bad.focus(); return; }
      K.classList.add('sent');
      var done = K.querySelector('[data-done]'); done.hidden = false; done.focus();
      if (!one && window.VM_cartSet) window.VM_cartSet([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    dl(); drawCart();
  }
})();
