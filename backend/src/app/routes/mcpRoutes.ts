import { Router } from 'express';
import { mcpEndpoint } from '../mcpServer/mcpEndpoint';
import { ValidateTicketTitleTool } from '../mcpServer/validateTicketTitleTool';

const router = Router();

router.post(
  '/validate_ticket_title',
  mcpEndpoint(ValidateTicketTitleTool),
);

export default router;
