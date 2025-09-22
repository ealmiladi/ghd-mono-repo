import BigNumber from 'bignumber.js';

import {
    TimeDeltaTracker,
    TimeDeltaTrackerOptions,
} from './TimeDeltaTracker';

export interface EnergyIntegratorOptions {
    /**
     * Options to configure the underlying time delta tracker.
     */
    timeTrackerOptions?: TimeDeltaTrackerOptions;

    /**
     * Threshold that determines when a controller supplied delta warrants an
     * adjustment. Expressed as a fraction (0.05 => 5%).
     */
    correctionTolerance?: number;

    /**
     * Minimum ratio allowed when reconciling local vs controller deltas.
     */
    minCorrectionRatio?: number;

    /**
     * Maximum ratio allowed when reconciling local vs controller deltas.
     */
    maxCorrectionRatio?: number;
}

const DEFAULT_OPTIONS: Required<EnergyIntegratorOptions> = {
    timeTrackerOptions: {},
    correctionTolerance: 0.05,
    minCorrectionRatio: 0.25,
    maxCorrectionRatio: 4,
};

/**
 * Integrates power samples (W) over time to produce energy (Wh). The class
 * keeps track of the total energy using locally measured intervals and then
 * applies corrections when the controller supplies authoritative time deltas.
 */
export class EnergyIntegrator {
    private readonly options: Required<EnergyIntegratorOptions>;
    private readonly timeTracker: TimeDeltaTracker;

    private localDeltaSumMs = 0;
    private localEnergySumWh = new BigNumber(0);
    private totalEnergyWh = new BigNumber(0);

    constructor(options: EnergyIntegratorOptions = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.timeTracker = new TimeDeltaTracker(
            this.options.timeTrackerOptions
        );
    }

    /**
     * Records a power sample. Returns the incremental energy (Wh) contributed
     * by this sample, based on the clamped local delta. Negative or zero power
     * samples contribute zero energy but still advance the internal clock.
     */
    recordSample(powerWatts: BigNumber, timestamp: number = Date.now()): BigNumber {
        const delta = this.timeTracker.noteLocalSample(timestamp);
        if (!delta) {
            return new BigNumber(0);
        }

        this.localDeltaSumMs += delta.deltaMs;

        if (powerWatts.lte(0)) {
            return new BigNumber(0);
        }

        const energyWh = powerWatts
            .multipliedBy(delta.deltaMs)
            .dividedBy(3600000);

        this.localEnergySumWh = this.localEnergySumWh.plus(energyWh);
        this.totalEnergyWh = this.totalEnergyWh.plus(energyWh);

        return energyWh;
    }

    /**
     * Applies a controller supplied uptime counter (raw units). Returns the
     * correction (Wh) that should be applied to the cumulative energy so the
     * integration window matches the controller’s authoritative timing.
     */
    applyControllerTimestamp(rawControllerTime: number): BigNumber {
        const controllerDelta = this.timeTracker.noteControllerTime(
            rawControllerTime
        );

        if (!controllerDelta || this.localDeltaSumMs === 0) {
            this.resetPendingWindow();
            return new BigNumber(0);
        }

        const ratio = controllerDelta.deltaMs / this.localDeltaSumMs;

        if (Math.abs(1 - ratio) <= this.options.correctionTolerance) {
            this.resetPendingWindow();
            return new BigNumber(0);
        }

        const boundedRatio = Math.min(
            this.options.maxCorrectionRatio,
            Math.max(this.options.minCorrectionRatio, ratio)
        );

        const correctedEnergy = this.localEnergySumWh.multipliedBy(boundedRatio);
        const deltaEnergy = correctedEnergy.minus(this.localEnergySumWh);

        if (!deltaEnergy.isZero()) {
            this.totalEnergyWh = this.totalEnergyWh.plus(deltaEnergy);
        }

        this.resetPendingWindow();
        return deltaEnergy;
    }

    getTotalEnergyWh(): BigNumber {
        return this.totalEnergyWh;
    }

    reset(): void {
        this.localDeltaSumMs = 0;
        this.localEnergySumWh = new BigNumber(0);
        this.totalEnergyWh = new BigNumber(0);
        this.timeTracker.reset();
    }

    private resetPendingWindow(): void {
        this.localDeltaSumMs = 0;
        this.localEnergySumWh = new BigNumber(0);
    }
}

