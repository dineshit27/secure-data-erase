export const ScanLineOverlay = () => (
  <div
    className="fixed inset-0 pointer-events-none z-[9998]"
    style={{
      background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,180,0.015) 2px, rgba(0,255,180,0.015) 3px)',
    }}
  />
);
