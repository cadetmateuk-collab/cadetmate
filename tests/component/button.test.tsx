import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders children and handles clicks', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Continue</Button>);

    const btn = screen.getByRole('button', { name: 'Continue' });
    expect(btn).toBeEnabled();
    await user.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Locked
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: 'Locked' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
