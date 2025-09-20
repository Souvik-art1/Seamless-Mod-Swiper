@@ -243,4 +243,112 @@
 
 
 # Hint: Override spec path for CI if needed
-# export SEAMLESS_SPEC_PATH="README.md"
+# export SEAMLESS_SPEC_PATH="README.md"
+# ---------------------------------------------------------------------------
+# Additional unit tests for _find_spec_path focusing on diffed helper logic.
+# Testing framework: pytest (runner/fixtures), compatible with existing style.
+# ---------------------------------------------------------------------------
+
+import pathlib
+import pytest
+
+# Minimal content blocks to satisfy marker checks used by _find_spec_path
+_CANDIDATE_ONLY_SPEC = (
+    "rngAlgoVersion\n"
+    "xoshiro256**\n"
+)
+_FULL_MARKERS_SPEC = (
+    "rngAlgoVersion\n"
+    "xoshiro256**\n"
+    "FlushFileBuffers\n"
+    "ReplaceFile\n"
+    "Redactor Utility\n"
+)
+_HEADER = "# Seamless-Mod-Swiper - Development Outline"
+_FULL_WITH_HEADER_SPEC = _HEADER + "\n" + _FULL_MARKERS_SPEC
+
+def _amk_write(tmp_path: pathlib.Path, rel: str, content: str) -> pathlib.Path:
+    p = tmp_path / rel
+    p.parent.mkdir(parents=True, exist_ok=True)
+    p.write_text(content, encoding="utf-8")
+    return p
+
+def test_find_spec_path_env_override_valid(monkeypatch, tmp_path):
+    # Given an explicit override, the function should return that exact file.
+    custom = _amk_write(tmp_path, "custom_spec.md", _FULL_WITH_HEADER_SPEC)
+    monkeypatch.setenv(SPEC_ENV_VAR, str(custom))
+    monkeypatch.chdir(tmp_path)
+    found = _find_spec_path()
+    assert isinstance(found, pathlib.Path)
+    assert found == custom
+
+def test_find_spec_path_env_override_missing_file(monkeypatch, tmp_path):
+    # If override points to a non-existent file, the search proceeds and ultimately
+    # falls back to default when nothing else matches.
+    monkeypatch.setenv(SPEC_ENV_VAR, str(tmp_path / "no-such.md"))
+    monkeypatch.chdir(tmp_path)
+    found = _find_spec_path()
+    assert isinstance(found, pathlib.Path)
+    assert found.name == "AGENTS.md"
+    assert not found.exists()
+
+def test_find_spec_path_prefers_candidates_with_markers(monkeypatch, tmp_path):
+    # Candidate AGENTS.md exists with required candidate markers; should be selected.
+    _amk_write(tmp_path, "AGENTS.md", _CANDIDATE_ONLY_SPEC)
+    monkeypatch.delenv(SPEC_ENV_VAR, raising=False)
+    monkeypatch.chdir(tmp_path)
+    assert _find_spec_path() == tmp_path / "AGENTS.md"
+
+def test_find_spec_path_falls_back_to_docs_candidates(monkeypatch, tmp_path):
+    # README.md exists but lacks markers; docs/AGENTS.md has markers and should be chosen.
+    _amk_write(tmp_path, "README.md", "random text without required markers")
+    target = _amk_write(tmp_path, "docs/AGENTS.md", _CANDIDATE_ONLY_SPEC)
+    monkeypatch.delenv(SPEC_ENV_VAR, raising=False)
+    monkeypatch.chdir(tmp_path)
+    assert _find_spec_path() == target
+
+def test_find_spec_path_rglob_fallback_when_no_candidates(monkeypatch, tmp_path):
+    # No default candidates present; rglob should discover a deep .md containing all markers.
+    target = _amk_write(tmp_path, "deep/nested/spec.md", _FULL_MARKERS_SPEC)
+    monkeypatch.delenv(SPEC_ENV_VAR, raising=False)
+    monkeypatch.chdir(tmp_path)
+    assert _find_spec_path() == target
+
+def test_find_spec_path_ignores_candidates_without_markers(monkeypatch, tmp_path):
+    # AGENTS.md exists but lacks markers; rglob should pick another .md that contains all markers.
+    _amk_write(tmp_path, "AGENTS.md", "this file intentionally lacks markers")
+    target = _amk_write(tmp_path, "elsewhere/spec.md", _FULL_MARKERS_SPEC)
+    monkeypatch.delenv(SPEC_ENV_VAR, raising=False)
+    monkeypatch.chdir(tmp_path)
+    assert _find_spec_path() == target
+
+def test_find_spec_path_skips_unreadable_candidates(monkeypatch, tmp_path):
+    # Simulate an unreadable candidate (read_text raises); function should continue searching
+    # and successfully select the next valid candidate.
+    unreadable = _amk_write(tmp_path, "README.md", "contents do not matter")
+    target = _amk_write(tmp_path, "docs/AGENTS.md", _CANDIDATE_ONLY_SPEC)
+
+    orig_read_text = pathlib.Path.read_text
+    def fake_read_text(self, encoding="utf-8", errors="ignore"):
+        # Only fail for the specific README.md in the temp dir
+        try:
+            if self.resolve() == unreadable.resolve():
+                raise OSError("simulated read failure")
+        except Exception:
+            # If resolve() fails for any reason, fall back to normal behavior
+            pass
+        return orig_read_text(self, encoding=encoding, errors=errors)
+
+    monkeypatch.setattr(pathlib.Path, "read_text", fake_read_text)
+    monkeypatch.delenv(SPEC_ENV_VAR, raising=False)
+    monkeypatch.chdir(tmp_path)
+    assert _find_spec_path() == target
+
+def test_find_spec_path_returns_default_when_nothing_found(monkeypatch, tmp_path):
+    # Absolutely no .md files present anywhere; should return the default candidate path.
+    monkeypatch.delenv(SPEC_ENV_VAR, raising=False)
+    monkeypatch.chdir(tmp_path)
+    found = _find_spec_path()
+    assert isinstance(found, pathlib.Path)
+    assert found.name == "AGENTS.md"
+    assert not found.exists()