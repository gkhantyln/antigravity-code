const winston = require('winston');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Redact sensitive information from logs
 */
const redactSecrets = winston.format(info => {
    const patterns = [
        { pattern: /sk-ant-[a-zA-Z0-9-_]{95}/g, replacement: 'sk-ant-***' },
        { pattern: /AIza[a-zA-Z0-9_-]{35}/g, replacement: 'AIza***' },
        { pattern: /sk-[a-zA-Z0-9]{48}/g, replacement: 'sk-***' },
        { pattern: /password["\s:=]+["']?[\w-]+/gi, replacement: 'password=***' },
        { pattern: /token["\s:=]+["']?[\w-]+/gi, replacement: 'token=***' },
    ];

    let message = info.message;
    patterns.forEach(({ pattern, replacement }) => {
        message = message.replace(pattern, replacement);
    });

    info.message = message;
    return info;
});

/**
 * Create logger instance
 */
function createLogger(options = {}) {
    const {
        logDir = path.join(os.homedir(), '.antigravity', 'logs'),
        logLevel = process.env.LOG_LEVEL || 'info',
        fileLogging = process.env.LOG_FILE_ENABLED !== 'false',
        consoleLogging = process.env.LOG_CONSOLE_ENABLED !== 'false',
    } = options;

    // Ensure log directory exists
    if (fileLogging && !fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const transports = [];

    // Console transport
    if (consoleLogging) {
        transports.push(
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.timestamp({ format: 'HH:mm:ss' }),
                    winston.format.printf(({ timestamp, level, message, ...meta }) => {
                        let msg = `${timestamp} [${level}]: ${message}`;
                        if (Object.keys(meta).length > 0) {
                            msg += ` ${JSON.stringify(meta)}`;
                        }
                        return msg;
                    })
                ),
            })
        );
    }

    // File transport
    if (fileLogging) {
        transports.push(
            new winston.transports.File({
                filename: path.join(logDir, 'error.log'),
                level: 'error',
                maxsize: 50 * 1024 * 1024, // 50MB
                maxFiles: 10,
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                ),
            }),
            new winston.transports.File({
                filename: path.join(logDir, 'combined.log'),
                maxsize: 50 * 1024 * 1024, // 50MB
                maxFiles: 10,
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                ),
            })
        );
    }

    const logger = winston.createLogger({
        level: logLevel,
        format: winston.format.combine(redactSecrets(), winston.format.errors({ stack: true })),
        transports,
        exitOnError: false,
    });

    return logger;
}

// Create default logger instance
const logger = createLogger();

module.exports = { createLogger, logger };
