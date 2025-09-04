import React from 'react';
import { Storage } from '../services/storage.js';

const storage = new Storage();

export default function AcceptedModsList({ mods }) {
  const open = async (m) => {
    const url = `https://www.nexusmods.com/cyberpunk2077/mods/${m.id}`;
    await window.api.shell.openExternal(url);
  };
  const clear = async () => {
    await storage.clearAccepted();
    window.location.reload();
  };

  return (
    <div className="accepted">
      <div className="header">
        <h3>Accepted Mods</h3>
        <button className="btn subtle" onClick={clear}>Clear</button>
      </div>
      <ul>
        {mods.map((m) => (
          <li key={m.id}>
            <div>
              <div className="name">{m.name}</div>
              <div className="meta">Score: {Math.round(m.score)}% • {new Date(m.acceptedAt).toLocaleString()}</div>
            </div>
            <button className="btn link" onClick={() => open(m)}>Open</button>
          </li>
        ))}
        {!mods.length && <div className="empty">No accepted mods yet</div>}
      </ul>
    </div>
  );
}
