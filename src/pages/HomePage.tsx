import { Link } from "react-router-dom";
import "./HomePage.css";

const STATS = [
  { value: "2M+", label: "JSONs formatted" },
  { value: "180K+", label: "errors caught" },
  { value: "40K+", label: "files uploaded" },
];

const TRUST_BADGES = [
  {
    icon: "🔒",
    text: "Processed locally — your JSON never leaves your device",
  },
  { icon: "⚡", text: "Instant — no round trips, no server delays" },
  { icon: "🆓", text: "Free forever — no account required" },
];

const FEATURE_CARDS = [
  {
    title: "10+ Operations",
    desc: "Beautify, minify, validate, repair, convert, and share — all in one tool.",
  },
  {
    title: "Any Size",
    desc: "Large files handled via Web Workers. No page freeze, no upload limit.",
  },
  {
    title: "Share Instantly",
    desc: "One-click URL sharing. No account, no sign-up, no expiry.",
  },
];

export function HomePage() {
  return (
    <main className="home">
      {/* Hero */}
      <section className="home-hero">
        <h1 className="home-hero__headline">
          Format, validate, and explore JSON —{" "}
          <span className="home-hero__accent">entirely in your browser.</span>
        </h1>
        <p className="home-hero__sub">
          No data sent to servers. No login. No ads.
        </p>

        <div className="home-trust">
          {TRUST_BADGES.map((b) => (
            <div key={b.icon} className="home-trust__badge">
              <span className="home-trust__icon">{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>

        <Link to="/editor" className="home-cta">
          Open the Editor →
        </Link>
      </section>

      {/* Stats bar */}
      <div className="home-stats" aria-label="Usage statistics">
        <span className="home-stats__label">Trusted by developers</span>
        {STATS.map((s) => (
          <div key={s.label} className="home-stats__item">
            <strong>{s.value}</strong> {s.label}
          </div>
        ))}
      </div>

      {/* Feature cards */}
      <section className="home-features" aria-labelledby="features-heading">
        <h2 id="features-heading" className="home-features__heading">
          Everything you need to work with JSON
        </h2>
        <div className="home-features__grid">
          {FEATURE_CARDS.map((c) => (
            <div key={c.title} className="home-feature-card">
              <h3 className="home-feature-card__title">{c.title}</h3>
              <p className="home-feature-card__desc">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
