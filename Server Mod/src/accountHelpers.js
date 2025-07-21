"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountHelpers = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class AccountHelpers {
    logger;
    modConfig = require("../config/config.json");
    locationInstance;
    currentDirectory = __dirname;
    dbPath = path_1.default.join(this.currentDirectory, "..", "db");
    // Creates the new user profiles if they don't exist, error checking and everything
    createUserProfile(pmcData) {
        const pmc = pmcData._id;
        // Returns in case the user pmc data is not complete, normally only on account creation or the json was deleted
        if (pmc === undefined) {
            if (this.modConfig.enableLogging) {
                this.logger.log("PMC ID undefined, creating a new account?" + pmc, "red");
            }
            return false;
        }
        // Create the user fold incase it doesn't exist
        this.creaateUserFolderSync(pmcData);
        // Profile settings match the default lock status of the modConfig
        const user = {
            userID: pmcData._id,
            allMapsUnlocked: false,
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
                    if (this.modConfig.enableLogging) {
                        this.logger.log("File already exists.  No new file created.", "yellow");
                    }
                    return true;
                }
                else {
                    if (this.modConfig.enableLogging) {
                        this.logger.log("Error writing file:" + err, "red");
                    }
                    return false;
                }
            }
            else {
                if (this.modConfig.enableLogging) {
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
        const filePath = this.dbPath + "/" + pmc + "/" + pmc + ".json";
        fs_1.default.writeFile(filePath, userJson, { flag: "r+" }, (err) => {
            if (err) {
                if (this.modConfig.enableLogging) {
                    this.logger.log("Error writing files:" + err, "red");
                }
            }
            else {
                if (this.modConfig.enableLogging) {
                    this.logger.log("Successfully wrote file", "green");
                }
            }
        });
    }
    // Creates and updates the users last raid status
    writeRaidStatusJsonFile(pmcData, raidResult) {
        const pmc = pmcData._id;
        const serverID = raidResult.serverId;
        if (serverID.includes("Savage")) {
            if (this.modConfig.enableLogging) {
                this.logger.log("Scav raid detected, skipping", "yellow");
            }
            return;
        }
        const user = {
            MapId: raidResult.serverId,
            RaidResult: raidResult.results.result,
            Exit: raidResult.results.exitName,
            Camping: this.modConfig.campingTrip,
            ExtendedCamping: this.modConfig.campingAdjacent,
            Maps: {
                groundZero: this.locationInstance.groundZero,
                customs: this.locationInstance.customs,
                factory: this.locationInstance.factory,
                woods: this.locationInstance.woods,
                interChange: this.locationInstance.interChange,
                streets: this.locationInstance.streets,
                shoreLine: this.locationInstance.shoreLine,
                lightHouse: this.locationInstance.lightHouse,
                reserve: this.locationInstance.reserve,
                labs: this.locationInstance.labs
            }
        };
        const userJson = JSON.stringify(user, null, 2);
        const filePath = this.dbPath + "/" + pmc + "/" + "lastRaidResults.json";
        fs_1.default.writeFile(filePath, userJson, (err) => {
            if (err) {
                if (err.code === "EEXIST") {
                    if (this.modConfig.enableLogging) {
                        this.logger.log("Raid results already exists.  No new file created.", "yellow");
                    }
                    return true;
                }
                else {
                    if (this.modConfig.enableLogging) {
                        this.logger.log("Error writing file:" + err, "red");
                    }
                    return false;
                }
            }
            else {
                if (this.modConfig.enableLogging) {
                    this.logger.log("JSON file created successfully.", "green");
                }
                return true;
            }
        });
    }
    // Updates the user profile after quest status checked
    updateRaidStatus(pmcData, raidResult) {
        const pmc = pmcData._id;
        const userJson = JSON.stringify(raidResult, null, 2);
        const filePath = this.dbPath + "/" + pmc + "/" + "lastRaidResults.json";
        fs_1.default.writeFile(filePath, userJson, { flag: "r+" }, (err) => {
            if (err) {
                if (this.modConfig.enableLogging) {
                    this.logger.log("Error writing files:" + err, "red");
                }
            }
            else {
                if (this.modConfig.enableLogging) {
                    this.logger.log("Successfully wrote file", "green");
                }
            }
        });
    }
    // Creates the new users folder if it doesn't exist
    creaateUserFolderSync(pmcData) {
        if (this.modConfig.enableLogging) {
            this.logger.log("Creating folder", "yellow");
        }
        const pmc = pmcData._id;
        const filePath = this.dbPath + "/" + pmc;
        try {
            fs_1.default.mkdirSync(filePath, { recursive: true });
            if (this.modConfig.enableLogging) {
                this.logger.log("Directory " + filePath + " created successfully (synchronously)!", "white");
            }
        }
        catch (error) {
            if (error.code === "EEXIST") {
                if (this.modConfig.enableLogging) {
                    this.logger.log("Directory " + filePath + " already exists (synchronously).", "white");
                }
            }
            else {
                if (this.modConfig.enableLogging) {
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
                if (this.modConfig.enableLogging) {
                    this.logger.log("Could not find file at: " + filePath, "red");
                }
                // Returns null to prevent this from freezing the server on error.
                // Only really happens during the intitial profile creation because this
                // process can't wait its turn.
                return null;
            }
            if (this.modConfig.enableLogging) {
                this.logger.log("Error reading or parsing JSON file at: " + filePath, "red");
            }
            return null;
        }
    }
}
exports.AccountHelpers = AccountHelpers;
//# sourceMappingURL=accountHelpers.js.map