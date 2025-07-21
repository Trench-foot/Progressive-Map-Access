/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-var-requires */
import type { DependencyContainer } from "tsyringe";
import type { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import type { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import type { DatabaseServer } from "@spt/servers/DatabaseServer";
import type { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import type { ProfileHelper } from "@spt/helpers/ProfileHelper";
import type { IPmcData } from "@spt/models/eft/common/IPmcData";
import type { ILogger } from "@spt/models/spt/utils/ILogger";
import { StaticRouterModService } from "@spt/services/mod/staticRouter/StaticRouterModService";
import { QuestStatus } from "@spt/models/enums/QuestStatus";
import { AccountHelpers } from "./accountHelpers"; 
import { OffMapHelpers } from "./offMapHelpers";
import { LocationHelpers } from "./locationHelper";

class ProgressiveMapAccess implements IPostDBLoadMod, IPreSptLoadMod
{
    public logger: ILogger;
    private databaseServer: DatabaseServer;
    private profileHelper: ProfileHelper;

    private tables: IDatabaseTables;

    private locationInstance = new LocationHelpers();
    private accountInstance = new AccountHelpers();
    private offMapInstance = new OffMapHelpers();

    private modConfig = require("../config/config.json");
    private enableLogging: boolean = this.modConfig.enableLogging;
    private matchResults:string;

    private modName = "Progressive Map Access"
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

    public postDBLoad(container: DependencyContainer): void
    {
        this.databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        this.profileHelper = container.resolve<ProfileHelper>("ProfileHelper");
        this.tables = this.databaseServer.getTables();

        this.offMapInstance.accountInstance = this.accountInstance;
        this.offMapInstance.locationInstance = this.locationInstance;
        this.accountInstance.locationInstance = this.locationInstance;
        if (this.modConfig.enabled)
        {
            // Lock maps on server startup
            //this.setMapMappings();
            this.lockMapsOnStart();
            this.locationInstance.initializeArrays();
            this.logger.log("[PMA] Locking maps!","yellow");
        }
    }

    public preSptLoad(container: DependencyContainer): void 
    {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        this.accountInstance.logger = this.logger;
        this.offMapInstance.logger = this.logger;
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
                        // update on client game start
                        url: "/client/game/profile/create",
                        action: async (url:string, info, sessionId:string, output:string) =>
                        {
                            const currentProfile : IPmcData = this.profileHelper.getPmcProfile(sessionId);
                            if (this.enableLogging)
                            {
                                this.logger.log("Creating profile, /client/game/profile/create", "yellow");
                            }
                            this.accountInstance.createUserProfile(currentProfile);
                            return output;
                        }
                    },
                    // {
                    //     // update on quest completion, this is a double check as sometimes the user profile gets
                    //     // updated before the actual process of checking quest progress
                    //     url: "/client/game/profile/items/moving",
                    //     action: async (url:string, info, sessionId:string, output:string) =>
                    //     {
                    //         const currentProfile : IPmcData = this.profileHelper.getPmcProfile(sessionId);   
                    //         if (this.enableLogging)
                    //         {
                    //             this.logger.log("Checking quest progress, /client/game/profile/items/moving", "yellow");
                    //         }                       
                    //         this.updateQuestProgression(currentProfile);
                    //         return output;
                    //     }
                    // },
                    {
                        // update on client updating locations
                        url: "/client/locations",
                        action: async (url:string, info, sessionId:string, output:string) =>
                        {
                            const currentProfile : IPmcData = this.profileHelper.getPmcProfile(sessionId);
                            this.updateQuestProgression(currentProfile);
                            const test = this.updateMapsWait(currentProfile);   
                            if (this.enableLogging)
                            {
                                this.logger.log("Map update returned: " + test, "white");
                            }
                            if (this.enableLogging)
                            {
                                this.logger.log("[PMA] Checking map updates","yellow");
                            }                             
                            return output;
                        }
                    },
                    // {
                    //     // back up update call, this is useful if the player deleted there profile and doesn't
                    //     // have quests to accept to force the mod to check there access
                    //     url: "/client/survey/view",
                    //     action: async (url:string, info, sessionId:string, output:string) =>
                    //     {
                    //         const currentProfile : IPmcData = this.profileHelper.getPmcProfile(sessionId);   
                    //         if (this.enableLogging)
                    //         {
                    //             this.logger.log("Checking quest progress, /client/survey/view", "yellow");
                    //         }                       
                    //         this.updateQuestProgression(currentProfile);
                    //         const test = this.updateMapsWait(currentProfile);
                    //         if (this.enableLogging)
                    //         {
                    //             this.logger.log("Map update returned: " + test, "white");
                    //         }
                    //         return output;
                    //     }
                    // },
                    {
                        // back up update call, this is useful if the player deleted there profile and doesn't
                        // have quests to accept to force the mod to check there access
                        url: "/client/match/local/end",
                        action: async (url:string, info, sessionId:string, output:string) =>
                        {
                            const currentProfile : IPmcData = this.profileHelper.getPmcProfile(sessionId);  
                            this.matchResults = info;
                            this.accountInstance.writeRaidStatusJsonFile(currentProfile, this.matchResults);
                            if (this.enableLogging)
                            {
                                this.logger.log("Caching raid status, /client/match/local/end", "yellow");
                            }                       
                            return output;
                        }
                    }
                ], "spt"
            );
            // Client routes to update map
            staticRouterModService.registerStaticRouter(`StaticGetConfig${this.modName}`,
                [{
                    url: "/ProgressiveMapAccess/UserProfile/",
                    action: async (url:string, info, sessionId:string) => 
                    {
                        const currentProfile : IPmcData = this.profileHelper.getPmcProfile(sessionId);
                        const profilePath = this.accountInstance.dbPath + "/" + currentProfile._id + "/" + currentProfile._id + ".json";
                        const profile = this.accountInstance.readJsonFileSync(profilePath);
                        this.logger.log(currentProfile._id, "white");
                        return JSON.stringify(profile);
                    }
                },
                {
                    url: "/ProgressiveMapAccess/UserRaidStatus/",
                    action: async (url:string, info, sessionId:string) => 
                    {
                        const currentProfile : IPmcData = this.profileHelper.getPmcProfile(sessionId);
                        const profilePath = this.accountInstance.dbPath + "/" + currentProfile._id + "/" + "lastRaidResults.json";
                        const profile = this.accountInstance.readJsonFileSync(profilePath);
                        this.logger.log(currentProfile._id, "white");
                        return JSON.stringify(profile);
                    }
                }], "GetConfig"
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
    private lockMapsOnStart()
    {
        if (this.enableLogging)
        {
            this.logger.log("Locking map on startup", "white");
        }

        this.tables.locations.sandbox.base.Locked = true;
        this.tables.locations.sandbox_high.base.Locked = true;
        this.tables.locations.bigmap.base.Locked = true;
        this.tables.locations.factory4_day.base.Locked = true;
        this.tables.locations.factory4_night.base.Locked = true;
        this.tables.locations.woods.base.Locked = true;
        this.tables.locations.interchange.base.Locked = true;
        this.tables.locations.tarkovstreets.base.Locked = true;
        this.tables.locations.shoreline.base.Locked = true;
        this.tables.locations.lighthouse.base.Locked = true;
        this.tables.locations.rezervbase.base.Locked = true;
        this.tables.locations.laboratory.base.Locked = true;
    }
    // Function to try and make the game wait for for both location checks
    private updateMapsWait(pmcData: IPmcData)
    {
        if (this.updateQuestMapAccess(pmcData))
        {
            if (this.enableLogging)
            {
                this.logger.log("Map update completed", "green");
            }
            if (this.offMapInstance.checkPreviousRaidStatus(pmcData))
            {
                if (this.enableLogging)
                {
                    this.logger.log("Camping update complete", "yellow");                
                }
                return true;
            }
            else
            {
                if (this.enableLogging)
                {
                    this.logger.log("Camping update not complete", "yellow");
                }
                return false;
            }

        }
        else
        {
            if (this.enableLogging)
            {
                this.logger.log("Update not complete", "green");                
            }
            return false;
        }
    }
    // Updates map access based on information from created player profile
    private updateQuestMapAccess(pmcData: IPmcData): boolean
    {
        const profilePath = this.accountInstance.dbPath + "/" + pmcData._id + "/" + pmcData._id + ".json";
        const profile = this.accountInstance.readJsonFileSync(profilePath);
        if (profile === undefined || profile === null)
        {
            if (this.enableLogging)
            {
                this.logger.log("Creating player profile", "white");
            }
            this.accountInstance.createUserProfile(pmcData)
            if (this.enableLogging)
            {
                this.logger.log("Profile undefined or null!  Returning.", "red");
            }
            return false;
        }

        if (this.enableLogging)
        {
            this.logger.log("UPDATING MAP TABLE!", "green");
        }
        this.locationInstance.groundZero = profile.Maps.groundZero;
        this.locationInstance.groundZeroHigh = profile.Maps.groundZero;
        this.locationInstance.customs = profile.Maps.customs;
        this.locationInstance.factoryDay = profile.Maps.factory;
        this.locationInstance.factoryNight = profile.Maps.factory;
        this.locationInstance.woods = profile.Maps.woods;
        this.locationInstance.interChange = profile.Maps.interChange;
        this.locationInstance.streets = profile.Maps.streets;
        this.locationInstance.shoreLine = profile.Maps.shoreLine;
        this.locationInstance.lightHouse = profile.Maps.lightHouse;
        this.locationInstance.reserve = profile.Maps.reserve;
        this.locationInstance.labs = profile.Maps.labs;

        if (profile.allMapsUnlocked)
        {
            return false;
            if (this.enableLogging)
            {
                this.logger.log("[PMA] Profile has unlocked all maps, congratulations", "yellow"); 
            }
        }
        return true;
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
        
        const profilePath = this.accountInstance.dbPath + "/" + pmcData._id + "/" + pmcData._id + ".json";
        const profile = this.accountInstance.readJsonFileSync(profilePath);
        if (profile === undefined || profile === null)
        {
            // Just incase the user deletes there profiles for whatever reason,
            // this will recreate them on login
            this.accountInstance.createUserProfile(pmcData);
            if (this.enableLogging)
            {
                this.logger.log("Profile undefined or null!  Returning.", "red");
            }
            return;
        }

        if (profile.allMapsUnlocked)
        {
            if (this.enableLogging)
            {
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
        for (const quest of pmcData.Quests)
        {
            if (groundZeroBool && quest.qid === this.modConfig.GroundZero.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.GroundZero), 4))
                {
                    this.locationInstance.groundZero = false;
                    this.locationInstance.groundZeroHigh = false;
                    groundZeroBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.locationInstance.groundZero;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Ground Zero unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (customsBool && quest.qid === this.modConfig.Customs.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Customs), 4))
                {
                    this.locationInstance.customs = false;
                    customsBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.locationInstance.customs;
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Customs unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (factoryBool && quest.qid === this.modConfig.Factory.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Factory), 4))
                {
                    this.locationInstance.factoryDay = false;
                    this.locationInstance.factoryNight = false;
                    factoryBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.locationInstance.factoryDay;                        
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Factory unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (woodsBool && quest.qid === this.modConfig.Woods.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Woods), 4))
                {
                    this.locationInstance.woods = false;
                    woodsBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.locationInstance.woods;                        
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Woods unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (interChangeBool && quest.qid === this.modConfig.Interchange.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Interchange), 4))
                {
                    this.locationInstance.interChange = false;
                    interChangeBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.locationInstance.interChange;                        
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Interchange unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (streetsBool && quest.qid === this.modConfig.Streets.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Streets), 4))
                {
                    this.locationInstance.streets = false;
                    streetsBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.locationInstance.streets;                        
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Streets unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (shoreLineBool && quest.qid === this.modConfig.Shoreline.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Shoreline), 4))
                {
                    this.locationInstance.shoreLine = false;
                    shoreLineBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.locationInstance.shoreLine;                        
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Shoreline unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (lightHouseBool && quest.qid === this.modConfig.Lighthouse.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Lighthouse), 4))
                {
                    this.locationInstance.lightHouse = false;
                    lightHouseBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.locationInstance.lightHouse;                        
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Lighthouse unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (reserveBool && quest.qid === this.modConfig.Reserve.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Reserve), 4))
                {
                    this.locationInstance.reserve = false;
                    reserveBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.locationInstance.reserve;                        
                        this.logger.log(test, "yellow");
                        this.logger.log("[PMA] Reserve unlocked." + quest.qid + quest.status, "green");
                    }
                }
            }
            if (labsBool && quest.qid === this.modConfig.Labs.questID)
            {
                if (this.testBetweenNumbers(quest.status, this.getQuestStatusRequirement(this.modConfig.Labs), 4))
                {
                    this.locationInstance.labs = false;
                    labsBool = false;
                    if (this.enableLogging)
                    {
                        const test = this.locationInstance.labs;                        
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

        if (groundZeroBool && customsBool && factoryBool && woodsBool && interChangeBool
             && streetsBool && shoreLineBool && lightHouseBool && reserveBool && labsBool)
        {   
            this.logger.log("[PMA] Profile has unlocked all maps, congratulations", "yellow");
            completion = true;
        }

        if (this.enableLogging)
        {
            this.logger.log("Updating profile data.", "yellow");
        }
        
        // Writes status of map access to a new variable to be passed to a json write function
        const newProfileData =
        {
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
        }
        this.accountInstance.updateUserProfile(pmcData, newProfileData);
        if (this.enableLogging)
        {
            this.logger.log("Writing new profile data.", "yellow");              
        }
        // Update make access after update
        this.updateQuestMapAccess(pmcData);
        return;
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
}
export const mod = new ProgressiveMapAccess();
