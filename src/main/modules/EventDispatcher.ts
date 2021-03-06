import log4js = require('log4js');
import electron = require('electron');
var BrowserWindow:typeof electron.BrowserWindow = electron.BrowserWindow;
var app:Electron.App= electron.app;
var ipc:any = electron.ipcMain;

import IPC_EVENT = require('../../shared/consts/IpcEvent');
import IPC_COMMAND = require('../../shared/consts/IpcCommand');

import TwitterApi = require('../../shared/interfaces/TwitterApi');
import IpcData = require('../../shared/interfaces/IpcData');

import _  = require('lodash');

import events = require('events');

/**
 * Twitterイベントをpublishします.
 */ 
class EventDispatcher extends events.EventEmitter {

    public static EV_INCOMING_EVENT = 'EV_IMCOMING_EVENT';

    subscribers: Array<IpcData.TabListenParams> = new Array();

    queue: Array<TwitterApi.TwitterEvent> = new Array();
    
    log = log4js.getLogger('EventDispatcher');

    constructor(private mainWindow) {
      super();
      
      ipc.on(IPC_COMMAND.TAB_LISTEN, (event:any, arg:IpcData.TabListenParams) => {
        this.subscribe(arg);
      });
    }
    
    /** 
     * イベントをキューに追加します.
     */
    public pushEventFromRestApi(events:Array<TwitterApi.Tweet>, typeHint:TwitterApi.Type) {
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
                twEvent.account_id = ev.account_id;
                twEvent.data = ev;
                eventList.push(twEvent) 
            }
        })
        
        // Twitter応答をイベントに変換
        this.queue = this.queue.concat(eventList);
        this.log.debug('new Queue size = ' + this.queue.length);

        // キャッシュ用にイベント発行
        this.emit(EventDispatcher.EV_INCOMING_EVENT, eventList);
    }
    
    /** 
     * イベントをキューに追加します.
     * このメソッドでは、キャッシュからのイベントのみを受け付けます。
     */
    public pushEventFromCache(events:Array<TwitterApi.TwitterEvent>) {
        this.log.debug("FromCache count = " + events.length);
        
        Array.prototype.push.apply(this.queue, events);
        
    }

    /**
     * イベントを送信する.
     */
    public publish() {
       this.log.debug('publish Queue size = ' + this.queue.length + " subscribers = " + this.subscribers.length);
       
       // イベントを古い順に並び替えている。これはレンダラ側でツイート表示位置を適切な場所にする
       // コードを書くまでのつなぎである。
       let que = _.sortBy(this.queue, (ev) => { return ev.id_str } )
       this.queue.length = 0;
       
       let sendCount = 0;
       que.forEach( (item) => {
         // サブスクライバごとに送信するか決める
         this.subscribers.forEach((sub) => {
             //  this.log.debug("event type=" + item.type + " subscriber type=" + sub.tabSetting.type);
             // this.log.debug("event account=" + item.account_id + " subscriber account=" + sub.tabSetting.account_id);
             if (item.type == sub.tabSetting.type 
                 && (!sub.tabSetting.account_id || item.account_id == sub.tabSetting.account_id)) {
                 let id = IPC_EVENT.GET_TAB_NEW_EVENT + sub.tabId;
                //  this.log.debug("sending event to " + id);
                 this.mainWindow.webContents.send(IPC_EVENT.GET_TAB_NEW_EVENT + sub.tabId, item);
                 sendCount++;
             }
         })
       });
       this.log.debug('publish complete Queue size = ' + this.queue.length + " event sent = " + sendCount);
    }
    
    subscribe(arg:IpcData.TabListenParams) {
        this.subscribers.push(arg);
    }
    
    unsubscribe(arg:IpcData.TabListenParams) {
        _.remove(this.subscribers, function(param) { return param.tabId == arg.tabId });
    }
    
}
export = EventDispatcher;