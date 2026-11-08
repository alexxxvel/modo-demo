/* Б: вопрос «для чего» меняет машину на сцене и прибор; ниже — подходящие модели плитами и графитовый блок «три вида на одних приборах» */
(function () {
  'use strict';
  var VM = window.VM; if (!VM) return;
  var PICK = { city: 'ps-Shtenli14', out: 'ps-AVM-Travel', cargo: 'ps-Model90', two: 'ps-Model031_Li' };
  var WHY = {
    city: 'Двухколёсные, от 40 км заявленного хода, до 45 км/ч.',
    out: 'Мотоциклы, квадроциклы и модели от 70 км хода.',
    cargo: 'Трёхколёсные и грузовые, нагрузка от 200 кг.',
    two: 'Двухместные и трёхколёсные, нагрузка от 250 кг.'
  };
  var NAME = { city: 'Подходят для города', out: 'Подходят за город', cargo: 'Подходят для груза', two: 'Подходят вдвоём' };
  var $ = function (s) { return document.querySelector(s); };
  var img = $('[data-sim]'), g = $('[data-gauge] .g-v'), fit = $('[data-fit]');
  function num(el, v) { el.textContent = v == null ? '—' : Math.round(v); }
  function plural(n) { var m = n % 10, h = n % 100; return m === 1 && h !== 11 ? 'модель' : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? 'модели' : 'моделей'; }
  function arc(k) { return 100 - Math.min((k || 0) / VM.MAXKM, 1) * 100; }
  function show(t, first) {
    var it = VM.byId(PICK[t]);
    document.querySelectorAll('[data-pick]').forEach(function (b) { b.setAttribute('aria-checked', b.dataset.pick === t); });
    $('[data-why]').textContent = WHY[t];
    var all = VM.pick('task:' + t + ':99');
    $('[data-all]').textContent = 'Смотреть ' + all.length + ' ' + plural(all.length);
    $('[data-fit-h]').textContent = NAME[t];
    var swap = function () {
      img.src = VM.root + it.cut; img.alt = it.name;
      num($('[data-dkm]'), it.range); num($('[data-dsp]'), it.speed); num($('[data-dld]'), it.load); num($('[data-dpw]'), it.power);
      $('[data-dname]').textContent = it.model;
      $('[data-dprice]').innerHTML = VM.price(it);
      $('[data-dst]').outerHTML = VM.st(it).replace('class="st"', 'class="st" data-dst');
      g.style.strokeDashoffset = arc(it.range);
      img.classList.remove('out');
    };
    if (first) swap(); else { img.classList.add('out'); setTimeout(swap, 180); }
    fit.innerHTML = all.slice(0, 4).map(VM.tile).join('');
    VM.watch(fit); document.dispatchEvent(new Event('vm:sync'));
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-pick]'); if (b) show(b.dataset.pick); });
  show('city', true);

  /* три вида на одних приборах */
  var c3 = $('[data-cmp3]');
  if (c3) {
    c3.innerHTML = ['ps-Shtenli_Model_21-pro', 'ps-AVM-INTRO', 'ps-samokat-F3Plus'].map(VM.byId).map(function (it) {
      var row = function (v, u, l) { return '<div><dt>' + l + '</dt><dd><b>' + (v == null ? '—' : Math.round(v)) + '</b> ' + u + '</dd></div>'; };
      return '<article class="c3">' +
        '<p class="c3-k">' + ({ scooter: 'Скутер', bike: 'Велосипед', kick: 'Самокат' })[it.c] + '</p>' +
        '<div class="c3-im"><img src="' + VM.root + it.cut + '" alt="" loading="lazy" width="600" height="420"></div>' +
        '<div class="gauge gauge-s" aria-hidden="true"><svg viewBox="0 0 200 120"><path class="g-bg" d="M18 108 A84 84 0 0 1 182 108" pathLength="100"/><path class="g-v" d="M18 108 A84 84 0 0 1 182 108" pathLength="100" style="stroke-dashoffset:' + arc(it.range) + '"/></svg><p class="g-n"><b>' + Math.round(it.range) + '</b><span>км, заявлено</span></p></div>' +
        '<dl class="dash-r">' + row(it.speed, 'км/ч', 'скорость') + row(it.load, 'кг', 'нагрузка') + row(it.power, 'Вт', 'мотор') + '</dl>' +
        '<h3>' + VM.esc(it.brand + ' ' + it.model) + '</h3><p class="c3-p">' + VM.price(it) + '</p></article>';
    }).join('');
  }
})();
