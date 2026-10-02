import JsBarcode from "jsbarcode";
import { createCanvas } from "canvas";

export interface BarcodeOptions {
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
}

export const generateBarcodeBars = async (
    value: string,
    options: BarcodeOptions = {}
): Promise<Buffer> => {
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

    // Calculate a reasonable canvas width for the barcode.
    const canvasWidth = Math.max(400, value.length * 25 + margin * 2);
    const canvasHeight = height + (displayValue ? fontSize + 15 : 0);

    const canvas = createCanvas(canvasWidth, canvasHeight);

    JsBarcode(canvas, value, {
        format: "CODE128",
        width,
        height,
        displayValue,
        fontSize,
        margin,

        // Clean black bars on a white background
        lineColor: "#000000",
        background: "#FFFFFF",

        // Text below the barcode
        text: value,
        textAlign: "center",
        textPosition: "bottom",
        textMargin: 8,
    });

    return canvas.toBuffer("image/png");
};



export default generateBarcodeBars 
