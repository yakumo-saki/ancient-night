
var Twitter = require('twitter');

import Logger = require('./Logger');
import IPC_COMMAND = require('../../shared/Consts/IpcCommand');
import MainTabViewModel = require('./MainTabViewModel');

import IpcData = require('../../shared/interfaces/IpcData');

/**
 * メインのビューモデル.
 * タブの中身になるビューモデルを保持する。
 * このビューモデル＝アカウントではない（場合もある）
 */
class MainViewModel {

	private log = new Logger('MainViewModel');

	/** 初期化中フラグ. 初期化中は通知処理を行わない */
	initializing:KnockoutObservable<boolean> = ko.observable(true);

	// data(flag)
	// ___________________________
	/** Twitterアカウント情報 */
	account: KnockoutObservable<any> = ko.observable();
	
	tabs: KnockoutObservableArray<MainTabViewModel> = ko.observableArray([]);
	
	activeTab: KnockoutObservable<MainTabViewModel> = ko.observable(null);

	footerMessage: KnockoutObservable<string> = ko.observable("");

	// data
	// ___________________________
	
	constructor(tabGroup:IpcData.TabGroupSetting) {
		this.log.debug('init');
		this.account(tabGroup);
		console.log("TABS=>" + this.tabs);
		// TODO 設定できるようにする
		tabGroup.tabs.forEach((tab) => {
			this.tabs().push(new MainTabViewModel(tab, this.account));
		})
		this.switchTab( this.tabs()[0] );
		this.footerMessage('初期化した'); 
	}
	
	setInitializing(flag:boolean) {
		this.initializing(flag);
		this.tabs().forEach( (t) => { t.initializing(flag)});		
	}
	
	refreshTimeline():any {
		this.log.debug('refreshTimeline');
		// アクティブタブに転送するだけ
		this.activeTab().getTimeline();
	}

	switchTab = (target: MainTabViewModel) => {
			
		console.log('deactive');
		this.tabs().forEach((tab) => {
			tab.tabActive(tab.id == target.id);
			if (tab.tabActive()) {
				this.activeTab(tab);
			}
		} );

	}

	beforeDestroy() {
		// 破棄する前に片付けなければいけないものを片付ける
		this.tabs().forEach((tab) => { tab.beforeDestroy() });
		this.log.debug('destroy');
	}

}
export = MainViewModel;