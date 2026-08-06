import { JoinForm } from "./join-form";

export default function Home() {
  return (
    <div className="site">
      <div className="wrap">
        <header className="nav">
          <a className="nav-brand" href="/">
            chat.inc
          </a>
          <a className="nav-cta" href="#join">
            Get a text
          </a>
        </header>

        <section className="hero" aria-label="Hero">
          <h1>Get paid for what you know.</h1>
          <p className="hero-lede">An anonymous expert network built on text.</p>
          <p className="hero-sub">
            Answer questions whenever you have a minute. Stay anonymous. Get paid.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href="#join">
              Get a text
            </a>
            <a className="btn btn-ghost" href="#how">
              Learn More
            </a>
          </div>
        </section>

        <section className="section" id="how">
          <h2 className="section-head">How it works</h2>
          <ol className="steps">
            <li>
              <strong>Create your profile</strong>
              <span>Tell us what you’ve worked on.</span>
            </li>
            <li>
              <strong>Get matched</strong>
              <span>Receive questions from people who need your experience.</span>
            </li>
            <li>
              <strong>Answer by text</strong>
              <span>No meetings. No scheduling. Just text.</span>
            </li>
            <li>
              <strong>Get paid</strong>
              <span>Earn for every conversation.</span>
            </li>
          </ol>
        </section>

        <section className="section" id="why">
          <h2 className="section-head">Why experts join</h2>
          <ul className="reason-list">
            <li>Get paid on your own schedule.</li>
            <li>Stay anonymous.</li>
            <li>No Zoom calls.</li>
            <li>Answer from your phone.</li>
            <li>Share real experience.</li>
          </ul>
          <div className="pill-row">
            <span className="pill">Most questions: under 5 messages</span>
            <span className="pill">No hour-long calls</span>
            <span className="pill">Minutes, not meetings</span>
          </div>
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
            Drop your number and we’ll text you. No app. No Zoom. Just a few messages.
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
