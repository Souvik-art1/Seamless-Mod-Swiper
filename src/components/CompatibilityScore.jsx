import React, { useState } from 'react';

export default function CompatibilityScore({ score = 0, reasons = [], flags = [] }) {
  const [open, setOpen] = useState(false);
  const color = score >= 80 ? '#35ff6b' : score >= 60 ? '#ffd23f' : score >= 40 ? '#ff8c42' : '#ff3b3b';
  return (
    <div className="compat" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <div className="bar" style={{ background: color }} title={`Compatibility: ${Math.round(score)}%`}>
        {Math.round(score)}%
      </div>
      {open && (
        <div className="tooltip">
          <div className="label">Patch 2.3 compatibility</div>
          <ul>
            {reasons.map((r, i) => (<li key={i}>{r}</li>))}
            {flags.length ? <li className="flags">Flags: {flags.join(', ')}</li> : null}
          </ul>
        </div>
      )}
    </div>
  );
}
