export class LogParams {
    level: LogLevel
    msg: string
    appender: string
}

export enum LogLevel {
    DEBUG, INFO, WARN, ERROR
}