import Logger = require('./Logger');

import IPC_EVENT = require('../../shared/Consts/IpcEvent');
import IPC_COMMAND = require('../../shared/Consts/IpcCommand');
import TabSetting = require('../../shared/interfaces/TabSetting');
import TabListenParams = require('../../shared/interfaces/TabListenParams');
import TabGetNewParams = require('../../shared/interfaces/TabGetNewParams');
import TwitterApi = require('../../shared/interfaces/TwitterApi');

import * as _ from "lodash"; // 実際は lodashを scriptタグで読んでる

class MainTabViewModel {

	log = new Logger('MainTabViewModel');
	
	private uuid = require('uuid');
	
	private ipc:Electron.IpcRenderer = require('electron').ipcRenderer;

	// data(flag)
	// ___________________________
	/** タブのID */
	id:string = this.uuid.v4().substring(0,8); // 衝突したら桁数増やす
	
	tweets: KnockoutObservableArray<TwitterApi.TwitterEvent> = ko.observableArray([]);

	tabActive: KnockoutObservable<boolean> = ko.observable(false);

	constructor(public tabSetting:TabSetting) {
		this.log.debug('init id=>' + this.id);
		
		var listenParams = new TabListenParams();
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
		var getParams = new TabGetNewParams();
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