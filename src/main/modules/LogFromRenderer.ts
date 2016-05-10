// レンダラからのログ受付
import log4js = require('log4js');
import electron = require('electron');
var BrowserWindow:typeof electron.BrowserWindow = electron.BrowserWindow;
var app:Electron.App= electron.app;
var ipc:any = electron.ipcMain;

import IpcData = require('../../shared/interfaces/IpcData');

import IPC_EVENT = require('../../shared/Consts/IpcEvent');
import IPC_COMMAND = require('../../shared/Consts/IpcCommand');

/**
 * レンダラプロセスからのログをLoggerに出力します.
 */
class LogFromRenderer {
    
    constructor() {
        app.on('ready', () => {
            ipc.on(IPC_COMMAND.LOG, (event:any, arg:any) => {
                this.logHandler(arg);
            });
        });
    }
    
    logHandler(param:IpcData.LogParams) {
        var appender = log4js.getLogger('Renderer:' + param.appender);
        
        if (param.level == IpcData.LogLevel.DEBUG) {
            appender.debug(param.msg);
        } else if (param.level == IpcData.LogLevel.INFO) {
            appender.info(param.msg);
        } else if (param.level == IpcData.LogLevel.WARN) {
            appender.warn(param.msg);
        } else {
            appender.error(param.msg);
        }
    }
}
export = LogFromRenderer;