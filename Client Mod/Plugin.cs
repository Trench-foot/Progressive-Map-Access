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
using UnityEngine;
using UnityEngine.SceneManagement;

namespace ProgressiveMapAccess
{
    [BepInPlugin("ProgressiveMapAccess", "ProgressiveMapAccess", "1.0.0")]
    [BepInDependency("com.SPT.core", "3.11.0")]
    public class Plugin : BaseUnityPlugin
    {
        public bool enableLogging = false;
        public Class303 class303_0;
        internal static Plugin Instance { get; set; }
        internal ManualLogSource Log { get; set; }
        private static UI_Mappings uiMappings;
        private CurrentScreenSingletonClass currentScreenSingletonClass = null;

        internal static UI_Mappings UiMappings { get => uiMappings; set => uiMappings = value; }

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

        public void Update()
        {
            
        }

        // Loops through all map button gameobjects, then calls another function
        // to test them to see if they are disabled.
        // Not as elegant of a fix as just disabling the next button on the map screen.
        public void testSelectedMap()
        {
            UiMappings.setMapSelectionScreen();
            foreach (GameObject location in UiMappings.locations)
            {
                if (location == null)
                {
                    int i = UiMappings.locations.Count;
                    Log.LogError("location is null," + $"{ i }");
                    UiMappings.setMapSelectionScreen();
                }
                Log.LogInfo($"{location.name}" + "Tested");
                bool test = UiMappings.setMapButtonAvailable(location);
                if(test)
                {
                    Log.LogInfo("Map found!  Ending loop.");
                    break;
                }
            }
        }
    }
}

  