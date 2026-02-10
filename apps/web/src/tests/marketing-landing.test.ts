import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import LandingPage from "@/app/(marketing)/page";
import { MarketingHeader } from "@/components/layout/marketing-header";

describe("marketing landing", () => {
  it("renders hero, conversion sections, and anchor targets", () => {
    const html = renderToStaticMarkup(LandingPage());

    expect(html).toContain("Launch and operate web3 infrastructure from one command center.");
    expect(html).toContain("Start free with email");
    expect(html).toContain("Queue-backed");
    expect(html).toContain("Built for web3 operator teams");
    expect(html).toContain("Ready to run your web3 operations stack?");
    expect(html).not.toContain("Vercel");

    expect(html).toContain('id="auth"');
    expect(html).toContain('id="plans"');
    expect(html).toContain('id="faq"');
    expect(html).toContain('id="how"');
    expect(html).toContain('href="#auth"');
  });

  it("uses public conversion links in header and avoids protected destinations", () => {
    const html = renderToStaticMarkup(MarketingHeader());

    expect(html).toContain('href="/#how"');
    expect(html).toContain('href="/#plans"');
    expect(html).toContain('href="/#faq"');
    expect(html).toContain('href="/#auth"');
    expect(html).toContain('href="/billing"');

    expect(html).not.toContain('href="/dashboard"');
    expect(html).not.toContain('href="/admin"');
  });
});
