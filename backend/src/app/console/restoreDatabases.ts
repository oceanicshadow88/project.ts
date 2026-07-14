/* eslint-disable no-console */
export { };

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import config from '../config/app';
import * as Tenant from '../model/tenants';
import * as Project from '../model/project';
import * as Ticket from '../model/ticket';
import * as User from '../model/user';
import * as Label from '../model/label';
import * as Type from '../model/type';
import * as Status from '../model/status';
import * as Sprint from '../model/sprint';
import * as Epic from '../model/epic';
import * as Role from '../model/role';
import * as Permission from '../model/permission';
import * as Board from '../model/board';
import * as Comment from '../model/comment';
import * as Question from '../model/question';
import * as Reply from '../model/reply';
import * as RetroBoard from '../model/retroBoard';
import * as RetroItem from '../model/retroItem';
import * as DailyScrum from '../model/dailyScrum';
import bcrypt from 'bcrypt';

const options = {
  useNewURLParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  socketTimeoutMS: 30000,
};

const PUBLIC_DB = 'publicdb';

interface BackupManifest {
  backupDate: string;
  tenants: Array<{
    id: string;
    origin: string;
    plan: string;
    database: string;
    collections: string[];
  }>;
  globalDatabase: {
    database: string;
    collections: string[];
  };
}

const importCollection = async (
  model: any,
  collectionName: string,
  documents: any[],
  idMapping?: { [oldId: string]: string },
): Promise<number> => {
  if (!documents || documents.length === 0) {
    return 0;
  }

  try {
    let imported = 0;
    for (const doc of documents) {
      try {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { _id, id, ...rest } = doc;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const docId = _id || id;

        // Map old ID to new ID if mapping provided
        const finalData = idMapping && docId && idMapping[docId]
          ? { ...rest, _id: new mongoose.Types.ObjectId(idMapping[docId]) }
          : { ...rest };

        // Try to find existing document
        const existing = docId ? await model.findById(docId) : null;

        if (existing) {
          // Update existing
          await model.findByIdAndUpdate(docId, finalData, { upsert: true });
        } else {
          // Create new with original ID if provided
          if (docId) {
            finalData._id = new mongoose.Types.ObjectId(docId);
          }
          await model.create(finalData);
        }
        imported++;
      } catch (error: any) {
        // Skip duplicate key errors
        if (error.code !== 11000) {
          console.error(`    Error importing document in ${collectionName}:`, error.message);
        }
      }
    }
    return imported;
  } catch (error: any) {
    console.error(`  Error importing ${collectionName}:`, error.message);
    return 0;
  }
};

const restoreTenantDatabase = async (
  dbConnection: mongoose.Connection,
  data: any,
  collections: string[],
): Promise<{ [key: string]: number }> => {
  const results: { [key: string]: number } = {};

  try {
    // Import in order: permissions -> roles -> other collections
    if (collections.includes('permissions')) {
      const permissionModel = Permission.getModel(dbConnection as any);
      const count = await importCollection(permissionModel, 'permissions', data.permissions || []);
      results.permissions = count;
      if (count > 0) console.log(`    ✓ Imported ${count} permission(s)`);
    }

    if (collections.includes('roles')) {
      const roleModel = Role.getModel(dbConnection as any);
      const count = await importCollection(roleModel, 'roles', data.roles || []);
      results.roles = count;
      if (count > 0) console.log(`    ✓ Imported ${count} role(s)`);
    }

    if (collections.includes('types')) {
      const typeModel = Type.getModel(dbConnection);
      const count = await importCollection(typeModel, 'types', data.types || []);
      results.types = count;
      if (count > 0) console.log(`    ✓ Imported ${count} type(s)`);
    }

    if (collections.includes('statuses')) {
      const statusModel = Status.getModel(dbConnection);
      const count = await importCollection(statusModel, 'statuses', data.statuses || []);
      results.statuses = count;
      if (count > 0) console.log(`    ✓ Imported ${count} status(es)`);
    }

    if (collections.includes('labels')) {
      const labelModel = Label.getModel(dbConnection);
      const count = await importCollection(labelModel, 'labels', data.labels || []);
      results.labels = count;
      if (count > 0) console.log(`    ✓ Imported ${count} label(s)`);
    }

    if (collections.includes('boards')) {
      const boardModel = Board.getModel(dbConnection as any);
      const count = await importCollection(boardModel, 'boards', data.boards || []);
      results.boards = count;
      if (count > 0) console.log(`    ✓ Imported ${count} board(s)`);
    }

    if (collections.includes('projects')) {
      const projectModel = Project.getModel(dbConnection);
      const count = await importCollection(projectModel, 'projects', data.projects || []);
      results.projects = count;
      if (count > 0) console.log(`    ✓ Imported ${count} project(s)`);
    }

    if (collections.includes('sprints')) {
      const sprintModel = Sprint.getModel(dbConnection);
      const count = await importCollection(sprintModel, 'sprints', data.sprints || []);
      results.sprints = count;
      if (count > 0) console.log(`    ✓ Imported ${count} sprint(s)`);
    }

    if (collections.includes('epics')) {
      const epicModel = Epic.getModel(dbConnection);
      const count = await importCollection(epicModel, 'epics', data.epics || []);
      results.epics = count;
      if (count > 0) console.log(`    ✓ Imported ${count} epic(s)`);
    }

    if (collections.includes('tickets')) {
      const ticketModel = Ticket.getModel(dbConnection);
      const count = await importCollection(ticketModel, 'tickets', data.tickets || []);
      results.tickets = count;
      if (count > 0) console.log(`    ✓ Imported ${count} ticket(s)`);
    }

    if (collections.includes('comments')) {
      const commentModel = Comment.getModel(dbConnection);
      const count = await importCollection(commentModel, 'comments', data.comments || []);
      results.comments = count;
      if (count > 0) console.log(`    ✓ Imported ${count} comment(s)`);
    }

    if (collections.includes('questions')) {
      const questionModel = Question.getModel(dbConnection);
      const count = await importCollection(questionModel, 'questions', data.questions || []);
      results.questions = count;
      if (count > 0) console.log(`    ✓ Imported ${count} question(s)`);
    }

    if (collections.includes('replies')) {
      const replyModel = Reply.getModel(dbConnection);
      const count = await importCollection(replyModel, 'replies', data.replies || []);
      results.replies = count;
      if (count > 0) console.log(`    ✓ Imported ${count} reply(ies)`);
    }

    if (collections.includes('retroBoards')) {
      const retroBoardModel = RetroBoard.getModel(dbConnection as any);
      const count = await importCollection(retroBoardModel, 'retroBoards', data.retroBoards || []);
      results.retroBoards = count;
      if (count > 0) console.log(`    ✓ Imported ${count} retro board(s)`);
    }

    if (collections.includes('retroItems')) {
      const retroItemModel = RetroItem.getModel(dbConnection);
      const count = await importCollection(retroItemModel, 'retroItems', data.retroItems || []);
      results.retroItems = count;
      if (count > 0) console.log(`    ✓ Imported ${count} retro item(s)`);
    }

    if (collections.includes('dailyScrums')) {
      const dailyScrumModel = DailyScrum.getModel(dbConnection);
      const count = await importCollection(dailyScrumModel, 'dailyScrums', data.dailyScrums || []);
      results.dailyScrums = count;
      if (count > 0) console.log(`    ✓ Imported ${count} daily scrum(s)`);
    }
  } catch (error: any) {
    console.error('  Error restoring database:', error.message);
  }

  return results;
};

const main = async () => {
  try {
    // Get backup directory from command line argument or use latest
    const backupDirArg = process.argv[2];
    let backupDir: string;

    if (backupDirArg) {
      backupDir = path.isAbsolute(backupDirArg)
        ? backupDirArg
        : path.join(process.cwd(), backupDirArg);
    } else {
      // Find latest backup
      const backupsBaseDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupsBaseDir)) {
        console.error('No backups directory found. Please specify backup directory.');
        process.exit(1);
      }
      const backups = fs.readdirSync(backupsBaseDir)
        .filter(dir => dir.startsWith('backup-'))
        .sort()
        .reverse();

      if (backups.length === 0) {
        console.error('No backups found. Please specify backup directory.');
        process.exit(1);
      }
      backupDir = path.join(backupsBaseDir, backups[0]);
      console.log(`Using latest backup: ${backups[0]}\n`);
    }

    if (!fs.existsSync(backupDir)) {
      console.error(`Backup directory not found: ${backupDir}`);
      process.exit(1);
    }

    // Read manifest
    const manifestPath = path.join(backupDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.error('Manifest file not found in backup directory');
      process.exit(1);
    }

    const manifest: BackupManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    console.log(`Restoring backup from: ${backupDir}`);
    console.log(`Backup date: ${manifest.backupDate}\n`);

    // Get MongoDB connection strings from environment or use defaults
    // Default to localhost:27017 if not specified
    const mongoHost = process.env.RESTORE_MONGO_HOST || 'localhost:27017';
    // Note: mongoDbName is not currently used but kept for potential future use
    // const mongoDbName = process.env.RESTORE_MONGO_DB || 'techscrum';

    // Extract database names from original connections or use defaults
    const tenantsDbName = config.tenantsDBConnection.split('/').pop() || 'tenants';
    const publicDbName = config.publicConnection.split('/').pop() || PUBLIC_DB;

    const targetTenantsConnection = process.env.RESTORE_TENANTS_CONNECTION ||
      `mongodb://${mongoHost}/${tenantsDbName}`;

    const targetPublicConnection = process.env.RESTORE_PUBLIC_CONNECTION ||
      `mongodb://${mongoHost}/${publicDbName}`;

    console.log(`Target tenants database: ${targetTenantsConnection}`);
    console.log(`Target public database: ${targetPublicConnection}\n`);

    // 1. Restore tenants
    console.log('1. Restoring tenants...');
    const tenantsDbConnection = await mongoose.createConnection(targetTenantsConnection, options);
    const tenantModel = Tenant.getModel(tenantsDbConnection);

    const tenantsPath = path.join(backupDir, 'tenants', 'tenants.json');
    if (fs.existsSync(tenantsPath)) {
      const tenants = JSON.parse(fs.readFileSync(tenantsPath, 'utf-8'));
      let tenantCount = 0;
      for (const tenant of tenants) {
        try {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          const { _id, ...rest } = tenant;
          // eslint-disable-next-line @typescript-eslint/naming-convention
          await tenantModel.findByIdAndUpdate(_id, rest, { upsert: true });
          tenantCount++;
        } catch (error: any) {
          console.error(`  Error restoring tenant ${tenant.origin}:`, error.message);
        }
      }
      console.log(`  ✓ Restored ${tenantCount} tenant(s)\n`);
    }

    // 2. Restore users
    console.log('2. Restoring users...');
    const usersPath = path.join(backupDir, 'tenants', 'users.json');
    if (fs.existsSync(usersPath)) {
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
      const userModel = User.getModel(tenantsDbConnection);
      let userCount = 0;
      let skippedCount = 0;
      for (const user of users) {
        try {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          const { _id, password, ...rest } = user;

          // Check if user already exists
          // eslint-disable-next-line @typescript-eslint/naming-convention
          const existingUser = await userModel.findById(_id);

          if (existingUser) {
            // Update existing user but preserve existing password
            const updateData: any = { ...rest };
            // Never update password field - keep existing one to avoid breaking login
            delete updateData.password;
            // eslint-disable-next-line @typescript-eslint/naming-convention
            await userModel.findByIdAndUpdate(_id, updateData);
          } else {
            // Create new user - set temporary password if no password in backup
            const newUserData: any = { ...rest };
            if (!password) {
              // Generate a valid bcrypt hash that will never match any real password
              // This prevents bcrypt.compare from throwing errors
              const tempPassword = `TEMP_RESTORED_${Date.now()}_${Math.random()}`;
              newUserData.password = await bcrypt.hash(tempPassword, 10);
            } else {
              newUserData.password = password;
            }
            // eslint-disable-next-line @typescript-eslint/naming-convention
            newUserData._id = new mongoose.Types.ObjectId(_id);
            await userModel.create(newUserData);
          }
          userCount++;
        } catch (error: any) {
          if (error.code === 11000) {
            skippedCount++;
          } else {
            console.error(`  Error restoring user ${user.email}:`, error.message);
          }
        }
      }
      console.log(`  ✓ Restored ${userCount} user(s)`);
      if (skippedCount > 0) {
        console.log(`  ⊘ Skipped ${skippedCount} user(s) (duplicates)\n`);
      } else {
        console.log('');
      }

      if (userCount > 0) {
        console.log('  ⚠️  Note: Users without passwords have been set with a temporary password.');
        console.log('     They will need to use "Forgot Password" to set a new password.\n');
      }
    }

    await tenantsDbConnection.close();

    // 3. Restore global database
    console.log('3. Restoring global database...');
    const globalDbConnection = await mongoose.createConnection(targetPublicConnection, options);
    const globalDbPath = path.join(backupDir, 'databases', `${PUBLIC_DB}.json`);

    if (fs.existsSync(globalDbPath)) {
      const globalData = JSON.parse(fs.readFileSync(globalDbPath, 'utf-8'));
      const results = await restoreTenantDatabase(
        globalDbConnection,
        globalData,
        manifest.globalDatabase.collections,
      );
      const total = Object.values(results).reduce((sum, count) => sum + count, 0);
      console.log(`  ✓ Restored ${total} document(s) from global database\n`);
    } else {
      console.log('  ⊘ Global database backup not found\n');
    }

    await globalDbConnection.close();

    // 4. Restore tenant databases
    console.log(`4. Restoring ${manifest.tenants.length} tenant database(s)...\n`);

    for (const tenantInfo of manifest.tenants) {
      try {
        console.log(`  Processing tenant: ${tenantInfo.origin} (${tenantInfo.plan})...`);
        const tenantDbPath = path.join(backupDir, 'databases', `${tenantInfo.database}.json`);

        if (!fs.existsSync(tenantDbPath)) {
          console.log('    ⊘ Database backup not found\n');
          continue;
        }

        const tenantDbConnectionString = targetPublicConnection.replace(PUBLIC_DB, tenantInfo.database);
        const tenantDbConnection = await mongoose.createConnection(tenantDbConnectionString, options);

        const tenantData = JSON.parse(fs.readFileSync(tenantDbPath, 'utf-8'));
        const results = await restoreTenantDatabase(
          tenantDbConnection,
          tenantData,
          tenantInfo.collections,
        );

        const total = Object.values(results).reduce((sum, count) => sum + count, 0);
        console.log(`    ✓ Restored ${total} document(s)\n`);

        await tenantDbConnection.close();
      } catch (error: any) {
        console.error(`    ✗ Error: ${error.message}\n`);
      }
    }

    console.log('\n========================================');
    console.log('Restore completed successfully!');
    console.log('========================================\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n✗ Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run the script
main();

