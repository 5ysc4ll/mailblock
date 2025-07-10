export interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  scheduledAt?: Date | string;
}

export interface MailblockOptions {
  debug?: boolean;
  logger?: Console;
}

export interface EmailResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  errorType?: 'VALIDATION_ERROR' | 'CLIENT_ERROR' | 'SERVER_ERROR' | 'NETWORK_ERROR' | 'RATE_LIMIT_ERROR' | 'UNKNOWN_ERROR';
  suggestion?: string;
  statusCode?: number | null;
  requestId?: string;
  timestamp?: string;
  duration?: number;
  endpoint?: string;
}

export class EmailBuilder {
  to(email: string): EmailBuilder;
  from(email: string): EmailBuilder;
  subject(subject: string): EmailBuilder;
  text(content: string): EmailBuilder;
  html(content: string): EmailBuilder;
  scheduleAt(date: Date | string): EmailBuilder;
  send(): Promise<EmailResponse>;
}

export default class Mailblock {
  constructor(apiKey: string, options?: MailblockOptions);
  sendEmail(options: EmailOptions): Promise<EmailResponse>;
  email(): EmailBuilder;
}