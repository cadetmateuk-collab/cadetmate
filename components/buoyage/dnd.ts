/** Shared drag-and-drop MIME type for buoy definitions. */
export const DND_TYPE = 'application/x-buoyage-definition';

/**
 * Compact mark-only drag preview (avoids the square ghost from the palette tile).
 */
export function setMarkDragGhost(
  e: { dataTransfer: DataTransfer },
  opts: { imageSrc?: string | null; label: string },
) {
  const size = 72;
  const ghost = document.createElement('div');
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    position: 'fixed',
    left: '-1000px',
    top: '0',
    width: `${size}px`,
    height: `${size}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    background: 'transparent',
    zIndex: '9999',
  });

  if (opts.imageSrc) {
    const img = document.createElement('img');
    img.src = opts.imageSrc;
    img.alt = '';
    Object.assign(img.style, {
      width: `${size - 4}px`,
      height: `${size - 4}px`,
      objectFit: 'contain',
      filter: 'drop-shadow(0 8px 16px rgba(15, 23, 42, 0.28))',
    });
    ghost.appendChild(img);
  } else {
    const chip = document.createElement('div');
    Object.assign(chip.style, {
      width: '52px',
      height: '52px',
      borderRadius: '9999px',
      background: 'rgba(255,255,255,0.96)',
      boxShadow: '0 8px 22px rgba(15, 23, 42, 0.18)',
      border: '1px solid rgba(15, 23, 42, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: '600',
      color: '#334155',
      fontFamily: 'system-ui, sans-serif',
    });
    chip.textContent = opts.label.slice(0, 4);
    ghost.appendChild(chip);
  }

  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, size / 2, size / 2);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => ghost.remove());
  });
}
