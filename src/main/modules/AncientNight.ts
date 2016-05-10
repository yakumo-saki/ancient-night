import log4js = require('log4js');
import electron = require('electron');
var BrowserWindow:typeof electron.BrowserWindow = electron.BrowserWindow;
var app:Electron.App= electron.app;
var ipc:any = electron.ipcMain;

import CONST = require('../../shared/Global');
import IPC_EVENT = require('../../shared/Consts/IpcEvent');
import IPC_COMMAND = require('../../shared/Consts/IpcCommand');
import GlobalSecret = require('../../shared/GlobalSecret');

import IpcData = require('../../shared/interfaces/IpcData');

import EventDispatcher = require('./EventDispatcher');
import ANDatabase = require('./ANDatabase');
import TwitterClient = require('./TwitterClient');
import ANDBCacheAdapter = require('./ANDBCacheAdapter');
import TwitterApi = require('../../shared/interfaces/TwitterApi');

import _  = require('lodash');

/**
 * 本体.
 */
class AncientNight {

  private BASE_DIR = __dirname + '/../../view/'; // このモジュールから Viewへのパス

  private mainWindow:Electron.BrowserWindow = null;
  private prefWindow:Electron.BrowserWindow = null;
  
  private accounts:{ [key:number]: any} = {};

  private twitterClients:{ [key:number]: TwitterClient} = {};
  
  private log = log4js.getLogger('AncientNight');

  private eventDispatcher:EventDispatcher = null;
  
  private cacheAdapter:ANDBCacheAdapter = null;
  
  private DB = new ANDatabase(app.getPath('userData'));
 
  constructor () {
    // すべてのウィンドウが閉じられた際の動作
    app.on('window-all-closed', function() {
      // OS X では、ウィンドウを閉じても一般的にアプリ終了はしないので除外。
      if (process.platform != 'darwin') {
        app.quit();
      }
    });
    
    app.on('ready', this.onReady);
    
  }

  /**
   * app.ready のハンドラ.
   */
  onReady = () => {
    this.installMenu(); // this.installMenuと呼ぶとエラーになる

    this.mainWindow = new BrowserWindow({
        width: 550
        , height: 600
        , minWidth: 500
        , minHeight: 200
        , acceptFirstMouse: true
        , titleBarStyle: 'hidden'
    });
    var uri = 'file://' + this.BASE_DIR + 'main.html';
    this.mainWindow.loadURL(uri);
    // this.log.debug('main window loaded ' + uri);

    this.prefWindow = new BrowserWindow({
        width: 800
        , height: 400
        , minWidth: 500
        , minHeight: 200
        , acceptFirstMouse: true
        , titleBarStyle: 'hidden'
      , 'show': false
    });
    this.prefWindow.loadURL('file://' + this.BASE_DIR + 'pref.html');

    // ウィンドウが閉じられたら、ウィンドウへの参照を破棄する。
    this.mainWindow.on('closed', function() {
      this.mainWindow = null;
    });

    // イベントディスパッチャとキャッシュ準備
    this.eventDispatcher = new EventDispatcher(this.mainWindow);
    this.cacheAdapter = new ANDBCacheAdapter(this.eventDispatcher, this.DB);

    // IPC通信
    ipc.on(IPC_COMMAND.GET_ACCOUNTS, (event:any, arg:any) => {
        this.refreshAccount(true);
    });
    ipc.on(IPC_COMMAND.GET_TAB_GROUPS, (event:any, arg:any) => {
        this.refreshTabGroups();
    });
    ipc.on(IPC_COMMAND.TAB_GET_NEW, (event:any, arg:IpcData.TabGetNewParams) => {
        this.refreshTimeline(arg);
    });
    ipc.on(IPC_COMMAND.TAB_GET_INITIAL, (event:any, arg:IpcData.TabGetNewParams) => {
        this.getInitialTimeline();
    });
		ipc.on(IPC_COMMAND.NEW_TWEET, (event:any, arg:IpcData.NewTweetParams) => {
        this.sendNewTweet(arg);
    });

  }

  /**
   * アカウント情報の再取得.
   * TwitterClientはアカウント情報に依存するので作り直し
   */
  refreshAccount(sendToRenderer:boolean) {
    this.DB.getAccounts((docs:Array<TwitterApi.UserInfo>) => {
      this.log.debug('refreshAccount: Account count => ' + docs.length);
      
      // EventEmitterを停止させる
      _.values<TwitterClient>(this.twitterClients).forEach((client) => {
        client.dispose();
      });
                
      // 内部のアカウント情報を更新
      this.accounts = new Object();
      docs.forEach( (doc) => {
        let account = doc;
        this.accounts[account.id_str] = account;
        this.twitterClients[account.id_str] = new TwitterClient(account.accessToken, account.accessSecret);
        this.log.debug("append " + account.id_str);       
      })

      // イベントハンドラ仕掛ける
      _.values<TwitterClient>(this.twitterClients).forEach((client) => {        
        client.on('result' + TwitterApi.Type.Tweet.toString(), (tweets:Array<any>) => {
          this.log.debug("Tweets " + tweets.length);
          this.eventDispatcher.pushEvent(tweets, TwitterApi.Type.Tweet);
          this.eventDispatcher.publish();
        });
        client.on('result' + TwitterApi.Type.Mention.toString(), (tweets:Array<any>) => {
          this.log.debug("Mentions " + tweets.length);
          this.eventDispatcher.pushEvent(tweets, TwitterApi.Type.Mention);
          this.eventDispatcher.publish();
        });
        client.on('result' + TwitterApi.Type.DirectMessage.toString(), (tweets:Array<any>) => {
          this.log.debug("DirectMessage " + tweets.length);
          this.eventDispatcher.pushEvent(tweets, TwitterApi.Type.DirectMessage);
          this.eventDispatcher.publish();
        });
      })      

      if (sendToRenderer) {
        this.mainWindow.webContents.send(IPC_EVENT.GET_ACCOUNTS_RESULT, docs);
      }
    });
  }

  refreshTabGroups() {
    this.DB.getTabGroups((docs) => {
      this.log.debug('refreshTabGroups: TabGroup count => ' + docs.length);
      this.mainWindow.webContents.send(IPC_EVENT.GET_TAB_GROUPS_RESULT, docs);
    });
  }
  
  refreshTimeline(arg:IpcData.TabGetNewParams) {
      let client = this.twitterClients[arg.tabSetting.account_id];
      if (client == null) throw new Error("client is null id=" + arg.tabSetting.account_id);

      var method = null;      
      if (arg.tabSetting.type == TwitterApi.Type.Tweet) {
        client.getTimeline(100, arg.minId);
      } else if (arg.tabSetting.type == TwitterApi.Type.Mention) {
        client.getMention(100, arg.minId);
      } else if (arg.tabSetting.type == TwitterApi.Type.DirectMessage) {
        client.getDirectMessage(100, arg.minId); 
      }     
  }
  
  /**
   * キャッシュからイベントを発行しなおします.
   */
  getInitialTimeline() {
    Promise.resolve().then(() => {
      return this.DB.getTweetCache();
    }).then((result) => {
      this.eventDispatcher.pushEventFromCache(result);
      this.eventDispatcher.publish();

      this.mainWindow.webContents.send(IPC_EVENT.GET_INITIAL_COMPLETE);
      return Promise.resolve();
    }).catch((err) => {
      this.log.error(err);
    });
  }
  
  sendNewTweet(tweet:IpcData.NewTweetParams) {
    this.log.debug(JSON.stringify(tweet));
    var client:TwitterClient = this.twitterClients[tweet.account_id];
    if (!client) { throw new Error("Invalid Account")}
    
    client.sendNewTweet(tweet.text);
    
    // TODO エラー処理
    
  }
  
  /** 
   * メニューバーアイテムを追加.
   **/
  installMenu = () => {
    
    var Menu = require('menu');
    if(process.platform == 'darwin') {
      var menu = Menu.buildFromTemplate([
        {
          label: CONST.APP_NAME,
          submenu: [
            {
              label: 'Preferences',
              accelerator: '',
              click: function() { this.prefWindow.show(); }
            },
        {
              label: 'Quit',
              accelerator: 'Command+Q',
              click: function() { app.quit(); }
            },
          ]
        },
        {
          label: '編集',
          submenu: [
            {
              label: 'Undo',
              accelerator: 'Command+Z',
              selector: 'undo:'
            },
            {
              label: 'Redo',
              accelerator: 'Shift+Command+Z',
              selector: 'redo:'
            },
            {
              type: 'separator'
            },
            {
              label: 'Cut',
              accelerator: 'Command+X',
              selector: 'cut:'
            },
            {
              label: 'Copy',
              accelerator: 'Command+C',
              selector: 'copy:'
            },
            {
              label: 'Paste',
              accelerator: 'Command+V',
              selector: 'paste:'
            },
            {
              label: 'Select All',
              accelerator: 'Command+A',
              selector: 'selectAll:'
            },
          ]
        },
        {
          label: 'アカウント',
          submenu: [
            {
              label: '追加',
              click: () => {
                this.oauth();
              }
            },
            {
              label: 'リフレッシュ',
              click: () => {
                this.refreshAccount(true);
              }
            },
            {
              label: 'list'
            }
          ]
        },
        {
          label: 'ビュー',
          submenu: [
            {
              label: 'Reload',
              accelerator: 'Command+R',
              click: () => { this.mainWindow.reload(); }
            },
            {
              label: 'Toggle Full Screen',
              accelerator: 'Ctrl+Command+F',
              click: () => { this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen()); }
            },
            {
              label: 'Toggle Developer Tools',
              accelerator: 'Alt+Command+I',
              click: () => {
                  this.mainWindow.webContents.toggleDevTools() 
              }
            },
          ]
        }
      ]);
      Menu.setApplicationMenu(menu);
  } else {
      var menu = Menu.buildFromTemplate([
      {
            label: '&File',
            submenu: [
              {
                label: 'Preferences',
                accelerator: '',
                click: () => { this.prefWindow.show(); }
              },
          {
                label: 'Quit',
                accelerator: 'Command+Q',
                click: () => { app.quit(); }
              },
            ]
          },
        {
          label: '&View',
          submenu: [
            {
              label: '&Reload',
              accelerator: 'Ctrl+R',
              click: () => { this.mainWindow.reload(); }
            },
            {
              label: 'Toggle &Full Screen',
              accelerator: 'F11',
              click: () => { this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen()); }
            },
            {
              label: 'Toggle &Developer Tools',
              accelerator: 'Alt+Ctrl+I',
              click: () => { this.mainWindow.webContents.toggleDevTools(); }
            },
          ]
        }
      ]);

      this.mainWindow.setMenu(menu);
      
      }
    }

    oauth = () => {
      var BrowserWindow = require('browser-window');
      var twitterAPI = require('node-twitter-api');

      var twitter = new twitterAPI({
        consumerKey    : GlobalSecret.CONSUMER_KEY,
        consumerSecret : GlobalSecret.CONSUMER_SECRET,
        callback       :  'http://www.example.com/' // 別にどこでもよい
      });

      twitter.getRequestToken( (error:any, requestToken:any, requestTokenSecret:any, results:any) => {
        if (error) {
          this.log.debug("error getting oauth request token ");
          this.log.debug(error);
        }
        var url = twitter.getAuthUrl(requestToken);
        var loginWindow:Electron.BrowserWindow = new BrowserWindow({width: 800, height: 600, 'node-integration': false });
  
        loginWindow.webContents.session.clearStorageData({ storages: ["cookies"] }, () => {});
 
        // URL遷移のイベントで認証完了タイミングを取得
        loginWindow.webContents.on('will-navigate', (event:any, url:string) => {
          // https://www.google.co.jp/?oauth_token=...&oauth_verifier=...のようなURLが渡ってくる.
          
          var matched:any;
          if(matched = url.match(/\?oauth_token=([^&]*)&oauth_verifier=([^&]*)/)) {
            twitter.getAccessToken(requestToken, requestTokenSecret, matched[2], (error:any, accessToken:string, accessTokenSecret:string) => {
              this.log.debug('accessToken', accessToken);
              this.log.debug('accessTokenSecret', accessTokenSecret);
              
              twitter.verifyCredentials(accessToken, accessTokenSecret, {skip_status: true}, (error:any, data:TwitterApi.UserInfo, response:any) => {
                // verified.
                this.log.debug("screenName:" + data.screen_name);
                data._id = data.id_str;
                data.accessToken = accessToken;
                data.accessSecret = accessTokenSecret;
                this.DB.addAccount(data);
                
                // TODO: send account add message
                this.mainWindow.webContents.send(IPC_EVENT.NEED_ACCOUNT_REFRESH);
              });
              
            });

            event.preventDefault();
            setTimeout( () => { loginWindow.close(); loginWindow.destroy(); loginWindow == null }, 0);

          } else {
            this.log.debug('Account add failure ' + url);
            return;
          }
          
        });
        this.log.debug('URL ' + url);
        loginWindow.loadURL(url);
      });
    }
}
export = AncientNight;