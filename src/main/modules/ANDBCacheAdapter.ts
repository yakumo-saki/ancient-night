import log4js = require('log4js');
import electron = require('electron');
var BrowserWindow:typeof electron.BrowserWindow = electron.BrowserWindow;
var app:Electron.App= electron.app;
var ipc:any = electron.ipcMain;

import EventDispatcher = require('./EventDispatcher');
import ANDatabase = require('./ANDatabase');

/**
 * EventDispatcherからイベントを受信して、DBにキャッシュする.
 */
class ANDBCacheAdapter {
    
    private log = log4js.getLogger('ANDBCacher');
    
    constructor(dispatcher:EventDispatcher, private db:ANDatabase) {
        dispatcher.on(EventDispatcher.EV_INCOMING_EVENT, (events:Array<any>) => {
            this.log.debug('Incoming event ' + events.length);
            
            this.db.TweetCache(events);
        })
    }

}
export = ANDBCacheAdapter;