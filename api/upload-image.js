/* ============================================================
   꽃신 관리자 — 이미지 업로드 API (Vercel 서버리스 함수)
   ------------------------------------------------------------
   관리자 페이지에서 사진을 파일 선택/드래그로 올리면,
   브라우저가 WebP로 압축한 뒤 이 함수로 보냅니다.
   함수는 GitHub 저장소의 images/ 폴더에 파일을 커밋하고
   경로(images/파일명)를 돌려줍니다.

   필요한 Vercel 환경변수: GITHUB_TOKEN, ADMIN_SAVE_PASSWORD
   ============================================================ */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST 요청만 허용됩니다." });
    return;
  }

  var body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  var password = body.password;
  var filename = body.filename;
  var contentBase64 = body.contentBase64;

  var TOKEN = process.env.GITHUB_TOKEN;
  var SAVE_PASSWORD = process.env.ADMIN_SAVE_PASSWORD;
  var REPO = process.env.GITHUB_REPO || "is29746735-cmyk/flower-shoes";
  var BRANCH = "main";

  if (!TOKEN || !SAVE_PASSWORD) {
    res.status(500).json({ error: "서버 설정이 완료되지 않았습니다. (GITHUB_TOKEN, ADMIN_SAVE_PASSWORD 필요)" });
    return;
  }
  if (password !== SAVE_PASSWORD) {
    res.status(401).json({ error: "비밀번호가 올바르지 않습니다." });
    return;
  }
  if (!contentBase64 || !filename) {
    res.status(400).json({ error: "업로드할 파일이 없습니다." });
    return;
  }

  // 파일명 정리 (경로 조작/한글/공백 방지) + 확장자 보정
  var safe = String(filename).replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_{2,}/g, "_");
  if (!/\.(webp|jpg|jpeg|png)$/i.test(safe)) safe += ".webp";
  var path = "images/" + safe;

  var apiBase = "https://api.github.com/repos/" + REPO + "/contents/" + path;
  var gh = {
    "Authorization": "Bearer " + TOKEN,
    "User-Agent": "kkotshin-admin",
    "Accept": "application/vnd.github+json"
  };

  try {
    // 같은 이름이 이미 있으면 sha 가져와서 덮어쓰기
    var sha;
    var g = await fetch(apiBase + "?ref=" + BRANCH, { headers: gh });
    if (g.ok) { var j = await g.json(); sha = j.sha; }

    var putBody = {
      message: "이미지 업로드: " + safe,
      content: contentBase64,
      branch: BRANCH
    };
    if (sha) putBody.sha = sha;

    var p = await fetch(apiBase, {
      method: "PUT",
      headers: Object.assign({}, gh, { "Content-Type": "application/json" }),
      body: JSON.stringify(putBody)
    });

    if (!p.ok) {
      var e = await p.json().catch(function () { return {}; });
      res.status(502).json({ error: "업로드 실패: " + ((e && e.message) || p.status) });
      return;
    }

    res.status(200).json({ ok: true, path: path });
  } catch (err) {
    res.status(500).json({ error: "업로드 중 오류: " + String(err).slice(0, 200) });
  }
};
