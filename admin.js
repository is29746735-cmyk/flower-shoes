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
  var initialJSON;                    // 원본 비교용
  var DRAFT_KEY = "kkotshin-admin-draft";

  function saveDraft() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); } catch (e) {}
    updateDirtyBadge();
  }
  function loadDraft() {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) { return null; }
  }
  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
  }
  function updateDirtyBadge() {
    var badge = document.getElementById("dirtyBadge");
    if (!badge) return;
    var changed = JSON.stringify(state) !== initialJSON;
    badge.hidden = !changed;
  }

  function rerenderAll() {
    renderNotices();
    renderSignatures();
    renderGallery();
    renderMenu();
    saveDraft();
  }

  // 배열 항목 이동 (위/아래)
  function moveItem(arr, from, to) {
    if (to < 0 || to >= arr.length) return;
    var item = arr.splice(from, 1)[0];
    arr.splice(to, 0, item);
  }

  function init() {
    var original = JSON.parse(JSON.stringify(window.siteData || {
      notices: [], signatures: [], gallery: [],
      menu: { note: "", sections: [] }
    }));
    initialJSON = JSON.stringify(original);

    // 저장된 드래프트 있으면 복원 여부 물어보기
    var draft = loadDraft();
    if (draft && JSON.stringify(draft) !== initialJSON) {
      if (confirm("이전에 작업하다 저장 안 한 변경사항이 있습니다. 이어서 편집하시겠습니까?\n\n[확인] 이어서 편집  /  [취소] 원본부터 시작")) {
        state = draft;
      } else {
        state = original;
        clearDraft();
      }
    } else {
      state = original;
    }

    if (!state.notices)    state.notices = [];
    if (!state.signatures) state.signatures = [];
    if (!state.gallery)    state.gallery = [];
    if (!state.menu)       state.menu = { note: "", sections: [] };
    if (!state.menu.sections) state.menu.sections = [];

    document.getElementById("menuNoteInput").value = state.menu.note || "";
    document.getElementById("menuNoteInput").addEventListener("input", function (e) {
      state.menu.note = e.target.value;
      saveDraft();
    });

    renderNotices();
    renderSignatures();
    renderGallery();
    renderMenu();

    document.addEventListener("click", function (e) {
      var add = e.target.getAttribute && e.target.getAttribute("data-add");
      if (add === "notices")      { state.notices.push({ date: today(), tag: "공지", title: "", body: "" }); rerenderAll(); }
      if (add === "signatures")   { state.signatures.push({ name: "", tag: "", desc: "", hot: "", ice: "", image: "", accent: "amber" }); rerenderAll(); }
      if (add === "gallery")      { state.gallery.push({ src: "", category: "내부", alt: "" }); rerenderAll(); }
      if (add === "menuSection")  { state.menu.sections.push({ name: "새 카테고리", en: "", highlight: false, items: [] }); rerenderAll(); }
    });

    document.getElementById("exportBtn").addEventListener("click", exportData);
    document.getElementById("exportBtn2").addEventListener("click", exportData);

    var resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (confirm("모든 변경사항을 버리고 현재 사이트의 원본으로 되돌립니다. 계속하시겠습니까?")) {
          state = JSON.parse(initialJSON);
          clearDraft();
          document.getElementById("menuNoteInput").value = state.menu.note || "";
          rerenderAll();
          toast("원본으로 복원되었습니다.");
        }
      });
    }

    updateDirtyBadge();
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
    i.addEventListener("input", function (e) { onInput(e.target.value); saveDraft(); });
    return i;
  }
  function textarea(value, onInput) {
    var t = el("textarea", {});
    t.value = value == null ? "" : value;
    t.addEventListener("input", function (e) { onInput(e.target.value); saveDraft(); });
    return t;
  }
  function select(options, value, onInput) {
    var s = el("select", {});
    options.forEach(function (opt) {
      var o = el("option", { value: opt }, [opt]);
      if (opt === value) o.selected = true;
      s.appendChild(o);
    });
    s.addEventListener("change", function (e) { onInput(e.target.value); saveDraft(); });
    return s;
  }
  function delBtn(onClick) {
    return el("button", { class: "btn-del", type: "button", onclick: onClick, title: "삭제" }, ["삭제"]);
  }
  function label(text, control) {
    var lbl = el("label", {}, [text, control]);
    return lbl;
  }

  // 위/아래 화살표 + 삭제 묶음 (순서 변경)
  function orderControls(arr, idx, rerender, opts) {
    opts = opts || {};
    var box = el("div", { class: "order-controls" });
    var upBtn = el("button", {
      class: "btn-order", type: "button", title: "위로", "aria-label": "위로",
      onclick: function () { moveItem(arr, idx, idx - 1); rerender(); }
    }, ["↑"]);
    var downBtn = el("button", {
      class: "btn-order", type: "button", title: "아래로", "aria-label": "아래로",
      onclick: function () { moveItem(arr, idx, idx + 1); rerender(); }
    }, ["↓"]);
    if (idx === 0) upBtn.disabled = true;
    if (idx === arr.length - 1) downBtn.disabled = true;
    box.appendChild(upBtn);
    box.appendChild(downBtn);
    if (!opts.noDelete) {
      box.appendChild(delBtn(function () {
        if (opts.confirmDelete && !confirm("정말 삭제하시겠습니까?")) return;
        arr.splice(idx, 1); rerender();
      }));
    }
    return box;
  }

  // 이미지 미리보기 (src 입력 시 자동 표시)
  function imageField(currentSrc, onChange, hint) {
    var wrap = el("div", { class: "image-field" });
    var preview = el("div", { class: "image-preview" });
    function updatePreview(src) {
      preview.innerHTML = "";
      if (!src) {
        preview.appendChild(el("span", { class: "image-empty" }, ["사진 없음"]));
        return;
      }
      var img = el("img", { src: src, alt: "미리보기" });
      img.onerror = function () {
        preview.innerHTML = '<span class="image-empty image-error">⚠ 파일을 찾을 수 없습니다<br><small>경로를 다시 확인해 주세요</small></span>';
      };
      preview.appendChild(img);
    }
    var inp = input(currentSrc, function (v) { onChange(v); updatePreview(v); }, {
      placeholder: hint || "예: images/photo.webp"
    });
    updatePreview(currentSrc);
    wrap.appendChild(preview);
    wrap.appendChild(inp);
    return wrap;
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
        el("span", { class: "item-title" }, ["공지 " + (i + 1) + (n.title ? " · " + n.title : "")]),
        orderControls(state.notices, i, function () { renderNotices(); saveDraft(); })
      ]);
      var titleLabel = label("제목", input(n.title, function (v) { n.title = v; }));
      titleLabel.classList.add("full");
      var bodyLabel  = label("본문", textarea(n.body, function (v) { n.body = v; }));
      bodyLabel.classList.add("full");

      // 날짜를 ISO 형식(YYYY-MM-DD)으로 picker 사용, 표기는 그대로 점(.) 포맷
      var isoDate = (n.date || "").replace(/\./g, "-");
      var dateInput = el("input", { type: "date", value: isoDate });
      dateInput.addEventListener("input", function (e) {
        n.date = e.target.value.replace(/-/g, ".");
        saveDraft();
      });
      var dateLabel = label("게시일", dateInput);

      var fields = el("div", { class: "fields" }, [
        dateLabel,
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
        orderControls(state.signatures, i, function () { renderSignatures(); saveDraft(); })
      ]);
      var imageLabel = label("사진 (경로 입력 시 미리보기 표시)",
        imageField(s.image, function (v) { s.image = v; saveDraft(); }, "예: images/daechu.webp"));
      imageLabel.classList.add("full");
      var fields = el("div", { class: "fields" }, [
        label("메뉴 이름", input(s.name, function (v) { s.name = v; renderSignatures(); })),
        label("부제 / 태그", input(s.tag, function (v) { s.tag = v; })),
        label("HOT 가격 (비우면 미표시)", input(s.hot, function (v) { s.hot = v; }, { placeholder: "예: 5,000" })),
        label("ICE 가격 (비우면 미표시)", input(s.ice, function (v) { s.ice = v; }, { placeholder: "예: 6,000" })),
        label("자리표시 색 (사진 없을 때만 사용)", select(["amber", "leaf", "wood"], s.accent || "amber", function (v) { s.accent = v; })),
        imageLabel
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
        el("span", { class: "item-title" }, ["사진 " + (i + 1) + (g.category ? " · " + g.category : "")]),
        orderControls(state.gallery, i, function () { renderGallery(); saveDraft(); })
      ]);
      var imageLabel = label("사진 (경로 입력 시 미리보기 표시)",
        imageField(g.src, function (v) { g.src = v; saveDraft(); }, "예: images/interior-01.webp"));
      imageLabel.classList.add("full");
      var fields = el("div", { class: "fields" }, [
        label("카테고리", input(g.category, function (v) { g.category = v; renderGallery(); }, { placeholder: "내부 / 외부 / 마을 등" })),
        label("사진 설명 (시각장애인 안내용)", input(g.alt, function (v) { g.alt = v; })),
        imageLabel
      ]);
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
    // 접힘 상태 유지 (재렌더 후에도)
    window.__menuCollapsed = window.__menuCollapsed || {};

    state.menu.sections.forEach(function (sec, si) {
      var key = sec.name + "_" + si;
      var collapsed = window.__menuCollapsed[key];
      var section = el("div", { class: "menu-section" + (collapsed ? " collapsed" : "") });

      // 토글 + 이름 + 영문 + 강조 + 순서 변경 + 삭제
      var toggleBtn = el("button", {
        class: "menu-toggle", type: "button", "aria-label": "펼치기/접기",
        onclick: function () { window.__menuCollapsed[key] = !window.__menuCollapsed[key]; renderMenu(); }
      }, [collapsed ? "▶" : "▼"]);

      var hdr = el("div", { class: "menu-section-head" }, [
        toggleBtn,
        input(sec.name, function (v) { sec.name = v; }, { placeholder: "한글 이름" }).tap(function (x) { x.className = "sec-name"; }),
        input(sec.en, function (v) { sec.en = v; }, { placeholder: "English name" }).tap(function (x) { x.className = "sec-en"; }),
        (function () {
          var lbl = el("label", { class: "chk" });
          var chk = el("input", { type: "checkbox" });
          chk.checked = !!sec.highlight;
          chk.addEventListener("change", function (e) { sec.highlight = e.target.checked; saveDraft(); });
          lbl.appendChild(chk);
          lbl.appendChild(document.createTextNode(" 강조 카드"));
          return lbl;
        })(),
        el("span", { class: "menu-meta-info" }, [String(sec.items.length) + "개"]),
        orderControls(state.menu.sections, si, function () { renderMenu(); saveDraft(); })
      ]);
      section.appendChild(hdr);

      if (collapsed) {
        box.appendChild(section);
        return;
      }

      var itemsBox = el("div", { class: "menu-items" });

      // 컬럼 헤더
      itemsBox.appendChild(el("div", { class: "menu-items-head" }, [
        el("span", {}, [""]),
        el("span", {}, ["메뉴명"]),
        el("span", {}, ["HOT"]),
        el("span", {}, ["ICE"]),
        el("span", {}, ["단일 가격"]),
        el("span", {}, [""])
      ]));

      sec.items.forEach(function (it, ii) {
        var row = el("div", { class: "menu-item-row" }, [
          orderControls(sec.items, ii, function () { renderMenu(); saveDraft(); }, { noDelete: true }),
          input(it.name, function (v) { it.name = v; }, { placeholder: "메뉴 이름" }),
          input(it.hot, function (v) { it.hot = v; }, { placeholder: "예: 5,000" }),
          input(it.ice, function (v) { it.ice = v; }, { placeholder: "예: 6,000" }),
          input(it.price, function (v) { it.price = v; }, { placeholder: "단일 가격" }),
          delBtn(function () { sec.items.splice(ii, 1); renderMenu(); saveDraft(); })
        ]);
        itemsBox.appendChild(row);
      });

      var addBtn = el("button", {
        class: "menu-item-add", type: "button",
        onclick: function () { sec.items.push({ name: "" }); renderMenu(); saveDraft(); }
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
    // 다운로드 = 적용 의도 → 드래프트 정리 & 현재 상태를 "원본" 으로 갱신
    initialJSON = JSON.stringify(state);
    clearDraft();
    updateDirtyBadge();
    toast("data.js 파일이 다운로드되었습니다. 카페 폴더의 기존 data.js 와 교체하세요.");
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
