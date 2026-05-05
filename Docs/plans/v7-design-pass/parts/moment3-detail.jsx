// moment3-detail.jsx — the click-through detail-page pattern.
// Five node types: actor, item, faction, place, event.
// Each rendered as a self-contained modal, sized to fit a 720×620 artboard.
// Plus: a stacked-modals + breadcrumb diagram + a paused-encounter behaviour note.

function Crumbs({ trail, active }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
      {trail.map((c, i) => (
        <React.Fragment key={i}>
          <span className="label" style={{
            fontSize:10,
            color: i === active ? 'var(--accent-gold)' : 'var(--text-muted)',
            cursor: i < trail.length-1 ? 'pointer' : 'default',
          }}>{c}</span>
          {i < trail.length - 1 && <span className="crumb-dot"/>}
        </React.Fragment>
      ))}
    </div>
  );
}

function ModalShell({ trail, kind, title, sub, sphere, children, w=720, h=620 }) {
  const sCol = sphere ? `var(--sphere-${sphere}-bright)` : 'var(--accent-gold)';
  return (
    <div style={{
      width:w, height:h, position:'relative',
      background:'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
      border:'1px solid var(--border-gold)',
      borderRadius:12,
      boxShadow:'0 8px 32px rgba(0,0,0,0.6)',
      overflow:'hidden', display:'flex', flexDirection:'column',
    }}>
      {/* header */}
      <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border-subtle)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div style={{ flex:1, minWidth:0 }}>
            <Crumbs trail={trail} active={trail.length-1}/>
            <div className="label" style={{ fontSize:10, color: sCol }}>{kind.toUpperCase()}</div>
            <div className="display" style={{ fontSize:22, marginTop:2 }}>{title}</div>
            {sub && <div className="label" style={{ fontSize:10, marginTop:4, color:'var(--text-tertiary)' }}>{sub}</div>}
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <button style={btn}>← back</button>
            <button style={{...btn, padding:'4px 8px'}}>✕</button>
          </div>
        </div>
      </div>
      <div style={{ flex:1, minHeight:0, overflow:'auto', padding:'14px 18px' }}>{children}</div>
      <div style={{ padding:'10px 18px', borderTop:'1px solid var(--border-subtle)',
                    display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div className="label" style={{ fontSize:9, color:'var(--text-muted)' }}>ESC closes · ← steps back · the encounter remains paused</div>
        <button style={{...btn, color:'var(--accent-gold)', borderColor:'var(--border-accent)'}}>open her sheet ↗</button>
      </div>
    </div>
  );
}

const btn = {
  background:'transparent', color:'var(--text-tertiary)',
  border:'1px solid var(--border-subtle)', borderRadius:6,
  padding:'4px 10px', fontFamily:'var(--font-display)', fontSize:11,
  letterSpacing:'.1em', textTransform:'uppercase', cursor:'pointer',
};

function Section({ label, children, gold }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div className="label" style={{ fontSize:10, marginBottom:6, color: gold?'var(--accent-gold)':'var(--text-tertiary)' }}>{label}</div>
      {children}
    </div>
  );
}

// ── ACTOR ─────────────────────────────────────────────────────────
function ActorDetail() {
  return (
    <ModalShell
      trail={['ENCOUNTER', 'CAPTAIN VEIREN']}
      kind="ACTOR" title="Captain Veiren"
      sub="IRON · CIVIC GUARD · HONOUR-BOUND" sphere="force">
      <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', gap:14 }}>
        <PortraitPlaceholder w={180} h={220} sphere="iron" subject="Veiren" />
        <div>
          <Section label="DISPOSITION TOWARD HER" gold>
            <div className="prose" style={{ fontSize:14 }}>
              <em>suspicious, but he remembers her.</em> Her name has weight in his mouth. He has not yet decided what to do with that weight.
            </div>
          </Section>
          <Section label="WHAT SHE IS TO HIM">
            <div className="prose" style={{ fontSize:13 }}>
              A debt and a winter ago. The girl who held a frightened smuggler's life in her hand at the iron market and gave it back. He has not forgiven himself for what he asked of her.
            </div>
          </Section>
        </div>
      </div>
      <Section label="THREADS BETWEEN THEM">
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            ['authority taut','var(--sphere-force-bright)'],
            ['the iron market debt','var(--accent-gold)'],
            ['her vow, his witness','var(--sphere-spirit-bright)'],
          ].map(([t,c]) => (
            <span key={t} className="panel" style={{ padding:'4px 10px', fontSize:12, color:'var(--text-secondary)', borderColor:c }}>
              <i style={{ display:'inline-block', width:14, height:1, background:c, marginRight:6, verticalAlign:'middle' }}/>
              {t}
            </span>
          ))}
        </div>
      </Section>
      <Section label="WHEN THIS THREAD LAST PULLED">
        <div className="panel" style={{ padding:'10px 12px' }}>
          <div className="label" style={{ fontSize:9 }}>47 TURNS AGO · THE IRON MARKET</div>
          <div className="prose" style={{ fontSize:12, fontStyle:'italic', color:'var(--text-secondary)', marginTop:4 }}>
            "She held the boy's life in her hand and gave it back. The captain asked her, and she answered."
          </div>
        </div>
      </Section>
    </ModalShell>
  );
}

// ── ITEM ──────────────────────────────────────────────────────────
function ItemDetail() {
  return (
    <ModalShell
      trail={['ENCOUNTER', 'EIRA OF BREN', "CAPTAIN'S TOKEN"]}
      kind="ITEM · IN HER POSSESSION" title="Captain's token"
      sub="MATTER · A SMALL FAVOR · WORN AT THE COLLAR" sphere="matter">
      <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:14 }}>
        <div className="panel" style={{ width:160, height:160, display:'grid', placeItems:'center',
          background:'radial-gradient(circle at 50% 40%, #3a2a1a 0%, #0c0c10 80%)' }}>
          <div style={{ width:60, height:60, borderRadius:99, border:'2px solid var(--sphere-matter-bright)',
            boxShadow:'0 0 20px var(--sphere-matter)', position:'relative' }}>
            <i style={{ position:'absolute', inset:8, borderRadius:99,
              background:'radial-gradient(circle, #d4a87a 0%, #5a3d2c 70%)' }}/>
          </div>
        </div>
        <div>
          <Section label="WHAT IT MEANS HERE" gold>
            <div className="prose" style={{ fontSize:14 }}>
              The civic guard remembers her. Pressed iron, warm from her skin. <em>Bringing it into a queue is not nothing.</em>
            </div>
          </Section>
          <Section label="WHO GAVE IT">
            <div className="prose" style={{ fontSize:13 }}>
              <span className="term">Captain Veiren</span>, the night of the iron market. He pressed it into her hand and did not say why.
            </div>
          </Section>
        </div>
      </div>
      <Section label="HOW IT TILTS THIS SCENE">
        <div className="prose" style={{ fontSize:13 }}>
          On any IRON lean, the captain hesitates a half-beat longer. He cannot pretend he does not see her.
        </div>
      </Section>
    </ModalShell>
  );
}

// ── FACTION ───────────────────────────────────────────────────────
function FactionDetail() {
  return (
    <ModalShell
      trail={['ENCOUNTER', 'SCENE STATE', 'CIVIC GUARD OF BREN']}
      kind="FACTION" title="Civic Guard of Bren"
      sub="ORDER · IRON-WEIGHTED · HEADQUARTERED AT THE SOUTH GATE" sphere="order">
      <Section label="HOW THEY HOLD HER" gold>
        <div className="prose" style={{ fontSize:14 }}>
          <em>A name they remember.</em> Not yet useful. Not yet dangerous. They have not decided.
        </div>
      </Section>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Section label="ALLIED WITH">
          <div className="panel" style={{ padding:'8px 10px', borderColor:'var(--positive)' }}>
            <div style={{ fontSize:13 }}>The Council of Bren</div>
            <div className="prose" style={{ fontSize:11, color:'var(--text-tertiary)', fontStyle:'italic' }}>thin treaty · the gates open at council's word</div>
          </div>
        </Section>
        <Section label="OPPOSED">
          <div className="panel" style={{ padding:'8px 10px', borderColor:'var(--negative)' }}>
            <div style={{ fontSize:13 }}>The Salt-runners</div>
            <div className="prose" style={{ fontSize:11, color:'var(--text-tertiary)', fontStyle:'italic' }}>suspected · this scene's nervous trader</div>
          </div>
        </Section>
      </div>
      <Section label="REPUTATIONS THEY HOLD">
        <div className="panel" style={{ padding:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
            <span>Eira of Bren</span><em style={{ color:'var(--text-tertiary)' }}>a name they remember</em>
          </div>
          <div style={{ height:1, background:'var(--border-subtle)', margin:'8px 0' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
            <span>Halren the Lawful</span><em style={{ color:'var(--text-tertiary)' }}>useful, late for council</em>
          </div>
        </div>
      </Section>
    </ModalShell>
  );
}

// ── PLACE ─────────────────────────────────────────────────────────
function PlaceDetail() {
  return (
    <ModalShell
      trail={['ENCOUNTER', 'SOUTH GATE OF BREN']}
      kind="PLACE" title="South Gate of Bren"
      sub="DUSK · LANTERNS LIT · A CHOKE-POINT" sphere="time">
      <PlacePlaceholder h={180}/>
      <Section label="WHAT THIS PLACE WANTS" gold>
        <div className="prose" style={{ fontSize:14 }}>
          The room tilts toward AUTHORITY. Lanterns are lit; the captain has the light at his back. Anyone who speaks softly here will be heard by the wrong people.
        </div>
      </Section>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Section label="CONDITIONS HERE">
          <div className="prose" style={{ fontSize:12 }}>
            choke-point · lanterns lit · the queue will not turn back without violence
          </div>
        </Section>
        <Section label="MEMORY">
          <div className="prose" style={{ fontSize:12, fontStyle:'italic', color:'var(--text-tertiary)' }}>
            "She passed through this gate the night the iron market burned. She remembers the smell."
          </div>
        </Section>
      </div>
    </ModalShell>
  );
}

// ── EVENT ─────────────────────────────────────────────────────────
function EventDetail() {
  return (
    <ModalShell
      trail={['ENCOUNTER', 'EIRA', 'MOMENTS', 'THE IRON MARKET']}
      kind="EVENT · LAST WINTER" title="The iron market"
      sub="VEIREN-RELATED · INVOKED THIS BEAT · 47 TURNS AGO" sphere="time">
      <Section label="WHAT HAPPENED" gold>
        <div className="prose" style={{ fontSize:14 }}>
          A frightened smuggler ran into her arms in the iron market and Captain Veiren came after him with a drawn sword. She put her body between them and would not move. The boy lived. The captain pressed a token into her hand and did not speak of it.
        </div>
      </Section>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Section label="WHO WAS THERE">
          <div className="panel" style={{ padding:'8px 10px', display:'flex', gap:8 }}>
            <PortraitPlaceholder w={36} h={36} sphere="iron" subject=""/>
            <div>
              <div style={{ fontSize:12 }}><span className="term">Captain Veiren</span></div>
              <div className="prose" style={{ fontSize:10.5, color:'var(--text-tertiary)' }}>witness · his honour now hers</div>
            </div>
          </div>
        </Section>
        <Section label="WHAT IT BECAME">
          <div className="prose" style={{ fontSize:12 }}>
            The vow to the small folk · the captain's token · a name the civic guard remembers
          </div>
        </Section>
      </div>
      <Section label="HOW IT INVOKES NOW">
        <div className="panel" style={{ padding:'8px 10px', borderColor:'var(--accent-gold)',
            background:'linear-gradient(90deg, var(--accent-gold-glow), transparent)' }}>
          <div className="prose" style={{ fontSize:13, fontStyle:'italic' }}>
            The captain stops in front of her. He has not forgotten the iron market. <em>This beat invokes that one.</em>
          </div>
        </div>
      </Section>
    </ModalShell>
  );
}

// ── STACKING DIAGRAM ──────────────────────────────────────────────
function StackingDiagram() {
  // miniature representation: encounter dimmed, two stacked modals offset.
  return (
    <div style={{ width:'100%', height:'100%', position:'relative', overflow:'hidden',
      background:'var(--bg-abyss)' }}>
      {/* dimmed encounter behind */}
      <div style={{ position:'absolute', inset:0, opacity:.32, filter:'blur(2px)' }}>
        <EncounterShell paused selected="heart" dim ringFor="heart"/>
      </div>
      <div style={{ position:'absolute', inset:0, background:'rgba(10,10,14,.72)' }}/>

      {/* modal 1 — actor */}
      <div style={{ position:'absolute', left:60, top:50, transform:'translateZ(0)' }}>
        <div style={{ transform:'scale(.62)', transformOrigin:'top left', filter:'brightness(.8) saturate(.85)' }}>
          <ActorDetail />
        </div>
      </div>
      {/* modal 2 — event, stacked above */}
      <div style={{ position:'absolute', left:160, top:130 }}>
        <div style={{ transform:'scale(.62)', transformOrigin:'top left' }}>
          <EventDetail />
        </div>
      </div>

      {/* annotation */}
      <div style={{ position:'absolute', right:24, bottom:24, width:300 }}>
        <div className="panel gold" style={{ padding:14, background:'rgba(17,17,20,.92)' }}>
          <div className="label gold-label" style={{ fontSize:10 }}>STACKING BEHAVIOUR</div>
          <div className="prose" style={{ fontSize:12, marginTop:6 }}>
            Each modal tints the layer beneath by 28% black. The encounter underneath is <em>paused</em> — beat indicator dims, no auto-advance, ambient sound ducks 6dB. ESC closes the topmost; ← walks the breadcrumb back. Max stack depth: 4 — beyond that, the trail collapses into a "…" segment.
          </div>
        </div>
      </div>
    </div>
  );
}

window.ActorDetail = ActorDetail;
window.ItemDetail = ItemDetail;
window.FactionDetail = FactionDetail;
window.PlaceDetail = PlaceDetail;
window.EventDetail = EventDetail;
window.StackingDiagram = StackingDiagram;
