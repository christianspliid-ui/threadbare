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
