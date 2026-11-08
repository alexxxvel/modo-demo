/* Osmolovka Car Spa — макет: запись по шагам «кузов → мойка → день → время». Занятость и цены условные, для показа. */
(function () {
  "use strict";
  // движение включается классом до первой отрисовки; без него всё видно сразу
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) document.documentElement.classList.add("mo");

  var BODIES = { sedan: "седан", cross: "кроссовер", suv: "внедорожник" };
  // [ключ, название, минуты, цены седан/кроссовер/внедорожник, частая услуга]
  var SERVICES = [
    ["express", "Экспресс-мойка кузова", 30, [25, 30, 35], true],
    ["complex", "Комплексная мойка", 75, [45, 55, 65], true],
    ["inside", "Уборка салона", 50, [35, 40, 50], true],
    ["engine", "Мойка двигателя", 40, [35, 40, 45], true],
    ["dry", "Химчистка салона", 300, [180, 220, 260], false],
    ["polish", "Полировка кузова", 480, [300, 350, 420], false]
  ];
  var PRICE_GROUPS = [
    ["Мойка", [["Экспресс-мойка кузова", [25, 30, 35]], ["Комплексная мойка", [45, 55, 65]], ["Пенная галерея", [30, 35, 40]], ["Мойка двигателя", [35, 40, 45]], ["Чернение резины", [8, 8, 10]]]],
    ["Салон", [["Уборка салона", [35, 40, 50]], ["Химчистка салона", [180, 220, 260]], ["Уход за кожей", [60, 70, 80]], ["Полировка пластика", [30, 35, 40]], ["Ароматизация", [10, 10, 10]]]],
    ["Кузов", [["Полировка кузова", [300, 350, 420]], ["Защитный воск", [40, 50, 60]]]]
  ];
  var NOTE = "Цена «от»: точную скажем, когда увидим машину. Оплата картой.<br><a class=\"link\" href=\"#zapis\">Записаться на время</a>";
  var BODY_INDEX = { sedan: 0, cross: 1, suv: 2 };
  var DAY_NAMES = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  var MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  // подсказка над шагами — как в конструкторе календари.бел: «Шаг N из 4. Что сделать»
  var HINTS = ["Выберите кузов", "Выберите мойку", "Выберите день", "Нажмите на белую лампу: это свободный час"];

  // «Сейчас» можно задать адресом ?now=21:40 — для одинаковых кадров макета
  var now = new Date();
  var q = /[?&]now=(\d{1,2}):(\d{2})/.exec(location.search);
  if (q) { now.setHours(+q[1], +q[2], 0, 0); }
  var nowHour = now.getHours();

  // ничего не выбрано заранее: человек идёт по шагам. slot — выбранное начало {d: день от сегодня, h: час}
  var state = { body: null, svc: null, day: null, slot: null, ptab: 0, pbody: "sedan" };

  // Условная занятость, одинаковая при каждом открытии. Ближайший час после «сейчас» всегда свободен.
  function busy(day, h) {
    var nextDay = nowHour === 23 ? 1 : 0, nextHour = (nowHour + 1) % 24;
    if (day === nextDay && h === nextHour) return false;
    var n = (h * 7 + day * 13 + (h * h) % 5) % 11;
    return h < 7 ? n > 8 : (h >= 17 && h <= 20 ? n > 3 : n > 6);
  }
  function hoursOf(min) { return Math.max(1, Math.ceil(min / 60)); }
  function svcByKey(k) { for (var i = 0; i < SERVICES.length; i++) if (SERVICES[i][0] === k) return SERVICES[i]; return null; }
  function abs(d, h) { return d * 24 + h; }
  function canStart(day, h, len) {
    if (abs(day, h) <= nowHour) return false;
    for (var i = 0; i < len; i++) {
      var a = abs(day, h) + i;
      if (busy(Math.floor(a / 24), a % 24)) return false;
    }
    return true;
  }
  function dateOf(day) { var d = new Date(now); d.setDate(d.getDate() + day); return d; }
  function two(n) { return (n < 10 ? "0" : "") + n; }
  function hhmm(h) { return two(h) + ":00"; }
  function endOf(h, min) { var t = h * 60 + min; return two(Math.floor(t / 60) % 24) + ":" + two(t % 60); }
  function dur(min) {
    var h = Math.floor(min / 60), m = min % 60;
    if (!h) return m + " мин";
    return h + " ч" + (m ? " " + m + " мин" : "");
  }
  function plural(n, a, b, c) { var m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c); }
  function cap(s) { return s.replace(/^./, function (c) { return c.toUpperCase(); }); }
  function shortDate(day) { var d = dateOf(day); return cap(DAY_NAMES[d.getDay()]) + ", " + d.getDate() + " " + MONTHS[d.getMonth()].slice(0, 3); }
  function dayLabel(day) {
    var d = dateOf(day);
    if (day === 0) return "сегодня";
    if (day === 1) return "завтра";
    return DAY_NAMES[d.getDay()] + ", " + d.getDate() + " " + MONTHS[d.getMonth()];
  }
  function bi() { return BODY_INDEX[state.body || "sedan"]; }
  function step() { return !state.body ? 1 : !state.svc ? 2 : state.day === null ? 3 : !state.slot ? 4 : 5; }

  /* лампы первого экрана: ближайшие 24 часа от «сейчас»; белая — свободно, красная — занято */
  function dayLamps() {
    var free = 0, next = null, nextD = 0, html = "", scale = "";
    for (var i = 0; i < 24; i++) {
      var h = (nowHour + i) % 24, d = nowHour + i > 23 ? 1 : 0;
      var isNow = i === 0, ok = !isNow && !busy(d, h);
      if (ok) { free++; if (next === null) { next = h; nextD = d; } }
      var real = !busy(d, h);   // «сейчас» показываем по настоящему состоянию, с белой чертой под ней
      var tip = '<span class="lamp__tip" aria-hidden="true">' + hhmm(h) + (isNow ? " · сейчас" : ok ? " · свободно" : " · занято") + "</span>";
      html += ok
        ? '<button type="button" class="lamp is-free" style="--i:' + i + '" data-pre-d="' + d + '" data-pre-h="' + h + '" aria-label="' + dayLabel(d) + " " + hhmm(h) + ', свободно — записаться">' + tip + "</button>"
        : '<span class="lamp' + (isNow && real ? " is-free" : " is-busy") + (isNow ? " is-now" : "") + '" style="--i:' + i + '">' + tip + "</span>";
      scale += "<i>" + (isNow ? "сейчас" : i % 4 === 0 ? hhmm(h) : "") + "</i>";
    }
    document.querySelector('[data-lamps="hero"]').innerHTML = html;
    document.querySelector("[data-day-scale]").innerHTML = scale;
    document.querySelectorAll("[data-free-count]").forEach(function (el) { el.textContent = free; });
    document.querySelectorAll("[data-free-word]").forEach(function (el) { el.textContent = plural(free, "час", "часа", "часов"); });
    document.querySelector("[data-next]").textContent = next === null ? "завтра" : hhmm(next);
    var nb = document.querySelector("[data-next-btn]");
    if (next !== null) { nb.setAttribute("data-pre-d", nextD); nb.setAttribute("data-pre-h", next); } else nb.hidden = true;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var hero = document.querySelector('[data-lamps="hero"]');
      hero.classList.add("is-starting");
      setTimeout(function () { hero.classList.remove("is-starting"); }, 2200);
    }
  }

  /* шаги: «Шаг N из 4», рамка на текущем, сделанные с галочкой, дальние в тумане */
  function renderSteps() {
    var n = step();
    var t = document.querySelector("[data-prog-t]");
    t.innerHTML = n <= 4 ? "Шаг " + n + " из 4. <b>" + HINTS[n - 1] + "</b>" : "Всё выбрано. <b>Нажмите «Записаться»</b>";
    document.querySelectorAll("[data-prog-bar] i").forEach(function (i, k) {
      i.className = k + 1 < n ? "is-done" : k + 1 === n ? "is-now" : "";
    });
    document.querySelectorAll(".pick[data-step]").forEach(function (f) {
      var k = +f.getAttribute("data-step");
      f.classList.toggle("is-done", k < n);
      f.classList.toggle("is-now", k === n);
      f.classList.toggle("is-later", k > n);
      f.querySelector("[data-n]").textContent = k < n ? "✓" : String(k);
    });
  }

  function renderBody() {
    document.querySelectorAll(".book [data-body-seg] button").forEach(function (btn) {
      btn.setAttribute("aria-checked", String(btn.getAttribute("data-body") === state.body));
    });
  }

  /* услуги: плитки, редкие — под «Ещё»; цена для выбранного кузова (до выбора — для седана) */
  function renderServices() {
    var b = bi();
    document.querySelector("[data-svc-list]").innerHTML = SERVICES.map(function (s) {
      return '<button type="button" role="radio"' + (s[4] ? "" : ' class="is-more"') + ' aria-checked="' + (s[0] === state.svc) + '" data-svc="' + s[0] + '">' +
        '<span><span class="svc__name">' + s[1] + '</span><br><span class="svc__dur">' + dur(s[2]) + "</span>" +
        '<span class="svc__tube" aria-hidden="true" style="--w:' + Math.round(Math.min(1, s[2] / 90) * 100) + '%"></span></span>' +
        '<span class="svc__price"><small>от</small>' + s[3][b] + "</span></button>";
    }).join("");
  }

  function renderDays() {
    var html = "", s = svcByKey(state.svc), len = hoursOf(s ? s[2] : 60);
    for (var d = 0; d < 7; d++) {
      var dt = dateOf(d), ticks = "", free = 0;
      for (var h = 0; h < 24; h++) {
        var past = abs(d, h) <= nowHour, ok = !past && canStart(d, h, len);
        if (ok) free++;
        ticks += '<i class="' + (past ? "p" : ok ? "f" : "b") + '"></i>';
      }
      var top = d === 0 ? "Сегодня" : d === 1 ? "Завтра" : cap(DAY_NAMES[dt.getDay()]);
      var on = state.slot ? state.slot.d === d : d === state.day;
      var freeTxt = free ? free + " " + plural(free, "час", "часа", "часов") : "мест нет";
      html += '<button type="button" role="radio" aria-checked="' + on + '" data-day="' + d + '" aria-label="' + top + ", " + dt.getDate() + " " + MONTHS[dt.getMonth()] + ", свободно " + freeTxt + '"' + (free ? "" : ' class="is-full"') + ">" +
        "<b>" + top + "</b><span>" + dt.getDate() + " " + MONTHS[dt.getMonth()].slice(0, 3) + "</span>" +
        '<span class="days__strip" aria-hidden="true">' + ticks + '</span><span class="days__n" aria-hidden="true">' + freeTxt + "</span></button>";
    }
    document.querySelector("[data-days]").innerHTML = html;
  }

  // «Сегодня» — 24 часа со следующего часа, через полночь; другие дни — с 00:00
  function laneHours() {
    var day = state.day === null ? 0 : state.day, out = [], start = day === 0 ? nowHour + 1 : 0;
    for (var i = 0; i < 24; i++) { var a = abs(day, start) + i; out.push({ d: Math.floor(a / 24), h: a % 24, i: i }); }
    return out;
  }

  /* часы: лампа + подпись у каждого часа, вся ячейка нажимается */
  function renderHours(keepScroll) {
    var s = svcByKey(state.svc), min = s ? s[2] : 60, len = hoursOf(min);
    var box = document.querySelector("[data-hours]"), html = "", first = null, count = 0;
    var lost = null;
    if (state.slot && !canStart(state.slot.d, state.slot.h, len)) { lost = state.slot; state.slot = null; }
    var pickA = state.slot ? abs(state.slot.d, state.slot.h) : -1;
    laneHours().forEach(function (x) {
      var a = abs(x.d, x.h), ok = canStart(x.d, x.h, len), midnight = x.h === 0 && x.i > 0;
      if (ok) { count++; if (first === null) first = x; }
      var cls = "hr" + (ok ? " is-free" : " is-busy") + (midnight ? " is-midnight" : "") +
        (pickA >= 0 && a > pickA && a < pickA + len ? " is-span" : "") + (a === pickA ? " is-pick" : "");
      var day = x.i === 0 ? cap(dayLabel(x.d)) : midnight ? shortDate(x.d) : "";
      html += '<button type="button" role="radio" class="' + cls + '" data-d="' + x.d + '" data-hour="' + x.h + '"' + (ok ? "" : " disabled") +
        ' aria-checked="' + (a === pickA) + '" aria-label="' + dayLabel(x.d) + " " + hhmm(x.h) + (ok ? ", свободно" : ", занято") + '">' +
        (day ? '<span class="hr__day" aria-hidden="true">' + day + "</span>" : "") +
        '<span class="hr__tube"></span><span class="hr__n">' + two(x.h) + "</span></button>";
    });
    var left = box.scrollLeft;
    box.innerHTML = html;
    if (box.scrollWidth > box.clientWidth + 4) {
      if (keepScroll) box.scrollLeft = left;
      else {
        var t = state.slot || first;
        var el = t && box.querySelector('[data-d="' + t.d + '"][data-hour="' + t.h + '"]');
        box.scrollLeft = el ? Math.max(0, el.offsetLeft - 16 - 50) : 0;
      }
    }
    document.querySelector("[data-slot-note]").textContent = lost && s
      ? s[1] + " длится " + dur(s[2]) + ", с " + hhmm(lost.h) + " не помещается. Выберите другую белую лампу."
      : first === null
      ? "В эти сутки свободного времени нет. Выберите другой день."
      : state.slot ? "Бокс ваш " + dayLabel(state.slot.d) + " с " + hhmm(state.slot.h) + " до " + endOf(state.slot.h, min) + "."
      : "Нажмите на белую лампу: свободно " + count + " " + plural(count, "час", "часа", "часов") + (s ? ", где помещается " + s[1].toLowerCase() : "") + ".";
  }

  function setRow(key, text, empty) {
    var el = document.querySelector('[data-r="' + key + '"]');
    el.textContent = text; el.classList.toggle("is-empty", !!empty);
  }
  function renderSum() {
    var s = svcByKey(state.svc), done = step() === 5;
    setRow("body", state.body ? cap(BODIES[state.body]) : "не выбран", !state.body);
    setRow("svc", s ? s[1] : "не выбрана", !s);
    setRow("day", state.day !== null ? cap(dayLabel(state.slot ? state.slot.d : state.day)) : "не выбран", state.day === null);
    setRow("time", state.slot ? "с " + hhmm(state.slot.h) + " до " + endOf(state.slot.h, s ? s[2] : 60) : "не выбрано", !state.slot);
    var line = [];
    if (state.body) line.push(cap(BODIES[state.body]));
    if (s) line.push(line.length ? s[1].toLowerCase() : s[1]);
    if (state.slot) line.push(dayLabel(state.slot.d) + " с " + hhmm(state.slot.h) + " до " + endOf(state.slot.h, s ? s[2] : 60));
    document.querySelector("[data-card-line]").textContent = line.length ? line.join(", ") : "Пройдите шаги 1–4";
    var lane = document.querySelector("[data-card-lane]");
    lane.hidden = !state.slot;
    if (state.slot) {
      var lenS = hoursOf(s ? s[2] : 60), pick = abs(state.slot.d, state.slot.h), lh = "";
      laneHours().forEach(function (x) {
        var a = abs(x.d, x.h);
        lh += '<i class="' + (a >= pick && a < pick + lenS ? "on" : canStart(x.d, x.h, 1) ? "f" : "b") + '"></i>';
      });
      lane.innerHTML = lh;
    }
    var price = document.querySelector(".sum__price");
    price.hidden = !(s && state.body);
    if (s && state.body) {
      var num = document.querySelector("[data-sum-price]"), v = String(s[3][bi()]);
      if (num.textContent !== v || price.dataset.shown !== "1") { num.textContent = v; num.classList.remove("is-roll"); void num.offsetWidth; num.classList.add("is-roll"); }
    }
    price.dataset.shown = s && state.body ? "1" : "0";
    document.querySelector("[data-go]").disabled = !done;
  }

  /* Показать элемент целиком минимальным сдвигом (находка разработчика 08.11: «экран очень сильно прыгает»):
     низ — над краем окна, верх — не под шапкой; дальше конца раздела записи не крутим, чтобы фото следующего раздела не заглядывало. */
  function reveal(el) {
    if (!el) return;
    var r = el.getBoundingClientRect(), top = document.querySelector(".bar").getBoundingClientRect().bottom + 16, bottom = innerHeight - 24, d = 0;
    if (r.bottom > bottom) d = r.bottom - bottom;
    if (r.top - d < top) d = r.top - top;
    if (d > 0) d = Math.min(d, Math.max(0, document.querySelector("#zapis").getBoundingClientRect().bottom - innerHeight));
    if (Math.abs(d) < 6) return;
    scrollBy({ top: d, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  function bringNext() {
    reveal(document.querySelector(".pick.is-now") || (step() === 5 && innerWidth <= 760 ? document.querySelector("[data-sum]") : null));
  }

  /* цены: на компьютере три колонки, на телефоне вкладки «Мойка / Салон / Кузов» */
  function renderPrices() {
    var b = BODY_INDEX[state.pbody], k = 0;
    document.querySelector("[data-price-tabs]").innerHTML = PRICE_GROUPS.map(function (g, i) {
      return '<button type="button" role="tab" aria-selected="' + (i === state.ptab) + '" aria-checked="' + (i === state.ptab) + '" data-ptab="' + i + '">' + g[0] + "</button>";
    }).join("");
    document.querySelector("[data-price]").innerHTML = PRICE_GROUPS.map(function (g, i) {
      return '<div class="pg' + (i === state.ptab ? " is-on" : "") + '"><p class="pg__h">' + g[0] + "</p>" + g[1].map(function (r) {
        var sv = SERVICES.filter(function (x) { return x[1] === r[0]; })[0];
        return '<a class="pg__row" href="#zapis" data-pick="' + (sv ? sv[0] : "") + '" style="--k:' + (k++) + '"><span class="pg__n">' + r[0] + '</span><span class="pg__p is-flash"><small>от</small>' + r[1][b] + '<span class="pg__c">BYN</span></span></a>';
      }).join("") + (i === PRICE_GROUPS.length - 1 ? '<p class="pg__note pg__note--desk">' + NOTE + "</p>" : "") + "</div>";
    }).join("") + '<p class="pg__note pg__note--phone">' + NOTE + "</p>";
    document.querySelectorAll(".price [data-body-seg] button").forEach(function (btn) {
      btn.setAttribute("aria-checked", String(btn.getAttribute("data-body") === state.pbody));
    });
  }

  function hideFlow() {
    document.querySelector("[data-confirm]").hidden = true;
    document.querySelector("[data-done]").hidden = true;
    document.querySelector("[data-sum]").classList.remove("is-done", "is-form");
  }
  function renderBooking(keepScroll) { renderSteps(); renderBody(); renderServices(); renderDays(); renderHours(keepScroll); renderSum(); }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-body],[data-svc],[data-svc-more],[data-day],[data-hour],[data-ptab],[data-go],[data-tg],[data-pick],[data-pre-h]");
    if (!t) return;
    if (t.hasAttribute("data-pre-h")) {
      var pd = +t.getAttribute("data-pre-d"), ph = +t.getAttribute("data-pre-h");
      state.day = pd; state.slot = { d: pd, h: ph };
      hideFlow(); renderBooking();
      var reduceP = matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.querySelector("#zapis").scrollIntoView({ behavior: reduceP ? "auto" : "smooth" });
      return;
    }
    if (t.hasAttribute("data-body")) {
      if (t.closest(".price")) { state.pbody = t.getAttribute("data-body"); renderPrices(); return; }
      state.body = t.getAttribute("data-body"); state.pbody = state.body; hideFlow(); renderBooking(); renderPrices(); bringNext(); return;
    }
    if (t.hasAttribute("data-svc")) { state.svc = t.getAttribute("data-svc"); hideFlow(); renderBooking(); bringNext(); return; }
    if (t.hasAttribute("data-svc-more")) { document.querySelector("[data-svc-list]").classList.add("is-open"); t.setAttribute("aria-expanded", "true"); return; }
    if (t.hasAttribute("data-day")) { state.day = +t.getAttribute("data-day"); state.slot = null; hideFlow(); renderBooking(); bringNext(); return; }
    if (t.hasAttribute("data-hour")) {
      state.slot = { d: +t.getAttribute("data-d"), h: +t.getAttribute("data-hour") };
      if (state.day === null) state.day = 0;
      hideFlow(); renderBooking(true); bringNext(); return;
    }
    // строка цены ведёт в запись: кузов из вкладки цен, услуга — если её можно записать онлайн
    if (t.hasAttribute("data-pick")) {
      state.body = state.pbody;
      var key = t.getAttribute("data-pick");
      if (key) { state.svc = key; var sv = svcByKey(key); if (!sv[4]) document.querySelector("[data-svc-list]").classList.add("is-open"); }
      hideFlow(); renderBooking(); return;
    }
    if (t.hasAttribute("data-ptab")) { state.ptab = +t.getAttribute("data-ptab"); renderPrices(); return; }
    if (t.hasAttribute("data-go")) {
      var f = document.querySelector("[data-confirm]");
      f.hidden = false;
      document.querySelector("[data-sum]").classList.add("is-form");   // на время формы «Записаться» уходит: одна главная кнопка
      f.querySelector("input").focus({ preventScroll: true });
      reveal(f);
      return;
    }
    if (t.hasAttribute("data-tg")) { e.preventDefault(); }
  });

  /* форма: телефон оформляется сам (+375 29 123-45-67, можно начать с 8029 или 29), трубка под полем горит белым, когда верно, и красным с подсказкой, когда нет */
  function phoneDigits(v) {
    var d = v.replace(/\D/g, "");
    if (!d) return "";
    if (d.indexOf("80") === 0) d = "375" + d.slice(2);
    else if (d.indexOf("375") !== 0) d = "375" + d;
    return d.slice(0, 12);
  }
  function phoneText(d) {
    if (!d) return "";
    var r = "+" + d.slice(0, 3);
    if (d.length > 3) r += " " + d.slice(3, 5);
    if (d.length > 5) r += " " + d.slice(5, 8);
    if (d.length > 8) r += "-" + d.slice(8, 10);
    if (d.length > 10) r += "-" + d.slice(10, 12);
    return r;
  }
  var form = document.querySelector("[data-confirm]");
  function lineState(name, bad) {
    var line = form.querySelector('[data-line="' + name + '"]'), v = form[name].value.trim();
    var ok = name === "name" ? v.length >= 2 : phoneDigits(v).length === 12;
    line.classList.toggle("is-ok", ok);
    line.classList.toggle("is-bad", !!bad && !ok);
    return ok;
  }
  form.name.addEventListener("input", function () { lineState("name"); });
  form.phone.addEventListener("input", function (e) {
    if (!(e.inputType || "").startsWith("delete")) form.phone.value = phoneText(phoneDigits(form.phone.value));
    lineState("phone");
  });
  form.phone.addEventListener("blur", function () { if (form.phone.value) form.phone.value = phoneText(phoneDigits(form.phone.value)); });
  form.name.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); form.phone.focus(); } });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.currentTarget, okN = lineState("name", true), okP = lineState("phone", true), err = f.querySelector("[data-err]");
    err.hidden = okN && okP;
    err.textContent = !okN ? "Как к вам обращаться? Имя нужно, чтобы администратор узнал вас." : "Проверьте телефон: нужно 9 цифр после +375, по нему подтвердим запись.";
    if (!okN) { f.name.focus(); return; }
    if (!okP) { f.phone.focus(); return; }
    f.hidden = true;
    var s = svcByKey(state.svc);
    document.querySelector("[data-done-time]").textContent = cap(dayLabel(state.slot.d)) + ", " + hhmm(state.slot.h) + "–" + endOf(state.slot.h, s[2]);
    document.querySelector("[data-done-when]").textContent = s[1] + ", " + BODIES[state.body] + ". Ул. Чичерина, 21, въезд со двора.";
    document.querySelector("[data-done]").hidden = false;
    document.querySelector("[data-sum]").classList.add("is-done");   // записано: в карточке итог, без кнопки и условий
    document.querySelector("[data-sum]").classList.remove("is-form");
  });

  /* шапка: сплошная после первого экрана; «Выбрать время» прячется, пока на экране сама запись */
  var bar = document.querySelector("[data-bar]");
  new IntersectionObserver(function (en) { bar.classList.toggle("is-solid", !en[0].isIntersecting); }, { rootMargin: "-80px 0px 0px 0px" })
    .observe(document.querySelector(".hero__acts"));
  new IntersectionObserver(function (en) { bar.classList.toggle("is-booking", en[0].isIntersecting); }, { rootMargin: "-80px 0px -20% 0px" })
    .observe(document.querySelector("#zapis"));

  /* появления: заголовки словами из маски, фото шторкой; на компьютере играют и вниз, и вверх, на телефоне один раз */
  document.querySelectorAll("[data-words]").forEach(function (h) {
    var k = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/( )/).forEach(function (part) {
            if (part === " ") { frag.appendChild(document.createTextNode(" ")); return; }
            if (!part) return;
            var w = document.createElement("span"), inner = document.createElement("span");
            w.className = "w"; inner.textContent = part; inner.style.setProperty("--k", k++);
            w.appendChild(inner); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(h);
  });
  var both = matchMedia("(min-width: 761px) and (hover: hover)").matches;
  // фото со шторкой наблюдаем через обёртку: у закрытой шторки clip-path inset(100% 0 0 0) браузер видит только нижнюю кромку,
  // и раскрытие начиналось, когда кадр уже почти весь на экране (видео 01.11)
  var targets = [].slice.call(document.querySelectorAll("[data-words], .price, .box__stage, .find__row, .book__intro"));
  document.querySelectorAll("[data-clip]").forEach(function (el) { el.parentElement.__clip = el; if (targets.indexOf(el.parentElement) < 0) targets.push(el.parentElement); });
  function mark(el, on) { el.classList.toggle("is-in", on); if (el.__clip) el.__clip.classList.toggle("is-in", on); }
  var io = new IntersectionObserver(function (en) {
    en.forEach(function (x) {
      if (x.isIntersecting) { mark(x.target, true); if (!both) io.unobserve(x.target); }
      else if (both) mark(x.target, false);
    });
  }, { rootMargin: "0px 0px -12% 0px" });
  targets.forEach(function (el) { io.observe(el); });

  /* блик по заголовку: свет лампы проходит по буквам один раз, когда строки встали */
  if (document.documentElement.classList.contains("mo")) {
    var title = document.querySelector(".hero__title");
    setTimeout(function () { title.classList.add("is-sheen"); }, 1400);
    setTimeout(function () { title.classList.remove("is-sheen"); }, 3300);
  }
  dayLamps();
  renderBooking(); renderPrices();
})();
