from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

SRC = Path(r"C:\Users\buttg\.cursor\projects\e-Development-MyDarzi\assets")
OUT = Path(r"E:\_Development\MyDarzi\store\google-play")
SOURCE_OUT = OUT / "source"
SHOTS_OUT = OUT / "screenshots"


def center_crop_to_ratio(im: Image.Image, target_ratio: float) -> Image.Image:
    w, h = im.size
    cur = w / h
    if cur > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        return im.crop((left, 0, left + new_w, h))
    new_h = int(w / target_ratio)
    top = (h - new_h) // 2
    return im.crop((0, top, w, top + new_h))


def main() -> None:
    SOURCE_OUT.mkdir(parents=True, exist_ok=True)
    SHOTS_OUT.mkdir(parents=True, exist_ok=True)

    mapping = {
        "mydarzi-icon-source.png": "icon-source.png",
        "mydarzi-icon-clean.png": "icon-clean-source.png",
        "mydarzi-feature-graphic-source.png": "feature-source.png",
        "mydarzi-shot-customers.png": "shot-customers-source.png",
        "mydarzi-shot-measurements.png": "shot-measurements-source.png",
        "mydarzi-shot-orders.png": "shot-orders-source.png",
        "mydarzi-shot-offline.png": "shot-offline-source.png",
    }
    for name, dest in mapping.items():
        p = SRC / name
        if p.exists():
            shutil.copy2(p, SOURCE_OUT / dest)
            print("copied", name)

    # Prefer the cleaner full-bleed icon when available.
    icon_candidates = [
        SRC / "mydarzi-icon-clean.png",
        SRC / "mydarzi-icon-source.png",
    ]
    icon_src = next((p for p in icon_candidates if p.exists()), None)
    if icon_src is None:
        raise SystemExit("No icon source found")

    icon = Image.open(icon_src).convert("RGBA")
    icon = center_crop_to_ratio(icon, 1.0).resize((512, 512), Image.Resampling.LANCZOS)
    icon.save(OUT / "icon-512.png", "PNG")
    print("wrote icon-512.png", icon.size)

    feat_src = SRC / "mydarzi-feature-graphic-source.png"
    if feat_src.exists():
        feat = Image.open(feat_src).convert("RGB")
        feat = center_crop_to_ratio(feat, 1024 / 500).resize(
            (1024, 500), Image.Resampling.LANCZOS
        )
        feat.save(OUT / "feature-graphic-1024x500.png", "PNG")
        print("wrote feature-graphic-1024x500.png", feat.size)

    shot_files = [
        ("mydarzi-shot-customers.png", "01-customers.png"),
        ("mydarzi-shot-measurements.png", "02-measurements.png"),
        ("mydarzi-shot-orders.png", "03-orders.png"),
        ("mydarzi-shot-offline.png", "04-offline.png"),
    ]
    for src_name, dest_name in shot_files:
        p = SRC / src_name
        if not p.exists():
            print("missing", src_name)
            continue
        shot = Image.open(p).convert("RGB")
        shot = center_crop_to_ratio(shot, 1080 / 1920).resize(
            (1080, 1920), Image.Resampling.LANCZOS
        )
        shot.save(SHOTS_OUT / dest_name, "PNG")
        print("wrote", dest_name, shot.size)

    readme = OUT / "README.txt"
    readme.write_text(
        "\n".join(
            [
                "MyDarzi — Google Play listing assets",
                "",
                "Upload these in Play Console > Store listing:",
                "",
                "1) App icon (required)",
                "   icon-512.png  (512 x 512 PNG)",
                "",
                "2) Feature graphic (required)",
                "   feature-graphic-1024x500.png  (1024 x 500 PNG)",
                "",
                "3) Phone screenshots (min 2)",
                "   screenshots/01-customers.png",
                "   screenshots/02-measurements.png",
                "   screenshots/03-orders.png",
                "   screenshots/04-offline.png",
                "   (1080 x 1920 PNG)",
                "",
                "Brand colors used: teal #0F766E, cream #F7F4EF, ink #1C1917",
                "source/ holds original generated files before resize.",
                "",
            ]
        ),
        encoding="utf-8",
    )
    print("DONE", OUT)


if __name__ == "__main__":
    main()
