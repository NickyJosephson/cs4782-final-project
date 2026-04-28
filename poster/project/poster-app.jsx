/* Main app: tabs + scaling + tweaks */

const { useState, useEffect, useRef, useLayoutEffect } = React;

const VARIANTS = [
  { id: 'A', name: 'A · Classic 3-col', subtitle: 'Traditional 3-column academic poster', Comp: window.VariantA },
  { id: 'B', name: 'B · Hero-driven', subtitle: 'Big central qualitative grid as anchor', Comp: window.VariantB },
  { id: 'C', name: 'C · Pipeline forward', subtitle: 'Horizontal pipeline anchors the top half', Comp: window.VariantC },
  { id: 'D', name: 'D · Magazine rail', subtitle: 'Bold dark left rail, content right', Comp: window.VariantD },
  { id: 'B1', name: 'B1 · Temperature gauge', subtitle: 'Hero + hot↔cold gauge across the top', Comp: window.VariantB1 },
  { id: 'B2', name: 'B2 · Frost pane', subtitle: 'Hero + freeze/thaw window-pane metaphor', Comp: window.VariantB2 },
  { id: 'B3', name: 'B3 · Equation as art', subtitle: 'Hero + Alg 2 update rule as typographic centerpiece', Comp: window.VariantB3 },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showGrid": false,
  "showSafeMargin": true,
  "accent": "cool-blue",
  "paperTone": "warm"
}/*EDITMODE-END*/;

const ACCENTS = {
  'cool-blue':   'oklch(0.72 0.09 230)',
  'frost-cyan':  'oklch(0.74 0.08 210)',
  'ice-violet':  'oklch(0.70 0.09 280)',
  'mint':        'oklch(0.74 0.08 170)',
  'warm-rust':   'oklch(0.68 0.12 40)',
};
const ACCENT_SOFT = {
  'cool-blue':   'oklch(0.93 0.04 230)',
  'frost-cyan':  'oklch(0.94 0.035 210)',
  'ice-violet':  'oklch(0.93 0.04 280)',
  'mint':        'oklch(0.94 0.035 170)',
  'warm-rust':   'oklch(0.93 0.05 40)',
};
const PAPER = {
  'warm':    { paper: '#fafaf7', paper2: '#f3f2ec' },
  'cool':    { paper: '#f7f9fb', paper2: '#eef2f6' },
  'neutral': { paper: '#f8f8f8', paper2: '#efefef' },
};

function App() {
  const [active, setActive] = useState('B1');
  const [tweaks, setTweak] = window.useTweaks
    ? window.useTweaks(TWEAK_DEFAULTS)
    : [TWEAK_DEFAULTS, () => {}];

  // Apply theme tweaks via CSS vars on :root
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--accent', ACCENTS[tweaks.accent] || ACCENTS['cool-blue']);
    r.style.setProperty('--accent-soft', ACCENT_SOFT[tweaks.accent] || ACCENT_SOFT['cool-blue']);
    const p = PAPER[tweaks.paperTone] || PAPER['warm'];
    r.style.setProperty('--paper', p.paper);
    r.style.setProperty('--paper-2', p.paper2);
  }, [tweaks.accent, tweaks.paperTone]);

  // Scale poster to fit viewport
  const stageRef = useRef(null);
  const [scale, setScale] = useState(0.7);
  useLayoutEffect(() => {
    function fit() {
      const pad = 80; // some breathing room
      const availW = window.innerWidth - pad;
      const availH = window.innerHeight - 200; // chrome + meta
      const s = Math.min(availW / 1800, availH / 1200, 1);
      setScale(Math.max(0.25, s));
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const Active = VARIANTS.find(v => v.id === active).Comp;
  const meta = VARIANTS.find(v => v.id === active);

  const posterClasses = ['poster'];
  if (tweaks.showGrid) posterClasses.push('with-grid');
  if (tweaks.showSafeMargin) posterClasses.push('with-margin');

  return (
    <>
      <div className="chrome">
        <h1>Cold Diffusion · Poster Wireframes</h1>
        <span className="sub">36″ × 24″ landscape · CS 4782 final</span>
        <div className="tabs">
          {VARIANTS.map(v => (
            <button key={v.id}
              className={'tab' + (active === v.id ? ' active' : '')}
              onClick={() => setActive(v.id)}>
              {v.name}
            </button>
          ))}
        </div>
      </div>

      <div className="stage" ref={stageRef}>
        <div className="poster-shell" style={{
          width: 1800 * scale + 36,
        }}>
          <div className="poster-meta">
            <span>{meta.name} — {meta.subtitle}</span>
            <span>scale {(scale * 100).toFixed(0)}% · grid {tweaks.showGrid ? 'on' : 'off'}</span>
          </div>
          <div style={{
            width: 1800 * scale,
            height: 1200 * scale,
            overflow: 'hidden',
          }}>
            <div className={posterClasses.join(' ')}
                 style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <Active />
            </div>
          </div>
          <div className="poster-meta" style={{ marginTop: 10, marginBottom: 0 }}>
            <span>tip: tab A/B/C/D · open Tweaks for layout/density toggles</span>
            <span>placeholder content — fill with real numbers + figures</span>
          </div>
        </div>
      </div>

      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection label="Layout aids">
            <window.TweakToggle
              label="Show 0.5″ grid"
              checked={tweaks.showGrid}
              onChange={v => setTweak('showGrid', v)} />
            <window.TweakToggle
              label="Show safe margin"
              checked={tweaks.showSafeMargin}
              onChange={v => setTweak('showSafeMargin', v)} />
          </window.TweakSection>
          <window.TweakSection label="Color">
            <window.TweakSelect
              label="Accent"
              value={tweaks.accent}
              onChange={v => setTweak('accent', v)}
              options={[
                { value: 'cool-blue',  label: 'Cool blue (default)' },
                { value: 'frost-cyan', label: 'Frost cyan' },
                { value: 'ice-violet', label: 'Ice violet' },
                { value: 'mint',       label: 'Mint' },
                { value: 'warm-rust',  label: 'Warm rust (contrarian)' },
              ]} />
            <window.TweakRadio
              label="Paper"
              value={tweaks.paperTone}
              onChange={v => setTweak('paperTone', v)}
              options={[
                { value: 'warm',    label: 'Warm' },
                { value: 'cool',    label: 'Cool' },
                { value: 'neutral', label: 'Neutral' },
              ]} />
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
