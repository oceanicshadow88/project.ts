import { Request } from 'express';
import { emailContactUsTemplate } from '../utils/emailSender';

export const contactFormEmail = async (req: Request) => {
  await emailContactUsTemplate(req.body);
  return true;
};
