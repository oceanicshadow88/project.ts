//aws sesv2 create-email-template --cli-input-json file://mytemplate.json
// aws sesv2 update-email-template --cli-input-json file://questions-to-po.json
import { invalidSubdomains } from '../controllers/v1/registerV2Controller';
import { SES } from '@aws-sdk/client-ses';
import config from '../config/app';
import { winstonLogger } from '../../bootstrap/logger';
import awsConfig from '../config/aws';

function cb(email_err: any, email_data: any): void {
  if (email_err) {
    winstonLogger.error('Failed to send to email:' + email_err);
  } else {
    winstonLogger.info(`Email Sent Success: ${JSON.stringify(email_data)}`);
  }
}

const emailSenderTemplate = (
  email: string,
  data: any,
  templateName: string,
  callback: (email_err: any, email_data: any) => void,
) => {
  const ses = new SES(awsConfig);

  const destination = {
    ToAddresses: [email],
  };

  let params = {
    Source: `noreply@${config.mainDomain}`,
    Destination: destination,
    Template: templateName,
    TemplateData: JSON.stringify(data),
  };

  ses.sendTemplatedEmail(params, function (email_err: any, email_data: any) {
    if (email_err) {
      callback(email_err, email_data);
    } else {
      callback(null, email_data);
    }
  });
};

export const subscriptionSender = (email: string, validationCode: string, domain: string = '') => {
  const templateData = {
    name: email,
    appName: 'TECHSCRUMAPP',
    domain,
    url: 'verify',
    token: validationCode,
    color: '#7291F7',
    border: '5px solid #7291F7',
    year: '2023',
    project: 'abc',
  };

  emailSenderTemplate(email, templateData, 'Subscription', cb);
};

export const emailContactUsTemplate = (
  data: {},
) => {
  return new Promise((resolve, reject) => {
    // Use the first email address for emailSenderTemplate (it expects a single email string)
    const email = 'kitmanwork@gmail.com';
    if (!email) {
      reject(new Error('No email address provided'));
      return;
    }

    emailSenderTemplate(email, data, 'contactPageEmailTemplate', (email_err: any, email_data: any) => {
      if (email_err) {
        reject(email_err);
      } else {
        resolve(email_data);
      }
    });
  });
};


export const emailRecipientTemplate = (
  emailTo: string[],
  data: {},
  templateName: string,
) => {
  return new Promise((resolve, reject) => {
    // Use the first email address for emailSenderTemplate (it expects a single email string)
    const email = emailTo[0];
    if (!email) {
      reject(new Error('No email address provided'));
      return;
    }

    emailSenderTemplate(email, data, templateName, (email_err: unknown, email_data: unknown) => {
      if (email_err) {
        reject(email_err);
      } else {
        resolve(email_data);
      }
    });
  });
};

// Interface for QuestionsToPO email template data
export interface QuestionsToPOEmailData {
  questionsCount: number;
  urgentQuestionsCount: number;
  projectUrl: string;
  emailTitle: string;
}

// Typed function to send QuestionsToPO email
export const sendQuestionsToPOEmail = async (
  emailTo: string[],
  emailData: QuestionsToPOEmailData,
): Promise<unknown> => {
  return emailRecipientTemplate(emailTo, emailData, 'QuestionsToPO');
};

export const emailSender = (email: string, validationCode: string, domain: string = '') => {
  // Create sendEmail params
  const templateData = {
    name: email,
    appName: 'TECHSCRUMAPP',
    domain,
    url: 'verify',
    token: validationCode,
    color: '#7291F7',
    border: '5px solid #7291F7',
    year: '2022',
    project: 'abc',
  };
  emailSenderTemplate(email, templateData, 'CustomEmailVerify', cb);
};

export const invite = (
  email: string,
  name: string,
  isUserActive: boolean,
  accessToken: string,
  roleType: string,
  projectName: string,
  domain: string,
) => {
  // Create sendEmail params
  const url = isUserActive ? 'projects' : 'verify';
  const templateData = {
    name,
    appName: 'TECHSCRUMAPP',
    domain,
    url,
    color: '#7291F7',
    border: '5px solid #7291F7',
    year: '2022',
    project: projectName,
    token: `token=${accessToken}`,
    roleType: roleType,
  };
  emailSenderTemplate(email, templateData, 'Access', cb);
};

export const forgetPasswordEmail = (email: string, name: string, token: string, domain: string) => {
  const templateData = {
    name: name ?? email,
    appName: 'TECHSCRUMAPP',
    domain,
    url: 'login/change-password',
    color: '#7291F7',
    border: '5px solid #7291F7',
    year: '2022',
    project: 'abc',
    token: `token=${token}`,
    time: ' 30 minutes',
  };

  emailSenderTemplate(email, templateData, 'ForgotPassword', cb);
};

export const getDomain = (companyHost: string, originHost: string) => {
  if (
    config.environment.toLowerCase() === 'production' ||
    config.environment.toLowerCase() === 'prod'
  ) {
    if (Object.keys(invalidSubdomains).join('. ').includes(companyHost)) {
      throw new Error('Invalid Domain');
    }
    return companyHost;
  }
  return originHost;
};
