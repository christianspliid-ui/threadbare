// moment1-reveal.jsx — the dice/threads tension reveal.
// 5 frames: COMMIT → INHALE → THREADS DRAW → TENSION (taut) → RESOLVE (one holds, others slack).
// Each frame is a small artboard (660×420) showing only the active card area
// + a thread overlay; we use the EncounterShell as the wider context only on
// the leftmost "in-place" frame.

function Caption({ idx, label, beat }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:10, padding:'10px 14px',
      background:'var(--bg-deep)', borderTop:'1px solid var(--border-subtle)' }}>
      <div className="display gold-label" style={{ fontSize:14 }}>0{idx}</div>
      <div>
        <div className="display" style={{ fontSize:13 }}>{label}</div>
        <div className="label" style={{ fontSize:9, color:'var(--text-muted)' }}>{beat}</div>
      </div>
    </div>
  );
}

// Threadboard — the painterly thread overlay. Stretches across the three
// choice cards; each thread emerges from the player's hand and connects
// to one card. State knobs control draw / pull / hold.
function ThreadOverlay({ phase /* 'pre' | 'draw' | 'taut' | 'resolve' */, chosen='heart' }) {
  // anchor: bottom-center of overlay (player's hand). targets: top of each card.
  const ANCHOR = [330, 380];
  const T = {
    iron:  { color:'#ff6b6b', x:110 },
    eye:   { color:'#44aaff', x:330 },
    heart: { color:'#cc66ff', x:550 },
  };
  const path = (id) => `M${ANCHOR[0]},${ANCHOR[1]} C${ANCHOR[0]},260 ${T[id].x},220 ${T[id].x},90`;
  const opacity = (id) => {
    if (phase==='pre') return 0;
    if (phase==='resolve') return id===chosen ? 1 : .15;
    return .85;
  };
  const stroke = (id) => phase==='resolve' && id===chosen ? 2 : 1.1;
  return (
    <svg style={{ position:'absolute', inset:0, pointerEvents:'none' }} viewBox="0 0 660 420" preserveAspectRatio="none">
      <defs>
        {Object.entries(T).map(([id, t]) => (
          <filter key={id} id={`g-${id}`}>
            <feGaussianBlur stdDeviation={phase==='resolve' && id===chosen ? 2.4 : 1.2} />
          </filter>
        ))}
      </defs>
      {Object.entries(T).map(([id, t]) => (
        <g key={id} style={{ transition:'opacity .4s ease' }} opacity={opacity(id)}>
          {/* glow */}
          <path d={path(id)} stroke={t.color} strokeWidth={4} fill="none" filter={`url(#g-${id})`} opacity={.45}
            strokeDasharray="600" strokeDashoffset={phase==='pre' ? 600 : 0}
            style={{ transition: phase==='draw' ? 'stroke-dashoffset 700ms ease-out' : 'stroke-dashoffset 200ms' }}
          />
          {/* core */}
          <path d={path(id)} stroke={t.color} strokeWidth={stroke(id)} fill="none" opacity={.95}
            strokeDasharray="600" strokeDashoffset={phase==='pre' ? 600 : 0}
            style={{ transition: phase==='draw' ? 'stroke-dashoffset 700ms ease-out' : 'stroke-dashoffset 200ms' }}
          />
          {/* node — node breathes during taut */}
          <circle cx={t.x} cy={90} r={phase==='taut' ? 4.5 : 3} fill={t.color}>
            {phase==='taut' && (
              <animate attributeName="r" values="3;5;3" dur="900ms" repeatCount="indefinite"/>
            )}
          </circle>
          {/* anchor mote */}
          <circle cx={ANCHOR[0]} cy={ANCHOR[1]} r="2.5" fill={t.color} opacity=".8"/>
        </g>
      ))}
      {/* breath fog (whole frame) — only during INHALE */}
      {phase==='pre' && (
        <rect x="0" y="0" width="660" height="420" fill="url(#breath)" opacity=".25"/>
      )}
    </svg>
  );
}

// A small mock of just the choice-card row, scaled to fit 660×420
function MiniStage({ phase, chosen, dim, ringFor }) {
  return (
    <div style={{ position:'relative', width:'100%', height:'100%',
      background: 'radial-gradient(80% 60% at 50% 100%, #1a1418 0%, var(--bg-abyss) 80%)',
      padding:'24px 30px', boxSizing:'border-box', overflow:'hidden' }}>
      <div className="label" style={{ fontSize:10, marginBottom:6, color: phase==='pre' ? 'var(--accent-gold)' : 'var(--text-tertiary)' }}>
        { phase==='pre'      ? 'EIRA HAS COMMITTED · THE WORLD HOLDS ITS BREATH'
        : phase==='draw'     ? 'THE THREADS COME UP'
        : phase==='taut'     ? 'THEY GO TAUT — ONE WILL HOLD'
        :                      'ONE THREAD HOLDS · THE OTHERS GO SLACK' }
      </div>
      <div style={{ position:'relative', height:'calc(100% - 22px)' }}>
        <ChoiceCards selected={chosen} dim={dim} ringFor={ringFor}/>
        <ThreadOverlay phase={phase} chosen={chosen}/>
        {/* dust motes */}
        {phase==='taut' && Array.from({length:8}).map((_,i)=>(
          <i key={i} style={{
            position:'absolute', left: 30 + i*70, bottom: 30 + (i%3)*16,
            width:2, height:2, borderRadius:99, background:'#ffd28066',
            animation:`mote-drift ${1.6 + (i%4)*.3}s ease-in-out ${i*.12}s infinite`,
            ['--mx']:`${(i%2?-1:1) * 30}px`, ['--my']:`-${30+i*4}px`,
          }}/>
        ))}
      </div>
    </div>
  );
}

function MotionSoundBrief() {
  return (
    <div style={{ padding:'20px 24px', background:'var(--bg-deep)', borderRadius:8,
      border:'1px solid var(--border-subtle)', height:'100%', boxSizing:'border-box', overflow:'auto' }}>
      <div className="label gold-label" style={{ fontSize:11 }}>MOTION + SOUND BRIEF</div>
      <div className="display" style={{ fontSize:18, marginTop:6 }}>The held-breath, in five beats</div>
      <div className="gold-bar" style={{ marginTop:8, marginBottom:14 }}/>

      <div className="prose" style={{ fontSize:14 }}>
        <p>The reveal is the only moment in the encounter where the world stops listening to the player. From the click to the resolution we have <strong>1.6 seconds</strong>. The frame is divided into five micro-beats: <em>commit (60ms)</em> — <em>inhale (380ms)</em> — <em>threads draw (520ms)</em> — <em>tension (420ms)</em> — <em>resolve (240ms)</em>. The cards do not move. The world dims by 8%. The chosen lean's card holds its color; the other two desaturate to 35% opacity over the resolve beat.</p>

        <p>Threads emerge from <strong>below the lean cards</strong> — the player's hand position, the only spot in the layout the eye accepts as a god's-eye-view origin. There are exactly three threads, one per choice, each in its sphere color (Iron <span className="term" style={{borderBottomColor:'var(--sphere-force-bright)'}}>force-red</span>, Eye <span className="term" style={{borderBottomColor:'var(--sphere-mind-bright)'}}>mind-blue</span>, Heart <span className="term" style={{borderBottomColor:'var(--sphere-spirit-bright)'}}>spirit-violet</span>). They draw with <code>stroke-dashoffset</code>, ease-out, <strong>720ms</strong> — the only moving lines in the frame, intensely bright but no thicker than 1.2px. They do not glow ambient; only the bright node at each card's top breathes.</p>

        <p>At <strong>tension</strong>, all three threads pulse subtly along their length (1px width oscillation, 900ms ease-in-out, single cycle) — the audible-thrum-before-Hades-picks beat. Dust motes drift upward along each thread at 30% opacity. <strong>This is the moment the player's hand is off the mouse.</strong> Hold it for 420ms — long enough that an experienced player will lean in, short enough that a casual one doesn't reach for the keyboard.</p>

        <p>At <strong>resolve</strong>, two threads go slack and dim to 15% opacity over 240ms ease-in. The chosen thread <em>brightens</em> by 30% and its card receives a single one-shot <code>pulse-gold</code> ring (designed primitive — never continuous). The dimmed cards do not animate further; their stillness is the message. The next-beat affordance fades in below at +400ms.</p>

        <div className="label" style={{ fontSize:10, marginTop:18 }}>SOUND</div>
        <p style={{ marginTop:6 }}>One layered cue, three textures stacked. (1) <em>Inhale</em> — a held breath at -28dB, 380ms, mono center, low-pass at 800Hz. (2) <em>Thrum</em> — a low cello drone fading in across the draw + tension beats, root only, no harmony, peaks at -16dB on the taut beat. (3) <em>Resolve</em> — a single struck struck-string node, sphere-tinted: a low fourth on Iron, an open fifth on Eye, a soft minor third on Heart. The two slackening threads emit a barely-audible <em>release</em> — fingertip leaving wet thread. No drum. No riser. No vocalisation. The total cue is shorter than the visual sequence so the prose log lands in silence.</p>

        <div className="label" style={{ fontSize:10, marginTop:18 }}>WHAT TO BUILD FIRST</div>
        <p style={{ marginTop:6 }}>The <code>ThreadOverlay</code> SVG component (one per encounter) drawn over the choice card row. Phase machine: <code>idle → committed → drawing → taut → resolving → settled</code>. Settled is the existing post-resolve UI; the overlay unmounts after 600ms. The pulse-gold ring on the winning card uses the existing <code>pulseGoldFlare</code> keyframe — <strong>do not invent a new glow</strong>. Other lean cards desaturate via <code>filter: saturate(0.35) opacity(0.35)</code>; do not transition the layout.</p>
      </div>
    </div>
  );
}

window.MiniStage = MiniStage;
window.MotionSoundBrief = MotionSoundBrief;
