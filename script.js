(function () {
  "use strict";

  /* ===== 헤더 스크롤 효과 ===== */
  var header = document.getElementById("siteHeader");
  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 30);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ===== 모바일 메뉴 토글 ===== */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("primaryNav");
  function closeNav() {
    nav.classList.remove("open");
    toggle.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  /* ===== 데이터 기반 렌더링 (data.js 의 window.siteData 사용) ===== */
  var data = window.siteData || {};

  // 안전 escape — 사장님이 작성한 텍스트에 < 등이 있어도 안전
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---- 공지·이벤트 ---- */
  function renderNotices() {
    var box = document.getElementById("noticesList");
    var section = document.getElementById("notices");
    if (!box || !section) return;
    var list = (data.notices || []);
    if (!list.length) {
      box.innerHTML = '<div class="notices-empty reveal">' +
        '<p class="empty-title">곧 새로운 소식을 전해드릴게요</p>' +
        '<p class="empty-sub">공지와 이벤트가 준비되는 대로 이 자리에서 안내해 드립니다.</p>' +
        '</div>';
      return;
    }
    box.innerHTML = list.map(function (n) {
      return (
        '<article class="notice-card reveal">' +
          '<div class="notice-meta">' +
            '<span class="notice-tag notice-tag-' + (n.tag === "이벤트" ? "event" : "notice") + '">' + esc(n.tag || "공지") + '</span>' +
            '<time class="notice-date">' + esc(n.date) + '</time>' +
          '</div>' +
          '<h3 class="notice-title">' + esc(n.title) + '</h3>' +
          '<p class="notice-body">' + esc(n.body) + '</p>' +
        '</article>'
      );
    }).join("");
  }

  /* ---- 시그니처 메뉴 ---- */
  function renderSignatures() {
    var box = document.getElementById("signatureList");
    if (!box) return;
    var list = (data.signatures || []);
    box.innerHTML = list.map(function (s) {
      var priceHtml = "";
      if (s.hot && s.ice) {
        priceHtml = '<span class="sig-price"><span class="sig-label">HOT</span>' + esc(s.hot) + '</span>' +
                    '<span class="sig-price sig-price-ice"><span class="sig-label">ICE</span>' + esc(s.ice) + '</span>';
      } else if (s.hot) {
        priceHtml = '<span class="sig-price"><span class="sig-label">HOT</span>' + esc(s.hot) + '</span>';
      } else if (s.ice) {
        priceHtml = '<span class="sig-price sig-price-ice"><span class="sig-label">ICE</span>' + esc(s.ice) + '</span>';
      }
      var imgHtml = s.image
        ? '<img src="' + esc(s.image) + '" alt="' + esc(s.name) + '" loading="lazy" />'
        : '<div class="sig-placeholder sig-' + esc(s.accent || "amber") + '" aria-hidden="true"><span>꽃신</span></div>';
      return (
        '<article class="signature-card reveal">' +
          '<div class="sig-media">' + imgHtml + '</div>' +
          '<div class="sig-body">' +
            '<p class="sig-tag">' + esc(s.tag || "") + '</p>' +
            '<h3 class="sig-name">' + esc(s.name) + '</h3>' +
            '<p class="sig-desc">' + esc(s.desc || "") + '</p>' +
            '<div class="sig-prices">' + priceHtml + '</div>' +
          '</div>' +
        '</article>'
      );
    }).join("");
  }

  /* ---- 갤러리 (슬라이드쇼) ---- */
  function renderGallery() {
    var track = document.getElementById("galleryTrack");
    var dotsBox = document.getElementById("galleryDots");
    var counter = document.getElementById("galleryCounter");
    if (!track) return;
    var list = (data.gallery || []);
    if (!list.length) {
      track.innerHTML = '';
      return;
    }
    track.innerHTML = list.map(function (g, i) {
      var color = (i % 3 === 0) ? "amber" : (i % 3 === 1) ? "leaf" : "wood";
      var placeholder = '<div class="gallery-placeholder gallery-' + color + '" aria-hidden="true"></div>';
      var content = g.src
        ? '<img src="' + esc(g.src) + '" alt="' + esc(g.alt || "") + '" loading="lazy" data-color="' + color + '" />'
        : placeholder;
      return (
        '<div class="gallery-slide" data-idx="' + i + '">' +
          content +
          '<figcaption class="gallery-cap">' + esc(g.category || "") + '</figcaption>' +
        '</div>'
      );
    }).join("");

    if (dotsBox) {
      dotsBox.innerHTML = list.map(function (_, i) {
        return '<button class="gallery-dot' + (i === 0 ? ' active' : '') + '" type="button" data-go="' + i + '" aria-label="' + (i + 1) + '번 사진"></button>';
      }).join("");
    }

    function pad(n) { return String(n).padStart(2, "0"); }
    if (counter) counter.textContent = pad(1) + " / " + pad(list.length);

    // 이미지 로드 실패 시 자리표시로 교체
    track.querySelectorAll("img").forEach(function (img) {
      img.addEventListener("error", function () {
        var ph = document.createElement("div");
        ph.className = "gallery-placeholder gallery-" + (img.getAttribute("data-color") || "amber");
        ph.setAttribute("aria-hidden", "true");
        img.replaceWith(ph);
      });
      if (img.complete && img.naturalWidth === 0) {
        img.dispatchEvent(new Event("error"));
      }
    });

    initGallerySlider(list.length);
  }

  /* ---- 갤러리 캐러셀 제어 ---- */
  function initGallerySlider(total) {
    var track = document.getElementById("galleryTrack");
    var slider = document.getElementById("gallerySlider");
    var prev = document.getElementById("galleryPrev");
    var next = document.getElementById("galleryNext");
    var counter = document.getElementById("galleryCounter");
    if (!track || !slider || !prev || !next) return;

    if (total <= 1) {
      prev.style.display = "none";
      next.style.display = "none";
      return;
    }

    var current = 0;
    var autoTimer;
    var AUTOPLAY_MS = 6000;
    function pad(n) { return String(n).padStart(2, "0"); }

    function go(i, opt) {
      current = ((i % total) + total) % total;
      track.style.transform = "translateX(-" + (current * 100) + "%)";
      var dots = document.querySelectorAll(".gallery-dot");
      dots.forEach(function (d, idx) { d.classList.toggle("active", idx === current); });
      if (counter) counter.textContent = pad(current + 1) + " / " + pad(total);
      if (!opt || !opt.silent) resetAutoplay();
    }
    function startAutoplay() {
      stopAutoplay();
      autoTimer = setInterval(function () { go(current + 1, { silent: true }); }, AUTOPLAY_MS);
    }
    function stopAutoplay() { if (autoTimer) clearInterval(autoTimer); }
    function resetAutoplay() { startAutoplay(); }

    prev.addEventListener("click", function () { go(current - 1); });
    next.addEventListener("click", function () { go(current + 1); });

    document.querySelectorAll(".gallery-dot").forEach(function (d) {
      d.addEventListener("click", function () { go(parseInt(d.getAttribute("data-go"), 10)); });
    });

    // 호버 시 자동 슬라이드 일시정지
    slider.addEventListener("mouseenter", stopAutoplay);
    slider.addEventListener("mouseleave", startAutoplay);

    // 키보드 화살표
    slider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(current - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(current + 1); }
    });

    // 모바일 스와이프
    var touchStart = null;
    slider.addEventListener("touchstart", function (e) { touchStart = e.touches[0].clientX; stopAutoplay(); }, { passive: true });
    slider.addEventListener("touchend", function (e) {
      if (touchStart == null) return startAutoplay();
      var diff = e.changedTouches[0].clientX - touchStart;
      if (Math.abs(diff) > 50) go(current + (diff < 0 ? 1 : -1));
      else startAutoplay();
      touchStart = null;
    });

    startAutoplay();
  }

  /* ---- 전체 메뉴 ---- */
  function renderMenu() {
    var grid = document.getElementById("menuGrid");
    var noteEl = document.getElementById("menuNote");
    if (!grid || !data.menu) return;
    if (noteEl && data.menu.note) noteEl.textContent = data.menu.note;

    var sections = data.menu.sections || [];
    grid.innerHTML = sections.map(function (sec) {
      var hasHot = sec.items.some(function (it) { return it.hot; });
      var hasIce = sec.items.some(function (it) { return it.ice; });
      var hasPlain = sec.items.some(function (it) { return it.price; });

      var headHtml = "";
      if (hasHot && hasIce) headHtml = '<div class="price-head"><span>HOT</span><span class="ph-ice">ICE</span></div>';
      else if (hasIce && !hasHot) headHtml = '<div class="price-head"><span class="ph-ice">ICE</span></div>';
      else if (hasHot && !hasIce && !hasPlain) headHtml = '<div class="price-head"><span>HOT</span></div>';

      var itemsHtml = sec.items.map(function (it) {
        var pricesHtml;
        if (it.price) {
          pricesHtml = '<span class="m-price m-wide">' + esc(it.price) + '</span>';
        } else if (it.hot && it.ice) {
          pricesHtml = '<span class="m-prices"><span class="m-price">' + esc(it.hot) + '</span><span class="m-price m-ice">' + esc(it.ice) + '</span></span>';
        } else if (it.hot) {
          pricesHtml = hasIce
            ? '<span class="m-prices"><span class="m-price">' + esc(it.hot) + '</span><span class="m-price m-ice m-none">·</span></span>'
            : '<span class="m-prices m-single"><span class="m-price m-wide">' + esc(it.hot) + '</span></span>';
        } else if (it.ice) {
          pricesHtml = hasHot
            ? '<span class="m-prices"><span class="m-price m-none">·</span><span class="m-price m-ice">' + esc(it.ice) + '</span></span>'
            : '<span class="m-prices"><span class="m-price m-ice">' + esc(it.ice) + '</span></span>';
        } else {
          pricesHtml = '';
        }
        return '<li><span class="m-name">' + esc(it.name) + '</span>' + pricesHtml + '</li>';
      }).join("");

      return (
        '<article class="menu-card reveal' + (sec.highlight ? ' highlight' : '') + '">' +
          '<h3>' + esc(sec.name) + ' <span>' + esc(sec.en || "") + '</span></h3>' +
          headHtml +
          '<ul>' + itemsHtml + '</ul>' +
        '</article>'
      );
    }).join("");
  }

  renderNotices();
  renderSignatures();
  renderGallery();
  renderMenu();

  /* ===== 사진 라이트박스 ===== */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lightboxImg");
  var lbCap = document.getElementById("lightboxCap");
  var lbClose = document.getElementById("lightboxClose");
  if (lb && lbImg && lbClose) {
    function openLB(src, alt) {
      lbImg.src = src;
      lbImg.alt = alt || "";
      if (lbCap) lbCap.textContent = alt || "";
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-open");
      lbClose.focus();
    }
    function closeLB() {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lightbox-open");
      setTimeout(function () { lbImg.src = ""; }, 200);
    }
    // 갤러리 사진 클릭 → 라이트박스 열기 (이벤트 위임)
    document.addEventListener("click", function (e) {
      var img = e.target.closest && e.target.closest(".gallery-slide img, .gallery-item img");
      if (img) {
        e.preventDefault();
        openLB(img.src, img.alt);
      }
    });
    // X 버튼
    lbClose.addEventListener("click", closeLB);
    // 배경(어두운 영역) 클릭 시 닫기 — 이미지 클릭은 무시
    lb.addEventListener("click", function (e) {
      if (e.target === lb) closeLB();
    });
    // ESC 키로 닫기
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lb.classList.contains("open")) closeLB();
    });
  }

  /* ===== 예약: 날짜·시간 선택기 + 폼 제출 ===== */
  var rsvForm = document.getElementById("rsvForm");
  if (rsvForm) {
    var pad2 = function (n) { return String(n).padStart(2, "0"); };

    /* 방문 일자: 오늘 ~ 3개월 뒤만 (페이지 열 때 계산 → 매일 자동으로 굴러감) */
    var dateInput = document.getElementById("rsvDate");
    if (dateInput) {
      var today = new Date();
      var fmt = function (d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); };
      dateInput.min = fmt(today);
      dateInput.max = fmt(new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()));
    }

    /* 방문 시간: 오전 10:00 ~ 오후 8:30. 시/분 드롭다운(무한 휠 없음) */
    var OPEN_HOUR = 10, CLOSE_HOUR = 20, CLOSE_MIN = 30;
    var hourSel = document.getElementById("rsvHour");
    var minSel = document.getElementById("rsvMinute");
    function fillHours() {
      if (!hourSel) return;
      var html = '<option value="" disabled selected>시</option>';
      for (var h = OPEN_HOUR; h <= CLOSE_HOUR; h++) {
        var label = (h < 12 ? "오전 " + h : (h === 12 ? "오후 12" : "오후 " + (h - 12))) + "시";
        html += '<option value="' + pad2(h) + '">' + label + '</option>';
      }
      hourSel.innerHTML = html;
    }
    function fillMinutes() {
      if (!minSel) return;
      var max = (hourSel && hourSel.value === pad2(CLOSE_HOUR)) ? CLOSE_MIN : 59;
      var keep = minSel.value;
      var html = '<option value="" disabled' + (keep === "" ? " selected" : "") + '>분</option>';
      for (var m = 0; m <= max; m++) {
        var v = pad2(m);
        html += '<option value="' + v + '"' + (v === keep ? " selected" : "") + '>' + v + '분</option>';
      }
      minSel.innerHTML = html;
      if (keep !== "" && Number(keep) > max) minSel.value = ""; // 20시 선택 시 30분 초과값 해제
    }
    if (hourSel && minSel) {
      fillHours();
      fillMinutes();
      hourSel.addEventListener("change", fillMinutes);
    }

    /* 폼 제출: 서버(이메일)로 전송, 실패 시 복사 안내로 폴백 */
    rsvForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = document.getElementById("rsvFormNote");
      var btn = rsvForm.querySelector('button[type="submit"]');
      function setNote(t, cls) { if (note) { note.textContent = t; note.className = "rsv-note " + (cls || ""); } }

      var fd = new FormData(rsvForm);
      var name = (fd.get("name") || "").toString().trim();
      var people = (fd.get("people") || "").toString().trim();
      var date = (fd.get("date") || "").toString().trim();
      var hh = (fd.get("hour") || "").toString();
      var mm = (fd.get("minute") || "").toString();
      var time = (hh && mm) ? (hh + ":" + mm) : "";
      var phone = (fd.get("phone") || "").toString().trim();
      var noteText = (fd.get("notes") || "").toString().trim();

      if (!time) { setNote("방문 시간을 선택해 주세요.", "err"); return; }

      var msg =
        "[꽃신 예약 문의]\n" +
        "성함: " + name + "\n" +
        "인원: " + people + "명\n" +
        "일자: " + date + "\n" +
        "시간: " + time + "\n" +
        "연락처: " + phone +
        (noteText ? "\n요청: " + noteText : "");

      // 서버 미설정/오류 시: 예약 내용 복사 + 전화/카톡 안내
      function fallback() {
        function done() { setNote("✓ 예약 내용이 복사되었습니다. 033-435-4885 로 전화하시거나 카톡으로 붙여넣어 보내주세요.", "ok"); }
        function fail() { setNote("033-435-4885 로 전화 주시거나 카톡으로 문의해 주세요.", "err"); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(msg).then(done, fail);
        } else {
          var ta = document.createElement("textarea");
          ta.value = msg; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); done(); } catch (err) { fail(); }
          document.body.removeChild(ta);
        }
      }

      setNote("예약 문의를 보내는 중…", "");
      if (btn) btn.disabled = true;
      fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, people: people, date: date, time: time, phone: phone, notes: noteText })
      }).then(function (r) {
        if (!r.ok) throw new Error("status " + r.status);
        return r.json();
      }).then(function () {
        setNote("✓ 예약 문의가 접수되었습니다. 확인 후 연락드릴게요!", "ok");
        rsvForm.reset();
        if (hourSel && minSel) { fillHours(); fillMinutes(); }
      }).catch(function () {
        fallback(); // 서버가 아직 설정 안 됐거나 오류 → 안전하게 복사 안내
      }).finally(function () {
        if (btn) btn.disabled = false;
      });
    });
  }

  /* ===== 스크롤 등장 애니메이션 ===== */
  function attachReveal() {
    var revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.14 }
      );
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add("visible"); });
    }
  }
  attachReveal();
})();
