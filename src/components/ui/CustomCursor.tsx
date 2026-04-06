import { useEffect, useRef, useState } from "react";

const TRAIL_COUNT = 6;

export const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pos = useRef({ x: -100, y: -100 });
  const trailPositions = useRef(Array.from({ length: TRAIL_COUNT }, () => ({ x: -100, y: -100 })));
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window;
    if (isTouchDevice) return;

    const handleMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
    };

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="button"], input, select, textarea, label, [data-interactive]')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleDown = () => { setIsClicking(true); setTimeout(() => setIsClicking(false), 150); };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseover", handleOver);
    window.addEventListener("mousedown", handleDown);

    let raf: number;
    const animate = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
      }
      for (let i = 0; i < TRAIL_COUNT; i++) {
        const prev = i === 0 ? pos.current : trailPositions.current[i - 1];
        trailPositions.current[i].x += (prev.x - trailPositions.current[i].x) * 0.15;
        trailPositions.current[i].y += (prev.y - trailPositions.current[i].y) * 0.15;
        const el = trailRefs.current[i];
        if (el) {
          el.style.transform = `translate(${trailPositions.current[i].x}px, ${trailPositions.current[i].y}px)`;
        }
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseover", handleOver);
      window.removeEventListener("mousedown", handleDown);
      cancelAnimationFrame(raf);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {Array.from({ length: TRAIL_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { trailRefs.current[i] = el; }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 4,
            height: 4,
            background: `hsl(157 100% 50% / ${0.3 - i * 0.04})`,
            willChange: 'transform',
          }}
        />
      ))}
      <div
        ref={cursorRef}
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ willChange: 'transform' }}
      >
        {/* Outer ring */}
        <div
          className="absolute rounded-full border transition-all duration-200"
          style={{
            width: isHovering ? 36 : 18,
            height: isHovering ? 36 : 18,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            borderColor: isClicking ? 'white' : 'hsl(157 100% 50% / 0.25)',
          }}
        />
        {/* Inner dot */}
        {!isHovering && (
          <div
            className="absolute rounded-full"
            style={{
              width: 4,
              height: 4,
              background: '#00ffb4',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
      </div>
    </div>
  );
};
