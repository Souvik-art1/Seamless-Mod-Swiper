import React, { useEffect, useState } from 'react';

export default function SettingsPanel({ onClose, onSave }) {
  const [apiKey, setApiKey] = useState('');
  const [includeAdult, setIncludeAdult] = useState(true);
  const [excludeTranslations, setExcludeTranslations] = useState(true);
  const [enableCommentsScraping, setEnableCommentsScraping] = useState(false);
  const [patchReleaseDate, setPatchReleaseDate] = useState('2025-01-01');

  useEffect(() => {
    (async () => {
      setApiKey(await window.api.nexus.getApiKey());
      setIncludeAdult((await window.api.store.get('filters.includeAdult')) ?? true);
      setExcludeTranslations((await window.api.store.get('filters.excludeTranslations')) ?? true);
      setEnableCommentsScraping((await window.api.store.get('filters.enableCommentsScraping')) ?? false);
      setPatchReleaseDate((await window.api.store.get('compat.patch2_3_date')) || '2025-01-01');
    })();
  }, []);

  const save = async () => {
    if (apiKey) await window.api.nexus.setApiKey(apiKey);
    await window.api.store.set('filters.includeAdult', includeAdult);
    await window.api.store.set('filters.excludeTranslations', excludeTranslations);
    await window.api.store.set('filters.enableCommentsScraping', enableCommentsScraping);
    await window.api.store.set('compat.patch2_3_date', patchReleaseDate);
    onSave?.();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Settings</h3>
          <button className="btn close" onClick={onClose}>×</button>
        </div>
        <div className="form">
          <label>Nexus API Key
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Paste your Nexus Mods API Key" />
          </label>
          <label>Include adult-flagged mods
            <input type="checkbox" checked={includeAdult} onChange={(e) => setIncludeAdult(e.target.checked)} />
          </label>
          <label>Exclude translation mods
            <input type="checkbox" checked={excludeTranslations} onChange={(e) => setExcludeTranslations(e.target.checked)} />
          </label>
          <label>Enable comments scraping (experimental)
            <input type="checkbox" checked={enableCommentsScraping} onChange={(e) => setEnableCommentsScraping(e.target.checked)} />
          </label>
          <label>Patch 2.3 release date
            <input type="date" value={patchReleaseDate} onChange={(e) => setPatchReleaseDate(e.target.value)} />
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
