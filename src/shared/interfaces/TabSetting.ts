import TwitterApi = require('./TwitterApi');

class TabSetting {
    id:string
    name:string
    account_id:string
    type:TwitterApi.Type
    filter: any
};

export = TabSetting