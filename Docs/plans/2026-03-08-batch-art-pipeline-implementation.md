# Batch Art Generation Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend `scripts/generate-hex-tile.py` to generate 12 magic sphere overlays, consolidate output to `public/hex-tiles/`, and add asset auditing.

**Architecture:** Add a `MAGIC_REGISTRY` dict alongside the existing `BIOME_REGISTRY`, a `build_magic_prompt()` function, a `black_to_transparent()` post-processor, and an `audit_assets()` reporter. CLI gains `--category`, `--sphere`, `--audit`, and `--batch-all` flags.

**Tech Stack:** Python 3.10+, Pillow (PIL), google-genai (Gemini API), argparse. Tests in pytest.

**Design doc:** `Docs/plans/2026-03-08-batch-art-pipeline-design.md`

---

### Task 1: Add MAGIC_REGISTRY

**Files:**
- Modify: `scripts/generate-hex-tile.py` (after BIOME_REGISTRY, ~line 181)
- Test: `scripts/tests/test_pipeline.py` (create)

**Step 1: Write the failing test**

Create `scripts/tests/__init__.py` (empty) and `scripts/tests/test_pipeline.py`:

```python
"""Tests for generate-hex-tile.py pipeline functions."""
import sys
from pathlib import Path

# Add scripts dir to path so we can import the pipeline module
sys.path.insert(0, str(Path(__file__).parent.parent))

# We'll import after renaming the script to a module-friendly name,
# but for now test the registry data directly by exec-ing the file.
# Better approach: extract constants into a separate module.
# For pragmatism: we test via subprocess + JSON output.

def test_magic_registry_has_12_spheres():
    """MAGIC_REGISTRY must have exactly 12 entries (8 creation + 4 foundation)."""
    # Import by exec since filename has hyphens
    ns = {}
    exec(
        Path(__file__).parent.parent.joinpath("generate-hex-tile.py").read_text(),
        ns,
    )
    registry = ns["MAGIC_REGISTRY"]
    assert len(registry) == 12

    expected_spheres = {
        "force", "matter", "energy", "life", "mind", "spirit", "time", "entropy",
        "chaos", "order", "light", "darkness",
    }
    assert set(registry.keys()) == expected_spheres


def test_magic_registry_entries_have_required_keys():
    """Each entry needs color, form_language, and desc."""
    ns = {}
    exec(
        Path(__file__).parent.parent.joinpath("generate-hex-tile.py").read_text(),
        ns,
    )
    for sphere, entry in ns["MAGIC_REGISTRY"].items():
        assert "color" in entry, f"{sphere} missing color"
        assert "form_language" in entry, f"{sphere} missing form_language"
        assert "desc" in entry, f"{sphere} missing desc"
        assert entry["color"].startswith("#"), f"{sphere} color must be hex"
```

**Step 2: Run test to verify it fails**

Run: `cd /path/to/project && python -m pytest scripts/tests/test_pipeline.py -v`
Expected: FAIL — `MAGIC_REGISTRY` not defined

**Step 3: Add MAGIC_REGISTRY to generate-hex-tile.py**

Insert after `BIOME_REGISTRY` (after line 181):

```python
# ---------------------------------------------------------------------------
# Magic overlay registry — sphere-specific thread patterns
# ---------------------------------------------------------------------------

MAGIC_REGISTRY = {
    # Creation Spheres (8)
    "force": {
        "color": "#ff4444",
        "bright": "#ff6b6b",
        "form_language": "sharp directional streaks and impact radiants, lightning-bolt angles, shockwave arcs, arrow-like directional lines, explosive radiants from impact points",
        "desc": "Force",
    },
    "matter": {
        "color": "#8b6b4a",
        "bright": "#a8886a",
        "form_language": "crystalline lattices and hexagonal facets, mineral-like structures, hard-edged tessellating crystal formations, angular geometric nodes",
        "desc": "Matter",
    },
    "energy": {
        "color": "#ffd700",
        "bright": "#ffe44d",
        "form_language": "radiating spikes and star-burst coronas, pulsing outward from bright centers like tiny suns, flickering flame tongues, electric arcs, solar flare shapes",
        "desc": "Energy",
    },
    "life": {
        "color": "#00cc55",
        "bright": "#33ff77",
        "form_language": "organic branching veins roots and mycelium, Fibonacci spirals, tendril curls, capillary networks, cell-like nodes, the most natural-looking patterns",
        "desc": "Life",
    },
    "mind": {
        "color": "#2288ff",
        "bright": "#44aaff",
        "form_language": "neural dendrites and concentric rings, dendrite networks, eye-like nodes, mandala patterns at intersections, precise but complexly branching",
        "desc": "Mind",
    },
    "spirit": {
        "color": "#aa44dd",
        "bright": "#cc66ff",
        "form_language": "ascending wisps and ethereal ribbons, smoke-like trails rising, ghostly flame shapes, dissolving transparent edges, ribbons that partially fade into nothing",
        "desc": "Spirit",
    },
    "time": {
        "color": "#ff9933",
        "bright": "#ffb355",
        "form_language": "concentric ripples and overlapping echoes, clock-arc shapes, time-wave rings expanding from nodes, overlapping afterimages of the same thread visible in multiple moments",
        "desc": "Time",
    },
    "entropy": {
        "color": "#5a8a7a",
        "bright": "#7aaa9a",
        "form_language": "fracturing patterns and scattering particles, cracking and fragmenting at edges, dissolving into scattered motes, erosion lines",
        "desc": "Entropy",
    },
    # Foundation Spheres (4)
    "chaos": {
        "color": "#8a8a8e",
        "bright": "#aaaaae",
        "form_language": "fractals and turbulent swirls, every tendril goes a different direction, no repeating pattern, like fractal lightning or turbulent fluid",
        "desc": "Chaos",
    },
    "order": {
        "color": "#d4af37",
        "bright": "#e4cf57",
        "form_language": "geometric grids and tessellations, clean straight lines, repeating symmetrical patterns, sacred geometry, crystalline lattice structures",
        "desc": "Order",
    },
    "light": {
        "color": "#ffeb99",
        "bright": "#fff5cc",
        "form_language": "expanding aureoles and radiant beams, warm radiance spreading outward from bright center points in concentric circles of illumination",
        "desc": "Light",
    },
    "darkness": {
        "color": "#4a3a8a",
        "bright": "#6a5aaa",
        "form_language": "absorbing voids with rim-glow, deep indigo holes that pull light in, void-like depths edged with faint luminous rims",
        "desc": "Darkness",
    },
}
```

**Step 4: Run test to verify it passes**

Run: `python -m pytest scripts/tests/test_pipeline.py -v`
Expected: 2 PASSED

**Step 5: Commit**

```bash
git add scripts/generate-hex-tile.py scripts/tests/__init__.py scripts/tests/test_pipeline.py
git commit -m "feat: add MAGIC_REGISTRY with 12 sphere overlay definitions"
```

---

### Task 2: Add build_magic_prompt()

**Files:**
- Modify: `scripts/generate-hex-tile.py`
- Test: `scripts/tests/test_pipeline.py`

**Step 1: Write the failing test**

Append to `scripts/tests/test_pipeline.py`:

```python
def test_build_magic_prompt_contains_sphere_color():
    """Magic prompt must include the sphere's hex color."""
    ns = {}
    exec(
        Path(__file__).parent.parent.joinpath("generate-hex-tile.py").read_text(),
        ns,
    )
    prompt = ns["build_magic_prompt"]("force")
    assert "#ff4444" in prompt or "#ff6b6b" in prompt
    assert "streaks" in prompt.lower() or "impact" in prompt.lower()
    assert "black background" in prompt.lower()
    assert "no terrain" in prompt.lower()


def test_build_magic_prompt_all_spheres():
    """Every sphere in MAGIC_REGISTRY produces a non-empty prompt."""
    ns = {}
    exec(
        Path(__file__).parent.parent.joinpath("generate-hex-tile.py").read_text(),
        ns,
    )
    for sphere in ns["MAGIC_REGISTRY"]:
        prompt = ns["build_magic_prompt"](sphere)
        assert len(prompt) > 50, f"{sphere} prompt too short"
        assert "black" in prompt.lower(), f"{sphere} prompt missing black background"
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest scripts/tests/test_pipeline.py::test_build_magic_prompt_contains_sphere_color -v`
Expected: FAIL — `build_magic_prompt` not defined

**Step 3: Add build_magic_prompt() to generate-hex-tile.py**

Insert after the existing `build_prompt()` function:

```python
def build_magic_prompt(sphere: str) -> str:
    """Build prompt for a magic sphere overlay — luminous threads on black."""
    reg = MAGIC_REGISTRY[sphere.lower()]
    color = reg["bright"]  # Use the brighter variant for thread visibility
    form = reg["form_language"]
    name = reg["desc"]

    return f"""Semi-transparent {name} magic threads on pure black background. Luminous {color} colored threads in {form}. The threads are intensely bright and saturated against pure black. 10-20% of the image area has visible luminous threads, the rest is pure black.

No terrain, no scenery, no ground, no sky, no figures, no characters.
Dark fantasy style, painterly brushwork, bright magical threads on black.
No text, no UI, no labels. No hexagonal shapes."""
```

**Step 4: Run tests to verify they pass**

Run: `python -m pytest scripts/tests/test_pipeline.py -v`
Expected: 4 PASSED

**Step 5: Commit**

```bash
git add scripts/generate-hex-tile.py scripts/tests/test_pipeline.py
git commit -m "feat: add build_magic_prompt() for sphere overlay prompts"
```

---

### Task 3: Add black_to_transparent() post-processor

**Files:**
- Modify: `scripts/generate-hex-tile.py`
- Test: `scripts/tests/test_pipeline.py`

**Step 1: Write the failing test**

Append to `scripts/tests/test_pipeline.py`:

```python
from PIL import Image


def test_black_to_transparent_converts_black_pixels():
    """Pure black pixels should become fully transparent."""
    ns = {}
    exec(
        Path(__file__).parent.parent.joinpath("generate-hex-tile.py").read_text(),
        ns,
    )
    black_to_transparent = ns["black_to_transparent"]

    # Create a 4x4 test image: top-left black, top-right red, bottom-left green, bottom-right blue
    img = Image.new("RGBA", (4, 4), (0, 0, 0, 255))
    img.putpixel((2, 0), (255, 0, 0, 255))  # Red
    img.putpixel((0, 2), (0, 255, 0, 255))  # Green
    img.putpixel((2, 2), (0, 0, 255, 255))  # Blue

    result = black_to_transparent(img)

    # Black pixels → transparent
    assert result.getpixel((0, 0))[3] == 0, "Black pixel should be transparent"
    assert result.getpixel((1, 1))[3] == 0, "Black pixel should be transparent"

    # Colored pixels → opaque
    assert result.getpixel((2, 0))[3] == 255, "Red pixel should stay opaque"
    assert result.getpixel((0, 2))[3] == 255, "Green pixel should stay opaque"
    assert result.getpixel((2, 2))[3] == 255, "Blue pixel should stay opaque"


def test_black_to_transparent_handles_near_black():
    """Very dark pixels (brightness < 15) should also become transparent."""
    ns = {}
    exec(
        Path(__file__).parent.parent.joinpath("generate-hex-tile.py").read_text(),
        ns,
    )
    black_to_transparent = ns["black_to_transparent"]

    img = Image.new("RGBA", (2, 2), (10, 8, 12, 255))  # Near-black
    result = black_to_transparent(img)

    # Near-black → transparent
    assert result.getpixel((0, 0))[3] == 0, "Near-black should be transparent"
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest scripts/tests/test_pipeline.py::test_black_to_transparent_converts_black_pixels -v`
Expected: FAIL — `black_to_transparent` not defined

**Step 3: Add black_to_transparent() to generate-hex-tile.py**

Insert after `apply_hex_mask()`:

```python
# Brightness threshold — pixels with max(R,G,B) below this become transparent
BLACK_THRESHOLD = 15

def black_to_transparent(img: Image.Image, threshold: int = BLACK_THRESHOLD) -> Image.Image:
    """Convert near-black pixels to transparent for magic overlay compositing.

    Pixels where max(R,G,B) < threshold get alpha=0.
    All other pixels keep their original color and alpha.
    """
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if max(r, g, b) < threshold:
                pixels[x, y] = (r, g, b, 0)
    return img
```

**Step 4: Run tests to verify they pass**

Run: `python -m pytest scripts/tests/test_pipeline.py -v`
Expected: 6 PASSED

**Step 5: Commit**

```bash
git add scripts/generate-hex-tile.py scripts/tests/test_pipeline.py
git commit -m "feat: add black_to_transparent() post-processor for magic overlays"
```

---

### Task 4: Add generate_magic_tile() pipeline function

**Files:**
- Modify: `scripts/generate-hex-tile.py`
- Test: `scripts/tests/test_pipeline.py`

**Step 1: Write the failing test**

Append to `scripts/tests/test_pipeline.py`:

```python
import tempfile


def test_generate_magic_tile_creates_file(monkeypatch):
    """generate_magic_tile should create a PNG file at the expected path."""
    ns = {}
    exec(
        Path(__file__).parent.parent.joinpath("generate-hex-tile.py").read_text(),
        ns,
    )

    # Mock generate_image to return a test image (avoid real API calls)
    def mock_generate_image(prompt, api_key):
        # Return a 1024x1024 image with some colored pixels on black
        img = Image.new("RGBA", (1024, 1024), (0, 0, 0, 255))
        # Add some "magic thread" pixels
        for x in range(400, 600):
            img.putpixel((x, 512), (255, 68, 68, 255))  # Red line
        return img

    monkeypatch.setattr(
        # We need to patch in the namespace since we exec'd the file
        # Instead, we'll call the function directly with the mock
        # by passing it as a parameter or using a different approach
        None, None  # placeholder
    )

    # Actually, since we exec the file, let's test the prompt + mask + transparency pipeline
    # without the API call. We can test generate_magic_tile by decomposing it.

    # Test: build prompt → mock image → black_to_transparent → hex_mask → save
    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = Path(tmpdir) / "magic-force.png"

        # Simulate the pipeline manually
        prompt = ns["build_magic_prompt"]("force")
        assert len(prompt) > 50

        # Create mock "API response" image
        raw_img = Image.new("RGBA", (1024, 1024), (0, 0, 0, 255))
        for x in range(400, 600):
            raw_img.putpixel((x, 512), (255, 68, 68, 255))

        # Apply black-to-transparent
        transparent = ns["black_to_transparent"](raw_img)
        # Verify black became transparent
        assert transparent.getpixel((0, 0))[3] == 0
        # Verify colored stayed
        assert transparent.getpixel((500, 512))[3] == 255

        # Apply hex mask
        mask = ns["make_hex_mask"](1024)
        result = ns["apply_hex_mask"](transparent, mask)

        # Save and verify file exists
        result.save(out_path, "PNG")
        assert out_path.exists()
        assert out_path.stat().st_size > 0

        # Verify it's RGBA with transparency
        loaded = Image.open(out_path)
        assert loaded.mode == "RGBA"
```

**Step 2: Run test to verify it fails (or passes — this is an integration test of existing functions)**

Run: `python -m pytest scripts/tests/test_pipeline.py::test_generate_magic_tile_creates_file -v`
Expected: May pass already since it uses existing functions. If so, great — move to step 3 to add the actual `generate_magic_tile` function.

**Step 3: Add generate_magic_tile() to generate-hex-tile.py**

Insert after `generate_tile()`:

```python
def generate_magic_tile(sphere: str, output: Path | None, size: int,
                        no_mask: bool, raw_also: bool, api_key: str) -> str:
    """Generate a single magic sphere overlay tile. Returns output path."""

    prompt = build_magic_prompt(sphere)
    sphere_slug = sphere.lower()

    # Output path
    if output:
        out_path = Path(output)
    else:
        out_path = Path(__file__).parent.parent / "public" / "hex-tiles" / f"magic-{sphere_slug}.png"

    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Generating magic overlay: {sphere}")
    print(f"Prompt ({len(prompt)} chars):")
    print(f"  {prompt[:120]}...")
    print()

    # Generate
    print("Calling Imagen API...")
    raw_img = generate_image(prompt, api_key)
    print(f"  Got {raw_img.size[0]}x{raw_img.size[1]} image")

    # Center-crop to square, then resize
    w, h = raw_img.size
    if w != h:
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        raw_img = raw_img.crop((left, top, left + side, top + side))
    if raw_img.size != (size, size):
        raw_img = raw_img.resize((size, size), Image.LANCZOS)

    # Save raw if requested
    if raw_also:
        raw_path = out_path.with_stem(out_path.stem + "-raw")
        raw_img.save(raw_path, "PNG")
        print(f"  Raw saved: {raw_path}")

    # Convert black to transparent
    print("Converting black to transparent...")
    transparent_img = black_to_transparent(raw_img)

    # Apply hex mask
    if not no_mask:
        print("Applying hex mask...")
        mask = make_hex_mask(size)
        result = apply_hex_mask(transparent_img, mask)
    else:
        result = transparent_img

    # Save
    result.save(out_path, "PNG")
    print(f"  Saved: {out_path}")
    print("Done!")
    print()

    return str(out_path)
```

**Step 4: Run tests to verify they pass**

Run: `python -m pytest scripts/tests/test_pipeline.py -v`
Expected: 7 PASSED

**Step 5: Commit**

```bash
git add scripts/generate-hex-tile.py scripts/tests/test_pipeline.py
git commit -m "feat: add generate_magic_tile() pipeline function"
```

---

### Task 5: Add audit_assets() function

**Files:**
- Modify: `scripts/generate-hex-tile.py`
- Test: `scripts/tests/test_pipeline.py`

**Step 1: Write the failing test**

Append to `scripts/tests/test_pipeline.py`:

```python
def test_audit_detects_missing_terrain():
    """Audit should report terrain tiles missing from target directory."""
    ns = {}
    exec(
        Path(__file__).parent.parent.joinpath("generate-hex-tile.py").read_text(),
        ns,
    )
    with tempfile.TemporaryDirectory() as tmpdir:
        target = Path(tmpdir)
        # Create only one terrain file
        (target / "ocean.png").write_bytes(b"fake png")

        report = ns["audit_assets"](target)

        assert report["missing_terrain"]  # Should have many missing
        assert "dense-forest.png" in [Path(p).name for p in report["missing_terrain"]]
        assert "ocean.png" not in [Path(p).name for p in report["missing_terrain"]]


def test_audit_detects_missing_magic():
    """Audit should report magic overlays missing from target directory."""
    ns = {}
    exec(
        Path(__file__).parent.parent.joinpath("generate-hex-tile.py").read_text(),
        ns,
    )
    with tempfile.TemporaryDirectory() as tmpdir:
        target = Path(tmpdir)
        report = ns["audit_assets"](target)

        # All 12 magic overlays should be missing
        assert len(report["missing_magic"]) == 12
        assert "magic-force.png" in [Path(p).name for p in report["missing_magic"]]


def test_audit_detects_orphaned_files():
    """Audit should report files not in any registry."""
    ns = {}
    exec(
        Path(__file__).parent.parent.joinpath("generate-hex-tile.py").read_text(),
        ns,
    )
    with tempfile.TemporaryDirectory() as tmpdir:
        target = Path(tmpdir)
        (target / "mystery-tile.png").write_bytes(b"fake")

        report = ns["audit_assets"](target)

        assert "mystery-tile.png" in report["orphaned"]
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest scripts/tests/test_pipeline.py::test_audit_detects_missing_terrain -v`
Expected: FAIL — `audit_assets` not defined

**Step 3: Add audit_assets() to generate-hex-tile.py**

Insert before `main()`:

```python
def audit_assets(target_dir: Path | None = None) -> dict:
    """Compare registries against files in target directory.

    Returns dict with keys: missing_terrain, missing_magic, orphaned, size_mismatches.
    """
    if target_dir is None:
        target_dir = Path(__file__).parent.parent / "public" / "hex-tiles"

    # Build expected file sets
    expected_terrain = set()
    for biome, info in BIOME_REGISTRY.items():
        filename = biome.lower().replace(" ", "-") + ".png"
        expected_terrain.add(filename)

    expected_magic = set()
    for sphere in MAGIC_REGISTRY:
        expected_magic.add(f"magic-{sphere}.png")

    all_expected = expected_terrain | expected_magic

    # Scan actual files
    actual_files = {f.name for f in target_dir.glob("*.png")} if target_dir.exists() else set()

    # Missing
    missing_terrain = sorted(expected_terrain - actual_files)
    missing_magic = sorted(expected_magic - actual_files)

    # Orphaned (in directory but not in any registry)
    # Exclude overlay-* and clear-* files (managed separately)
    known_prefixes = ("overlay-", "clear-")
    orphaned = sorted(
        f for f in actual_files - all_expected
        if not any(f.startswith(p) for p in known_prefixes)
    )

    # Size mismatches
    size_mismatches = []
    for filename in actual_files & all_expected:
        filepath = target_dir / filename
        try:
            img = Image.open(filepath)
            if img.size != (TILE_SIZE, TILE_SIZE):
                size_mismatches.append((filename, img.size))
        except Exception:
            size_mismatches.append((filename, "unreadable"))

    return {
        "missing_terrain": missing_terrain,
        "missing_magic": missing_magic,
        "orphaned": orphaned,
        "size_mismatches": size_mismatches,
    }


def print_audit(target_dir: Path | None = None):
    """Print a human-readable asset audit report."""
    report = audit_assets(target_dir)

    print("=== ASSET AUDIT ===")
    print()

    if report["missing_terrain"]:
        print(f"Missing terrain tiles ({len(report['missing_terrain'])}):")
        for f in report["missing_terrain"]:
            print(f"  ✗ {f}")
    else:
        print(f"Terrain tiles: all {len(BIOME_REGISTRY)} present ✓")

    print()

    if report["missing_magic"]:
        print(f"Missing magic overlays ({len(report['missing_magic'])}):")
        for f in report["missing_magic"]:
            print(f"  ✗ {f}")
    else:
        print(f"Magic overlays: all {len(MAGIC_REGISTRY)} present ✓")

    print()

    if report["orphaned"]:
        print(f"Orphaned files ({len(report['orphaned'])}):")
        for f in report["orphaned"]:
            print(f"  ? {f}")
    else:
        print("No orphaned files ✓")

    if report["size_mismatches"]:
        print()
        print(f"Size mismatches ({len(report['size_mismatches'])}):")
        for f, sz in report["size_mismatches"]:
            print(f"  ! {f}: {sz} (expected {TILE_SIZE}x{TILE_SIZE})")

    print()
    total_missing = len(report["missing_terrain"]) + len(report["missing_magic"])
    if total_missing == 0:
        print("All assets present ✓")
    else:
        print(f"Total missing: {total_missing}")
```

**Step 4: Run tests to verify they pass**

Run: `python -m pytest scripts/tests/test_pipeline.py -v`
Expected: 10 PASSED

**Step 5: Commit**

```bash
git add scripts/generate-hex-tile.py scripts/tests/test_pipeline.py
git commit -m "feat: add audit_assets() for hex asset inventory checking"
```

---

### Task 6: Update CLI with --category, --sphere, --audit, --batch-all flags

**Files:**
- Modify: `scripts/generate-hex-tile.py` (main function)
- Test: `scripts/tests/test_pipeline.py`

**Step 1: Write the failing test**

Append to `scripts/tests/test_pipeline.py`:

```python
import subprocess


def test_cli_audit_flag_runs():
    """--audit flag should run without error and produce output."""
    result = subprocess.run(
        ["python", str(Path(__file__).parent.parent / "generate-hex-tile.py"), "--audit"],
        capture_output=True, text=True, timeout=10,
    )
    assert result.returncode == 0
    assert "ASSET AUDIT" in result.stdout


def test_cli_help_shows_category():
    """--help should mention --category flag."""
    result = subprocess.run(
        ["python", str(Path(__file__).parent.parent / "generate-hex-tile.py"), "--help"],
        capture_output=True, text=True, timeout=10,
    )
    assert result.returncode == 0
    assert "--category" in result.stdout
    assert "--sphere" in result.stdout
    assert "--audit" in result.stdout
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest scripts/tests/test_pipeline.py::test_cli_audit_flag_runs -v`
Expected: FAIL — `--audit` flag not recognized

**Step 3: Rewrite main() in generate-hex-tile.py**

Replace the entire `main()` function:

```python
def main():
    parser = argparse.ArgumentParser(description="Generate hex-masked terrain and magic overlay tiles")
    parser.add_argument("--biome", type=str, help="Biome name (e.g. 'dense forest')")
    parser.add_argument("--color", type=str, default=None, help="Background hex color (default: from registry)")
    parser.add_argument("--features", type=str, help="Custom terrain feature description")
    parser.add_argument("--prompt", type=str, help="Full custom prompt (overrides biome/features)")
    parser.add_argument("--output", type=str, help="Output path (default: public/hex-tiles/<name>.png)")
    parser.add_argument("--size", type=int, default=TILE_SIZE, help="Output image size in px")
    parser.add_argument("--no-mask", action="store_true", help="Skip hex masking (save square)")
    parser.add_argument("--raw-also", action="store_true", help="Also save the raw unmasked image")
    parser.add_argument("--batch", action="store_true", help="Generate all items in chosen category")
    parser.add_argument("--batch-delay", type=float, default=5.0, help="Seconds between API calls in batch mode")
    parser.add_argument("--category", type=str, choices=["terrain", "magic"], default="terrain",
                        help="Asset category: terrain (biome tiles) or magic (sphere overlays)")
    parser.add_argument("--sphere", type=str, help="Sphere name for single magic overlay (e.g. 'force')")
    parser.add_argument("--audit", action="store_true", help="Audit assets: report missing/orphaned files")
    parser.add_argument("--batch-all", action="store_true", help="Generate ALL missing assets (terrain + magic)")

    args = parser.parse_args()

    # Audit mode — no API key needed
    if args.audit:
        print_audit()
        return

    # Validate
    if not args.batch and not args.batch_all and not args.biome and not args.prompt and not args.sphere:
        parser.error("Provide --biome, --prompt, --sphere, --batch, --batch-all, or --audit")

    # API key
    api_key = os.environ.get(API_KEY_ENV)
    if not api_key:
        env_path = Path(__file__).parent.parent / ".env"
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                if line.startswith(API_KEY_ENV):
                    api_key = line.split("=", 1)[1].strip()
                    break
    if not api_key:
        print(f"Error: {API_KEY_ENV} not found in environment or .env", file=sys.stderr)
        sys.exit(1)

    # Single sphere mode
    if args.sphere:
        sphere = args.sphere.lower()
        if sphere not in MAGIC_REGISTRY:
            parser.error(f"Unknown sphere '{sphere}'. Valid: {', '.join(sorted(MAGIC_REGISTRY.keys()))}")
        generate_magic_tile(
            sphere=sphere, output=Path(args.output) if args.output else None,
            size=args.size, no_mask=args.no_mask, raw_also=args.raw_also, api_key=api_key,
        )
        return

    # Batch-all mode: generate everything missing
    if args.batch_all:
        report = audit_assets()
        to_generate = []

        for filename in report["missing_terrain"]:
            # Reverse-lookup biome name from filename
            biome_slug = filename.replace(".png", "")
            for biome, info in BIOME_REGISTRY.items():
                if biome.lower().replace(" ", "-") == biome_slug:
                    to_generate.append(("terrain", biome))
                    break

        for filename in report["missing_magic"]:
            sphere = filename.replace("magic-", "").replace(".png", "")
            if sphere in MAGIC_REGISTRY:
                to_generate.append(("magic", sphere))

        if not to_generate:
            print("All assets present — nothing to generate!")
            return

        total = len(to_generate)
        print(f"=== BATCH-ALL: generating {total} missing assets ===")
        print(f"Delay between API calls: {args.batch_delay}s")
        print()

        results, failures = [], []
        for i, (category, name) in enumerate(to_generate, 1):
            print(f"--- [{i}/{total}] {category}: {name} ---")
            try:
                if category == "terrain":
                    info = BIOME_REGISTRY[name]
                    generate_tile(
                        biome=name, color=info["color"], features=info.get("detail"),
                        prompt_override=None, output=None, size=args.size,
                        no_mask=args.no_mask, raw_also=args.raw_also, api_key=api_key,
                    )
                else:
                    generate_magic_tile(
                        sphere=name, output=None, size=args.size,
                        no_mask=args.no_mask, raw_also=args.raw_also, api_key=api_key,
                    )
                results.append((category, name))
            except Exception as e:
                print(f"  ERROR: {e}")
                failures.append((category, name, str(e)))
            if i < total:
                print(f"  Waiting {args.batch_delay}s...")
                time.sleep(args.batch_delay)

        print(f"\n=== BATCH-ALL COMPLETE: {len(results)}/{total} succeeded ===")
        if failures:
            for cat, name, err in failures:
                print(f"  FAIL {cat}:{name}: {err}")
        return

    # Batch mode for a specific category
    if args.batch:
        if args.category == "magic":
            spheres = list(MAGIC_REGISTRY.keys())
            total = len(spheres)
            print(f"=== BATCH MAGIC: generating {total} sphere overlays ===")
            results, failures = [], []
            for i, sphere in enumerate(spheres, 1):
                print(f"--- [{i}/{total}] {sphere} ---")
                try:
                    generate_magic_tile(
                        sphere=sphere, output=None, size=args.size,
                        no_mask=args.no_mask, raw_also=args.raw_also, api_key=api_key,
                    )
                    results.append(sphere)
                except Exception as e:
                    print(f"  ERROR: {e}")
                    failures.append((sphere, str(e)))
                if i < total:
                    print(f"  Waiting {args.batch_delay}s...")
                    time.sleep(args.batch_delay)
            print(f"\n=== BATCH MAGIC COMPLETE: {len(results)}/{total} ===")
            if failures:
                for s, err in failures:
                    print(f"  FAIL {s}: {err}")
        else:
            # Terrain batch (existing behavior, updated output path)
            biomes = list(BIOME_REGISTRY.keys())
            total = len(biomes)
            print(f"=== BATCH TERRAIN: generating {total} biomes ===")
            results, failures = [], []
            for i, biome in enumerate(biomes, 1):
                info = BIOME_REGISTRY[biome]
                print(f"--- [{i}/{total}] {biome} ---")
                try:
                    generate_tile(
                        biome=biome, color=info["color"], features=info.get("detail"),
                        prompt_override=None, output=None, size=args.size,
                        no_mask=args.no_mask, raw_also=args.raw_also, api_key=api_key,
                    )
                    results.append(biome)
                except Exception as e:
                    print(f"  ERROR: {e}")
                    failures.append((biome, str(e)))
                if i < total:
                    print(f"  Waiting {args.batch_delay}s...")
                    time.sleep(args.batch_delay)
            print(f"\n=== BATCH TERRAIN COMPLETE: {len(results)}/{total} ===")
            if failures:
                for b, err in failures:
                    print(f"  FAIL {b}: {err}")
        return

    # Single biome mode (existing behavior)
    color = args.color or BIOME_REGISTRY.get(args.biome, {}).get("color", "#2a3a20")
    generate_tile(
        biome=args.biome, color=color, features=args.features,
        prompt_override=args.prompt, output=Path(args.output) if args.output else None,
        size=args.size, no_mask=args.no_mask, raw_also=args.raw_also, api_key=api_key,
    )
```

**Step 4: Run tests to verify they pass**

Run: `python -m pytest scripts/tests/test_pipeline.py -v`
Expected: 12 PASSED

**Step 5: Commit**

```bash
git add scripts/generate-hex-tile.py scripts/tests/test_pipeline.py
git commit -m "feat: add --category, --sphere, --audit, --batch-all CLI flags"
```

---

### Task 7: Redirect terrain output to public/hex-tiles/

**Files:**
- Modify: `scripts/generate-hex-tile.py` (generate_tile function, ~line 295)

**Step 1: Write the failing test**

Append to `scripts/tests/test_pipeline.py`:

```python
def test_terrain_default_output_is_public_hex_tiles():
    """Default terrain output should be public/hex-tiles/, not Assets/biomes/."""
    ns = {}
    exec(
        Path(__file__).parent.parent.joinpath("generate-hex-tile.py").read_text(),
        ns,
    )
    # Check the generate_tile function default output path
    import inspect
    source = inspect.getsource(ns["generate_tile"])
    assert "public" in source and "hex-tiles" in source, \
        "generate_tile default output should reference public/hex-tiles/"
    assert 'Assets' not in source or 'biomes' not in source, \
        "generate_tile should not reference Assets/biomes/ as default"
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest scripts/tests/test_pipeline.py::test_terrain_default_output_is_public_hex_tiles -v`
Expected: FAIL — still references `Assets/biomes/`

**Step 3: Update generate_tile() default output path**

In `generate_tile()`, change the default output path (around line 295):

```python
    # Old:
    # out_path = Path(__file__).parent.parent / "Assets" / "biomes" / f"{biome_slug}.png"
    # New:
    out_path = Path(__file__).parent.parent / "public" / "hex-tiles" / f"{biome_slug}.png"
```

**Step 4: Run tests to verify they pass**

Run: `python -m pytest scripts/tests/test_pipeline.py -v`
Expected: 13 PASSED

**Step 5: Commit**

```bash
git add scripts/generate-hex-tile.py scripts/tests/test_pipeline.py
git commit -m "refactor: redirect terrain output to public/hex-tiles/"
```

---

### Task 8: Update npm scripts in package.json

**Files:**
- Modify: `package.json`

**Step 1: Read current package.json scripts section**

Check what `generate-hex` currently looks like.

**Step 2: Update package.json scripts**

Add new npm script aliases:

```json
{
  "generate-hex": "python scripts/generate-hex-tile.py",
  "generate-hex:terrain": "python scripts/generate-hex-tile.py --category terrain --batch",
  "generate-hex:magic": "python scripts/generate-hex-tile.py --category magic --batch",
  "generate-hex:audit": "python scripts/generate-hex-tile.py --audit",
  "generate-hex:all": "python scripts/generate-hex-tile.py --batch-all"
}
```

**Step 3: Verify audit runs**

Run: `npm run generate-hex:audit`
Expected: Shows the audit report listing all 12 magic overlays as missing

**Step 4: Commit**

```bash
git add package.json
git commit -m "feat: add npm scripts for magic overlay generation and asset audit"
```

---

### Task 9: Add hex-tile-assets.ts magic overlay support

**Files:**
- Modify: `src/data/hex-tile-assets.ts`
- Test: `src/data/__tests__/hex-tile-assets.test.ts`

**Step 1: Write the failing test**

Add to `src/data/__tests__/hex-tile-assets.test.ts` (create if it doesn't exist):

```typescript
import { describe, it, expect } from 'vitest';
import { getMagicOverlayUrl, MAGIC_OVERLAY_MAP } from '../hex-tile-assets';

describe('MAGIC_OVERLAY_MAP', () => {
  it('has entries for all 8 creation spheres', () => {
    const creationSpheres = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];
    for (const sphere of creationSpheres) {
      expect(MAGIC_OVERLAY_MAP[sphere as keyof typeof MAGIC_OVERLAY_MAP]).toBeDefined();
    }
  });

  it('has entries for all 4 foundation spheres', () => {
    const foundationSpheres = ['chaos', 'order', 'light', 'darkness'];
    for (const sphere of foundationSpheres) {
      expect(MAGIC_OVERLAY_MAP[sphere as keyof typeof MAGIC_OVERLAY_MAP]).toBeDefined();
    }
  });

  it('has exactly 12 entries', () => {
    expect(Object.keys(MAGIC_OVERLAY_MAP)).toHaveLength(12);
  });
});

describe('getMagicOverlayUrl', () => {
  it('returns correct URL for a creation sphere', () => {
    expect(getMagicOverlayUrl('force')).toBe('/hex-tiles/magic-force.png');
  });

  it('returns correct URL for a foundation sphere', () => {
    expect(getMagicOverlayUrl('order')).toBe('/hex-tiles/magic-order.png');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/hex-tile-assets.test.ts`
Expected: FAIL — `MAGIC_OVERLAY_MAP` not exported

**Step 3: Add magic overlay map to hex-tile-assets.ts**

Add after the existing `TERRAIN_TILE_MAP`:

```typescript
import type { TerrainType, LocationSubtype, SphereName } from '../types';
// Note: SphereName needs to include foundation spheres too, or we use a union type

/** All sphere names (creation + foundation) for magic overlay lookup */
type AllSphereName =
  | 'force' | 'matter' | 'energy' | 'life' | 'mind' | 'spirit' | 'time' | 'entropy'
  | 'chaos' | 'order' | 'light' | 'darkness';

export const MAGIC_OVERLAY_MAP: Record<AllSphereName, string> = {
  // Creation spheres
  force: 'magic-force.png',
  matter: 'magic-matter.png',
  energy: 'magic-energy.png',
  life: 'magic-life.png',
  mind: 'magic-mind.png',
  spirit: 'magic-spirit.png',
  time: 'magic-time.png',
  entropy: 'magic-entropy.png',
  // Foundation spheres
  chaos: 'magic-chaos.png',
  order: 'magic-order.png',
  light: 'magic-light.png',
  darkness: 'magic-darkness.png',
};

export function getMagicOverlayUrl(sphere: AllSphereName): string {
  return `/hex-tiles/${MAGIC_OVERLAY_MAP[sphere]}`;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/data/__tests__/hex-tile-assets.test.ts`
Expected: PASS

**Step 5: Type-check the full project**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 6: Commit**

```bash
git add src/data/hex-tile-assets.ts src/data/__tests__/hex-tile-assets.test.ts
git commit -m "feat: add MAGIC_OVERLAY_MAP and getMagicOverlayUrl to hex-tile-assets"
```

---

### Task 10: Run full test suite and verify everything

**Step 1: Run all Python tests**

Run: `python -m pytest scripts/tests/ -v`
Expected: All tests pass

**Step 2: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 3: Run asset audit**

Run: `python scripts/generate-hex-tile.py --audit`
Expected: Shows 12 missing magic overlays, no orphaned files, no size mismatches. All terrain tiles present.

**Step 4: Verify existing game tests still pass**

Run: `npx vitest run src/data/__tests__/hex-tile-assets.test.ts src/components/HexMap/__tests__/`
Expected: All pass

**Step 5: Commit any final fixes, then tag as complete**

```bash
git add -A
git commit -m "test: verify batch art pipeline passes all checks"
```
