const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir);
    }
  }

  info(message) {
    this.log('INFO', message);
  }

  error(message, error) {
    this.log('ERROR', `${message}: ${error.message}`);
    if (error.stack) {
      this.log('ERROR', error.stack);
    }
  }

  warn(message) {
    this.log('WARN', message);
  }

  debug(message) {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message);
    }
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}\n`;
    
    const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
    
    fs.appendFile(logFile, logMessage, (err) => {
      if (err) console.error('Failed to write log:', err);
    });
  }
}

module.exports = new Logger();