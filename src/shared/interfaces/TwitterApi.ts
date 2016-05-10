/**
 * Tweet, mention, DM 共通部
 */
interface TweetBase {
    id_str: string
    text: string
    created_at: Date
    source: string
}

/**
 * ユーザー情報（Mention時に送られてくるタイプ).
 */
export interface UserShortInfo {
    id_str: string
    name: string
    screen_name: string
}

/**
 * ユーザー情報.
 */
export interface UserInfo extends UserShortInfo {
    location: string
    description: string
    url: string
    protected: boolean
    followers_count: number
    friends_count: number
    listed_count: number
    created_at: Date
    favourites_count: number
    statuses_count:number
    lang: string
    profile_image_url_https: string
    following: boolean
    
    _id: string  // 内部独自項目
    accessToken: string  // 内部独自項目
    accessSecret: string // 内部独自項目
}

export interface Tweet extends TweetBase {
    /** 送信元ユーザー */
    user: UserInfo;
}

export interface Mention extends TweetBase {
    in_reply_to_status_id_str: string
    in_reply_to_user_id_str: string
    in_reply_to_screen_name: string
    
    /** 送信元ユーザー */
    user: UserInfo;

    /** 送信先ユーザー */
    user_mentions: Array<UserShortInfo>
}

export interface DirectMessage extends TweetBase {
    /** 送信元ユーザー */
    sender: UserInfo;

    /** 受信ユーザー */
    receiver: UserInfo;
}

export enum Type {
    Tweet,
    Mention,
    DirectMessage
}

/**
 * イベントとして発行されてくるデータ.
 * KOで表示することを考えてタイプごとに参照先を変えてある
 */
export class TwitterEvent {
    
    type: Type;
    id_str: string;
    account_id: string;
    
    data: TweetBase;    
}

/**
 * イベント種別(ストリーム).
 * Stream接続時のタイプ識別にも使用
 * https://dev.twitter.com/streaming/overview/messages-types
 */
export enum StreamEventType {
    delete,
    scrubGeo,
    limitNotice,
    statusWithheld,
    userWithheld,
    disconnect
}

export interface VerifyCredentialsResult {
    account: UserInfo;
}