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

  // Load every sprint that uses these boards in one query, oldest first,
  // so the first project to use a board keeps it
  const sprints = await sprintModel
    .find({ board: { $in: boards.map((board: any) => board._id) }, project: { $ne: null } }, {
      board: 1,
      project: 1,
    })
    .sort({ createdAt: 1 })
    .lean();

  // Work out every change first, then save them all together at the end
  const linkOps: any[] = [];
  const boardsToCreate: any[] = [];
  const sprintOps: any[] = [];

  boards.forEach((board: any) => {
    const boardSprints = sprints.filter(
      (sprint: any) => sprint.board.toString() === board._id.toString(),
    );
    const projectIds = [...new Set(boardSprints.map((sprint: any) => sprint.project.toString()))];

    if (projectIds.length === 0) {
      result.unused += 1;
      console.log(`    - board ${board._id}: not used by any sprint, skipped`);
      return;
    }

    const [ownerProjectId, ...otherProjectIds] = projectIds;
    console.log(`    - board ${board._id}: linked to project ${ownerProjectId}`);
    linkOps.push({
      updateOne: { filter: { _id: board._id }, update: { $set: { project: ownerProjectId } } },
    });
    projectsWithBoard.add(ownerProjectId);
    result.linked += 1;

    otherProjectIds.forEach((projectId) => {
      const sprintCount = boardSprints.filter(
        (sprint: any) => sprint.project.toString() === projectId,
      ).length;
      console.log(
        `    - board ${board._id}: copied for project ${projectId} (${sprintCount} sprints moved)`,
      );
      // Create the copy's id now so its sprints can be moved in the same batch
      const copyId = new mongoose.Types.ObjectId();
      boardsToCreate.push({
        _id: copyId,
        title: board.title,
        tenant: board.tenant,
        project: projectId,
        statuses: board.statuses,
        isPublic: board.isPublic,
      });
      sprintOps.push({
        updateMany: {
          filter: { board: board._id, project: projectId },
          update: { $set: { board: copyId } },
        },
      });
      projectsWithBoard.add(projectId);
      result.copied += 1;
      result.sprintsMoved += sprintCount;
    });
  });

  const defaultSlugs = DEFAULT_STATUS.map((status) => status.slug);
  const projects = await projectModel.find({ isDelete: { $ne: true } }, { tenant: 1 }).lean();
  const projectsWithoutBoard = (projects as any[]).filter(
    (project) => !projectsWithBoard.has(project._id.toString()),
  );

  // Load the default statuses for every tenant that needs a new board in one query
  const defaultStatuses = await statusModel
    .find(
      {
        tenant: { $in: projectsWithoutBoard.map((project) => project.tenant) },
        slug: { $in: defaultSlugs },
      },
      { slug: 1, tenant: 1 },
    )
    .lean();

  projectsWithoutBoard.forEach((project) => {
    console.log(`    - project ${project._id}: no board, created a Default board`);
    // Keep the default column order
    const statuses = defaultStatuses
      .filter((status: any) => status.tenant?.toString() === project.tenant?.toString())
      .sort((a: any, b: any) => defaultSlugs.indexOf(a.slug) - defaultSlugs.indexOf(b.slug));
    boardsToCreate.push({
      title: 'Default',
      tenant: project.tenant,
      project: project._id,
      statuses: statuses.map((status: any) => status._id),
    });
    result.created += 1;
  });

  if (!isDryRun) {
    if (linkOps.length > 0) {
      await boardModel.bulkWrite(linkOps);
    }
    // Create the copies before moving sprints onto them
    if (boardsToCreate.length > 0) {
      await boardModel.insertMany(boardsToCreate);
    }
    if (sprintOps.length > 0) {
      await sprintModel.bulkWrite(sprintOps);
    }
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
