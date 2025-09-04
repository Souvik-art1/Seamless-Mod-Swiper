export class Storage {
  async get(key, def = null) {
    const v = await window.api.store.get(key);
    return v === undefined ? def : v;
  }

  async set(key, value) {
    await window.api.store.set(key, value);
    return value;
  }

  async getSeenMods() {
    return (await this.get('session.seen', [])) || [];
  }

  async markSeen(mod) {
    const id = mod.mod_id || mod.modId || mod.modid || mod.id;
    const seen = new Set(await this.getSeenMods());
    seen.add(id);
    await this.set('session.seen', Array.from(seen));
  }

  async getAcceptedMods() {
    return (await this.get('accepted', [])) || [];
  }

  async acceptMod(mod) {
    const accepted = await this.getAcceptedMods();
    const id = mod.mod_id || mod.modId || mod.modid || mod.id;
    const name = mod.name;
    const url = `https://www.nexusmods.com/cyberpunk2077/mods/${id}`;
    const score = mod.__compat?.score ?? 0;
    accepted.unshift({ id, name, url, score, acceptedAt: new Date().toISOString() });
    await this.set('accepted', accepted);
    return accepted;
  }

  async clearAccepted() {
    await this.set('accepted', []);
  }
}
