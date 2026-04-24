/**
 * CMS Main Panel — dispatches to the correct viewer based on the selected entry.
 *
 * Extensibility: adding a new ViewerType only requires adding a case here
 * and creating the viewer component. All config comes from the registry entry.
 */

import type { ContentRegistryEntry, TunableGroup } from './types';
import { TableViewer } from './viewers/TableViewer';
import { RecordViewer } from './viewers/RecordViewer';
import { ConstantsViewer } from './viewers/ConstantsViewer';
import { ProseViewer } from './viewers/ProseViewer';
import { TreeViewer } from './viewers/TreeViewer';
import { ConfigManager } from './viewers/ConfigManager';
import { IASurfaceViewer } from './viewers/IASurfaceViewer';
import type { IASurface } from '../../data/ia-manifest';

interface Props {
  entry: ContentRegistryEntry | null;
  searchQuery: string;
  selectedItemKey: string | number | null;
  onSelectItem: (key: string | number) => void;
}

export function CMSMainPanel({ entry, searchQuery, selectedItemKey, onSelectItem }: Props) {
  if (!entry) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4" style={{ opacity: 0.2 }}>&#128218;</div>
          <p className="text-sm">Select a content dataset from the sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Entry header */}
      <div
        className="flex-none px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <h2
          className="text-base font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}
        >
          {entry.label}
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {entry.description}
          {entry.sourceFile && (
            <span className="ml-2 opacity-50">({entry.sourceFile})</span>
          )}
        </p>
        <ItemCount data={entry.data} />
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {renderViewer(entry, searchQuery, selectedItemKey, onSelectItem)}
      </div>
    </div>
  );
}

function renderViewer(
  entry: ContentRegistryEntry,
  searchQuery: string,
  selectedItemKey: string | number | null,
  onSelectItem: (key: string | number) => void,
) {
  switch (entry.viewer) {
    case 'table':
      return (
        <TableViewer
          data={entry.data as unknown[]}
          columns={entry.columns ?? []}
          searchQuery={searchQuery}
          searchFields={entry.searchFields}
          selectedKey={selectedItemKey}
          onSelectItem={onSelectItem}
        />
      );
    case 'record':
      return (
        <RecordViewer
          data={entry.data as Record<string, unknown>}
          searchQuery={searchQuery}
          selectedKey={selectedItemKey as string}
          onSelectItem={onSelectItem}
        />
      );
    case 'constants':
      return (
        <ConstantsViewer
          data={entry.data as Array<{ name: string; value: unknown; description?: string }>}
          searchQuery={searchQuery}
        />
      );
    case 'prose':
      return (
        <ProseViewer
          data={entry.data as Record<string, string | string[]>}
          searchQuery={searchQuery}
        />
      );
    case 'tree':
      return (
        <TreeViewer
          data={entry.data as Record<string, unknown[]>}
          searchQuery={searchQuery}
          onSelectItem={onSelectItem}
        />
      );
    case 'config-manager':
      return (
        <ConfigManager
          groups={entry.data as TunableGroup[]}
          searchQuery={searchQuery}
        />
      );
    case 'ia-surface':
      return (
        <IASurfaceViewer
          data={entry.data as IASurface[]}
          searchQuery={searchQuery}
          selectedKey={selectedItemKey}
          onSelectItem={onSelectItem}
        />
      );
    default:
      return <pre className="text-xs">{JSON.stringify(entry.data, null, 2)}</pre>;
  }
}

function ItemCount({ data }: { data: unknown }) {
  let count = 0;
  if (Array.isArray(data)) count = data.length;
  else if (data && typeof data === 'object') count = Object.keys(data).length;
  if (count === 0) return null;
  return (
    <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
      {count} {count === 1 ? 'item' : 'items'}
    </span>
  );
}
