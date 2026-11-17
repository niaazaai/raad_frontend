import { describe, expect, test } from "bun:test";
import { buildXlsx, numericCell, xlsxFilename } from "./xlsxWorkbook";

describe("xlsx workbook", () => {
  test("writes numeric cells and keeps leading-zero text", () => {
    const bytes = buildXlsx("Fees", ["Amount", "Code"], [
      [1250.5, "0012"],
      ["1,500", "RC-9"],
      ["Ali", ""],
    ]);
    const xml = new TextDecoder().decode(bytes);

    expect(xml).toContain('<c r="A2" t="n"><v>1250.5</v></c>');
    expect(xml).toContain('<c r="B2" t="inlineStr"><is><t xml:space="preserve">0012</t></is></c>');
    expect(xml).toContain('<c r="A3" t="n"><v>1500</v></c>');
    expect(xml).toContain('<c r="A1" t="inlineStr">');
    expect(xml).toContain("PK");
    expect(xlsxFilename("class list.xls")).toBe("class-list.xlsx");
  });

  test("numericCell leaves codes and dates alone", () => {
    expect(numericCell("0012")).toBeNull();
    expect(numericCell("2026-08-19")).toBeNull();
    expect(numericCell("0")).toBe("0");
    expect(numericCell("-12.50")).toBe("-12.50");
  });
});
