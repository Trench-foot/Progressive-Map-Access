"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mod = void 0;
const QuestStatus_1 = require("C:/snapshot/project/obj/models/enums/QuestStatus");
const locationHelper_1 = require("./locationHelper");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
//import { server } from "C:/snapshot/project/node_modules/typescript";
class ProgressiveMapAccess {
    logger;
    databaseServer;
    profileHelper;
    tables;
    modConfig = require("../config/config.json");
    enableLogging = true;
    matchResults;
    groundZero;
    groundZeroHigh;
    customs;
    factoryDay;
    factoryNight;
    woods;
    interChange;
    streets;
    shoreLine;
    lightHouse;
    reserve;
    labs;
    currentDirectory = __dirname;
    dbPath = path_1.default.join(this.currentDirectory, "..", "db");
    postDBLoad(container) {
        this.databaseServer = container.resolve("DatabaseServer");
        this.profileHelper = container.resolve("ProfileHelper");
        this.tables = this.databaseServer.getTables();
        if (this.modConfig.enabled) {
            // Lock maps on server startup
            this.setMapMappings();
            this.lockMapsOnStart();
            this.logger.log("[PMA] Locking maps!", "yellow");
        }
    }
    preSptLoad(container) {
        this.logger = container.resolve("WinstonLogger");
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
                        this.createUserProfile(currentProfile);
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
                        if (this.enableLogging) {
                            this.logger.log("Checking quest progress, /client/mail/dialog/info", "yellow");
                        }
                        this.updateMapAccess(currentProfile);
                        return output;
                    }
                },
                {
                    // update on client updating locations
                    url: "/client/locations",
                    action: async (url, info, sessionId, output) => {
                        const currentProfile = this.profileHelper.getPmcProfile(sessionId);
                        this.updateMapAccess(currentProfile);
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
                        this.updateMapAccess(currentProfile);
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
                        this.logger.log(this.matchResults, "yellow");
                        this.writeRaidStatusJsonFile(currentProfile, this.matchResults);
                        // if (this.enableLogging)
                        // {
                        //     this.logger.log("Checking quest progress, /client/survey/view", "yellow");
                        // }                       
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
        this.groundZero = this.tables.locations.sandbox.base;
        this.groundZeroHigh = this.tables.locations.sandbox_high.base;
        this.customs = this.tables.locations.bigmap.base;
        this.factoryDay = this.tables.locations.factory4_day.base;
        this.factoryNight = this.tables.locations.factory4_night.base;
        this.woods = this.tables.locations.woods.base;
        this.interChange = this.tables.locations.interchange.base;
        this.streets = this.tables.locations.tarkovstreets.base;
        this.shoreLine = this.tables.locations.shoreline.base;
        this.lightHouse = this.tables.locations.lighthouse.base;
        this.reserve = this.tables.locations.rezervbase.base;
        this.labs = this.tables.locations.laboratory.base;
    }
    // Locks map access based on config settings
    lockMapsOnStart() {
        if (this.enableLogging) {
            this.logger.log("Locking map on startup", "white");
        }
        this.groundZero.Locked = this.modConfig.GroundZero.lockedByDefault;
        this.groundZeroHigh.Locked = this.modConfig.GroundZero.lockedByDefault;
        this.customs.Locked = this.modConfig.Customs.lockedByDefault;
        this.factoryDay.Locked = this.modConfig.Factory.lockedByDefault;
        this.factoryNight.Locked = this.modConfig.Factory.lockedByDefault;
        this.woods.Locked = this.modConfig.Woods.lockedByDefault;
        this.interChange.Locked = this.modConfig.Interchange.lockedByDefault;
        this.streets.Locked = this.modConfig.Streets.lockedByDefault;
        this.shoreLine.Locked = this.modConfig.Shoreline.lockedByDefault;
        this.lightHouse.Locked = this.modConfig.Lighthouse.lockedByDefault;
        this.reserve.Locked = this.modConfig.Reserve.lockedByDefault;
        this.labs.Locked = this.modConfig.Labs.lockedByDefault;
    }
    // Updates map access based on information from created player profile
    updateMapAccess(pmcData) {
        const profilePath = this.dbPath + "/" + pmcData._id + "/" + pmcData._id + ".json";
        const profile = this.readJsonFileSync(profilePath);
        if (profile === undefined || profile === null) {
            if (this.enableLogging) {
                this.logger.log("Creating player profile", "white");
            }
            this.createUserProfile(pmcData);
            if (this.enableLogging) {
                this.logger.log("Profile undefined or null!  Returning.", "red");
            }
            return;
        }
        if (this.enableLogging) {
            this.logger.log("UPDATING MAP TABLE!", "green");
        }
        this.groundZero.Locked = profile.Maps.groundZero;
        this.groundZeroHigh.Locked = profile.Maps.groundZero;
        this.customs.Locked = profile.Maps.customs;
        this.factoryDay.Locked = profile.Maps.factory;
        this.factoryNight.Locked = profile.Maps.factory;
        this.woods.Locked = profile.Maps.woods;
        this.interChange.Locked = profile.Maps.interChange;
        this.streets.Locked = profile.Maps.streets;
        this.shoreLine.Locked = profile.Maps.shoreLine;
        this.lightHouse.Locked = profile.Maps.lightHouse;
        this.reserve.Locked = profile.Maps.reserve;
        this.labs.Locked = profile.Maps.labs;
        if (!this.checkPreviousRaidStatus(pmcData)) {
            return;
        }
    }
    checkPreviousRaidStatus(pmcData) {
        const raidResultsPath = this.dbPath + "/" + pmcData._id + "/" + "lastRaidResults.json";
        const raid = this.readJsonFileSync(raidResultsPath);
        if (raid === undefined || raid === null) {
            if (this.enableLogging) {
                this.logger.log("Raid results undefined or null!  Returning.", "red");
            }
            return false;
        }
        const testSurvived = raid.RaidResult;
        if (testSurvived.includes("Survived") || testSurvived.includes("Runner")) {
            if (this.enableLogging) {
                this.logger.log("Player had a status of survived or runner", "yellow");
            }
            const test = raid.MapId;
            let locationResult;
            if (this.enableLogging) {
                this.logger.log("Testing " + test + " for matches.", "yellow");
            }
            for (const location in locationHelper_1.locationsArray) {
                this.logger.log(locationHelper_1.locationsArray[location], "yellow");
                if (test.includes(locationHelper_1.locationsArray[location])) {
                    locationResult = locationHelper_1.locationsArray[location];
                }
            }
            if (this.enableLogging) {
                this.logger.log(locationResult + "found, setting matching bool", "yellow");
            }
            switch (locationResult) {
                case "Sandbox":
                    this.groundZero.Locked = false;
                    break;
                case "Sandbox_high":
                    this.groundZeroHigh.Locked = false;
                    break;
                case "bigmap":
                    this.customs.Locked = false;
                    break;
                case "factory4_day":
                    this.factoryDay.Locked = false, this.factoryNight.Locked = false;
                    break;
                case "factory4_night":
                    this.factoryDay.Locked = false, this.factoryNight.Locked = false;
                    break;
                case "Woods":
                    this.woods.Locked = false;
                    break;
                case "Interchange":
                    this.interChange.Locked = false;
                    break;
                case "Shoreline":
                    this.shoreLine.Locked = false;
                    break;
                case "RezervBase":
                    this.reserve.Locked = false;
                    break;
                case "Lighthouse":
                    this.lightHouse.Locked = false;
                    break;
                case "TarkovStreets":
                    this.streets.Locked = false;
                    break;
                case "laboratory":
                    this.labs.Locked = false;
                    break;
                default:
                    if (this.enableLogging) {
                        this.logger.log("No matches found for " + locationResult, "red");
                    }
                    return false;
            }
            if (this.enableLogging) {
                this.logger.log("Operation complete " + locationResult + " should be open.", "green");
            }
            return true;
        }
        return false;
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
        const profilePath = this.dbPath + "/" + pmcData._id + "/" + pmcData._id + ".json";
        const profile = this.readJsonFileSync(profilePath);
        if (profile === undefined || profile === null) {
            // Just incase the user deletes there profiles for whatever reason,
            // this will recreate them on login
            this.createUserProfile(pmcData);
            if (this.enableLogging) {
                this.logger.log("Profile undefined or null!  Returning.", "red");
            }
            return;
        }
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
                    this.groundZero.Locked = false;
                    this.groundZeroHigh.Locked = false;
                    groundZeroBool = false;
                    if (this.enableLogging) {
                        const test = this.groundZero.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Ground Zero unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (customsBool && quest.qid === this.modConfig.Customs.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Customs), 4)) {
                    this.customs.Locked = false;
                    customsBool = false;
                    if (this.enableLogging) {
                        const test = this.customs.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Customs unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (factoryBool && quest.qid === this.modConfig.Factory.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Factory), 4)) {
                    this.factoryDay.Locked = false;
                    this.factoryNight.Locked = false;
                    factoryBool = false;
                    if (this.enableLogging) {
                        const test = this.factoryDay.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Factory unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (woodsBool && quest.qid === this.modConfig.Woods.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Woods), 4)) {
                    this.woods.Locked = false;
                    woodsBool = false;
                    if (this.enableLogging) {
                        const test = this.woods.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Woods unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (interChangeBool && quest.qid === this.modConfig.Interchange.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Interchange), 4)) {
                    this.interChange.Locked = false;
                    interChangeBool = false;
                    if (this.enableLogging) {
                        const test = this.interChange.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Interchange unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (streetsBool && quest.qid === this.modConfig.Streets.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Streets), 4)) {
                    this.streets.Locked = false;
                    streetsBool = false;
                    if (this.enableLogging) {
                        const test = this.streets.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Streets unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (shoreLineBool && quest.qid === this.modConfig.Shoreline.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Shoreline), 4)) {
                    this.shoreLine.Locked = false;
                    shoreLineBool = false;
                    if (this.enableLogging) {
                        const test = this.shoreLine.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Shoreline unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (lightHouseBool && quest.qid === this.modConfig.Lighthouse.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Lighthouse), 4)) {
                    this.lightHouse.Locked = false;
                    lightHouseBool = false;
                    if (this.enableLogging) {
                        const test = this.lightHouse.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Lighthouse unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (reserveBool && quest.qid === this.modConfig.Reserve.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Reserve), 4)) {
                    this.reserve.Locked = false;
                    reserveBool = false;
                    if (this.enableLogging) {
                        const test = this.reserve.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Reserve unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (labsBool && quest.qid === this.modConfig.Labs.questID) {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Labs), 4)) {
                    this.labs.Locked = false;
                    labsBool = false;
                    if (this.enableLogging) {
                        const test = this.labs.Locked;
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
        if (this.enableLogging) {
            this.logger.log("Updating profile data.", "yellow");
        }
        // Writes status of map access to a new variable to be passed to a json write function
        const newProfileData = {
            userID: pmcData._id,
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
        this.updateUserProfile(pmcData, newProfileData);
        if (this.enableLogging) {
            this.logger.log("Writing new profile data.", "yellow");
        }
        // Update make access after update
        this.updateMapAccess(pmcData);
        return;
    }
    // Creates the new user profiles if they don't exist, error checking and everything
    createUserProfile(pmcData) {
        const pmc = pmcData._id;
        // Returns in case the user pmc data is not complete, normally only on account creation or the json was deleted
        if (pmc === undefined) {
            if (this.enableLogging) {
                this.logger.log("PMC ID undefined, creating a new account?" + pmc, "red");
            }
            return false;
        }
        // Create the user fold incase it doesn't exist
        this.creaateUserFolderSync(pmcData);
        // Profile settings match the default lock status of the modConfig
        const user = {
            userID: pmcData._id,
            Maps: {
                groundZero: this.modConfig.GroundZero.lockedByDefault,
                customs: this.modConfig.Customs.lockedByDefault,
                factory: this.modConfig.Factory.lockedByDefault,
                woods: this.modConfig.Woods.lockedByDefault,
                interChange: this.modConfig.Interchange.lockedByDefault,
                streets: this.modConfig.Streets.lockedByDefault,
                shoreLine: this.modConfig.Shoreline.lockedByDefault,
                lightHouse: this.modConfig.Lighthouse.lockedByDefault,
                reserve: this.modConfig.Reserve.lockedByDefault,
                labs: this.modConfig.Labs.lockedByDefault
            }
        };
        const userJson = JSON.stringify(user, null, 2);
        const filePath = this.dbPath + "/" + pmc + "/" + pmc + ".json";
        fs_1.default.writeFile(filePath, userJson, { flag: "wx" }, (err) => {
            if (err) {
                if (err.code === "EEXIST") {
                    if (this.enableLogging) {
                        this.logger.log("File already exists.  No new file created.", "yellow");
                    }
                    return true;
                }
                else {
                    if (this.enableLogging) {
                        this.logger.log("Error writing file:" + err, "red");
                    }
                    return false;
                }
            }
            else {
                if (this.enableLogging) {
                    this.logger.log("JSON file created successfully.", "green");
                }
                return true;
            }
        });
    }
    // Updates the user profile after quest status checked
    updateUserProfile(pmcData, data) {
        const pmc = pmcData._id;
        const userJson = JSON.stringify(data, null, 2);
        //const filePath = this.dbPath + "/" + pmc + ".json";
        const filePath = this.dbPath + "/" + pmc + "/" + pmc + ".json";
        fs_1.default.writeFile(filePath, userJson, { flag: "r+" }, (err) => {
            if (err) {
                if (this.enableLogging) {
                    this.logger.log("Error writing files:" + err, "red");
                }
            }
            else {
                if (this.enableLogging) {
                    this.logger.log("Successfully wrote file", "green");
                }
            }
        });
    }
    // Creates and updates the users last raid status
    writeRaidStatusJsonFile(pmcData, raidResult) {
        const pmc = pmcData._id;
        const serverID = raidResult.serverId;
        // const results = raidResult.results.result;
        // const exit = raidResult.results.exitName;
        if (serverID.includes("Savage")) {
            if (this.enableLogging) {
                this.logger.log("Scav raid detected, skipping", "yellow");
            }
            return;
        }
        const user = {
            MapId: raidResult.serverId,
            RaidResult: raidResult.results.result,
            Exit: raidResult.results.exitName
        };
        const userJson = JSON.stringify(user, null, 2);
        const filePath = this.dbPath + "/" + pmc + "/" + "lastRaidResults.json";
        fs_1.default.writeFile(filePath, userJson, (err) => {
            if (err) {
                if (err.code === "EEXIST") {
                    if (this.enableLogging) {
                        this.logger.log("File already exists.  No new file created.", "yellow");
                    }
                    return true;
                }
                else {
                    if (this.enableLogging) {
                        this.logger.log("Error writing file:" + err, "red");
                    }
                    return false;
                }
            }
            else {
                if (this.enableLogging) {
                    this.logger.log("JSON file created successfully.", "green");
                }
                return true;
            }
        });
    }
    // Creates the new users folder if it doesn't exist
    creaateUserFolderSync(pmcData) {
        if (this.enableLogging) {
            this.logger.log("Creating folder", "yellow");
        }
        const pmc = pmcData._id;
        const filePath = this.dbPath + "/" + pmc;
        try {
            fs_1.default.mkdirSync(filePath, { recursive: true });
            if (this.enableLogging) {
                this.logger.log("Directory " + filePath + " created successfully (synchronously)!", "white");
            }
        }
        catch (error) {
            if (error.code === "EEXIST") {
                if (this.enableLogging) {
                    this.logger.log("Directory " + filePath + " already exists (synchronously).", "white");
                }
            }
            else {
                if (this.enableLogging) {
                    this.logger.log("Error creating directory synchronously: " + filePath, "red");
                }
            }
        }
    }
    // Read JSON files
    readJsonFileSync(filePath) {
        try {
            return JSON.parse(fs_1.default.readFileSync(filePath, "utf-8"));
        }
        catch (error) {
            if (error.code === "ENOENT") {
                if (this.enableLogging) {
                    this.logger.log("Could not find file:", "red");
                }
                // Returns null to prevent this from freezing the server on error.
                // Only really happens during the intitial profile creation because this
                // process can't wait its turn.
                return null;
            }
            if (this.enableLogging) {
                this.logger.log("Error reading or parsing JSON file:" + error.message, "red");
            }
            return null;
        }
    }
}
exports.mod = new ProgressiveMapAccess();
//# sourceMappingURL=mod.js.map