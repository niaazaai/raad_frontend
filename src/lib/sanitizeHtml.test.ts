import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { describe, expect, test } from "bun:test";
import { sanitizeHtml } from "./sanitizeHtml";

const { window } = new JSDOM("<!DOCTYPE html><html><body></body></html>");
const purify = DOMPurify(window);

function clean(html: string): string {
  return sanitizeHtml(html, purify);
}

describe("sanitizeHtml", () => {
  test("keeps TipTap markup", () => {
    const html = clean("<p>Hello <strong>world</strong></p><ul><li>one</li></ul>");
    expect(html).toContain("<strong>world</strong>");
    expect(html).toContain("<li>one</li>");
  });

  test("strips script tags", () => {
    const html = clean("<p>ok</p><script>alert(1)</script>");
    expect(html.toLowerCase()).not.toContain("<script");
    expect(html.toLowerCase()).not.toContain("alert");
  });

  test("strips event handlers including unquoted and svg", () => {
    expect(clean('<img src="https://cdn.example/a.png" onerror="alert(1)">')).not.toContain("onerror");
    const svg = clean("<svg><animate onbegin=alert(1)></animate></svg>");
    expect(svg.toLowerCase()).not.toContain("onbegin");
    expect(svg.toLowerCase()).not.toContain("<svg");
  });

  test("blocks javascript and data urls", () => {
    expect(clean('<a href="javascript:alert(1)">x</a>').toLowerCase()).not.toContain("javascript:");
    expect(clean('<a href="&#106;avascript:alert(1)">x</a>').toLowerCase()).not.toContain("javascript:");
    expect(clean('<a href="data:text/html,hi">x</a>').toLowerCase()).not.toContain("data:");
    expect(clean('<img src="data:text/html,hi" alt="x">').toLowerCase()).not.toContain("data:");
  });

  test("keeps safe links and adds noopener on new tabs", () => {
    const html = clean('<a href="https://example.com/path" target="_blank">docs</a>');
    expect(html).toContain("https://example.com/path");
    expect(html).toContain("noopener");
    expect(html).toContain("noreferrer");
  });
});
