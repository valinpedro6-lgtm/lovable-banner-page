import { useEffect, useState } from "react";

const KEY = "lovable-mode";

export function ModeDot() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY) === "dark";
    setDark(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);

  const toggle = () => {
    setDark((d) => {
      const next = !d;
      window.localStorage.setItem(KEY, next ? "dark" : "light");
      return next;
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      className="group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] flex size-10 items-center justify-center rounded-full outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <span className="mode-dot block size-1.5 rounded-full group-hover:scale-150 group-hover:opacity-80 group-focus-visible:opacity-80" />
    </button>
  );
}
