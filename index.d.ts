export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
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

export interface CancelEmailResponse {
  success: boolean;
  message?: string;
  data?: {
    message: string;
    email_id: number | string;
    previous_status: string;
    current_status: string;
    job_cancelled: boolean;
    to: string;
    scheduled_at: string;
  };
  error?: string;
  errorType?: 'VALIDATION_ERROR' | 'CLIENT_ERROR' | 'SERVER_ERROR' | 'NETWORK_ERROR' | 'RATE_LIMIT_ERROR' | 'UNKNOWN_ERROR';
  suggestion?: string;
  statusCode?: number | null;
  requestId?: string;
  timestamp?: string;
  duration?: number;
  endpoint?: string;
}

export interface CancelEmailsResponse {
  success: boolean;
  message?: string;
  data?: {
    message: string;
    success_count: number;
    error_count: number;
    results: Array<{
      email_id: number | string;
      previous_status: string;
      current_status: string;
      job_cancelled: boolean;
      to: string;
      scheduled_at: string;
    }>;
  };
  error?: string;
  errorType?: 'VALIDATION_ERROR' | 'CLIENT_ERROR' | 'SERVER_ERROR' | 'NETWORK_ERROR' | 'RATE_LIMIT_ERROR' | 'UNKNOWN_ERROR';
  suggestion?: string;
  statusCode?: number | null;
  requestId?: string;
  timestamp?: string;
  duration?: number;
  endpoint?: string;
}

export interface UpdateEmailOptions {
  subject?: string;
  body_html?: string;
  body_text?: string;
  scheduled_at?: Date | string | null;
}

export interface UpdateEmailResponse {
  success: boolean;
  message?: string;
  data?: {
    message: string;
    email: {
      id: string;
      to: string;
      cc?: string[];
      bcc?: string[];
      from: string;
      subject: string;
      status: string;
      scheduled_at?: string;
      created_at: string;
      updated_at: string;
    };
    tracking_updated: boolean;
    job_rescheduled: boolean;
  };
  error?: string;
  errorType?: 'VALIDATION_ERROR' | 'CLIENT_ERROR' | 'SERVER_ERROR' | 'NETWORK_ERROR' | 'RATE_LIMIT_ERROR' | 'UNKNOWN_ERROR';
  suggestion?: string;
  statusCode?: number | null;
  currentStatus?: string;
  requestId?: string;
  timestamp?: string;
  duration?: number;
  endpoint?: string;
}

export class EmailBuilder {
  to(emails: string | string[]): EmailBuilder;
  cc(emails: string | string[]): EmailBuilder;
  bcc(emails: string | string[]): EmailBuilder;
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
  cancelEmail(emailId: number | string): Promise<CancelEmailResponse>;
  cancelEmails(emailIds: (number | string)[]): Promise<CancelEmailsResponse>;
  updateScheduledEmail(emailId: number | string, updates: UpdateEmailOptions): Promise<UpdateEmailResponse>;
  email(): EmailBuilder;
}