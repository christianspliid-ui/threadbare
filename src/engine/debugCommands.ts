import type { CourtPosition } from '../types/influence';
import type { SpotlightTier } from '../types/npc';

export type ParsedDebugCommand =
  | { kind: 'spawn-encounter'; agentQuery: string; templateId: string; courtPosition?: CourtPosition }
  | { kind: 'spawn-encounter-context'; templateId: string; agentQuery?: string; locationQuery?: string; col?: number; row?: number; moveAgent?: boolean }
  | { kind: 'spawn-attachment'; agentQuery: string; templateQuery: string; tick?: number }
  | { kind: 'spawn-location'; subtype: string; col: number; row: number; name?: string }
  | { kind: 'spawn-sublocation'; sublocationTypeId: string; locationQuery?: string; col?: number; row?: number; name?: string }
  | { kind: 'spawn-npc'; role: string; locationQuery?: string; col?: number; row?: number; name?: string; factionDefId?: string; spotlightTier?: SpotlightTier }
  | { kind: 'move-agent'; agentQuery: string; locationQuery?: string; col?: number; row?: number }
  | { kind: 'inspect-encounters'; agentFilter?: string };

export function tokenizeDebugCommand(input: string): string[] {
  const tokens: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(input)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }
  return tokens;
}

export function parseDebugCommand(input: string): ParsedDebugCommand | { error: string } {
  const tokens = tokenizeDebugCommand(input.trim());
  if (tokens.length === 0) return { error: 'Enter a command.' };

  const [head, second, ...rest] = tokens;

  if (head === 'spawn' && second === 'encounter') {
    if (rest.length < 2) {
      return { error: 'Usage: spawn encounter <agent> <encounterId> [--courtPosition <watched|retinue|the_first>]' };
    }

    const [agentQuery, templateId, ...flags] = rest;
    let courtPosition: CourtPosition | undefined;
    for (let i = 0; i < flags.length; i += 1) {
      const flag = flags[i];
      if (flag === '--courtPosition') {
        const value = flags[i + 1];
        if (value === 'watched' || value === 'retinue' || value === 'the_first') {
          courtPosition = value;
          i += 1;
        } else {
          return { error: 'courtPosition must be watched, retinue, or the_first.' };
        }
      } else {
        return { error: `Unknown flag '${flag}'.` };
      }
    }

    return { kind: 'spawn-encounter', agentQuery, templateId, courtPosition };
  }

  if (head === 'spawn' && second === 'encounter-context') {
    if (rest.length < 1) {
      return { error: 'Usage: spawn encounter-context <encounterId> [--agent <agent|@hero|@avatar>] [--at <location|actor>] [--hex <col> <row>] [--no-move-agent]' };
    }

    const [templateId, ...flags] = rest;
    let agentQuery: string | undefined;
    let locationQuery: string | undefined;
    let col: number | undefined;
    let row: number | undefined;
    let moveAgent = true;

    for (let i = 0; i < flags.length; i += 1) {
      const flag = flags[i];
      if (flag === '--agent') {
        const value = flags[i + 1];
        if (!value) return { error: 'Expected a value after --agent.' };
        agentQuery = value;
        i += 1;
      } else if (flag === '--at') {
        const value = flags[i + 1];
        if (!value) return { error: 'Expected a value after --at.' };
        locationQuery = value;
        i += 1;
      } else if (flag === '--hex') {
        const colValue = flags[i + 1];
        const rowValue = flags[i + 2];
        const parsedCol = Number.parseInt(colValue ?? '', 10);
        const parsedRow = Number.parseInt(rowValue ?? '', 10);
        if (Number.isNaN(parsedCol) || Number.isNaN(parsedRow)) {
          return { error: 'Usage: spawn encounter-context <encounterId> [--agent <agent|@hero|@avatar>] [--at <location|actor>] [--hex <col> <row>] [--no-move-agent]' };
        }
        col = parsedCol;
        row = parsedRow;
        i += 2;
      } else if (flag === '--no-move-agent') {
        moveAgent = false;
      } else {
        return { error: `Unknown flag '${flag}'.` };
      }
    }

    if (!agentQuery && !locationQuery && (col === undefined || row === undefined)) {
      return { error: 'spawn encounter-context requires --agent <agent>, --at <location|actor>, or --hex <col> <row>.' };
    }

    return { kind: 'spawn-encounter-context', templateId, agentQuery, locationQuery, col, row, moveAgent };
  }

  if (head === 'spawn' && second === 'attachment') {
    if (rest.length < 2) {
      return { error: 'Usage: spawn attachment <agent|@hero|@avatar> <templateId|name> [--tick <n>]' };
    }

    const [agentQuery, templateQuery, ...flags] = rest;
    let tick: number | undefined;

    for (let i = 0; i < flags.length; i += 1) {
      const flag = flags[i];
      if (flag === '--tick') {
        const value = flags[i + 1];
        const parsedTick = Number.parseInt(value ?? '', 10);
        if (Number.isNaN(parsedTick)) {
          return { error: 'tick must be an integer.' };
        }
        tick = parsedTick;
        i += 1;
      } else {
        return { error: `Unknown flag '${flag}'.` };
      }
    }

    return { kind: 'spawn-attachment', agentQuery, templateQuery, tick };
  }

  if (head === 'spawn' && second === 'location') {
    if (rest.length < 1) {
      return { error: 'Usage: spawn location <subtype> --hex <col> <row> [--name <name>]' };
    }

    const [subtype, ...flags] = rest;
    let col: number | undefined;
    let row: number | undefined;
    let name: string | undefined;

    for (let i = 0; i < flags.length; i += 1) {
      const flag = flags[i];
      if (flag === '--hex') {
        const colValue = flags[i + 1];
        const rowValue = flags[i + 2];
        const parsedCol = Number.parseInt(colValue ?? '', 10);
        const parsedRow = Number.parseInt(rowValue ?? '', 10);
        if (Number.isNaN(parsedCol) || Number.isNaN(parsedRow)) {
          return { error: 'Usage: spawn location <subtype> --hex <col> <row> [--name <name>]' };
        }
        col = parsedCol;
        row = parsedRow;
        i += 2;
      } else if (flag === '--name') {
        const value = flags[i + 1];
        if (!value) return { error: 'Expected a value after --name.' };
        name = value;
        i += 1;
      } else {
        return { error: `Unknown flag '${flag}'.` };
      }
    }

    if (col === undefined || row === undefined) {
      return { error: 'spawn location requires --hex <col> <row>.' };
    }

    return { kind: 'spawn-location', subtype, col, row, name };
  }

  if (head === 'spawn' && second === 'sublocation') {
    if (rest.length < 1) {
      return { error: 'Usage: spawn sublocation <typeId> (--at <location|actor|@hero> | --hex <col> <row>) [--name <name>]' };
    }

    const [sublocationTypeId, ...flags] = rest;
    let locationQuery: string | undefined;
    let col: number | undefined;
    let row: number | undefined;
    let name: string | undefined;

    for (let i = 0; i < flags.length; i += 1) {
      const flag = flags[i];
      if (flag === '--at') {
        const value = flags[i + 1];
        if (!value) return { error: 'Expected a value after --at.' };
        locationQuery = value;
        i += 1;
      } else if (flag === '--hex') {
        const colValue = flags[i + 1];
        const rowValue = flags[i + 2];
        const parsedCol = Number.parseInt(colValue ?? '', 10);
        const parsedRow = Number.parseInt(rowValue ?? '', 10);
        if (Number.isNaN(parsedCol) || Number.isNaN(parsedRow)) {
          return { error: 'Usage: spawn sublocation <typeId> (--at <location|actor|@hero> | --hex <col> <row>) [--name <name>]' };
        }
        col = parsedCol;
        row = parsedRow;
        i += 2;
      } else if (flag === '--name') {
        const value = flags[i + 1];
        if (!value) return { error: 'Expected a value after --name.' };
        name = value;
        i += 1;
      } else {
        return { error: `Unknown flag '${flag}'.` };
      }
    }

    if (!locationQuery && (col === undefined || row === undefined)) {
      return { error: 'spawn sublocation requires either --at <location|actor|@hero> or --hex <col> <row>.' };
    }

    return { kind: 'spawn-sublocation', sublocationTypeId, locationQuery, col, row, name };
  }

  if (head === 'spawn' && second === 'npc') {
    if (rest.length < 1) {
      return { error: 'Usage: spawn npc <role> (--at <location|actor|@hero> | --hex <col> <row>) [--name <name>] [--faction <factionDefId>] [--spotlight <ambient|notable|spotlight>]' };
    }

    const [role, ...flags] = rest;
    let locationQuery: string | undefined;
    let col: number | undefined;
    let row: number | undefined;
    let name: string | undefined;
    let factionDefId: string | undefined;
    let spotlightTier: SpotlightTier | undefined;

    for (let i = 0; i < flags.length; i += 1) {
      const flag = flags[i];
      if (flag === '--at') {
        const value = flags[i + 1];
        if (!value) return { error: 'Expected a value after --at.' };
        locationQuery = value;
        i += 1;
      } else if (flag === '--hex') {
        const colValue = flags[i + 1];
        const rowValue = flags[i + 2];
        const parsedCol = Number.parseInt(colValue ?? '', 10);
        const parsedRow = Number.parseInt(rowValue ?? '', 10);
        if (Number.isNaN(parsedCol) || Number.isNaN(parsedRow)) {
          return { error: 'Usage: spawn npc <role> (--at <location|actor|@hero> | --hex <col> <row>) [--name <name>] [--faction <factionDefId>] [--spotlight <ambient|notable|spotlight>]' };
        }
        col = parsedCol;
        row = parsedRow;
        i += 2;
      } else if (flag === '--name') {
        const value = flags[i + 1];
        if (!value) return { error: 'Expected a value after --name.' };
        name = value;
        i += 1;
      } else if (flag === '--faction') {
        const value = flags[i + 1];
        if (!value) return { error: 'Expected a value after --faction.' };
        factionDefId = value;
        i += 1;
      } else if (flag === '--spotlight') {
        const value = flags[i + 1];
        if (value === 'ambient' || value === 'notable' || value === 'spotlight') {
          spotlightTier = value;
          i += 1;
        } else {
          return { error: 'spotlight must be ambient, notable, or spotlight.' };
        }
      } else {
        return { error: `Unknown flag '${flag}'.` };
      }
    }

    if (!locationQuery && (col === undefined || row === undefined)) {
      return { error: 'spawn npc requires either --at <location|actor|@hero> or --hex <col> <row>.' };
    }

    return { kind: 'spawn-npc', role, locationQuery, col, row, name, factionDefId, spotlightTier };
  }

  if (head === 'move' && second === 'agent') {
    if (rest.length < 1) {
      return { error: 'Usage: move agent <agent|@hero|@avatar> (--to <location|actor|@ascendant> | --hex <col> <row>)' };
    }

    const [agentQuery, ...flags] = rest;
    let locationQuery: string | undefined;
    let col: number | undefined;
    let row: number | undefined;

    for (let i = 0; i < flags.length; i += 1) {
      const flag = flags[i];
      if (flag === '--to') {
        const value = flags[i + 1];
        if (!value) return { error: 'Expected a value after --to.' };
        locationQuery = value;
        i += 1;
      } else if (flag === '--hex') {
        const colValue = flags[i + 1];
        const rowValue = flags[i + 2];
        const parsedCol = Number.parseInt(colValue ?? '', 10);
        const parsedRow = Number.parseInt(rowValue ?? '', 10);
        if (Number.isNaN(parsedCol) || Number.isNaN(parsedRow)) {
          return { error: 'Usage: move agent <agent|@hero|@avatar> (--to <location|actor|@ascendant> | --hex <col> <row>)' };
        }
        col = parsedCol;
        row = parsedRow;
        i += 2;
      } else {
        return { error: `Unknown flag '${flag}'.` };
      }
    }

    if (!locationQuery && (col === undefined || row === undefined)) {
      return { error: 'move agent requires either --to <location|actor|@ascendant> or --hex <col> <row>.' };
    }

    return { kind: 'move-agent', agentQuery, locationQuery, col, row };
  }

  if (head === 'inspect' && (second === 'encounters' || second === 'encounter-pipeline')) {
    return { kind: 'inspect-encounters', agentFilter: rest[0] };
  }

  return { error: `Unknown command '${tokens.join(' ')}'.` };
}
