/* Каталог категории: фильтры только осмысленные для категории и заполненные (ТЗ п. 4), состояние в адресе, «Ничего не найдено» со сбросом. */
(function () {
  'use strict';
  var VM = window.VM; if (!VM) return;
  var root = document.querySelector('[data-catalog]'); if (!root) return;
  var grid = root.querySelector('[data-grid]'), cnt = root.querySelector('[data-found]'), form = root.querySelector('[data-filters]');
  var catId = root.dataset.catalog;
  var all = VM.D.items.filter(function (it) { return it.c === catId; });

  function q() { return new URLSearchParams(location.search); }
  function state() {
    var p = q();
    return { sub: p.getAll('sub'), st: p.getAll('st'), km: +(p.get('km') || 0), pmax: +(p.get('pmax') || 0), sort: p.get('sort') || 'order', brand: p.getAll('brand') };
  }
  function write(s) {
    var p = new URLSearchParams();
    s.sub.forEach(function (v) { p.append('sub', v); }); s.st.forEach(function (v) { p.append('st', v); }); s.brand.forEach(function (v) { p.append('brand', v); });
    if (s.km) p.set('km', s.km); if (s.pmax) p.set('pmax', s.pmax); if (s.sort !== 'order') p.set('sort', s.sort);
    history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
  }
  function apply() {
    var s = state();
    var list = all.filter(function (it) {
      return (!s.sub.length || s.sub.indexOf(it.sub) >= 0) && (!s.st.length || s.st.indexOf(it.s) >= 0) && (!s.brand.length || s.brand.indexOf(it.brand) >= 0) &&
        (!s.km || (it.range || 0) >= s.km) && (!s.pmax || (it.price && it.price <= s.pmax));
    });
    if (s.sort === 'cheap') list.sort(function (a, b) { return (a.price || 1e9) - (b.price || 1e9); });
    if (s.sort === 'dear') list.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
    if (s.sort === 'km') list.sort(function (a, b) { return (b.range || 0) - (a.range || 0); });
    cnt.textContent = list.length + ' ' + plural(list.length, 'модель', 'модели', 'моделей');
    grid.innerHTML = list.length ? list.map(VM.tpl).join('') :
      '<div class="empty"><h3>Ничего не нашлось</h3><p>Под эти условия нет моделей. Сбросьте один из фильтров или все сразу.</p><button class="btn btn-quiet" type="button" data-reset>Сбросить фильтры</button></div>';
    VM.watch(grid);
    document.querySelectorAll('[data-add],[data-cmp]').length && document.dispatchEvent(new Event('vm:sync'));
    syncForm(s);
  }
  function plural(n, a, b, c) { var m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; }
  function syncForm(s) {
    if (!form) return;
    form.querySelectorAll('input[type=checkbox]').forEach(function (c) { c.checked = (s[c.name] || []).indexOf(c.value) >= 0; });
    var r = form.querySelector('input[name=km]'); if (r) { r.value = s.km; var o = form.querySelector('[data-kmout]'); if (o) o.innerHTML = s.km ? 'от <b>' + s.km + '</b> км, заявлено' : 'любой запас хода'; var b = form.querySelector('.bsl .chg'); if (b) b.style.setProperty('--v', (s.km / VM.MAXKM).toFixed(3)); var bs = form.querySelector('.bsl'); if (bs) bs.classList.toggle('has', s.km > 0); }
    var pm = form.querySelector('select[name=pmax]'); if (pm) pm.value = s.pmax || '';
    var so = document.querySelector('select[name=sort]'); if (so) so.value = s.sort;
    document.querySelectorAll('[data-active-n]').forEach(function (el) { var n = s.sub.length + s.st.length + s.brand.length + (s.km ? 1 : 0) + (s.pmax ? 1 : 0); el.textContent = n; el.hidden = !n; });
    // метки выбранных фильтров над сеткой: видно, что включено, и снимается одним касанием (критика 09.11.2026)
    var ch = document.querySelector('[data-chips]');
    if (ch) {
      var chip = function (k, v, label) { return '<button type="button" data-unset="' + k + '" data-v="' + VM.esc(v) + '" aria-label="Убрать фильтр: ' + VM.esc(label) + '">' + VM.esc(label) + '</button>'; };
      ch.innerHTML = s.sub.map(function (v) { return chip('sub', v, v); }).join('') + s.st.map(function (v) { return chip('st', v, VM.ST[v]); }).join('') + s.brand.map(function (v) { return chip('brand', v, v); }).join('') +
        (s.km ? chip('km', '', 'от ' + s.km + ' км') : '') + (s.pmax ? chip('pmax', '', 'до ' + VM.money(s.pmax) + ' руб.') : '');
    }
  }
  function read() {
    var s = state();
    if (form) {
      ['sub', 'st', 'brand'].forEach(function (k) { s[k] = [].map.call(form.querySelectorAll('input[name=' + k + ']:checked'), function (c) { return c.value; }); });
      var r = form.querySelector('input[name=km]'); if (r) s.km = +r.value;
      var pm = form.querySelector('select[name=pmax]'); if (pm) s.pmax = +pm.value || 0;
    }
    var so = document.querySelector('select[name=sort]'); if (so) s.sort = so.value;
    write(s); apply();
  }
  // фильтры строятся из заполненных данных категории
  function build() {
    if (!form) return;
    var subs = uniq(all.map(function (it) { return it.sub; }));
    var brands = uniq(all.map(function (it) { return it.brand; }).filter(Boolean));
    var sts = uniq(all.map(function (it) { return it.s; }));
    var box = function (name, v, label, n) { return '<label class="ck"><input type="checkbox" name="' + name + '" value="' + VM.esc(v) + '"><span>' + VM.esc(label) + '</span><em>' + n + '</em></label>'; };
    var count = function (k, v) { return all.filter(function (it) { return it[k] === v; }).length; };
    var html = '';
    if (subs.length > 1) html += '<fieldset><legend>Тип</legend>' + subs.map(function (v) { return box('sub', v, v, count('sub', v)); }).join('') + '</fieldset>';
    html += '<fieldset class="f-km"><legend>Сколько хотите проезжать</legend><div class="bsl"><p class="bsl-v" data-kmout>любой запас хода</p><div class="bsl-t"><div class="chg" style="--v:0"><i></i></div><input type="range" name="km" min="0" max="150" step="15" value="0" aria-label="Заявленный запас хода от, км"></div><div class="bsl-sc"><span>0</span><span>75</span><span>150 км</span></div></div></fieldset>';
    html += '<fieldset><legend>Цена до</legend><select name="pmax"><option value="">любая</option><option value="1500">1 500</option><option value="2000">2 000</option><option value="3000">3 000</option><option value="5000">5 000</option></select></fieldset>';
    html += '<fieldset><legend>Доступность</legend>' + sts.map(function (v) { return box('st', v, VM.ST[v], count('s', v)); }).join('') + '</fieldset>';
    if (brands.length > 1) html += '<fieldset><legend>Бренд</legend>' + brands.map(function (v) { return box('brand', v, v, count('brand', v)); }).join('') + '</fieldset>';
    form.innerHTML = html;
  }
  function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); }
  build();
  grid.innerHTML = VM.skel(6); // скелетон той же формы, пока данные не пришли (в рабочем сайте — запрос к серверу)
  root.addEventListener('change', read);
  root.addEventListener('input', function (e) { if (e.target.name === 'km') read(); });
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-reset]')) { history.replaceState(null, '', location.pathname); apply(); }
    var u = e.target.closest('[data-unset]');
    if (u) { var s = state(), k = u.dataset.unset; if (k === 'km' || k === 'pmax') s[k] = 0; else s[k] = s[k].filter(function (x) { return x !== u.dataset.v; }); write(s); apply(); }
    var t = e.target.closest('[data-sheet-open]'); if (t) { document.body.classList.add('sheet-on'); }
    if (e.target.closest('[data-sheet-close]')) document.body.classList.remove('sheet-on');
  });
  setTimeout(apply, 350);
})();
