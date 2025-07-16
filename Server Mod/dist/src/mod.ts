/* eslint-disable @typescript-eslint/no-var-requires */
import type { DependencyContainer } from "tsyringe";
import type { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import type { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import type { DatabaseServer } from "@spt/servers/DatabaseServer";
import type { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import type { ProfileHelper } from "@spt/helpers/ProfileHelper";
import type { IPmcData } from "@spt/models/eft/common/IPmcData";
import type { ILogger } from "@spt/models/spt/utils/ILogger";
import type { StaticRouterModService } from "@spt/services/mod/staticRouter/StaticRouterModService";
import { QuestStatus } from "@spt/models/enums/QuestStatus";
import path from "path";
import fs from "fs";

class ProgressiveMapAccess implements IPostDBLoadMod, IPreSptLoadMod
{
    private logger: ILogger;
    private databaseServer: DatabaseServer;
    private profileHelper: ProfileHelper;

    private tables: IDatabaseTables;

    private modConfig = require("../config/config.json");
    private enableLogging: boolean = false;
    private groundZero;
    private groundZeroHigh;
    private customs;
    private factoryDay;
    private factoryNight;
    private woods;
    private interChange;
    private streets;
    private shoreLine;
    private lightHouse;
    private reserve;
    private labs;

    private currentDirectory: string = __dirname;
    private dbPath: string = path.join(this.currentDirectory, "..", "db");

    public postDBLoad(container: DependencyContainer): void
    {
        this.databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        this.profileHelper = container.resolve<ProfileHelper>("ProfileHelper");
        this.tables = this.databaseServer.getTables();
        if (this.modConfig.enabled)
        {
            // Lock maps on server startup
            this.setMapMappings();
            this.lockMapsOnStart();
            this.logger.log("[PMA] Locking maps!","yellow");
        }
    }

    public preSptLoad(container: DependencyContainer): void 
    {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        const staticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService");

        if (this.modConfig.enabled)
        {
            staticRouterModService.registerStaticRouter(
                "[PMA]",
                [
                    {
                        // update on client game start
                        url: "/client/game/start",
                        action: async (url:string, info, sessionId:string, output:string) =>
                        {
                            const currentProfile : IPmcData = this.profileHelper.getPmcProfile(sessionId);
                            if (this.enableLogging)
                            {
                                this.logger.log("Checking quest progress, /client/game/start", "yellow");
                            }
                            this.updateQuestProgression(currentProfile);
                            return output;
                        }
                    },
                    {
                        // back up update call, this is useful if the player deleted there profile and doesn't
                        // have quests to accept to force the mod to check there access
                        url: "/client/survey/view",
                        action: async (url:string, info, sessionId:string, output:string) =>
                        {
                            const currentProfile : IPmcData = this.profileHelper.getPmcProfile(sessionId);   
                            if (this.enableLogging)
                            {
                                this.logger.log("Checking quest progress, /client/survey/view", "yellow");
                            }                       
                            this.updateQuestProgression(currentProfile);
                            this.updateMapAccess(currentProfile);
                            return output;
                        }
                    },
                    {
                        // update on quest completion
                        url: "/client/mail/dialog/info",
                        action: async (url:string, info, sessionId:string, output:string) =>
                        {
                            const currentProfile : IPmcData = this.profileHelper.getPmcProfile(sessionId);   
                            if (this.enableLogging)
                            {
                                this.logger.log("Checking quest progress, /client/mail/dialog/info", "yellow");
                            }                       
                            this.updateMapAccess(currentProfile);
                            return output;
                        }
                    },
                    {
                        // update on quest completion
                        url: "/client/game/profile/items/moving",
                        action: async (url:string, info, sessionId:string, output:string) =>
                        {
                            const currentProfile : IPmcData = this.profileHelper.getPmcProfile(sessionId);   
                            if (this.enableLogging)
                            {
                                this.logger.log("Checking quest progress, /client/game/profile/items/moving", "yellow");
                            }                       
                            this.updateQuestProgression(currentProfile);
                            return output;
                        }
                    },
                    {
                        // update on client updating locations
                        url: "/client/locations",
                        action: async (url:string, info, sessionId:string, output:string) =>
                        {
                            const currentProfile : IPmcData = this.profileHelper.getPmcProfile(sessionId);
                            this.updateMapAccess(currentProfile);   
                            if (this.enableLogging)
                            {
                                this.logger.log("[PMA] Checking map updates","yellow");
                            }                             
                            return output;
                        }
                    }
                ], "spt"
            );
        } 
    }
    // Maps the base files for all maps
    private setMapMappings()
    {
        if (this.enableLogging)
        {
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
    private lockMapsOnStart()
    {
        if (this.enableLogging)
        {
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
    private updateMapAccess(pmcData: IPmcData)
    {
        if (this.enableLogging)
        {
            this.logger.log("Creating player profile", "white");
        }
        this.createUserProfile(pmcData)

        const profilePath = this.dbPath + "/" + pmcData._id + ".json";
        const profile = this.readJsonFileSync(profilePath);
        if (profile === undefined || profile === null)
        {
            if (this.enableLogging)
            {
                this.logger.log("Profile undefined or null!  Returning.", "red");
            }
            return;
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
        if (this.enableLogging)
        {
            this.logger.log("UPDATING MAP TABLE!", "green");
        }
    }
    // Converts the modConfig map bool to a queststatus
    private getQuestStatusRequirement(mapConfig: any): QuestStatus
    {
        // Returns 2
        const questStarted = QuestStatus.Started;
        // Returns 4
        const questCompleted = QuestStatus.Success;

        if (mapConfig.requireQuestStarted)
        {
            if (this.enableLogging)
            {
                this.logger.log("Returned questStarted", "white");
            }
            return questStarted;
        }
        else if (mapConfig.requireQuestCompleted)
        {
            if (this.enableLogging)
            {
                this.logger.log("Returned questCompleted", "white");
            }
            return questCompleted;
        }
    }
    // Checks if quest status is between the config requirement and the completed status
    private testBetweenNumbers(value: number , min: number, max: number): boolean
    {
        return value >= min && value <= max;
    }
    // Compairs pmc quest status with the requirements for unlock
    private updateQuestProgression (pmcData: IPmcData)
    {   
        // Checks if profile has quests, returns if none
        if (pmcData.Quests === undefined)
        {
            if (this.enableLogging)
            {
                this.logger.log("[PMA] Profile is empty. New or broken profile, maps locked.", "yellow");               
            }
            this.lockMapsOnStart();            
            return
        }

        // Just incase the user deletes there profiles for whatever reason,
        // this will recreate them on login
        this.createUserProfile(pmcData);
        const profilePath = this.dbPath + "/" + pmcData._id + ".json";
        const profile = this.readJsonFileSync(profilePath);
        if (profile === undefined || profile === null)
        {
            if (this.enableLogging)
            {
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
        for (const quest of pmcData.Quests)
        {
            if (groundZeroBool && quest.qid === this.modConfig.GroundZero.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.GroundZero), 4))
                {
                    this.groundZero.Locked = false;
                    this.groundZeroHigh.Locked = false;
                    groundZeroBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.groundZero.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Ground Zero unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (customsBool && quest.qid === this.modConfig.Customs.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Customs), 4))
                {
                    this.customs.Locked = false;
                    customsBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.customs.Locked;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Customs unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (factoryBool && quest.qid === this.modConfig.Factory.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Factory), 4))
                {
                    this.factoryDay.Locked = false;
                    this.factoryNight.Locked = false;
                    factoryBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.factoryDay.Locked;                        
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Factory unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (woodsBool && quest.qid === this.modConfig.Woods.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Woods), 4))
                {
                    this.woods.Locked = false;
                    woodsBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.woods.Locked;                        
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Woods unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (interChangeBool && quest.qid === this.modConfig.Interchange.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Interchange), 4))
                {
                    this.interChange.Locked = false;
                    interChangeBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.interChange.Locked;                        
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Interchange unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (streetsBool && quest.qid === this.modConfig.Streets.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Streets), 4))
                {
                    this.streets.Locked = false;
                    streetsBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.streets.Locked;                        
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Streets unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (shoreLineBool && quest.qid === this.modConfig.Shoreline.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Shoreline), 4))
                {
                    this.shoreLine.Locked = false;
                    shoreLineBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.shoreLine.Locked;                        
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Shoreline unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (lightHouseBool && quest.qid === this.modConfig.Lighthouse.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Lighthouse), 4))
                {
                    this.lightHouse.Locked = false;
                    lightHouseBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.lightHouse.Locked;                        
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Lighthouse unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (reserveBool && quest.qid === this.modConfig.Reserve.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Reserve), 4))
                {
                    this.reserve.Locked = false;
                    reserveBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.reserve.Locked;                        
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Reserve unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (labsBool && quest.qid === this.modConfig.Labs.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Labs), 4))
                {
                    this.labs.Locked = false;
                    labsBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.labs.Locked;                        
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Laboratory unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            else
            {
                if (this.enableLogging)
                {
                    this.logger.log("No quest matches for" + quest.qid, "red");
                }
            }
        }
        if (this.enableLogging)
        {
            this.logger.log("Updating profile data.", "yellow");
        }
        
        // Writes status of map access to a new variable to be passed to a json write function
        const newProfileData =
        {
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
        }
        this.updateUserProfile(pmcData, newProfileData);
        if (this.enableLogging)
        {
            this.logger.log("Writing new profile data.", "yellow");              
        }
        // Update make access after update
        this.updateMapAccess(pmcData);
        return;
    }
    // Creates the new user profiles if they don't exist, error checking and everything
    private createUserProfile(pmcData: IPmcData): boolean
    {
        const pmc = pmcData._id;

        // Returns in case the user pmc data is not complete, normally only on account creation or the json was deleted
        if (pmc === undefined)
        {
            if (this.enableLogging)
            {
                this.logger.log("PMC ID undefined, creating a new account?" + pmc, "red");
            }
            return false;
        }
        // Profile settings match the default lock status of the modConfig
        const user = 
        {
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
        }
        const userJson = JSON.stringify(user, null, 2);
        const filePath = this.dbPath + "/" + pmc + ".json";

        fs.writeFile(filePath, userJson, { flag: "wx" }, (err) => 
        {
            if (err) 
            {
                if (err.code === "EEXIST")
                {
                    if (this.enableLogging)
                    {
                        this.logger.log("File already exists.  No new file created.", "yellow");
                    }
                    return true;
                }
                else
                {
                    if (this.enableLogging)
                    {
                        this.logger.log("Error writing file:" + err, "red"); 
                    }
                    return false;
                }
            } 
            else 
            {
                if (this.enableLogging)
                {
                    this.logger.log("JSON file created successfully.", "green");
                }
                return true;
            }
        })
    }
    // Updates the user profile after quest status checked
    private updateUserProfile(pmcData: IPmcData, data: any)
    {
        const pmc = pmcData._id;

        const userJson = JSON.stringify(data, null, 2);
        const filePath = this.dbPath + "/" + pmc + ".json";

        fs.writeFile(filePath, userJson, { flag: "r+" }, (err) => 
        {
            if (err) 
            {
                if (this.enableLogging)
                {
                    this.logger.log("Error writing files:" + err, "red");
                }
            } 
            else 
            {
                if (this.enableLogging)
                {
                    this.logger.log("Successfully wrote file", "green");
                }
            }
        })
    }
    // Read JSON files
    readJsonFileSync(filePath: string) 
    {
        try 
        {
            return JSON.parse(fs.readFileSync(filePath, "utf-8"));
        } 
        
        catch (error: any) 
        {
            if (error.code === "ENOENT")
            {
                if (this.enableLogging)
                {
                    this.logger.log("Could not find file:", "red");
                }
                // Returns null to prevent this from freezing the server on error.
                // Only really happens during the intitial profile creation because this
                // process can't wait its turn.
                return null;
            }
            if (this.enableLogging)
            {
                this.logger.log("Error reading or parsing JSON file:" + error.message, "red");
            }
            return null;
        }
    }
}
export const mod = new ProgressiveMapAccess();
