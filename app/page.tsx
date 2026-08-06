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
            <h1>Get paid for what you know.</h1>
            <p className="hero-sub">
              Answer questions whenever you have a minute. Stay anonymous. Get paid.
            </p>
            <JoinForm className="join-hero" />
          </div>

          <div className="phone" aria-hidden="true">
            <div className="phone-bezel">
              <span className="phone-earpiece" />
              <div className="phone-screen">
                <div className="phone-chrome">
                  <div className="phone-status">
                    <span className="phone-time">9:41</span>
                    <div className="phone-status-icons">
                      <svg className="phone-signal" viewBox="0 0 18 12" aria-hidden="true">
                        <rect x="0" y="8" width="3" height="4" rx="0.6" />
                        <rect x="5" y="5.5" width="3" height="6.5" rx="0.6" />
                        <rect x="10" y="3" width="3" height="9" rx="0.6" />
                        <rect x="15" y="0" width="3" height="12" rx="0.6" />
                      </svg>
                      <svg className="phone-wifi" viewBox="0 0 16 12" aria-hidden="true">
                        <path d="M8 10.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z" />
                        <path
                          d="M4.2 8.2a5.4 5.4 0 0 1 7.6 0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                        <path
                          d="M1.6 5.4a9 9 0 0 1 12.8 0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="phone-battery">
                        <span className="phone-battery-fill" />
                      </span>
                    </div>
                  </div>
                  <div className="phone-island">
                    <span className="phone-lens" />
                  </div>
                </div>

                <div className="phone-top">
                  <div className="phone-back" />
                  <div className="phone-identity">
                    <div className="phone-avatar">$</div>
                    <div className="phone-name">
                      <span className="phone-check">✓</span>
                      Chat.inc
                      <span className="phone-chevron">›</span>
                    </div>
                  </div>
                </div>

                <div className="phone-thread">
                  <div className="bubble bubble-in">
                    what was your experience using Profound the AI SEO tool? ($25)
                  </div>
                  <div className="bubble bubble-out">
                    Strong on AI citation tracking. Weak on classic rank reports. Best if you
                    already have Search Console wired up.
                  </div>
                  <div className="pay" aria-label="$25 Apple Cash">
                    <div className="pay-brand">
                      <span className="pay-apple"></span>
                      <span>Pay</span>
                    </div>
                    <div className="pay-amount">$25</div>
                  </div>
                </div>
              </div>
            </div>
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
