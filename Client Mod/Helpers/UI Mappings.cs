using Comfort.Common;
using EFT.InventoryLogic;
using EFT.UI;
using EFT.UI.DragAndDrop;
using EFT.UI.Matchmaker;
using System.Collections.Generic;
using TMPro;
using UnityEngine;

namespace ProgressiveMapAccess.Helpers
{
    internal class UI_Mappings
    {
        #region Variables
        public MatchMakerSelectionLocationScreen mapSelection = null;
        public MatchmakerMapPointsScreen mapPoints = null;
        public GameObject nextButton = null;
        public GameObject mapSelectionContainer = null;
        public GameObject mapButton = null;
        public GameObject groundZero = null;
        public GameObject customs = null;
        public GameObject factory = null;
        public GameObject woods = null;
        public GameObject interchange = null;
        public GameObject streets = null;
        public GameObject shoreline = null; 
        public GameObject lighthouse = null;
        public GameObject reserve = null;
        public GameObject labs = null;
        public List<GameObject> locations = new List<GameObject>();
        #endregion

        #region Game Object Mappings
        // Mappings of the location selection screen
        public void setMapSelectionScreen()
        {
            if (mapSelection == null)
            {
                mapSelection = Singleton<MenuUI>.Instance.MatchMakerSelectionLocationScreen;
            }

            mapSelectionContainer = mapSelection.transform.Find("Content/Map/Image/Paths Container").gameObject;
            mapButton = mapSelection.transform.Find("MapButton").gameObject;

            groundZero = mapSelectionContainer.transform.GetChild(18).gameObject; // Ground Zero map button
            customs = mapSelectionContainer.transform.GetChild(12).gameObject; // Customs map button
            factory = mapSelectionContainer.transform.GetChild(13).gameObject; // Factory map button
            woods = mapSelectionContainer.transform.GetChild(22).gameObject; // Woods map button
            interchange = mapSelectionContainer.transform.GetChild(14).gameObject; // Interchange map button
            streets = mapSelectionContainer.transform.GetChild(20).gameObject; // Streets map button
            shoreline = mapSelectionContainer.transform.GetChild(19).gameObject; // Shoreline map button
            lighthouse = mapSelectionContainer.transform.GetChild(16).gameObject; // Lighthouse map button
            reserve = mapSelectionContainer.transform.GetChild(17).gameObject; // Reserve map button
            labs = mapSelectionContainer.transform.GetChild(15).gameObject; // Labs map button
            setLocationList();
        }

        // Finds the next button on the map screen
        public GameObject setMapScreenMappings()
        {
            if(mapPoints == null)
            {
                mapPoints = Singleton<MenuUI>.Instance.MatchmakerMapPoints;
            }

            nextButton = mapPoints.transform.Find("ScreenDefaultButtons/NextButton").gameObject;

            return nextButton;
        }

        // Clears then adds all map locations to the array
        public void setLocationList()
        {
            locations.Clear();
            locations.Add(groundZero);
            locations.Add(customs);
            locations.Add(factory);
            locations.Add(woods);
            locations.Add(interchange);
            locations.Add(streets);
            locations.Add(shoreline);
            locations.Add(lighthouse);
            locations.Add(reserve);
            //locations.Add(labs);
        }
        // Checks if the selected toggle button is true, returns true if it is
        public bool getToggleStatus(GameObject test)
        {
            if(test == null)
            {
                if(Plugin.Instance.enableLogging)
                {
                    Plugin.Instance.Log.LogError("(getToggleStatus)Target GameObject is null.");
                }
                return false;
            }
            AnimatedToggle result = test.GetComponentInChildren<AnimatedToggle>();

            if(!result.isOn)
            {
                return false;
            }
            else
            {
                return true;
            }
        }
        // Checks if lock button is active, returns true if it is
        public bool getLockStatus(GameObject test)
        {
            if (test == null)
            {
                if (Plugin.Instance.enableLogging)
                {
                    Plugin.Instance.Log.LogError("(getLockStatus)Target GameObject is null.");
                }
                return false;
            }
            GameObject result = test.transform.GetChild(3).gameObject;

            if (result == null || !result.activeSelf)
            {
                if (Plugin.Instance.enableLogging)
                {
                    Plugin.Instance.Log.LogError("No Mapbutton enabled.");
                }
                return false;
            }
            if(!result.activeSelf)
            {
                return false;
            }
            else
            {
                return true;
            }
        }
        #endregion

        // Count the number of child transforms in a GameObject
        public int countTransformChildren(GameObject target)
        {
            if (target == null)
            {
                if(Plugin.Instance.enableLogging)
                {
                    Plugin.Instance.Log.LogError("[Belt Slots] Target GameObject is null.");
                }
                return 0;
            }
            return target.transform.childCount;
        }

        #region Map Button Test Method
        // Set the map button availablity based on if the map is locked or not
        public bool setMapButtonAvailable(GameObject test)
        {
            if(getLockStatus(test) && getToggleStatus(test))
            {
                if(Plugin.Instance.enableLogging)
                {
                    Plugin.Instance.Log.LogInfo($"{test}" + "found");
                }
                mapButton.SetActive(false);
                return true;
            }
            return false;
        }
        #endregion
    }
}
