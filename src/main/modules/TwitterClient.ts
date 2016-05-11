/// <reference path="../typings/bundle.d.ts" />

import events = require('events');

var Tw = require('twitter');

import Global = require('../../shared/Global');
import GlobalSecret = require('../../shared/GlobalSecret');
import IPC_EVENT = require('../../shared/consts/IpcEvent');
import IPC_COMMAND = require('../../shared/consts/IpcCommand');

import TwitterApi = require('../../shared/interfaces/TwitterApi');

/**
 * Twitterとのやりとりをするクラス.
 * いずれはStreamに接続してイベントを発行しまくる予定なのでEventEmitter実装
 */
class TwitterClient extends events.EventEmitter {
       
    private log4js = require('log4js');
    private log = require('log4js').getLogger('TwitterClient');

    private Twitter:any = null;

    constructor (access_key:string, access_secret:string) {
       super();
       
       if (access_key == null)    throw "ERROR: accessKey is null";
       if (access_secret == null) throw "ERROR: accessSecret is null";
       
       this.log.debug("initialize with " + access_key + " " + access_secret);       
       this.Twitter = new Tw({
            consumer_key: GlobalSecret.CONSUMER_KEY,
            consumer_secret: GlobalSecret.CONSUMER_SECRET,
            access_token_key: access_key,
            access_token_secret: access_secret
        })
    }

	// tweet text behaviors
	// ___________________________
	sendNewTweet(msg:string):void {
		this.Twitter.post('statuses/update', {status: msg} , (error:any, tweet:any, response:any) => {
		  if(error) throw new Error(JSON.stringify(error));

		  this.log.debug(tweet);
		});
        
        // TODO 結果をEmitする
	}
    
    getTimeline(count:number, minId:string):void {
        this.get("statuses/home_timeline", TwitterApi.Type.Tweet, count, minId);
	}

    getMention(count:number, minId:string):void {
        this.get("statuses/mentions_timeline", TwitterApi.Type.Mention, count, minId);
	}

    getDirectMessage(count:number, minId:string):void {
        this.get("direct_messages", TwitterApi.Type.DirectMessage, count, minId);
	}
    
    get(entrypoint:string, type:TwitterApi.Type, count:number, minId:string):void {
        let param:any = {count: count};
        if (minId != undefined) param.since_id = minId;
        
        this.log.info("Twitter API " + entrypoint + " " + JSON.stringify(param));
		this.Twitter.get(entrypoint, param, (error:any, tweets:Array<any>, response:any) => {
		  if(error) throw new Error(JSON.stringify(error));
          
        //   console.log('result' + type.toString() + " " );
        //   console.log(JSON.stringify(tweets));
          this.emit('result' + type.toString(), tweets);
  	    });
	}

    dispose() {
        super.removeAllListeners();
        
        // TODO stream切る
    }
    
}
export = TwitterClient;