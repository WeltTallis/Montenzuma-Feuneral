import JsBarcode from "jsbarcode";

export interface BarcodeOptions {
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
}

/** The raw bar/string data JsBarcode produced, plus the width it reserved. */
interface BarcodeEncoding {
    text: string;
    data: string;
}

const SVG_NS = "http://www.w3.org/2000/svg";

const esc = (s: string): string =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Renders a CODE128 barcode as a standalone inline <svg> string.
 *
 * WHY SVG AND NOT PNG:
 * This used to use the `canvas` package to rasterise a PNG. That is a NATIVE
 * module with a C toolchain, and it has been breaking production Docker builds:
 *
 *   npm error path /usr/src/app/node_modules/canvas
 *   npm error command sh -c prebuild-install -r napi || node-gyp rebuild
 *   prebuild-install warn install No prebuilt binaries found (… libc=musl …)
 *   gyp ERR! find Python … gyp ERR! find Python
 *
 * Two compounding reasons it could never work on the Alpine images:
 *   1. `canvas` ships no musl prebuilt binary, so it ALWAYS falls back to
 *      node-gyp — which needs python3 + make + g++ in the image. The deps stage
 *      installs none of them (they were deliberately dropped to keep the image
 *      small).
 *   2. Even with a toolchain it would need cairo/pango/jpeg dev headers.
 *
 * The fix is not to add ~500MB of build toolchain to every service image, but to
 * stop needing a native rasteriser at all:
 *   - JsBarcode's "object" renderer returns the bar pattern as a plain string,
 *     so we can walk it and emit <rect> elements ourselves.
 *   - SVG is also the RIGHT output for the only caller: the barcode is inlined
 *     into an HTML autopsy report. It scales, prints crisply, and avoids a
 *     base64 blob.
 *
 * @returns an SVG string safe to inline in HTML.
 */
export const generateBarcodeBars = async (
    value: string,
    options: BarcodeOptions = {}
): Promise<string> => {
    if (!value || !value.trim()) {
        throw new Error("Barcode value cannot be empty");
    }

    const {
        width = 3,
        height = 100,
        displayValue = true,
        fontSize = 22,
        margin = 15,
    } = options;

    const safeValue = String(value).trim();

    // Ask JsBarcode for the bar pattern instead of a rendered surface.
    //
    // The published @types/jsbarcode `Options` interface predates the "object"
    // renderer and has no `renderer` field, so the options object is widened to
    // Record<string, unknown> and the call is cast. Runtime behaviour is what
    // matters here and the renderer key is fully supported by the library.
    const target: { encodings?: BarcodeEncoding[] } = {};
    JsBarcode(target, safeValue, {
        renderer: "object",
        format: "CODE128",
        width,
        height,
        displayValue,
        fontSize,
        margin,
        lineColor: "#000000",
        background: "#FFFFFF",
        text: safeValue,
        textAlign: "center",
        textPosition: "bottom",
        textMargin: 8,
    } as any);

    const encoding = target.encodings?.[0];
    if (!encoding || !encoding.data) {
        throw new Error(`Could not encode barcode value "${safeValue}"`);
    }

    // Walk the bit string: '1' = a bar, '0' = a gap. We coalesce runs so the
    // output has one rect per bar rather than one per module.
    const bars: string[] = [];
    let x = margin;
    let runStart = 0;
    let runValue = encoding.data[0];

    for (let i = 1; i <= encoding.data.length; i += 1) {
        const bit = encoding.data[i];
        if (bit !== runValue) {
            const runLength = (i - runStart) * width;
            // CODE128 never starts with a gap, but guard anyway so a malformed
            // string cannot emit a leading negative-width rect.
            if (runValue === "1" && runLength > 0) {
                bars.push(
                    `<rect x="${x}" y="${margin}" width="${runLength}" height="${height}" fill="#000000"/>`
                );
            }
            x += runLength;
            runStart = i;
            runValue = bit;
        }
    }

    // Bars start at `margin`, so the content width is the total span INCLUDING
    // the left margin. JsBarcode reserves a right margin too.
    const contentWidth = x - margin;
    const totalWidth = contentWidth + margin * 2;
    const textHeight = displayValue ? fontSize + 15 : 0;
    const totalHeight = height + textHeight + margin;

    const text = displayValue
        ? `<text x="${totalWidth / 2}" y="${height + margin + fontSize}" `
            + `text-anchor="middle" font-family="Helvetica, Arial, sans-serif" `
            + `font-size="${fontSize}" fill="#000000">${esc(encoding.text || safeValue)}</text>`
        : "";

    return `<svg xmlns="${SVG_NS}" width="${totalWidth}" height="${totalHeight}" `
        + `viewBox="0 0 ${totalWidth} ${totalHeight}" role="img" `
        + `aria-label="Barcode ${esc(safeValue)}">`
        + `<rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="#FFFFFF"/>`
        + bars.join("")
        + text
        + `</svg>`;
};

export default generateBarcodeBars; 
