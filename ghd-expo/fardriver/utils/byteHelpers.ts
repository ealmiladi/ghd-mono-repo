// src/utils/helpers.ts

/**
 * Combines two bytes into a single 16-bit unsigned integer.
 * @param low - Low byte.
 * @param high - High byte.
 * @returns Combined 16-bit unsigned integer.
 */
export function combineBytes(high: number, low: number): number {
    return (high << 8) | low;
}

/**
 * Extracts a 16-bit unsigned integer from a byte array.
 * @param arg - Byte array.
 * @param lowIndex - Index of the low byte.
 * @param highIndex - Index of the high byte.
 * @returns Extracted 16-bit unsigned integer.
 */
export function extractUShort(arg: Uint8Array, lowIndex: number, highIndex: number): number {
    return combineBytes(arg[lowIndex], arg[highIndex]);
}

/**
 * Extracts a character from a byte.
 * @param byte - Byte value.
 * @returns Corresponding character.
 */
export function extractChar(byte: number): string {
    return String.fromCharCode(byte);
}

/**
 * Logs informational messages.
 * @param message - Message to log.
 */

/**
 * Formats a number as a hexadecimal string with leading zeros.
 * @param num - Number to format.
 * @param length - Desired length of the hexadecimal string.
 * @returns Formatted hexadecimal string.
 */
export function toHex(num: number, length: number = 2): string {
    return num.toString(16).padStart(length, '0').toUpperCase();
}

/**
 * Converts an array of bytes to a string, replacing non-printable characters with spaces.
 * @param bytes - Array of bytes.
 * @returns Cleaned string.
 */
export function bytesToString(bytes: number[]): string {
    return bytes.map(byte => (byte > 32 && byte <= 126 ? String.fromCharCode(byte) : ' ')).join('').trim();
}
