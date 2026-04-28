/* Three creative tilts on the Hero layout (Variant B):
   B1 — Temperature gauge across the top (Hot ↔ Cold metaphor)
   B2 — Frost-pane progression (forward = freezing, reverse = thawing)
   B3 — Equation-as-art (Algorithm 2 update rule as typographic centerpiece)
   All three share the Hero spine: title strip, left/right rails, big center.
*/

/* ---------------- Shared bits used across B1/B2/B3 ---------------- */

function HeroPH({ label, h, w, cold, warm, frost, src, style }) {
  const cls = ['ph'];
  if (cold) cls.push('cold');
  let extraStyle = {};
  if (warm) extraStyle = {
    background: 'repeating-linear-gradient(45deg, oklch(0.94 0.04 40), oklch(0.94 0.04 40) 6px, var(--paper) 6px, var(--paper) 12px)',
    borderColor: 'var(--warn)',
    color: 'oklch(0.4 0.12 40)'
  };
  if (frost) extraStyle = {
    background: 'radial-gradient(circle at 30% 30%, #fff 0, var(--accent-soft) 60%, oklch(0.85 0.06 230) 100%)',
    borderColor: 'var(--accent)',
    color: 'oklch(0.3 0.09 230)'
  };
  // If src is provided, render the image filling the cell
  if (src) {
    const borderColor = cold ? 'var(--accent)' : warm ? 'var(--warn)' : 'var(--ink)';
    return (
      <div className={cls.join(' ')} style={{
        height: h, width: w,
        padding: 0, overflow: 'hidden',
        background: '#000', borderColor,
        ...style
      }}>
        <img src={src} alt={label || ''} style={{
          width: '100%', height: '100%', display: 'block',
          objectFit: 'cover',
          transform: 'scale(1.18)',
          transformOrigin: 'center',
          imageRendering: 'pixelated'
        }} />
      </div>);

  }
  return (
    <div className={cls.join(' ')} style={{ height: h, width: w, ...extraStyle, ...style }}>
      {label}
    </div>);

}

/* MNIST image map — digit 42 is the primary "hero" digit used in the qual grid;
   digits 0 and 17 are used in the stability/drift strips and as supplementary samples. */
const MNIST = {
  primary: {
    x0: 'images/mnist/mnist_42_x0.png',
    xHalf: 'images/mnist/mnist_0_xHalf.png', // only digit 0 has a half-blur sample
    xT: 'images/mnist/mnist_42_xT.png',
    direct: 'images/mnist/mnist_42_direct.png',
    alg1: 'images/mnist/mnist_42_alg1.png',
    alg2: 'images/mnist/mnist_42_alg2.png'
  },
  // Other digits, for stability/drift strips
  d0: {
    x0: 'images/mnist/mnist_0_x0.png',
    xT: 'images/mnist/mnist_0_xT.png',
    direct: 'images/mnist/mnist_0_direct.png',
    alg1: 'images/mnist/mnist_0_alg1.png',
    alg2: 'images/mnist/mnist_0_alg2.png'
  },
  d17: {
    x0: 'images/mnist/mnist_17_x0.png',
    xT: 'images/mnist/mnist_17_xT.png',
    direct: 'images/mnist/mnist_17_direct.png',
    alg2: 'images/mnist/mnist_17_alg2.png'
  }
};

/* CIFAR-10 image map — sample 17 used as the hero across the qualitative row. */
const CIFAR = {
  primary: {
    x0: 'images/cifar10/cifar_17_x0.png',
    xHalf: 'images/cifar10/cifar_17_xHalf_v2.png',
    xT: 'images/cifar10/cifar_17_xT_v2.png',
    direct: 'images/cifar10/cifar_17_direct.png',
    alg1: 'images/cifar10/cifar_17_alg1.png',
    alg2: 'images/cifar10/cifar_17_alg2.png'
  }
};

/* Five-column qual-grid spec.
   Group A (FORWARD, degrade): clean → mid-blur → fully blurred.
   Group B (REVERSE, restore): one-shot vs iterative, both starting from x_T.
*/
const QUAL_COLS = [
{ group: 'forward', title: 'Original', sub: 'x\u2080', src: MNIST.primary.x0, srcCifar: CIFAR.primary.x0 },
{ group: 'forward', title: 'Mid-blur', sub: 'D(x\u2080, T/2)', src: MNIST.primary.xHalf, srcCifar: CIFAR.primary.xHalf },
{ group: 'forward', title: 'Fully blurred', sub: 'D(x\u2080, T) = x\u209C', src: MNIST.primary.xT, srcCifar: CIFAR.primary.xT },
{ group: 'reverse', title: 'Direct', sub: 'R(x\u209C, T)', src: MNIST.primary.direct, srcCifar: CIFAR.primary.direct },
{ group: 'reverse', title: 'Algo 1', sub: 'naive sampler', src: MNIST.primary.alg1, srcCifar: CIFAR.primary.alg1 },
{ group: 'reverse', title: 'Algo 2', sub: 'improved sampler', src: MNIST.primary.alg2, srcCifar: CIFAR.primary.alg2 }];


/* Shared 5-col qualitative grid with grouped headers.
   FORWARD bracket spans the first 3 columns, REVERSE bracket spans the last 2.
   `cellH` controls cell height; `compact` shrinks header text. */
/* Sampling trajectory: how the running x_s evolves at each step of Algo 2.
   6 timesteps, sampled left → right (s = T … 0).
   For digit 42 we have the start (x_T) and the end (Algo 2 output) — middle 4
   columns are placeholders until those snapshots are generated.
*/
const TRAJ_STEPS = ['s=5', 's=4', 's=3', 's=2', 's=1', 's=0'];

const TRAJ_MNIST = {
  alg2: [
  'images/mnist/mnist_42_alg2_s5.png', // s=5 (start = fully blurred)
  'images/mnist/mnist_42_alg2_s4.png',
  'images/mnist/mnist_42_alg2_s3.png',
  'images/mnist/mnist_42_alg2_s2.png',
  'images/mnist/mnist_42_alg2_s1.png',
  'images/mnist/mnist_42_alg2_s0.png' // s=0 (final reconstruction)
  ]
};

/* CIFAR-10 trajectory. Files are named by sampling step index 0..50 where
   higher index = more blurred. Reverse trajectory (display order, blur → clean)
   walks s50 → s00. */
const TRAJ_CIFAR = {
  alg2: [
  'assets/cifar_alg2_s50.png', // most blurred (start of reverse sampling)
  'assets/cifar_alg2_s40.png',
  'assets/cifar_alg2_s30.png',
  'assets/cifar_alg2_s20.png',
  'assets/cifar_alg2_s10.png',
  'assets/cifar_alg2_s00.png' // final (sharpest)
  ]
};

function TrajRow({ label, srcs, cellH = 90, compact = false }) {
  const labelW = 100;
  const colTpl = `${labelW}px repeat(6, ${cellH}px)`;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: colTpl, justifyContent: 'start', alignItems: 'center' }}>
      <div className="hand-bold" style={{
        fontSize: compact ? 15 : 17,
        lineHeight: 1.1
      }}>
        {label}
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: compact ? 10 : 11,
          color: 'var(--accent)',
          letterSpacing: '0.05em',
          fontWeight: 'normal',
          marginTop: 2
        }}>· Algo 2</div>
      </div>
      {srcs.map((src, i) =>
      <HeroPH key={i} label={src ? '' : '—'} h={cellH} w={cellH}
      cold={!!src}
      src={src || undefined} />
      )}
    </div>);

}

function TrajGrid({ cellH = 110, datasets = ['MNIST', 'CIFAR-10'], compact = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 10 }}>
      {datasets.map((d) =>
      <TrajRow key={d} label={d}
      cellH={cellH}
      compact={compact}
      srcs={d === 'MNIST' ? TRAJ_MNIST.alg2 : TRAJ_CIFAR.alg2} />
      )}
    </div>);

}

function QualGridGrouped({ cellH = 90, compact = false, datasets = ['MNIST', 'CIFAR-10'] }) {
  const labelW = 100;
  const nForward = QUAL_COLS.filter((c) => c.group === 'forward').length;
  const nReverse = QUAL_COLS.filter((c) => c.group === 'reverse').length;
  const nCols = QUAL_COLS.length;
  // Fixed-size cells; grid stretches to full width via justify-content: space-between
  const colTpl = `${labelW}px repeat(${nCols}, ${cellH}px)`;
  const gridStyle = { display: 'grid', gridTemplateColumns: colTpl, justifyContent: 'start', alignItems: 'center' };
  const titleSize = compact ? 11 : 12;
  const subSize = compact ? 9 : 10;
  const groupSize = compact ? 11 : 12;

  return (
    <>
      {/* Group bracket row */}
      <div style={{ ...gridStyle, alignItems: 'end', marginBottom: 2 }}>
        <div></div>
        <div style={{
          gridColumn: `2 / span ${nForward}`,
          textAlign: 'center',
          fontFamily: 'var(--mono)',
          fontSize: groupSize,
          letterSpacing: '0.12em',
          color: 'var(--ink-2)',
          textTransform: 'uppercase',
          borderBottom: '1.5px solid var(--ink)',
          paddingBottom: 3,
          marginBottom: 2
        }}>
          Forward · degrade x₀
        </div>
        <div style={{
          gridColumn: `${2 + nForward} / span ${nReverse}`,
          textAlign: 'center',
          fontFamily: 'var(--mono)',
          fontSize: groupSize,
          letterSpacing: '0.12em',
          color: 'var(--accent)',
          textTransform: 'uppercase',
          borderBottom: `1.5px solid var(--accent)`,
          paddingBottom: 3,
          marginBottom: 2
        }}>
          Reverse · restore from x_T
        </div>
      </div>
      {/* Column header row: title + sub */}
      <div style={{ ...gridStyle, alignItems: 'end' }}>
        <div></div>
        {QUAL_COLS.map((c, i) =>
        <div key={i} style={{
          textAlign: 'center',
          paddingBottom: 4,
          color: c.group === 'reverse' ? 'var(--accent)' : 'var(--ink)'
        }}>
            <div style={{ fontFamily: 'var(--hand-bold)', fontSize: titleSize, lineHeight: 1.1 }}>
              {c.title}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: subSize, color: 'var(--ink-3)', marginTop: 2 }}>
              {c.sub}
            </div>
          </div>
        )}
      </div>
      {/* Data rows */}
      {datasets.map((d) =>
      <div key={d} style={gridStyle}>
          <div className="hand-bold" style={{ fontSize: compact ? 15 : 17 }}>{d}</div>
          {QUAL_COLS.map((c, i) =>
        <HeroPH key={i} label="" h={cellH} w={cellH}
        cold={c.group === 'reverse' || c.group === 'forward' && i > 0}
        src={d === 'MNIST' ? c.src : c.srcCifar} />
        )}
        </div>
      )}
    </>);

}

function MiniSnowflake({ size = 12, opacity = 1, style }) {
  return <span style={{ fontSize: size, color: 'var(--accent)', opacity, ...style }}>❄</span>;
}

function HeroAuthors() {
  return (
    <div className="hand" style={{ fontSize: 16, color: 'var(--ink-2)', lineHeight: 1.35, textAlign: 'center' }}>
      <strong style={{ color: 'var(--ink)' }}>
        Nicholas Josephson · Julius Samwer · Kevin Rodriguez · Tudor Braicu
      </strong>
      <br />
      <span style={{ fontSize: 13 }}>Cornell University · CS 4782 Deep Learning · Spring 2026</span>
    </div>);

}

function HeroSect({ num, title, hint, children, style }) {
  return (
    <div style={style}>
      <div className="sect" style={{ width: "480px" }}>
        <span className="num">{num}.</span>
        <span className="ttl">{title}</span>
        {hint && <span className="hint">{hint}</span>}
      </div>
      {children}
    </div>);

}

/* Our reproduced numbers (from the team's run). Paper numbers are the
   originally reported values from Bansal et al. — fill in where we have
   them; "—" if the paper didn't report that cell for this method. */
const RESULTS = {
  MNIST: {
    degraded: { ours: { fid: 402.96, ssim: 0.0112, rmse: 0.3068 }, paper: { fid: 368.56, ssim: 0.178, rmse: 0.231 } },
    direct: { ours: { fid: 23.03, ssim: 0.8166, rmse: 0.1645 }, paper: { fid: 4.05, ssim: 0.823, rmse: 0.114 } },
    alg1: { ours: { fid: 65.63, ssim: 0.5445, rmse: 0.2817 }, paper: { fid: null, ssim: null, rmse: null } },
    alg2: { ours: { fid: 30.64, ssim: 0.6587, rmse: 0.2288 }, paper: { fid: 4.33, ssim: 0.820, rmse: 0.115 } }
  },
  'CIFAR-10': {
    degraded: { ours: { fid: 313.65, ssim: 0.3562, rmse: 0.1359 }, paper: { fid: 358.99, ssim: 0.279, rmse: 0.146 } },
    direct: { ours: { fid: 58.33, ssim: 0.6736, rmse: 0.0810 }, paper: { fid: 169.94, ssim: 0.420, rmse: 0.152 } },
    alg1: { ours: { fid: 96.42, ssim: 0.5188, rmse: 0.1205 }, paper: { fid: null, ssim: null, rmse: null } },
    alg2: { ours: { fid: 55.75, ssim: 0.6634, rmse: 0.0826 }, paper: { fid: 152.76, ssim: 0.411, rmse: 0.155 } }
  }
};
const METHOD_ROWS = [
{ key: 'degraded', label: 'Degraded (x_T)' },
{ key: 'direct', label: 'Direct  R(x_T,T)' },
{ key: 'alg1', label: 'Alg 1  naive iter.' },
{ key: 'alg2', label: 'Alg 2  improved' }];

function fmt(v, digits = 2) {
  if (v == null) return '—';
  return Number.isInteger(v) ? v.toString() : v.toFixed(digits);
}

function ResultsTableMini({ compact = false }) {
  const cellPad = compact ? '2px 5px' : '5px 8px';
  const subPad = compact ? '2px 4px' : '3px 6px';
  const bodyFs = compact ? 10 : 12;
  const subFs = compact ? 8 : 10;
  const valFs = compact ? 10 : 11;
  const labelFs = compact ? 10 : 12;

  return (
    <div style={{ overflow: 'hidden', border: '2px solid var(--ink)', borderRadius: 4, background: 'var(--paper)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--hand)', fontSize: bodyFs, tableLayout: 'fixed' }}>
        <thead>
          {/* Top header: dataset + method | OURS (3 metrics) | PAPER (3 metrics) */}
          <tr style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
            <th style={{ padding: cellPad, textAlign: 'left', fontFamily: 'var(--hand-bold)', width: '18%' }}>Dataset</th>
            <th style={{ padding: cellPad, textAlign: 'left', fontFamily: 'var(--hand-bold)', width: '20%', borderLeft: '1px solid #444' }}>Method</th>
            <th colSpan={3} style={{ padding: cellPad, fontFamily: 'var(--hand-bold)', borderLeft: '1px solid #444', background: 'oklch(0.45 0.09 230)' }}>Ours</th>
            <th colSpan={3} style={{ padding: cellPad, fontFamily: 'var(--hand-bold)', borderLeft: '1px solid #444' }}>Paper</th>
          </tr>
          {/* Sub header: metric names */}
          <tr style={{ background: 'var(--paper-2)', color: 'var(--ink-2)', fontFamily: 'var(--mono)', fontSize: subFs }}>
            <th></th>
            <th style={{ borderLeft: '1px solid var(--rule)' }}></th>
            {[0, 1].map((g) =>
            <React.Fragment key={g}>
                <th style={{ padding: subPad, borderLeft: '1px solid var(--ink)' }}>FID</th>
                <th style={{ padding: subPad, borderLeft: '1px solid var(--rule)' }}>SSIM</th>
                <th style={{ padding: subPad, borderLeft: '1px solid var(--rule)' }}>RMSE</th>
              </React.Fragment>
            )}
          </tr>
        </thead>
        <tbody>
          {Object.entries(RESULTS).flatMap(([dataset, methods]) =>
          METHOD_ROWS.map((m, mi) => {
            const ours = methods[m.key].ours;
            const paper = methods[m.key].paper;
            const isAlg2 = m.key === 'alg2';
            const isFirst = mi === 0;
            return (
              <tr key={dataset + m.key} style={{
                borderTop: isFirst ? '2px solid var(--ink)' : '1px solid var(--rule)',
                background: isAlg2 ? 'var(--accent-soft)' : 'transparent'
              }}>
                  {isFirst ?
                <td rowSpan={METHOD_ROWS.length} style={{
                  padding: cellPad, fontFamily: 'var(--hand-bold)', fontSize: labelFs,
                  verticalAlign: 'middle', textAlign: 'left',
                  borderRight: '1px solid var(--ink)',
                  background: 'var(--paper-2)'
                }}>{dataset}</td> :
                null}
                  <td style={{
                  padding: cellPad, fontFamily: 'var(--mono)', fontSize: valFs,
                  color: isAlg2 ? 'var(--ink)' : 'var(--ink-2)',
                  fontWeight: isAlg2 ? 700 : 400
                }}>{m.label}</td>
                  {/* Ours */}
                  <td style={{ padding: cellPad, textAlign: 'center', borderLeft: '1px solid var(--ink)', fontFamily: 'var(--mono)', fontSize: valFs }}>{fmt(ours.fid, 2)}</td>
                  <td style={{ padding: cellPad, textAlign: 'center', borderLeft: '1px solid var(--rule)', fontFamily: 'var(--mono)', fontSize: valFs }}>{fmt(ours.ssim, 4)}</td>
                  <td style={{ padding: cellPad, textAlign: 'center', borderLeft: '1px solid var(--rule)', fontFamily: 'var(--mono)', fontSize: valFs }}>{fmt(ours.rmse, 4)}</td>
                  {/* Paper */}
                  <td style={{ padding: cellPad, textAlign: 'center', borderLeft: '1px solid var(--ink)', fontFamily: 'var(--mono)', fontSize: valFs, color: 'var(--ink-3)' }}>{fmt(paper.fid, 2)}</td>
                  <td style={{ padding: cellPad, textAlign: 'center', borderLeft: '1px solid var(--rule)', fontFamily: 'var(--mono)', fontSize: valFs, color: 'var(--ink-3)' }}>{fmt(paper.ssim, 4)}</td>
                  <td style={{ padding: cellPad, textAlign: 'center', borderLeft: '1px solid var(--rule)', fontFamily: 'var(--mono)', fontSize: valFs, color: 'var(--ink-3)' }}>{fmt(paper.rmse, 4)}</td>
                </tr>);

          })
          )}
        </tbody>
      </table>
    </div>);

}

/* "Why our results differ" callout — appears on all three creative variants */
function DiscrepancyCallout({ tight }) {
  return (
    <div className="box" style={{
      borderColor: 'var(--ink)',
      borderWidth: 2,
      padding: tight ? 10 : 14,
      background: 'var(--paper-2)',
      position: 'relative'
    }}>
      <span className="tag warn" style={{ position: 'absolute', top: -10, left: 14 }}>OUR ANALYSIS</span>
      <div className="hand-bold" style={{ fontSize: tight ? 18 : 20, marginTop: 4, marginBottom: 6 }}>
        Why our numbers differ from the paper
      </div>
      <ul className="hand-list" style={{ fontSize: tight ? 14 : 15 }}>
        <li><strong>Compute:</strong> ~50–200k steps vs 700k in the paper.</li>
        <li><strong>Hardware:</strong> single Colab GPU, smaller effective batch.</li>
        <li><strong>EMA:</strong> [decay / update interval — to confirm].</li>
        <li className="warn">[Hypothesis on remaining gap goes here]</li>
      </ul>
    </div>);

}

/* =====================================================================
   B1 — TEMPERATURE GAUGE
   A horizontal HOT ↔ COLD scale across the top is the visual hook.
   Algorithm 1 lives in the warm zone (drift); Algorithm 2 in the cold (stable).
   ===================================================================== */
function VariantB1() {
  return (
    <div style={{ position: 'absolute', inset: '40px 50px 50px 50px',
      display: 'grid', gridTemplateRows: 'auto auto minmax(0, 1fr) auto', gap: 18 }}>
      {/* Title strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 64, color: 'var(--accent)' }}>❄</span>
          <div>
            <div className="hand-bold" style={{ fontSize: 64, lineHeight: 0.95 }}>
              Cold <span style={{ color: 'var(--accent)' }}>Diffusion</span>
            </div>
            <div className="hand" style={{ fontSize: 22, color: 'var(--ink-2)', marginTop: 4 }}>
              do diffusion models actually need noise?
            </div>
          </div>
        </div>
        <HeroAuthors />
        <div style={{ textAlign: 'right' }}>
          <span className="tag accent">RE-IMPLEMENTATION</span>
          <div className="mono" style={{ fontSize: 11, marginTop: 6, color: 'var(--ink-2)' }}>
            Bansal et al. · arXiv:2208.09392
          </div>
        </div>
      </div>

      {/* TEMPERATURE GAUGE — full-width banner */}
      <div style={{
        position: 'relative',
        height: 120,
        background: 'linear-gradient(90deg, oklch(0.78 0.13 30) 0%, oklch(0.86 0.05 60) 30%, oklch(0.94 0.02 200) 55%, oklch(0.86 0.07 220) 78%, oklch(0.65 0.11 230) 100%)',
        borderRadius: 8,
        border: '2px solid var(--ink)',
        padding: '18px 24px',
        overflow: 'hidden'
      }}>
        {/* tick marks */}
        <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(20, 1fr)' }}>
          {Array.from({ length: 20 }).map((_, i) =>
          <div key={i} style={{
            borderRight: i < 19 ? '1px solid rgba(0,0,0,0.18)' : 'none',
            height: '100%'
          }} />
          )}
        </div>
        {/* Labels along the gauge */}
        <div style={{ position: 'relative', height: '100%', display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', alignItems: 'center', gap: 8 }}>
          <div>
            <div className="mono" style={{ fontSize: 11, color: 'oklch(0.3 0.13 30)', letterSpacing: '0.1em' }}>HOT ◉</div>
            <div className="hand-bold" style={{ fontSize: 22 }}>Gaussian noise</div>
            <div className="hand" style={{ fontSize: 14, color: 'oklch(0.3 0.13 30)' }}>standard DDPM</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="hand" style={{ fontSize: 14, color: 'var(--ink-2)' }}>Langevin / variational</div>
            <div className="mono" style={{ fontSize: 11 }}>random walks</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>↓ THE PAPER'S QUESTION ↓</div>
            <div className="hand-bold" style={{ fontSize: 18, color: 'var(--ink)' }}>does the noise matter?</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="hand" style={{ fontSize: 14, color: 'oklch(0.3 0.09 230)' }}>deterministic ops</div>
            <div className="mono" style={{ fontSize: 11 }}>blur · mask · downsample</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 11, color: 'oklch(0.3 0.09 230)', letterSpacing: '0.1em' }}>◉ COLD</div>
            <div className="hand-bold" style={{ fontSize: 22 }}>Gaussian blur</div>
            <div className="hand" style={{ fontSize: 14, color: 'oklch(0.3 0.09 230)' }}>our scope ✦</div>
          </div>
        </div>
      </div>

      {/* Three-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: '440px minmax(0, 1fr) 440px', gap: 22, minHeight: 0 }}>
        {/* Left rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <HeroSect num="1" title="Motivation">
            <ul className="hand-list">
              <li>Diffusion ≡ Gaussian noise — by construction.</li>
              <li>What if we strip the noise out entirely?</li>
              <li>Replace it with a deterministic blur.</li>
              <li>Does it still generate? <strong>The paper says yes.</strong></li>
            </ul>
          </HeroSect>
          <HeroSect num="2" title="Method" hint="U-Net + ℓ₁">
            <div className="box" style={{ padding: 10, fontFamily: 'var(--mono)', fontSize: 13 }}>
              R<sub>θ</sub>(D(x,t), t) ≈ x &nbsp;·&nbsp; D = blur
            </div>
            <ul className="hand-list" style={{ marginTop: 8 }}>
              <li>U-Net: ResBlocks + attention + skip</li>
              <li>Sampling: Algorithm 2 (improved)</li>
              <li>Training: Adam, lr 2e-5</li>
            </ul>
          </HeroSect>
          <HeroSect num="3" title="Datasets">
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="box thin" style={{ flex: 1, textAlign: 'center', padding: 8 }}>
                <div className="hand-bold" style={{ fontSize: 18 }}>MNIST</div>
                <div className="scribble dim" style={{ fontSize: 12 }}>28×28 gray</div>
              </div>
              <div className="box thin" style={{ flex: 1, textAlign: 'center', padding: 8 }}>
                <div className="hand-bold" style={{ fontSize: 18 }}>CIFAR-10</div>
                <div className="scribble dim" style={{ fontSize: 12 }}>32×32 RGB</div>
              </div>
            </div>
          </HeroSect>
        </div>

        {/* Big hero center */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: "776px" }}>
          <div className="sect" style={{ width: "88%", alignSelf: "center", alignItems: "baseline", flexDirection: "row", justifyContent: "flex-start", gap: "10px" }}>
            <span className="num">★</span>
            <span className="ttl">Forward freeze → reverse thaw</span>
            <span className="hint" style={{ fontSize: "8px" }}>qualitative results · sampling trajectory</span>
          </div>
          <div className="box" style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden', width: '88%', alignSelf: 'center' }}>
            <QualGridGrouped cellH={78} />

            {/* subtle subsection break — clean horizontal rule + small caption above the trajectory rows */}
            <div style={{ borderTop: '1px solid var(--rule)', marginTop: 2 }}></div>
            <div style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: 'var(--accent)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginTop: -4
            }}>
              Sampling trajectory · Algo 2
            </div>

            <TrajGrid cellH={78} />

            <div className="scribble dim" style={{ fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>
              Top: forward x₀→x_T; reverse compares Direct · Algo 1 · Algo 2. Bottom: Algo 2 running estimate (s = 5→0). CIFAR-10 pending.
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <HeroSect num="4" title="Algo 1 vs Algo 2" hint="drift over sampling">
            <div className="box" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div className="hand-bold" style={{ fontSize: 12, marginBottom: 2 }}>MNIST</div>
                  <img src="images/mnist_drift_curve.png" alt="MNIST drift curve" style={{ width: '100%', display: 'block', border: '1px solid var(--rule)', borderRadius: 3, background: 'var(--paper)' }} />
                </div>
                <div>
                  <div className="hand-bold" style={{ fontSize: 12, marginBottom: 2 }}>CIFAR-10</div>
                  <img src="images/cifar10_drift_curve.png" alt="CIFAR-10 drift curve" style={{ width: '100%', display: 'block', border: '1px solid var(--rule)', borderRadius: 3, background: 'var(--paper)' }} />
                </div>
              </div>
              <div className="scribble dim" style={{ fontSize: 11, fontStyle: 'italic' }}>
                RMSE vs ideal trajectory. Alg 1 (red) drifts; Alg 2 (blue) stays close to the manifold.
              </div>
            </div>
          </HeroSect>

          <HeroSect num="5" title="Headline">
            <div className="box accent" style={{ padding: 14, textAlign: 'center' }}>
              <div className="hand-bold" style={{ fontSize: 30, lineHeight: 1 }}>↓ FID  __%</div>
              <div className="scribble" style={{ fontSize: 13, marginTop: 6 }}>
                [Pop result here when numbers land]
              </div>
            </div>
          </HeroSect>

          <DiscrepancyCallout tight />

          <div style={{
            marginTop: 'auto', borderTop: '1.5px dashed var(--ink-3)', paddingTop: 8,
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', lineHeight: 1.5
          }}>
            <div style={{ fontFamily: 'var(--hand-bold)', fontSize: 13, color: 'var(--ink)', marginBottom: 4 }}>References</div>
            [1] Bansal et al. arXiv:2208.09392 · [2] Ho et al. DDPM 2020 · [3] LeCun MNIST · [4] Krizhevsky CIFAR-10
          </div>
        </div>
      </div>

      {/* Results — middle column only, sits below the qual + trajectory box */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '440px minmax(0, 1fr) 440px',
        gap: 22,
        marginTop: 8
      }}>
        <div></div>
        <div className="box" style={{
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          background: 'var(--paper-2)',
          width: '88%',
          justifySelf: 'center',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            paddingBottom: 6,
            borderBottom: '1px solid var(--rule)'
          }}>
            <span style={{ fontFamily: 'var(--hand-bold)', fontSize: 16, color: 'var(--ink)' }}>
              ✦ Quantitative results
            </span>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 10,
              color: 'var(--ink-3)', letterSpacing: '0.12em',
              textTransform: 'uppercase'
            }}>
              FID / SSIM / RMSE · held-out test set · lower is better
            </span>
          </div>
          <ResultsTableMini compact />
        </div>
        <div></div>
      </div>
    </div>);

}

/* =====================================================================
   B2 — FROST-PANE PROGRESSION
   The qualitative grid is reframed as a window pane: clear → frosted (forward),
   frosted → clear (reverse). Snowflakes mark sections. Lots of frost imagery.
   ===================================================================== */
function VariantB2() {
  return (
    <div style={{ position: 'absolute', inset: '40px 50px 50px 50px',
      display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 20 }}>
      {/* Title strip with subtle frost gradient */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 24,
        padding: '20px 28px',
        background: 'linear-gradient(180deg, var(--paper) 0%, var(--accent-soft) 100%)',
        border: '2px solid var(--ink)',
        borderRadius: 8,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Falling flakes scatter */}
        {[
        { l: '8%', t: '12%', s: 14, o: .4 }, { l: '18%', t: '68%', s: 10, o: .5 }, { l: '40%', t: '18%', s: 18, o: .3 },
        { l: '52%', t: '72%', s: 12, o: .5 }, { l: '70%', t: '14%', s: 16, o: .35 }, { l: '82%', t: '62%', s: 11, o: .5 },
        { l: '92%', t: '30%', s: 14, o: .3 }, { l: '30%', t: '82%', s: 13, o: .4 }].
        map((f, i) =>
        <span key={i} style={{
          position: 'absolute', left: f.l, top: f.t, fontSize: f.s,
          color: 'var(--accent)', opacity: f.o, pointerEvents: 'none'
        }}>❄</span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <span style={{ fontSize: 72, color: 'var(--accent)' }}>❄</span>
          <div>
            <div className="hand-bold" style={{ fontSize: 64, lineHeight: 0.95 }}>
              Cold <span style={{ color: 'var(--accent)' }}>Diffusion</span>
            </div>
            <div className="hand" style={{ fontSize: 22, color: 'var(--ink-2)', marginTop: 4 }}>
              freezing the image · thawing it back
            </div>
          </div>
        </div>
        <HeroAuthors />
        <div style={{ textAlign: 'right', position: 'relative' }}>
          <span className="tag accent">RE-IMPLEMENTATION</span>
          <div className="mono" style={{ fontSize: 11, marginTop: 6, color: 'var(--ink-2)' }}>
            Bansal et al. · arXiv:2208.09392
          </div>
        </div>
      </div>

      {/* Body — three columns, with the center pane being the "frost window" */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr) 320px', gap: 22, minHeight: 0 }}>
        {/* Left rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <HeroSect num={<span style={{ color: 'var(--accent)' }}>❄</span>} title="Motivation">
            <ul className="hand-list">
              <li>Diffusion is theorized via Langevin / variational inference — <em>both require Gaussian noise</em>.</li>
              <li>The paper asks: is the noise actually doing the work?</li>
              <li>Replace noise with deterministic blur. If it still works, our theory is incomplete.</li>
            </ul>
          </HeroSect>

          <HeroSect num={<span style={{ color: 'var(--accent)' }}>❄</span>} title="Method">
            <div className="box" style={{ padding: 10, fontFamily: 'var(--mono)', fontSize: 13 }}>
              <div>D(x,t) = Ḡₜ ∗ x</div>
              <div>min ‖ R(D(x,t),t) − x ‖₁</div>
            </div>
            <ul className="hand-list" style={{ marginTop: 8 }}>
              <li>U-Net restoration network</li>
              <li>Algorithm 2 sampling (proposed)</li>
              <li>50–200k steps · Colab Pro GPU</li>
            </ul>
          </HeroSect>

          <HeroSect num={<span style={{ color: 'var(--accent)' }}>❄</span>} title="Datasets">
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="box thin" style={{ flex: 1, textAlign: 'center', padding: 8 }}>
                <div className="hand-bold" style={{ fontSize: 18 }}>MNIST</div>
                <div className="scribble dim" style={{ fontSize: 12 }}>28×28 gray</div>
              </div>
              <div className="box thin" style={{ flex: 1, textAlign: 'center', padding: 8 }}>
                <div className="hand-bold" style={{ fontSize: 18 }}>CIFAR-10</div>
                <div className="scribble dim" style={{ fontSize: 12 }}>32×32 RGB</div>
              </div>
            </div>
          </HeroSect>

          <DiscrepancyCallout tight />
        </div>

        {/* Center: the frost-window */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div className="sect">
            <span className="num"><span style={{ color: 'var(--accent)' }}>❄</span></span>
            <span className="ttl">The frost pane</span>
            <span className="hint">forward = freeze · reverse = thaw</span>
          </div>

          {/* Window-frame container */}
          <div style={{
            flex: 1,
            border: '6px solid var(--ink)',
            borderRadius: 10,
            background: 'var(--paper)',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            position: 'relative'
          }}>
            {/* "Window cross" decorative bars */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              borderTop: '0', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr'
            }}>
              <div style={{ borderRight: '3px solid var(--ink-3)', borderBottom: '3px solid var(--ink-3)', opacity: 0.18 }} />
              <div style={{ borderBottom: '3px solid var(--ink-3)', opacity: 0.18 }} />
              <div style={{ borderRight: '3px solid var(--ink-3)', opacity: 0.18 }} />
              <div style={{ opacity: 0.18 }} />
            </div>

            {/* Forward row */}
            <div style={{ position: 'relative', zIndex: 1, minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '110px repeat(3, minmax(0, 1fr))', gap: 14, alignItems: 'center' }}>
                <div>
                  <div className="hand-bold" style={{ fontSize: 16 }}>FORWARD</div>
                  <div className="scribble dim" style={{ fontSize: 11 }}>D(x, t)  →</div>
                </div>
                {[
                { label: 'Original\nx₀', frost: 0, src: MNIST.primary.x0 },
                { label: 'Mid-blur\nD(x₀, T/2)', frost: 2, src: MNIST.primary.xHalf },
                { label: 'Fully blurred\nx_T', frost: 4, src: MNIST.primary.xT }].
                map((s, i) =>
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <HeroPH label="" h={140} cold={s.frost > 0} frost={s.frost >= 3 && !s.src}
                  src={s.src}
                  style={s.src ? {} : { filter: `blur(${s.frost * 0.6}px)`, opacity: 1 - s.frost * 0.05 }} />
                    <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.2 }}>{s.label}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Reverse row */}
            <div style={{ position: 'relative', zIndex: 1, minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '110px repeat(4, minmax(0, 1fr))', gap: 12, alignItems: 'center' }}>
                <div>
                  <div className="hand-bold" style={{ fontSize: 16, color: 'var(--accent)' }}>REVERSE</div>
                  <div className="scribble dim" style={{ fontSize: 11 }}>R + Alg.2 ←</div>
                </div>
                {[
                { label: 'Input\nx_T', frost: 4, src: MNIST.primary.xT },
                { label: 'Direct\nR(x_T, T)', frost: 3, src: MNIST.primary.direct },
                { label: 'Algo 1\nnaive sampler', frost: 2, src: MNIST.primary.alg1 },
                { label: 'Algo 2\nimproved → x̂₀', frost: 0, src: MNIST.primary.alg2 }].
                map((s, i) =>
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <HeroPH label="" h={140} cold={s.frost > 0} frost={s.frost >= 3 && !s.src}
                  src={s.src}
                  style={s.src ? {} : { filter: `blur(${s.frost * 0.6}px)`, opacity: 1 - s.frost * 0.05 }} />
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink)', textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.2 }}>{s.label}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="scribble dim" style={{ fontSize: 12, fontStyle: 'italic', position: 'relative', zIndex: 1 }}>
              Fig 1. The image freezes (top) under repeated blur convolution and thaws (bottom) under iterative restoration. Each cell is a real sample at that step. (placeholder; we apply CSS blur to evoke frost.)
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <HeroSect num={<span style={{ color: 'var(--accent)' }}>❄</span>} title="Quantitative" hint="Tab 1">
            <ResultsTableMini />
            <div className="scribble dim" style={{ fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>
              FID / SSIM / RMSE on held-out test sets. Cold cells = our Alg. 2 output.
            </div>
          </HeroSect>

          <HeroSect num={<span style={{ color: 'var(--accent)' }}>❄</span>} title="Algo 1 vs Algo 2" hint="stability">
            <div className="box" style={{ padding: 10 }}>
              <div className="hand-bold" style={{ fontSize: 13, color: 'var(--warn)' }}>ALG 1 ↗ drifts</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, marginTop: 4 }}>
                {[0, 1, 2, 3, 4, 5].map((i) => <HeroPH key={i} label="" h={36} warm={i > 2}
                src={i === 0 ? MNIST.d0.xT : i === 5 ? MNIST.d0.alg1 : undefined} />)}
              </div>
              <div className="hand-bold" style={{ fontSize: 13, color: 'var(--accent)', marginTop: 10 }}>ALG 2 ↘ stable</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, marginTop: 4 }}>
                {[0, 1, 2, 3, 4, 5].map((i) => <HeroPH key={i} label="" h={36} cold
                src={i === 0 ? MNIST.d0.xT : i === 5 ? MNIST.d0.alg2 : undefined} />)}
              </div>
            </div>
          </HeroSect>

          <HeroSect num={<span style={{ color: 'var(--accent)' }}>❄</span>} title="Headline">
            <div className="box accent" style={{ padding: 14, textAlign: 'center' }}>
              <div className="hand-bold" style={{ fontSize: 26 }}>↓ FID __%</div>
              <div className="scribble" style={{ fontSize: 13, marginTop: 4 }}>[result placeholder]</div>
            </div>
          </HeroSect>

          <div style={{
            marginTop: 'auto', borderTop: '1.5px dashed var(--ink-3)', paddingTop: 8,
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', lineHeight: 1.5
          }}>
            <div style={{ fontFamily: 'var(--hand-bold)', fontSize: 13, color: 'var(--ink)', marginBottom: 4 }}>References</div>
            [1] Bansal et al. 2022 · [2] Ho et al. 2020 · [3] LeCun MNIST · [4] Krizhevsky CIFAR-10
          </div>
        </div>
      </div>

      {/* Bottom strip — conclusions */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 22,
        padding: '14px 18px',
        background: 'var(--ink)', color: 'var(--paper)',
        borderRadius: 8
      }}>
        <div>
          <div className="hand-bold" style={{ fontSize: 18, color: 'var(--accent)' }}>1 · Noise was optional</div>
          <div className="scribble" style={{ fontSize: 14, color: '#d0d0c8' }}>
            Cold diffusion produces sharp samples without any Gaussian noise — the random walk wasn't load-bearing.
          </div>
        </div>
        <div>
          <div className="hand-bold" style={{ fontSize: 18, color: 'var(--accent)' }}>2 · Alg 2 was load-bearing</div>
          <div className="scribble" style={{ fontSize: 14, color: '#d0d0c8' }}>
            Removing Algorithm 2 collapses the whole thing — naive sampling drifts off-manifold within ~T/4 steps.
          </div>
        </div>
        <div>
          <div className="hand-bold" style={{ fontSize: 18, color: 'var(--accent)' }}>3 · Compute scales matter</div>
          <div className="scribble" style={{ fontSize: 14, color: '#d0d0c8' }}>
            At ~¼ of the paper's training budget, our absolute FID is higher but the Alg 2 &gt; Alg 1 trend holds.
          </div>
        </div>
      </div>
    </div>);

}

/* =====================================================================
   B3 — EQUATION-AS-ART
   The Algorithm 2 update rule is a typographic centerpiece, with a
   "marginalia" sidebar of insights (band-pass / diff-of-Gaussians).
   ===================================================================== */
function VariantB3() {
  return (
    <div style={{ position: 'absolute', inset: '40px 50px 50px 50px',
      display: 'grid', gridTemplateRows: 'auto 220px 1fr auto', gap: 18, minHeight: 0 }}>

      {/* Compact title row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 24,
        paddingBottom: 12, borderBottom: '3px solid var(--ink)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 60, color: 'var(--accent)' }}>❄</span>
          <div>
            <div className="hand-bold" style={{ fontSize: 56, lineHeight: 0.95 }}>
              Cold <span style={{ color: 'var(--accent)' }}>Diffusion</span>
            </div>
            <div className="hand" style={{ fontSize: 20, color: 'var(--ink-2)', marginTop: 4 }}>
              what one update rule changed
            </div>
          </div>
        </div>
        <HeroAuthors />
        <div style={{ textAlign: 'right' }}>
          <span className="tag accent">RE-IMPLEMENTATION</span>
          <div className="mono" style={{ fontSize: 11, marginTop: 6, color: 'var(--ink-2)' }}>
            Bansal et al. · arXiv:2208.09392
          </div>
        </div>
      </div>

      {/* HUGE EQUATION CENTERPIECE */}
      <div style={{
        background: 'var(--ink)', color: 'var(--paper)',
        borderRadius: 8,
        padding: '28px 32px',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 320px)',
        alignItems: 'center',
        gap: 30
      }}>
        {/* Equation */}
        <div>
          <div className="mono" style={{ fontSize: 11, color: '#888', letterSpacing: '0.15em', marginBottom: 8 }}>
            ALGORITHM 2 — THE UPDATE RULE
          </div>
          <div style={{
            fontFamily: '"Times New Roman", serif',
            fontSize: 64, lineHeight: 1.3, letterSpacing: 0,
            color: 'var(--paper)',
            fontStyle: 'italic',
            whiteSpace: 'nowrap'
          }}>
            x<sub style={{ fontSize: '0.5em' }}>s−1</sub> = x<sub style={{ fontSize: '0.5em' }}>s</sub>
            {' '}<span style={{ color: 'var(--warn)' }}>−</span>{' '}
            D(x̂<sub style={{ fontSize: '0.5em' }}>0</sub>, s)
            {' '}<span style={{ color: 'var(--accent)' }}>+</span>{' '}
            D(x̂<sub style={{ fontSize: '0.5em' }}>0</sub>, s−1)
          </div>
          <div className="mono" style={{ fontSize: 14, color: '#a8a8a0', marginTop: 12, lineHeight: 1.6 }}>
            <span style={{ color: 'var(--warn)' }}>−D(·, s)</span> removes the current degradation level &nbsp;·&nbsp;
            <span style={{ color: 'var(--accent)' }}>+D(·, s−1)</span> adds back one step less.
          </div>
        </div>
        {/* Marginalia: the insight */}
        <div style={{
          borderLeft: '2px dashed var(--accent)',
          paddingLeft: 20,
          maxWidth: 320,
          color: '#d0d0c8'
        }}>
          <div className="hand-bold" style={{ fontSize: 18, color: 'var(--accent)', marginBottom: 6 }}>
            ✦ what this is, secretly
          </div>
          <div className="scribble" style={{ fontSize: 15, color: '#d8d8d0', lineHeight: 1.45 }}>
            For Gaussian blur, the difference{' '}
            <span className="mono" style={{ color: 'var(--paper)' }}>Ḡₜ ∗ x − Ḡₜ₋₁ ∗ x</span>
            {' '}is a <strong style={{ color: 'var(--accent)' }}>difference of Gaussians</strong> — a band-pass filter.
          </div>
          <div className="scribble" style={{ fontSize: 15, color: '#d8d8d0', lineHeight: 1.45, marginTop: 8 }}>
            So Alg. 2 is not "denoising" — it's <em>re-injecting the frequencies that were removed</em>, one band at a time. That's why it stays stable.
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr) 320px', gap: 22, minHeight: 0 }}>
        {/* Left rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <HeroSect num="1" title="Motivation">
            <ul className="hand-list">
              <li>Diffusion theory leans hard on Gaussian noise.</li>
              <li>The paper removes it. Generation still works.</li>
              <li>Why? <em>The sampler.</em></li>
            </ul>
          </HeroSect>
          <HeroSect num="2" title="Method" hint="U-Net + ℓ₁">
            <div className="box" style={{ padding: 10, fontFamily: 'var(--mono)', fontSize: 13 }}>
              <div>D(x,t) = Ḡₜ ∗ x</div>
              <div>min<sub>θ</sub> ‖ R<sub>θ</sub>(D(x,t),t) − x ‖₁</div>
            </div>
            <ul className="hand-list" style={{ marginTop: 8 }}>
              <li>U-Net: ResBlocks + attention</li>
              <li>Adam, lr 2e-5, 50–200k steps</li>
              <li>EMA decay 0.995 / update every 10</li>
            </ul>
          </HeroSect>
          <HeroSect num="3" title="The two algorithms">
            <div className="box thin" style={{ padding: 8, marginBottom: 8 }}>
              <div className="hand-bold" style={{ fontSize: 14, color: 'var(--warn)' }}>Alg 1 (naive)</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>xₛ₋₁ = D(R(xₛ,s), s−1)</div>
              <div className="scribble dim" style={{ fontSize: 12, marginTop: 2 }}>x₀ isn't a fixed point → drifts.</div>
            </div>
            <div className="box thin accent" style={{ padding: 8 }}>
              <div className="hand-bold" style={{ fontSize: 14, color: 'oklch(0.4 0.09 230)' }}>Alg 2 (improved)</div>
              <div className="mono" style={{ fontSize: 11 }}>xₛ₋₁ = xₛ − D(R, s) + D(R, s−1)</div>
              <div className="scribble" style={{ fontSize: 12, marginTop: 2 }}>Exact even with imperfect R (linear ansatz).</div>
            </div>
          </HeroSect>
        </div>

        {/* Center: the qualitative grid (smaller now, since equation got the spotlight) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="sect">
            <span className="num">★</span>
            <span className="ttl">The rule, applied</span>
            <span className="hint">qualitative + stability</span>
          </div>

          <div className="box" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <QualGridGrouped cellH={86} compact />
            <div className="scribble dim" style={{ fontSize: 12, fontStyle: 'italic' }}>
              Fig 1. MNIST. Forward: deterministic blur D. Reverse: one-shot vs Alg. 2.
              CIFAR-10 pending.
            </div>
          </div>

          {/* Sampling trajectory: full Algo 2 reverse process */}
          <div className="box" style={{ padding: 12 }}>
            <div className="hand-bold" style={{ fontSize: 15, marginBottom: 6 }}>
              Sampling trajectory · Algo 2
            </div>
            <TrajGrid cellH={86} compact />
            <div className="scribble dim" style={{ fontSize: 11, marginTop: 6, fontStyle: 'italic' }}>
              Fig 2. Same restoration network R, two samplers. Step s = T … 1. (placeholder)
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <HeroSect num="4" title="Quantitative">
            <ResultsTableMini />
          </HeroSect>
          <HeroSect num="5" title="Headline">
            <div className="box accent" style={{ padding: 14, textAlign: 'center' }}>
              <div className="hand-bold" style={{ fontSize: 28 }}>↓ FID __%</div>
              <div className="scribble" style={{ fontSize: 13, marginTop: 4 }}>[result placeholder]</div>
            </div>
          </HeroSect>
          <DiscrepancyCallout tight />
          <HeroSect num="6" title="Conclusions">
            <ul className="hand-list">
              <li>Noise → optional. The math survives without it.</li>
              <li>Alg 2's diff-of-Gaussians keeps generation on-manifold.</li>
            </ul>
          </HeroSect>
        </div>
      </div>

      {/* Footer refs */}
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
        borderTop: '1.5px dashed var(--ink-3)', paddingTop: 6,
        display: 'flex', gap: 24, justifyContent: 'space-between'
      }}>
        <span>[1] Bansal et al. <em>Cold Diffusion</em>. arXiv:2208.09392 (NeurIPS 2023)</span>
        <span>[2] Ho et al. DDPM, NeurIPS 2020</span>
        <span>[3] LeCun · MNIST</span>
        <span>[4] Krizhevsky · CIFAR-10</span>
      </div>
    </div>);

}

/* Expose creative variants */
Object.assign(window, { VariantB1, VariantB2, VariantB3 });