/* ============================================================
   꽃신 관리자 — 저장 API (Vercel 서버리스 함수)
   ------------------------------------------------------------
   관리자 페이지의 "저장" 버튼이 이 함수를 호출합니다.
   비밀번호 확인 후, GitHub 저장소의 data.js 를 새 내용으로
   커밋합니다. 커밋되면 Vercel 이 자동 배포하여 약 1분 뒤
   홈페이지에 반영됩니다.

   필요한 Vercel 환경변수 (Settings → Environment Variables):
     - GITHUB_TOKEN          : 저장소 쓰기 권한이 있는 토큰 (필수, 비공개)
     - ADMIN_SAVE_PASSWORD   : 저장 시 확인할 비밀번호 (필수)
     - GITHUB_REPO           : (선택) 기본값 "is29746735-cmyk/flower-shoes"
   ============================================================ */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST 요청만 허용됩니다." });
    return;
  }

  // 본문 파싱 (Vercel 이 자동 파싱하지만 문자열 대비)
  var body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  var password = body.password;
  var dataJs = body.dataJs;

  var TOKEN = process.env.GITHUB_TOKEN;
  var SAVE_PASSWORD = process.env.ADMIN_SAVE_PASSWORD;
  var REPO = process.env.GITHUB_REPO || "is29746735-cmyk/flower-shoes";
  var FILE = "data.js";
  var BRANCH = "main";

  if (!TOKEN || !SAVE_PASSWORD) {
    res.status(500).json({
      error: "서버 설정이 아직 완료되지 않았습니다. (관리자에게 문의: GITHUB_TOKEN, ADMIN_SAVE_PASSWORD 환경변수 필요)"
    });
    return;
  }
  if (password !== SAVE_PASSWORD) {
    res.status(401).json({ error: "비밀번호가 올바르지 않습니다." });
    return;
  }

  var apiBase = "https://api.github.com/repos/" + REPO + "/contents/" + FILE;
  var ghHeaders = {
    "Authorization": "Bearer " + TOKEN,
    "User-Agent": "kkotshin-admin",
    "Accept": "application/vnd.github+json"
  };

  if (!dataJs || typeof dataJs !== "string") {
    res.status(400).json({ error: "저장할 데이터가 비어 있습니다." });
    return;
  }

  try {
    // 1) 현재 파일 SHA 조회 (커밋에 필요)
    var sha = undefined;
    var getRes = await fetch(apiBase + "?ref=" + BRANCH, { headers: ghHeaders });
    if (getRes.ok) {
      var cur = await getRes.json();
      sha = cur.sha;
    } else if (getRes.status !== 404) {
      var ge = await getRes.text();
      res.status(502).json({ error: "GitHub 파일 조회 실패", detail: ge.slice(0, 300) });
      return;
    }

    // 2) 새 내용으로 커밋 (base64 인코딩)
    var contentB64 = Buffer.from(dataJs, "utf-8").toString("base64");
    var putBody = {
      message: "관리자 페이지에서 콘텐츠 저장",
      content: contentB64,
      branch: BRANCH
    };
    if (sha) putBody.sha = sha;

    var putRes = await fetch(apiBase, {
      method: "PUT",
      headers: Object.assign({}, ghHeaders, { "Content-Type": "application/json" }),
      body: JSON.stringify(putBody)
    });

    if (!putRes.ok) {
      var pe = await putRes.json().catch(function () { return {}; });
      var reason = (pe && pe.message) || "알 수 없는 오류";
      var hint = "";
      if (putRes.status === 403 || putRes.status === 404) {
        hint = " (토큰의 Contents 쓰기 권한 또는 저장소 접근을 확인하세요)";
      }
      res.status(502).json({ error: "GitHub 저장 실패: " + reason + hint, ghStatus: putRes.status });
      return;
    }

    var ok = await putRes.json();
    res.status(200).json({ ok: true, commit: ok.commit && ok.commit.sha });
  } catch (err) {
    res.status(500).json({ error: "저장 중 오류가 발생했습니다.", detail: String(err).slice(0, 300) });
  }
};
