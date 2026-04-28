/* Poster variants: 4 distinctly different 36"x24" layouts.
   Canvas: 1800 x 1200 px (50 DPI) -- final print is 36"x24" @ 300 DPI.
   All content is placeholder; structure is the point. */

const COLD = { paper: 'var(--paper)', ink: 'var(--ink)', accent: 'var(--accent)' };

/* ---------------- Shared bits ---------------- */

function Sect({ num, title, hint, children, style }) {
  return (
    <div style={style}>
      <div className="sect">
        <span className="num">{num}.</span>
        <span className="ttl">{title}</span>
        {hint && <span className="hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function PH({ label, h, style, dark, cold }) {
  const cls = ['ph'];
  if (dark) cls.push('dark');
  if (cold) cls.push('cold');
  return (
    <div className={cls.join(' ')} style={{ height: h, ...style }}>
      {label}
    </div>
  );
}

function Snowflake({ size = 14, style }) {
  return (
    <span className="flake" style={{ fontSize: size, ...style }}>❄</span>
  );
}

/* Qualitative grid: rows = datasets, cols = degraded / direct / alg2 / original */
function QualGrid({ datasets = ['MNIST', 'CIFAR-10'], cellH = 76, cellW = 76, gap = 8, headerH = 22 }) {
  const cols = ['Degraded', 'Direct', 'Alg. 2', 'Original'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${cols.length}, ${cellW}px)`, gap, alignItems: 'end' }}>
        <div></div>
        {cols.map((c, i) => (
          <div key={c} style={{
            fontFamily: 'var(--hand-bold)', fontSize: 14, textAlign: 'center',
            color: i === 2 ? 'var(--accent)' : 'var(--ink-2)',
            borderBottom: i === 2 ? '2px solid var(--accent)' : '1px solid var(--ink-3)',
            paddingBottom: 2,
            height: headerH
          }}>{c}</div>
        ))}
      </div>
      {datasets.map((d) => (
        <div key={d} style={{ display: 'grid', gridTemplateColumns: `80px repeat(${cols.length}, ${cellW}px)`, gap, alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--hand-bold)', fontSize: 14, color: 'var(--ink)' }}>{d}</div>
          {cols.map((c, i) => (
            <PH key={c} label="" h={cellH} cold={i === 2} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* Pipeline diagram: x0 -> D -> xt ; xt -> R -> x_hat0 ; sample loop */
function Pipeline({ height = 200, compact = false }) {
  const cell = compact ? 76 : 96;
  return (
    <div style={{
      height,
      border: '2px solid var(--ink)',
      borderRadius: 4,
      padding: 18,
      background: 'var(--paper)',
      display: 'grid',
      gridTemplateRows: '1fr 1fr',
      gap: 10
    }}>
      {/* Forward row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="tag">FORWARD</span>
        <span className="hand-bold" style={{ fontSize: 18 }}>x₀</span>
        <PH label="clean" h={cell} style={{ width: cell }} />
        <span className="arrow" style={{ fontSize: 32 }}>→</span>
        <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>D(x,t)</span>
        <span className="arrow" style={{ fontSize: 32 }}>→</span>
        <PH label="t=¼" h={cell} style={{ width: cell }} cold />
        <span className="arrow" style={{ fontSize: 32 }}>→</span>
        <PH label="t=½" h={cell} style={{ width: cell }} cold />
        <span className="arrow" style={{ fontSize: 32 }}>→</span>
        <PH label="t=T" h={cell} style={{ width: cell }} cold />
        <span className="hand-bold" style={{ fontSize: 18 }}>xₜ</span>
        <span className="scribble dim" style={{ marginLeft: 8 }}>(deterministic blur)</span>
      </div>
      {/* Reverse row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="tag accent">REVERSE</span>
        <span className="hand-bold" style={{ fontSize: 18 }}>xₜ</span>
        <PH label="t=T" h={cell} style={{ width: cell }} cold />
        <span className="arrow" style={{ fontSize: 32 }}>→</span>
        <span className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>R(x,t) + Alg.2</span>
        <span className="arrow" style={{ fontSize: 32 }}>→</span>
        <PH label="t=½" h={cell} style={{ width: cell }} />
        <span className="arrow" style={{ fontSize: 32 }}>→</span>
        <PH label="t=¼" h={cell} style={{ width: cell }} />
        <span className="arrow" style={{ fontSize: 32 }}>→</span>
        <PH label="x̂₀" h={cell} style={{ width: cell }} />
        <span className="hand-bold" style={{ fontSize: 18 }}>x̂₀</span>
      </div>
    </div>
  );
}

/* FID/SSIM/RMSE table placeholder */
function ResultsTable({ datasets = ['MNIST', 'CIFAR-10'], compact = false }) {
  const cellPad = compact ? '6px 10px' : '8px 12px';
  const fontSize = compact ? 13 : 15;
  return (
    <div style={{ overflow: 'hidden', border: '2px solid var(--ink)', borderRadius: 4, background: 'var(--paper)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--hand)', fontSize }}>
        <thead>
          <tr style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
            <th rowSpan={2} style={{ padding: cellPad, textAlign: 'left', fontFamily: 'var(--hand-bold)' }}>Dataset</th>
            <th colSpan={3} style={{ padding: cellPad, fontFamily: 'var(--hand-bold)', borderLeft: '1px solid #444' }}>Degraded</th>
            <th colSpan={3} style={{ padding: cellPad, fontFamily: 'var(--hand-bold)', borderLeft: '1px solid #444', background: 'oklch(0.45 0.09 230)' }}>Sampled (Alg 2)</th>
            <th colSpan={3} style={{ padding: cellPad, fontFamily: 'var(--hand-bold)', borderLeft: '1px solid #444' }}>Direct</th>
          </tr>
          <tr style={{ background: 'var(--paper-2)', color: 'var(--ink-2)', fontFamily: 'var(--mono)', fontSize: fontSize - 3 }}>
            {[0,1,2].map(i => (
              <React.Fragment key={i}>
                <th style={{ padding: '4px 8px', borderLeft: i===0 ? '1px solid var(--ink)' : '1px solid var(--rule)' }}>FID</th>
                <th style={{ padding: '4px 8px', borderLeft: '1px solid var(--rule)' }}>SSIM</th>
                <th style={{ padding: '4px 8px', borderLeft: '1px solid var(--rule)' }}>RMSE</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {datasets.map((d) => (
            <tr key={d} style={{ borderTop: '1px solid var(--rule)' }}>
              <td style={{ padding: cellPad, fontFamily: 'var(--hand-bold)' }}>{d}</td>
              {[0,1,2,3,4,5,6,7,8].map((i) => (
                <td key={i} style={{
                  padding: cellPad, textAlign: 'center', color: 'var(--ink-3)',
                  borderLeft: '1px solid var(--rule)',
                  background: (i >= 3 && i <= 5) ? 'var(--accent-soft)' : 'transparent',
                  fontFamily: 'var(--mono)', fontSize: fontSize - 2
                }}>—</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Stability comparison: Alg1 drifts, Alg2 stable */
function StabilityCompare({ height = 180 }) {
  const cell = (height - 60) / 2;
  return (
    <div style={{ height, border: '2px solid var(--ink)', borderRadius: 4, padding: 12, background: 'var(--paper)' }}>
      <div style={{ fontFamily: 'var(--hand-bold)', fontSize: 14, marginBottom: 8 }}>
        Alg. 1 vs Alg. 2 — sampling stability
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(6, 1fr)', gap: 6, marginBottom: 6, alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--warn)' }}>ALG 1</span>
        {[0,1,2,3,4,5].map(i => <PH key={i} label="" h={cell} dark={i > 2} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(6, 1fr)', gap: 6, alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--accent)' }}>ALG 2</span>
        {[0,1,2,3,4,5].map(i => <PH key={i} label="" h={cell} cold />)}
      </div>
      <div style={{ marginTop: 4, fontFamily: 'var(--hand)', fontSize: 12, color: 'var(--ink-3)', textAlign: 'right' }}>
        →  step s = T … 1
      </div>
    </div>
  );
}

/* Authors line */
function Authors({ light }) {
  const c = light ? '#d0d0c8' : 'var(--ink-2)';
  return (
    <div className="hand" style={{ fontSize: 17, color: c, lineHeight: 1.35 }}>
      <strong style={{ color: light ? 'var(--paper)' : 'var(--ink)' }}>
        Nicholas Josephson · Julius Samwer · Kevin Rodriguez · Tudor Braicu
      </strong>
      <br />
      <span style={{ fontSize: 14 }}>Cornell University · CS 4782 Deep Learning · Spring 2026</span>
    </div>
  );
}

/* =====================================================================
   VARIANT A — Classic 3-column academic poster
   ===================================================================== */
function VariantA() {
  return (
    <div className="vA-grid">
      {/* Title banner */}
      <div className="vA-title">
        <div className="vA-banner">
          <Snowflake size={56} style={{ color: 'var(--accent)' }} />
          <div>
            <h1>
              Cold Diffusion
              <span style={{ fontFamily: 'var(--hand)', fontSize: 28, opacity: 0.7, marginLeft: 16 }}>
                inverting arbitrary image transforms — without noise
              </span>
            </h1>
            <div className="authors" style={{ marginTop: 6 }}>
              <strong>Nicholas Josephson · Julius Samwer · Kevin Rodriguez · Tudor Braicu</strong>
              <span style={{ marginLeft: 12, color: '#a8a8a0' }}>· Cornell University · CS 4782 · Spring 2026</span>
            </div>
          </div>
          <div className="crest">
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: '#888', letterSpacing: '0.1em' }}>RE-IMPLEMENTATION OF</div>
            <div style={{ fontSize: 14, marginTop: 2, color: 'var(--paper)' }}>Bansal et al., NeurIPS 2023</div>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', marginTop: 2, color: 'var(--accent)' }}>arXiv:2208.09392</div>
          </div>
        </div>
      </div>

      {/* Column 1: Motivation + Method */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Sect num="1" title="Motivation" hint="why noise?">
          <ul className="hand-list">
            <li>Diffusion models are <em>defined</em> by their use of Gaussian noise.</li>
            <li>But — does the generative behavior actually <em>need</em> noise?</li>
            <li>Cold Diffusion: replace noise with <em>any</em> deterministic degradation.</li>
            <li>If it still works, our theory of diffusion is incomplete.</li>
          </ul>
          <div className="box dashed" style={{ marginTop: 10, fontSize: 14 }}>
            <span className="tag accent">HYPOTHESIS</span>
            <div className="scribble" style={{ marginTop: 6 }}>
              A learned restoration network + iterative sampler can invert <em>blur</em> just as
              well as it inverts noise — yielding a fully deterministic generative model.
            </div>
          </div>
        </Sect>

        <Sect num="2" title="Method" hint="U-Net + L1">
          <div className="scribble" style={{ marginBottom: 8 }}>
            Train R<sub>θ</sub> to invert degradation D, then sample iteratively.
          </div>
          <div className="box" style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 13, lineHeight: 1.6 }}>
            <div><span style={{ color: 'var(--accent)' }}>min</span><sub>θ</sub> 𝔼<sub>x</sub> ‖ R<sub>θ</sub>(D(x, t), t) − x ‖₁</div>
            <div style={{ marginTop: 6, color: 'var(--ink-2)' }}>D = Gaussian blur,  D(x, 0) = x</div>
          </div>
          <ul className="hand-list" style={{ marginTop: 10 }}>
            <li><strong>Backbone:</strong> U-Net, ResBlocks, attention, skip connections</li>
            <li><strong>Loss:</strong> ℓ₁ pixel loss</li>
            <li><strong>Sampling:</strong> Algorithm 2 (proposed) vs Algorithm 1 (naive)</li>
            <li><strong>Datasets:</strong> MNIST · CIFAR-10</li>
          </ul>
        </Sect>
      </div>

      {/* Column 2: Forward/reverse pipeline + qualitative grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Sect num="3" title="The cold pipeline" hint="forward + reverse">
          <Pipeline height={190} compact />
        </Sect>

        <Sect num="4" title="Qualitative results" hint="placeholder grid">
          <QualGrid datasets={['MNIST', 'CIFAR-10']} cellH={86} cellW={86} gap={8} />
          <div className="scribble dim" style={{ fontSize: 13, marginTop: 8, fontStyle: 'italic' }}>
            Fig 1. Left → right: degraded input D(x₀, T), direct one-shot reconstruction
            R(D(x₀,T)), iterative sampling with Algorithm 2, and original x₀. (placeholder)
          </div>
        </Sect>

        <Sect num="5" title="Algorithm 1 vs Algorithm 2" hint="stability">
          <StabilityCompare height={170} />
          <div className="scribble dim" style={{ fontSize: 13, marginTop: 6, fontStyle: 'italic' }}>
            Fig 2. Alg. 1 (naive) drifts as t→0; Alg. 2 (proposed) stays on the data manifold. (placeholder)
          </div>
        </Sect>
      </div>

      {/* Column 3: Results / Conclusion / References */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Sect num="6" title="Quantitative results" hint="FID · SSIM · RMSE">
          <ResultsTable datasets={['MNIST', 'CIFAR-10']} compact />
          <div className="scribble dim" style={{ fontSize: 13, marginTop: 8, fontStyle: 'italic' }}>
            Tab 1. Reconstruction quality vs the original paper. (numbers TBD)
          </div>
        </Sect>

        <Sect num="7" title="Headline finding" hint="placeholder">
          <div className="box accent" style={{ padding: 14 }}>
            <div className="hand-bold" style={{ fontSize: 22, marginBottom: 6 }}>
              <Snowflake size={20} />  ___________________________
            </div>
            <div className="scribble" style={{ fontSize: 16, color: 'var(--ink)' }}>
              [ Headline result goes here — e.g. "Algorithm 2 reduces FID by X%
              over direct reconstruction on CIFAR-10, matching the trend in the paper." ]
            </div>
          </div>
        </Sect>

        <Sect num="8" title="Conclusion + future work">
          <ul className="hand-list">
            <li>Noise is not required — blur-based diffusion produces sharp samples.</li>
            <li>Algorithm 2 is materially more stable than Algorithm 1.</li>
            <li className="warn">[Extension placeholder: e.g. hybrid hot+cold schedule]</li>
            <li className="warn">[Extension placeholder: e.g. new degradation we tried]</li>
          </ul>
        </Sect>

        <div style={{
          borderTop: '1.5px dashed var(--ink-3)', paddingTop: 8, marginTop: 'auto',
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', lineHeight: 1.5
        }}>
          <div style={{ fontFamily: 'var(--hand-bold)', fontSize: 13, color: 'var(--ink)', marginBottom: 4 }}>References</div>
          [1] Bansal et al. <em>Cold Diffusion</em>. arXiv:2208.09392 (2022) · NeurIPS 2023.<br/>
          [2] Ho et al. <em>DDPM</em>. NeurIPS 2020. &nbsp; [3] Sohl-Dickstein et al. ICML 2015.<br/>
          [4] LeCun et al. MNIST. &nbsp; [5] Krizhevsky. CIFAR-10. 2009.
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   VARIANT B — Hero-driven (big central qualitative grid)
   ===================================================================== */
function VariantB() {
  return (
    <div className="vB-grid">
      {/* Title strip */}
      <div className="vB-title" style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 24, alignItems: 'center',
        borderBottom: '3px solid var(--ink)',
        paddingBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Snowflake size={64} />
          <div>
            <div className="hand-bold" style={{ fontSize: 60, lineHeight: 1, color: 'var(--ink)' }}>
              Cold <span style={{ color: 'var(--accent)' }}>Diffusion</span>
            </div>
            <div className="hand" style={{ fontSize: 22, color: 'var(--ink-2)', marginTop: 4 }}>
              inverting arbitrary image transforms — without noise
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Authors />
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="tag accent">RE-IMPLEMENTATION</span>
          <div className="mono" style={{ fontSize: 12, marginTop: 6, color: 'var(--ink-2)' }}>
            Bansal et al. · arXiv:2208.09392
          </div>
        </div>
      </div>

      {/* Left rail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Sect num="1" title="Motivation">
          <ul className="hand-list">
            <li>Diffusion ≡ Gaussian noise — by construction.</li>
            <li>What if we strip the noise out entirely?</li>
            <li>Replace it with <em>any</em> deterministic degradation.</li>
            <li>Does it still generate? <strong>The paper says yes.</strong></li>
          </ul>
        </Sect>
        <Sect num="2" title="Method">
          <div className="box" style={{ padding: 10, fontFamily: 'var(--mono)', fontSize: 13 }}>
            R<sub>θ</sub>(D(x,t), t) ≈ x &nbsp; · &nbsp; ℓ₁
          </div>
          <ul className="hand-list" style={{ marginTop: 8 }}>
            <li>U-Net restoration network</li>
            <li>D = Gaussian blur, deterministic</li>
            <li>Sample with Alg. 2 (improved)</li>
          </ul>
        </Sect>
        <Sect num="3" title="Datasets" hint="2 of 3">
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="box thin" style={{ flex: 1, textAlign: 'center', padding: 10 }}>
              <div className="hand-bold" style={{ fontSize: 20 }}>MNIST</div>
              <div className="scribble dim" style={{ fontSize: 13 }}>28×28, gray</div>
            </div>
            <div className="box thin" style={{ flex: 1, textAlign: 'center', padding: 10 }}>
              <div className="hand-bold" style={{ fontSize: 20 }}>CIFAR-10</div>
              <div className="scribble dim" style={{ fontSize: 13 }}>32×32, RGB</div>
            </div>
          </div>
        </Sect>
      </div>

      {/* Big hero center */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="sect">
          <span className="num">★</span>
          <span className="ttl">Forward → Reverse — qualitative results</span>
          <span className="hint">placeholder grid</span>
        </div>
        <div className="box" style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Big qualitative grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '110px repeat(6, 1fr)', gap: 10, alignItems: 'end' }}>
            <div></div>
            {['x₀', 't=¼', 't=½', 't=T', 'Direct', 'Alg. 2'].map((c, i) => (
              <div key={c} style={{
                fontFamily: 'var(--hand-bold)', fontSize: 16, textAlign: 'center',
                color: i === 5 ? 'var(--accent)' : 'var(--ink-2)',
                borderBottom: i === 5 ? '2px solid var(--accent)' : '1px solid var(--ink-3)',
                paddingBottom: 4
              }}>{c}</div>
            ))}
          </div>
          {['MNIST', 'CIFAR-10'].map((d) => (
            <div key={d} style={{ display: 'grid', gridTemplateColumns: '110px repeat(6, 1fr)', gap: 10, alignItems: 'center' }}>
              <div className="hand-bold" style={{ fontSize: 18 }}>{d}</div>
              {[0,1,2,3,4,5].map((i) => (
                <PH key={i} label="" h={120} cold={i >= 1 && i <= 3 || i === 5} />
              ))}
            </div>
          ))}
          <div className="scribble dim" style={{ fontSize: 13, fontStyle: 'italic', marginTop: 4 }}>
            Fig 1. Forward (cols 1–4) progressively blurs x₀ to xₜ. Reverse: direct
            one-shot R(xₜ) vs iterative Alg. 2. Highlighted cells = our outputs. (placeholder)
          </div>
        </div>

        {/* Results table beneath the hero */}
        <div className="sect">
          <span className="num">▣</span>
          <span className="ttl">Quantitative — placeholder numbers</span>
        </div>
        <ResultsTable datasets={['MNIST', 'CIFAR-10']} compact />
      </div>

      {/* Right rail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Sect num="4" title="Alg 1 vs Alg 2">
          <StabilityCompare height={180} />
        </Sect>
        <Sect num="5" title="Headline">
          <div className="box accent">
            <div className="hand-bold" style={{ fontSize: 32, color: 'var(--ink)' }}>
              ↓ FID by ___%
            </div>
            <div className="scribble" style={{ marginTop: 6 }}>
              [Headline finding placeholder — pop the number that matters most when our results are in.]
            </div>
          </div>
        </Sect>
        <Sect num="6" title="Conclusion">
          <ul className="hand-list">
            <li>Noise is not required.</li>
            <li>Alg 2 is critical for stability.</li>
            <li className="warn">[Our extension here]</li>
          </ul>
        </Sect>
        <div style={{
          marginTop: 'auto',
          borderTop: '1.5px dashed var(--ink-3)', paddingTop: 8,
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', lineHeight: 1.5
        }}>
          <div style={{ fontFamily: 'var(--hand-bold)', fontSize: 13, color: 'var(--ink)', marginBottom: 4 }}>References</div>
          [1] Bansal et al. arXiv:2208.09392<br/>
          [2] Ho et al. DDPM, NeurIPS 2020<br/>
          [3] LeCun, MNIST · Krizhevsky, CIFAR-10
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   VARIANT C — Pipeline-forward (big horizontal pipeline up top)
   ===================================================================== */
function VariantC() {
  return (
    <div className="vC-grid">
      {/* Title row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 24,
        paddingBottom: 14, borderBottom: '3px solid var(--ink)'
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Snowflake size={72} />
          <div>
            <div className="hand-bold" style={{ fontSize: 56, lineHeight: 0.95 }}>
              Cold <span style={{ color: 'var(--accent)' }}>Diffusion</span>
            </div>
            <div className="scribble" style={{ fontSize: 20, marginTop: 4 }}>
              Re-implementing deterministic deblurring on MNIST + CIFAR-10
            </div>
          </div>
        </div>
        <Authors />
        <div style={{ textAlign: 'right' }}>
          <span className="tag">CORNELL CS 4782</span>
          <div className="mono" style={{ fontSize: 11, marginTop: 6, color: 'var(--ink-2)' }}>
            Bansal et al. 2022 · arXiv:2208.09392
          </div>
        </div>
      </div>

      {/* Big horizontal pipeline + motivation/method below it */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22 }}>
        <div>
          <div className="sect">
            <span className="num">→</span>
            <span className="ttl">The cold diffusion pipeline</span>
            <span className="hint">forward (deterministic blur) + reverse (learned restore)</span>
          </div>
          <div className="box" style={{ padding: 16 }}>
            {/* Top arc: forward */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(7, 1fr)', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span className="hand-bold" style={{ fontSize: 18 }}>x₀ →</span>
              <PH label="x₀" h={88} />
              <span className="arrow" style={{ fontSize: 28, textAlign: 'center' }}>→</span>
              <PH label="t=¼" h={88} cold />
              <span className="arrow" style={{ fontSize: 28, textAlign: 'center' }}>→</span>
              <PH label="t=½" h={88} cold />
              <span className="arrow" style={{ fontSize: 28, textAlign: 'center' }}>→</span>
              <PH label="t=T" h={88} cold />
            </div>
            <div style={{
              borderTop: '2px dashed var(--accent)',
              padding: '6px 0',
              textAlign: 'center',
              fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)',
              marginBottom: 10
            }}>
              D(x, t) = Ḡₜ * x₀  &nbsp; · &nbsp; xₜ progressively blurs
            </div>
            {/* Bottom arc: reverse */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(7, 1fr)', alignItems: 'center', gap: 8, marginTop: 14 }}>
              <span className="hand-bold" style={{ fontSize: 18 }}>← x̂₀</span>
              <PH label="x̂₀" h={88} />
              <span className="arrow" style={{ fontSize: 28, textAlign: 'center' }}>←</span>
              <PH label="t=¼" h={88} />
              <span className="arrow" style={{ fontSize: 28, textAlign: 'center' }}>←</span>
              <PH label="t=½" h={88} />
              <span className="arrow" style={{ fontSize: 28, textAlign: 'center' }}>←</span>
              <PH label="t=T" h={88} cold />
            </div>
            <div style={{
              borderTop: '2px solid var(--ink)',
              padding: '6px 0',
              textAlign: 'center',
              fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)',
              marginTop: 10
            }}>
              R<sub>θ</sub>(xₛ, s) → x̂₀  &nbsp; · &nbsp; xₛ₋₁ = xₛ − D(x̂₀, s) + D(x̂₀, s−1)  &nbsp;<span style={{ color: 'var(--accent)' }}>[Alg. 2]</span>
            </div>
          </div>
          <div className="scribble dim" style={{ fontSize: 13, marginTop: 6, fontStyle: 'italic' }}>
            Fig 1. End-to-end pipeline. The reverse path is what makes "cold" generation possible — no Gaussian noise anywhere.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Sect num="1" title="Motivation" hint="why noise?">
            <ul className="hand-list">
              <li>Diffusion is theorized via Langevin / variational inference — both <em>require</em> Gaussian noise.</li>
              <li>The paper asks: is the noise actually doing the work?</li>
              <li>If you swap noise for blur and it still generates, the answer is no.</li>
            </ul>
          </Sect>
          <Sect num="2" title="Method" hint="U-Net + ℓ₁">
            <div className="box" style={{ padding: 10, fontFamily: 'var(--mono)', fontSize: 13 }}>
              <div>D(x, t) = Ḡₜ ∗ x</div>
              <div>min<sub>θ</sub> ‖ R<sub>θ</sub>(D(x,t),t) − x ‖₁</div>
            </div>
            <ul className="hand-list" style={{ marginTop: 8 }}>
              <li>U-Net w/ ResBlocks + attention + skip</li>
              <li>Adam, lr 2e-5, batch 32+grad accum</li>
              <li>~50–200k steps (Colab, vs paper's 700k)</li>
            </ul>
          </Sect>
        </div>
      </div>

      {/* Bottom: results */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 22 }}>
        <Sect num="3" title="Qualitative" hint="Fig 2">
          <QualGrid datasets={['MNIST', 'CIFAR-10']} cellH={84} cellW={70} gap={6} />
          <div className="scribble dim" style={{ fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>
            Degraded / Direct / <span style={{ color: 'var(--accent)' }}>Alg. 2</span> / Original. (placeholder)
          </div>
        </Sect>

        <Sect num="4" title="Stability" hint="Fig 3">
          <StabilityCompare height={210} />
          <div className="scribble dim" style={{ fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>
            Alg 1 (warm) drifts. Alg 2 (cold) holds. (placeholder)
          </div>
        </Sect>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Sect num="5" title="Quantitative" hint="Tab 1">
            <ResultsTable datasets={['MNIST', 'CIFAR-10']} compact />
          </Sect>
          <Sect num="6" title="Conclusion + refs">
            <ul className="hand-list">
              <li>Cold Diffusion reproduces — within compute limits.</li>
              <li>Alg. 2 ≫ Alg. 1 in stability, as predicted.</li>
              <li className="warn">[Extension placeholder]</li>
            </ul>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.5 }}>
              [1] Bansal et al. 2022 · [2] Ho et al. 2020 · [3] LeCun MNIST · [4] Krizhevsky CIFAR-10
            </div>
          </Sect>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   VARIANT D — Asymmetric magazine (bold dark left rail, content right)
   ===================================================================== */
function VariantD() {
  return (
    <div className="vD-grid">
      {/* Dark left rail */}
      <div className="vD-rail">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Snowflake size={56} />
          <span className="mono" style={{ fontSize: 12, color: '#888', letterSpacing: '0.15em' }}>
            COLD DIFFUSION · A RE-IMPLEMENTATION
          </span>
        </div>

        <h1>
          Diffusion<br/>
          without<br/>
          <span className="accent-word">noise.</span>
        </h1>

        <div className="scribble" style={{ color: '#c8c8c0', fontSize: 22, lineHeight: 1.4 }}>
          We rebuild the cold-diffusion pipeline from <em>Bansal et al.</em>
          and ask: can a generative model live entirely in the deterministic regime?
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Authors light />

          <div style={{
            borderTop: '1px solid #444', paddingTop: 12,
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10
          }}>
            <div>
              <div className="mono" style={{ fontSize: 10, color: '#888', letterSpacing: '0.1em' }}>SOURCE</div>
              <div className="hand-bold" style={{ fontSize: 14, color: 'var(--paper)' }}>arXiv:2208.09392</div>
              <div className="scribble" style={{ fontSize: 12, color: '#a8a8a0' }}>NeurIPS 2023</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 10, color: '#888', letterSpacing: '0.1em' }}>SCOPE</div>
              <div className="hand-bold" style={{ fontSize: 14, color: 'var(--paper)' }}>Deblurring</div>
              <div className="scribble" style={{ fontSize: 12, color: '#a8a8a0' }}>MNIST · CIFAR-10</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right content area */}
      <div className="vD-main">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Sect num="1" title="Motivation">
            <ul className="hand-list">
              <li>Diffusion is theorized around Gaussian noise.</li>
              <li>The cold-diffusion paper asks: is the noise <em>necessary</em>?</li>
              <li>We re-implement the deblurring pipeline to find out.</li>
            </ul>
          </Sect>
          <Sect num="2" title="Method">
            <div className="box" style={{ padding: 10, fontFamily: 'var(--mono)', fontSize: 13 }}>
              R<sub>θ</sub>(D(x,t),t) ≈ x &nbsp;·&nbsp; D = blur &nbsp;·&nbsp; ℓ₁
            </div>
            <ul className="hand-list" style={{ marginTop: 8 }}>
              <li>U-Net restoration · ResBlocks + attention</li>
              <li>Algorithm 2 sampling (proposed in paper)</li>
            </ul>
          </Sect>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
          <Sect num="3" title="Forward / reverse" hint="placeholder">
            <Pipeline height={210} />
            <div className="scribble dim" style={{ fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>
              Fig 1. Top: deterministic blur schedule. Bottom: learned restoration + Alg. 2. (placeholder)
            </div>
          </Sect>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Sect num="4" title="Headline">
              <div className="box accent" style={{ padding: 16, textAlign: 'center' }}>
                <div className="hand-bold" style={{ fontSize: 36, color: 'var(--ink)', lineHeight: 1 }}>
                  ↓ FID ___%
                </div>
                <div className="scribble" style={{ fontSize: 14, marginTop: 8 }}>
                  [Pop number once results land]
                </div>
              </div>
            </Sect>
            <Sect num="5" title="Stability">
              <StabilityCompare height={150} />
            </Sect>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
          <Sect num="6" title="Quantitative · Fig 2 / Tab 1">
            <ResultsTable datasets={['MNIST', 'CIFAR-10']} compact />
            <div style={{ marginTop: 12 }}>
              <QualGrid datasets={['MNIST', 'CIFAR-10']} cellH={70} cellW={60} gap={6} headerH={20} />
            </div>
          </Sect>
          <Sect num="7" title="Conclusion + Refs">
            <ul className="hand-list">
              <li>Cold-diffusion reproduces in spirit, within Colab compute.</li>
              <li>Alg 2 stability holds visibly in our runs.</li>
              <li className="warn">[Independent extension here]</li>
            </ul>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 'auto', lineHeight: 1.5, paddingTop: 10, borderTop: '1.5px dashed var(--ink-3)' }}>
              [1] Bansal et al. <em>Cold Diffusion</em>, 2022.<br/>
              [2] Ho et al. <em>DDPM</em>, NeurIPS 2020.<br/>
              [3] Sohl-Dickstein et al. ICML 2015.<br/>
              [4] LeCun MNIST · Krizhevsky CIFAR-10.
            </div>
          </Sect>
        </div>
      </div>
    </div>
  );
}

/* Expose */
Object.assign(window, { VariantA, VariantB, VariantC, VariantD });
