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
          <div className="hero-copy">
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
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="thread">
              <div className="bubble bubble-ask">
                What’s the fastest way to cut churn in the first 90 days?
                <span className="bubble-meta">anonymous · 2m</span>
              </div>
              <div className="bubble bubble-ans">
                Talk to the last 20 churned customers yourself. Patterns show up by call 8.
                <span className="bubble-meta">expert · paid</span>
              </div>
              <div className="bubble bubble-ask">
                Any red flags in a Series A SaaS with 110% NRR?
                <span className="bubble-meta">anonymous · just now</span>
              </div>
              <div className="bubble bubble-ans">
                Watch logo concentration. High NRR with 3 customers is still fragile.
                <span className="bubble-meta">expert · 1–5 messages</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="how">
          <h2 className="section-head">How it works</h2>
          <div className="steps">
            <article className="step">
              <h3>Create your profile</h3>
              <p>Tell us what you’ve worked on.</p>
            </article>
            <article className="step">
              <h3>Get matched</h3>
              <p>Receive questions from people who need your experience.</p>
            </article>
            <article className="step">
              <h3>Answer by text</h3>
              <p>No meetings. No scheduling. Just text.</p>
            </article>
            <article className="step">
              <h3>Get paid</h3>
              <p>Earn for every conversation.</p>
            </article>
          </div>
        </section>

        <section className="section" id="why">
          <div className="reasons">
            <h2 className="section-head">Why experts join</h2>
            <div>
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
            </div>
          </div>
        </section>

        <section className="section" id="faq">
          <h2 className="section-head">FAQ</h2>
          <div className="faq">
            <details open>
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

        <section className="section" id="join">
          <div className="footer-cta">
            <h2>Your experience is valuable.</h2>
            <p>
              Drop your number and we’ll text you. No app. No Zoom. Just a few messages.
            </p>
            <JoinForm />
          </div>
        </section>

        <footer className="site-footer">
          <strong>chat.inc</strong>
          <span>Anonymous expertise, over text.</span>
        </footer>
      </div>
    </div>
  );
}
