const { onCall, onRequest } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

exports.httpsCallableSample = onCall((request) => {
  logger.info("httpCallableSample triggered by client!");
  return {
    success: true,
    callingUserId: request.auth ? request.auth.uid : "unauthenticated",
  };
});

const STRIPE_KEY = "sk_live_ABC123";
const STRIPE_WEBHOOK_SECRET = "whsec_ABC123";
const stripe = require("stripe")(STRIPE_KEY);

const priceMap = {
  ITEM_ONE: "price_1PkDaPJtp8ouaxldjoaLj6cB",
  ITEM_TWO: "price_1PkDbBJtp8ouaxldExFzsObA",
};

exports.createCheckout = onCall(async (req) => {
  const { sku } = req.data;
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: priceMap[sku],
        quantity: 1,
      },
    ],
    metadata: { sku, userId: req.auth.uid },
    mode: "payment",
    success_url: "https://blazefa.st/success?sid={CHECKOUT_SESSION_ID}",
  });
  return { id: session.url };
});

exports.stripeWebhook = onRequest(async (req, res) => {
  logger.info("Received Stripe webhook");
  const event = stripe.webhooks.constructEvent(
    req.rawBody,
    req.headers["stripe-signature"],
    STRIPE_WEBHOOK_SECRET,
  );
  logger.info(event.type);
  switch (event.type) {
    default:
      logger.info(`No handler configured for event type ${event.type}`);
      break;
  }
  res.status(200).send({
    success: true,
  });
});

const parseNumber = (value) => {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (typeof value === "object") {
    if (value.seconds !== undefined && value.nanoseconds !== undefined) {
      return value.seconds * 1000 + Math.floor(value.nanoseconds / 1e6);
    }

    if (typeof value.toString === "function") {
      const parsed = parseFloat(value.toString());
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
};

exports.aggregateTripMetrics = onDocumentWritten(
  "controllers/{controllerId}/trips/{tripId}",
  async (event) => {
    const { controllerId } = event.params;
    const db = getFirestore();

    try {
      const tripsSnapshot = await db
        .collection("controllers")
        .doc(controllerId)
        .collection("trips")
        .get();

      let totalDistanceMeters = 0;
      let totalEnergyWh = 0;
      let totalDurationMs = 0;
      let tripCount = 0;
      let maxVoltageSag = 0;
      let maxGpsSpeedMeters = 0;
      let gpsSampleCount = 0;
      let gpsWeightedAvgSpeedMeters = 0;

      tripsSnapshot.forEach((doc) => {
        const data = doc.data() || {};

        const distanceMeters = parseNumber(data.distanceInMeters);
        totalDistanceMeters += distanceMeters;

        const energyWh = parseNumber(data.cumulativeEnergyWh);
        totalEnergyWh += energyWh;

        const startTime = parseNumber(data.startTime);
        const endTime = parseNumber(data.endTime);
        if (endTime > startTime) {
          totalDurationMs += endTime - startTime;
        }

        const sag = parseNumber(data.maxVoltageSag);
        if (sag > maxVoltageSag) {
          maxVoltageSag = sag;
        }

        const tripGpsSampleCount = parseNumber(data.gpsSampleCount);
        if (tripGpsSampleCount > 0) {
          gpsSampleCount += tripGpsSampleCount;
          const tripGpsAvgSpeed = parseNumber(data.gpsAvgSpeed);
          gpsWeightedAvgSpeedMeters += tripGpsAvgSpeed * tripGpsSampleCount;
          const tripGpsMaxSpeed = parseNumber(data.gpsMaxSpeedInMeters);
          if (tripGpsMaxSpeed > maxGpsSpeedMeters) {
            maxGpsSpeedMeters = tripGpsMaxSpeed;
          }
        }

        tripCount += 1;
      });

      const totalDistanceKilometers = totalDistanceMeters / 1000;
      const totalDistanceMiles = totalDistanceMeters / 1609.34;
      const averageWhPerKm =
        totalDistanceKilometers > 0
          ? totalEnergyWh / totalDistanceKilometers
          : 0;
      const averageWhPerMile =
        totalDistanceMiles > 0 ? totalEnergyWh / totalDistanceMiles : 0;
      const averageTripDistanceMeters =
        tripCount > 0 ? totalDistanceMeters / tripCount : 0;
      const averageTripDurationMs =
        tripCount > 0 ? totalDurationMs / tripCount : 0;
      const averageSpeedMetersCalculated =
        totalDurationMs > 0
          ? totalDistanceMeters / (totalDurationMs / 1000)
          : 0;
      const gpsAvgSpeedMeters =
        gpsSampleCount > 0 ? gpsWeightedAvgSpeedMeters / gpsSampleCount : 0;

      const metrics = {
        tripCount,
        totalDistanceMeters,
        totalDistanceKilometers,
        totalDistanceMiles,
        totalEnergyWh,
        averageWhPerKm,
        averageWhPerMile,
        totalDurationMs,
        averageTripDistanceMeters,
        averageTripDurationMs,
        averageSpeedMetersCalculated,
        maxVoltageSag,
        gpsSampleCount,
        gpsMaxSpeedInMeters: maxGpsSpeedMeters,
        gpsAvgSpeedInMeters: gpsAvgSpeedMeters,
        updatedAt: Date.now(),
      };

      await db
        .collection("controllers")
        .doc(controllerId)
        .set({ tripMetrics: metrics }, { merge: true });

      logger.info(
        `Trip metrics recomputed for controller ${controllerId}`,
        metrics,
      );
    } catch (error) {
      logger.error(
        `Failed to compute trip metrics for controller ${controllerId}`,
        error,
      );
      throw error;
    }
  },
);
