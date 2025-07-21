using EFT.UI.Map;
using JetBrains.Annotations;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace ProgressiveMapAccess.ModConfig
{
    public class UserProfile
    {
        [JsonProperty("userID")]
        public string UserID { get; set; }

        [JsonProperty("allMapsUnlocked")]
        public bool AllMapsUnlocked { get; set; }

        [JsonProperty("Maps")]
        public Maps Maps { get; set; }

        public UserProfile()
        {
            
        }
    }

    public class Maps
    {
        [JsonProperty("groundZero")]
        public bool groundZeroLocked { get; set; }

        [JsonProperty("customs")]
        public bool customsLocked { get; set; }

        [JsonProperty("factory")]
        public bool factroyLocked { get; set; }

        [JsonProperty("woods")]
        public bool woodsLocked { get; set; }

        [JsonProperty("interChange")]
        public bool interChangeLocked { get; set; }

        [JsonProperty("streets")]
        public bool streetsLocked { get; set; }

        [JsonProperty("shoreLine")]
        public bool shoreLineLocked { get; set; }

        [JsonProperty("lightHouse")]
        public bool lightHouseLocked { get; set; }

        [JsonProperty("reserve")]
        public bool reserveLocked { get; set; }

        [JsonProperty("labs")]
        public bool labsLocked { get; set; }

        public Maps()
        {

        }
    }
}
