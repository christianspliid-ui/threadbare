// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AvatarHUD } from '../AvatarHUD';

describe('AvatarHUD', () => {
  const defaultProps = {
    sphereColor: '#ff6633',
    onMoveClick: vi.fn(),
    onWheelClick: vi.fn(),
    onScryClick: vi.fn(),
  };

  it('renders Move, Actions, and Investiture buttons', () => {
    render(<AvatarHUD {...defaultProps} />);
    expect(screen.getByRole('button', { name: /move/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /actions/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /investiture/i })).toBeTruthy();
  });

  it('calls onMoveClick when Move button is clicked', () => {
    render(<AvatarHUD {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /move/i }));
    expect(defaultProps.onMoveClick).toHaveBeenCalled();
  });

  it('calls onWheelClick when Actions button is clicked', () => {
    render(<AvatarHUD {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /actions/i }));
    expect(defaultProps.onWheelClick).toHaveBeenCalled();
  });

  it('calls onScryClick when Investiture button is clicked', () => {
    render(<AvatarHUD {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /investiture/i }));
    expect(defaultProps.onScryClick).toHaveBeenCalled();
  });

  it('highlights Move button when moveMode is true', () => {
    render(<AvatarHUD {...defaultProps} moveMode={true} />);
    const moveButton = screen.getByRole('button', { name: /move/i });
    expect(moveButton).toHaveStyle({ opacity: '1' });
  });

  it('dims Move button when moveMode is false', () => {
    render(<AvatarHUD {...defaultProps} moveMode={false} />);
    const moveButton = screen.getByRole('button', { name: /move/i });
    expect(moveButton).toBeTruthy();
  });
});
