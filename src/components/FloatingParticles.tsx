import { useEffect, useRef } from "react";

const FloatingParticles = ({ count = 40 }: { count?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="floating-particles-bg" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="floating-particle"
          style={{
            "--fp-x": `${Math.random() * 100}%`,
            "--fp-y": `${Math.random() * 100}%`,
            "--fp-duration": `${6 + Math.random() * 12}s`,
            "--fp-delay": `${Math.random() * 8}s`,
            "--fp-size": `${2 + Math.random() * 4}px`,
            "--fp-opacity": `${0.15 + Math.random() * 0.35}`,
          } as React.CSSProperties}
        />
      ))}
      {/* Grid lines */}
      <div className="cyber-grid" />
    </div>
  );
};

export default FloatingParticles;
