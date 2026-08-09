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
          </div>
        </header>

        <section className="hero" aria-label="Hero">
          <div className="hero-copy">
            <h1>
              <span className="hero-line">Get paid for what</span>
              <br />
              you know.
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
              src="/phone.png?v=8"
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
            <ol className="how-grid">
              <li>
                <div className="how-num" aria-hidden="true">
                  1
                </div>
                <div className="how-copy">
                  <strong>Create your profile</strong>
                  <span>Text us and confirm your identity.</span>
                </div>
              </li>
              <li>
                <div className="how-num" aria-hidden="true">
                  2
                </div>
                <div className="how-copy">
                  <strong>Get questions</strong>
                  <span>We'll send you questions via text</span>
                </div>
              </li>
              <li>
                <div className="how-num" aria-hidden="true">
                  3
                </div>
                <div className="how-copy">
                  <strong>Answer</strong>
                  <span>If you have an opinion text back, if not ignore.</span>
                </div>
              </li>
              <li>
                <div className="how-num" aria-hidden="true">
                  4
                </div>
                <div className="how-copy">
                  <strong>Get paid</strong>
                  <span>Earn for every answer.</span>
                </div>
              </li>
            </ol>
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
                  You need to identify who you are to Chat Inc. Your responses
                  are always kept fully anonymous.
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
    </div>
  );
}
