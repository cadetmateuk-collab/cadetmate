'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WorldCanvas } from '@/components/buoyage/canvas/WorldCanvas';
import { BuoyageInspector } from '@/components/buoyage/inspector/BuoyageInspector';
import { BuoyageSidebar, MarksPalette } from '@/components/buoyage/sidebar/BuoyageSidebar';
import { BuoyageToolbar } from '@/components/buoyage/toolbar/BuoyageToolbar';
import { VesselView } from '@/components/buoyage/vessel/VesselView';
import { useBuoyageStore } from '@/hooks/buoyage/useBuoyageStore';
import { useBuoyageKeyboardShortcuts } from '@/hooks/buoyage/useKeyboardShortcuts';
import { useShipSimulation } from '@/hooks/buoyage/useShipSimulation';
import { getDefinition } from '@/data/buoyage';

export function BuoyageApp() {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const hydrate = useBuoyageStore((s) => s.hydrate);
  const autosave = useBuoyageStore((s) => s.autosave);
  const hydrated = useBuoyageStore((s) => s.hydrated);
  const viewMode = useBuoyageStore((s) => s.viewMode);
  const selectedIds = useBuoyageStore((s) => s.selectedIds);
  const pendingDefinitionId = useBuoyageStore((s) => s.pendingDefinitionId);

  const [marksOpen, setMarksOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  useBuoyageKeyboardShortcuts();
  useShipSimulation();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const id = window.setInterval(() => autosave(), 2000);
    return () => window.clearInterval(id);
  }, [hydrated, autosave]);

  useEffect(() => {
    if (!hydrated) return;
    const onHide = () => autosave();
    window.addEventListener('beforeunload', onHide);
    return () => window.removeEventListener('beforeunload', onHide);
  }, [hydrated, autosave]);

  // Auto-open inspector sheet when selecting a single object (tablet / phone)
  useEffect(() => {
    if (selectedIds.length === 1) setInspectorOpen(true);
    if (selectedIds.length === 0) setInspectorOpen(false);
  }, [selectedIds]);

  // Close marks sheet once a mark is armed for placement
  useEffect(() => {
    if (pendingDefinitionId) setMarksOpen(false);
  }, [pendingDefinitionId]);

  const showPlan = viewMode === 'plan' || viewMode === 'split';
  const showVessel = viewMode === 'vessel' || viewMode === 'split';
  // Side-by-side split only on wide screens; stack on tablet portrait / narrow
  const splitSideBySide = viewMode === 'split';

  return (
    <div
      data-buoyage-root
      className="relative flex h-[calc(100dvh-2.5rem)] w-full overflow-hidden bg-slate-200"
    >
      {showPlan && <BuoyageSidebar />}
      <div
        className={`relative flex min-w-0 flex-1 ${
          splitSideBySide ? 'flex-col xl:flex-row' : 'flex-col md:flex-row'
        }`}
      >
        {showPlan && (
          <div
            ref={canvasHostRef}
            data-buoyage-canvas
            className={`relative min-h-0 min-w-0 flex-1 ${
              showVessel && splitSideBySide ? 'min-h-[45%] xl:min-h-0 xl:flex-[1.2]' : ''
            }`}
          >
            <BuoyageToolbar
              onOpenMarks={() => setMarksOpen(true)}
              getViewportSize={() => {
                const el = canvasHostRef.current;
                if (!el) return { w: 800, h: 600 };
                return { w: el.clientWidth, h: el.clientHeight };
              }}
            />
            <WorldCanvas />
            <div className="pointer-events-none absolute bottom-3 left-3 right-3 max-w-md rounded-lg bg-black/50 px-2.5 py-1.5 text-[10px] leading-snug text-white/85 sm:right-auto sm:max-w-[90%]">
              {pendingDefinitionId ? (
                <>
                  Tap chart to place{' '}
                  <strong>{getDefinition(pendingDefinitionId)?.name ?? 'mark'}</strong>
                </>
              ) : (
                <>
                  <span className="xl:hidden">Marks button · </span>
                  <span className="hidden xl:inline">Drag or tap marks · </span>
                  Pinch zoom · Pen / eraser · Touch-drag empty chart to pan
                </>
              )}
            </div>
          </div>
        )}
        {showVessel && (
          <div
            className={`relative min-h-[38%] min-w-0 border-t border-black/10 md:min-h-0 ${
              showPlan
                ? splitSideBySide
                  ? 'flex-1 xl:max-w-[42%] xl:border-l xl:border-t-0'
                  : 'flex-1 md:max-w-[42%] md:border-l md:border-t-0'
                : 'flex-1'
            }`}
          >
            {!showPlan && (
              <BuoyageToolbar
                variant="bridge"
                getViewportSize={() => ({ w: 800, h: 600 })}
              />
            )}
            <VesselView />
          </div>
        )}
      </div>
      {showPlan && <BuoyageInspector variant="dock" />}

      {/* Tablet / phone: marks palette sheet */}
      <AnimatePresence>
        {showPlan && marksOpen && (
          <motion.div
            className="absolute inset-0 z-[80] flex flex-col justify-end xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close marks"
              onClick={() => setMarksOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="relative z-10 flex max-h-[min(72dvh,560px)] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl"
            >
              <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-300" />
              <MarksPalette variant="sheet" onPlaced={() => setMarksOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tablet / phone: inspector sheet */}
      <AnimatePresence>
        {showPlan && inspectorOpen && selectedIds.length > 0 && (
          <motion.div
            className="absolute inset-0 z-[80] flex flex-col justify-end xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/35"
              aria-label="Close inspector"
              onClick={() => setInspectorOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="relative z-10"
            >
              <BuoyageInspector variant="sheet" onClose={() => setInspectorOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BuoyageApp;
