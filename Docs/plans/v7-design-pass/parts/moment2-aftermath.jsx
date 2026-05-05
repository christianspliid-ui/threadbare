// moment2-aftermath.jsx — the registration animation set + sequencing.
// Each of the nine effect kinds gets a small "card flip" landing animation
// that crystallises into the part of the hero panel where the eye already is.
// We render nine static-but-animated example tiles plus a sequencing diagram.

const EFFECTS = [
  {
    kind: 'intelligence',
    sphere: 'eye',
    where: 'Items rail · hero panel',
    title: 'A piece of intelligence lands',
    body: 'A new clue card materialises in her items rail. The clue is not numerical — it is a sentence she now knows.',
    sample: { label:'CLUE · NEW', name:"The trader's satchel is sewn shut from the inside.", tail:'eye · she will see it in him next time' },
    motion: 'Card-flip in (rotateX 80→0, 420ms ease-out) at the items rail. Single mind-blue thread draws from the choice node into the slot at +120ms. One pulse-gold ring on settle.',
  },
  {
    kind: 'condition_attachment',
    sphere: 'spirit',
    where: 'Disposition strip · hero panel',
    title: 'A condition attaches',
    body: 'The protagonist now carries a state. The condition strip beneath her name swaps in a new pill, with a single italicised qualifier.',
    sample: { label:'CONDITION', name:'Sworn-witness', tail:'she has spoken what she saw' },
    motion: 'Old pill cross-fades out 200ms; new pill fades up + 4px slide, 240ms; spirit-violet thread tugs from her chest in the portrait into the pill on settle.',
  },
  {
    kind: 'reputation_tally',
    sphere: 'iron',
    where: 'Cast tile · right rail',
    title: 'A reputation tally moves',
    body: 'Someone in the cast adjusts their disposition. Their tile receives a soft sphere-pulse along its left edge; the disposition phrase rewrites in place with a one-character-at-a-time draw.',
    sample: { label:'CAPTAIN VEIREN', name:'disposition: cooled, watching', tail:'iron · he marks her now' },
    motion: 'Sphere-coloured 3px left border pulses once (pulseGoldFlare keyframe, retinted). Old phrase fades out 160ms; new phrase types in 280ms; never a numeric tick.',
  },
  {
    kind: 'reputation_score',
    sphere: 'iron',
    where: 'Cast tile · prose band',
    title: 'A reputation score crosses a threshold',
    body: 'The qualitative band a faction holds her in moves up or down a step. The band-word rewrites; no numbers, ever.',
    sample: { label:'CIVIC GUARD OF BREN', name:'a quiet certainty → a name they remember', tail:'crossed: from useful to known' },
    motion: 'Old band word fades through a thread of force-red (180ms), the new word lands; soft horizontal pull (taut→relax, single cycle) along the cast tile.',
  },
  {
    kind: 'encounter_seed',
    sphere: 'time',
    where: 'Bottom of hero panel · "moments that could echo"',
    title: 'An encounter seed plants',
    body: 'A future beat becomes possible. A fresh card slides into the moments-that-could-echo strip with a faint orange ring. It is dim — it is not yet promised.',
    sample: { label:'SEED · ELIGIBLE', name:'A reckoning at the iron market.', tail:'time · 3–7 turns from now · veiren-related' },
    motion: 'Slide-up 8px + fade, 360ms. Time-orange node pulses once at the corner. The strip auto-scrolls so the new card is visible if it would otherwise sit below the fold.',
  },
  {
    kind: 'hidden_mark',
    sphere: 'darkness',
    where: 'Portrait · hero panel',
    title: 'A hidden mark settles on her',
    body: 'Something is true of her now that she does not know. The portrait gains a single rim-thread visible only to the player; copy in the strip is honest about what it is and is not.',
    sample: { label:'HIDDEN · ONLY YOU SEE THIS', name:'Marked by coincidence', tail:'this scene becomes biographical' },
    motion: 'A single dark-violet thread draws around the portrait edge (700ms). Pill appears beneath the portrait with the player-only treatment (dotted outline, 35% opacity background).',
  },
  {
    kind: 'recent_event',
    sphere: 'heart',
    where: '"Moments that could echo" · hero panel',
    title: 'A recent event registers',
    body: 'What just happened becomes biography. A new card slides into the echo strip, marked INVOKED THIS BEAT — the same place callbacks come from in future encounters.',
    sample: { label:'INVOKED THIS BEAT', name:'She held the captain\'s eye and did not look away.', tail:'heart-related · 0 turns ago' },
    motion: 'Card-flip-in into the echo strip; the gold callback ring (the same primitive used for the active callback above the prose) pulses on settle.',
  },
  {
    kind: 'spawn_artifact',
    sphere: 'matter',
    where: 'Items rail · hero panel',
    title: 'An artifact comes into her hand',
    body: 'A physical thing exists with her now. The items rail flips a new tile; the tile carries a single matter-thread along its edge (per the artifact-art spec).',
    sample: { label:'ITEM · NEW', name:"A pressed iron coin, warm.", tail:'matter · favor of the captain' },
    motion: 'Card-flip-in (rotateX 80→0, 460ms — slightly heavier than intelligence). Faint matter-umber rim glow holds for 600ms then settles to none.',
  },
  {
    kind: 'faction_*',
    sphere: 'order',
    where: 'Scene state · right rail',
    title: 'A faction moves',
    body: 'A faction chip in the scene-state pulses; the new tone is verbal, not numerical. If the change is large enough, the chip swaps colour-class (allied → opposed, etc.).',
    sample: { label:'CIVIC GUARD OF BREN', name:'allied → wary', tail:'order · because of what she said' },
    motion: 'Chip border pulses once with the faction\'s sphere colour (single cycle, 800ms). Cross-fade between old and new tone-words, 200ms.',
  },
  {
    kind: 'archetype_drift_register',
    sphere: 'chaos',
    where: 'Capability bands · hero panel',
    title: 'Her archetype drifts',
    body: 'Who-she-is moves a half-step. One of the IRON / EYE / HEART bands grows or shrinks by one dot, and the band\'s italic qualifier rewrites.',
    sample: { label:'HEART · DRIFT', name:'her deepest thread → the thread she lives by', tail:'+1 dot · she is more this now' },
    motion: 'The dot fills (single dot, 240ms ease-out, sphere colour). The italic phrase fades through and lands. A faint chaos-grey particle drifts up from the band — drift, never a stat-up animation.',
  },
];

function EffectTile({ e, idx, animate }) {
  const sCol = `var(--sphere-${e.sphere==='iron' ? 'force' : e.sphere==='eye' ? 'mind' : e.sphere==='heart' ? 'spirit' : e.sphere}-bright)`;
  const [rev, setRev] = React.useState(0);
  React.useEffect(() => {
    if (!animate) return;
    const t = setInterval(() => setRev(r => r+1), 4200 + idx*120);
    return () => clearInterval(t);
  }, [animate, idx]);
  return (
    <div className="panel" style={{ padding:14, display:'flex', flexDirection:'column', gap:8, position:'relative', overflow:'hidden' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
        <div className="label gold-label" style={{ fontSize:10 }}>0{idx+1} · {e.kind.toUpperCase()}</div>
        <div className="label" style={{ fontSize:9, color: sCol }}>{e.sphere.toUpperCase()}</div>
      </div>
      <div className="display" style={{ fontSize:15 }}>{e.title}</div>
      <div className="prose" style={{ fontSize:12, color:'var(--text-tertiary)' }}>{e.body}</div>
      <div className="label" style={{ fontSize:9, marginTop:2, color:'var(--text-muted)' }}>LANDS IN: {e.where.toUpperCase()}</div>

      {/* The "card lands" preview — keyed off rev so it replays */}
      <div key={rev} className="panel" style={{
        padding:'8px 10px', marginTop:4, perspective:'600px',
        animation: animate ? 'card-flip-in 600ms cubic-bezier(.2,.7,.2,1) 1' : 'none',
        ['--mark-color']: sCol,
        borderColor: sCol, background: 'linear-gradient(90deg, color-mix(in oklab, '+sCol+' 8%, transparent), transparent)'
      }}>
        <div className="label" style={{ fontSize:9, color: sCol }}>{e.sample.label}</div>
        <div style={{ fontSize:13, marginTop:2 }}>{e.sample.name}</div>
        <div className="prose" style={{ fontSize:11, fontStyle:'italic', color:'var(--text-tertiary)' }}>{e.sample.tail}</div>
      </div>

      <div className="prose" style={{ fontSize:11, color:'var(--text-secondary)', marginTop:6,
        borderTop:'1px solid var(--border-subtle)', paddingTop:8 }}>
        <em>Motion · </em>{e.motion}
      </div>
    </div>
  );
}

function NineEffectsGrid() {
  return (
    <div style={{ padding:18, height:'100%', boxSizing:'border-box', overflow:'auto', background:'var(--bg-abyss)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <div>
          <div className="label gold-label" style={{ fontSize:11 }}>AFTERMATH · NINE EFFECT KINDS</div>
          <div className="display" style={{ fontSize:20, marginTop:4 }}>Crystallisation, not notification</div>
          <div className="prose" style={{ fontSize:12, color:'var(--text-tertiary)', marginTop:4 }}>
            Each effect lands where the eye already is. None of these is a banner; none of these is a list.
          </div>
        </div>
        <div className="gold-bar"/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
        {EFFECTS.map((e, i) => <EffectTile key={e.kind} e={e} idx={i} animate />)}
      </div>
    </div>
  );
}

function SequencingPlan() {
  // visual timeline: a single resolution can fire 1-N effects. Cap visible
  // simultaneous landings at 3; queue the rest with 220ms gaps. Player-facing
  // effects (hidden mark, archetype drift) get explicit slots regardless of queue.
  const lanes = [
    { name:'PROSE LOG',          color:'var(--text-secondary)', ranges:[[0,1.0,'the line that resolved']] },
    { name:'CHOICE CARDS',       color:'var(--accent-gold)',    ranges:[[0,0.6,'winner brightens · others slack']] },
    { name:'HERO PANEL',         color:'var(--sphere-spirit-bright)', ranges:[[0.6,1.5,'first registration · card flip'],[1.7,2.4,'second registration']] },
    { name:'RIGHT RAIL · CAST',  color:'var(--sphere-force-bright)',  ranges:[[1.0,1.7,'reputation tally']] },
    { name:'RIGHT RAIL · STATE', color:'var(--sphere-mind-bright)',   ranges:[[1.4,2.0,'faction chip · scene threads']] },
    { name:'ECHO STRIP',         color:'var(--sphere-time-bright)',   ranges:[[2.4,3.2,'recent_event · this beat']] },
    { name:'PLAYER-ONLY',        color:'var(--sphere-darkness-bright)',ranges:[[3.2,4.0,'hidden_mark · last']] },
  ];
  const T = 4.2;
  return (
    <div style={{ padding:'20px 24px', height:'100%', boxSizing:'border-box', background:'var(--bg-deep)', overflow:'auto' }}>
      <div className="label gold-label" style={{ fontSize:11 }}>SEQUENCING PLAN</div>
      <div className="display" style={{ fontSize:18, marginTop:6 }}>Many effects, one breath</div>
      <div className="gold-bar" style={{ marginTop:8, marginBottom:14 }}/>

      <div className="prose" style={{ fontSize:13, marginBottom:14 }}>
        <p>A single resolution can fire up to nine effects. They cannot all land at once — the eye splits, the dopamine flattens. The order is fixed by <em>scope</em>, not by content: tightest first, widest last. Player-only effects (<code>hidden_mark</code>) always land last so the world resolves before the secret does.</p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {lanes.map(l => (
          <div key={l.name} style={{ display:'grid', gridTemplateColumns:'170px 1fr', gap:10, alignItems:'center' }}>
            <div className="label" style={{ fontSize:10, color: l.color }}>{l.name}</div>
            <div style={{ position:'relative', height:22, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:4 }}>
              {l.ranges.map(([a,b,lbl],i) => (
                <div key={i} style={{
                  position:'absolute', left:`${(a/T)*100}%`, width:`${((b-a)/T)*100}%`, top:2, bottom:2,
                  background: `linear-gradient(90deg, ${l.color}40, ${l.color}20)`,
                  border:`1px solid ${l.color}`, borderRadius:3,
                  display:'flex', alignItems:'center', paddingLeft:8,
                  fontSize:10, color:'var(--text-secondary)', fontStyle:'italic', whiteSpace:'nowrap',
                }}>{lbl}</div>
              ))}
            </div>
          </div>
        ))}
        {/* time axis */}
        <div style={{ display:'grid', gridTemplateColumns:'170px 1fr', gap:10, marginTop:6 }}>
          <div/>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            {[0,1,2,3,4].map(s => (
              <span key={s} className="label" style={{ fontSize:9, color:'var(--text-muted)' }}>{s}.0s</span>
            ))}
          </div>
        </div>
      </div>

      <div className="prose" style={{ fontSize:12, marginTop:18, color:'var(--text-secondary)' }}>
        <p><strong>Rules of thumb.</strong> No two card-flips overlap by more than 50%. Pulse rings (gold or sphere) never stack — the second is suppressed if a first is still in its decay. Audio is cued only on the <em>first</em> registration; further effects land in the silence the resolve cue leaves behind. If more than five effects fire from one resolution, the second wave is gated until the first completes (a "second breath" pattern), with a faint <code>… more is settling</code> line in the prose log.</p>
      </div>
    </div>
  );
}

window.NineEffectsGrid = NineEffectsGrid;
window.SequencingPlan = SequencingPlan;
