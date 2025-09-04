import axios from 'axios';
import { load as cheerioLoad } from 'cheerio';

const BASE_URL = 'https://api.nexusmods.com/v1';
const GAME_DOMAIN = 'cyberpunk2077';

export class NexusAPI {
  constructor({ getApiKey }) {
    this.getApiKey = getApiKey;
  }

  get headers() {
    const key = this.getApiKey();
    return {
      'accept': 'application/json',
      'apikey': key,
      'Nexus-API-Key': key,
      'User-Agent': 'Seamless-Mod-Swiper/0.1 (by Scrapybara)'
    };
  }

  async fetchLatestMods({ page = 1, size = 100 } = {}) {
    const url = `${BASE_URL}/games/${GAME_DOMAIN}/mods/latest`;
    const res = await axios.get(url, { headers: this.headers, params: { page, size } });
    return res.data || [];
  }

  async getModDetails(id) {
    const url = `${BASE_URL}/games/${GAME_DOMAIN}/mods/${id}`;
    const res = await axios.get(url, { headers: this.headers });
    return res.data;
  }

  async getChangelogs(id) {
    const url = `${BASE_URL}/games/${GAME_DOMAIN}/mods/${id}/changelogs`;
    const res = await axios.get(url, { headers: this.headers });
    return res.data || [];
  }

  async scrapeComments(id, { limit = 40 } = {}) {
    const url = `https://www.nexusmods.com/${GAME_DOMAIN}/mods/${id}?tab=posts`;
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36' }
    });
    const $ = cheerioLoad(res.data);
    const comments = [];
    $(".comment-content, .comment-body, .comment-text, .text")
      .each((_i, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 10) comments.push(text);
      });
    return comments.slice(0, limit);
  }
}
