/* ============================================================
   꽃신 예약 알림 — 이메일 발송 API (Vercel 서버리스 함수)
   ------------------------------------------------------------
   홈페이지 예약 폼이 이 함수를 호출하면, 사장님 이메일로
   예약 내용을 보내드립니다. (Resend 이메일 서비스 사용)

   필요한 Vercel 환경변수 (Settings → Environment Variables):
     - RESEND_API_KEY         : Resend API 키 (필수, 비공개)  https://resend.com
     - RESERVATION_TO_EMAIL   : 알림 받을 사장님 이메일 (필수)
     - RESERVATION_FROM_EMAIL : (선택) 보내는 주소. 기본 "꽃신 예약 <onboarding@resend.dev>"
                                (직접 도메인을 쓰려면 Resend에서 도메인 인증 후 그 주소로 설정)
   ============================================================ */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST 요청만 허용됩니다." });
    return;
  }

  var body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  var name = (body.name || "").toString().trim();
  var people = (body.people || "").toString().trim();
  var date = (body.date || "").toString().trim();
  var time = (body.time || "").toString().trim();
  var phone = (body.phone || "").toString().trim();
  var notes = (body.notes || "").toString().trim();

  if (!name || !date || !time || !phone) {
    res.status(400).json({ error: "필수 항목(성함·일자·시간·연락처)이 비어 있습니다." });
    return;
  }

  var KEY = process.env.RESEND_API_KEY;
  var TO = process.env.RESERVATION_TO_EMAIL;
  var FROM = process.env.RESERVATION_FROM_EMAIL || "꽃신 예약 <onboarding@resend.dev>";

  if (!KEY || !TO) {
    res.status(500).json({
      error: "서버 설정이 아직 완료되지 않았습니다. (RESEND_API_KEY, RESERVATION_TO_EMAIL 환경변수 필요)"
    });
    return;
  }

  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  var telDigits = phone.replace(/[^0-9]/g, "");

  var subject = "[꽃신 예약] " + name + " · " + date + " " + time + " · " + people + "명";
  var text =
    "새 예약 문의가 접수되었습니다.\n\n" +
    "성함: " + name + "\n" +
    "인원: " + people + "명\n" +
    "일자: " + date + "\n" +
    "시간: " + time + "\n" +
    "연락처: " + phone +
    (notes ? "\n요청: " + notes : "") +
    "\n\n— 꽃신 홈페이지 예약 폼에서 자동 발송";
  var html =
    '<div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.7;color:#2b2b2b">' +
      '<h2 style="margin:0 0 14px;font-size:18px">🌸 새 예약 문의</h2>' +
      '<table style="border-collapse:collapse">' +
        '<tr><td style="padding:5px 16px 5px 0;color:#999">성함</td><td><b>' + esc(name) + '</b></td></tr>' +
        '<tr><td style="padding:5px 16px 5px 0;color:#999">인원</td><td>' + esc(people) + '명</td></tr>' +
        '<tr><td style="padding:5px 16px 5px 0;color:#999">일자</td><td>' + esc(date) + '</td></tr>' +
        '<tr><td style="padding:5px 16px 5px 0;color:#999">시간</td><td>' + esc(time) + '</td></tr>' +
        '<tr><td style="padding:5px 16px 5px 0;color:#999">연락처</td><td><a href="tel:' + esc(telDigits) + '">' + esc(phone) + '</a></td></tr>' +
        (notes ? '<tr><td style="padding:5px 16px 5px 0;color:#999;vertical-align:top">요청</td><td>' + esc(notes) + '</td></tr>' : '') +
      '</table>' +
      '<p style="margin:18px 0 0;color:#bbb;font-size:13px">꽃신 홈페이지 예약 폼에서 자동 발송됨</p>' +
    '</div>';

  try {
    var r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ from: FROM, to: [TO], subject: subject, text: text, html: html })
    });

    if (!r.ok) {
      var e = await r.text();
      res.status(502).json({ error: "이메일 발송 실패", detail: e.slice(0, 300) });
      return;
    }
    var ok = await r.json();
    res.status(200).json({ ok: true, id: ok && ok.id });
  } catch (err) {
    res.status(500).json({ error: "발송 중 오류가 발생했습니다.", detail: String(err).slice(0, 300) });
  }
};
