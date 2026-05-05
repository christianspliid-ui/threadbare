// app.jsx — top-level composition. Lays out three sections in a design canvas.
const { DesignCanvas, DCSection, DCArtboard, DCNote } = window;

function App() {
  return (
    <DesignCanvas>
      {/* ── MOMENT 1 ─────────────────────────────────────────────── */}
      <DCSection id="m1" title="Moment 1 · Dice / threads tension reveal"
        subtitle="From commit to resolve in five frames. The held-breath, the thrum, the one-thread-holds.">

        <DCArtboard id="m1-frame1" label="01 · Commit · the world holds its breath" width={680} height={460}>
          <div className="tb-stage"><MiniStage phase="pre" chosen="heart"/></div>
        </DCArtboard>

        <DCArtboard id="m1-frame2" label="02 · Threads draw" width={680} height={460}>
          <div className="tb-stage"><MiniStage phase="draw" chosen="heart"/></div>
        </DCArtboard>

        <DCArtboard id="m1-frame3" label="03 · Tension · they go taut" width={680} height={460}>
          <div className="tb-stage"><MiniStage phase="taut" chosen="heart"/></div>
        </DCArtboard>

        <DCArtboard id="m1-frame4" label="04 · Resolve · one thread holds" width={680} height={460}>
          <div className="tb-stage"><MiniStage phase="resolve" chosen="heart" dim ringFor="heart"/></div>
        </DCArtboard>

        <DCArtboard id="m1-frame5" label="05 · In place · what the player actually sees" width={1280} height={780}>
          <EncounterShell paused selected="heart" dim ringFor="heart"/>
        </DCArtboard>

        <DCArtboard id="m1-brief" label="Motion + sound brief" width={620} height={780}>
          <div className="tb-stage"><MotionSoundBrief/></div>
        </DCArtboard>
      </DCSection>

      {/* ── MOMENT 2 ─────────────────────────────────────────────── */}
      <DCSection id="m2" title="Moment 2 · Aftermath registration"
        subtitle="Nine effect kinds. Each lands where the eye already is. Sequencing for many-at-once.">

        <DCArtboard id="m2-grid" label="Nine effect kinds · landings + motion specs" width={1280} height={1100}>
          <NineEffectsGrid/>
        </DCArtboard>

        <DCArtboard id="m2-seq" label="Sequencing plan · many effects, one breath" width={840} height={620}>
          <SequencingPlan/>
        </DCArtboard>
      </DCSection>

      {/* ── MOMENT 3 ─────────────────────────────────────────────── */}
      <DCSection id="m3" title="Moment 3 · Click-through detail pages"
        subtitle="Five node types · breadcrumbs · stacked modals · the encounter stays paused.">

        <DCArtboard id="m3-actor" label="Actor · Captain Veiren" width={720} height={620}>
          <div className="tb-stage" style={{ display:'grid', placeItems:'center', background:'var(--bg-abyss)' }}>
            <ActorDetail/>
          </div>
        </DCArtboard>

        <DCArtboard id="m3-item" label="Item · Captain's token" width={720} height={620}>
          <div className="tb-stage" style={{ display:'grid', placeItems:'center', background:'var(--bg-abyss)' }}>
            <ItemDetail/>
          </div>
        </DCArtboard>

        <DCArtboard id="m3-faction" label="Faction · Civic Guard of Bren" width={720} height={620}>
          <div className="tb-stage" style={{ display:'grid', placeItems:'center', background:'var(--bg-abyss)' }}>
            <FactionDetail/>
          </div>
        </DCArtboard>

        <DCArtboard id="m3-place" label="Place · South Gate of Bren" width={720} height={620}>
          <div className="tb-stage" style={{ display:'grid', placeItems:'center', background:'var(--bg-abyss)' }}>
            <PlaceDetail/>
          </div>
        </DCArtboard>

        <DCArtboard id="m3-event" label="Event · The iron market" width={720} height={620}>
          <div className="tb-stage" style={{ display:'grid', placeItems:'center', background:'var(--bg-abyss)' }}>
            <EventDetail/>
          </div>
        </DCArtboard>

        <DCArtboard id="m3-stack" label="Modal stacking · encounter paused beneath" width={1280} height={780}>
          <StackingDiagram/>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
