import unittest
import types, sys

# Tests for Seamless-Mod-Swiper Development Outline document.
# Testing library/framework: pytest (preferred), with plain asserts and regex checks.
import os
import re
import pathlib
import pytest

# Allow overriding the spec path via env var for CI flexibility
SPEC_ENV_VAR = "SEAMLESS_SPEC_PATH"
DEFAULT_SPEC_CANDIDATES = [
    "AGENTS.md",
    "README.md",
    "docs/AGENTS.md",
    "docs/README.md",
]
UNIQUE_MARKERS = [
    r"^#\s*Seamless-Mod-Swiper\s*-\s*Development Outline",
    r"\brngAlgoVersion\b",
    r"xoshiro256\*\*",
    r"\bFlushFileBuffers\b",
    r"\bReplaceFile\b",
    r"\bRedactor Utility\b",
]

def _find_spec_path() -> pathlib.Path:
    # 1) Use env override if set
    override = os.getenv(SPEC_ENV_VAR)
    if override:
        p = pathlib.Path(override)
        if p.is_file():
            return p

    # 2) Search among common candidates
    for cand in DEFAULT_SPEC_CANDIDATES:
        p = pathlib.Path(cand)
        if p.is_file():
            try:
                text = p.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            if all(re.search(m, text, flags=re.MULTILINE) for m in [UNIQUE_MARKERS[1], UNIQUE_MARKERS[2]]):
                return p

    # 3) Last resort: scan all .md files for unique markers
    for md in pathlib.Path(".").rglob("*.md"):
        try:
            text = md.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        if all(re.search(m, text, flags=re.MULTILINE) for m in UNIQUE_MARKERS[1:]):
            return md

    # If not found, default to a candidate; tests will emit helpful failure
    return pathlib.Path(DEFAULT_SPEC_CANDIDATES[0])

@pytest.fixture(scope="module")
def spec_text():
    path = _find_spec_path()
    if not path.exists():
        pytest.fail(
            f"Spec file not found. Searched common locations; set {SPEC_ENV_VAR} to the spec path.",
            pytrace=False,
        )
    txt = path.read_text(encoding="utf-8", errors="ignore")
    # Smoke-check that this is indeed the expected outline
    header_ok = re.search(UNIQUE_MARKERS[0], txt, flags=re.MULTILINE) is not None
    if not header_ok:
        pytest.fail(
            f"Spec file {path} does not contain the expected outline header. "
            f"Set {SPEC_ENV_VAR} correctly or update tests.",
            pytrace=False,
        )
    return txt

def test_outline_has_required_top_sections(spec_text):
    required_h2 = [
        r"^##\s*Scope\s*&\s*Guardrails",
        r"^##\s*Privacy\s*&\s*Legal",
        r"^##\s*Stage Plan",
        r"^##\s*Data\s*&\s*Ordering",
        r"^##\s*Acceptance List",
        r"^##\s*Compatibility Heuristics\s*\(v2\.3\)",
        r"^##\s*UI Notes",
        r"^##\s*File/Module Sketch",
        r"^##\s*Additional Considerations",
        r"^#\s*Coding Guidelines",  # switches back to H1 later
    ]
    for pat in required_h2:
        assert re.search(pat, spec_text, flags=re.MULTILINE), f"Missing section: {pat}"

def test_rng_and_shuffle_reproducibility_requirements(spec_text):
    # Check for mandated PRNG and reproducibility hooks
    patterns = [
        r"xoshiro256\*\*",
        r"\brngAlgoVersion\b",
        r"seed\b",
        r"Fisher-Yates",
        r"Allow an optional seed and algorithm version parameter",
    ]
    for pat in patterns:
        assert re.search(pat, spec_text, flags=re.IGNORECASE), f"Missing RNG requirement: {pat}"

def test_persistence_atomic_windows_steps(spec_text):
    steps = [
        r"Acquire an exclusive file lock",
        r"Write to a temporary file on the same volume",
        r"FlushFileBuffers",
        r"ReplaceFile",
        r"validate file integrity using the checksum",
    ]
    for s in steps:
        assert s in spec_text, f"Missing atomic write step: {s}"

def test_persistence_checksum_and_canonical_json(spec_text):
    assert re.search(r"\bsha256\b", spec_text, re.IGNORECASE)
    canon_parts = [
        r"UTF-8 encoding",
        r"normalize newlines to LF",
        r"sort object keys lexicographically",
        r"consistent whitespace and number formatting",
    ]
    for p in canon_parts:
        assert p in spec_text, f"Missing canonical JSON requirement: {p}"

def test_persistence_schema_fields(spec_text):
    # Verify presence of schemaVersion, fileId, scoringVersion, checksum and entry fields
    assert re.search(r"\bschemaVersion\b.*\binteger\b", spec_text, re.IGNORECASE | re.DOTALL)
    for key in ["fileId", "scoringVersion", "checksum"]:
        assert key in spec_text, f"Missing top-level field: {key}"
    for entry_key in ["id", "game", "targetPatch", "title", "author", "url", "acceptedAt", "score", "rationale"]:
        assert entry_key in spec_text, f"Missing entry field: {entry_key}"

def test_filters_and_ordering_rules(spec_text):
    must_haves = [
        r"Filters.*applied server-side",
        r"locale fallback order",
        r"All filters must be applied before any deck shuffling",
    ]
    for pat in must_haves:
        assert re.search(pat, spec_text, re.IGNORECASE | re.DOTALL), f"Missing filter/order rule: {pat}"

def test_scoring_versioning_and_rationale(spec_text):
    assert re.search(r"\bscoringVersion\b.*incremented", spec_text, re.IGNORECASE | re.DOTALL)
    assert re.search(r"Persist the rationale.*alongside the score", spec_text, re.IGNORECASE | re.DOTALL)

def test_nexus_client_resilience_defaults(spec_text):
    defaults = {
        r"Overall timeout:\s*15s": "overall timeout 15s",
        r"Per-try timeout:\s*5s": "per-try timeout 5s",
        r"Retries:\s*3": "retries 3",
        r"jittered exponential backoff.*200–500ms.*cap 5s": "jitter backoff config",
        r"Circuit breaker.*open after 5 consecutive failures.*30s": "circuit breaker defaults",
        r"ETag/If-None-Match": "cache validation",
    }
    for pat, msg in defaults.items():
        assert re.search(pat, spec_text, re.IGNORECASE | re.DOTALL), f"Missing resilience default: {msg}"

def test_offline_mode_and_caching_headers(spec_text):
    for pat in [r"\boffline mode\b", r"\bRetry-After\b", r"\bUser-Agent\b"]:
        assert re.search(pat, spec_text, re.IGNORECASE), f"Missing client header/offline requirement: {pat}"

def test_accessibility_and_resilience_ui_requirements(spec_text):
    bullets = [
        r"Focus Management",
        r"Screen Reader Support",
        r"aria-live",
        r"Resilience UI States",
        r"Automated accessibility tests",
    ]
    for b in bullets:
        assert re.search(b, spec_text, re.IGNORECASE), f"Missing accessibility item: {b}"

def test_lru_cache_policy(spec_text):
    for pat in [r"\bLRU\b", r"Cache Key.*\(modId, fileId\)", r"TTL", r"Eviction.*least-recently-used"]:
        assert re.search(pat, spec_text, re.IGNORECASE | re.DOTALL), f"Missing LRU cache policy: {pat}"

def test_acceptance_list_rules(spec_text):
    rules = [r"Only accepted.*persisted", r"Append-only", r"Reset button clears"]
    for rpat in rules:
        assert re.search(rpat, spec_text, re.IGNORECASE | re.DOTALL), f"Missing acceptance rule: {rpat}"

def test_unit_tests_and_ci_requirements(spec_text):
    asserts = [
        r"Create unit tests under `tests/unit`",
        r"Shuffle Determinism",
        r"Persistence Round-trip",
        r"\.github/workflows/ci-windows\.yml",
    ]
    for a in asserts:
        assert re.search(a, spec_text, re.IGNORECASE), f"Missing unit test/CI directive: {a}"

def test_redactor_utility_requirements(spec_text):
    assert re.search(r"\bRedactor\b.*denylist.*secrets", spec_text, re.IGNORECASE | re.DOTALL)
    assert re.search(r"Unit tests must verify redaction", spec_text, re.IGNORECASE)

def test_coding_guidelines_presence(spec_text):
    musts = [
        r"^#\s*Coding Guidelines",
        r"The 30-Second Reality Check",
        r"Phrases to Avoid",
        r"Specific Test Requirements",
    ]
    for m in musts:
        assert re.search(m, spec_text, re.MULTILINE), f"Missing coding guideline subsection: {m}"

def test_no_scraping_guardrails(spec_text):
    # Enforce API-only policy and adult content default off
    assert re.search(r"only the official Nexus Mods API", spec_text, re.IGNORECASE)
    assert re.search(r"Adult content is opt-in.*Default:\s*Off", spec_text, re.IGNORECASE | re.DOTALL)

class TestAgentsMdWithUnittest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import os, re, pathlib
        cls.re = re
        cls.path = None
        override = os.getenv("SEAMLESS_SPEC_PATH")
        candidates = ["AGENTS.md", "README.md", "docs/AGENTS.md", "docs/README.md"]
        if override and pathlib.Path(override).is_file():
            cls.path = pathlib.Path(override)
        if cls.path is None:
            for c in candidates:
                p = pathlib.Path(c)
                if p.is_file():
                    cls.path = p
                    break
        if cls.path is None:
            raise AssertionError("Spec file not found. Set SEAMLESS_SPEC_PATH env var.")
        cls.text = cls.path.read_text(encoding="utf-8", errors="ignore")
        assert re.search(r"^#\\s*Seamless-Mod-Swiper\\s*-\\s*Development Outline", cls.text, re.MULTILINE)

    def _assert_in(self, pattern_or_text, msg):
        if pattern_or_text.startswith('^'):
            self.assertRegex(self.text, pattern_or_text, msg=msg)
        else:
            self.assertIn(pattern_or_text, self.text, msg)

    def test_has_scope_guardrails(self):
        self.assertRegex(self.text, r"^##\\s*Scope\\s*&\\s*Guardrails", msg="Missing Scope & Guardrails")


# Hint: Override spec path for CI if needed
# export SEAMLESS_SPEC_PATH="README.md"