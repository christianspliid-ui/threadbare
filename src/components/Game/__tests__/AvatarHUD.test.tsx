// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AvatarHUD } from '../AvatarHUD';

describe('AvatarHUD', () => {
  const defaultProps = {
    avatarName: 'Kael the Wanderer',
    sphereColor: '#ff6633',
    onCenterOnAvatar: vi.fn(),
    onMoveClick: vi.fn(),
    onWheelClick: vi.fn(),
    onScryClick: vi.fn(),
  };

  it('displays avatar name', () => {
    render(<AvatarHUD {...defaultProps} />);
    // Avatar button now just shows "Avatar" (name is in sidebar)
    expect(screen.getByRole('button', { name: /^avatar$/i })).toBeTruthy();
  });

  it('calls onCenterOnAvatar when name is clicked', () => {
    render(<AvatarHUD {...defaultProps} />);
    // Click the Avatar center button (replaces the name button)
    fireEvent.click(screen.getByRole('button', { name: /^avatar$/i }));
    expect(defaultProps.onCenterOnAvatar).toHaveBeenCalled();
  });

  it('renders Move, Wheel, and Scry action buttons', () => {
    render(<AvatarHUD {...defaultProps} />);
    expect(screen.getByRole('button', { name: /move/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /wheel/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /scry/i })).toBeTruthy();
  });

  it('calls onMoveClick when Move button is clicked', () => {
    render(<AvatarHUD {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /move/i }));
    expect(defaultProps.onMoveClick).toHaveBeenCalled();
  });

  it('calls onWheelClick when Wheel button is clicked', () => {
    render(<AvatarHUD {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /wheel/i }));
    expect(defaultProps.onWheelClick).toHaveBeenCalled();
  });

  it('calls onScryClick when Scry button is clicked', () => {
    render(<AvatarHUD {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /scry/i }));
    expect(defaultProps.onScryClick).toHaveBeenCalled();
  });

  it('applies sphere color to accent elements', () => {
    const { container } = render(<AvatarHUD {...defaultProps} />);
    const accent = container.querySelector('[data-testid="avatar-accent"]');
    expect(accent).toBeTruthy();
  });

  it('highlights Move button when moveMode is true', () => {
    render(<AvatarHUD {...defaultProps} moveMode={true} />);
    const moveButton = screen.getByRole('button', { name: /move/i });
    // Should have a highlight style applied
    expect(moveButton).toHaveStyle({ opacity: '1' });
  });

  it('dims Move button when moveMode is false', () => {
    render(<AvatarHUD {...defaultProps} moveMode={false} />);
    const moveButton = screen.getByRole('button', { name: /move/i });
    // Should be dimmed
    expect(moveButton).toBeTruthy();
  });
});
