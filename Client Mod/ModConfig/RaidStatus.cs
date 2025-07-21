using Newtonsoft.Json;
using System;

namespace ProgressiveMapAccess.ModConfig
{
    public class RaidStatus
    {
        [JsonProperty("MapId")]
        public string mapId { get; set; }

        [JsonProperty("RaidResult")]
        public string raidResult { get; set; }

        [JsonProperty("Exit")]
        public string exit { get; set; }

        [JsonProperty("Camping")]
        public bool camping { get; set; }

        [JsonProperty("ExtendedCamping")]
        public bool extendedCamping { get; set; }

        [JsonProperty("Maps")]
        public TempMapUnlocks Maps { get; set; }

        public RaidStatus()
        {

        }
    }

    public class TempMapUnlocks
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

        public TempMapUnlocks()
        {

        }
    }
}
