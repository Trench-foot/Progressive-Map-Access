using Comfort.Common;
using EFT.UI;
using EFT.UI.Matchmaker;
using HarmonyLib;
using ProgressiveMapAccess;
using ProgressiveMapAccess.Helpers;
using SPT.Reflection.Patching;
using System.Reflection;

// Calls GetLevelSettings whenever the select side screen is shown, this is done to dynamically set availble maps
// without a client restart
public class MatchMakerSideSelectionScreenPatch : ModulePatch
{
    protected override MethodBase GetTargetMethod()
    {
        return AccessTools.Method(typeof(MatchMakerSideSelectionScreen),
                    nameof(MatchMakerSideSelectionScreen.method_12));
    }

    [PatchPrefix]
    public static bool Prefix()
    {
        if(Plugin.Instance.enableLogging)
        {
            Plugin.Instance.Log.LogInfo("MatchMakerSidSelectionScreen.Show called, patching to allow progressive map access.");
            Plugin.Instance.Log.LogInfo("MatchMakerSideSelectionScreen.Show called, setting up location selection screen.");
        }
        Plugin.Instance.class303_0.GetLevelSettings();
        return true;
    }
}

// Disables the next button on the map screen.  Way easier of a fix for the bug allowing access to maps
// when the map is disabled
public class MatchMakerMapPointsScreenPatch : ModulePatch
{
    protected override MethodBase GetTargetMethod()
    {
        return AccessTools.Method(typeof(MatchmakerMapPointsScreen),
            nameof(MatchmakerMapPointsScreen.method_5));
    }

    [PatchPostfix]
    public static void PostFix()
    {
        if(Plugin.Instance.enableLogging)
        {
            Plugin.Instance.Log.LogInfo("MatchMakerMapPointsScreen.method_5 called.");
        }

        Plugin.UiMappings.setMapScreenMappings().SetActive(false);
    }
}

// Used to get an instance os Class303 so that I can call GetLevelSettings in another patch
public class Class303Patch : ModulePatch
{
    protected override MethodBase GetTargetMethod()
    {
        return AccessTools.Method(typeof(Class303), nameof(Class303.GetLevelSettings));
    }
    [PatchPrefix]
    public static bool Prefix(Class303 __instance)
    {
        if (Plugin.Instance.enableLogging)
        {
            Plugin.Instance.Log.LogInfo("Class303.GetLevelSettings called, patching to allow progressive map access.");            
        }
        Plugin.Instance.class303_0 = __instance;

        return true;
    }
}

// Patch to get method_8, called when you click on the map locations
public class MatchMakerSelectLocationScreenPatch : ModulePatch
{
    protected override MethodBase GetTargetMethod()
    {
        return AccessTools.Method(typeof(MatchMakerSelectionLocationScreen),
            nameof(MatchMakerSelectionLocationScreen.method_8));
    }

    [PatchPostfix]
    public static void PostFix()
    {
        if(Plugin.Instance.enableLogging)
        {
            Plugin.Instance.Log.LogInfo("MatchMakerSelectionLocationScreen.method_8 called, patching to allow progressive map access.");
        }
        // Method to check to see if a map is currently locked, and if it is to disable the map button,
        // done in an effort to fix a bug that was present on live at the start of the Hardcore wipe
        Plugin.Instance.testSelectedMap();
    }
}

// Patch to get method_7, called when you click on the labs map location
public class MatchMakerSelectLocationScreenPatch2 : ModulePatch
{
    protected override MethodBase GetTargetMethod()
    {
        return AccessTools.Method(typeof(MatchMakerSelectionLocationScreen),
            nameof(MatchMakerSelectionLocationScreen.method_7));
    }

    [PatchPostfix]
    public static void PostFix()
    {
        if (Plugin.Instance.enableLogging)
        {
            Plugin.Instance.Log.LogInfo("MatchMakerSelectionLocationScreen.method_7 called, patching to allow progressive map access.");
        }
        // Method to check to see if a map is currently locked, and if it is to disable the map button,
        // done in an effort to fix a bug that was present on live at the start of the Hardcore wipe
        Plugin.UiMappings.setMapButtonAvailable(Plugin.UiMappings.labs);
    }
}
