import { useState } from "react";

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
}

export const GlitchText = ({ text, className = "", as: Tag = "span" }: GlitchTextProps) => {
  const [isGlitching, setIsGlitching] = useState(false);

  return (
    <Tag
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsGlitching(true)}
      onMouseLeave={() => setIsGlitching(false)}
    >
      {text}
      {isGlitching && (
        <>
          <span
            className="absolute inset-0 text-primary opacity-80"
            style={{ animation: 'glitch 0.3s infinite', left: '2px' }}
          >
            {text}
          </span>
          <span
            className="absolute inset-0 text-destructive opacity-80"
            style={{ animation: 'glitch 0.3s infinite reverse', left: '-2px' }}
          >
            {text}
          </span>
        </>
      )}
    </Tag>
  );
};
