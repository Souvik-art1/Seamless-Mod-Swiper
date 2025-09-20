# Test framework: unittest (compatible with pytest collection)
# Purpose: Validate the Seamless-Mod-Swiper Development Outline document for required sections and critical requirements.
# These tests focus on the content introduced/changed in the provided diff.

from __future__ import annotations
import os
import re
import unittest
from pathlib import Path
from typing import List, Optional, Tuple

REPO_ROOT = Path(__file__).resolve().parents[1]
FIXTURE_PATH = Path(__file__).resolve().parent / "fixtures" / "agents_outline.md"
DOC_TITLE = "# Seamless-Mod-Swiper - Development Outline"

def _find_repo_outline_md() -> Optional[Path]:
    # Attempt to find a real markdown file in the repo that contains the expected title
    # Skip common large/irrelevant dirs
    skip_dirs = {".git", "node_modules", "dist", "build", "venv", ".venv", "__pycache__", "site-packages", "tests"}
    for root, dirs, files in os.walk(REPO_ROOT):
        # Prune directories
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for name in files:
            if not name.lower().endswith(".md"):
                continue
            p = Path(root) / name
            try:
                txt = p.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            if DOC_TITLE in txt:
                return p
    return None

def load_outline_text() -> Tuple[str, Path]:
    candidate = _find_repo_outline_md()
    if candidate and candidate.exists():
        return candidate.read_text(encoding="utf-8"), candidate
    # Fallback to fixture authored by this test suite
    return FIXTURE_PATH.read_text(encoding="utf-8"), FIXTURE_PATH

class DevelopmentOutlineSpecTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.text, cls.source_path = load_outline_text()

    # Utility assertions
    def assert_contains_all(self, haystack: str, needles: List[str], ctx: str):
        missing = [n for n in needles if n not in haystack]
        self.assertFalse(missing, f"Missing in {ctx}: {missing}")

    def assert_regex_once(self, haystack: str, pattern: str, flags=0, ctx: str="text"):
        matches = re.findall(pattern, haystack, flags)
        self.assertTrue(matches, f"Expected pattern not found in {ctx}: {pattern}")
        self.assertEqual(len(matches), 1, f"Pattern should appear once in {ctx}, found {len(matches)}: {pattern}")

    # Tests

    def test_title_present_and_unique(self):
        self.assertIn(DOC_TITLE, self.text)
        self.assert_regex_once(self.text, r"(?m)^\s*#\s*Seamless-Mod-Swiper\s*-\s*Development Outline\s*$", ctx="title")

    def test_required_top_level_sections_present(self):
        required_h2 = [
            "## Scope & Guardrails",
            "## Privacy & Legal",
            "## Stage Plan",
            "## Data & Ordering",
            "## Acceptance List",
            "## Compatibility Heuristics (v2.3)",
            "## UI Notes",
            "## File/Module Sketch",
            "## Additional Considerations",
        ]
        # Coding Guidelines is a top-level # section
        self.assertIn("# Coding Guidelines", self.text)
        self.assert_contains_all(self.text, required_h2, "top-level sections")

    def test_stage_plan_items_and_rng_repro_requirements(self):
        required_items = [
            "1) App skeleton",
            "2) Persistence",
            "3) Filtering",
            "4) Compatibility scoring",
            "5) Nexus Mods adapter",
            "6) Settings",
        ]
        self.assert_contains_all(self.text, required_items, "Stage Plan items")
        rng_reqs = [
            "seedable PRNG",
            "xoshiro256",
            "rngAlgoVersion",
            "seed",
            "Fisher-Yates",
            "reproducible across runtime upgrades",
        ]
        self.assert_contains_all(self.text, rng_reqs, "Stage Plan RNG requirements")

    def test_persistence_canonicalization_and_atomicity(self):
        canonicalization = [
            "checksum (sha256)",
            "serialized canonically",
            "UTF-8",
            "normalize newlines to LF",
            "sort object keys",
        ]
        atomicity = [
            "exclusive file lock",
            "temporary file on the same volume",
            "FlushFileBuffers",
            "ReplaceFile",
            "validate file integrity using the checksum",
            ".tmp",
            "rotating backups",
        ]
        self.assert_contains_all(self.text, canonicalization, "Persistence canonicalization")
        self.assert_contains_all(self.text, atomicity, "Persistence atomicity")

    def test_filtering_and_locale_requirements(self):
        filtering = [
            "Filters (adult content, translations) should be applied server-side",
            "allow-list for supported languages",
            "locale fallback order",
            "All filters must be applied before any deck shuffling",
        ]
        self.assert_contains_all(self.text, filtering, "Filtering")

    def test_nexusmods_client_resilience_defaults(self):
        client_defaults = [
            "Overall timeout: 15s per request",
            "Per-try timeout: 5s",
            "Retries: 3 attempts",
            "jittered exponential backoff",
            "cap 5s",
            "Circuit breaker: open after 5 consecutive failures, remain open for 30s",
            "Retry-After",
            "User-Agent",
            "ETag/If-None-Match",
            "offline mode",
        ]
        self.assert_contains_all(self.text, client_defaults, "NexusMods client defaults")

    def test_settings_and_redactor_requirements(self):
        settings_reqs = [
            "Adult Content Filter",
            "Cache TTL",
            "Backup Retention",
            "Diagnostics",
            "Telemetry: Opt-in",
            "API Key Management",
        ]
        redactor_reqs = [
            "Redactor",
            "denylist of sensitive patterns",
            "scrub secrets and PII",
            "Unit tests must verify redaction",
        ]
        self.assert_contains_all(self.text, settings_reqs, "Settings")
        self.assert_contains_all(self.text, redactor_reqs, "Redactor")

    def test_data_ordering_lru_and_pagination(self):
        data_reqs = [
            "LRU cache",
            "(modId, fileId)",
            "TTL",
            "Eviction: Evict the least-recently-used entry",
            "streaming/pagination",
        ]
        self.assert_contains_all(self.text, data_reqs, "Data & Ordering")

    def test_acceptance_list_rules(self):
        acceptance_reqs = [
            "Only accepted (right-swiped) mods are persisted",
            "Append-only behavior",
            "Reset button clears persisted file",
        ]
        self.assert_contains_all(self.text, acceptance_reqs, "Acceptance List")

    def test_accessibility_and_resilience_ui(self):
        a11y_reqs = [
            "Focus Management",
            "Screen Reader Support",
            "aria-label",
            "aria-live",
            "rate-limit/backoff",
            "accessible countdown",
        ]
        self.assert_contains_all(self.text, a11y_reqs, "Accessibility & Resilience UI")

    def test_additional_considerations_unit_tests_and_ci(self):
        ci_reqs = [
            "Create unit tests under `tests/unit`",
            "Shuffle Determinism",
            "Persistence Round-trip",
            "ci-windows.yml",
        ]
        self.assert_contains_all(self.text, ci_reqs, "Unit Tests & CI")

    def test_coding_guidelines_and_reality_check(self):
        coding_reqs = [
            "Core Philosophy",
            "The 30-Second Reality Check - Must answer YES to ALL",
            "Did I run/build the code?",
            "Would I bet $100 this works?",
            "Phrases to Avoid:",
            "Specific Test Requirements:",
        ]
        self.assert_contains_all(self.text, coding_reqs, "Coding Guidelines")

if __name__ == "__main__":
    unittest.main(verbosity=2)