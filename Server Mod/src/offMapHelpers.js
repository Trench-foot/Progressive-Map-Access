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
                    this.locationInstance.groundZero = false,
                        this.checkMapAdjacence("Sandbox");
                    break;
                case "Sandbox_high":
                    this.locationInstance.groundZeroHigh = false,
                        this.checkMapAdjacence("Sandbox_high");
                    break;
                case "bigmap":
                    this.locationInstance.customs = false,
                        this.checkMapAdjacence("bigmap");
                    break;
                case "factory4_day":
                    this.locationInstance.factoryDay = false,
                        this.locationInstance.factoryNight = false,
                        this.checkMapAdjacence("factory4_day");
                    break;
                case "factory4_night":
                    this.locationInstance.factoryDay = false,
                        this.locationInstance.factoryNight = false,
                        this.checkMapAdjacence("factory4_night");
                    break;
                case "Woods":
                    this.locationInstance.woods = false,
                        this.checkMapAdjacence("Woods");
                    break;
                case "Interchange":
                    this.locationInstance.interChange = false,
                        this.checkMapAdjacence("Interchange");
                    break;
                case "Shoreline":
                    this.locationInstance.shoreLine = false,
                        this.checkMapAdjacence("Shoreline");
                    break;
                case "RezervBase":
                    this.locationInstance.reserve = false,
                        this.checkMapAdjacence("RezervBase");
                    break;
                case "Lighthouse":
                    this.locationInstance.lightHouse = false,
                        this.checkMapAdjacence("Lighthouse");
                    break;
                case "TarkovStreets":
                    this.locationInstance.streets = false,
                        this.checkMapAdjacence("TarkovStreets");
                    break;
                case "laboratory":
                    this.locationInstance.labs = false,
                        this.checkMapAdjacence("laboratory");
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
    // Opens even more maps based on the campingAdditional config 
    checkMapAdjacence(test) {
        if (this.enableLogging) {
            this.logger.log("Ground Zero" + this.locationInstance.groundZero, "green");
            this.logger.log("Ground Zero High" + this.locationInstance.groundZeroHigh, "green");
            this.logger.log("Customs" + this.locationInstance.customs, "green");
            this.logger.log("Factory Day" + this.locationInstance.factoryDay, "green");
            this.logger.log("Factory Night" + this.locationInstance.factoryNight, "green");
            this.logger.log("Woods" + this.locationInstance.woods, "green");
            this.logger.log("Interchange" + this.locationInstance.interChange, "green");
            this.logger.log("Streets" + this.locationInstance.streets, "green");
            this.logger.log("Shoreline" + this.locationInstance.shoreLine, "green");
            this.logger.log("Lighthouse" + this.locationInstance.lightHouse, "green");
            this.logger.log("Reserve" + this.locationInstance.reserve, "green");
            this.logger.log("labs" + this.locationInstance.labs, "green");
        }
        if (!this.modConfig.campingAdjacent) {
            return;
        }
        switch (test) {
            case "Sandbox":
                for (const location in this.locationInstance.groundZeroAdjacent) {
                    if (this.enableLogging) {
                        this.logger.log("Extended camping trip to " + this.locationInstance.groundZeroAdjacent[location], "yellow");
                    }
                    this.locationInstance.groundZeroAdjacent[location] = false;
                }
                break;
            case "Sandbox_high":
                for (const location in this.locationInstance.groundZeroAdjacent) {
                    if (this.enableLogging) {
                        this.logger.log("Extended camping trip to " + this.locationInstance.groundZeroAdjacent[location], "yellow");
                    }
                    this.locationInstance.groundZeroAdjacent[location] = false;
                }
                break;
            case "bigmap":
                for (const location in this.locationInstance.customsAdjacent) {
                    if (this.enableLogging) {
                        this.logger.log("Extended camping trip to " + this.locationInstance.customsAdjacent[location], "yellow");
                    }
                    this.locationInstance.customsAdjacent[location] = false;
                }
                break;
            case "factory4_day":
                for (const location in this.locationInstance.factoryAdjacent) {
                    if (this.enableLogging) {
                        this.logger.log("Extended camping trip to " + this.locationInstance.factoryAdjacent[location], "yellow");
                    }
                    this.locationInstance.factoryAdjacent[location] = false;
                }
                break;
            case "factory4_night":
                for (const location in this.locationInstance.factoryAdjacent) {
                    if (this.enableLogging) {
                        this.logger.log("Extended camping trip to " + this.locationInstance.factoryAdjacent[location], "yellow");
                    }
                    this.locationInstance.factoryAdjacent[location] = false;
                }
                break;
            case "Woods":
                for (const location in this.locationInstance.woodsAdjacent) {
                    if (this.enableLogging) {
                        this.logger.log("Extended camping trip to " + this.locationInstance.woodsAdjacent[location], "yellow");
                    }
                    this.locationInstance.woodsAdjacent[location] = false;
                }
                break;
            case "Interchange":
                for (const location in this.locationInstance.interChangeAdjacent) {
                    if (this.enableLogging) {
                        this.logger.log("Extended camping trip to " + this.locationInstance.interChangeAdjacent[location], "yellow");
                    }
                    this.locationInstance.interChangeAdjacent[location] = false;
                }
                break;
            case "Shoreline":
                for (const location in this.locationInstance.shoreLineAdjacent) {
                    if (this.enableLogging) {
                        this.logger.log("Extended camping trip to " + this.locationInstance.shoreLineAdjacent[location], "yellow");
                    }
                    this.locationInstance.shoreLineAdjacent[location] = false;
                }
                break;
            case "RezervBase":
                for (const location in this.locationInstance.reserveAdjacent) {
                    if (this.enableLogging) {
                        this.logger.log("Extended camping trip to " + this.locationInstance.reserveAdjacent[location], "yellow");
                    }
                    this.locationInstance.reserveAdjacent[location] = false;
                }
                break;
            case "Lighthouse":
                for (const location in this.locationInstance.lightHouseAdjacent) {
                    if (this.enableLogging) {
                        this.logger.log("Extended camping trip to " + this.locationInstance.lightHouseAdjacent[location], "yellow");
                    }
                    this.locationInstance.lightHouseAdjacent[location] = false;
                }
                break;
            case "TarkovStreets":
                for (const location in this.locationInstance.streetsAdjacent) {
                    if (this.enableLogging) {
                        this.logger.log("Extended camping trip to " + this.locationInstance.streetsAdjacent[location], "yellow");
                    }
                    this.locationInstance.streetsAdjacent[location] = false;
                }
                break;
            case "laboratory":
                for (const location in this.locationInstance.labsAdjacent) {
                    if (this.enableLogging) {
                        this.logger.log("Extended camping trip to " + this.locationInstance.labsAdjacent[location], "yellow");
                    }
                    this.locationInstance.labsAdjacent[location] = false;
                }
                break;
            default:
        }
    }
}
exports.OffMapHelpers = OffMapHelpers;
//# sourceMappingURL=offMapHelpers.js.map