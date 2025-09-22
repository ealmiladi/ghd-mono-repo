export interface Packet {
    startByte: number;   // Should be 0xAA (170)
    idByte: number;
    data: number[];      // Array of data bytes
    checksum?: number;   // Optional checksum byte
}

export interface ParserFunction {
    (packet: Packet): void;
}

export interface ParsersRegistry {
    [key: number]: ParserFunction;
}
