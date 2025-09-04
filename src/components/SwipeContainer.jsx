import React, { useEffect, useMemo, useRef, useState } from 'react';
import TinderCard from 'react-tinder-card';
import ModCard from './ModCard.jsx';
import { Storage } from '../services/storage.js';
import { analyzeCompatibility } from '../services/compatibilityAnalyzer.js';

const storage = new Storage();

export default function SwipeContainer({ mods, onAccept, onReject }) {
  const [queue, setQueue] = useState([]);
  const childRefs = useRef([]);

  useEffect(() => {
    (async () => {
      const seen = new Set(await storage.getSeenMods());
      const filtered = [];
      for (const mod of mods) {
        if (!mod || seen.has(mod.mod_id || mod.modId || mod?.mod_id || mod?.modid)) continue;
        const compat = await analyzeCompatibility(mod);
        if (compat?.exclude) continue;
        mod.__compat = compat;
        filtered.push(mod);
      }
      childRefs.current = filtered.map(() => React.createRef());
      setQueue(filtered);
    })();
  }, [mods]);

  const onSwipe = async (dir, mod, index) => {
    await storage.markSeen(mod);
    if (dir === 'right') await onAccept(mod);
    else await onReject(mod);
    // remove card
    setQueue((q) => q.filter((_, i) => i !== index));
  };

  const onOpen = async (mod) => {
    const url = `https://www.nexusmods.com/cyberpunk2077/mods/${mod.mod_id || mod.modId || mod.modid}`;
    await window.api.shell.openExternal(url);
  };

  useEffect(() => {
    const handler = (e) => {
      if (!queue.length) return;
      const topIndex = 0;
      const topRef = childRefs.current[topIndex];
      if (!topRef?.current) return;
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') topRef.current.swipe('right');
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') topRef.current.swipe('left');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [queue]);

  if (!queue.length) return <div className="status">No more mods to review. Adjust filters or fetch more.</div>;

  return (
    <div className="swipe-container">
      {queue.map((mod, index) => (
        <TinderCard
          ref={childRefs.current[index]}
          className="swipe"
          key={mod.mod_id || mod.modId || mod.modid}
          onSwipe={(dir) => onSwipe(dir, mod, index)}
          preventSwipe={["up", "down"]}
        >
          <ModCard mod={mod} onOpen={onOpen} />
        </TinderCard>
      ))}
    </div>
  );
}
