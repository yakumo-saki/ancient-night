import TwitterApi = require('../../shared/interfaces/TwitterApi');
import IpcData = require('../../shared/interfaces/IpcData');

import nedb = require('nedb');

class Datastores {
    users: any;
    tweets: any;
    favorites: any;
    accounts: any;
    tabGroupSettings: any;
}

/**
 * DBアクセス周り.
 * 基本promise
 */
class ANDatabase {
    
    private Datastore = require('nedb');
    private log = require('log4js').getLogger('ANDatabase');

    // 実質これにしか用事がない
    private db = new Datastores;
     
    constructor(appPath:string) {
        this.log.debug('db load =>' + appPath);
        this.db.users = new this.Datastore({filename: appPath + '/db_users', autoload: true});
        this.db.tweets = new this.Datastore({filename: appPath + '/db_tweets', autoload: true});
        this.db.favorites = new this.Datastore({filename: appPath + '/db_favorites', autoload: true});
        this.db.accounts = new this.Datastore({filename: appPath + '/db_accounts', autoload: true});
        this.db.tabGroupSettings = new this.Datastore({filename: appPath + '/db_tabGroupSettings', autoload: true});

        this.log.debug('db load done..');
    }

    addAccount(account:TwitterApi.UserInfo):Promise<IpcData.TabGroupSetting> {
        this.log.debug(JSON.stringify(account));
        this.db.accounts.insert(account, (err:any, newAccount:TwitterApi.UserInfo) => {
            this.log.debug('db addAccount done' + JSON.stringify(newAccount));            
        });
        
        // タブグループを作成
        var tg = new IpcData.TabGroupSetting();
        tg.name = account.screen_name;

        var tl = new IpcData.TabSetting();
        tl.name = "Home";
        tl.account_id = account.id_str;
        tl.type = TwitterApi.Type.Tweet;
        
        var mention = new IpcData.TabSetting();
        mention.name = "Mention";
        mention.account_id = account.id_str;
        mention.type = TwitterApi.Type.Mention;

        var dm = new IpcData.TabSetting();
        dm.name = "DM";
        dm.account_id = account.id_str;
        dm.type = TwitterApi.Type.DirectMessage;
        
        tg.tabs = new Array<IpcData.TabSetting>();
        tg.tabs.push(tl);
        tg.tabs.push(mention);
        tg.tabs.push(dm);

        return new Promise<IpcData.TabGroupSetting>((resolve, reject) => {
            this.db.tabGroupSettings.insert(tg, (err:any, newDoc:IpcData.TabGroupSetting) => {
                if (!err) {
                    resolve(newDoc);                    
                } else {
                    reject(err);
                }
            });
        });
       
    }

    /** アカウントの登録削除 */
    getAccounts(callback:any) {
        this.db.accounts.find({}, (err:any, docs:Array<TwitterApi.UserInfo>) => {
            this.log.debug('db getAccount done count =>' + docs.length);
            callback(docs);
        });
    }
    
    /**
     * アカウントの登録削除.
     * TODO: アカウントに紐付いたタブも消す 
     */
    deleteAccount(id_str:string):Promise<void> {
        this.log.debug('Delete account ' + id_str);
        return new Promise<any>((resolve:any, reject:any) => {
            this.db.accounts.delete({"id_str" : id_str } ,  {multi: false} ,(err:any, numRemoved:number) => {
                if (!err) {
                    resolve(numRemoved);
                } else {
                    reject(err);
                }
            });
        });
    }

    getTabGroups(callback:any) {
        this.db.tabGroupSettings.find({}, (err:any, docs:any) => {
            this.log.debug('db getTabGroups done count =>' + docs.length);
            callback(docs);
        });
    }

    /** キャッシュされているイベントを取得します. */
    getTweetCache():Promise<Array<TwitterApi.TwitterEvent>> {
        return new Promise<Array<TwitterApi.TwitterEvent>>((resolve, reject) => {
            this.db.tweets.find({})
                          .sort({id_str: -1})
                          .limit(2000)
                          .exec((err:any, doc:Array<TwitterApi.TwitterEvent>) => {
                if (!err) {
                    resolve(doc);
                } else {
                    reject(err);
                }
            });
        });
    }

    /** イベントをDBにキャッシュします. */
    putTweetCache(events:Array<TwitterApi.TwitterEvent>) {
        Promise.resolve().then(() => {
            this.deleteTweetCache(events);
        }).then((result) => {
            return this.insertTweetCache(events);
        }).catch((err) => {
            this.log.error(err);
        });
        
        this.db.tweets.count({}, (err, count) => {
            if (!err) {
                this.log.info('Tweet cache count = ' + count);
            }    
        });
    }
    
    private insertTweetCache(events:Array<TwitterApi.TwitterEvent>):Promise<void> {
        this.log.debug('Inserting event ' + events.length);
        return new Promise<void>((resolve, reject) => {
            this.db.tweets.insert(events, (err, newDoc) => {
                if (!err) {
                    resolve(newDoc);                    
                } else {
                    reject(err);
                }
            });
        });

    }

    private deleteTweetCache(events:Array<TwitterApi.TwitterEvent>):Promise<number> {
        this.log.debug('Deleting event ' + events.length);
        var ids = new Array();
        events.forEach( (ev) => { ids.push(ev.id_str) });
        this.db.tweets.persistence.compactDatafile();
        
        return new Promise<number>((resolve, reject) => {
            this.db.tweets.remove({ id_str : { $in: ids } }, {multi: true}, (err, numRemoved) => {
                if (!err) {
                    this.log.debug('Deleted event ' + numRemoved);
                    resolve(numRemoved);
                } else {
                    reject(err);
                }
            });
        });

    }

}
export = ANDatabase;