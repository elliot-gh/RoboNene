export interface UserData {
        id: Number,
        discord_id: String,
        sekai_id: String,
        private: Number,
        quiz_correct: Number,
        quiz_question: Number,
}

export interface ChannelTracking {
    channel_id: String,
    guild_id: String,
    tracking_type: Number,
}

export interface UserCutoff {
    id: Number,
    Tier: Number,
    EventID: Number,
    Timestamp: Number,
    Score: Number,
}

export interface TierCutoff {
    EventID: Number,
    Tier: Number,
    Timestamp: Number,
    Score: Number,
    ID: Number,
}

export interface Prayers {
    id: String,
    luck: Number,
    prays: Number,
    lastTimestamp: Number,
    totalLuck: Number
}