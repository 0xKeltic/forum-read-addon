import json
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / "manifest.json"
BUILD_DIR = ROOT / "build"


def get_manifest():
    with MANIFEST_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def collect_files(manifest):
    files = set()
    files.add(MANIFEST_PATH)
    for script in manifest.get("content_scripts", []):
        for js in script.get("js", []):
            files.add(ROOT / js)
        for css in script.get("css", []):
            files.add(ROOT / css)
    action = manifest.get("action") or {}
    if action.get("default_popup"):
        files.add(ROOT / action["default_popup"])
    if action.get("default_icon"):
        icon = action["default_icon"]
        if isinstance(icon, str):
            files.add(ROOT / icon)
        else:
            for v in icon.values():
                files.add(ROOT / v)
    if manifest.get("icons"):
        for v in manifest["icons"].values():
            files.add(ROOT / v)
    if manifest.get("background") and manifest["background"].get("service_worker"):
        files.add(ROOT / manifest["background"]["service_worker"])
    return sorted(files)


def build_xpi():
    manifest = get_manifest()
    version = manifest.get("version", "0.0.0")
    name = manifest.get("name", "addon").lower().replace(" ", "-")
    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    xpi_path = BUILD_DIR / f"{name}-{version}.xpi"
    files = collect_files(manifest)
    for path in files:
        if not path.exists():
            raise FileNotFoundError(f"Falta el archivo: {path}")
    with zipfile.ZipFile(xpi_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in files:
            zf.write(path, path.relative_to(ROOT))
    return xpi_path


if __name__ == "__main__":
    output = build_xpi()
    print(str(output))
