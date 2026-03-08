"""Tests for generate-hex-tile.py pipeline functions."""
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
