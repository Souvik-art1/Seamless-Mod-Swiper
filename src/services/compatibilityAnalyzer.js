import nlp from 'compromise';

function containsAny(text, patterns) {
  if (!text) return false;
  const t = text.toLowerCase();
  return patterns.some((p) => new RegExp(p, 'i').test(t));
}

function endorsementBoost(mod) {
  const d = Number(mod?.unique_downloads || mod?.downloads || 0);
  const e = Number(mod?.endorsement_count || mod?.endorsements || 0);
  if (d <= 0) return 0;
  const ratio = e / d;
  if (ratio > 0.05 && e > 100) return 12;
  if (ratio > 0.02 && e > 50) return 8;
  if (ratio > 0.01 && e > 20) return 4;
  return 0;
}

function daysSince(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return Infinity;
  return (Date.now() - d.getTime()) / (1000 * 3600 * 24);
}

export function filterOutTranslation(mod) {
  const title = (mod?.name || '').toLowerCase();
  const summary = (mod?.summary || mod?.description || '').toLowerCase();
  const category = (mod?.category_name || '').toLowerCase();
  const tags = (mod?.tags || []).map((t) => (t.name || t).toLowerCase());
  if (category.includes('translation')) return true;
  if (tags.some((t) => t.includes('translation'))) return true;
  if (/\btranslation\b|\blocalization\b/.test(title) || /\btranslation\b|\blocalization\b/.test(summary)) return true;
  return false;
}

export async function analyzeCompatibility(mod, { shallow = false } = {}) {
  const reasons = [];
  const flags = [];
  let score = 70; // neutral base

  const releaseDate = (await window.api.store.get('compat.patch2_3_date')) || '2025-01-01';
  const updatedAt = mod?.updated_time || mod?.updated_at || mod?.last_update || mod?.created_time;
  if (updatedAt) {
    const after = new Date(updatedAt) >= new Date(releaseDate);
    if (after) { score += 18; reasons.push('Updated after 2.3 release'); }
    else { score -= 22; reasons.push('No update since before 2.3'); }
  }

  const text = `${mod?.summary || ''}\n${mod?.description || ''}`;
  if (containsAny(text, ['compatible with\s*2\\.3', 'supports\s*2\\.3', '2\\.3\s*compatible'])) {
    score += 18; reasons.push('Description mentions 2.3 compatibility');
  }
  if (containsAny(text, ['not\s*compatible\s*with\s*2\\.3', 'broken\s*on\s*2\\.3', 'incompatible\s*2\\.3'])) {
    score -= 28; reasons.push('Description mentions incompatibility'); flags.push('author-warning');
  }

  score += endorsementBoost(mod);

  if (!shallow) {
    try {
      const changelogs = await window.api.nexus.getChangelogs(mod.mod_id || mod.modId || mod.modid || mod.id);
      const changeText = JSON.stringify(changelogs);
      if (containsAny(changeText, ['2\\.3', '2\\.3\s*support'])) {
        score += 16; reasons.push('Changelog references 2.3');
      }
    } catch {}

    const enableCommentsScraping = (await window.api.store.get('filters.enableCommentsScraping')) ?? false;
    if (enableCommentsScraping) {
      try {
        const comments = await window.api.nexus.scrapeComments(mod.mod_id || mod.modId || mod.modid || mod.id, { limit: 80 });
        const joined = comments.join('\n').toLowerCase();
        const positive = (joined.match(/(works (on|with)|compatible|no issues) (2\.3|2,3)/g) || []).length;
        const negative = (joined.match(/(broken|not working|incompatible|crash|nvgp) (on|with) (2\.3|2,3)/g) || []).length;
        if (positive >= 2) { score += 12; reasons.push('Multiple comments confirm 2.3 works'); }
        if (negative >= 2) { score -= 26; reasons.push('Multiple comments report issues on 2.3'); flags.push('reports'); }
      } catch {}
    }
  }

  // Clamp and decisions
  if (score < 20) return { score: Math.max(0, Math.min(100, score)), reasons, flags, exclude: true };
  return { score: Math.max(0, Math.min(100, score)), reasons, flags, exclude: false };
}
