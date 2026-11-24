/* eslint-disable no-console */
/**
 * TS-72 — Merge tenants DB into publicdb (data migration only).
 *
 * Inventory (from code: models used with tenantsConnection / TENANTS_CONNECTION):
 *   tenants              — companies (Tenant)
 *   users                — auth / identity (User)
 *   stripeProducts       — billing catalog
 *   stripePrices         — billing catalog
 *   stripeSubscriptions  — per-tenant subscriptions
 *   stripeSessions       — checkout sessions
 *   domains              — domain model (if present)
 *
 * Already in publicdb (not copied): projects, tickets, sprints, epics, boards,
 * roles, permissions, comments, etc.
 *
 * Default: dry-run (report only). Pass --apply to copy documents into publicdb.
 * Idempotent: upserts by _id (safe to re-run). Does NOT delete the old tenants DB
 * and does NOT change app connections (that is Ticket 2).
 *
 * Usage:
 *   npx ts-node --transpile-only src/app/console/migrateTenantsToPublicDb.ts
 *   npx ts-node --transpile-only src/app/console/migrateTenantsToPublicDb.ts --apply
 */
import mongoose from 'mongoose';
import config from '../config/app';

const options = {
  useNewURLParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 5000,
};

/** Collections that identity/billing code expects on the tenants connection. */
const TENANTS_IDENTITY_COLLECTIONS = [
  'tenants',
  'users',
  'stripeProducts',
  'stripePrices',
  'stripeSubscriptions',
  'stripeSessions',
  'domains',
] as const;

const apply = process.argv.includes('--apply');

const resolveCollectionName = async (
  db: NonNullable<mongoose.Connection['db']>,
  logicalName: string,
): Promise<string | null> => {
  const existing = await db.listCollections().toArray();
  const names = existing.map((c) => c.name);
  if (names.includes(logicalName)) return logicalName;
  const lower = logicalName.toLowerCase();
  const match = names.find((n) => n.toLowerCase() === lower);
  return match ?? null;
};

const copyCollection = async (
  sourceDb: NonNullable<mongoose.Connection['db']>,
  targetDb: NonNullable<mongoose.Connection['db']>,
  collectionName: string,
  shouldApply: boolean,
): Promise<{ source: number; targetBefore: number; copied: number; skipped: number }> => {
  const sourceName = await resolveCollectionName(sourceDb, collectionName);
  if (!sourceName) {
    return { source: 0, targetBefore: 0, copied: 0, skipped: 0 };
  }

  const sourceCol = sourceDb.collection(sourceName);
  const targetName = (await resolveCollectionName(targetDb, collectionName)) ?? sourceName;
  const targetCol = targetDb.collection(targetName);

  const sourceCount = await sourceCol.countDocuments();
  const targetBefore = await targetCol.countDocuments();

  if (!shouldApply || sourceCount === 0) {
    return { source: sourceCount, targetBefore, copied: 0, skipped: sourceCount };
  }

  const docs = await sourceCol.find({}).toArray();
  let upserted = 0;
  let modified = 0;
  const batchSize = 100;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    const ops = batch.map((doc) => ({
      replaceOne: {
        filter: { _id: doc._id },
        replacement: doc,
        upsert: true,
      },
    }));
    const result = await targetCol.bulkWrite(ops, { ordered: false });
    upserted += result.upsertedCount ?? 0;
    modified += result.modifiedCount ?? 0;
  }

  return { source: sourceCount, targetBefore, copied: upserted + modified, skipped: 0 };
};

const main = async () => {
  let tenantsConn: mongoose.Connection | undefined;
  let publicConn: mongoose.Connection | undefined;

  try {
    console.log('========================================');
    console.log('Migrate tenants DB → publicdb');
    console.log(`Mode: ${apply ? 'APPLY (writes to publicdb)' : 'DRY-RUN (no writes)'}`);
    console.log('========================================\n');

    if (!config.tenantsDBConnection) {
      throw new Error('TENANTS_CONNECTION is not set');
    }
    if (!config.publicConnection) {
      throw new Error('PUBLIC_CONNECTION is not set');
    }

    console.log(`Source (tenants): ${config.tenantsDBConnection}`);
    console.log(`Target (public):  ${config.publicConnection}\n`);

    if (apply) {
      console.log('Reminder: back up both DBs before applying (npm run backup-databases).\n');
    }

    tenantsConn = await mongoose.createConnection(config.tenantsDBConnection, options).asPromise();
    publicConn = await mongoose.createConnection(config.publicConnection, options).asPromise();

    const sourceDb = tenantsConn.db;
    const targetDb = publicConn.db;
    if (!sourceDb || !targetDb) {
      throw new Error('Could not access MongoDB database handles');
    }

    const sourceCollections = (await sourceDb.listCollections().toArray()).map((c) => c.name).sort();
    const targetCollections = (await targetDb.listCollections().toArray()).map((c) => c.name).sort();

    console.log('--- Inventory ---');
    console.log(`Tenants DB collections (${sourceCollections.length}): ${sourceCollections.join(', ') || '(none)'}`);
    console.log(`Public DB collections (${targetCollections.length}): ${targetCollections.join(', ') || '(none)'}`);
    console.log('');

    console.log('--- Identity / billing collections to copy ---');
    let totalSource = 0;
    let totalCopied = 0;

    for (const name of TENANTS_IDENTITY_COLLECTIONS) {
      const result = await copyCollection(sourceDb, targetDb, name, apply);
      totalSource += result.source;
      totalCopied += result.copied;

      const resolved = await resolveCollectionName(sourceDb, name);
      if (!resolved && result.source === 0) {
        console.log(`  ${name}: not found in tenants DB (skip)`);
        continue;
      }

      if (apply) {
        console.log(
          `  ${name}: source=${result.source}, targetBefore=${result.targetBefore}, upserted/updated≈${result.copied}`,
        );
      } else {
        console.log(
          `  ${name}: would copy ${result.source} doc(s) (target currently has ${result.targetBefore})`,
        );
      }
    }

    console.log('\n========================================');
    if (apply) {
      console.log(`Done. Processed ~${totalCopied} document write(s) from ${totalSource} source doc(s).`);
      console.log('Old tenants DB was NOT deleted. App still uses TENANTS_CONNECTION until Ticket 2.');
    } else {
      console.log(`Dry-run complete. ${totalSource} document(s) would be copied.`);
      console.log('Re-run with --apply to write into publicdb.');
    }
    console.log('========================================\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n✗ Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await tenantsConn?.close();
    await publicConn?.close();
  }
};

void main();
