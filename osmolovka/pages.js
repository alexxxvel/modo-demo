/* Osmolovka: оглавление политики — текущий раздел отмечен белой трубкой (АД круг 8).
   Текущий = последний заголовок, поднявшийся выше 40 % окна; считаем по прокрутке (прыжок колесом не пропускается). */
(function () {
  var links = [].slice.call(document.querySelectorAll(".toc a"));
  if (!links.length) return;
  var heads = links.map(function (a) { return document.getElementById(a.hash.slice(1)); });
  var cur = null, ticking = false;
  function update() {
    ticking = false;
    var line = innerHeight * 0.4, id = heads[0].id;
    heads.forEach(function (h) { if (h.getBoundingClientRect().top < line) id = h.id; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) id = heads[heads.length - 1].id;
    if (id === cur) return;
    cur = id;
    links.forEach(function (a) { a.toggleAttribute("aria-current", a.hash === "#" + id); });
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener("resize", update);
  update();
})();
