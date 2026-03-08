"""Tests for generate-hex-tile.py pipeline functions."""
import sys
from pathlib import Path

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
