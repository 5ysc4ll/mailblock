class EmailBuilder {
  constructor(client) {
    this.client = client;
    this.emailData = {};
  }

  to(emails) {
    this.emailData.to = this._validateEmailOrArray(emails, 'to');
    return this;
  }

  cc(emails) {
    if (emails !== undefined) {
      this.emailData.cc = this._validateEmailOrArray(emails, 'cc');
    }
    return this;
  }

  bcc(emails) {
    if (emails !== undefined) {
      this.emailData.bcc = this._validateEmailOrArray(emails, 'bcc');
    }
    return this;
  }

  from(email) {
    if (!this._isValidEmail(email)) {
      throw new Error(`Invalid 'from' email address: ${email}`);
    }
    this.emailData.from = email;
    return this;
  }

  subject(subject) {
    if (
      !subject ||
      typeof subject !== "string" ||
      subject.trim().length === 0
    ) {
      throw new Error("Subject must be a non-empty string");
    }
    this.emailData.subject = subject.trim();
    return this;
  }

  text(content) {
    if (!content || typeof content !== "string") {
      throw new Error("Text content must be a non-empty string");
    }
    this.emailData.text = content;
    return this;
  }

  html(content) {
    if (!content || typeof content !== "string") {
      throw new Error("HTML content must be a non-empty string");
    }
    this.emailData.html = content;
    return this;
  }

  scheduleAt(date) {
    if (date instanceof Date) {
      if (date <= new Date()) {
        throw new Error("Scheduled date must be in the future");
      }
      this.emailData.scheduledAt = date;
    } else if (typeof date === "string") {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date format for scheduling");
      }
      if (parsedDate <= new Date()) {
        throw new Error("Scheduled date must be in the future");
      }
      this.emailData.scheduledAt = parsedDate;
    } else {
      throw new Error(
        "Scheduled date must be a Date object or valid date string"
      );
    }
    return this;
  }

  async send() {
    return this.client.sendEmail(this.emailData);
  }

  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  _validateEmailOrArray(emails, fieldName) {
    if (typeof emails === 'string') {
      if (!this._isValidEmail(emails)) {
        throw new Error(`Invalid '${fieldName}' email address: ${emails}`);
      }
      return emails;
    }
    
    if (Array.isArray(emails)) {
      if (emails.length === 0) {
        throw new Error(`${fieldName} array cannot be empty`);
      }
      
      for (const email of emails) {
        if (typeof email !== 'string' || !this._isValidEmail(email)) {
          throw new Error(`Invalid '${fieldName}' email address: ${email}`);
        }
      }
      return emails;
    }
    
    throw new Error(`${fieldName} must be a string or array of strings`);
  }
}

class Mailblock {
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error("API key is required");
    }
    if (typeof apiKey !== "string" || apiKey.trim().length === 0) {
      throw new Error("API key must be a non-empty string");
    }
    this.apiKey = apiKey.trim();
    this.baseUrl = "https://sdk-backend-production-20e1.up.railway.app";
    this.debug = options.debug || false;
    this.logger = options.logger || console;
  }

  _log(level, message, data = null) {
    if (!this.debug) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] Mailblock ${level.toUpperCase()}: ${message}`;
    
    if (data) {
      this.logger[level](logMessage, data);
    } else {
      this.logger[level](logMessage);
    }
  }

  _generateRequestId() {
    return 'req_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }

  email() {
    return new EmailBuilder(this);
  }

  async sendEmail({ to, cc, bcc, from, subject, text, html, scheduledAt }) {
    const requestId = this._generateRequestId();
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    this._log('info', `Initiating email send request`, { requestId, to, from, subject: subject?.substring(0, 50) + '...' });

    // Validation errors
    if (!to) {
      return {
        success: false,
        error: "Recipient email address (to) is required",
        errorType: "VALIDATION_ERROR",
        statusCode: null,
        requestId,
        timestamp,
        duration: Date.now() - startTime
      };
    }

    if (!from) {
      return {
        success: false,
        error: "Sender email address (from) is required",
        errorType: "VALIDATION_ERROR",
        statusCode: null,
        requestId,
        timestamp,
        duration: Date.now() - startTime
      };
    }

    if (!subject) {
      return {
        success: false,
        error: "Email subject is required",
        errorType: "VALIDATION_ERROR",
        statusCode: null,
        requestId,
        timestamp,
        duration: Date.now() - startTime
      };
    }

    if (!text && !html) {
      return {
        success: false,
        error: "Either text or html content is required",
        errorType: "VALIDATION_ERROR",
        statusCode: null,
        requestId,
        timestamp,
        duration: Date.now() - startTime
      };
    }

    // Validate email addresses
    const emailValidation = this._validateEmailFields({ to, cc, bcc, from });
    if (!emailValidation.isValid) {
      return {
        success: false,
        error: emailValidation.error,
        errorType: "VALIDATION_ERROR",
        statusCode: null,
        requestId,
        timestamp,
        duration: Date.now() - startTime
      };
    }

    const payload = {
      to,
      from,
      subject,
      ...(text && { text }),
      ...(html && { html }),
      ...(cc && { cc }),
      ...(bcc && { bcc }),
    };

    if (scheduledAt) {
      payload.scheduled_at =
        scheduledAt instanceof Date ? scheduledAt.toISOString() : scheduledAt;
    }

    this._log('debug', 'Sending API request', { 
      requestId, 
      endpoint: `${this.baseUrl}/v1/send-email`,
      payload: { ...payload, text: text ? '[REDACTED]' : undefined, html: html ? '[REDACTED]' : undefined }
    });

    try {
      const response = await fetch(`${this.baseUrl}/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-Request-ID": requestId,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      this._log('debug', `API response received`, { 
        requestId, 
        statusCode: response.status, 
        duration: `${duration}ms`,
        success: response.ok 
      });

      if (!response.ok) {
        const errorType = this._categorizeError(response.status);
        const errorMessage = result.error || `HTTP error! status: ${response.status}`;
        const suggestion = this._getErrorSuggestion(response.status);

        this._log('error', `API request failed`, { 
          requestId, 
          error: errorMessage, 
          statusCode: response.status,
          errorType,
          suggestion
        });

        return {
          success: false,
          error: errorMessage,
          errorType,
          suggestion,
          statusCode: response.status,
          requestId,
          timestamp,
          duration,
          endpoint: `${this.baseUrl}/v1/send-email`
        };
      }

      // Handle the new API response format
      const emailData = result.results && result.results[0] ? result.results[0] : result;
      
      this._log('info', `Email ${scheduledAt ? 'scheduled' : 'sent'} successfully`, { 
        requestId, 
        duration: `${duration}ms`,
        emailId: emailData.id,
        successCount: result.success_count,
        totalRecipients: result.total_recipients
      });

      return {
        success: true,
        data: {
          id: emailData.id,
          status: emailData.status,
          to: emailData.to,
          cc: emailData.cc,
          bcc: emailData.bcc,
          success_count: result.success_count,
          error_count: result.error_count,
          total_recipients: result.total_recipients,
          usage: result.usage
        },
        message: scheduledAt
          ? "Email scheduled successfully"
          : "Email sent successfully",
        requestId,
        timestamp,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorType = error.name === 'TypeError' && error.message.includes('fetch') 
        ? 'NETWORK_ERROR' 
        : 'UNKNOWN_ERROR';

      this._log('error', `Request failed with exception`, { 
        requestId, 
        error: error.message, 
        errorType,
        duration: `${duration}ms`
      });

      return {
        success: false,
        error: `Failed to send email: ${error.message}`,
        errorType,
        suggestion: errorType === 'NETWORK_ERROR' 
          ? 'Check your internet connection and try again' 
          : 'Please try again or contact support if the issue persists',
        statusCode: null,
        requestId,
        timestamp,
        duration,
        endpoint: `${this.baseUrl}/v1/send-email`
      };
    }
  }

  async cancelEmail(emailId) {
    const requestId = this._generateRequestId();
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    this._log('info', `Initiating email cancellation request`, { requestId, emailId });

    // Validation
    if (!emailId) {
      return {
        success: false,
        error: "Email ID is required",
        errorType: "VALIDATION_ERROR",
        statusCode: null,
        requestId,
        timestamp,
        duration: Date.now() - startTime
      };
    }

    if (typeof emailId !== 'number' && typeof emailId !== 'string') {
      return {
        success: false,
        error: "Email ID must be a number or string",
        errorType: "VALIDATION_ERROR",
        statusCode: null,
        requestId,
        timestamp,
        duration: Date.now() - startTime
      };
    }

    this._log('debug', 'Sending cancellation API request', { 
      requestId, 
      endpoint: `${this.baseUrl}/v1/cancel-email/${emailId}`,
      emailId
    });

    try {
      const response = await fetch(`${this.baseUrl}/v1/cancel-email/${emailId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-Request-ID": requestId,
        },
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      this._log('debug', `Cancellation API response received`, { 
        requestId, 
        statusCode: response.status, 
        duration: `${duration}ms`,
        success: response.ok 
      });

      if (!response.ok) {
        const errorType = this._categorizeError(response.status);
        const errorMessage = result.error || `HTTP error! status: ${response.status}`;
        const suggestion = this._getErrorSuggestion(response.status);

        this._log('error', `Cancellation API request failed`, { 
          requestId, 
          error: errorMessage, 
          statusCode: response.status,
          errorType,
          suggestion
        });

        return {
          success: false,
          error: errorMessage,
          errorType,
          suggestion,
          statusCode: response.status,
          requestId,
          timestamp,
          duration,
          endpoint: `${this.baseUrl}/v1/cancel-email/${emailId}`
        };
      }

      this._log('info', `Email cancelled successfully`, { 
        requestId, 
        duration: `${duration}ms`,
        emailId: result.email_id,
        previousStatus: result.previous_status,
        currentStatus: result.current_status
      });

      return {
        success: true,
        data: result,
        message: "Email cancelled successfully",
        requestId,
        timestamp,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorType = error.name === 'TypeError' && error.message.includes('fetch') 
        ? 'NETWORK_ERROR' 
        : 'UNKNOWN_ERROR';

      this._log('error', `Cancellation request failed with exception`, { 
        requestId, 
        error: error.message, 
        errorType,
        duration: `${duration}ms`
      });

      return {
        success: false,
        error: `Failed to cancel email: ${error.message}`,
        errorType,
        suggestion: errorType === 'NETWORK_ERROR' 
          ? 'Check your internet connection and try again' 
          : 'Please try again or contact support if the issue persists',
        statusCode: null,
        requestId,
        timestamp,
        duration,
        endpoint: `${this.baseUrl}/v1/cancel-email/${emailId}`
      };
    }
  }

  async cancelEmails(emailIds) {
    const requestId = this._generateRequestId();
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    this._log('info', `Initiating bulk email cancellation request`, { requestId, emailIds, count: emailIds?.length });

    // Validation
    if (!emailIds) {
      return {
        success: false,
        error: "Email IDs array is required",
        errorType: "VALIDATION_ERROR",
        statusCode: null,
        requestId,
        timestamp,
        duration: Date.now() - startTime
      };
    }

    if (!Array.isArray(emailIds)) {
      return {
        success: false,
        error: "Email IDs must be an array",
        errorType: "VALIDATION_ERROR",
        statusCode: null,
        requestId,
        timestamp,
        duration: Date.now() - startTime
      };
    }

    if (emailIds.length === 0) {
      return {
        success: false,
        error: "Email IDs array cannot be empty",
        errorType: "VALIDATION_ERROR",
        statusCode: null,
        requestId,
        timestamp,
        duration: Date.now() - startTime
      };
    }

    // Validate each email ID
    for (const emailId of emailIds) {
      if (typeof emailId !== 'number' && typeof emailId !== 'string') {
        return {
          success: false,
          error: `Invalid email ID: ${emailId}. All email IDs must be numbers or strings`,
          errorType: "VALIDATION_ERROR",
          statusCode: null,
          requestId,
          timestamp,
          duration: Date.now() - startTime
        };
      }
    }

    const payload = { email_ids: emailIds };

    this._log('debug', 'Sending bulk cancellation API request', { 
      requestId, 
      endpoint: `${this.baseUrl}/v1/cancel-email`,
      payload
    });

    try {
      const response = await fetch(`${this.baseUrl}/v1/cancel-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-Request-ID": requestId,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      this._log('debug', `Bulk cancellation API response received`, { 
        requestId, 
        statusCode: response.status, 
        duration: `${duration}ms`,
        success: response.ok,
        successCount: result.success_count,
        errorCount: result.error_count
      });

      if (!response.ok) {
        const errorType = this._categorizeError(response.status);
        const errorMessage = result.error || `HTTP error! status: ${response.status}`;
        const suggestion = this._getErrorSuggestion(response.status);

        this._log('error', `Bulk cancellation API request failed`, { 
          requestId, 
          error: errorMessage, 
          statusCode: response.status,
          errorType,
          suggestion
        });

        return {
          success: false,
          error: errorMessage,
          errorType,
          suggestion,
          statusCode: response.status,
          requestId,
          timestamp,
          duration,
          endpoint: `${this.baseUrl}/v1/cancel-email`
        };
      }

      this._log('info', `Bulk email cancellation completed`, { 
        requestId, 
        duration: `${duration}ms`,
        successCount: result.success_count,
        errorCount: result.error_count,
        totalRequested: emailIds.length
      });

      return {
        success: true,
        data: result,
        message: result.message || `Cancelled ${result.success_count} of ${emailIds.length} emails`,
        requestId,
        timestamp,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorType = error.name === 'TypeError' && error.message.includes('fetch') 
        ? 'NETWORK_ERROR' 
        : 'UNKNOWN_ERROR';

      this._log('error', `Bulk cancellation request failed with exception`, { 
        requestId, 
        error: error.message, 
        errorType,
        duration: `${duration}ms`
      });

      return {
        success: false,
        error: `Failed to cancel emails: ${error.message}`,
        errorType,
        suggestion: errorType === 'NETWORK_ERROR' 
          ? 'Check your internet connection and try again' 
          : 'Please try again or contact support if the issue persists',
        statusCode: null,
        requestId,
        timestamp,
        duration,
        endpoint: `${this.baseUrl}/v1/cancel-email`
      };
    }
  }

  async updateScheduledEmail(emailId, updates) {
    const requestId = this._generateRequestId();
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    this._log('info', `Initiating scheduled email update request`, { requestId, emailId, updates: Object.keys(updates) });

    // Validation
    if (!emailId) {
      return {
        success: false,
        error: "Email ID is required",
        errorType: "VALIDATION_ERROR",
        statusCode: null,
        requestId,
        timestamp,
        duration: Date.now() - startTime
      };
    }

    if (typeof emailId !== 'number' && typeof emailId !== 'string') {
      return {
        success: false,
        error: "Email ID must be a number or string",
        errorType: "VALIDATION_ERROR",
        statusCode: null,
        requestId,
        timestamp,
        duration: Date.now() - startTime
      };
    }

    if (!updates || typeof updates !== 'object') {
      return {
        success: false,
        error: "Updates object is required",
        errorType: "VALIDATION_ERROR",
        statusCode: null,
        requestId,
        timestamp,
        duration: Date.now() - startTime
      };
    }

    // Validate that at least one valid field is provided
    const validFields = ['subject', 'body_html', 'body_text', 'scheduled_at'];
    const providedFields = Object.keys(updates).filter(key => validFields.includes(key));
    
    if (providedFields.length === 0) {
      return {
        success: false,
        error: "At least one field must be provided for update (subject, body_html, body_text, or scheduled_at)",
        errorType: "VALIDATION_ERROR",
        statusCode: null,
        requestId,
        timestamp,
        duration: Date.now() - startTime
      };
    }

    // Prepare payload - only include valid fields
    const payload = {};
    if (updates.subject !== undefined) payload.subject = updates.subject;
    if (updates.body_html !== undefined) payload.body_html = updates.body_html;
    if (updates.body_text !== undefined) payload.body_text = updates.body_text;
    if (updates.scheduled_at !== undefined) {
      // Handle Date objects or strings
      if (updates.scheduled_at instanceof Date) {
        payload.scheduled_at = updates.scheduled_at.toISOString();
      } else if (updates.scheduled_at === null) {
        payload.scheduled_at = null;
      } else if (typeof updates.scheduled_at === 'string') {
        // Validate date string
        const parsedDate = new Date(updates.scheduled_at);
        if (isNaN(parsedDate.getTime())) {
          return {
            success: false,
            error: "Invalid scheduled_at date format",
            errorType: "VALIDATION_ERROR",
            statusCode: null,
            requestId,
            timestamp,
            duration: Date.now() - startTime
          };
        }
        payload.scheduled_at = updates.scheduled_at;
      } else {
        return {
          success: false,
          error: "scheduled_at must be a Date object, valid date string, or null",
          errorType: "VALIDATION_ERROR",
          statusCode: null,
          requestId,
          timestamp,
          duration: Date.now() - startTime
        };
      }
    }

    this._log('debug', 'Sending update API request', { 
      requestId, 
      endpoint: `${this.baseUrl}/v1/update-scheduled-email/${emailId}`,
      payload: { ...payload, body_html: payload.body_html ? '[REDACTED]' : undefined, body_text: payload.body_text ? '[REDACTED]' : undefined }
    });

    try {
      const response = await fetch(`${this.baseUrl}/v1/update-scheduled-email/${emailId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-Request-ID": requestId,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      this._log('debug', `Update API response received`, { 
        requestId, 
        statusCode: response.status, 
        duration: `${duration}ms`,
        success: response.ok 
      });

      if (!response.ok) {
        const errorType = this._categorizeError(response.status);
        const errorMessage = result.error || `HTTP error! status: ${response.status}`;
        const suggestion = this._getErrorSuggestion(response.status);

        this._log('error', `Update API request failed`, { 
          requestId, 
          error: errorMessage, 
          statusCode: response.status,
          errorType,
          suggestion,
          currentStatus: result.current_status
        });

        return {
          success: false,
          error: errorMessage,
          errorType,
          suggestion,
          statusCode: response.status,
          currentStatus: result.current_status,
          requestId,
          timestamp,
          duration,
          endpoint: `${this.baseUrl}/v1/update-scheduled-email/${emailId}`
        };
      }

      this._log('info', `Scheduled email updated successfully`, { 
        requestId, 
        duration: `${duration}ms`,
        emailId: result.email?.id,
        status: result.email?.status,
        trackingUpdated: result.tracking_updated,
        jobRescheduled: result.job_rescheduled
      });

      return {
        success: true,
        data: {
          message: result.message,
          email: result.email,
          tracking_updated: result.tracking_updated,
          job_rescheduled: result.job_rescheduled
        },
        message: "Email updated successfully",
        requestId,
        timestamp,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorType = error.name === 'TypeError' && error.message.includes('fetch') 
        ? 'NETWORK_ERROR' 
        : 'UNKNOWN_ERROR';

      this._log('error', `Update request failed with exception`, { 
        requestId, 
        error: error.message, 
        errorType,
        duration: `${duration}ms`
      });

      return {
        success: false,
        error: `Failed to update scheduled email: ${error.message}`,
        errorType,
        suggestion: errorType === 'NETWORK_ERROR' 
          ? 'Check your internet connection and try again' 
          : 'Please try again or contact support if the issue persists',
        statusCode: null,
        requestId,
        timestamp,
        duration,
        endpoint: `${this.baseUrl}/v1/update-scheduled-email/${emailId}`
      };
    }
  }

  _categorizeError(statusCode) {
    if (statusCode >= 400 && statusCode < 500) {
      return 'CLIENT_ERROR';
    } else if (statusCode >= 500) {
      return 'SERVER_ERROR';
    } else if (statusCode === 429) {
      return 'RATE_LIMIT_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  _getErrorSuggestion(statusCode) {
    switch (statusCode) {
      case 400:
        return 'Check your request parameters and try again';
      case 401:
        return 'Verify your API key is correct and has proper permissions';
      case 403:
        return 'Your API key may not have permission for this operation';
      case 404:
        return 'The API endpoint was not found. Check the base URL';
      case 429:
        return 'You are being rate limited. Wait a moment and try again';
      case 500:
        return 'Server error occurred. Try again in a few moments';
      case 503:
        return 'Service temporarily unavailable. Please try again later';
      default:
        return 'Please try again or contact support if the issue persists';
    }
  }

  _validateEmailFields({ to, cc, bcc, from }) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Helper to validate single email or array
    const validateEmailOrArray = (emails, fieldName) => {
      if (typeof emails === 'string') {
        if (!emailRegex.test(emails)) {
          return { isValid: false, error: `Invalid ${fieldName} email address: ${emails}` };
        }
      } else if (Array.isArray(emails)) {
        if (emails.length === 0) {
          return { isValid: false, error: `${fieldName} array cannot be empty` };
        }
        for (const email of emails) {
          if (typeof email !== 'string' || !emailRegex.test(email)) {
            return { isValid: false, error: `Invalid ${fieldName} email address: ${email}` };
          }
        }
      } else {
        return { isValid: false, error: `${fieldName} must be a string or array of strings` };
      }
      return { isValid: true };
    };

    // Validate 'to' field
    const toValidation = validateEmailOrArray(to, 'recipient');
    if (!toValidation.isValid) return toValidation;

    // Validate 'from' field (always single email)
    if (!emailRegex.test(from)) {
      return { isValid: false, error: `Invalid sender email address: ${from}` };
    }

    // Validate 'cc' field if provided
    if (cc !== undefined) {
      const ccValidation = validateEmailOrArray(cc, 'cc');
      if (!ccValidation.isValid) return ccValidation;
    }

    // Validate 'bcc' field if provided
    if (bcc !== undefined) {
      const bccValidation = validateEmailOrArray(bcc, 'bcc');
      if (!bccValidation.isValid) return bccValidation;
    }

    return { isValid: true };
  }
}

export default Mailblock;
export { EmailBuilder };
