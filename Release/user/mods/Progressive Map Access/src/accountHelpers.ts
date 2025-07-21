/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import type { IPmcData } from "@spt/models/eft/common/IPmcData";
import path from "path";
import fs from "fs";

export class AccountHelpers
{
    public logger;
    private modConfig = require("../config/config.json");
    public locationInstance;
    public currentDirectory: string = __dirname;
    public dbPath: string = path.join(this.currentDirectory, "..", "db");

    // Creates the new user profiles if they don't exist, error checking and everything
    public createUserProfile(pmcData: IPmcData): boolean
    {
        const pmc = pmcData._id;

        // Returns in case the user pmc data is not complete, normally only on account creation or the json was deleted
        if (pmc === undefined)
        {
            if (this.modConfig.enableLogging)
            {
                this.logger.log("PMC ID undefined, creating a new account?" + pmc, "red");
            }
            return false;
        }
        // Create the user fold incase it doesn't exist
        this.creaateUserFolderSync(pmcData);
        // Profile settings match the default lock status of the modConfig
        const user = 
        {
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
        }
        const userJson = JSON.stringify(user, null, 2);
        const filePath = this.dbPath + "/" + pmc + "/" + pmc + ".json";

        fs.writeFile(filePath, userJson, { flag: "wx" }, (err) => 
        {
            if (err) 
            {
                if (err.code === "EEXIST")
                {
                    if (this.modConfig.enableLogging)
                    {
                        this.logger.log("File already exists.  No new file created.", "yellow");
                    }
                    return true;
                }
                else
                {
                    if (this.modConfig.enableLogging)
                    {
                        this.logger.log("Error writing file:" + err, "red"); 
                    }
                    return false;
                }
            } 
            else 
            {
                if (this.modConfig.enableLogging)
                {
                    this.logger.log("JSON file created successfully.", "green");
                }
                return true;
            }
        })
    }
    // Updates the user profile after quest status checked
    public updateUserProfile(pmcData: IPmcData, data: any)
    {
        const pmc = pmcData._id;

        const userJson = JSON.stringify(data, null, 2);
        const filePath = this.dbPath + "/" + pmc + "/" + pmc + ".json";

        fs.writeFile(filePath, userJson, { flag: "r+" }, (err) => 
        {
            if (err) 
            {
                if (this.modConfig.enableLogging)
                {
                    this.logger.log("Error writing files:" + err, "red");
                }
            } 
            else 
            {
                if (this.modConfig.enableLogging)
                {
                    this.logger.log("Successfully wrote file", "green");
                }
            }
        })
    }
    // Creates and updates the users last raid status
    public writeRaidStatusJsonFile (pmcData: IPmcData, raidResult: any)
    {
        const pmc = pmcData._id;
        const serverID: string = raidResult.serverId;

        if (serverID.includes("Savage") )
        {
            if (this.modConfig.enableLogging)
            {
                this.logger.log("Scav raid detected, skipping", "yellow");                
            }

            return;
        }

        const user = 
        {
            MapId: raidResult.serverId,
            RaidResult: raidResult.results.result,
            Exit: raidResult.results.exitName,
            Camping: this.modConfig.campingTrip,
            ExtendedCamping:  this.modConfig.campingAdjacent,
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
        }

        const userJson = JSON.stringify(user, null, 2);
        const filePath = this.dbPath + "/" + pmc + "/" + "lastRaidResults.json";

        fs.writeFile(filePath, userJson, (err) => 
        {
            if (err) 
            {
                if (err.code === "EEXIST")
                {
                    if (this.modConfig.enableLogging)
                    {
                        this.logger.log("Raid results already exists.  No new file created.", "yellow");
                    }
                    return true;
                }
                else
                {
                    if (this.modConfig.enableLogging)
                    {
                        this.logger.log("Error writing file:" + err, "red"); 
                    }
                    return false;
                }
            } 
            else 
            {
                if (this.modConfig.enableLogging)
                {
                    this.logger.log("JSON file created successfully.", "green");
                }
                return true;
            }
        })
    }

    // Updates the user profile after quest status checked
    public updateRaidStatus(pmcData: IPmcData, raidResult: any)
    {
        const pmc = pmcData._id;

        const userJson = JSON.stringify(raidResult, null, 2);
        const filePath = this.dbPath + "/" + pmc + "/" + "lastRaidResults.json";

        fs.writeFile(filePath, userJson, (err) => 
        {
            if (err) 
            {
                if (this.modConfig.enableLogging)
                {
                    this.logger.log("Error writing files:" + err, "red");
                }
            } 
            else 
            {
                if (this.modConfig.enableLogging)
                {
                    this.logger.log("Successfully wrote file", "green");
                }
            }
        })
    }
    // Creates the new users folder if it doesn't exist
    public creaateUserFolderSync(pmcData: IPmcData)
    {   
        if (this.modConfig.enableLogging)
        {
            this.logger.log("Creating folder", "yellow"); 
        }
        const pmc = pmcData._id;
        const filePath = this.dbPath + "/" + pmc;

        try 
        {
            fs.mkdirSync(filePath, { recursive: true });
            if (this.modConfig.enableLogging)
            {
                this.logger.log("Directory " + filePath + " created successfully (synchronously)!", "white");
            }
        }
        catch (error: any) 
        {
            if ((error as NodeJS.ErrnoException).code === "EEXIST") 
            {
                if (this.modConfig.enableLogging)
                {
                    this.logger.log("Directory " + filePath + " already exists (synchronously).", "white");
                }
            }
            else 
            {
                if (this.modConfig.enableLogging)
                {
                    this.logger.log("Error creating directory synchronously: " + filePath, "red");
                }
            }
        }
    }
    // Read JSON files
    public readJsonFileSync(filePath: string) 
    {
        try 
        {
            return JSON.parse(fs.readFileSync(filePath, "utf-8"));
        } 
        
        catch (error: any) 
        {
            if (error.code === "ENOENT")
            {
                if (this.modConfig.enableLogging)
                {
                    this.logger.log("Could not find file at: " + filePath + "Complete a raid to create one.", "red");
                }
                // Returns null to prevent this from freezing the server on error.
                // Only really happens during the intitial profile creation because this
                // process can't wait its turn.
                return null;
            }
            if (this.modConfig.enableLogging)
            {
                this.logger.log("Error reading or parsing JSON file at: " + filePath, "red");
            }
            return null;
        }
    }
}