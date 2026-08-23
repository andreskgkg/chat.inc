import { HowItWorks } from "./how-it-works";
import { JoinForm } from "./join-form";

export default function Home() {
  return (
    <div className="wrap">
      <header className="nav">
        <div className="nav-left">
          <a className="nav-brand" href="/">
            <span className="nav-logo" aria-hidden="true" />
            chat.inc
          </a>
        </div>
      </header>

      <section className="hero" aria-label="Hero">
        <div className="hero-copy">
          <h1>
            The first expert network{" "}
            <br />
            via text.
          </h1>
          <p className="hero-sub">
            Answer questions whenever you have a minute.
            <br />
            Stay anonymous. Get paid.
          </p>
          <div id="hero-join">
            <JoinForm className="join-hero" />
          </div>
        </div>

        <div className="hero-phone">
          <img
            className="phone"
            src="https://github.com/andreskgkg/chat.inc/releases/download/phone-fix-v8/phone.png"
            alt="chat.inc iMessage conversation paying $25 for an expert answer"
            width={808}
            height={1024}
          />
        </div>
      </section>

      <div className="content-band">
        <section className="section section-how" id="how">
          <h2 className="section-head section-head-center">
            <span className="brand-emph">Chat.inc</span> is a text-only expert
            network
          </h2>
          <HowItWorks />
        </section>

        <section className="section" id="faq">
          <h2 className="section-head">FAQ</h2>
          <div className="faq">
            <details>
              <summary>Who can join?</summary>
              <p>
                Founders, engineers, investors, operators, designers,
                researchers, and anyone with valuable experience.
              </p>
            </details>
            <details>
              <summary>How long are conversations?</summary>
              <p>1–5 messages. That’s it.</p>
            </details>
            <details>
              <summary>Do I have to reveal who I am?</summary>
              <p>
                You need to identify who you are to Chat Inc. Your responses are
                always kept fully anonymous.
              </p>
            </details>
            <details>
              <summary>What shouldn’t I discuss?</summary>
              <p>Never share confidential or violate any NDAs.</p>
            </details>
          </div>
        </section>

        <section className="section join-section" id="join">
          <h2 className="section-head">Get paid for what you know.</h2>
          <p className="join-lede">Drop your number and we’ll text you.</p>
          <JoinForm />
        </section>
      </div>

      <footer className="site-footer">
        <strong>chat.inc</strong>
        <span>A text-only expert network.</span>
      </footer>
    </div>
  );
}
