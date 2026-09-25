// Shared header pieces for the people site (/) and the agents site (/agents),
// so the logo, toggle and Sign in sit in exactly the same place on both.
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

const font = `var(--font-sans), "Plus Jakarta Sans", system-ui, sans-serif`;

const css = `
.site-nav .nav-brand { font-family: ${font}; }
.aud-toggle { position: absolute; left: 50%; top: calc(50% + 4px + env(safe-area-inset-top, 0px) / 2); transform: translate(-50%, -50%); z-index: 2; display: inline-flex; gap: 2px; padding: 4px; border-radius: 999px; background: rgba(255,255,255,.85); box-shadow: inset 0 0 0 1px rgba(0,0,0,.08), 0 2px 10px rgba(20,30,60,.05); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); font-family: ${font}; }
.aud-toggle a { padding: 7px 16px; border-radius: 999px; font-size: 14px; font-weight: 500; line-height: 1.2; color: #555; text-decoration: none; white-space: nowrap; transition: background .25s ease, color .25s ease; }
.aud-toggle a:hover { color: #111; }
.aud-toggle a.on { background: #111; color: #fff; }
.site-signin { white-space: nowrap; display: inline-flex; align-items: center; height: 38px; padding: 0 18px; border-radius: 999px; background: rgba(255,255,255,.8); box-shadow: inset 0 0 0 1px rgba(0,0,0,.08); color: #111; font-family: ${font}; font-size: 15px; font-weight: 500; text-decoration: none; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); transition: background .2s ease, box-shadow .2s ease; }
.site-signin:hover { background: #fff; box-shadow: inset 0 0 0 1px rgba(0,0,0,.14), 0 4px 14px rgba(40,60,120,.08); }
@media (max-width: 620px) {
  .site-nav { flex-wrap: wrap; row-gap: 0; }
  .site-nav::after { content: ""; order: 2; flex-basis: 100%; height: 0; }
  .site-nav .aud-toggle { position: static; transform: none; order: 3; margin: 12px auto 0; }
  .aud-toggle a { padding: 6px 12px; font-size: 13px; }
  .site-signin { height: 34px; padding: 0 14px; font-size: 14px; }
}
`;
