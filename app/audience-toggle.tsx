// Pill switch between the people site (/) and the agents site (/agents).
export function AudienceToggle({ active }: { active: "people" | "agents" }) {
  return (
    <nav className="aud-toggle" aria-label="Choose site">
      <style>{css}</style>
      <a href="/" className={active === "people" ? "on" : ""} aria-current={active === "people" ? "page" : undefined}>
        For people
      </a>
      <a href="/agents" className={active === "agents" ? "on" : ""} aria-current={active === "agents" ? "page" : undefined}>
        For agents
      </a>
    </nav>
  );
}

const css = `
.aud-toggle { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2; display: inline-flex; gap: 2px; padding: 4px; border-radius: 999px; background: rgba(255,255,255,.85); box-shadow: inset 0 0 0 1px rgba(0,0,0,.08), 0 2px 10px rgba(20,30,60,.05); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.nav .aud-toggle { top: calc(50% + 4px + var(--safe-top, 0px) / 2); }
.v2-nav .aud-toggle { top: calc(50% + 9px + env(safe-area-inset-top, 0px) / 2); }
.aud-toggle a { padding: 7px 16px; border-radius: 999px; font-size: 14px; font-weight: 500; line-height: 1.2; color: #555; text-decoration: none; white-space: nowrap; transition: background .25s ease, color .25s ease; }
.aud-toggle a:hover { color: #111; }
.aud-toggle a.on { background: #111; color: #fff; }
@media (max-width: 620px) {
  .aud-toggle, .nav .aud-toggle, .v2-nav .aud-toggle { position: static; transform: none; margin-left: auto; }
  .aud-toggle a { padding: 6px 11px; font-size: 12.5px; }
  .v2-nav { flex-wrap: wrap; row-gap: 12px; }
  .v2-nav .aud-toggle { order: 3; margin: 0 auto; }
}
`;
