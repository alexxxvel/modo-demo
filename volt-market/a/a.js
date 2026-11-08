/* А: шкала «сколько проезжать» и вкладки «под задачу» */
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
      tl.innerHTML = VM.pick('task:' + t + ':4').map(VM.card).join('');
      VM.watch(tl); document.dispatchEvent(new Event('vm:sync'));
    };
    document.addEventListener('click', function (e) { var b = e.target.closest('[data-task]'); if (b) show(b.dataset.task); });
    show('city');
  }
})();
