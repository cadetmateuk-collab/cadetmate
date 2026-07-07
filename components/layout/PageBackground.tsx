/** Subtle dotted page backdrop — fixed so pattern stays coherent while scrolling */
export function PageBackground() {
  return (
    <div
      className="bg-chart-dots pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
