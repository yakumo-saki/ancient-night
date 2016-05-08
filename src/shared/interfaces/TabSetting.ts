import TwitterApi = require('./TwitterApi');

class TabSetting {
    id:string
    name:string
    account_id:number
    type:TwitterApi.Type
    filter: any
};

export = TabSetting