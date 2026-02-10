import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import LandingPage from "@/app/(marketing)/page";

describe("marketing landing", () => {
  it("renders hero, conversion sections, and anchor targets", () => {
    const html = renderToStaticMarkup(LandingPage());

    expect(html).toContain("Operate blockchain infrastructure from one control plane.");
    expect(html).toContain("Start free with email");
    expect(html).toContain("Server-side provisioning flow");
    expect(html).toContain("Starter");
    expect(html).toContain("Launch your web3 office today.");

    expect(html).toContain('id="auth"');
    expect(html).toContain('id="plans"');
    expect(html).toContain('id="faq"');
    expect(html).toContain('href="#auth"');
  });
});
