import IPC_EVENT = require('../../shared/consts/IpcEvent');
import IPC_COMMAND = require('../../shared/consts/IpcCommand');

import Log = require('../../shared/interfaces/IpcData');

class Logger {
    
    ipc:Electron.IpcRenderer = require('electron').ipcRenderer;
    
    constructor(public appender:string) { }
    
    public debug(msg:any):void {
        console.debug(this.toLogString(msg));
        this.log(Log.LogLevel.DEBUG, this.toLogString(msg));        
    }

    public info(msg:any):void {
        console.info(this.toLogString(msg));
        this.log(Log.LogLevel.INFO, this.toLogString(msg));        
    }

    public warn(msg:any):void {
        console.warn(this.toLogString(msg));
        this.log(Log.LogLevel.WARN, this.toLogString(msg));        
    }

    public error(msg:any):void {
        console.error(this.toLogString(msg));
        this.log(Log.LogLevel.ERROR, this.toLogString(msg));        
    }
    
    private toLogString(msg:any):string {
        return this.appender + " " + msg.toString();
    }
    
    private log(level:Log.LogLevel, msg:string) {
        var p = new Log.LogParams();
        p.appender = this.appender;
        p.level = level;
        p.msg = msg;
        
        this.ipc.send(IPC_COMMAND.LOG, p);
    }
    
}

export = Logger;