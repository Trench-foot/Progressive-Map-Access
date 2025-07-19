"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mod = void 0;
const QuestStatus_1 = require("C:/snapshot/project/obj/models/enums/QuestStatus");
const accountHelpers_1 = require("./accountHelpers");
const offMapHelpers_1 = require("./offMapHelpers");
const locationHelper_1 = require("./locationHelper");
class ProgressiveMapAccess {
    logger;
    databaseServer;
    profileHelper;
    tables;
    locationInstance = new locationHelper_1.LocationHelpers();
    accountInstance = new accountHelpers_1.AccountHelpers();
    offMapInstance = new offMapHelpers_1.OffMapHelpers();
    modConfig = require("../config/config.json");
    enableLogging = this.modConfig.enableLogging;
    matchResults;
    // private groundZero;
    // private groundZeroHigh;
    // private customs;
    // private factoryDay;
    // private factoryNight;
    // private woods;
    // private interChange;
    // private streets;
    // private shoreLine;
    // private lightHouse;
    // private reserve;
    // private labs;
    // private currentDirectory: string = __dirname;
    // private dbPath: string = path.join(this.currentDirectory, "..", "db");
    postDBLoad(container) {
        this.databaseServer = container.resolve("DatabaseServer");
        this.profileHelper = container.resolve("ProfileHelper");
        this.tables = this.databaseServer.getTables();
        this.offMapInstance.accountInstance = this.accountInstance;
        this.offMapInstance.locationInstance = this.locationInstance;
        if (this.modConfig.enabled) {
            // Lock maps on server startup
            this.setMapMappings();
            this.lockMapsOnStart();
            this.locationInstance.initializeArrays();
            this.logger.log("[PMA] Locking maps!", "yellow");
        }
    }
    preSptLoad(container) {
        this.logger = container.resolve("WinstonLogger");
        this.accountInstance.logger = this.logger;
        this.offMapInstance.logger = this.logger;
        const staticRouterModService = container.resolve("StaticRouterModService");
        if (this.modConfig.enabled) {
            staticRouterModService.registerStaticRouter("[PMA]", [
                {
                    // update on client game start
                    url: "/client/game/start",
                    action: async (url, info, sessionId, output) => {
                        const currentProfile = this.profileHelper.getPmcProfile(sessionId);
                        if (this.enableLogging) {
                            this.logger.log("Checking quest progress, /client/game/start", "yellow");
                        }
                        this.updateQuestProgression(currentProfile);
                        return output;
                    }
                },
                {
                    // update on client game start
                    url: "/client/game/profile/create",
                    action: async (url, info, sessionId, output) => {
                        const currentProfile = this.profileHelper.getPmcProfile(sessionId);
                        if (this.enableLogging) {
                            this.logger.log("Creating profile, /client/game/profile/create", "yellow");
                        }
                        this.accountInstance.createUserProfile(currentProfile);
                        return output;
                    }
                },
                {
                    // update on quest completion, this is a double check as sometimes the user profile gets
                    // updated before the actual process of checking quest progress
                    url: "/client/game/profile/items/moving",
                    action: async (url, info, sessionId, output) => {
                        const currentProfile = this.profileHelper.getPmcProfile(sessionId);
                        if (this.enableLogging) {
                            this.logger.log("Checking quest progress, /client/game/profile/items/moving", "yellow");
                        }
                        this.updateQuestProgression(currentProfile);
                        return output;
                    }
                },
                {
                    // update on quest completion, this is a double check as sometimes the user profile gets
                    // updated before the actual process of checking quest progress
                    url: "/client/mail/dialog/info",
                    action: async (url, info, sessionId, output) => {
                        const currentProfile = this.profileHelper.getPmcProfile(sessionId);
                        this.updateQuestProgression(currentProfile);
                        if (this.enableLogging) {
                            this.logger.log("Checking quest progress, /client/mail/dialog/info", "yellow");
                        }
                        const test = this.updateMapsWait(currentProfile);
                        if (this.enableLogging) {
                            this.logger.log("Map update returned: " + test, "white");
                        }
                        return output;
                    }
                },
                {
                    // update on client updating locations
                    url: "/client/locations",
                    action: async (url, info, sessionId, output) => {
                        const currentProfile = this.profileHelper.getPmcProfile(sessionId);
                        const test = this.updateMapsWait(currentProfile);
                        if (this.enableLogging) {
                            this.logger.log("Map update returned: " + test, "white");
                        }
                        if (this.enableLogging) {
                            this.logger.log("[PMA] Checking map updates", "yellow");
                        }
                        return output;
                    }
                },
                {
                    // back up update call, this is useful if the player deleted there profile and doesn't
                    // have quests to accept to force the mod to check there access
                    url: "/client/survey/view",
                    action: async (url, info, sessionId, output) => {
                        const currentProfile = this.profileHelper.getPmcProfile(sessionId);
                        if (this.enableLogging) {
                            this.logger.log("Checking quest progress, /client/survey/view", "yellow");
                        }
                        this.updateQuestProgression(currentProfile);
                        const test = this.updateMapsWait(currentProfile);
                        if (this.enableLogging) {
                            this.logger.log("Map update returned: " + test, "white");
                        }
                        return output;
                    }
                },
                {
                    // back up update call, this is useful if the player deleted there profile and doesn't
                    // have quests to accept to force the mod to check there access
                    url: "/client/match/local/end",
                    action: async (url, info, sessionId, output) => {
                        const currentProfile = this.profileHelper.getPmcProfile(sessionId);
                        this.matchResults = info;
                        this.accountInstance.writeRaidStatusJsonFile(currentProfile, this.matchResults);
                        if (this.enableLogging) {
                            this.logger.log("Caching raid status, /client/match/local/end", "yellow");
                        }
                        return output;
                    }
                }
            ], "spt");
        }
    }
    // Maps the base files for all maps
    setMapMappings() {
        if (this.enableLogging) {
            this.logger.log("Setting map mappings", "white");
        }
        this.locationInstance.groundZero = this.tables.locations.sandbox.base;
        this.locationInstance.groundZeroHigh = this.tables.locations.sandbox_high.base;
        this.locationInstance.customs = this.tables.locations.bigmap.base;
        this.locationInstance.factoryDay = this.tables.locations.factory4_day.base;
        this.locationInstance.factoryNight = this.tables.locations.factory4_night.base;
        this.locationInstance.woods = this.tables.locations.woods.base;
        this.locationInstance.interChange = this.tables.locations.interchange.base;
        this.locationInstance.streets = this.tables.locations.tarkovstreets.base;
        this.locationInstance.shoreLine = this.tables.locations.shoreline.base;
        this.locationInstance.lightHouse = this.tables.locations.lighthouse.base;
        this.locationInstance.reserve = this.tables.locations.rezervbase.base;
        this.locationInstance.labs = this.tables.locations.laboratory.base;
    }
    // Locks map access based on config settings
    lockMapsOnStart() {
        if (this.enableLogging) {
            this.logger.log("Locking map on startup", "white");
        }
        this.locationInstance.groundZero.Locked = this.modConfig.GroundZero.lockedByDefault;
        this.locationInstance.groundZeroHigh.Locked = this.modConfig.GroundZero.lockedByDefault;
        this.locationInstance.customs.Locked = this.modConfig.Customs.lockedByDefault;
        this.locationInstance.factoryDay.Locked = this.modConfig.Factory.lockedByDefault;
        this.locationInstance.factoryNight.Locked = this.modConfig.Factory.lockedByDefault;
        this.locationInstance.woods.Locked = this.modConfig.Woods.lockedByDefault;
        this.locationInstance.interChange.Locked = this.modConfig.Interchange.lockedByDefault;
        this.locationInstance.streets.Locked = this.modConfig.Streets.lockedByDefault;
        this.locationInstance.shoreLine.Locked = this.modConfig.Shoreline.lockedByDefault;
        this.locationInstance.lightHouse.Locked = this.modConfig.Lighthouse.lockedByDefault;
        this.locationInstance.reserve.Locked = this.modConfig.Reserve.lockedByDefault;
        this.locationInstance.labs.Locked = this.modConfig.Labs.lockedByDefault;
    }
    // Function to try and make the game wait for for both location checks
    updateMapsWait(pmcData) {
        if (this.updateQuestMapAccess(pmcData)) {
            if (this.enableLogging) {
                this.logger.log("Map update completed", "green");
            }
            if (this.offMapInstance.checkPreviousRaidStatus(pmcData)) {
                if (this.enableLogging) {
                    this.logger.log("Camping update complete", "yellow");
                }
                return true;
            }
            else {
                if (this.enableLogging) {
                    this.logger.log("Camping update not complete", "yellow");
                }
                return false;
            }
        }
        else {
            if (this.enableLogging) {
                this.logger.log("Update not complete", "green");
            }
            // if (this.offMapInstance.checkPreviousRaidStatus(pmcData))
            // {
            //     if (this.enableLogging)
            //     {
            //         this.logger.log("Update complete", "yellow");               
            //     }
            //     return true;
            // }
            // else
            // {
            //     if (this.enableLogging)
            //     {
            //         this.logger.log("Update not complete", "yellow");                
            //     }
            //     return false;
            // }
            return false;
        }
    }
    // Updates map access based on information from created player profile
    updateQuestMapAccess(pmcData) {
        const profilePath = this.accountInstance.dbPath + "/" + pmcData._id + "/" + pmcData._id + ".json";
        const profile = this.accountInstance.readJsonFileSync(profilePath);
        if (profile === undefined || profile === null) {
            if (this.enableLogging) {
                this.logger.log("Creating player profile", "white");
            }
            this.accountInstance.createUserProfile(pmcData);
            if (this.enableLogging) {
                this.logger.log("Profile undefined or null!  Returning.", "red");
            }
            return false;
        }
        if (this.enableLogging) {
            this.logger.log("UPDATING MAP TABLE!", "green");
        }
        this.locationInstance.groundZero.Locked = profile.Maps.groundZero;
        this.locationInstance.groundZeroHigh.Locked = profile.Maps.groundZero;
        this.locationInstance.customs.Locked = profile.Maps.customs;
        this.locationInstance.factoryDay.Locked = profile.Maps.factory;
        this.locationInstance.factoryNight.Locked = profile.Maps.factory;
        this.locationInstance.woods.Locked = profile.Maps.woods;
        this.locationInstance.interChange.Locked = profile.Maps.interChange;
        this.locationInstance.streets.Locked = profile.Maps.streets;
        this.locationInstance.shoreLine.Locked = profile.Maps.shoreLine;
        this.locationInstance.lightHouse.Locked = profile.Maps.lightHouse;
        this.locationInstance.reserve.Locked = profile.Maps.reserve;
        this.locationInstance.labs.Locked = profile.Maps.labs;
        if (profile.allMapsUnlocked) {
            return false;
            if (this.enableLogging) {
                this.logger.log("[PMA] Profile has unlocked all maps, congratulations", "yellow");
            }
        }
        return true;
    }
    // Compairs pmc quest status with the requirements for unlock
    updateQuestProgression(pmcData) {
        // Checks if profile has quests, returns if none
        if (pmcData.Quests === undefined) {
            if (this.enableLogging) {
                this.logger.log("[PMA] Profile is empty. New or broken profile, maps locked.", "yellow");
            }
            this.lockMapsOnStart();
            return;
        }
        const profilePath = this.accountInstance.dbPath + "/" + pmcData._id + "/" + pmcData._id + ".json";
        const profile = this.accountInstance.readJsonFileSync(profilePath);
        if (profile === undefined || profile === null) {
            // Just incase the user deletes there profiles for whatever reason,
            // this will recreate them on login
            this.accountInstance.createUserProfile(pmcData);
            if (this.enableLogging) {
                this.logger.log("Profile undefined or null!  Returning.", "red");
            }
            return;
        }
        if (profile.allMapsUnlocked) {
            if (this.enableLogging) {
                this.logger.log("[PMA] Profile has unlocked all maps, congratulations", "yellow");
            }
            return;
        }
        let completion = profile.allMapsUnlocked;
        let groundZeroBool = profile.Maps.groundZero;
        let customsBool = profile.Maps.customs;
        let factoryBool = profile.Maps.factory;
        let woodsBool = profile.Maps.woods;
        let interChangeBool = profile.Maps.interChange;
        let streetsBool = profile.Maps.streets;
        let shoreLineBool = profile.Maps.shoreLine;
        let lightHouseBool = profile.Maps.lightHouse;
        let reserveBool = profile.Maps.reserve;
        let labsBool = profile.Maps.labs;
        //this.getConfigRequirement(this.modConfig.Customs);
        for (const quest of pmcData.Quests) {
            if (groundZeroBool && quest.qid === this.modConfig.GroundZero.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.GroundZero), 4)) {
                    this.locationInstance.groundZero.Locked = false;
                    this.locationInstance.groundZeroHigh.Locked = false;
                    groundZeroBool = false;
                    if (this.enableLogging) {
                        const test = this.locationInstance.groundZero.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Ground Zero unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (customsBool && quest.qid === this.modConfig.Customs.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Customs), 4)) {
                    this.locationInstance.customs.Locked = false;
                    customsBool = false;
                    if (this.enableLogging) {
                        const test = this.locationInstance.customs.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Customs unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (factoryBool && quest.qid === this.modConfig.Factory.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Factory), 4)) {
                    this.locationInstance.factoryDay.Locked = false;
                    this.locationInstance.factoryNight.Locked = false;
                    factoryBool = false;
                    if (this.enableLogging) {
                        const test = this.locationInstance.factoryDay.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Factory unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (woodsBool && quest.qid === this.modConfig.Woods.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Woods), 4)) {
                    this.locationInstance.woods.Locked = false;
                    woodsBool = false;
                    if (this.enableLogging) {
                        const test = this.locationInstance.woods.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Woods unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (interChangeBool && quest.qid === this.modConfig.Interchange.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Interchange), 4)) {
                    this.locationInstance.interChange.Locked = false;
                    interChangeBool = false;
                    if (this.enableLogging) {
                        const test = this.locationInstance.interChange.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Interchange unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (streetsBool && quest.qid === this.modConfig.Streets.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Streets), 4)) {
                    this.locationInstance.streets.Locked = false;
                    streetsBool = false;
                    if (this.enableLogging) {
                        const test = this.locationInstance.streets.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Streets unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (shoreLineBool && quest.qid === this.modConfig.Shoreline.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Shoreline), 4)) {
                    this.locationInstance.shoreLine.Locked = false;
                    shoreLineBool = false;
                    if (this.enableLogging) {
                        const test = this.locationInstance.shoreLine.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Shoreline unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (lightHouseBool && quest.qid === this.modConfig.Lighthouse.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Lighthouse), 4)) {
                    this.locationInstance.lightHouse.Locked = false;
                    lightHouseBool = false;
                    if (this.enableLogging) {
                        const test = this.locationInstance.lightHouse.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Lighthouse unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (reserveBool && quest.qid === this.modConfig.Reserve.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Reserve), 4)) {
                    this.locationInstance.reserve.Locked = false;
                    reserveBool = false;
                    if (this.enableLogging) {
                        const test = this.locationInstance.reserve.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Reserve unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (labsBool && quest.qid === this.modConfig.Labs.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Labs), 4)) {
                    this.locationInstance.labs.Locked = false;
                    labsBool = false;
                    if (this.enableLogging) {
                        const test = this.locationInstance.labs.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Laboratory unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            else {
                if (this.enableLogging) {
                    this.logger.log("No quest matches for" + quest.qid, "red");
                }
            }
        }
        if (groundZeroBool && customsBool && factoryBool && woodsBool && interChangeBool
            && streetsBool && shoreLineBool && lightHouseBool && reserveBool && labsBool) {
            this.logger.log("[PMA] Profile has unlocked all maps, congratulations", "yellow");
            completion = true;
        }
        if (this.enableLogging) {
            this.logger.log("Updating profile data.", "yellow");
        }
        // Writes status of map access to a new variable to be passed to a json write function
        const newProfileData = {
            userID: pmcData._id,
            allMapsUnlocked: completion,
            Maps: {
                groundZero: groundZeroBool,
                customs: customsBool,
                factory: factoryBool,
                woods: woodsBool,
                interChange: interChangeBool,
                streets: streetsBool,
                shoreLine: shoreLineBool,
                lightHouse: lightHouseBool,
                reserve: reserveBool,
                labs: labsBool
            }
        };
        this.accountInstance.updateUserProfile(pmcData, newProfileData);
        if (this.enableLogging) {
            this.logger.log("Writing new profile data.", "yellow");
        }
        // Update make access after update
        this.updateQuestMapAccess(pmcData);
        return;
    }
    // Converts the modConfig map bool to a queststatus
    getQuestStatusRequirement(mapConfig) {
        // Returns 2
        const questStarted = QuestStatus_1.QuestStatus.Started;
        // Returns 4
        const questCompleted = QuestStatus_1.QuestStatus.Success;
        if (mapConfig.requireQuestStarted) {
            if (this.enableLogging) {
                this.logger.log("Returned questStarted", "white");
            }
            return questStarted;
        }
        else if (mapConfig.requireQuestCompleted) {
            if (this.enableLogging) {
                this.logger.log("Returned questCompleted", "white");
            }
            return questCompleted;
        }
    }
    // Checks if quest status is between the config requirement and the completed status
    testBetweenNumbers(value, min, max) {
        return value >= min && value <= max;
    }
}
exports.mod = new ProgressiveMapAccess();
//# sourceMappingURL=mod.js.map