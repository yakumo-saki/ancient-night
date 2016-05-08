import IPC_EVENT = require('../../shared/consts/IpcEvent');
import IPC_COMMAND = require('../../shared/consts/IpcCommand');

import Log = require('../../shared/interfaces/Log');

class Logger {
    
    ipc:Electron.IpcRenderer = require('electron').ipcRenderer;
    
    constructor(public appender:string) { }
    
    public debug(msg:string):void {
        this.log(Log.LogLevel.DEBUG, msg.toString());        
    }

    public info(msg:string):void {
        this.log(Log.LogLevel.INFO, msg.toString());        
    }

    public warn(msg:string):void {
        this.log(Log.LogLevel.WARN, msg.toString());        
    }

    public error(msg:string):void {
        this.log(Log.LogLevel.ERROR, msg.toString());        
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