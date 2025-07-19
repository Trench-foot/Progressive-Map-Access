/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import type { IPmcData } from "@spt/models/eft/common/IPmcData";

export class OffMapHelpers
{
    public logger;
    public accountInstance;
    public locationInstance;
    private modConfig = require("../config/config.json");
    private enableLogging: boolean = this.modConfig.enableLogging;

    public checkPreviousRaidStatus(pmcData: IPmcData): boolean
    {
        if (!this.modConfig.campingTrip)
        {
            return false;
        }
        const raidResultsPath = this.accountInstance.dbPath + "/" + pmcData._id + "/" + "lastRaidResults.json";
        const raid = this.accountInstance.readJsonFileSync(raidResultsPath);
        if (raid === undefined || raid === null)
        {
            if (this.enableLogging)
            {
                this.logger.log("Raid results undefined or null!  Returning.", "red");
            }
            return false;
        }
        const testSurvived: string = raid.RaidResult;
        if (testSurvived.includes("Survived") || testSurvived.includes("Runner"))
        {
            if (this.enableLogging)
            {
                this.logger.log("Player had a status of survived or runner", "yellow");
            }
            const test: string = raid.MapId;
            let locationResult: string;
     
            if (this.enableLogging)
            {
                this.logger.log("Testing " + test + " for matches.", "yellow");
            }
     
            for (const location in this.locationInstance.locationsArray )
            {
                if (this.enableLogging)
                {
                    this.logger.log(this.locationInstance.locationsArray[location].Id, "yellow");
                }
                if (test.includes(this.locationInstance.locationsArray[location]))
                {
                    locationResult = this.locationInstance.locationsArray[location];
                }
            }
            if (this.enableLogging)
            {
                this.logger.log(locationResult + "found, setting matching bool", "yellow");
            }
            switch (locationResult)
            {
                case "Sandbox": 
                    this.locationInstance.groundZero.Locked = false, 
                    this.checkMapAdjacence("Sandbox")
                    break;
                case "Sandbox_high": 
                    this.locationInstance.groundZeroHigh.Locked = false, 
                    this.checkMapAdjacence("Sandbox_high")
                    break;
                case "bigmap": 
                    this.locationInstance.customs.Locked = false,
                    this.checkMapAdjacence("bigmap")
                    break;
                case "factory4_day": 
                    this.locationInstance.factoryDay.Locked = false,
                    this.locationInstance.factoryNight.Locked = false,
                    this.checkMapAdjacence("factory4_day")
                    break;
                case "factory4_night": 
                    this.locationInstance.factoryDay.Locked = false,
                    this.locationInstance.factoryNight.Locked = false,
                    this.checkMapAdjacence("factory4_night")
                    break;
                case "Woods": 
                    this.locationInstance.woods.Locked = false,
                    this.checkMapAdjacence("Woods")
                    break;
                case "Interchange": 
                    this.locationInstance.interChange.Locked = false,
                    this.checkMapAdjacence("Interchange")
                    break;
                case "Shoreline": 
                    this.locationInstance.shoreLine.Locked = false,
                    this.checkMapAdjacence("Shoreline")
                    break;
                case "RezervBase": 
                    this.locationInstance.reserve.Locked = false,
                    this.checkMapAdjacence("RezervBase")
                    break;
                case "Lighthouse": 
                    this.locationInstance.lightHouse.Locked = false,
                    this.checkMapAdjacence("Lighthouse")
                    break;
                case "TarkovStreets": 
                    this.locationInstance.streets.Locked = false,
                    this.checkMapAdjacence("TarkovStreets")
                    break;
                case "laboratory": 
                    this.locationInstance.labs.Locked = false,
                    this.checkMapAdjacence("laboratory")
                    break;
                default: 
                    if (this.enableLogging)
                    {
                        this.logger.log("No matches found for " + locationResult, "red");
                    }
                    return false;
            }
            if (this.enableLogging)
            {
                this.logger.log("Operation complete " + locationResult + " should be open.", "green");
            }
            return true;
        }
        if (this.enableLogging)
        {
            this.logger.log("Player had a status other than survived or runner", "yellow");
        }
        return false;
    }

    public checkMapAdjacence(test: string)
    {
        if (!this.modConfig.campingAdjacent)
        {
            return;
        }
        switch (test)
        {
            case "Sandbox": 
                for (const location in this.locationInstance.groundZeroAdjacent )
                {
                    if (this.enableLogging)
                    {
                        this.logger.log("Extended camping trip to " + this.locationInstance.groundZeroAdjacent[location].Id, "yellow");
                    }
                    this.locationInstance.groundZeroAdjacent[location].Locked = false;
                }
                break;
            case "Sandbox_high": 
                for (const location in this.locationInstance.groundZeroAdjacent )
                {
                    if (this.enableLogging)
                    {
                        this.logger.log("Extended camping trip to " + this.locationInstance.groundZeroAdjacent[location].Id, "yellow");
                    }
                    this.locationInstance.groundZeroAdjacent[location].Locked = false;
                }
                break;
            case "bigmap": 
                for (const location in this.locationInstance.customsAdjacent )
                {
                    if (this.enableLogging)
                    {
                        this.logger.log("Extended camping trip to " + this.locationInstance.customsAdjacent[location].Id, "yellow");
                    }
                    this.locationInstance.customsAdjacent[location].Locked = false;
                }
                break;
            case "factory4_day": 
                for (const location in this.locationInstance.factoryAdjacent )
                {
                    if (this.enableLogging)
                    {
                        this.logger.log("Extended camping trip to " + this.locationInstance.factoryAdjacent[location].Id, "yellow");
                    }
                    this.locationInstance.factoryAdjacent[location].Locked = false;
                }
                break;
            case "factory4_night": 
                for (const location in this.locationInstance.factoryAdjacent )
                {
                    if (this.enableLogging)
                    {
                        this.logger.log("Extended camping trip to " + this.locationInstance.factoryAdjacent[location].Id, "yellow");
                    }
                    this.locationInstance.factoryAdjacent[location].Locked = false;
                }
                break;
            case "Woods": 
                for (const location in this.locationInstance.woodsAdjacent )
                {
                    if (this.enableLogging)
                    {
                        this.logger.log("Extended camping trip to " + this.locationInstance.woodsAdjacent[location].Id, "yellow");
                    }
                    this.locationInstance.woodsAdjacent[location].Locked = false;
                }
                break;
            case "Interchange": 
                for (const location in this.locationInstance.interChangeAdjacent )
                {
                    if (this.enableLogging)
                    {
                        this.logger.log("Extended camping trip to " + this.locationInstance.interChangeAdjacent[location].Id, "yellow");
                    }
                    this.locationInstance.interChangeAdjacent[location].Locked = false;
                }
                break;
            case "Shoreline": 
                for (const location in this.locationInstance.shoreLineAdjacent )
                {
                    if (this.enableLogging)
                    {
                        this.logger.log("Extended camping trip to " + this.locationInstance.shoreLineAdjacent[location].Id, "yellow");
                    }
                    this.locationInstance.shoreLineAdjacent[location].Locked = false;
                }
                break;
            case "RezervBase": 
                for (const location in this.locationInstance.reserveAdjacent )
                {
                    if (this.enableLogging)
                    {
                        this.logger.log("Extended camping trip to " + this.locationInstance.reserveAdjacent[location].Id, "yellow");
                    }
                    this.locationInstance.reserveAdjacent[location].Locked = false;
                }
                break;
            case "Lighthouse": 
                for (const location in this.locationInstance.lightHouseAdjacent )
                {
                    if (this.enableLogging)
                    {
                        this.logger.log("Extended camping trip to " + this.locationInstance.lightHouseAdjacent[location].Id, "yellow");
                    }
                    this.locationInstance.lightHouseAdjacent[location].Locked = false;
                }
                break;
            case "TarkovStreets": 
                for (const location in this.locationInstance.streetsAdjacent )
                {
                    if (this.enableLogging)
                    {
                        this.logger.log("Extended camping trip to " + this.locationInstance.streetsAdjacent[location].Id, "yellow");
                    }
                    this.locationInstance.streetsAdjacent[location].Locked = false;
                }
                break;
            case "laboratory": 
                for (const location in this.locationInstance.labsAdjacent )
                {
                    if (this.enableLogging)
                    {
                        this.logger.log("Extended camping trip to " + this.locationInstance.labsAdjacent[location].Id, "yellow");
                    }
                    this.locationInstance.labsAdjacent[location].Locked = false;
                }
                break;
            default: 
        }
    }
}