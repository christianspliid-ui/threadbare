// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies surface variant by default', () => {
    render(<Card>Content</Card>);
    const el = screen.getByText('Content').closest('div') as HTMLElement;
    expect(el.style.backgroundColor).toBe('var(--bg-surface)');
  });

  it('applies raised variant', () => {
    render(<Card variant="raised">Content</Card>);
    const el = screen.getByText('Content').closest('div') as HTMLElement;
    expect(el.style.backgroundColor).toBe('var(--bg-raised)');
  });

  it('applies glass variant with panel-glass class', () => {
    render(<Card variant="glass">Content</Card>);
    const el = screen.getByText('Content').closest('div') as HTMLElement;
    expect(el).toHaveClass('panel-glass');
  });

  it('renders Header with title', () => {
    render(
      <Card>
        <Card.Header title="Agent Detail" />
      </Card>,
    );
    expect(screen.getByText('Agent Detail')).toBeInTheDocument();
  });

  it('renders Header with count', () => {
    render(
      <Card>
        <Card.Header title="Retinue" count={3} />
      </Card>,
    );
    expect(screen.getByText(/Retinue/).textContent).toContain('(3)');
  });

  it('renders Header back button', () => {
    const fn = vi.fn();
    render(
      <Card>
        <Card.Header title="Detail" onBack={fn} />
      </Card>,
    );
    fireEvent.click(screen.getByLabelText('Back'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('renders Header trailing element', () => {
    render(
      <Card>
        <Card.Header title="Test" trailing={<span data-testid="trail">⚙</span>} />
      </Card>,
    );
    expect(screen.getByTestId('trail')).toBeInTheDocument();
  });

  it('renders Body children', () => {
    render(
      <Card>
        <Card.Body>Body content</Card.Body>
      </Card>,
    );
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('applies scroll overflow on Body', () => {
    render(
      <Card>
        <Card.Body scroll>Scrollable</Card.Body>
      </Card>,
    );
    const body = screen.getByText('Scrollable').closest('div') as HTMLElement;
    expect(body.style.overflowY).toBe('auto');
  });

  it('renders Footer children right-aligned', () => {
    render(
      <Card>
        <Card.Footer><button>OK</button></Card.Footer>
      </Card>,
    );
    const footer = screen.getByText('OK').closest('div') as HTMLElement;
    expect(footer.style.justifyContent).toBe('flex-end');
  });

  it('passes className', () => {
    render(<Card className="my-card">Content</Card>);
    const el = screen.getByText('Content').closest('div') as HTMLElement;
    expect(el).toHaveClass('my-card');
  });
});
