/**
 * StageLabelIcon — a Stage label's carved shape (THR-2100, plan § S4.2, R2).
 *
 * Reads `STAGE_LABEL_ICONS` by key, never a literal (Law 58). Decorative and in the label's
 * colour: the word beside it carries the meaning (Law 1), and no icon adds gold of its own
 * (Law 31). A row with no fitting idea (`null`) draws nothing. `tooltipId` turns it into
 * the explaining shape (the essence mark, Law 17).
 */
import { stageLabelIcon, type StageLabelKey } from '../../../data/stage-content';
import { Icon, type IconSize } from '../../shared/Icon';

export function StageLabelIcon({ label, size = 'chip', tooltipId }: { label: StageLabelKey; size?: IconSize; tooltipId?: string }) {
  const name = stageLabelIcon(label);
  if (!name) return null;
  return (
    <span data-stage-label-icon={name} style={{ display: 'inline-flex', marginRight: '0.35em', verticalAlign: 'middle' }}>
      <Icon name={name} size={size} decorative tooltipId={tooltipId} />
    </span>
  );
}
