// encounter-shell.jsx — a tight recreation of the v7 layout for use as
// backdrop in moments 1 & 2. Sized for a 1280×800 artboard so the canvas
// holds several side-by-side. Faithful to v7 structure; uses placeholder
// regions for portraits / place painting (registered as flagged for real
// art per design system note).

const SPHERE = {
  iron:  { color:'var(--sphere-force-bright)',  dim:'var(--sphere-force)',  label:'IRON',  word:'small breath' },
  eye:   { color:'var(--sphere-mind-bright)',   dim:'var(--sphere-mind)',   label:'EYE',   word:'fuller breath' },
  heart: { color:'var(--sphere-spirit-bright)', dim:'var(--sphere-spirit)', label:'HEART', word:'deep draught' },
};

// Placeholder painted-portrait swatch (deep charcoal w/ a single warm rim
// thread of gold — matches "thin luminous threads at concentrated nodes")
function PortraitPlaceholder({ w=170, h=210, sphere='heart', subject='figure' }) {
  const c = sphere==='heart' ? '#7d4d52' : sphere==='eye' ? '#3a4a60' : '#5a3d2c';
  return (
    <div style={{
      width:w, height:h, borderRadius:6, position:'relative', overflow:'hidden',
      background: `radial-gradient(120% 90% at 35% 30%, ${c}55 0%, #181820 65%, #0c0c10 100%)`,
      boxShadow:'inset 0 0 0 1px var(--border-medium)',
    }}>
      {/* lantern thread */}
      <div style={{ position:'absolute', left:'42%', top:'18%', width:18, height:18, borderRadius:99,
        background:'radial-gradient(circle, #ffd28055 0%, transparent 60%)' }}/>
      <div style={{ position:'absolute', left:'46%', top:'24%', width:1, height:'52%',
        background:'linear-gradient(180deg, #ffd280 0%, transparent 90%)', opacity:.55 }}/>
      <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center',
        fontFamily:'var(--font-display)', color:'var(--text-muted)', fontSize:11, letterSpacing:'.18em' }}>
        {subject.toUpperCase()}
      </div>
    </div>
  );
}

function PlacePlaceholder({ w='100%', h=170 }) {
  return (
    <div style={{ width:w, height:h, borderRadius:6, position:'relative', overflow:'hidden',
      background:
        'radial-gradient(70% 60% at 50% 65%, #2a201a 0%, #100c0e 80%),'+
        'linear-gradient(180deg, #100b14, #0a0a0e)',
      boxShadow:'inset 0 0 0 1px var(--border-subtle)' }}>
      {/* gate silhouettes */}
      <div style={{ position:'absolute', inset:'10% 8% 10% 8%',
        background:
          'linear-gradient(90deg, #0a0a0e 0 14%, transparent 14% 86%, #0a0a0e 86% 100%)' }}/>
      {/* lanterns + falling spark thread */}
      <div style={{ position:'absolute', left:'28%', top:'28%', width:8, height:8, borderRadius:99,
        background:'#ffb84a', boxShadow:'0 0 14px 2px #ffb84a88' }}/>
      <div style={{ position:'absolute', right:'30%', top:'30%', width:8, height:8, borderRadius:99,
        background:'#ffb84a', boxShadow:'0 0 14px 2px #ffb84a88' }}/>
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox="0 0 400 170" preserveAspectRatio="none">
        <path d="M120,55 C170,40 210,60 260,30" stroke="#ffd180" strokeWidth=".9" fill="none" opacity=".7" />
        <circle cx="260" cy="30" r="2.5" fill="#ffd180" />
      </svg>
      <div style={{ position:'absolute', left:'45%', bottom:'10%', width:18, height:46,
        background:'#0a0a0e', borderTop:'1px solid #2a2520' }}/>
    </div>
  );
}

// Three lean cards (compressed). selected: 'iron' | 'eye' | 'heart' | null
function ChoiceCards({ selected, dim=false, ringFor }) {
  const Card = ({ id, title, body, tilt }) => {
    const s = SPHERE[id];
    const isSel = selected === id;
    const isRing = ringFor === id;
    return (
      <div className={isRing ? `ring-${id}` : ''}
        style={{
          flex:1, padding:14, borderRadius:8,
          background:'var(--bg-surface)',
          border: `1px solid ${isSel ? s.color : 'var(--border-subtle)'}`,
          opacity: dim && !isSel ? .35 : 1,
          transition:'opacity .3s, border-color .3s',
          position:'relative',
        }}>
        <div className="label" style={{ color: s.color, fontSize:11 }}>
          {s.label} · {s.word}
        </div>
        <div className="display" style={{ fontSize:18, marginTop:6, fontStyle:'italic', fontFamily:'var(--font-body)', fontWeight:400 }}>
          {title}
        </div>
        <div style={{ height:1, width:36, background:s.dim, margin:'8px 0 10px' }}/>
        <div className="prose" style={{ fontSize:13, lineHeight:1.55 }}>{body}</div>
        <div className="flavor" style={{ fontSize:12, marginTop:10, color:'var(--text-tertiary)' }}>
          {tilt}
        </div>
      </div>
    );
  };
  return (
    <div style={{ display:'flex', gap:10 }}>
      <Card id="iron"  title="Stir her resolve."  body="Her shoulders set. She closes the distance and meets Veiren's eye." tilt="Tilts toward: a wound, a debt, or his favour earned."/>
      <Card id="eye"   title="Sharpen her sight." body="Her gaze flicks past Veiren to the trader. Whatever he hides, she will see it." tilt="Tilts toward: knowledge, a thread to follow."/>
      <Card id="heart" title="Soften her stance." body="She finds the small folk's silence and gives it. Veiren picks another." tilt="Tilts toward: a vow deepened, a story moved sideways."/>
    </div>
  );
}

// Compressed v7 stage. width≈1240, height≈760 by default.
function EncounterShell({ selected=null, dim=false, ringFor=null, paused=false, children }) {
  return (
    <div className="tb-stage" style={{ padding:18, display:'flex', flexDirection:'column', gap:12 }}>
      {/* top thread strip */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
        <div>
          <div className="display gold-label" style={{ fontSize:18 }}>EIRA AT THE SOUTH GATE</div>
          <div className="label" style={{ fontSize:11, marginTop:4 }}>FAVORED THREAD · CIVIC GUARD QUEUE · SECOND CALL</div>
        </div>
        <div className="label" style={{ fontSize:11, display:'flex', alignItems:'center', gap:8 }}>
          BEAT
          <span style={{ display:'flex', gap:5 }}>
            <i style={{ width:6, height:6, borderRadius:99, background:'var(--text-muted)' }}/>
            <i style={{ width:8, height:8, borderRadius:99, background:'var(--accent-gold)', boxShadow:'0 0 10px var(--accent-gold-dim)' }}/>
            <i style={{ width:6, height:6, borderRadius:99, background:'var(--text-muted)' }}/>
            <i style={{ width:6, height:6, borderRadius:99, background:'var(--text-muted)' }}/>
          </span>
          <span style={{ marginLeft:6, color:'var(--text-tertiary)' }}>2 OF 4</span>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr 290px', gap:12, flex:1, minHeight:0 }}>
        {/* — Hero panel — */}
        <div className="panel" style={{ padding:14, display:'flex', flexDirection:'column', gap:10, position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div className="label gold-label" style={{ fontSize:10 }}>THE PROTAGONIST</div>
            <div className="label" style={{ fontSize:10, color:'var(--text-muted)' }}>↗ open her sheet</div>
          </div>
          <div style={{ display:'grid', placeItems:'center' }}>
            <PortraitPlaceholder w={210} h={230} sphere="heart" subject="Eira of Bren" />
          </div>
          <div className="display" style={{ fontSize:22, marginTop:2 }}>Eira of Bren</div>
          <div className="label" style={{ fontSize:10 }}>IRON · DRAWN BOND · 28 WINTERS</div>
          <div className="prose" style={{ fontSize:12, color:'var(--text-tertiary)', marginTop:-4 }}>
            <span style={{ display:'inline-block', width:6, height:6, borderRadius:99, background:'var(--positive)', marginRight:6 }}/>
            steady, but reading the room
          </div>

          <div style={{ marginTop:6 }}>
            <div className="label" style={{ fontSize:10, marginBottom:6 }}>CAPABILITY IN THIS SCENE</div>
            {[
              { k:'IRON',  c:'var(--sphere-force-bright)',  dots:3, prose:'a steady arm in a tight queue' },
              { k:'EYE',   c:'var(--sphere-mind-bright)',   dots:3, prose:'she misses little' },
              { k:'HEART', c:'var(--sphere-spirit-bright)', dots:5, prose:'her deepest thread' },
            ].map(b => (
              <div key={b.k} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0' }}>
                <div className="label" style={{ width:46, fontSize:10, color:b.c }}>{b.k}</div>
                <div style={{ display:'flex', gap:3 }}>
                  {[0,1,2,3,4].map(i => (
                    <i key={i} style={{ width:7, height:7, borderRadius:99,
                      background: i<b.dots ? b.c : 'var(--bg-raised)' }}/>
                  ))}
                </div>
                <div className="prose" style={{ fontSize:11, fontStyle:'italic', color:'var(--text-tertiary)', marginLeft:4 }}>{b.prose}</div>
              </div>
            ))}
          </div>

          <div className="label" style={{ fontSize:10, marginTop:8 }}>SHE CARRIES INTO THIS SCENE</div>
          <div className="panel" style={{ padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
            <i style={{ width:14, height:14, borderRadius:99, border:'1.5px solid var(--accent-gold)' }}/>
            <div>
              <div style={{ fontSize:13 }}>Captain's token</div>
              <div className="prose" style={{ fontSize:11, color:'var(--text-tertiary)' }}>small favor · civic guard remembers her</div>
            </div>
          </div>
          <div className="panel gold" style={{ padding:'8px 10px',
              background:'linear-gradient(90deg, rgba(170,68,221,.12), transparent)',
              borderColor:'var(--sphere-spirit)' }}>
            <div className="label" style={{ fontSize:9, color:'var(--sphere-spirit-bright)' }}>VOW · ACTIVE NOW</div>
            <div style={{ fontSize:13 }}>Vow to the small folk</div>
            <div className="prose" style={{ fontSize:11, fontStyle:'italic', color:'var(--text-tertiary)' }}>she will not crush a frightened man</div>
          </div>

          {/* Slot for moment-2 registrations to land */}
          {children}
        </div>

        {/* — Center column — */}
        <div className="panel gold" style={{ padding:18, display:'flex', flexDirection:'column', gap:12, minHeight:0, position:'relative' }}>
          <div>
            <div className="label gold-label" style={{ fontSize:10 }}>BEAT 2 · NOW</div>
            <div className="display" style={{ fontSize:26, marginTop:2 }}>The Captain Stops</div>
            <div className="gold-bar" style={{ marginTop:6 }}/>
          </div>
          <PlacePlaceholder h={210} />
          <div className="label" style={{ fontSize:10 }}>SOUTH GATE OF BREN · SEVENTH FACE OF THE QUEUE · DUSK</div>

          <div className="panel" style={{
            border:'1px solid var(--border-accent)',
            background:'linear-gradient(90deg, rgba(212,160,64,.08), transparent)',
            padding:'8px 12px' }}>
            <div className="flavor" style={{ fontSize:13 }}>
              ◀ <em>She invokes the night Veiren tested her at the iron market last winter.</em>
            </div>
            <div className="label" style={{ fontSize:9, marginTop:2 }}>CALLBACK FROM 47 TURNS AGO · INVOKED THIS BEAT</div>
          </div>

          <div className="label" style={{ fontSize:10 }}>WHAT HAPPENS NOW</div>
          <div className="prose" style={{ fontSize:14 }}>
            Veiren plants his bootheel in front of Eira and stops.
            <br/><em>"You. Step forward."</em>
            <br/>The queue holds its breath. Behind Eira, the trader thinks about <span className="term">running</span> — she can hear it in the way he stops breathing. Halren coughs from <span className="term">three places back</span>, loud and deliberate.
          </div>
          <div className="label" style={{ fontSize:10, color: paused ? 'var(--accent-gold)' : 'var(--text-tertiary)' }}>
            {paused ? 'EIRA HAS COMMITTED · THE WORLD RESOLVES' : 'EIRA HAS NOT YET DECIDED'}
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
            <div className="label gold-label" style={{ fontSize:11 }}>LEAN ON HER · OR DON'T</div>
            <div className="label" style={{ fontSize:10, color:'var(--text-muted)' }}>EACH LEAN TILTS A KIND OF CHANGE</div>
          </div>
          <ChoiceCards selected={selected} dim={dim} ringFor={ringFor}/>
        </div>

        {/* — Right rail — */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, minHeight:0 }}>
          <div className="panel" style={{ padding:12, display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <div className="label" style={{ fontSize:10 }}>CAST IN THE SCENE</div>
              <div className="label" style={{ fontSize:10, color:'var(--text-muted)' }}>3 OF 3</div>
            </div>
            {[
              { name:'Captain Veiren',    role:'IRON · CIVIC GUARD',   disp:'suspicious',   to:'a debt and a winter ago', tag:'honour-bound', s:'iron' },
              { name:'A nervous trader',  role:'EYE · HOODED',         disp:'about to bolt',to:'a stranger',              tag:'hidden cargo', s:'eye' },
              { name:'Halren the Lawful', role:'HEART · SPICE MERCHANT',disp:'late for council',to:'a face she has seen at council', tag:'watching', s:'heart' },
            ].map(c => (
              <div key={c.name} style={{ display:'flex', gap:8, padding:'2px 0' }}>
                <PortraitPlaceholder w={42} h={42} sphere={c.s} subject="" />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <div className="display" style={{ fontSize:13 }}>{c.name}</div>
                    <div className="label" style={{ fontSize:9, color:'var(--text-muted)' }}>{c.tag}</div>
                  </div>
                  <div className="label" style={{ fontSize:9, color: SPHERE[c.s].color }}>{c.role}</div>
                  <div className="prose" style={{ fontSize:11, color:'var(--text-tertiary)' }}>
                    disposition: <span className="term">{c.disp}</span><br/>
                    <em>to her: {c.to}</em>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="panel" style={{ padding:12 }}>
            <div className="label" style={{ fontSize:10, marginBottom:6 }}>YOUR HAND</div>
            {[
              { t:'Send a sign',         d:'divine.omen · cast unease · tilts dispositions soft', cost:'2 ESS' },
              { t:'Veil the trader\'s cargo', d:'divine.deceive · one beat of cover for the trader',  cost:'2 ESS' },
              { t:'Mark her with fate',  d:'divine.coincidence · this scene becomes biographical', cost:'4 ESS · RARE', gold:true },
            ].map(c => (
              <div key={c.t} className="panel"
                style={{ marginBottom:6, padding:'8px 10px', borderColor: c.gold ? 'var(--accent-gold)' : 'var(--border-subtle)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                    <i style={{ width:14, height:14, borderRadius:99, border: `1.5px solid ${c.gold?'var(--accent-gold)':'var(--text-muted)'}` }}/>
                    <div>
                      <div style={{ fontSize:13 }}>{c.t}</div>
                      <div className="prose" style={{ fontSize:11, color:'var(--text-tertiary)' }}>{c.d}</div>
                    </div>
                  </div>
                  <div className="label" style={{ fontSize:9, color: c.gold?'var(--accent-gold)':'var(--text-muted)' }}>{c.cost}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="panel" style={{ padding:12 }}>
            <div className="label" style={{ fontSize:10, marginBottom:6 }}>THE STATE OF THE SCENE</div>
            <div className="label" style={{ fontSize:9, color:'var(--text-muted)' }}>THREADS IN PLAY · FACTIONS</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
              {[
                ['authority taut','var(--sphere-force-bright)'],
                ['hidden satchel','var(--sphere-mind-bright)'],
                ['patience fraying','var(--sphere-time-bright)'],
                ['crowd\'s want','var(--sphere-spirit-bright)'],
              ].map(([t,c]) => (
                <span key={t} style={{ fontSize:11, color:'var(--text-secondary)' }}>
                  <i style={{ display:'inline-block', width:18, height:1, background:c, marginRight:6, verticalAlign:'middle' }}/>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* bottom strip */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <i style={{ width:24, height:24, borderRadius:99, border:'1px solid var(--border-accent)',
                      background:'radial-gradient(circle, var(--sphere-darkness) 30%, transparent 70%)' }}/>
          <div>
            <div className="display" style={{ fontSize:13 }}>Quintessence</div>
            <div className="label" style={{ fontSize:9, color:'var(--text-muted)' }}>two firm acts, three soft</div>
          </div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div className="label" style={{ fontSize:11 }}>LEAN ON HER · PLAY A CARD · OR LET THE DICE FALL</div>
          <div className="prose" style={{ fontSize:11, fontStyle:'italic', color:'var(--text-tertiary)' }}>
            no act is also a story · the world stays uncertain either way
          </div>
        </div>
        <div className="panel" style={{ padding:'6px 10px', minWidth:160 }}>
          <div className="display" style={{ fontSize:12 }}>Watch only</div>
          <div className="prose" style={{ fontSize:10.5, color:'var(--text-tertiary)' }}>
            Let her face this on her own.<br/>The dice fall. The story holds.
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EncounterShell, ChoiceCards, PortraitPlaceholder, PlacePlaceholder, SPHERE });
