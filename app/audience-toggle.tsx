// Shared header pieces for the people site (/) and the agents site (/agents),
// so the logo, toggle and Sign in sit in exactly the same place on both.
// Switching pages uses a cross-document view transition: the header stays put,
// the black pill slides to the other side and the page content cross-fades.
export function AudienceToggle({ active }: { active: "people" | "agents" }) {
  return (
    <nav className={`aud-toggle is-${active}`} aria-label="Choose site">
      <style>{css}</style>
      <span className="aud-pill" aria-hidden="true" />
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
const ease = `cubic-bezier(.22,1,.36,1)`;

const css = `
@view-transition { navigation: auto; }
::view-transition-group(root) { animation-duration: .45s; animation-timing-function: ${ease}; }
::view-transition-old(root) { animation: .3s ${ease} both aud-fade-out; }
::view-transition-new(root) { animation: .45s ${ease} both aud-fade-in; }
@keyframes aud-fade-out { to { opacity: 0; } }
@keyframes aud-fade-in { from { opacity: 0; transform: translateY(6px); } }
::view-transition-group(aud-pill) { animation-duration: .5s; animation-timing-function: ${ease}; }
::view-transition-group(aud-toggle), ::view-transition-group(site-brand), ::view-transition-group(site-signin) { animation-duration: .5s; }
::view-transition-old(aud-toggle), ::view-transition-new(aud-toggle) { animation-duration: .35s; }
.site-nav .nav-brand { font-family: ${font}; view-transition-name: site-brand; }
.aud-toggle { position: absolute; left: 50%; top: calc(50% + 4px + env(safe-area-inset-top, 0px) / 2); transform: translate(-50%, -50%); z-index: 2; display: grid; grid-template-columns: 1fr 1fr; gap: 2px; padding: 4px; border-radius: 999px; background: rgba(255,255,255,.85); box-shadow: inset 0 0 0 1px rgba(0,0,0,.08), 0 2px 10px rgba(20,30,60,.05); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); font-family: ${font}; view-transition-name: aud-toggle; }
.aud-pill { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 5px); border-radius: 999px; background: #111; view-transition-name: aud-pill; pointer-events: none; }
.aud-toggle.is-agents .aud-pill { left: calc(50% + 1px); }
.aud-toggle a { position: relative; z-index: 1; text-align: center; padding: 7px 16px; border-radius: 999px; font-size: 14px; font-weight: 500; line-height: 1.2; color: #555; text-decoration: none; white-space: nowrap; transition: color .3s ${ease}; }
.aud-toggle a:hover { color: #111; }
.aud-toggle a.on { color: #fff; }
.site-signin { view-transition-name: site-signin; white-space: nowrap; display: inline-flex; align-items: center; height: 38px; padding: 0 18px; border-radius: 999px; background: rgba(255,255,255,.8); box-shadow: inset 0 0 0 1px rgba(0,0,0,.08); color: #111; font-family: ${font}; font-size: 15px; font-weight: 500; text-decoration: none; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); transition: background .2s ease, box-shadow .2s ease; }
.site-signin:hover { background: #fff; box-shadow: inset 0 0 0 1px rgba(0,0,0,.14), 0 4px 14px rgba(40,60,120,.08); }
@media (max-width: 620px) {
  .site-nav { flex-wrap: wrap; row-gap: 0; }
  .site-nav::after { content: ""; order: 2; flex-basis: 100%; height: 0; }
  .site-nav .aud-toggle { position: static; transform: none; order: 3; margin: 12px auto 0; }
  .aud-toggle a { padding: 6px 12px; font-size: 13px; }
  .site-signin { height: 34px; padding: 0 14px; font-size: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
}
`;
