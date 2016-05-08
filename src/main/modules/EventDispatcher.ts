import log4js = require('log4js');
import electron = require('electron');
var BrowserWindow:typeof electron.BrowserWindow = electron.BrowserWindow;
var app:Electron.App= electron.app;
var ipc:any = electron.ipcMain;

import IPC_EVENT = require('../../shared/Consts/IpcEvent');
import IPC_COMMAND = require('../../shared/Consts/IpcCommand');

import TwitterApi = require('../../shared/interfaces/TwitterApi');
import TabListenParams = require('../../shared/interfaces/TabListenParams');
import _  = require('lodash');

import events = require('events');

/**
 * Twitterイベントをpublishします.
 */ 
class EventDispatcher extends events.EventEmitter {

    public static EV_INCOMING_EVENT = 'EV_IMCOMING_EVENT';

    subscribers: Array<TabListenParams> = new Array();

    queue: Array<TwitterApi.TwitterEvent> = new Array();
    
    log = log4js.getLogger('EventDispatcher');

    constructor(private mainWindow) {
      super();
      
      ipc.on(IPC_COMMAND.TAB_LISTEN, (event:any, arg:TabListenParams) => {
        this.subscribe(arg);
      });
    }
    
    public pushEvent(events:Array<any>, typeHint:TwitterApi.Type) {
        this.log.debug('new Event size = ' + events.length);
        
        let T = TwitterApi.Type
        let eventList = new Array<TwitterApi.TwitterEvent>();        
        
        // Eventに変換
        events.forEach((ev) =>{
            let twEvent = new TwitterApi.TwitterEvent();
            if (typeHint == null) {
                this.log.error('Unknown Event event => ' + JSON.stringify(ev));
                twEvent = null;
            }
            
            if (twEvent) {
                twEvent.type = typeHint;
                twEvent.id_str = ev.id_str;
                twEvent.data = ev;
                eventList.push(twEvent) 
            }
        })
        
        // Twitter応答をイベントに変換
        this.queue = this.queue.concat(eventList);
        this.log.debug('new Queue size = ' + this.queue.length);

        // キャッシュ用にイベント発行
        this.emit(EventDispatcher.EV_INCOMING_EVENT, events);
    }
    
    /**
     * イベントを送信する.
     */
    public publish() {
       this.log.debug('publish Queue size = ' + this.queue.length + " subscribers = " + this.subscribers.length);
       this.queue.forEach( (item) => {
         // サブスクライバごとに送信するか決める
         this.subscribers.forEach((sub) => {
            //  this.log.debug("event type=" + item.type + " subscriber type=" + sub.tabSetting.type);
             if (item.type == sub.tabSetting.type) {
                 let id = IPC_EVENT.GET_TAB_NEW_EVENT + sub.tabId;
                //  this.log.debug("sending event to " + id);
                 this.mainWindow.webContents.send(IPC_EVENT.GET_TAB_NEW_EVENT + sub.tabId, item);
             }
         })
       });
       this.queue.length = 0;
       this.log.debug('publish complete Queue size = ' + this.queue.length);
    }
    
    subscribe(arg:TabListenParams) {
        this.subscribers.push(arg);
    }
    
    unsubscribe(arg:TabListenParams) {
        _.remove(this.subscribers, function(param) { return param.tabId == arg.tabId });
    }
    
}
export = EventDispatcher;