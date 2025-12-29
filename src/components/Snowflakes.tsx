import { useEffect, useState } from 'react';

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  opacity: number;
  size: number;
  delay: number;
}

export const Snowflakes = () => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    const flakes: Snowflake[] = [];
    for (let i = 0; i < 50; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100,
        animationDuration: 5 + Math.random() * 10,
        opacity: 0.3 + Math.random() * 0.7,
        size: 4 + Math.random() * 8,
        delay: Math.random() * 5,
      });
    }
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute text-white animate-snowfall"
          style={{
            left: `${flake.left}%`,
            animationDuration: `${flake.animationDuration}s`,
            opacity: flake.opacity,
            fontSize: `${flake.size}px`,
            animationDelay: `${flake.delay}s`,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
};

export const useSnowflakes = () => {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('snowflakes-enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const toggle = () => {
    setEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem('snowflakes-enabled', String(newValue));
      return newValue;
    });
  };

  return { enabled, toggle };
};
