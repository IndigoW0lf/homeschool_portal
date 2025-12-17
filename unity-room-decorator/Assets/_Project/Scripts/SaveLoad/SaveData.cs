using System;
using System.Collections.Generic;

namespace MoonRoom.SaveLoad
{
    /// <summary>
    /// Data representing a single placed item for serialization.
    /// </summary>
    [Serializable]
    public class PlacedItemData
    {
        /// <summary>
        /// The placeable ID matching the catalog entry.
        /// </summary>
        public string placeableId;
        
        /// <summary>
        /// X position in world space.
        /// </summary>
        public float posX;
        
        /// <summary>
        /// Y position in world space.
        /// </summary>
        public float posY;
        
        /// <summary>
        /// Z position in world space.
        /// </summary>
        public float posZ;
        
        /// <summary>
        /// Y rotation in degrees.
        /// </summary>
        public float rotY;
        
        /// <summary>
        /// Create an empty PlacedItemData.
        /// </summary>
        public PlacedItemData() { }
        
        /// <summary>
        /// Create a PlacedItemData with values.
        /// </summary>
        public PlacedItemData(string placeableId, float x, float y, float z, float rotY)
        {
            this.placeableId = placeableId;
            this.posX = x;
            this.posY = y;
            this.posZ = z;
            this.rotY = rotY;
        }
    }
    
    /// <summary>
    /// Root save data containing all placed items in the room.
    /// </summary>
    [Serializable]
    public class RoomSaveData
    {
        /// <summary>
        /// Version of the save format for future compatibility.
        /// </summary>
        public int version = 1;
        
        /// <summary>
        /// Timestamp when the save was created.
        /// </summary>
        public string savedAt;
        
        /// <summary>
        /// List of all placed items.
        /// </summary>
        public List<PlacedItemData> items = new List<PlacedItemData>();
        
        /// <summary>
        /// Create empty save data.
        /// </summary>
        public RoomSaveData()
        {
            savedAt = DateTime.Now.ToString("o");
        }
    }
}
