import TwitterApi = require('../../shared/interfaces/TwitterApi');
import TabSetting = require('../../shared/interfaces/TabSetting');
import TabGroupSetting = require('../../shared/interfaces/TabGroupSetting');

/**
 * DBアクセス周り.
 * 基本promise
 */
class ANDatabase {
    
    private Datastore = require('nedb');
    private log = require('log4js').getLogger('ANDatabase');

    // 実質これにしか用事がない
    private db = {users: null, tweets: null, favorites: null, accounts: null, tabGroupSettings:null};
     
    constructor(appPath:string) {
        this.log.debug('db load =>' + appPath);
        this.db.users = new this.Datastore({filename: appPath + '/db_users', autoload: true});
        this.db.tweets = new this.Datastore({filename: appPath + '/db_tweets', autoload: true});
        this.db.favorites = new this.Datastore({filename: appPath + '/db_favorites', autoload: true});
        this.db.accounts = new this.Datastore({filename: appPath + '/db_accounts', autoload: true});
        this.db.tabGroupSettings = new this.Datastore({filename: appPath + '/db_tabGroupSettings', autoload: true});

        this.log.debug('db load done..');
    }

    addAccount(account:any):Promise<TabGroupSetting> {
        this.log.debug(JSON.stringify(account));
        this.db.accounts.insert({account});
        this.log.debug('db addAccount done' + JSON.stringify(account));
        
        // タブグループを作成
        var tg = new TabGroupSetting();
        tg.name = account.screen_name;

        var tl = new TabSetting();
        tl.name = "Home";
        tl.account_id = account.id;
        tl.type = TwitterApi.Type.Tweet;
        
        var mention = new TabSetting();
        mention.name = "Mention";
        mention.account_id = account.id;
        mention.type = TwitterApi.Type.Mention;

        var dm = new TabSetting();
        dm.name = "DM";
        dm.account_id = account.id;
        dm.type = TwitterApi.Type.DirectMessage;
        
        tg.tabs = new Array<TabSetting>();
        tg.tabs.push(tl);
        tg.tabs.push(mention);
        tg.tabs.push(dm);

        return new Promise<TabGroupSetting>((resolve, reject) => {
            this.db.tabGroupSettings.insert(tg, (err, newDoc) => {
                if (!err) {
                    resolve(newDoc);                    
                } else {
                    reject(err);
                }
            });
        });
       
    }

    getAccounts(callback:any) {
        this.db.accounts.find({}, (err:any, docs:any) => {
            this.log.debug('db getAccount done count =>' + docs.length);
            callback(docs);
        });
    }

    getTabGroups(callback) {
        this.db.tabGroupSettings.find({}, (err:any, docs:any) => {
            this.log.debug('db getTabGroups done count =>' + docs.length);
            callback(docs);
        });
    }
    
    testInsert() {
        
    }

    test() {
        // insert
        this.db.users.insert({name: 'hoge'});
        this.db.users.insert({name: 'fuga'}); 
        this.db.users.insert({name: 'uga'});
        
        this.db.users.insert([
            {name: 'foo'},
            {name: 'bar', _id: 1234}
        ], (err:any, newDoc:any) => {
            console.log("this is " + this.toString() );
            this.log.debug("[INSERT]");
            this.log.debug(newDoc);
        }); 

        // find
        this.db.users.find({name: 'fuga'},
        (err:any, docs:any) => {
            this.log.debug("[FIND]");
            this.log.debug(docs);
        });
        this.db.users.find({name: /f*uga/},
            (err:any, docs:any) => {
                this.log.debug("[FIND F*]");
                this.log.debug(docs);
        });

        // remove
        this.db.users.remove(
            {name: 'fuga'},
            {multi: true},
            (err:any, numRemoved: number) => {
                this.log.debug("[REMOVE]");
                this.log.debug(numRemoved);
        });
        this.db.users.remove(
            {name: 'uga'},
            {multi: true},
            (err:any, numRemoved: number) => {
            this.log.debug("[REMOVE]");
            this.log.debug(numRemoved);
        });

    }
}
export = ANDatabase;