import TwitterApi = require('./TwitterApi');

export class TabGetNewParams {
    tabId: string
    tabSetting: TabSetting
    minId: string
}

export class TabGroupSetting {
    _id:string
    name:string
    tabs:Array<TabSetting>
};

export class TabListenParams {
    tabId: string
    tabSetting: TabSetting
}

export class TabSetting {
    id:string
    name:string
    account_id:string
    type:TwitterApi.Type
    filter: any
};

export class NewTweetParams {
    text: string
    account_id: string
}

export class LogParams {
    level: LogLevel
    msg: string
    appender: string
}

export enum LogLevel {
    DEBUG, INFO, WARN, ERROR
}

export interface UserInfo extends TwitterApi.UserInfo {}