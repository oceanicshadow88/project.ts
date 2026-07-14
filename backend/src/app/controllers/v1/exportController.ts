import * as exportService from '../../services/exportService';
import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/helper';
import status from 'http-status';

export const exportTicketFields = (req: Request, res: Response) => {
  const fields = exportService.getTicketExportFields();
  res.status(200).json(fields);
};

export const exportTicketsCsv = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const tenantConnection = req.tenantsConnection;
  const fields =
    req.body.fields ??
    (typeof req.query.fields === 'string' ? req.query.fields.split(',') : []) ??
    [];
  res.header('Content-Type', 'text/csv');
  const fileName = `tickets_${projectId}_${Date.now()}.csv`;
  res.attachment(fileName);
  await exportService.exportTicketsCsvStream(
    projectId,
    fields,
    req.dbConnection,
    res,
    tenantConnection,
  );
};

export const exportProjectData = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  const exportData = await exportService.exportProjectData(
    projectId,
    req.dbConnection,
    req.tenantsConnection,
  );

  res.header('Content-Type', 'application/json');
  const fileName = `project_export_${projectId}_${Date.now()}.json`;
  res.attachment(fileName);
  res.status(200).json(exportData);
});

export const importProjectData = asyncHandler(async (req: Request, res: Response) => {
  let exportData: exportService.ExportData;

  // Handle file upload (from FormData)
  if (req.file) {
    try {
      const fileContent = req.file.buffer.toString('utf-8');
      exportData = JSON.parse(fileContent);
    } catch (error: any) {
      return res.status(status.BAD_REQUEST).json({
        error: 'Invalid JSON file format. Please ensure the file is valid JSON.',
        details: error.message,
      });
    }
  } else if (req.body && req.body.data) {
    // Handle direct JSON body
    exportData = req.body as exportService.ExportData;
  } else {
    return res.status(status.BAD_REQUEST).json({
      error: 'Invalid request. Please provide either a JSON file upload or JSON data in the request body.',
    });
  }

  // Validate export data structure - data is required, metadata is optional
  if (!exportData.data) {
    return res.status(status.BAD_REQUEST).json({
      error: 'Invalid export data format. Expected data field with entity arrays.',
    });
  }

  const result = await exportService.importProjectData(
    exportData,
    req.tenantId,
    req.dbConnection,
    req.tenantsConnection,
    req.userId,
  );

  res.status(200).json({
    message: 'Import completed',
    imported: result.imported,
    errors: result.errors,
    projectId: result.projectId,
  });
});
