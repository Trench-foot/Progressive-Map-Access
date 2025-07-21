using Newtonsoft.Json;
using ProgressiveMapAccess.ModConfig;
using System;
using static GClass1943;

namespace ProgressiveMapAccess.Helpers
{
    public class JsonHelper
    {
        public static ModConfig.UserProfile UserProfile { get; set; } = null;

        public static ModConfig.RaidStatus RaidStatus { get; set; } = null;

        public static ModConfig.UserProfile GetUserProfile(string json)
        {
            string errorMessage = "!!!!! Cannot retrieve config.json data from the server. The mod will not work properly! !!!!!";

            if (!TryDeserializeObject(json, errorMessage, out ModConfig.UserProfile _userProfile))
            {
                return null;
            }
            UserProfile = _userProfile;

            return UserProfile;
        }

        public static ModConfig.RaidStatus GetRaidStatus(string json)
        {
            string errorMessage = "!!!!! Cannot retrieve config.json data from the server. The mod will not work properly! !!!!!";

            if (!TryDeserializeObject(json, errorMessage, out ModConfig.RaidStatus _raidStatus))
            {
                return null;
            }
            RaidStatus = _raidStatus;

            return RaidStatus;
        }

        public static bool TryDeserializeObject<T>(string json, string errorMessage, out T obj)
        {
            try
            {
                if (json.Length == 0)
                {
                    throw new InvalidCastException("Could deserialize an empty string to an object of type " + typeof(T).FullName);
                }

                // Check if the server failed to provide a valid response
                if (!json.StartsWith("["))
                {
                    //ServerResponseError serverResponse = JsonConvert.DeserializeObject<ServerResponseError>(json);
                    //if (serverResponse?.StatusCode != System.Net.HttpStatusCode.OK)
                    //{
                    //    throw new System.Net.WebException("Could not retrieve configuration settings from the server. Response: " + serverResponse.StatusCode.ToString());
                    //}
                }

                obj = JsonConvert.DeserializeObject<T>(json, GClass1629.SerializerSettings);

                return true;
            }
            catch (Exception e)
            {
                //LoggingController.LogError(e.Message);
                //LoggingController.LogError(e.StackTrace);
                //LoggingController.LogErrorToServerConsole(errorMessage);
            }

            obj = default;
            if (obj == null)
            {
                obj = (T)Activator.CreateInstance(typeof(T));
            }

            return false;
        }
    }
}
