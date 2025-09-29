// src/lib/tts.ts
/** Build a TTS-friendly string from markdown:
 *  - skip code/mechanics/aside blocks
 *  - add spoken transitions for headings (except "Setting")
 *  - keep bullets readable
 */

function stripBlocks(md: string): string {
    if (!md) return '';
    return md
      // code fences
      .replace(/```[\s\S]*?```/g, '')
      // blockquotes (often meta or recaps)
      .replace(/^>.*$/gm, '')
      // mechanics labels or explicit asides
      .replace(/^\s*Mechanical[s]?:.*$/gmi, '')
      .replace(/\[aside:.*?\]/gmi, '')
      // custom tts off/on fences if present
      .replace(/<!--\s*tts:off\s*-->[\s\S]*?<!--\s*tts:on\s*-->/g, '');
  }
  
  type Section = { title?: string; lines: string[] };
  
  function splitIntoSections(md: string): Section[] {
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const sections: Section[] = [];
    let current: Section = { lines: [] };
  
    const pushCurrent = () => {
      if (current.lines.length || current.title) sections.push(current);
      current = { lines: [] };
    };
  
    for (const raw of lines) {
      const line = raw.replace(/\s+$/,''); // rtrim
      const h = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/); // heading
      if (h) {
        pushCurrent();
        current.title = h[2].trim();
        continue;
      }
      current.lines.push(line);
    }
    pushCurrent();
    return sections;
  }
  
  function cleanLine(line: string): string {
    return line
      .replace(/[*_`]/g, '')          // emphasis/backticks
      .replace(/^---+$/g, '')         // hrules
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  function normalizeBullet(line: string): string | null {
    // Convert a bullet to a short spoken line
    const m = line.match(/^\s*[-*•]\s+(.*)$/);
    if (!m) return null;
    const text = cleanLine(m[1]);
    if (!text) return null;
    // Use an em dash for a pleasant pause
    return `• ${text}`;
  }
  
  function humanTransition(title: string): string | null {
    const t = title.trim();
    if (!t) return null;
  
    // Don't speak "Setting" – it's just prose
    if (/^setting$/i.test(t)) return null;
  
    // Special phrasing for common sections
    if (/^key\s*factions?$/i.test(t)) return 'And now a little about our Key Factions.';
    if (/^factions?$/i.test(t)) return 'Let’s meet the factions at play.';
    if (/^nodes?$/i.test(t)) return 'Here are the key locations and nodes.';
    if (/^characters?$/i.test(t)) return 'Let’s talk about the characters.';
    if (/^npcs?$/i.test(t)) return 'A quick note on notable NPCs.';
    if (/^recap/i.test(t) || /previously/i.test(t)) return 'Previously, on our story:';
    if (/^tone$/i.test(t)) return 'The mood for this tale:';
    if (/^consequences?/i.test(t)) return 'Consequences to keep in mind:';
  
    // Generic fallback
    return `And now a little about our ${t}.`;
  }
  
  export function extractProseForTTS(md: string): string {
    if (!md) return '';
    let s = stripBlocks(md);
    const sections = splitIntoSections(s);
  
    const out: string[] = [];
  
    for (const sec of sections) {
      const title = sec.title?.trim();
      const transition = title ? humanTransition(title) : null;
  
      // Gather readable lines from the section
      const lines: string[] = [];
      for (const raw of sec.lines) {
        if (!raw.trim()) continue;
        const bullet = normalizeBullet(raw);
        if (bullet) { lines.push(bullet); continue; }
        const cleaned = cleanLine(raw);
        if (cleaned) lines.push(cleaned);
      }
  
      if (lines.length === 0) continue;
  
      if (transition) out.push(transition);
      out.push(lines.join('\n'));
    }
  
    // Collapse excess whitespace and trim
    return out.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  