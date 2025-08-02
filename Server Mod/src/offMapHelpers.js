"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OffMapHelpers = void 0;
class OffMapHelpers {
    logger;
    accountInstance;
    locationInstance;
    modConfig = require("../config/config.json");
    enableLogging = this.modConfig.enableLogging;
    // Checks the status of the previous raid and opens an extra map if its configued for it
    checkPreviousRaidStatus(pmcData) {
        if (!this.modConfig.campingTrip) {
            return false;
        }
        const raidResultsPath = this.accountInstance.dbPath + "/" + pmcData._id + "/" + "lastRaidResults.json";
        const raid = this.accountInstance.readJsonFileSync(raidResultsPath);
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
            for (const location in this.locationInstance.locationsArray) {
                if (test.includes(this.locationInstance.locationsArray[location])) {
                    locationResult = this.locationInstance.locationsArray[location];
                }
            }
            if (this.enableLogging) {
                this.logger.log(locationResult + "found, setting matching bool", "yellow");
            }
            switch (locationResult) {
                case "Sandbox":
                    this.locationInstance.groundZero = false;
                    if (this.modConfig.campingAdjacent) {
                        this.locationInstance.streets = false;
                    }
                    //this.checkMapAdjacence("Sandbox")
                    break;
                case "Sandbox_high":
                    this.locationInstance.groundZeroHigh = false;
                    if (this.modConfig.campingAdjacent) {
                        this.locationInstance.streets = false;
                    }
                    //this.checkMapAdjacence("Sandbox_high")
                    break;
                case "bigmap":
                    this.locationInstance.customs = false;
                    if (this.modConfig.campingAdjacent) {
                        this.locationInstance.factoryDay = false;
                        this.locationInstance.factoryNight = false;
                        this.locationInstance.interChange = false;
                        this.locationInstance.reserve = false;
                    }
                    //this.checkMapAdjacence("bigmap")
                    break;
                case "factory4_day":
                    this.locationInstance.factoryDay = false,
                        this.locationInstance.factoryNight = false;
                    if (this.modConfig.campingAdjacent) {
                        this.locationInstance.customs = false;
                        this.locationInstance.woods = false;
                        this.locationInstance.labs = false;
                    }
                    //this.checkMapAdjacence("factory4_day")
                    break;
                case "factory4_night":
                    this.locationInstance.factoryDay = false,
                        this.locationInstance.factoryNight = false;
                    if (this.modConfig.campingAdjacent) {
                        this.locationInstance.customs = false;
                        this.locationInstance.woods = false;
                        this.locationInstance.labs = false;
                    }
                    //this.checkMapAdjacence("factory4_night")
                    break;
                case "Woods":
                    this.locationInstance.woods = false;
                    if (this.modConfig.campingAdjacent) {
                        this.locationInstance.factoryDay = false;
                        this.locationInstance.factoryNight = false;
                        this.locationInstance.reserve = false;
                        this.locationInstance.lightHouse = false;
                    }
                    //this.checkMapAdjacence("Woods")
                    break;
                case "Interchange":
                    this.locationInstance.interChange = false;
                    if (this.modConfig.campingAdjacent) {
                        this.locationInstance.customs = false;
                        this.locationInstance.streets = false;
                    }
                    //this.checkMapAdjacence("Interchange")
                    break;
                case "Shoreline":
                    this.locationInstance.shoreLine = false;
                    if (this.modConfig.campingAdjacent) {
                        this.locationInstance.lightHouse = false;
                    }
                    //this.checkMapAdjacence("Shoreline")
                    break;
                case "RezervBase":
                    this.locationInstance.reserve = false;
                    if (this.modConfig.campingAdjacent) {
                        this.locationInstance.customs = false;
                        this.locationInstance.woods = false;
                        this.locationInstance.lightHouse = false;
                    }
                    //this.checkMapAdjacence("RezervBase")
                    break;
                case "Lighthouse":
                    this.locationInstance.lightHouse = false;
                    if (this.modConfig.campingAdjacent) {
                        this.locationInstance.woods = false;
                        this.locationInstance.shoreLine = false;
                        this.locationInstance.reserve = false;
                    }
                    //this.checkMapAdjacence("Lighthouse")
                    break;
                case "TarkovStreets":
                    this.locationInstance.streets = false;
                    if (this.modConfig.campingAdjacent) {
                        this.locationInstance.groundZero = false;
                        this.locationInstance.groundZeroHigh = false;
                        this.locationInstance.interChange = false;
                        this.locationInstance.labs = false;
                    }
                    //this.checkMapAdjacence("TarkovStreets")
                    break;
                case "laboratory":
                    this.locationInstance.labs = false;
                    if (this.modConfig.campingAdjacent) {
                        this.locationInstance.factoryDay = false;
                        this.locationInstance.factoryNight = false;
                        this.locationInstance.streets = false;
                    }
                    //this.checkMapAdjacence("laboratory")
                    break;
                default:
                    if (this.enableLogging) {
                        this.logger.log("No matches found for " + locationResult, "red");
                    }
                    return false;
            }
            // Writes status of map access to a new variable to be passed to a json write function
            const newRaidStatus = {
                MapId: raid.MapId,
                RaidResult: raid.RaidResult,
                Exit: raid.Exit,
                Camping: this.modConfig.campingTrip,
                ExtendedCamping: this.modConfig.campingAdjacent,
                Maps: {
                    groundZero: this.locationInstance.groundZero,
                    customs: this.locationInstance.customs,
                    factory: this.locationInstance.factoryDay,
                    woods: this.locationInstance.woods,
                    interChange: this.locationInstance.interChange,
                    streets: this.locationInstance.streets,
                    shoreLine: this.locationInstance.shoreLine,
                    lightHouse: this.locationInstance.lightHouse,
                    reserve: this.locationInstance.reserve,
                    labs: this.locationInstance.labs
                }
            };
            this.accountInstance.updateRaidStatus(pmcData, newRaidStatus);
            if (this.enableLogging) {
                this.logger.log("Writing new raid status data.", "yellow");
            }
            if (this.enableLogging) {
                this.logger.log("Operation complete " + locationResult + " should be open.", "green");
            }
            return true;
        }
        if (this.enableLogging) {
            this.logger.log("Player had a status other than survived or runner", "yellow");
        }
        return false;
    }
}
exports.OffMapHelpers = OffMapHelpers;
//# sourceMappingURL=offMapHelpers.js.map