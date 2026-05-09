const MockFBR = require('../models/MockFBR');
const MockCreditScore = require('../models/MockCreditScore');

/**
 * seedMockData
 *
 * Seeds MockFBR and MockCreditScore collections with sample data.
 * Uses upsert (updateOne with upsert:true) so it is idempotent —
 * safe to call on every server start without creating duplicates.
 */
const seedMockData = async () => {
  try {
    // ── Seed MockFBR ─────────────────────────────────────────
    const fbrData = MockFBR.SEED_DATA;
    let fbrInserted = 0;
    let fbrSkipped = 0;

    for (const record of fbrData) {
      const result = await MockFBR.updateOne(
        { ntn: record.ntn },
        { $setOnInsert: record },
        { upsert: true }
      );
      if (result.upsertedCount > 0) {
        fbrInserted++;
      } else {
        fbrSkipped++;
      }
    }

    console.log(
      `📋  MockFBR seed: ${fbrInserted} inserted, ${fbrSkipped} already exist.`
    );

    // ── Seed MockCreditScore ─────────────────────────────────
    const creditData = MockCreditScore.SEED_DATA;
    let creditInserted = 0;
    let creditSkipped = 0;

    for (const record of creditData) {
      const result = await MockCreditScore.updateOne(
        { companyName: record.companyName },
        { $setOnInsert: record },
        { upsert: true }
      );
      if (result.upsertedCount > 0) {
        creditInserted++;
      } else {
        creditSkipped++;
      }
    }

    console.log(
      `📊  MockCreditScore seed: ${creditInserted} inserted, ${creditSkipped} already exist.`
    );

    console.log('✅  Mock data seeding complete.');
  } catch (error) {
    console.error('❌  Mock data seeding failed:', error.message);
    // Non-fatal — don't crash the server if seeding fails
  }
};

module.exports = seedMockData;
