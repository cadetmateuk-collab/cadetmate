import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackedButton } from '@/components/analytics/TrackedButton';

const trackClick = vi.fn();

vi.mock('@/lib/analytics', () => ({
  trackClick: (...args: unknown[]) => trackClick(...args),
}));

describe('TrackedButton', () => {
  beforeEach(() => {
    trackClick.mockClear();
  });

  it('fires analytics and original onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <TrackedButton trackLabel="upgrade_cta" onClick={onClick}>
        Upgrade
      </TrackedButton>,
    );

    await user.click(screen.getByRole('button', { name: 'Upgrade' }));
    expect(trackClick).toHaveBeenCalledWith('upgrade_cta', undefined);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
