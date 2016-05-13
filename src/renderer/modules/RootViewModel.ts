import CONST = require('../../shared/Global');
import IPC_EVENT = require('../../shared/consts/IpcEvent');
import IPC_COMMAND = require('../../shared/consts/IpcCommand');
import IpcData = require('../../shared/interfaces/IpcData');

import Logger = require('./Logger');
import MainViewModel = require('./MainViewModel');

/**
 * 最上位ビューモデル.
 * Twitterアカウントと、タブグループを束ねている。
 */
class RootViewModel {

	private log = new Logger('RootViewModel');

	appName: KnockoutObservable<string> = ko.observable(CONST.APP_NAME);

	ipc:Electron.IpcRenderer = require('electron').ipcRenderer;

	/** 初期化中フラグ. 初期化中は通知処理を行わない */
	initializing:KnockoutObservable<boolean> = ko.observable(false);

	/** ビューモデル。タブ一覧等を持つ。アカウントごとに１個. */
	// viewModels: KnockoutObservableArray<MainViewModel> = ko.observableArray([]);
	
	/** アクティブなアカウントのビューモデル。タブ一覧等を持つ */
	activeViewModel: KnockoutObservable<MainViewModel> = ko.observable(null);

	/** タブグループごとのビューモデル */
	viewModels: KnockoutObservableArray<MainViewModel> = ko.observableArray([]);
	
	/** アカウント一覧. */
	accounts: KnockoutObservableArray<IpcData.UserInfo> = ko.observableArray([]);
	
	/** アクティブなアカウント. */
	activeAccount: KnockoutObservable<IpcData.UserInfo> = ko.observable(null);

	/** タブグループ一覧. */
	groups: KnockoutObservableArray<IpcData.TabGroupSetting> = ko.observableArray([]);
	
	/** アクティブなタブグループ. */
	activeGroup: KnockoutObservable<IpcData.TabGroupSetting> = ko.observable(null);

	newTweet: KnockoutObservable<string> = ko.observable(null);

	autoRefresh: KnockoutObservable<boolean> = ko.observable(false);	

	// data
	// ___________________________
	initialize = () => {
		this.log.debug('init');
		this.ipc.on(IPC_EVENT.NEED_ACCOUNT_REFRESH, () => { this.onNeedAccountRefresh() });
		this.ipc.on(IPC_EVENT.GET_ACCOUNTS_RESULT, (event, arg) => { this.onGetAccountResult(arg) });
		this.ipc.on(IPC_EVENT.GET_TAB_GROUPS_RESULT, (event, arg) => { this.onGetTabGroupsResult(arg) });
		
		this.ipc.send(IPC_COMMAND.GET_ACCOUNTS);
		this.ipc.send(IPC_COMMAND.GET_TAB_GROUPS);
		
	}

	onNeedAccountRefresh() {
		this.ipc.send(IPC_COMMAND.GET_ACCOUNTS);
		this.ipc.send(IPC_COMMAND.GET_TAB_GROUPS);
	}

	/** アカウント情報を更新した際の処理 */
	onGetAccountResult(accounts:Array<IpcData.UserInfo>) {
		this.accounts.removeAll();
		Array.prototype.push.apply(this.accounts(), accounts);
		
		// if (this.accounts().length > 0) {
		// 	this.activeAccount(this.accounts()[0]);
		// } else {
		// 	this.log.warn('no account has been set up');
		// }
		
		// TODO 以前選択していたものがあればそちらを選択
	}

	/** タブグループ情報を更新した際の処理 */
	onGetTabGroupsResult(tabGroups:Array<IpcData.TabGroupSetting>) {
		this.log.debug('onGetTabGroupsResult');
		// this.log.debug(JSON.stringify(accounts));

		// ビューモデルを破棄する
		this.viewModels().forEach((vm) => {
			vm.beforeDestroy();
		});
		this.viewModels.removeAll();

		this.groups.removeAll();
		
		// タブグループリストの生成と、MainViewModelインスタンス化
		tabGroups.forEach((grp) => {
			this.groups.push(grp);
			
			var mainViewModel = new MainViewModel(grp);
			this.viewModels.push(mainViewModel);
		});
		
		this.log.debug(this.groups().length + ' / ' + tabGroups.length);
		
		// TODO: 選択済みのアカウントと同じアカウントがあればそっち選択
		if (this.activeGroup() == null && this.groups().length > 0) {
			this.activeGroup(this.groups()[0]);
			this.onGroupSelected();
		}

		this.initializing(true);
		this.viewModels().forEach( (vm) => {
			vm.setInitializing(true);
		});

		// データを破棄してしまうので、キャッシュから再度イベントを流して貰う
		// 完了したら初期化中フラグを戻す
		this.ipc.once(IPC_EVENT.GET_INITIAL_COMPLETE, () => {
			this.initializing(false);
			this.viewModels().forEach( (vm) => {
				vm.setInitializing(false);
			});
		});
		this.ipc.send(IPC_COMMAND.TAB_GET_INITIAL);
	}

	/** タブグループ情報を更新した際の処理 */
	onGroupSelected = () => {
		this.log.debug('onGroupSelected');
		
		var idx = this.groups().indexOf(this.activeGroup());
		this.log.debug("idx=" + idx);
		this.activeViewModel(this.viewModels()[idx]);
	}

	refreshTimeline() {
		this.log.debug('refreshTimeline');
		this.activeViewModel().refreshTimeline();
	}

	sendTweet = () => {
		this.log.info('sendTweet' + this.newTweet());
		if (!this.activeAccount()) { throw new Error("no account selected") }
		
		var params = new IpcData.NewTweetParams();
		params.account_id = this.activeAccount().id_str;
		params.text = this.newTweet();
		
		this.ipc.send(IPC_COMMAND.NEW_TWEET, params);
		
		// TODO 結果を見て失敗したらリトライする
		
		this.newTweet("");
	}

	startAutoRefresh() {
		this.viewModels().forEach( (vm) => { vm.startAutoRefresh(); });
		this.autoRefresh(true);
	}

	stopAutoRefresh() {
		this.viewModels().forEach( (vm) => { vm.stopAutoRefresh(); });
		this.autoRefresh(false);
	}

	beforeDestroy() {
		// ビューモデルを破棄する
		this.viewModels().forEach((vm) => {
			vm.beforeDestroy();
		});
		this.ipc.removeAllListeners();
	}

}
export = RootViewModel;