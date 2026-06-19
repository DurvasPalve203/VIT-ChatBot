import { useEffect, useState, useCallback } from "react";

type RobotState = "idle" | "greeting" | "thinking" | "talking" | "celebrating";

interface AnimatedRobotProps {
  state?: RobotState;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: { w: 80, h: 80 },
  md: { w: 140, h: 140 },
  lg: { w: 220, h: 220 },
  xl: { w: 320, h: 320 },
};

const AnimatedRobot = ({ state = "idle", size = "lg", className = "" }: AnimatedRobotProps) => {
  const [eyeBlink, setEyeBlink] = useState(false);
  const [waveAngle, setWaveAngle] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [leftWaveAngle, setLeftWaveAngle] = useState(0);
  const { w, h } = sizeMap[size];

  // Track mouse globally
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Blink cycle
  useEffect(() => {
    const blink = setInterval(() => {
      setEyeBlink(true);
      setTimeout(() => setEyeBlink(false), 180);
    }, 3200);
    return () => clearInterval(blink);
  }, []);

  // Wave for greeting (right arm)
  useEffect(() => {
    if (state !== "greeting" && !isHovering) {
      setWaveAngle(0);
      setLeftWaveAngle(0);
      return;
    }
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      setWaveAngle(Math.sin(frame * 0.25) * 30);
      if (isHovering) {
        setLeftWaveAngle(Math.sin(frame * 0.25 + 1) * 30);
      } else {
        setLeftWaveAngle(0);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [state, isHovering]);

  // Calculate eye direction based on mouse
  const getEyeOffset = useCallback(
    (eyeCx: number, eyeCy: number) => {
      // Convert SVG coords to approximate screen position
      // This is a rough approximation - the eyes follow the general direction
      const svgCenterX = window.innerWidth / 2;
      const svgCenterY = window.innerHeight / 2;
      const dx = mousePos.x - svgCenterX;
      const dy = mousePos.y - svgCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxOffset = 3;
      const factor = Math.min(dist / 300, 1);
      return {
        x: (dx / (dist || 1)) * maxOffset * factor,
        y: (dy / (dist || 1)) * maxOffset * factor,
      };
    },
    [mousePos]
  );

  const leftEyeOffset = getEyeOffset(40, 33);
  const rightEyeOffset = getEyeOffset(60, 33);

  const eyeHeight = eyeBlink ? 1 : state === "thinking" ? 5 : 7;

  // Mouth animation for talking
  const [mouthOpen, setMouthOpen] = useState(3);
  useEffect(() => {
    if (state !== "talking") return;
    const interval = setInterval(() => {
      setMouthOpen(2 + Math.random() * 4);
    }, 120);
    return () => clearInterval(interval);
  }, [state]);

  return (
    <div
      className={`robot-container ${className}`}
      style={{ width: w, height: h }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Glow ring behind robot */}
      <div className="robot-glow-ring" />

      {/* Floating particles */}
      <div className="robot-particles">
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="robot-particle"
            style={{
              "--delay": `${i * 0.5}s`,
              "--x": `${Math.cos((i / 8) * Math.PI * 2) * 60}px`,
              "--y": `${Math.sin((i / 8) * Math.PI * 2) * 60}px`,
              "--size": `${3 + (i % 3) * 2}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* The robot SVG */}
      <svg
        viewBox="0 0 100 120"
        width={w}
        height={h}
        className={`robot-svg robot-state-${isHovering ? "greeting" : state}`}
      >
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(215 60% 28%)" />
            <stop offset="100%" stopColor="hsl(215 60% 16%)" />
          </linearGradient>
          <linearGradient id="headGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(215 55% 32%)" />
            <stop offset="100%" stopColor="hsl(215 60% 20%)" />
          </linearGradient>
          <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(174 55% 50%)" />
            <stop offset="100%" stopColor="hsl(174 55% 35%)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Antenna */}
        <g className="robot-antenna">
          <line x1="50" y1="18" x2="50" y2="8" stroke="hsl(215 40% 45%)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="50" cy="6" r="3.5" fill="url(#accentGrad)" filter="url(#glow)" className="robot-antenna-light" />
        </g>

        {/* Head */}
        <rect x="25" y="18" width="50" height="35" rx="10" fill="url(#headGrad)" stroke="hsl(174 55% 40%)" strokeWidth="0.8" />

        {/* Visor / face plate */}
        <rect x="30" y="24" width="40" height="18" rx="6" fill="hsl(215 40% 12%)" opacity="0.7" />

        {/* Eyes - follow mouse */}
        <g className="robot-eyes">
          <ellipse cx="40" cy="33" rx="5" ry={eyeHeight} fill="hsl(174 65% 55%)" filter="url(#glow)" />
          <ellipse cx="60" cy="33" rx="5" ry={eyeHeight} fill="hsl(174 65% 55%)" filter="url(#glow)" />
          {/* Pupils - track mouse */}
          <circle
            cx={40 + leftEyeOffset.x}
            cy={33 + leftEyeOffset.y}
            r="2"
            fill="hsl(174 80% 80%)"
          />
          <circle
            cx={60 + rightEyeOffset.x}
            cy={33 + rightEyeOffset.y}
            r="2"
            fill="hsl(174 80% 80%)"
          />
          {/* Eye highlights */}
          <circle cx={38 + leftEyeOffset.x * 0.5} cy={31} r="1" fill="white" opacity="0.6" />
          <circle cx={58 + rightEyeOffset.x * 0.5} cy={31} r="1" fill="white" opacity="0.6" />
        </g>

        {/* Mouth */}
        <g className="robot-mouth">
          {state === "talking" ? (
            <ellipse cx="50" cy="46" rx="7" ry={mouthOpen} fill="hsl(174 55% 45%)" filter="url(#softGlow)" />
          ) : isHovering || state === "celebrating" ? (
            <path d="M 40 44 Q 50 52 60 44" fill="none" stroke="hsl(174 55% 50%)" strokeWidth="1.5" strokeLinecap="round" filter="url(#softGlow)" />
          ) : (
            <line x1="43" y1="46" x2="57" y2="46" stroke="hsl(174 55% 45%)" strokeWidth="1.5" strokeLinecap="round" filter="url(#softGlow)" />
          )}
        </g>

        {/* Ear panels */}
        <rect x="20" y="28" width="5" height="12" rx="2" fill="hsl(215 50% 25%)" stroke="hsl(174 55% 40%)" strokeWidth="0.5" />
        <rect x="75" y="28" width="5" height="12" rx="2" fill="hsl(215 50% 25%)" stroke="hsl(174 55% 40%)" strokeWidth="0.5" />

        {/* Neck */}
        <rect x="43" y="53" width="14" height="6" rx="2" fill="hsl(215 40% 22%)" />

        {/* Body */}
        <rect x="28" y="59" width="44" height="36" rx="8" fill="url(#bodyGrad)" stroke="hsl(174 55% 40%)" strokeWidth="0.8" />

        {/* Chest panel / core */}
        <circle cx="50" cy="74" r="8" fill="hsl(215 40% 14%)" stroke="hsl(174 55% 40%)" strokeWidth="0.6" />
        <circle cx="50" cy="74" r="5" fill="url(#accentGrad)" filter="url(#glow)" className={isHovering ? "robot-core-excited" : "robot-core"} />

        {/* Chest details */}
        <rect x="34" y="84" width="32" height="2" rx="1" fill="hsl(174 55% 40%)" opacity="0.3" />
        <rect x="37" y="88" width="26" height="2" rx="1" fill="hsl(174 55% 40%)" opacity="0.2" />

        {/* Left arm - waves on hover */}
        <g
          className="robot-left-arm"
          style={{
            transformOrigin: "28px 62px",
            transform: isHovering ? `rotate(${leftWaveAngle}deg)` : undefined,
            transition: isHovering ? undefined : "transform 0.3s ease",
          }}
        >
          <rect x="15" y="62" width="13" height="24" rx="5" fill="hsl(215 50% 22%)" stroke="hsl(174 55% 40%)" strokeWidth="0.5" />
          <circle cx="21.5" cy="89" r="5" fill="hsl(215 50% 25%)" stroke="hsl(174 55% 40%)" strokeWidth="0.5" />
        </g>

        {/* Right arm - waves on greeting/hover */}
        <g
          className="robot-right-arm"
          style={{
            transformOrigin: "72px 62px",
            transform: (state === "greeting" || isHovering) ? `rotate(${-waveAngle}deg)` : undefined,
            transition: (state === "greeting" || isHovering) ? undefined : "transform 0.3s ease",
          }}
        >
          <rect x="72" y="62" width="13" height="24" rx="5" fill="hsl(215 50% 22%)" stroke="hsl(174 55% 40%)" strokeWidth="0.5" />
          <circle cx="78.5" cy="89" r="5" fill="hsl(215 50% 25%)" stroke="hsl(174 55% 40%)" strokeWidth="0.5" />
        </g>

        {/* Legs */}
        <rect x="35" y="95" width="12" height="16" rx="4" fill="hsl(215 50% 20%)" />
        <rect x="53" y="95" width="12" height="16" rx="4" fill="hsl(215 50% 20%)" />

        {/* Feet */}
        <rect x="32" y="108" width="18" height="6" rx="3" fill="hsl(215 50% 22%)" stroke="hsl(174 55% 40%)" strokeWidth="0.5" />
        <rect x="50" y="108" width="18" height="6" rx="3" fill="hsl(215 50% 22%)" stroke="hsl(174 55% 40%)" strokeWidth="0.5" />

        {/* Thinking indicator */}
        {state === "thinking" && (
          <g className="robot-thinking-dots">
            <circle cx="72" cy="15" r="2" fill="hsl(174 55% 50%)" opacity="0.6">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="80" cy="11" r="2.5" fill="hsl(174 55% 50%)" opacity="0.6">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" begin="0.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="89" cy="8" r="3" fill="hsl(174 55% 50%)" opacity="0.6">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" begin="0.6s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
      </svg>

      {/* Speech bubble for hover greeting */}
      {isHovering && (
        <div className="robot-speech-bubble">
          <span>👋 Hey there!</span>
        </div>
      )}

      {/* Speech bubble for greeting state (only on page load) */}
      {state === "greeting" && !isHovering && (
        <div className="robot-speech-bubble">
          <span>👋 Hello! How can I help?</span>
        </div>
      )}
    </div>
  );
};

export default AnimatedRobot;
