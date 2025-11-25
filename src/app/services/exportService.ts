import { ticketSchema } from '../model/ticket';
import * as Ticket from '../model/ticket';
import * as User from '../model/user';
import * as Label from '../model/label';
import * as Type from '../model/type';
import * as Status from '../model/status';
import * as Sprint from '../model/sprint';
import * as Epic from '../model/epic';
import * as Project from '../model/project';
import mongoose from 'mongoose';
import { format } from '@fast-csv/format';
import { Response } from 'express';

export const getTicketExportFields = () => {
  return Object.keys(ticketSchema.paths)
    .filter(key => !['_id'].includes(key));
};


export const exportTicketsCsvStream = async (
  projectId: string,
  fields: string[],
  dbConnection: mongoose.Connection,
  res: Response,
  tenantConnection: mongoose.Connection,
) => {
  const TicketModel = Ticket.getModel(dbConnection);
  const labelModel = await Label.getModel(dbConnection);
  const typeModel = await Type.getModel(dbConnection);
  const statusModel = await Status.getModel(dbConnection);
  const sprintModel = await Sprint.getModel(dbConnection);
  const epicModel = await Epic.getModel(dbConnection);
  const allFields = Object.keys(ticketSchema.paths).filter(key => !['_id'].includes(key));
  const exportFields = fields && fields.length > 0 ? fields : allFields;
  const csvStream = format({ headers: exportFields });
  csvStream.pipe(res);
  const userModel = await User.getModel(tenantConnection);

  const cursor = TicketModel
    .find({ project: projectId })
    .select(exportFields.join(' '))
    .populate({ path: 'reporter', select: 'email', model: userModel })
    .populate({ path: 'assign', select: 'email', model: userModel })
    .populate({ path: 'labels', select: 'name', model: labelModel })
    .populate({ path: 'type', select: 'name', model: typeModel })
    .populate({ path: 'status', select: 'name', model: statusModel })
    .populate({ path: 'sprint', select: 'name', model: sprintModel })
    .populate({ path: 'epic', select: 'title', model: epicModel })
    .lean()
    .cursor();

  for await (const doc of cursor) {
    if (doc.reporter && typeof doc.reporter === 'object') {
      doc.reporter = doc.reporter.email ?? '';
    }
    if (doc.assign && typeof doc.assign === 'object') {
      doc.assign = doc.assign.email ?? '';
    }
    if (doc.labels && Array.isArray(doc.labels)) {
      doc.labels = doc.labels.map((label: any) => label?.name ?? '').filter(Boolean).join(', ');
    }
    if (doc.type && typeof doc.type === 'object') {
      doc.type = doc.type.name ?? '';
    }
    if (doc.status && typeof doc.status === 'object') {
      doc.status = doc.status.name ?? '';
    }
    if (doc.sprint && typeof doc.sprint === 'object') {
      doc.sprint = doc.sprint.name ?? '';
    }
    if (doc.epic && typeof doc.epic === 'object') {
      doc.epic = doc.epic.title ?? '';
    }
    csvStream.write(doc);
  }
  csvStream.end();
};

export interface ExportData {
  metadata: {
    version: string;
    exportDate: string;
    projectId: string;
    projectName?: string;
  };
  data: {
    users: any[];
    statuses: any[];
    labels: any[];
    types: any[];
    sprints: any[];
    epics: any[];
    tickets: any[];
  };
}

export const exportProjectData = async (
  projectId: string,
  dbConnection: mongoose.Connection,
  tenantConnection: mongoose.Connection,
): Promise<ExportData> => {
  const projectModel = Project.getModel(dbConnection);
  const project = await projectModel.findById(projectId).lean();

  if (!project) {
    throw new Error('Project not found');
  }

  const TicketModel = Ticket.getModel(dbConnection);
  const labelModel = await Label.getModel(dbConnection);
  const typeModel = await Type.getModel(dbConnection);
  const statusModel = await Status.getModel(dbConnection);
  const sprintModel = await Sprint.getModel(dbConnection);
  const epicModel = await Epic.getModel(dbConnection);
  const userModel = await User.getModel(tenantConnection);

  // Get all tickets for the project
  const tickets = await TicketModel.find({ project: projectId }).lean();

  // Collect all referenced IDs
  const userIds = new Set<string>();
  const statusIds = new Set<string>();
  const labelIds = new Set<string>();
  const typeIds = new Set<string>();
  const sprintIds = new Set<string>();
  const epicIds = new Set<string>();

  tickets.forEach((ticket: any) => {
    if (ticket.reporter) userIds.add(ticket.reporter.toString());
    if (ticket.assign) userIds.add(ticket.assign.toString());
    if (ticket.status) statusIds.add(ticket.status.toString());
    if (ticket.type) typeIds.add(ticket.type.toString());
    if (ticket.sprint) sprintIds.add(ticket.sprint.toString());
    if (ticket.epic) epicIds.add(ticket.epic.toString());
    if (ticket.labels && Array.isArray(ticket.labels)) {
      ticket.labels.forEach((labelId: any) => labelIds.add(labelId.toString()));
    }
  });

  // Get all sprints and epics for the project
  const sprints = await sprintModel.find({ project: projectId }).lean();
  const epics = await epicModel.find({ project: projectId }).lean();

  // Collect IDs from sprints and epics
  sprints.forEach((sprint: any) => {
    if (sprint.reporter) userIds.add(sprint.reporter.toString());
    if (sprint.assign) userIds.add(sprint.assign.toString());
  });

  epics.forEach((epic: any) => {
    if (epic.reporter) userIds.add(epic.reporter.toString());
    if (epic.assign) userIds.add(epic.assign.toString());
  });

  // Fetch all referenced entities
  const [users, statuses, labels, types] = await Promise.all([
    userModel.find({ _id: { $in: Array.from(userIds) } }).lean(),
    statusModel.find({ _id: { $in: Array.from(statusIds) } }).lean(),
    labelModel.find({ _id: { $in: Array.from(labelIds) } }).lean(),
    typeModel.find({ _id: { $in: Array.from(typeIds) } }).lean(),
  ]);

  // Clean up data - remove sensitive fields and convert to plain objects
  const cleanUsers = users.map((user: any) => {
    const { password, refreshToken, activeCode, __v, ...cleanUser } = user;
    return cleanUser;
  });

  const cleanStatuses = statuses.map((status: any) => {
    const { __v, ...cleanStatus } = status;
    return cleanStatus;
  });

  const cleanLabels = labels.map((label: any) => {
    const { __v, ...cleanLabel } = label;
    return cleanLabel;
  });

  const cleanTypes = types.map((type: any) => {
    const { __v, ...cleanType } = type;
    return cleanType;
  });

  const cleanSprints = sprints.map((sprint: any) => {
    const { __v, ...cleanSprint } = sprint;
    return cleanSprint;
  });

  const cleanEpics = epics.map((epic: any) => {
    const { __v, ...cleanEpic } = epic;
    return cleanEpic;
  });

  const cleanTickets = tickets.map((ticket: any) => {
    const { __v, ...cleanTicket } = ticket;
    return cleanTicket;
  });

  return {
    metadata: {
      version: '1.0',
      exportDate: new Date().toISOString(),
      projectId: projectId,
      projectName: (project as any).name,
    },
    data: {
      users: cleanUsers,
      statuses: cleanStatuses,
      labels: cleanLabels,
      types: cleanTypes,
      sprints: cleanSprints,
      epics: cleanEpics,
      tickets: cleanTickets,
    },
  };
};

export const importProjectData = async (
  exportData: ExportData,
  targetProjectId: string,
  tenantId: string,
  dbConnection: mongoose.Connection,
  tenantConnection: mongoose.Connection,
): Promise<{ imported: { [key: string]: number }; errors: string[] }> => {
  const labelModel = await Label.getModel(dbConnection);
  const typeModel = await Type.getModel(dbConnection);
  const statusModel = await Status.getModel(dbConnection);
  const sprintModel = await Sprint.getModel(dbConnection);
  const epicModel = await Epic.getModel(dbConnection);
  const TicketModel = Ticket.getModel(dbConnection);
  const userModel = await User.getModel(tenantConnection);

  const idMapping: { [entityType: string]: { [oldId: string]: string } } = {
    users: {},
    statuses: {},
    labels: {},
    types: {},
    sprints: {},
    epics: {},
  };

  const errors: string[] = [];
  const imported: { [key: string]: number } = {
    users: 0,
    statuses: 0,
    labels: 0,
    types: 0,
    sprints: 0,
    epics: 0,
    tickets: 0,
  };

  try {
    // 1. Import users (match by email, create if not exists)
    for (const user of exportData.data.users) {
      try {
        const existingUser = await userModel.findOne({ email: user.email });
        if (existingUser) {
          idMapping.users[user._id.toString()] = existingUser._id.toString();
        } else {
          // Create new user without password (they'll need to reset)
          const newUser = await userModel.create({
            email: user.email,
            name: user.name,
            jobTitle: user.jobTitle,
            department: user.department,
            location: user.location,
            avatarIcon: user.avatarIcon,
            abbreviation: user.abbreviation,
            userName: user.userName,
            active: false, // Require activation
          });
          idMapping.users[user._id.toString()] = newUser._id.toString();
          imported.users++;
        }
      } catch (error: any) {
        errors.push(`Error importing user ${user.email}: ${error.message}`);
      }
    }

    // 2. Import statuses (match by slug + tenant, create if not exists)
    for (const status of exportData.data.statuses) {
      try {
        const existingStatus = await statusModel.findOne({
          slug: status.slug,
          tenant: tenantId,
        });
        if (existingStatus) {
          idMapping.statuses[status._id.toString()] = existingStatus._id.toString();
        } else {
          const newStatus = await statusModel.create({
            name: status.name,
            slug: status.slug,
            tenant: tenantId,
            isDefault: status.isDefault || false,
            order: status.order || 0,
          });
          idMapping.statuses[status._id.toString()] = newStatus._id.toString();
          imported.statuses++;
        }
      } catch (error: any) {
        errors.push(`Error importing status ${status.name}: ${error.message}`);
      }
    }

    // 3. Import labels (match by slug + tenant, create if not exists)
    for (const label of exportData.data.labels) {
      try {
        const existingLabel = await labelModel.findOne({
          slug: label.slug,
          tenant: tenantId,
        });
        if (existingLabel) {
          idMapping.labels[label._id.toString()] = existingLabel._id.toString();
        } else {
          const newLabel = await labelModel.create({
            name: label.name,
            slug: label.slug,
            tenant: tenantId,
          });
          idMapping.labels[label._id.toString()] = newLabel._id.toString();
          imported.labels++;
        }
      } catch (error: any) {
        errors.push(`Error importing label ${label.name}: ${error.message}`);
      }
    }

    // 4. Import types (match by slug, create if not exists)
    for (const type of exportData.data.types) {
      try {
        const existingType = await typeModel.findOne({ slug: type.slug });
        if (existingType) {
          idMapping.types[type._id.toString()] = existingType._id.toString();
        } else {
          const newType = await typeModel.create({
            name: type.name,
            slug: type.slug,
            icon: type.icon,
          });
          idMapping.types[type._id.toString()] = newType._id.toString();
          imported.types++;
        }
      } catch (error: any) {
        errors.push(`Error importing type ${type.name}: ${error.message}`);
      }
    }

    // 5. Import epics (always create new for the target project)
    for (const epic of exportData.data.epics) {
      try {
        const newEpic = await epicModel.create({
          title: epic.title,
          project: targetProjectId,
          tenant: tenantId,
          color: epic.color,
          description: epic.description,
          startDate: epic.startDate,
          dueAt: epic.dueAt,
          reporter: epic.reporter ? idMapping.users[epic.reporter.toString()] : undefined,
          assign: epic.assign ? idMapping.users[epic.assign.toString()] : undefined,
          isComplete: epic.isComplete || false,
          isActive: epic.isActive !== undefined ? epic.isActive : true,
          goal: epic.goal,
          currentEpic: epic.currentEpic || false,
          attachmentUrls: epic.attachmentUrls || [],
        });
        idMapping.epics[epic._id.toString()] = newEpic._id.toString();
        imported.epics++;
      } catch (error: any) {
        errors.push(`Error importing epic ${epic.title}: ${error.message}`);
      }
    }

    // 6. Import sprints (always create new for the target project)
    for (const sprint of exportData.data.sprints) {
      try {
        const newSprint = await sprintModel.create({
          name: sprint.name,
          project: targetProjectId,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          description: sprint.description,
          currentSprint: sprint.currentSprint || false,
          isComplete: sprint.isComplete || false,
          sprintGoal: sprint.sprintGoal,
        });
        idMapping.sprints[sprint._id.toString()] = newSprint._id.toString();
        imported.sprints++;
      } catch (error: any) {
        errors.push(`Error importing sprint ${sprint.name}: ${error.message}`);
      }
    }

    // 7. Import tickets (always create new for the target project)
    for (const ticket of exportData.data.tickets) {
      try {
        const mappedLabels = ticket.labels
          ? ticket.labels
            .map((labelId: any) => idMapping.labels[labelId.toString()])
            .filter(Boolean)
          : [];

        await TicketModel.create({
          title: ticket.title,
          labels: mappedLabels,
          status: ticket.status ? idMapping.statuses[ticket.status.toString()] : undefined,
          priority: ticket.priority || 'Medium',
          project: targetProjectId,
          epic: ticket.epic ? idMapping.epics[ticket.epic.toString()] : undefined,
          sprint: ticket.sprint ? idMapping.sprints[ticket.sprint.toString()] : undefined,
          description: ticket.description,
          storyPoint: ticket.storyPoint || 0,
          dueAt: ticket.dueAt,
          reporter: ticket.reporter ? idMapping.users[ticket.reporter.toString()] : undefined,
          assign: ticket.assign ? idMapping.users[ticket.assign.toString()] : undefined,
          type: ticket.type ? idMapping.types[ticket.type.toString()] : undefined,
          isActive: ticket.isActive !== undefined ? ticket.isActive : true,
          attachmentUrls: ticket.attachmentUrls || [],
          rank: ticket.rank,
        });
        imported.tickets++;
      } catch (error: any) {
        errors.push(`Error importing ticket ${ticket.title}: ${error.message}`);
      }
    }
  } catch (error: any) {
    errors.push(`Fatal error during import: ${error.message}`);
  }

  return { imported, errors };
};