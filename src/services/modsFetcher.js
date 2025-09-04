import { analyzeCompatibility, filterOutTranslation } from './compatibilityAnalyzer.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class ModsFetcher {
  async getShuffledMods() {
    const [includeAdult, excludeTranslations] = await Promise.all([
      window.api.store.get('filters.includeAdult'),
      window.api.store.get('filters.excludeTranslations')
    ]);

    const page1 = await window.api.nexus.fetchLatestMods({ page: 1, size: 100 });
    const page2 = await window.api.nexus.fetchLatestMods({ page: 2, size: 100 });
    let mods = [...(page1 || []), ...(page2 || [])];

    if (excludeTranslations) {
      mods = mods.filter((m) => !filterOutTranslation(m));
    }

    // Include adult mods by default; if disabled, filter out
    if (includeAdult === false) mods = mods.filter((m) => !m.contains_adult_content && !m.adult);

    // Precompute lightweight compatibility if possible
    const basic = await Promise.all(mods.slice(0, 200).map(async (m) => {
      try {
        const compat = await analyzeCompatibility(m, { shallow: true });
        m.__compat = compat;
      } catch {}
      return m;
    }));

    return shuffle(basic);
  }

  async exportAcceptedMods() {
    const accepted = (await window.api.store.get('accepted')) || [];

    // TXT
    const lines = accepted.map((m) => `${m.name} — ${m.url}`);
    const txt = lines.join('\n');
    // CSV
    const csvHeader = 'id,name,url,score,acceptedAt';
    const csvLines = accepted.map((m) => `${m.id},"${m.name.replace(/"/g,'""')}",${m.url},${Math.round(m.score)},${m.acceptedAt}`);
    const csv = [csvHeader, ...csvLines].join('\n');
    // JSON
    const json = JSON.stringify(accepted, null, 2);

    await window.api.export.saveFile({ defaultPath: 'accepted-mods.txt', filters: [{ name: 'Text', extensions: ['txt'] }], content: txt });
    await window.api.export.saveFile({ defaultPath: 'accepted-mods.csv', filters: [{ name: 'CSV', extensions: ['csv'] }], content: csv });
    await window.api.export.saveFile({ defaultPath: 'accepted-mods.json', filters: [{ name: 'JSON', extensions: ['json'] }], content: json });
  }
}
