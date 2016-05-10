import CONST = require('../../shared/Global');
import IPC_EVENT = require('../../shared/Consts/IpcEvent');
import IPC_COMMAND = require('../../shared/Consts/IpcCommand');

import Logger = require('./Logger');
import MainViewModel = require('./MainViewModel');

/**
 * 最上位ビューモデル.
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

	/** タブグループ一覧. */
	groups: KnockoutObservableArray<any> = ko.observableArray([]);
	
	/** アクティブなタブグループ. */
	activeGroup: KnockoutObservable<any> = ko.observable(null);

	// data
	// ___________________________
	initialize = () => {
		this.log.debug('init');
		this.ipc.on(IPC_EVENT.NEED_ACCOUNT_REFRESH, () => { this.onNeedAccountRefresh() });
		// this.ipc.on(IPC_EVENT.GET_ACCOUNTS_RESULT, (event, arg) => { this.onGetAccountResult(arg) });
		this.ipc.on(IPC_EVENT.GET_TAB_GROUPS_RESULT, (event, arg) => { this.onGetTabGroupsResult(arg) });
		
		this.ipc.send(IPC_COMMAND.GET_ACCOUNTS);
		this.ipc.send(IPC_COMMAND.GET_TAB_GROUPS);
		
	}

	onNeedAccountRefresh() {
		this.ipc.send(IPC_COMMAND.GET_ACCOUNTS);			 
	}

	/** タブグループ情報を更新した際の処理 */
	onGetTabGroupsResult(tabGroups) {
		this.log.debug('onGetTabGroupsResult');
		// this.log.debug(JSON.stringify(accounts));

		this.groups.removeAll();
		tabGroups.forEach((grp) => { this.groups.push(grp)} );
		
		this.log.debug(this.groups().length + ' / ' + tabGroups.length);
		
		// TODO: 選択済みのアカウントと同じアカウントがあればそっち選択
		if (this.activeGroup() == null && this.groups().length > 0) {
			this.activeGroup(this.groups()[0]);
			this.onGroupSelected();
		}
		
		// this.accounts(accounts);
		// TODO データを破棄してしまうので、キャッシュから再度イベントを流して貰う
		this.initializing(true);
		this.activeViewModel().setInitializing(true);

		// 完了したら初期化中フラグを戻す
		this.ipc.once(IPC_EVENT.GET_INITIAL_COMPLETE, () => {
			this.initializing(false);
			this.activeViewModel().setInitializing(false);			
		});
		this.ipc.send(IPC_COMMAND.TAB_GET_INITIAL);
	}

	/** タブグループ情報を更新した際の処理 */
	onGroupSelected() {
		this.log.debug('onGroupSelected');
		
		if (this.activeViewModel() != null) {
			this.activeViewModel().beforeDestroy();
		}

		var mainViewModel = new MainViewModel(this.activeGroup());
		this.activeViewModel(mainViewModel);
	}

	refreshTimeline() {
		this.log.debug('refreshTimeline');
		this.activeViewModel().refreshTimeline();
	}

	getTimeline() {
		this.log.debug('getTimeline');
	}

}
export = RootViewModel;