using BepInEx;
using BepInEx.Bootstrap;
using BepInEx.Logging;
using Comfort.Common;
using EFT.InventoryLogic;
using EFT.UI;
using EFT.UI.Screens;
using ProgressiveMapAccess.Helpers;
using System;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.SceneManagement;
using SPT.Common.Http;
using ProgressiveMapAccess.ModConfig;
using System.Collections.Generic;
using System.IO.MemoryMappedFiles;

namespace ProgressiveMapAccess
{
    [BepInPlugin("ProgressiveMapAccess", "ProgressiveMapAccess", "1.0.0")]
    [BepInDependency("com.SPT.core", "3.11.0")]
    public class Plugin : BaseUnityPlugin
    {
        public bool enableLogging = false;
        public bool raidStatusExists = false;
        public bool mapUpdated = false;
        public Class303 class303_0;
        internal static Plugin Instance { get; set; }
        internal ManualLogSource Log { get; set; }
        private static UI_Mappings uiMappings;
        private CurrentScreenSingletonClass currentScreenSingletonClass = null;

        internal static UI_Mappings UiMappings { get => uiMappings; set => uiMappings = value; }

        IDictionary<string, bool> mapAvailable = new Dictionary<string, bool>();

        IDictionary<string, bool> raidStatusAvailable = new Dictionary<string, bool>();

        #region Test Methods
        // Check if the game is ready to be played, if so, return true, otherwise return false
        private bool testGameReady()
        {
            if (!Singleton<CommonUI>.Instantiated)
            {
                return false;
            }
            if (!Singleton<PreloaderUI>.Instantiated)
            {
                return false;
            }
            return true;
        }
        private bool isMapSelectionScreenFocus()
        {
            var mapSelectionScreen = Singleton<MenuUI>.Instance.MatchMakerSelectionLocationScreen;
            if (mapSelectionScreen.isActiveAndEnabled)
            {
                if (enableLogging)
                {
                    Log.LogInfo("Map selection screen is focused.");
                }
                return true;
            }
            return false;
        }
        // Check current screen type, kept for testing purposes
        private EEftScreenType getCurrentScreen()
        {
            if (currentScreenSingletonClass == null)
            {
                currentScreenSingletonClass = CurrentScreenSingletonClass.Instance;
            }

            EEftScreenType _eScreenType = currentScreenSingletonClass.CurrentScreenController.ScreenType;

            if (_eScreenType == null)
            {
                if (enableLogging)
                {
                    Log.LogInfo("Current screen is null, return none");
                }
                return EEftScreenType.None;
            }

            if (enableLogging)
            {
                Log.LogInfo($"Current screen type: {_eScreenType}");
            }
            return _eScreenType;
        }
        #endregion
        private void Awake()
        {
            Instance = this;
            Log = Logger;
            UiMappings = new UI_Mappings();

            new MatchMakerSideSelectionScreenPatch().Enable();
            new MatchMakerMapPointsScreenPatch().Enable();
            new Class303Patch().Enable();
            //new MatchMakerSelectLocationScreenPatch().Enable();
            //new MatchMakerSelectLocationScreenPatch2().Enable();
        }

        #region Test Methods
        // Checks if the scav loot transfer screen is open
        private bool TestMapSelectionScreenOpen()
        {
            var _locationSelectionScreen = Singleton<MenuUI>.Instance.MatchMakerSelectionLocationScreen;
            if (_locationSelectionScreen.isActiveAndEnabled)
            {

                return true;
            }
            return false;
        }
        // Check if the game is ready to be played, if so, return true, otherwise return false
        private bool TestGameReady()
        {
            if (!Singleton<CommonUI>.Instantiated)
            {
                return false;
            }
            if (!Singleton<PreloaderUI>.Instantiated)
            {
                return false;
            }
            if(!Singleton<MenuUI>.Instantiated)
            {
                //Log.LogInfo("MenuUI not ready");
                return false;
            }
            if (!TestMapSelectionScreenOpen())
            {
                mapUpdated = false;
                return false;
            }
            return true;
        }
        // Check current scene
        private string GetCurrentScene()
        {
            string _currentScene = SceneManager.GetActiveScene().name;
            if (_currentScene == null || _currentScene == string.Empty)
            {
                if (enableLogging)
                {
                    Log.LogInfo("Current scene is null or empty");
                }
                return "Unknown";
            }

            if (enableLogging)
            {
                Log.LogInfo($"Current scene: {_currentScene}");
            }

            return _currentScene;
        }
        // Check current screen type, kept for testing purposes
        private EEftScreenType GetCurrentScreen()
        {
            if (currentScreenSingletonClass == null)
            {
                currentScreenSingletonClass = CurrentScreenSingletonClass.Instance;
            }

            EEftScreenType _eScreenType = currentScreenSingletonClass.CurrentScreenController.ScreenType;

            if (_eScreenType == null)
            {
                if (enableLogging)
                {
                    Log.LogInfo("Current screen is null, return none");
                }
                return EEftScreenType.None;
            }

            if (enableLogging)
            {
                Log.LogInfo($"Current screen type: {_eScreenType}");
            }
            return _eScreenType;
        }
        #endregion

        public void LateUpdate()
        {
            if (Input.GetKeyDown(KeyCode.L))
            {
                Log.LogInfo(GetCurrentScreen());
                Log.LogInfo(GetCurrentScene());
                UiMappings.setSelectSideMappings();
            }

            if (Input.GetKeyDown(KeyCode.B))
            {
                updateMapSelectScreen();
            }

            if (Input.GetKeyDown(KeyCode.P))
            {
                testSelectedMap();
            }

            if (!TestGameReady()) return;
            updateMapSelectScreen();
            testSelectedMap();

        }

        // Loops through all map button gameobjects, then calls another function
        // to test them to see if they are disabled.
        // Activates the conditions panel and the next button if the map is unlocked
        public void testSelectedMap()
        {
            //UiMappings.setMapSelectionScreen();
            foreach (GameObject location in UiMappings.locations)
            {
                if (location == null)
                {
                    int i = UiMappings.locations.Count;
                    if(enableLogging) Log.LogError("location is null," + $"{ i }");
                    UiMappings.setMapSelectionScreen();
                }
                if(enableLogging) Log.LogInfo($"{location.name}" + "Tested");
                bool test = UiMappings.SetButtonAvailable(location, true);
                if(test)
                {
                    if (enableLogging) Log.LogInfo("Map found!  Ending loop.");
                    break;
                }
            }
        }
        // Update unlocked map locations on screen opening
        public void updateMapSelectScreen()
        {
            if (mapUpdated) return;
            RequestConfigs();
            //Log.LogInfo("updateMapselectscreen called");
            UiMappings.setMapSelectionScreen();
            if (raidStatusExists)
            {
                if (UiMappings.locations.Count <1)
                {
                    int i = UiMappings.locations.Count;
                    if (enableLogging) Log.LogError("location is null," + $"{i}");
                    UiMappings.setMapSelectionScreen();
                }
                foreach (GameObject location in UiMappings.locations)
                {
                    // Unlock all maps if the player has completely unlocked them
                    if(JsonHelper.UserProfile.AllMapsUnlocked)
                    {
                        if (enableLogging) Log.LogInfo("Unlocking all maps!");
                        UiMappings.UnlockMapLocation(location);
                    }
                    if (enableLogging) Log.LogInfo("locations being checked");
                    //bool result};
                    if (!raidStatusAvailable[UiMappings.getMapName(location)])
                    {
                        if (enableLogging) Log.LogInfo(raidStatusAvailable[UiMappings.getMapName(location)] + " test result");
                        UiMappings.UnlockMapLocation(location);
                        if (enableLogging) Log.LogInfo(UiMappings.getMapName(location) + " Unlocked");
                    }
                }
            }
            else
            {
                foreach (GameObject location in UiMappings.locations)
                {
                    if (location == null)
                    {
                        int i = UiMappings.locations.Count;
                        if (enableLogging) Log.LogError("location is null," + $"{i}");
                        UiMappings.setMapSelectionScreen();
                    }
                    // Unlock all maps if the player has completely unlocked them
                    if (JsonHelper.UserProfile.AllMapsUnlocked)
                    {
                        if (enableLogging) Log.LogInfo("Unlocking all maps!");
                        UiMappings.UnlockMapLocation(location);
                    }
                    if (!mapAvailable[UiMappings.getMapName(location)])
                    {
                        if(enableLogging) Log.LogInfo(mapAvailable[UiMappings.getMapName(location)] + " test result");
                        UiMappings.UnlockMapLocation(location);
                        if (enableLogging) Log.LogInfo(UiMappings.getMapName(location) + " Unlocked");
                    }
                }
            }
            // Deactivate any active next buttons or conditions panels, just incase one has been kept from
            // previously opening the screen
            UiMappings.ClearButtonAvailable(null);
            mapUpdated = true;
        }
        // Consolidate both server calls so I can fire them when the player opens a specific screen
        public void RequestConfigs()
        {
            RequestUserProfile();
            RequestUserRaidStatus();
        }
        // Get the players unlocked map status from the server
        private void RequestUserProfile()
        {
            string sessionID = RequestHandler.SessionId.ToString();

            Log.LogInfo($"{sessionID}");

            string json = RequestHandler.GetJson("/ProgressiveMapAccess/UserProfile/");
            if (json == "null")
            {
                Log.LogInfo("User profile json returned null, returning");
                return;
            }
            else
            { 
                JsonHelper.GetUserProfile(json);
                UpdateUserMapsDictionary();
                if (!enableLogging) return;
                Log.LogInfo($"{json}");
            }
        }
        // Get the players raid status file from the server
        private void RequestUserRaidStatus()
        {
            string sessionID = RequestHandler.SessionId.ToString();

            Log.LogInfo($"{sessionID}");

            string json = RequestHandler.GetJson("/ProgressiveMapAccess/UserRaidStatus/");
            if (json == "null")
            {
                raidStatusExists = false;
                Log.LogInfo("Raid status json returned null, returning");
                return;
            }
            else
            {
                raidStatusExists = true;
                JsonHelper.GetRaidStatus(json);
                UpdateRaidMapsDictionary();
                if (!enableLogging) return;
                Log.LogInfo($"{json}");
            }
        }
        // Add current players available maps to the maps dictionary
        private void UpdateUserMapsDictionary()
        {
            mapAvailable.Clear();
            mapAvailable.Add("ground zero", JsonHelper.UserProfile.Maps.groundZeroLocked);
            mapAvailable.Add("customs", JsonHelper.UserProfile.Maps.customsLocked);
            mapAvailable.Add("factory", JsonHelper.UserProfile.Maps.factroyLocked);
            mapAvailable.Add("woods", JsonHelper.UserProfile.Maps.woodsLocked);
            mapAvailable.Add("interchange", JsonHelper.UserProfile.Maps.interChangeLocked);
            mapAvailable.Add("streets of tarkov", JsonHelper.UserProfile.Maps.streetsLocked);
            mapAvailable.Add("shoreline", JsonHelper.UserProfile.Maps.shoreLineLocked);
            mapAvailable.Add("lighthouse", JsonHelper.UserProfile.Maps.lightHouseLocked);
            mapAvailable.Add("reserve", JsonHelper.UserProfile.Maps.reserveLocked);
            mapAvailable.Add("the lab", JsonHelper.UserProfile.Maps.labsLocked);
        }
        // Add current players raid settings to the raid maps dictionary
        private void UpdateRaidMapsDictionary()
        {
            raidStatusAvailable.Clear();
            raidStatusAvailable.Add("ground zero", JsonHelper.RaidStatus.Maps.groundZeroLocked);
            raidStatusAvailable.Add("customs", JsonHelper.RaidStatus.Maps.customsLocked);
            raidStatusAvailable.Add("factory", JsonHelper.RaidStatus.Maps.factroyLocked);
            raidStatusAvailable.Add("woods", JsonHelper.RaidStatus.Maps.woodsLocked);
            raidStatusAvailable.Add("interchange", JsonHelper.RaidStatus.Maps.interChangeLocked);
            raidStatusAvailable.Add("streets of tarkov", JsonHelper.RaidStatus.Maps.streetsLocked);
            raidStatusAvailable.Add("shoreline", JsonHelper.RaidStatus.Maps.shoreLineLocked);
            raidStatusAvailable.Add("lighthouse", JsonHelper.RaidStatus.Maps.lightHouseLocked);
            raidStatusAvailable.Add("reserve", JsonHelper.RaidStatus.Maps.reserveLocked);
            raidStatusAvailable.Add("the lab", JsonHelper.RaidStatus.Maps.labsLocked);
        }
        
        // Only used for debuging, keeping it just incase
        private void ShowProfile()
        {
            Log.LogInfo("UserID: " + $"{JsonHelper.UserProfile.UserID}");
            Log.LogInfo("AllMapsUnlocked: " + $"{JsonHelper.UserProfile.AllMapsUnlocked}");
            Log.LogInfo("Ground Zero: " + $"{JsonHelper.UserProfile.Maps.groundZeroLocked}");
            Log.LogInfo("Customs: " + $"{JsonHelper.UserProfile.Maps.customsLocked}");
            Log.LogInfo("Factory: " + $"{JsonHelper.UserProfile.Maps.factroyLocked}");
            Log.LogInfo("Woods: " + $"{JsonHelper.UserProfile.Maps.woodsLocked}");
            Log.LogInfo("Interchange: " + $"{JsonHelper.UserProfile.Maps.interChangeLocked}");
            Log.LogInfo("Streets: " + $"{JsonHelper.UserProfile.Maps.streetsLocked}");
            Log.LogInfo("Shoreline: " + $"{JsonHelper.UserProfile.Maps.shoreLineLocked}");
            Log.LogInfo("Lighthouse: " + $"{JsonHelper.UserProfile.Maps.lightHouseLocked}");
            Log.LogInfo("Reserve: " + $"{JsonHelper.UserProfile.Maps.reserveLocked}");
            Log.LogInfo("Labs: " + $"{JsonHelper.UserProfile.Maps.labsLocked}");

            if (!raidStatusExists) return;
            Log.LogInfo("MapId: " + $"{JsonHelper.RaidStatus.mapId}");
            Log.LogInfo("RaidResults: " + $"{JsonHelper.RaidStatus.raidResult}");
            Log.LogInfo("Exit: " + $"{JsonHelper.RaidStatus.exit}");
            Log.LogInfo("Camping bool: " + $"{JsonHelper.RaidStatus.camping}");
            Log.LogInfo("Extended Camping bool: " + $"{JsonHelper.RaidStatus.extendedCamping}");
            Log.LogInfo("Ground Zero: " + $"{JsonHelper.RaidStatus.Maps.groundZeroLocked}");
            Log.LogInfo("Customs: " + $"{JsonHelper.RaidStatus.Maps.customsLocked}");
            Log.LogInfo("Factory: " + $"{JsonHelper.RaidStatus.Maps.factroyLocked}");
            Log.LogInfo("Woods: " + $"{JsonHelper.RaidStatus.Maps.woodsLocked}");
            Log.LogInfo("Interchange: " + $"{JsonHelper.RaidStatus.Maps.interChangeLocked}");
            Log.LogInfo("Streets: " + $"{JsonHelper.RaidStatus.Maps.streetsLocked}");
            Log.LogInfo("Shoreline: " + $"{JsonHelper.RaidStatus.Maps.shoreLineLocked}");
            Log.LogInfo("Lighthouse: " + $"{JsonHelper.RaidStatus.Maps.lightHouseLocked}");
            Log.LogInfo("Reserve: " + $"{JsonHelper.RaidStatus.Maps.reserveLocked}");
            Log.LogInfo("Labs: " + $"{JsonHelper.RaidStatus.Maps.labsLocked}");
        }
    }
}

  