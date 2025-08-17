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

      this._log('info', `Email ${scheduledAt ? 'scheduled' : 'sent'} successfully`, { 
        requestId, 
        duration: `${duration}ms`,
        emailId: result.id 
      });

      return {
        success: true,
        data: result,
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
