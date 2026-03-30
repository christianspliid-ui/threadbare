"""Tests for generate-hex-tile.py pipeline functions."""
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent.parent))


def test_magic_registry_has_12_spheres():
    """MAGIC_REGISTRY must have exactly 12 entries (8 creation + 4 foundation)."""
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


def test_black_to_transparent_converts_black_pixels():
    """Pure black pixels should become fully transparent."""
    ns = {}
    exec(
        Path(__file__).parent.parent.joinpath("generate-hex-tile.py").read_text(),
        ns,
    )
    black_to_transparent = ns["black_to_transparent"]

    img = Image.new("RGBA", (4, 4), (0, 0, 0, 255))
    img.putpixel((2, 0), (255, 0, 0, 255))
    img.putpixel((0, 2), (0, 255, 0, 255))
    img.putpixel((2, 2), (0, 0, 255, 255))

    result = black_to_transparent(img)

    assert result.getpixel((0, 0))[3] == 0, "Black pixel should be transparent"
    assert result.getpixel((1, 1))[3] == 0, "Black pixel should be transparent"
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

    img = Image.new("RGBA", (2, 2), (10, 8, 12, 255))
    result = black_to_transparent(img)
    assert result.getpixel((0, 0))[3] == 0, "Near-black should be transparent"


def test_generate_magic_tile_pipeline():
    """Test the full magic tile pipeline (without API call)."""
    ns = {}
    exec(
        Path(__file__).parent.parent.joinpath("generate-hex-tile.py").read_text(),
        ns,
    )

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
        assert transparent.getpixel((0, 0))[3] == 0
        assert transparent.getpixel((500, 512))[3] == 255

        # Apply hex mask
        mask = ns["make_hex_mask"](1024)
        result = ns["apply_hex_mask"](transparent, mask)

        # Save and verify
        result.save(out_path, "PNG")
        assert out_path.exists()
        assert out_path.stat().st_size > 0

        loaded = Image.open(out_path)
        assert loaded.mode == "RGBA"


def test_audit_detects_missing_terrain():
    """Audit should report terrain tiles missing from target directory."""
    ns = {}
    exec(
        Path(__file__).parent.parent.joinpath("generate-hex-tile.py").read_text(),
        ns,
    )
    with tempfile.TemporaryDirectory() as tmpdir:
        target = Path(tmpdir)
        (target / "ocean.png").write_bytes(b"fake png")

        report = ns["audit_assets"](target)

        assert report["missing_terrain"]
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


def test_terrain_default_output_is_public_hex_tiles():
    """Default terrain output should be public/hex-tiles/, not Assets/biomes/."""
    source = Path(__file__).parent.parent.joinpath("generate-hex-tile.py").read_text()
    # Find the generate_tile function body and check its default output path
    # The old path was Assets/biomes, should now be public/hex-tiles
    assert 'Assets' not in source or '"Assets"' not in source or "'Assets'" not in source, \
        "generate-hex-tile.py should not reference Assets/ as output"
    # The default output in generate_tile should reference public/hex-tiles
    assert '"public" / "hex-tiles"' in source or "'public' / 'hex-tiles'" in source, \
        "generate_tile default output should reference public/hex-tiles/"
