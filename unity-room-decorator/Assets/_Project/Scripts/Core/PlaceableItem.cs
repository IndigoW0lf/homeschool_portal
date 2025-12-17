using UnityEngine;

namespace MoonRoom.Core
{
    /// <summary>
    /// Component attached to all placeable objects.
    /// Stores the unique identifier for save/load and catalog lookup.
    /// </summary>
    public class PlaceableItem : MonoBehaviour
    {
        [Header("Identification")]
        [Tooltip("Unique identifier for this placeable type (GUID-like string)")]
        [SerializeField] private string placeableId;
        
        [Tooltip("Human-readable display name")]
        [SerializeField] private string displayName;
        
        /// <summary>
        /// Unique identifier for this placeable type.
        /// Used for save/load serialization and catalog lookup.
        /// </summary>
        public string PlaceableId => placeableId;
        
        /// <summary>
        /// Human-readable display name shown in UI.
        /// </summary>
        public string DisplayName => displayName;
        
        /// <summary>
        /// Sets the placeable ID. Used when instantiating from catalog.
        /// </summary>
        public void SetPlaceableId(string id)
        {
            placeableId = id;
        }
        
        /// <summary>
        /// Sets the display name. Used when instantiating from catalog.
        /// </summary>
        public void SetDisplayName(string name)
        {
            displayName = name;
        }
        
#if UNITY_EDITOR
        /// <summary>
        /// Generate a new GUID for this placeable in the editor.
        /// </summary>
        [ContextMenu("Generate New GUID")]
        private void GenerateNewGuid()
        {
            placeableId = System.Guid.NewGuid().ToString();
            UnityEditor.EditorUtility.SetDirty(this);
        }
#endif
    }
}
