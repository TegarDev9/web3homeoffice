import Link from "next/link";

const appLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/billing", label: "Billing" },
  { href: "/academy", label: "Academy" },
  { href: "/app", label: "Open Hub" }
];

const apiLinks = [
  { href: "/api/provision/request", label: "POST /api/provision/request" },
  { href: "/api/provision/jobs", label: "GET /api/provision/jobs" },
  { href: "/api/billing/webhook", label: "POST /api/billing/webhook" }
];

export default function LandingPage() {
  return (
    <main className="landing-shell">
      <section className="hero">
        <p className="eyebrow">Cloudflare Pages + Worker Backend</p>
        <h1>Web3 Home Office</h1>
        <p className="subtitle">
          This domain serves static marketing from Pages while dynamic features are proxied to the Next.js Worker.
        </p>
        <div className="cta-row">
          {appLinks.map((link) => (
            <Link key={link.href} href={link.href} className="cta-button">
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Routing Compatibility</h2>
          <p>
            Existing public routes stay available. The Pages worker rewrites dynamic traffic to backend paths under{" "}
            <code>/app</code>.
          </p>
          <ul>
            <li>
              <code>/dashboard</code> - proxied to <code>/app/dashboard</code>
            </li>
            <li>
              <code>/billing</code> - proxied to <code>/app/billing</code>
            </li>
            <li>
              <code>/academy</code> - proxied to <code>/app/academy</code>
            </li>
            <li>
              <code>/app</code> - proxied to <code>/app/app</code>
            </li>
          </ul>
        </article>

        <article className="card">
          <h2>API Endpoints</h2>
          <p>The external API contract is unchanged, including provisioning and billing webhooks.</p>
          <ul>
            {apiLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
