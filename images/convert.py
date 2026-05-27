"""
꽃신 사진 → WebP 자동 변환 스크립트
------------------------------------
사용법:
  1) 이 폴더(images/)에 원본 사진을 둡니다.
     - 갤러리에 쓸 5장을 아래 이름 중 하나로 저장하면 더 편합니다:
       interior-01.jpg(또는 .png/.heic)  → interior-01.webp 로 변환됨
       interior-02.jpg  → interior-02.webp
       interior-03.jpg  → interior-03.webp
       interior-04.jpg  → interior-04.webp
       interior-05.jpg  → interior-05.webp
     - 로고는 logo.png 라는 이름을 권장합니다 (PNG 그대로 사용 가능).
  2) 명령 프롬프트에서 이 폴더로 이동 후 실행:
       python convert.py
  3) 변환된 *.webp 파일이 옆에 생성됩니다.

요구 사항: Python 3.7+, Pillow (HEIC 변환 시 pillow-heif 도 권장)
  pip install pillow pillow-heif
"""

from pathlib import Path
import sys

try:
    from PIL import Image
except ImportError:
    print("[!] Pillow 가 설치되어 있지 않습니다. 아래 명령을 실행한 뒤 다시 시도하세요:")
    print("    pip install pillow")
    sys.exit(1)

# HEIC 지원(아이폰 사진) — 선택적
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
    print("[i] HEIC 변환 지원 활성화됨")
except ImportError:
    pass

HERE = Path(__file__).resolve().parent
SUPPORTED = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".heic", ".heif"}
MAX_LONG_SIDE = 1600   # 너무 큰 사진은 가로/세로 긴 쪽 기준 1600px 로 다운사이즈
QUALITY = 82           # WebP 품질 (0~100, 80~85 권장)

def convert_one(src: Path) -> Path | None:
    if src.suffix.lower() not in SUPPORTED:
        return None
    dst = src.with_suffix(".webp")
    try:
        img = Image.open(src)
        # 회전 정보(EXIF) 반영
        if hasattr(img, "_getexif") and img._getexif():
            exif = dict(img._getexif().items())
            orientation = exif.get(0x0112)
            if orientation == 3:   img = img.rotate(180, expand=True)
            elif orientation == 6: img = img.rotate(270, expand=True)
            elif orientation == 8: img = img.rotate(90, expand=True)

        if img.mode in ("P", "RGBA"):
            img = img.convert("RGB")

        # 다운사이즈 (긴 쪽 기준)
        w, h = img.size
        scale = min(1.0, MAX_LONG_SIDE / max(w, h))
        if scale < 1.0:
            img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

        img.save(dst, "WEBP", quality=QUALITY, method=6)
        return dst
    except Exception as e:
        print(f"[!] 실패: {src.name} - {e}")
        return None

def main():
    files = sorted([p for p in HERE.iterdir() if p.is_file() and p.suffix.lower() in SUPPORTED])
    if not files:
        print(f"[i] 변환할 사진을 찾지 못했습니다. {HERE} 폴더에 사진을 넣은 뒤 다시 실행하세요.")
        return
    converted = 0
    for f in files:
        out = convert_one(f)
        if out:
            size_kb = out.stat().st_size // 1024
            print(f"[ok] {f.name} → {out.name} ({size_kb} KB)")
            converted += 1
    print(f"\n총 {converted}장 변환 완료.")

if __name__ == "__main__":
    main()
