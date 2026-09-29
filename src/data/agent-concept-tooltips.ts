/**
 * Agent concept tooltips (THR-1655) — the static half of the `agent.*` tooltip prefix.
 *
 * `agent.<node id>` is a live person and needs the graph (THR-1159). These ids are the
 * *concepts* a person's surface names — the bond word on the sheet, the notable chip on a
 * settlement page — committed content, identical in every world, so they resolve with no
 * context (Law 17: `Tooltip` calls `resolveTooltip(id)` with none). Plain register, ≤ 200
 * characters (plan doc `Docs/plans/2026-09-27-thr-1630-notables-and-ties.md` § Content 4).
 *
 * A bond basis without an entry here gets no tooltip, and its chip still renders its word.
 */

export interface AgentConceptTooltip {
  label: string;
  desc: string;
}

/** Keyed by the full tooltip id. `agent.bond.<canonical basis>` and `agent.notable`. */
export const AGENT_CONCEPT_TOOLTIPS: Readonly<Record<string, AgentConceptTooltip>> = {
  'agent.bond.kin': {
    label: 'Kin',
    desc: "Family. Kin grieve each other's deaths and inherit each other's grudges.",
  },
  'agent.bond.friendship': {
    label: 'Friend',
    desc: "Someone this person trusts. Friends are drawn into each other's troubles.",
  },
  'agent.bond.rivalry': {
    label: 'Rival',
    desc: 'Someone this person resents. A deep rivalry can become an old quarrel.',
  },
  'agent.notable': {
    label: 'Notable',
    desc: 'A local figure who holds something here, has an old quarrel, and wants something. They act on it now and then.',
  },
};

/** The tooltip id for a bond basis (already canonical). */
export function bondTooltipId(canonicalBasis: string): string {
  return `agent.bond.${canonicalBasis}`;
}
