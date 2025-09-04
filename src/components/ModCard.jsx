import React from 'react';
import CompatibilityScore from './CompatibilityScore.jsx';

export default function ModCard({ mod, onOpen }) {
  const image = mod?.picture_url || mod?.picture || (mod?.images && mod.images[0]?.url) || '';
  const description = (mod?.summary || mod?.description || '').slice(0, 260);
  const downloads = mod?.downloads || mod?.downloads_file || mod?.unique_downloads || 0;
  const endorsements = mod?.endorsement_count || mod?.endorsements || 0;
  const updated = mod?.updated_time || mod?.updated_at || mod?.last_update || mod?.version || '';

  return (
    <div className="mod-card">
      <div className="image" style={{ backgroundImage: `url(${image})` }} />
      <div className="content">
        <div className="title-row">
          <h3 className="title">{mod?.name}</h3>
          <CompatibilityScore score={mod.__compat?.score || 0} reasons={mod.__compat?.reasons || []} flags={mod.__compat?.flags || []} />
        </div>
        <div className="meta">
          <span>by {mod?.author || mod?.user?.name || 'Unknown'}</span>
          <span>•</span>
          <span>v{mod?.version || '—'}</span>
          <span>•</span>
          <span>{new Intl.NumberFormat().format(downloads)} downloads</span>
          <span>•</span>
          <span>{new Intl.NumberFormat().format(endorsements)} endorsements</span>
        </div>
        <p className="desc">{description}{description.length >= 260 ? '…' : ''}</p>
        <div className="actions">
          <button className="btn subtle" onClick={() => onOpen(mod)}>Open on Nexus</button>
          <span className="updated">Last update: {String(updated).slice(0, 10)}</span>
        </div>
      </div>
    </div>
  );
}
