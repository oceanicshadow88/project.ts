/* eslint-disable no-console */
import mongoose from 'mongoose';
import config from '../config/app';
import * as Board from '../model/board';
import * as Sprint from '../model/sprint';
import * as Project from '../model/project';
import * as Status from '../model/status';
import { DEFAULT_STATUS } from '../database/seeders/statusSeeder';

// One-time script: links every board to the project that uses it, so status
// columns are no longer shared between projects.
// - A board used by one project's sprints gets that project.
// - A board shared by several projects stays with the project that used it first;
//   every other project gets its own copy (same columns, same order) and its
//   sprints are moved to the copy.
// - Boards no sprint uses are left unchanged (we can't tell which project they belong to).
// - Any project still without a board gets a new "Default" board with the default statuses,
//   so it can still create sprints.
// Boards that already have a project are skipped, so the script is safe to run again.
// Run with --dry-run to see what would change without writing anything.

const options = {
  useNewURLParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  socketTimeoutMS: 30000,
};

const PUBLIC_DB = 'publicdb';
const isDryRun = process.argv.includes('--dry-run');

const migrateBoardProjects = async (dbConnection: mongoose.Connection) => {
  const boardModel = Board.getModel(dbConnection as any);
  const sprintModel = Sprint.getModel(dbConnection);
  const projectModel = Project.getModel(dbConnection);
  const statusModel = Status.getModel(dbConnection);
  const result = { linked: 0, copied: 0, sprintsMoved: 0, unused: 0, created: 0 };

  // Projects that already have (or will get) a board
  const linkedBoards = await boardModel.find({ project: { $ne: null } }, { project: 1 }).lean();
  const projectsWithBoard = new Set(linkedBoards.map((board: any) => board.project.toString()));

  const boards = await boardModel.find({ project: null }).lean();

  for (const board of boards) {
    // Oldest sprint first, so the first project to use the board keeps it
    const sprints = await sprintModel
      .find({ board: board._id, project: { $ne: null } }, { project: 1 })
      .sort({ createdAt: 1 })
      .lean();

    const projectIds = [...new Set(sprints.map((sprint: any) => sprint.project.toString()))];

    if (projectIds.length === 0) {
      result.unused += 1;
      console.log(`    - board ${board._id}: not used by any sprint, skipped`);
      continue;
    }

    const [ownerProjectId, ...otherProjectIds] = projectIds;
    console.log(`    - board ${board._id}: linked to project ${ownerProjectId}`);
    if (!isDryRun) {
      await boardModel.updateOne({ _id: board._id }, { $set: { project: ownerProjectId } });
    }
    projectsWithBoard.add(ownerProjectId);
    result.linked += 1;

    for (const projectId of otherProjectIds) {
      const sprintCount = sprints.filter((sprint: any) => sprint.project.toString() === projectId)
        .length;
      console.log(
        `    - board ${board._id}: copied for project ${projectId} (${sprintCount} sprints moved)`,
      );
      if (!isDryRun) {
        const copy = await boardModel.create({
          title: board.title,
          tenant: board.tenant,
          project: projectId,
          statuses: board.statuses,
          isPublic: board.isPublic,
        });
        await sprintModel.updateMany(
          { board: board._id, project: projectId },
          { $set: { board: copy._id } },
        );
      }
      projectsWithBoard.add(projectId);
      result.copied += 1;
      result.sprintsMoved += sprintCount;
    }
  }

  const defaultSlugs = DEFAULT_STATUS.map((status) => status.slug);
  const projects = await projectModel.find({ isDelete: { $ne: true } }, { tenant: 1 }).lean();

  for (const project of projects as any[]) {
    if (projectsWithBoard.has(project._id.toString())) {
      continue;
    }
    console.log(`    - project ${project._id}: no board, created a Default board`);
    if (!isDryRun) {
      const statuses = await statusModel
        .find({ tenant: project.tenant, slug: { $in: defaultSlugs } }, { slug: 1 })
        .lean();
      // Keep the default column order
      statuses.sort(
        (a: any, b: any) => defaultSlugs.indexOf(a.slug) - defaultSlugs.indexOf(b.slug),
      );
      await boardModel.create({
        title: 'Default',
        tenant: project.tenant,
        project: project._id,
        statuses: statuses.map((status: any) => status._id),
      });
    }
    result.created += 1;
  }

  return result;
};

const migrateDatabase = async (connectionString: string) => {
  let dbConnection: mongoose.Connection | undefined;
  try {
    dbConnection = await mongoose.createConnection(connectionString, options).asPromise();
    const result = await migrateBoardProjects(dbConnection);
    console.log(
      `  ✓ ${dbConnection.name}: ${result.linked} boards linked, ${result.copied} boards copied, ` +
        `${result.sprintsMoved} sprints moved, ${result.unused} unused boards skipped, ` +
        `${result.created} boards created`,
    );
  } catch (error: any) {
    console.error(`  ✗ ${dbConnection?.name ?? 'database'}: ${error.message}`);
    throw error;
  } finally {
    await dbConnection?.close();
  }
};

const main = async () => {
  try {
    console.log(`Migrating board projects${isDryRun ? ' (dry run, nothing will be saved)' : ''}...\n`);

    await migrateDatabase(config.publicConnection);

    console.log(`\nDone! Migrated boards in ${PUBLIC_DB}.\n`);
    process.exit(0);
  } catch (error: any) {
    console.error('\n✗ Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

void main();
