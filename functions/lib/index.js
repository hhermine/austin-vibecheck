"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAnalyticsEvent = exports.exportToBigQuery = void 0;
// functions/src/index.ts
const admin = require("firebase-admin");
const bigquery_1 = require("@google-cloud/bigquery");
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
admin.initializeApp();
const bigquery = new bigquery_1.BigQuery();
const DATASET_ID = "vibecheck_analytics";
const LOCATIONS_TABLE_ID = "locations";
const EVENTS_TABLE_ID = "events";
// Helper to ensure dataset and table exist
const ensureTableExists = async (tableId, schema) => {
    try {
        const [dataset] = await bigquery.dataset(DATASET_ID).get({ autoCreate: true });
        try {
            await dataset.createTable(tableId, { schema });
            console.log(`Created table ${tableId}`);
        }
        catch (err) {
            if (!err.message.includes('Already Exists') && !err.message.includes('already exists')) {
                throw err;
            }
        }
    }
    catch (error) {
        console.error(`Table check failed for ${tableId}:`, error);
        throw error;
    }
};
const locationsSchema = [
    { name: "id", type: "STRING" },
    { name: "name", type: "STRING" },
    { name: "category", type: "STRING" },
    { name: "description", type: "STRING" },
    { name: "vibe_score", type: "INTEGER" },
    { name: "lat", type: "FLOAT" },
    { name: "lng", type: "FLOAT" },
    { name: "ai_vibe_summary", type: "STRING" },
    { name: "hashtags", type: "STRING", mode: "REPEATED" },
    { name: "created_at", type: "TIMESTAMP" },
];
exports.exportToBigQuery = (0, firestore_1.onDocumentCreated)("locations/{locationId}", async (event) => {
    const snap = event.data;
    if (!snap) {
        console.log("No data associated with the event");
        return;
    }
    const data = snap.data();
    const locationId = event.params.locationId;
    try {
        await ensureTableExists(LOCATIONS_TABLE_ID, locationsSchema);
        const row = {
            id: locationId,
            name: data.name,
            category: data.category,
            description: data.description,
            vibe_score: data.vibe_score,
            lat: data.lat,
            lng: data.lng,
            ai_vibe_summary: data.ai_vibe_summary || null,
            hashtags: data.hashtags || [],
            created_at: bigquery.timestamp(new Date()),
        };
        await bigquery
            .dataset(DATASET_ID)
            .table(LOCATIONS_TABLE_ID)
            .insert([row]);
        console.log(`Successfully exported location ${locationId} to BigQuery`);
    }
    catch (error) {
        console.error(`Failed to export location ${locationId}:`, error);
        throw error;
    }
});
const eventsSchema = [
    { name: "event_type", type: "STRING" },
    { name: "location_id", type: "STRING" },
    { name: "location_name", type: "STRING" },
    { name: "user_id", type: "STRING" },
    { name: "timestamp", type: "TIMESTAMP" },
    { name: "metadata", type: "STRING" }
];
exports.logAnalyticsEvent = (0, https_1.onCall)(async (request) => {
    var _a;
    const { event_type, location_id, location_name, metadata } = request.data;
    const userId = ((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid) || "anonymous";
    try {
        await ensureTableExists(EVENTS_TABLE_ID, eventsSchema);
        const row = {
            event_type,
            location_id: location_id || null,
            location_name: location_name || null,
            user_id: userId,
            timestamp: bigquery.timestamp(new Date()),
            metadata: metadata ? JSON.stringify(metadata) : null
        };
        await bigquery
            .dataset(DATASET_ID)
            .table(EVENTS_TABLE_ID)
            .insert([row]);
        return { success: true };
    }
    catch (error) {
        console.error("Failed to log event:", error);
        throw new https_1.HttpsError("internal", "Failed to log event");
    }
});
//# sourceMappingURL=index.js.map