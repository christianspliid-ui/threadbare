/**
 * EntityLink — a named entity that opens its own profile when the surface can route
 * there, and reads as plain text when it cannot.
 *
 * Lifted out of `ChapterView` unchanged (THR-1298 slice 7) when the grievance surfaces
 * needed the same affordance in two more places. Four copies of a button's inline style
 * is how a design system stops being one; the fallback branch is the load-bearing half —
 * a surface with no `onOpenEntity` still renders the name, so a caller that forgets to
 * thread the handler loses the click and never the prose (UI Law 17).
 */

interface EntityLinkProps {
  id: string;
  name: string;
  /** Absent on surfaces that cannot open a profile — the name then renders as text. */
  onOpenEntity?: (id: string) => void;
}

export function EntityLink({ id, name, onOpenEntity }: EntityLinkProps) {
  if (!onOpenEntity) return <span style={{ color: 'var(--text-primary)' }}>{name}</span>;
  return (
    <button
      type="button"
      onClick={() => onOpenEntity(id)}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        cursor: 'pointer',
        color: 'var(--accent-gold, #d4af37)',
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
        font: 'inherit',
      }}
      aria-label={`${name} — open profile`}
    >
      {name}
    </button>
  );
}
