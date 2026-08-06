import { JoinForm } from "./join-form";

export default function Home() {
  return (
    <div className="site">
      <div className="wrap">
        <header className="nav">
          <div className="nav-left">
            <a className="nav-brand" href="/">
              chat.inc
            </a>
            <span className="nav-tagline">— anonymous expert network built on text.</span>
          </div>
        </header>

        <section className="hero" aria-label="Hero">
          <div className="hero-copy">
            <h1>
              Get paid for what
              <br />
              you know.
            </h1>
            <p className="hero-sub">
              Answer questions whenever you have a minute.
              <br />
              Stay anonymous. Get paid.
            </p>
            <JoinForm className="join-hero" />
          </div>

          <img
            className="phone"
            src="/phone.png?v=6"
            alt="chat.inc iMessage conversation paying $25 for an expert answer"
            width={808}
            height={1024}
          />
        </section>

        <section className="section" id="how">
          <h2 className="section-head">How it works</h2>
          <ol className="steps">
            <li>
              <strong>Create your profile</strong>
              <span>Text us and confirm your identity.</span>
            </li>
            <li>
              <strong>Get questions</strong>
              <span>Receive questions via text.</span>
            </li>
            <li>
              <strong>Answer</strong>
              <span>If you have an opinion text back, if not ignore.</span>
            </li>
            <li>
              <strong>Get paid</strong>
              <span>Earn for every answer.</span>
            </li>
          </ol>
        </section>

        <section className="section" id="why">
          <h2 className="section-head">Why experts join</h2>
          <ul className="reason-list">
            <li>Get paid for your experience and opinions.</li>
            <li>Stay anonymous.</li>
            <li>Answer easily via text.</li>
            <li>No calls.</li>
          </ul>
        </section>

        <section className="section" id="faq">
          <h2 className="section-head">FAQ</h2>
          <div className="faq">
            <details>
              <summary>Who can join?</summary>
              <p>
                Founders, engineers, investors, operators, designers, researchers—anyone with
                valuable experience.
              </p>
            </details>
            <details>
              <summary>How long are conversations?</summary>
              <p>1–5 messages. That’s it.</p>
            </details>
            <details>
              <summary>Do I have to reveal who I am?</summary>
              <p>No. Stay anonymous unless you choose otherwise.</p>
            </details>
            <details>
              <summary>What shouldn’t I discuss?</summary>
              <p>Never share confidential or non-public information.</p>
            </details>
          </div>
        </section>

        <section className="section join-section" id="join">
          <h2 className="section-head">Your experience is valuable.</h2>
          <p className="join-lede">
            Drop your number and we’ll text you.
          </p>
          <JoinForm />
        </section>

        <footer className="site-footer">
          <strong>chat.inc</strong>
          <span>Anonymous expertise, over text.</span>
        </footer>
      </div>
    </div>
  );
}
