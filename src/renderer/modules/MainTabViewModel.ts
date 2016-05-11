import Logger = require('./Logger');

import IPC_EVENT = require('../../shared/consts/IpcEvent');
import IPC_COMMAND = require('../../shared/consts/IpcCommand');

import TwitterApi = require('../../shared/interfaces/TwitterApi');
import IpcData = require('../../shared/interfaces/IpcData');

import * as _ from "lodash"; // 実際は lodashを scriptタグで読んでる

class MainTabViewModel {

	private log = new Logger('MainTabViewModel');
	
	private uuid = require('uuid');
	
	private ipc:Electron.IpcRenderer = require('electron').ipcRenderer;

	/** 初期化中フラグ. 初期化中は通知処理を行わない */
	public initializing:KnockoutObservable<boolean> = ko.observable(true);

	// data(flag)
	// ___________________________
	/** タブのID */
	id:string = this.uuid.v4().substring(0,8); // 衝突したら桁数増やす
	
	tweets: KnockoutObservableArray<TwitterApi.TwitterEvent> = ko.observableArray([]);

	tabActive: KnockoutObservable<boolean> = ko.observable(false);

	constructor(public tabSetting:IpcData.TabSetting, private account) {
		this.log.debug('init id=>' + this.id);
		
		var listenParams = new IpcData.TabListenParams();
		listenParams.tabId = this.id;
		listenParams.tabSetting = this.tabSetting;
		this.ipc.send(IPC_COMMAND.TAB_LISTEN, listenParams);

		this.ipc.on(IPC_EVENT.GET_TAB_NEW_EVENT + this.id, (event, arg) => { this.newEvent(arg); });

	}
	
	// data
	// ___________________________
	getTimeline():void {
		
		var maxIdTweet = _.maxBy(this.tweets(), (tw) => { return tw.id_str});
		var maxId = (maxIdTweet == undefined ? null: maxIdTweet.id_str);
		
		this.log.debug('getTimeline id=>' + this.id + " minId = " + maxId);
		var getParams = new IpcData.TabGetNewParams();
		getParams.tabId = this.id;
		getParams.tabSetting = this.tabSetting;
		getParams.minId = maxId;
		this.ipc.send(IPC_COMMAND.TAB_GET_NEW, getParams);
	}

	refreshTimeline(num) { 
		var valueArray = new Array();
	}
	
	newEvent(event:TwitterApi.TwitterEvent) {
		// console.log(event);
		let ev = <TwitterApi.TwitterEvent> event; 
		
		this.tweets.unshift(ev);
	}

	// /**
	//  * 表示中のツイートからID指定でツイートを取得する.
	//  */
	// getTweetById = (id:string):any => {
	// 	for (var i = 0; i < this.tweets().length; i++) {
	// 		var tw = this.tweets()[i];
	// 		if (tw === null) {
	// 			continue;
	// 		} else if (tw.id_str == id) {
	// 			return tw;
	// 		}
	// 	}
	// 	return null;
	// }

	beforeDestroy() {
		// 破棄する前に片付けなければいけないものを片付ける
		this.log.debug('destroy');
	}

}

export = MainTabViewModel;