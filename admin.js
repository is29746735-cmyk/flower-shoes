/* ============================================================
   꽃신 관리자 페이지
   - data.js 를 읽어 폼으로 편집
   - "data.js 다운로드" 버튼으로 새 파일 생성/다운로드
   ============================================================ */
(function () {
  "use strict";

  /* ----- 비밀번호 (필요하면 여기를 바꾸세요) ----- */
  var ADMIN_PASSWORD = "kkotshin";

  /* ===== 비밀번호 게이트 ===== */
  var gate = document.getElementById("gate");
  var admin = document.getElementById("admin");
  var SESSION_KEY = "kkotshin-admin-session";

  function unlock() {
    gate.style.display = "none";
    admin.hidden = false;
    init();
  }

  if (sessionStorage.getItem(SESSION_KEY) === "1") {
    unlock();
  } else {
    document.getElementById("gateForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var pw = document.getElementById("gatePw").value;
      if (pw === ADMIN_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, "1");
        unlock();
      } else {
        toast("비밀번호가 올바르지 않습니다.");
      }
    });
  }

  /* ===== 토스트 ===== */
  var toastEl = document.getElementById("toast");
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2400);
  }

  /* ===== 데이터 ===== */
  var state;
  function init() {
    // window.siteData 가 없으면 빈 구조 생성
    state = JSON.parse(JSON.stringify(window.siteData || {
      notices: [], signatures: [], gallery: [],
      menu: { note: "", sections: [] }
    }));
    if (!state.notices)    state.notices = [];
    if (!state.signatures) state.signatures = [];
    if (!state.gallery)    state.gallery = [];
    if (!state.menu)       state.menu = { note: "", sections: [] };
    if (!state.menu.sections) state.menu.sections = [];

    document.getElementById("menuNoteInput").value = state.menu.note || "";
    document.getElementById("menuNoteInput").addEventListener("input", function (e) {
      state.menu.note = e.target.value;
    });

    renderNotices();
    renderSignatures();
    renderGallery();
    renderMenu();

    document.addEventListener("click", function (e) {
      var add = e.target.getAttribute && e.target.getAttribute("data-add");
      if (add === "notices")      { state.notices.push({ date: today(), tag: "공지", title: "", body: "" }); renderNotices(); }
      if (add === "signatures")   { state.signatures.push({ name: "", tag: "", desc: "", hot: "", ice: "", image: "", accent: "amber" }); renderSignatures(); }
      if (add === "gallery")      { state.gallery.push({ src: "", category: "내부", alt: "" }); renderGallery(); }
      if (add === "menuSection")  { state.menu.sections.push({ name: "새 카테고리", en: "", highlight: false, items: [] }); renderMenu(); }
    });

    document.getElementById("exportBtn").addEventListener("click", exportData);
    document.getElementById("exportBtn2").addEventListener("click", exportData);
  }

  function today() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "." + m + "." + day;
  }

  /* ===== 렌더 헬퍼 ===== */
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k.indexOf("on") === 0) n[k] = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }

  function input(value, onInput, attrs) {
    var i = el("input", Object.assign({ type: "text", value: value == null ? "" : value }, attrs || {}));
    i.addEventListener("input", function (e) { onInput(e.target.value); });
    return i;
  }
  function textarea(value, onInput) {
    var t = el("textarea", {});
    t.value = value == null ? "" : value;
    t.addEventListener("input", function (e) { onInput(e.target.value); });
    return t;
  }
  function select(options, value, onInput) {
    var s = el("select", {});
    options.forEach(function (opt) {
      var o = el("option", { value: opt }, [opt]);
      if (opt === value) o.selected = true;
      s.appendChild(o);
    });
    s.addEventListener("change", function (e) { onInput(e.target.value); });
    return s;
  }
  function delBtn(onClick) {
    return el("button", { class: "btn-del", type: "button", onclick: onClick }, ["삭제"]);
  }
  function label(text, control) {
    var lbl = el("label", {}, [text, control]);
    return lbl;
  }

  /* ===== 공지 렌더 ===== */
  function renderNotices() {
    var box = document.getElementById("noticesItems");
    box.innerHTML = "";
    if (!state.notices.length) {
      box.appendChild(el("p", { class: "card-note" }, ["등록된 공지가 없습니다. ‘+ 새 공지 추가’ 를 눌러 추가하세요."]));
      return;
    }
    state.notices.forEach(function (n, i) {
      var item = el("div", { class: "item" });
      var head = el("div", { class: "item-head" }, [
        el("span", { class: "item-title" }, ["공지 " + (i + 1)]),
        delBtn(function () { state.notices.splice(i, 1); renderNotices(); })
      ]);
      var titleLabel = label("제목", input(n.title, function (v) { n.title = v; }));
      titleLabel.classList.add("full");
      var bodyLabel  = label("본문", textarea(n.body, function (v) { n.body = v; }));
      bodyLabel.classList.add("full");
      var fields = el("div", { class: "fields" }, [
        label("게시일 (예: 2026.05.20)", input(n.date, function (v) { n.date = v; })),
        label("종류", select(["공지", "이벤트"], n.tag || "공지", function (v) { n.tag = v; })),
        titleLabel,
        bodyLabel
      ]);
      item.appendChild(head);
      item.appendChild(fields);
      box.appendChild(item);
    });
  }

  /* ===== 시그니처 렌더 ===== */
  function renderSignatures() {
    var box = document.getElementById("signaturesItems");
    box.innerHTML = "";
    if (!state.signatures.length) {
      box.appendChild(el("p", { class: "card-note" }, ["등록된 시그니처가 없습니다."]));
      return;
    }
    state.signatures.forEach(function (s, i) {
      var item = el("div", { class: "item" });
      var head = el("div", { class: "item-head" }, [
        el("span", { class: "item-title" }, ["시그니처 " + (i + 1) + (s.name ? " · " + s.name : "")]),
        delBtn(function () { state.signatures.splice(i, 1); renderSignatures(); })
      ]);
      var fields = el("div", { class: "fields" }, [
        label("메뉴 이름", input(s.name, function (v) { s.name = v; renderSignatures(); })),
        label("부제 / 태그", input(s.tag, function (v) { s.tag = v; })),
        label("HOT 가격 (예: 5,000 / 비우면 미표시)", input(s.hot, function (v) { s.hot = v; })),
        label("ICE 가격 (예: 6,000 / 비우면 미표시)", input(s.ice, function (v) { s.ice = v; })),
        label("사진 경로 (비워두면 색상 자리표시)", input(s.image, function (v) { s.image = v; })),
        label("자리표시 색", select(["amber", "leaf", "wood"], s.accent || "amber", function (v) { s.accent = v; }))
      ]);
      var descLabel = label("설명", textarea(s.desc, function (v) { s.desc = v; }));
      descLabel.classList.add("full");
      fields.appendChild(descLabel);
      item.appendChild(head);
      item.appendChild(fields);
      box.appendChild(item);
    });
  }

  /* ===== 갤러리 렌더 ===== */
  function renderGallery() {
    var box = document.getElementById("galleryItems");
    box.innerHTML = "";
    if (!state.gallery.length) {
      box.appendChild(el("p", { class: "card-note" }, ["등록된 사진이 없습니다."]));
      return;
    }
    state.gallery.forEach(function (g, i) {
      var item = el("div", { class: "item" });
      var head = el("div", { class: "item-head" }, [
        el("span", { class: "item-title" }, ["사진 " + (i + 1)]),
        delBtn(function () { state.gallery.splice(i, 1); renderGallery(); })
      ]);
      var fields = el("div", { class: "fields" }, [
        label("사진 경로 (예: images/interior-01.jpg)", input(g.src, function (v) { g.src = v; })),
        label("카테고리 (내부 / 외부 / 메뉴 / 마을 등)", input(g.category, function (v) { g.category = v; })),
      ]);
      var altLabel = label("사진 설명 (시각장애인 안내용)", input(g.alt, function (v) { g.alt = v; }));
      altLabel.classList.add("full");
      fields.appendChild(altLabel);
      item.appendChild(head);
      item.appendChild(fields);
      box.appendChild(item);
    });
  }

  /* ===== 메뉴 렌더 ===== */
  function renderMenu() {
    var box = document.getElementById("menuSectionsItems");
    box.innerHTML = "";
    if (!state.menu.sections.length) {
      box.appendChild(el("p", { class: "card-note" }, ["등록된 메뉴 카테고리가 없습니다."]));
      return;
    }
    state.menu.sections.forEach(function (sec, si) {
      var section = el("div", { class: "menu-section" });
      var hdr = el("div", { class: "menu-section-head" }, [
        input(sec.name, function (v) { sec.name = v; }, { placeholder: "한글 이름" }).tap(function (x) { x.className = "sec-name"; }),
        input(sec.en, function (v) { sec.en = v; }, { placeholder: "English name" }).tap(function (x) { x.className = "sec-en"; }),
        (function () {
          var lbl = el("label", { class: "chk" });
          var chk = el("input", { type: "checkbox" });
          chk.checked = !!sec.highlight;
          chk.addEventListener("change", function (e) { sec.highlight = e.target.checked; });
          lbl.appendChild(chk);
          lbl.appendChild(document.createTextNode(" 강조 카드로"));
          return lbl;
        })(),
        delBtn(function () { state.menu.sections.splice(si, 1); renderMenu(); })
      ]);
      section.appendChild(hdr);

      var itemsBox = el("div", { class: "menu-items" });

      // 컬럼 헤더
      itemsBox.appendChild(el("div", { class: "menu-items-head" }, [
        el("span", {}, ["메뉴명"]),
        el("span", {}, ["HOT"]),
        el("span", {}, ["ICE"]),
        el("span", {}, ["단일 가격"]),
        el("span", {}, [""])
      ]));

      sec.items.forEach(function (it, ii) {
        var row = el("div", { class: "menu-item-row" }, [
          input(it.name, function (v) { it.name = v; }, { placeholder: "메뉴 이름" }),
          input(it.hot, function (v) { it.hot = v; }, { placeholder: "예: 5,000" }),
          input(it.ice, function (v) { it.ice = v; }, { placeholder: "예: 6,000" }),
          input(it.price, function (v) { it.price = v; }, { placeholder: "단일 가격" }),
          delBtn(function () { sec.items.splice(ii, 1); renderMenu(); })
        ]);
        itemsBox.appendChild(row);
      });

      var addBtn = el("button", {
        class: "menu-item-add", type: "button",
        onclick: function () { sec.items.push({ name: "" }); renderMenu(); }
      }, ["+ 메뉴 추가"]);
      itemsBox.appendChild(addBtn);
      section.appendChild(itemsBox);

      box.appendChild(section);
    });
  }

  // 작은 헬퍼: 노드 생성 후 콜백
  HTMLElement.prototype.tap = function (fn) { fn(this); return this; };

  /* ===== data.js 생성 / 다운로드 ===== */
  function exportData() {
    var js = buildDataJs(state);
    var blob = new Blob([js], { type: "text/javascript;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "data.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("data.js 파일이 다운로드되었습니다.");
  }

  // 깔끔한 JS 텍스트로 직렬화 (사람이 봐도 읽기 좋게)
  function buildDataJs(d) {
    function js(v, indent) {
      indent = indent || 0;
      var pad = "  ".repeat(indent);
      var pad2 = "  ".repeat(indent + 1);
      if (v == null) return "null";
      if (typeof v === "string") return JSON.stringify(v);
      if (typeof v === "number" || typeof v === "boolean") return String(v);
      if (Array.isArray(v)) {
        if (!v.length) return "[]";
        return "[\n" + v.map(function (x) { return pad2 + js(x, indent + 1); }).join(",\n") + "\n" + pad + "]";
      }
      if (typeof v === "object") {
        var keys = Object.keys(v);
        if (!keys.length) return "{}";
        return "{\n" + keys.map(function (k) {
          return pad2 + k + ": " + js(v[k], indent + 1);
        }).join(",\n") + "\n" + pad + "}";
      }
      return "null";
    }
    var header = "/* 꽃신 카페 - 콘텐츠 데이터 (관리자 페이지에서 생성됨)\n" +
                 "   생성 시각: " + new Date().toLocaleString("ko-KR") + "\n" +
                 "   * 이 파일을 카페 홈페이지 폴더의 data.js 와 같은 이름으로 저장하면 반영됩니다.\n" +
                 "*/\n";
    return header + "window.siteData = " + js(d, 0) + ";\n";
  }
})();
