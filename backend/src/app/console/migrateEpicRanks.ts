/* eslint-disable no-console */
import mongoose from 'mongoose';
import config from '../config/app';
import * as Tenant from '../model/tenants';
import * as Ticket from '../model/ticket';
import { generateNKeysBetween } from '../utils/generateRank';

// One-time script: gives every ticket that belongs to an epic an epicRank,
// keeping each epic in its current Backlog (rank) order. Tickets that already
// have an epicRank are left unchanged, so the script is safe to run again.

const options = {
  useNewURLParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  socketTimeoutMS: 30000,
};

const PUBLIC_DB = 'publicdb';

const migrateEpicRanks = async (dbConnection: mongoose.Connection) => {
  const ticketModel = Ticket.getModel(dbConnection);

  const tickets = await ticketModel
    .find({ epic: { $ne: null } }, { epic: 1, rank: 1, epicRank: 1 })
    .sort({ rank: 1 })
    .lean();

  const ticketsByEpic: { [epicId: string]: any[] } = {};
  tickets.forEach((ticket: any) => {
    const key = ticket.epic.toString();
    if (!ticketsByEpic[key]) ticketsByEpic[key] = [];
    ticketsByEpic[key].push(ticket);
  });

  const updates: { updateOne: { filter: { _id: any }; update: { epicRank: string } } }[] = [];
  Object.values(ticketsByEpic).forEach((epicTickets) => {
    const ranked: string[] = epicTickets.filter((t) => t.epicRank).map((t) => t.epicRank);
    const unranked = epicTickets.filter((t) => !t.epicRank);
    if (unranked.length === 0) return;

    const lastRank = ranked.reduce<string | null>((max, r) => (max === null || r > max ? r : max), null);
    const newRanks = generateNKeysBetween(lastRank, null, unranked.length);
    unranked.forEach((ticket, index) => {
      updates.push({
        updateOne: { filter: { _id: ticket._id }, update: { epicRank: newRanks[index] } },
      });
    });
  });

  if (updates.length > 0) {
    await ticketModel.bulkWrite(updates);
  }

  return updates.length;
};

const migrateDatabase = async (connectionString: string) => {
  let dbConnection: mongoose.Connection | undefined;
  try {
    dbConnection = await mongoose.createConnection(connectionString, options).asPromise();
    const updated = await migrateEpicRanks(dbConnection);
    console.log(`  ✓ ${dbConnection.name}: ${updated} tickets updated`);
    return updated;
  } catch (error: any) {
    console.error(`  ✗ ${dbConnection?.name ?? 'database'}: ${error.message}`);
    return 0;
  } finally {
    await dbConnection?.close();
  }
};

const main = async () => {
  try {
    console.log('Migrating epic ranks...\n');

    const tenantsDbConnection = await mongoose.createConnection(config.tenantsDBConnection, options);
    const tenants = await Tenant.getModel(tenantsDbConnection).find({}).lean();
    await tenantsDbConnection.close();

    const connectionStrings = new Set<string>([config.publicConnection]);
    tenants.forEach((tenant: any) => {
      if (tenant.plan !== 'Free' && tenant._id) {
        connectionStrings.add(config.publicConnection.replace(PUBLIC_DB, tenant._id.toString()));
      }
    });

    const results = await Promise.all([...connectionStrings].map(migrateDatabase));
    const total = results.reduce((sum, updated) => sum + updated, 0);

    console.log(`\nDone! ${total} tickets updated across ${connectionStrings.size} database(s).\n`);
    process.exit(0);
  } catch (error: any) {
    console.error('\n✗ Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

void main();
