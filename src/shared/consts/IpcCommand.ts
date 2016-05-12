export const LOG = 'LOG'; // パラメタ Log
export const GET_ACCOUNTS = 'GET_ACCOUNTS';
export const GET_TAB_GROUPS = 'GET_TAB_GROUPS';

/** イベント受信登録します. パラメタは TabListenParams */
export const TAB_LISTEN = 'TAB_LISTEN';

/** イベント受信登録を解除します. パラメタは string(tabId) */
export const TAB_NO_LISTEN = 'TAB_NO_LISTEN';

/** イベント受信します. */
export const TAB_GET_NEW = 'TAB_GET_NEW';

/** 初期データをキャッシュから取得 パラメタ なし */
export const TAB_GET_INITIAL = 'TAB_GET_INITIAL'; 

/** 新しいツイートを送信 パラメタ NewTweetParams */
export const NEW_TWEET = 'NEW_TWEET'; 
