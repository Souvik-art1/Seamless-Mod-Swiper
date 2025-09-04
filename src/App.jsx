import React, { useEffect, useMemo, useState } from 'react';
import SwipeContainer from './components/SwipeContainer.jsx';
import AcceptedModsList from './components/AcceptedModsList.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import { ModsFetcher } from './services/modsFetcher.js';
import { Storage } from './services/storage.js';

const storage = new Storage();
const fetcher = new ModsFetcher();

export default function App() {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [acceptedMods, setAcceptedMods] = useState([]);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    (async () => {
      const savedAccepted = await storage.getAcceptedMods();
      setAcceptedMods(savedAccepted);
      await loadMods();
    })();
  }, []);

  const loadMods = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await fetcher.getShuffledMods();
      setMods(list);
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Failed to load mods.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (mod) => {
    const accepted = await storage.acceptMod(mod);
    setAcceptedMods(accepted);
    setReviewedCount((c) => c + 1);
  };

  const handleReject = async (_mod) => {
    setReviewedCount((c) => c + 1);
  };

  const onSettingsSave = async () => {
    await loadMods();
    setShowSettings(false);
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="brand">
          <span className="accent">Seamless</span> Mod Swiper
        </div>
        <div className="header-actions">
          <div className="progress">Reviewed: {reviewedCount}</div>
          <button className="btn" onClick={() => setShowSettings(true)}>Settings</button>
          <button className="btn" onClick={() => fetcher.exportAcceptedMods()}>Export</button>
        </div>
      </header>
      <main className="app-main">
        <section className="cards">
          {loading && <div className="status">Loading mods…</div>}
          {error && <div className="error">{error}</div>}
          {!loading && !error && (
            <SwipeContainer mods={mods} onAccept={handleAccept} onReject={handleReject} />
          )}
        </section>
        <aside className="sidebar">
          <AcceptedModsList mods={acceptedMods} />
        </aside>
      </main>

      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} onSave={onSettingsSave} />
      )}
      <footer className="app-footer">Cyberpunk-inspired UI • Nexus Mods API</footer>
    </div>
  );
}
