import { useState, useEffect } from 'react';

export default function useIsLight() {
  const [isLight, setIsLight] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('light')
  );

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsLight(el.classList.contains('light'));
    });
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isLight;
}
