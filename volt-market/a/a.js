/* А: шкала «сколько проезжать», лента «с чего начать» с вкладками задач, сцена «модель с приборами» */
(function () {
  'use strict';
  var VM = window.VM; if (!VM) return;
  var rr = document.querySelector('[data-rr]');
  if (rr) {
    var n = document.querySelector('[data-rn]'), list = document.querySelector('[data-rlist]'), link = document.querySelector('[data-rlink]');
    var pool = VM.D.items.filter(function (it) { return it.c !== 'acc' && it.range; });
    var upd = function () {
      var k = +rr.value;
      var fit = pool.filter(function (it) { return it.range >= k; }).sort(function (a, b) { return a.range - b.range || (a.price || 9e9) - (b.price || 9e9); });
      n.innerHTML = 'Подходят <b>' + fit.length + '</b> из&nbsp;' + pool.length + ' моделей макета';
      list.innerHTML = fit.slice(0, 3).map(VM.card).join('') || '<div class="empty"><h3>Таких моделей нет</h3><p>Уменьшите запас хода: больше 80 км в макете не проезжает ни одна модель.</p></div>';
      link.href = 'catalog.html?km=' + k;
      VM.watch(list); document.dispatchEvent(new Event('vm:sync'));
    };
    rr.addEventListener('input', upd); upd();
  }
  var tl = document.querySelector('[data-tasklist]');
  if (tl) {
    var show = function (t) {
      document.querySelectorAll('[data-task]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.task === t); });
      tl.innerHTML = (t === 'pop' ? VM.pick('ids:' + tl.dataset.pop) : VM.pick('task:' + t + ':4')).map(VM.card).join('');
      VM.watch(tl); document.dispatchEvent(new Event('vm:sync'));
    };
    document.addEventListener('click', function (e) { var b = e.target.closest('[data-task]'); if (b && b.getAttribute('aria-selected') !== 'true') { tl.classList.remove('swap'); void tl.offsetWidth; show(b.dataset.task); tl.classList.add('swap'); } });
    show('pop');
  }
  /* сцена «модель с приборами» (приём VELOS, site-scenes/velos): точки на батарее, колесе, сиденье и моторе, линии к приборам, досчёт цифр один раз */
  var pb = document.querySelector('[data-probe]');
  if (pb) {
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var run = function () {
      pb.classList.add('on');
      pb.querySelectorAll('.chg.anim').forEach(function (c) { c.classList.add('on'); });
      if (still) return;
      pb.querySelectorAll('[data-to]').forEach(function (b, i) {
        var to = +b.dataset.to, t0 = 0, d = 900, delay = 520 + i * 110;
        b.textContent = '0';
        var step = function (t) { if (!t0) t0 = t; var k = Math.min(Math.max((t - t0 - delay) / d, 0), 1); b.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
    };
    if ('IntersectionObserver' in window) {
      var po = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { run(); po.disconnect(); } }, { threshold: 0.35 });
      po.observe(pb);
    } else run();
  }
})();
