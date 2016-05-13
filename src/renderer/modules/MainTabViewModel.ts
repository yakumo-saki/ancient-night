import Logger = require('./Logger');

import IPC_EVENT = require('../../shared/consts/IpcEvent');
import IPC_COMMAND = require('../../shared/consts/IpcCommand');

import TwitterApi = require('../../shared/interfaces/TwitterApi');
import IpcData = require('../../shared/interfaces/IpcData');

import * as _ from "lodash"; // 実際は lodashを scriptタグで読んでる

class TweetInternal extends TwitterApi.TwitterEvent {
	
	active: KnockoutObservable<boolean> = ko.observable(false);
	created_at: KnockoutObservable<Date> = ko.observable(null);
}

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
	
	tweets: KnockoutObservableArray<TweetInternal> = ko.observableArray([]);

	tabActive: KnockoutObservable<boolean> = ko.observable(false);
	
	autoRefresh: any = null;

	timeRefresh: any = null;

	constructor(public tabSetting:IpcData.TabSetting, private account) {
		this.log.debug('init id=>' + this.id);
		
		var listenParams = new IpcData.TabListenParams();
		listenParams.tabId = this.id;
		listenParams.tabSetting = this.tabSetting;
		this.ipc.send(IPC_COMMAND.TAB_LISTEN, listenParams);

		this.ipc.on(IPC_EVENT.GET_TAB_NEW_EVENT + this.id, (event, arg:Array<TwitterApi.TwitterEvent>) => { 
			arg.forEach((ev) => {
				this.newEvent(ev);
			});
		});

		this.timeRefresh = setInterval( () => {
			this.tweets().forEach((tw:any) => {
				tw.created_at.valueHasMutated(); 
			});
		 } , 5000);

	}

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
		// let ev = ko.mapping.fromJS(event);
		let ev:TweetInternal = <TweetInternal>event;
		ev.created_at = ko.observable(ev.data.created_at);
		ev.active = ko.observable(false);
		
		this.tweets.unshift(ev);
		
	}

	setSelectedTweet = (tweet:TweetInternal):void => { 
		var active = _.find(this.tweets(), (tw) => { return tw.active() })
		if (active != null) {
			 active.active(false) 
		}
		
		tweet.active(true);
	}

	/** タイムラインの自動更新を開始（リスタート）する. */
	startAutoRefresh() {
		this.log.info("start AutoRefresh " + this.id);
		if (this.tabSetting.type == TwitterApi.Type.Tweet) {
			this.autoRefresh = setInterval(() => { 
				this.log.debug('auto refresh(tweet) exec');
			    this.getTimeline() 
			}, 90000); // 15min limit 15
		} else if (this.tabSetting.type == TwitterApi.Type.Mention) {
			this.autoRefresh = setInterval(() => { 
				this.log.debug('auto refresh(Mention) exec');
				this.getTimeline() 
			}, 1450000); // 15min limit 15
		} else if (this.tabSetting.type == TwitterApi.Type.Mention) {
			this.autoRefresh = setInterval(() => {
				this.log.debug('auto refresh(Mention) exec');
				this.getTimeline() 
			}, 1450000); // 15min limit 15		
		}

	}

	/** タイムラインの自動更新を停止する. */
	stopAutoRefresh() {
		this.log.info("stop AutoRefresh " + this.id);
		clearInterval(this.autoRefresh);
	}

	beforeDestroy() {
		// 破棄する前に片付けなければいけないものを片付ける
		this.log.debug('destroy ' + this.id);
		
		this.ipc.send(IPC_COMMAND.TAB_NO_LISTEN, this.id);

		this.stopAutoRefresh()

		clearInterval(this.timeRefresh);
		this.ipc.removeAllListeners();
	}

}

export = MainTabViewModel;