import mongoose, { Types } from 'mongoose';
import config from '../config/app';
import * as Board from '../model/board';
import * as Sprint from '../model/sprint';
import * as Project from '../model/project';
import * as Status from '../model/status';
import { DEFAULT_STATUS } from '../database/seeders/statusSeeder';
import { winstonLogger } from '../../bootstrap/logger';

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
  useUnifiedTopology: true,
  maxPoolSize: 10,
  socketTimeoutMS: 30000,
};

const PUBLIC_DB = 'publicdb';
const isDryRun = process.argv.includes('--dry-run');

// Shapes of the documents this script reads and writes
interface IBoardDoc {
  _id: Types.ObjectId;
  title: string;
  tenant?: Types.ObjectId;
  project?: Types.ObjectId;
  statuses: Types.ObjectId[];
  isPublic?: boolean;
}

interface ISprintDoc {
  _id: Types.ObjectId;
  board: Types.ObjectId;
  project: Types.ObjectId;
}

interface IProjectDoc {
  _id: Types.ObjectId;
  tenant?: Types.ObjectId;
}

interface IStatusDoc {
  _id: Types.ObjectId;
  slug: string;
  tenant?: Types.ObjectId;
}

type INewBoard = Omit<IBoardDoc, '_id'> & { _id?: Types.ObjectId };

interface IBoardLink {
  boardId: Types.ObjectId;
  projectId: Types.ObjectId;
}

interface ISprintMove {
  boardId: Types.ObjectId;
  copyId: Types.ObjectId;
  projectId: Types.ObjectId;
}

interface ISharedBoardPlan {
  boardLinks: IBoardLink[];
  boardCopies: INewBoard[];
  sprintMoves: ISprintMove[];
  sprintsMoved: number;
  unused: number;
}

interface IMigrationModels {
  boardModel: ReturnType<typeof Board.getModel>;
  sprintModel: ReturnType<typeof Sprint.getModel>;
}

// Works out which project keeps each board and which projects need their own copy
const planSharedBoardChanges = (
  boards: IBoardDoc[],
  sprints: ISprintDoc[],
  projects: IProjectDoc[],
): ISharedBoardPlan => {
  const projectTenants = new Map(projects.map((project) => [String(project._id), project.tenant]));
  const plan: ISharedBoardPlan = {
    boardLinks: [],
    boardCopies: [],
    sprintMoves: [],
    sprintsMoved: 0,
    unused: 0,
  };

  boards.forEach((board) => {
    const boardSprints = sprints.filter(
      (sprint) => sprint.board.toString() === board._id.toString(),
    );
    const projectIds = [...new Set(boardSprints.map((sprint) => sprint.project.toString()))];

    if (projectIds.length === 0) {
      plan.unused += 1;
      winstonLogger.info(`board ${board._id}: not used by any sprint, skipped`);
      return;
    }

    const [ownerProjectId, ...otherProjectIds] = projectIds;
    winstonLogger.info(`board ${board._id}: linked to project ${ownerProjectId}`);
    plan.boardLinks.push({ boardId: board._id, projectId: new Types.ObjectId(ownerProjectId) });

    otherProjectIds.forEach((projectId) => {
      const sprintCount = boardSprints.filter(
        (sprint) => sprint.project.toString() === projectId,
      ).length;
      winstonLogger.info(
        `board ${board._id}: copied for project ${projectId} (${sprintCount} sprints moved)`,
      );
      // Create the copy's id now so its sprints can be moved in the same batch
      const copyId = new Types.ObjectId();
      plan.boardCopies.push({
        _id: copyId,
        title: board.title,
        // The copy belongs to the project's tenant, which may differ from the original board's
        tenant: projectTenants.get(projectId) ?? board.tenant,
        project: new Types.ObjectId(projectId),
        statuses: board.statuses,
        isPublic: false,
      });
      plan.sprintMoves.push({
        boardId: board._id,
        copyId,
        projectId: new Types.ObjectId(projectId),
      });
      plan.sprintsMoved += sprintCount;
    });
  });

  return plan;
};

// A new "Default" board (default statuses in default order) for each project without a board
const planDefaultBoards = (
  projectsWithoutBoard: IProjectDoc[],
  defaultStatuses: IStatusDoc[],
): INewBoard[] => {
  const defaultSlugs = DEFAULT_STATUS.map((status) => status.slug);
  return projectsWithoutBoard.map((project) => {
    winstonLogger.info(`project ${project._id}: no board, created a Default board`);
    const statuses = defaultStatuses
      .filter((status) => status.tenant?.toString() === project.tenant?.toString())
      .sort((a, b) => defaultSlugs.indexOf(a.slug) - defaultSlugs.indexOf(b.slug));
    return {
      title: 'Default',
      tenant: project.tenant,
      project: project._id,
      statuses: statuses.map((status) => status._id),
    };
  });
};

const applyChanges = async (
  { boardModel, sprintModel }: IMigrationModels,
  boardLinks: IBoardLink[],
  boardsToCreate: INewBoard[],
  sprintMoves: ISprintMove[],
) => {
  if (boardLinks.length > 0) {
    await boardModel.bulkWrite(
      boardLinks.map(({ boardId, projectId }) => ({
        updateOne: { filter: { _id: boardId }, update: { $set: { project: projectId } } },
      })),
    );
  }
  // Create the copies before moving sprints onto them
  if (boardsToCreate.length > 0) {
    await boardModel.insertMany(boardsToCreate);
  }
  if (sprintMoves.length > 0) {
    await sprintModel.bulkWrite(
      sprintMoves.map(({ boardId, copyId, projectId }) => ({
        updateMany: {
          filter: { board: boardId, project: projectId },
          update: { $set: { board: copyId } },
        },
      })),
    );
  }
};

const migrateBoardProjects = async (dbConnection: mongoose.Connection) => {
  const boardModel = Board.getModel(dbConnection as unknown as mongoose.Mongoose);
  const sprintModel = Sprint.getModel(dbConnection);
  const projectModel = Project.getModel(dbConnection);
  const statusModel = Status.getModel(dbConnection);

  const linkedBoards = await boardModel
    .find({ project: { $ne: null } }, { project: 1 })
    .lean<IBoardDoc[]>();
  const boards = await boardModel.find({ project: null }).lean<IBoardDoc[]>();
  // Oldest first, so the first project to use a board keeps it
  const sprints: ISprintDoc[] = await sprintModel
    .find({ board: { $in: boards.map((board) => board._id) }, project: { $ne: null } }, {
      board: 1,
      project: 1,
    })
    .sort({ createdAt: 1 })
    .lean();
  const projects: IProjectDoc[] = await projectModel
    .find({ isDelete: { $ne: true } }, { tenant: 1 })
    .lean();

  const sharedBoardPlan = planSharedBoardChanges(boards, sprints, projects);

  // Projects that already have (or will get) a board
  const projectsWithBoard = new Set([
    ...linkedBoards.map((board) => String(board.project)),
    ...sharedBoardPlan.boardLinks.map((link) => String(link.projectId)),
    ...sharedBoardPlan.boardCopies.map((copy) => String(copy.project)),
  ]);
  const projectsWithoutBoard = projects.filter(
    (project) => !projectsWithBoard.has(project._id.toString()),
  );
  const defaultStatuses: IStatusDoc[] = await statusModel
    .find(
      {
        tenant: { $in: projectsWithoutBoard.map((project) => project.tenant) },
        slug: { $in: DEFAULT_STATUS.map((status) => status.slug) },
      },
      { slug: 1, tenant: 1 },
    )
    .lean();
  const defaultBoards = planDefaultBoards(projectsWithoutBoard, defaultStatuses);

  const result = {
    linked: sharedBoardPlan.boardLinks.length,
    copied: sharedBoardPlan.boardCopies.length,
    sprintsMoved: sharedBoardPlan.sprintsMoved,
    unused: sharedBoardPlan.unused,
    created: defaultBoards.length,
  };
  if (isDryRun) {
    return result;
  }

  await applyChanges(
    { boardModel, sprintModel },
    sharedBoardPlan.boardLinks,
    [...sharedBoardPlan.boardCopies, ...defaultBoards],
    sharedBoardPlan.sprintMoves,
  );
  return result;
};

const migrateDatabase = async (connectionString: string) => {
  let dbConnection: mongoose.Connection | undefined;
  try {
    dbConnection = await mongoose.createConnection(connectionString, options).asPromise();
    const result = await migrateBoardProjects(dbConnection);
    winstonLogger.info(
      `${dbConnection.name}: ${result.linked} boards linked, ${result.copied} boards copied, ` +
        `${result.sprintsMoved} sprints moved, ${result.unused} unused boards skipped, ` +
        `${result.created} boards created`,
    );
  } catch (error) {
    winstonLogger.error(`${dbConnection?.name ?? 'database'}: migration failed`, { error });
    throw error;
  } finally {
    await dbConnection?.close();
  }
};

const main = async () => {
  try {
    winstonLogger.info(
      `Migrating board projects${isDryRun ? ' (dry run, nothing will be saved)' : ''}`,
    );

    await migrateDatabase(config.publicConnection);

    winstonLogger.info(`Done! Migrated boards in ${PUBLIC_DB}.`);
    process.exit(0);
  } catch (error) {
    winstonLogger.error('Board project migration failed', { error });
    process.exit(1);
  }
};

void main();
