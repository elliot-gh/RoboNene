export interface AreaItemLevels {
    areaItemId: number;
    level: number;
    targetUnit: string;
    targetCardAttr: string;
    targetGameCharacterId?: number | null;
    power1BonusRate: number;
    power1AllMatchBonusRate: number;
    power2BonusRate: number;
    power2AllMatchBonusRate: number;
    power3BonusRate: number;
    power3AllMatchBonusRate: number;
    sentence: string;
}

export interface AreaItems {
    id: number;
    areaId: number;
    name: string;
    flavorText: string;
    spawnPoint: string;
    assetbundleName: string;
}

export interface Areas {
    id: number;
    assetbundleName: string;
    areaType: string;
    viewType: string;
    name: string;
    releaseConditionId: number;
    label?: string | null;
    startAt?: number | null;
    endAt?: number | null;
}

export interface CardEpisodes {
    id: number;
    seq: number;
    cardId: number;
    title: string;
    scenarioId: string;
    assetbundleName: string;
    releaseConditionId: number;
    power1BonusFixed: number;
    power2BonusFixed: number;
    power3BonusFixed: number;
    rewardResourceBoxIds?: (number | null)[] | null;
    costs?: (CostsEntity | null)[] | null;
    cardEpisodePartType: string;
}

export interface CostsEntity {
    resourceId: number;
    resourceType: string;
    quantity: number;
}

export interface Cards {
    id: number;
    seq: number;
    characterId: number;
    cardRarityType: string;
    specialTrainingPower1BonusFixed: number;
    specialTrainingPower2BonusFixed: number;
    specialTrainingPower3BonusFixed: number;
    attr: string;
    supportUnit: string;
    skillId: number;
    cardSkillName: string;
    prefix: string;
    assetbundleName: string;
    gachaPhrase: string;
    flavorText: string;
    releaseAt: number;
    cardParameters?: (CardParametersEntity)[] | null;
    specialTrainingCosts?: (SpecialTrainingCostsEntity | null)[] | null;
    masterLessonAchieveResources?: (MasterLessonAchieveResourcesEntity | null)[] | null;
}
export interface CardParametersEntity {
    id: number;
    cardId: number;
    cardLevel: number;
    cardParameterType: string;
    power: number;
}
export interface SpecialTrainingCostsEntity {
    cardId: number;
    seq: number;
    cost: Cost;
}
export interface Cost {
    resourceId: number;
    resourceType: string;
    resourceLevel: number;
    quantity: number;
}
export interface MasterLessonAchieveResourcesEntity {
    releaseConditionId: number;
    cardId: number;
    masterRank: number;
    resources?: (null)[] | null;
}

export interface CharacterProfiles {
    characterId: number;
    characterVoice?: string | null;
    birthday: string;
    height: string;
    school?: string | null;
    schoolYear?: string | null;
    hobby?: string | null;
    specialSkill?: string | null;
    favoriteFood?: string | null;
    hatedFood?: string | null;
    weak?: string | null;
    introduction: string;
    scenarioId: string;
}

export interface EventCards {
    id: number;
    cardId: number;
    eventId: number;
    bonusRate: number;
}

export interface EventDeckBonuses {
    id: number;
    eventId: number;
    gameCharacterUnitId?: number | null;
    cardAttr?: string | null;
    bonusRate: number;
}

export interface Events {
    id: number;
    eventType: string;
    name: string;
    assetbundleName: string;
    bgmAssetbundleName: string;
    startAt: number;
    aggregateAt: number;
    rankingAnnounceAt: number;
    distributionStartAt: number;
    closedAt: number;
    distributionEndAt: number;
    virtualLiveId?: number | null;
    unit: string;
    eventRankingRewardRanges?: (EventRankingRewardRangesEntity)[] | null;
    eventPointAssetbundleName?: string | null;
}
export interface EventRankingRewardRangesEntity {
    id: number;
    eventId: number;
    fromRank: number;
    toRank: number;
    eventRankingRewards?: (EventRankingRewardsEntity)[] | null;
}
export interface EventRankingRewardsEntity {
    id: number;
    eventRankingRewardRangeId: number;
    resourceBoxId: number;
}

export interface GameCharacters {
    id: number;
    seq: number;
    resourceId: number;
    firstName?: string | null;
    givenName: string;
    firstNameRuby?: string | null;
    givenNameRuby: string;
    gender: string;
    height: number;
    live2dHeightAdjustment: number;
    figure: string;
    breastSize: string;
    modelName: string;
    unit: string;
    supportUnitType: string;
}

export interface GameCharacterUnits {
    id: number;
    gameCharacterId: number;
    unit: string;
    colorCode: string;
    skinColorCode: string;
    skinShadowColorCode1: string;
    skinShadowColorCode2: string;
}

export interface Music_metas {
    music_id: number;
    difficulty: string;
    level: number;
    combo: number;
    music_time: number;
    event_rate: number;
    base_score: number;
    base_score_auto: number;
    skill_score_solo?: (number)[] | null;
    skill_score_auto?: (number)[] | null;
    skill_score_multi?: (number)[] | null;
    skill_note_count?: (number)[] | null;
    fever_score: number;
    fever_end_time: number;
}

export interface Musics {
    id: number;
    seq: number;
    releaseConditionId: number;
    categories?: (string)[] | null;
    title: string;
    lyricist: string;
    composer: string;
    arranger: string;
    dancerCount: number;
    selfDancerPosition: number;
    assetbundleName: string;
    liveTalkBackgroundAssetbundleName: string;
    publishedAt: number;
    liveStageId: number;
    fillerSec: number;
    musicCollaborationId?: number | null;
}
