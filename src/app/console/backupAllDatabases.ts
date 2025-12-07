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

const exportCollection = async (model: any, collectionName: string): Promise<any[]> => {
  try {
    const documents = await model.find({}).lean();
    return documents.map((doc: any) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { _id, ...rest } = doc;
      return {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _id: _id.toString(),
        ...rest,
      };
    });
  } catch (error: any) {
    console.error(`  Error exporting ${collectionName}:`, error.message);
    return [];
  }
};

const backupTenantDatabase = async (
  dbConnection: mongoose.Connection,
  _tenantId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _tenantOrigin: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _tenantPlan: string, // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<{ data: any; collections: string[] }> => {
  const collections: string[] = [];

  try {
    // Export all collections
    const projectModel = Project.getModel(dbConnection);
    const ticketModel = Ticket.getModel(dbConnection);
    const labelModel = Label.getModel(dbConnection);
    const typeModel = Type.getModel(dbConnection);
    const statusModel = Status.getModel(dbConnection);
    const sprintModel = Sprint.getModel(dbConnection);
    const epicModel = Epic.getModel(dbConnection);
    const roleModel = Role.getModel(dbConnection as any);
    const permissionModel = Permission.getModel(dbConnection as any);
    const boardModel = Board.getModel(dbConnection as any);
    const commentModel = Comment.getModel(dbConnection);
    const questionModel = Question.getModel(dbConnection);
    const replyModel = Reply.getModel(dbConnection);
    const retroBoardModel = RetroBoard.getModel(dbConnection as any);
    const retroItemModel = RetroItem.getModel(dbConnection);
    const dailyScrumModel = DailyScrum.getModel(dbConnection);

    console.log('  Exporting collections...');

    const [
      projects,
      tickets,
      labels,
      types,
      statuses,
      sprints,
      epics,
      roles,
      permissions,
      boards,
      comments,
      questions,
      replies,
      retroBoards,
      retroItems,
      dailyScrums,
    ] = await Promise.all([
      exportCollection(projectModel, 'projects'),
      exportCollection(ticketModel, 'tickets'),
      exportCollection(labelModel, 'labels'),
      exportCollection(typeModel, 'types'),
      exportCollection(statusModel, 'statuses'),
      exportCollection(sprintModel, 'sprints'),
      exportCollection(epicModel, 'epics'),
      exportCollection(roleModel, 'roles'),
      exportCollection(permissionModel, 'permissions'),
      exportCollection(boardModel, 'boards'),
      exportCollection(commentModel, 'comments'),
      exportCollection(questionModel, 'questions'),
      exportCollection(replyModel, 'replies'),
      exportCollection(retroBoardModel, 'retroBoards'),
      exportCollection(retroItemModel, 'retroItems'),
      exportCollection(dailyScrumModel, 'dailyScrums'),
    ]);

    const data: any = {
      projects,
      tickets,
      labels,
      types,
      statuses,
      sprints,
      epics,
      roles,
      permissions,
      boards,
      comments,
      questions,
      replies,
      retroBoards,
      retroItems,
      dailyScrums,
    };

    // Only include collections that have data
    Object.keys(data).forEach((key) => {
      if (data[key].length > 0) {
        collections.push(key);
      }
    });

    return { data, collections };
  } catch (error: any) {
    console.error('  Error backing up tenant database:', error.message);
    return { data: {}, collections: [] };
  }
};

const backupUsersDatabase = async (tenantConnection: mongoose.Connection): Promise<any[]> => {
  try {
    const userModel = User.getModel(tenantConnection);
    const users = await userModel.find({}).lean();
    return users.map((user: any) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { _id, password, refreshToken, activeCode, ...rest } = user;
      return {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _id: _id.toString(),
        // Don't export sensitive data
        ...rest,
      };
    });
  } catch (error: any) {
    console.error('  Error exporting users:', error.message);
    return [];
  }
};

const main = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups', `backup-${timestamp}`);
    const tenantsBackupDir = path.join(backupDir, 'tenants');
    const databasesBackupDir = path.join(backupDir, 'databases');

    // Create backup directories
    fs.mkdirSync(backupDir, { recursive: true });
    fs.mkdirSync(tenantsBackupDir, { recursive: true });
    fs.mkdirSync(databasesBackupDir, { recursive: true });

    console.log(`Creating backup in: ${backupDir}\n`);

    const manifest: BackupManifest = {
      backupDate: new Date().toISOString(),
      tenants: [],
      globalDatabase: {
        database: PUBLIC_DB,
        collections: [],
      },
    };

    // 1. Backup tenants database
    console.log('1. Backing up tenants database...');
    const tenantsDbConnection = await mongoose.createConnection(config.tenantsDBConnection, options);
    const tenantModel = Tenant.getModel(tenantsDbConnection);
    const tenants = await tenantModel.find({}).lean();

    const tenantsData = tenants.map((tenant: any) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { _id, passwordSecret, ...rest } = tenant;
      return {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _id: _id.toString(),
        // Don't export sensitive data
        ...rest,
      };
    });

    fs.writeFileSync(
      path.join(tenantsBackupDir, 'tenants.json'),
      JSON.stringify(tenantsData, null, 2),
    );
    console.log(`  ✓ Exported ${tenantsData.length} tenant(s)\n`);

    // 2. Backup users from tenants database
    console.log('2. Backing up users...');
    const users = await backupUsersDatabase(tenantsDbConnection);
    fs.writeFileSync(path.join(tenantsBackupDir, 'users.json'), JSON.stringify(users, null, 2));
    console.log(`  ✓ Exported ${users.length} user(s)\n`);

    await tenantsDbConnection.close();

    // 3. Backup global database (publicdb)
    console.log('3. Backing up global database (publicdb)...');
    const globalDbConnectionString = config.publicConnection.replace(PUBLIC_DB, PUBLIC_DB);
    const globalDbConnection = await mongoose.createConnection(globalDbConnectionString, options);

    const globalBackup = await backupTenantDatabase(
      globalDbConnection,
      'global',
      'global',
      'Global',
    );

    if (globalBackup.collections.length > 0) {
      fs.writeFileSync(
        path.join(databasesBackupDir, `${PUBLIC_DB}.json`),
        JSON.stringify(globalBackup.data, null, 2),
      );
      manifest.globalDatabase.collections = globalBackup.collections;
      console.log(
        `  ✓ Exported global database with collections: ${globalBackup.collections.join(', ')}\n`,
      );
    } else {
      console.log('  ⊘ Global database is empty\n');
    }

    await globalDbConnection.close();

    // 4. Backup each tenant's database
    console.log(`4. Backing up ${tenants.length} tenant database(s)...\n`);

    for (const tenant of tenants) {
      const tenantId = tenant._id?.toString() || tenant.id?.toString() || '';
      if (!tenantId) {
        console.log(`  ⊘ Skipping tenant ${tenant.origin}: No ID found`);
        continue;
      }

      const tenantDbName = tenant.plan === 'Free' ? PUBLIC_DB : tenantId;
      const tenantOrigin = tenant.origin || 'unknown';
      const tenantPlan = tenant.plan || 'Unknown';

      // Skip if already backed up (Free plan uses publicdb)
      if (tenantDbName === PUBLIC_DB) {
        console.log(`  ⊘ Skipping ${tenantOrigin} (uses global database)\n`);
        continue;
      }

      try {
        console.log(`  Processing tenant: ${tenantOrigin} (${tenantPlan})...`);
        const dbConnectionString = config.publicConnection.replace(PUBLIC_DB, tenantDbName);
        const tenantDbConnection = await mongoose.createConnection(dbConnectionString, options);

        const tenantBackup = await backupTenantDatabase(
          tenantDbConnection,
          tenantId,
          tenantOrigin,
          tenantPlan,
        );

        if (tenantBackup.collections.length > 0) {
          fs.writeFileSync(
            path.join(databasesBackupDir, `${tenantDbName}.json`),
            JSON.stringify(tenantBackup.data, null, 2),
          );

          manifest.tenants.push({
            id: tenantId,
            origin: tenantOrigin,
            plan: tenantPlan,
            database: tenantDbName,
            collections: tenantBackup.collections,
          });

          console.log(
            `    ✓ Exported ${tenantBackup.collections.length} collection(s): ${tenantBackup.collections.join(', ')}\n`,
          );
        } else {
          console.log('    ⊘ Database is empty\n');
        }

        await tenantDbConnection.close();
      } catch (error: any) {
        console.error(`    ✗ Error: ${error.message}\n`);
      }
    }

    // 5. Save manifest
    fs.writeFileSync(
      path.join(backupDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
    );

    console.log('\n========================================');
    console.log('Backup Summary:');
    console.log(`  Backup location: ${backupDir}`);
    console.log(`  Tenants: ${tenants.length}`);
    console.log(`  Users: ${users.length}`);
    console.log(`  Tenant databases backed up: ${manifest.tenants.length}`);
    console.log(`  Global database collections: ${manifest.globalDatabase.collections.length}`);
    console.log('========================================\n');

    console.log('✓ Backup completed successfully!\n');
    console.log(`To restore this backup, use the restore script with: ${backupDir}\n`);

    process.exit(0);
  } catch (error: any) {
    console.error('\n✗ Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run the script
main();

