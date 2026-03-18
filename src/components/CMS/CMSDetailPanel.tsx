/**
 * CMS Detail Panel — collapsible bottom panel showing full item data.
 */

interface Props {
  data: unknown;
  itemKey: string | number | null;
  entryLabel?: string;
  onClose: () => void;
}

export function CMSDetailPanel({ data, itemKey, entryLabel, onClose }: Props) {
  return (
    <div
      className="flex-none overflow-y-auto"
      style={{
        height: '280px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-deep)',
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 flex items-center justify-between px-4 py-2 z-10"
        style={{
          backgroundColor: 'var(--bg-deep)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--accent-gold)' }}>
            Detail
          </span>
          {entryLabel && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {entryLabel} &rsaquo; {String(itemKey)}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-xs px-2 py-0.5 rounded"
          style={{
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          Close
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-2">
        <pre
          className="text-xs leading-relaxed whitespace-pre-wrap break-words"
          style={{ color: 'var(--text-secondary)' }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
