export interface TimeDeltaTrackerOptions {
    /**
     * Multiplier used to clamp unusually large local intervals that may be
     * introduced by OS level throttling or backgrounding.
     */
    maxLocalIntervalMultiplier?: number;

    /**
     * Number of recent local intervals to keep when calculating the typical
     * cadence (median).
     */
    localWindowSize?: number;

    /**
     * Conversion factor for controller reported time units to milliseconds.
     */
    controllerTimeUnitInMs?: number;

    /**
     * Maximum controller supplied delta (in ms) we will accept before
     * clamping. Helps contain large jumps after reconnects.
     */
    maxControllerDeltaMs?: number;
}

export interface TrackedDelta {
    /**
     * Elapsed time in milliseconds for the associated measurement window.
     */
    deltaMs: number;

    /**
     * Whether the delta value was clamped to protect against spikes.
     */
    clamped?: boolean;
}

const DEFAULT_OPTIONS: Required<TimeDeltaTrackerOptions> = {
    maxLocalIntervalMultiplier: 2,
    localWindowSize: 10,
    controllerTimeUnitInMs: 1000,
    maxControllerDeltaMs: 10000,
};

/**
 * Tracks elapsed time between incoming samples using both the device clock
 * and the controller supplied uptime counter. The tracker exposes clamped
 * local deltas for use in real-time calculations and precise controller
 * deltas for periodic reconciliation.
 */
export class TimeDeltaTracker {
    private readonly options: Required<TimeDeltaTrackerOptions>;

    private lastLocalTimestamp: number | null = null;
    private readonly localDeltas: number[] = [];

    private lastControllerTimestampMs: number | null = null;

    constructor(options: TimeDeltaTrackerOptions = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Records a sample timestamp from the local device clock and returns the
     * elapsed time (ms) since the previous sample. The delta is clamped to the
     * typical cadence to minimise spikes caused by throttled BLE deliveries.
     */
    noteLocalSample(timestamp: number = Date.now()): TrackedDelta | null {
        if (this.lastLocalTimestamp === null) {
            this.lastLocalTimestamp = timestamp;
            return null;
        }

        const rawDelta = timestamp - this.lastLocalTimestamp;
        this.lastLocalTimestamp = timestamp;

        if (!Number.isFinite(rawDelta) || rawDelta <= 0) {
            return null;
        }

        let delta = rawDelta;
        let clamped = false;

        const typical = this.getTypicalLocalDelta();
        if (typical !== null) {
            const maxAllowed =
                typical * this.options.maxLocalIntervalMultiplier;
            if (delta > maxAllowed) {
                delta = maxAllowed;
                clamped = true;
            }
        }

        this.pushLocalDelta(delta);

        return { deltaMs: delta, clamped };
    }

    /**
     * Records the controller supplied uptime counter and returns the elapsed
     * time in milliseconds. The delta is clamped to guard against large
     * unexpected jumps, e.g. after reconnection.
     */
    noteControllerTime(rawControllerTime: number): TrackedDelta | null {
        const controllerTimestampMs =
            rawControllerTime * this.options.controllerTimeUnitInMs;

        if (!Number.isFinite(controllerTimestampMs)) {
            return null;
        }

        if (this.lastControllerTimestampMs === null) {
            this.lastControllerTimestampMs = controllerTimestampMs;
            return null;
        }

        let delta = controllerTimestampMs - this.lastControllerTimestampMs;
        this.lastControllerTimestampMs = controllerTimestampMs;

        if (!Number.isFinite(delta) || delta <= 0) {
            return null;
        }

        let clamped = false;
        if (delta > this.options.maxControllerDeltaMs) {
            delta = this.options.maxControllerDeltaMs;
            clamped = true;
        }

        return { deltaMs: delta, clamped };
    }

    reset(): void {
        this.lastLocalTimestamp = null;
        this.lastControllerTimestampMs = null;
        this.localDeltas.length = 0;
    }

    private pushLocalDelta(delta: number): void {
        this.localDeltas.push(delta);
        if (this.localDeltas.length > this.options.localWindowSize) {
            this.localDeltas.shift();
        }
    }

    private getTypicalLocalDelta(): number | null {
        if (this.localDeltas.length === 0) {
            return null;
        }

        const sorted = [...this.localDeltas].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }

        return sorted[mid];
    }
}

