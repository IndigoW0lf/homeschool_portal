using System;
using System.Collections.Generic;
using UnityEngine;

namespace MoonRoom.Core
{
    /// <summary>
    /// Entry in the placeable catalog defining an available item.
    /// </summary>
    [Serializable]
    public class CatalogEntry
    {
        [Tooltip("Unique identifier matching the prefab's PlaceableItem.PlaceableId")]
        public string id;
        
        [Tooltip("Display name shown in the UI")]
        public string displayName;
        
        [Tooltip("Reference to the prefab")]
        public GameObject prefab;
        
        [Tooltip("Optional icon for UI display")]
        public Sprite icon;
    }
    
    /// <summary>
    /// ScriptableObject containing the catalog of all available placeable items.
    /// Create via Assets > Create > MoonRoom > Placeable Catalog
    /// </summary>
    [CreateAssetMenu(fileName = "PlaceableCatalog", menuName = "MoonRoom/Placeable Catalog")]
    public class PlaceableCatalog : ScriptableObject
    {
        [Header("Catalog Entries")]
        [SerializeField] private List<CatalogEntry> entries = new List<CatalogEntry>();
        
        /// <summary>
        /// All entries in the catalog.
        /// </summary>
        public IReadOnlyList<CatalogEntry> Entries => entries;
        
        /// <summary>
        /// Get a catalog entry by its ID.
        /// </summary>
        /// <param name="id">The placeable ID to look up.</param>
        /// <returns>The catalog entry, or null if not found.</returns>
        public CatalogEntry GetEntryById(string id)
        {
            foreach (var entry in entries)
            {
                if (entry.id == id)
                    return entry;
            }
            return null;
        }
        
        /// <summary>
        /// Get the prefab for a given placeable ID.
        /// </summary>
        /// <param name="id">The placeable ID to look up.</param>
        /// <returns>The prefab GameObject, or null if not found.</returns>
        public GameObject GetPrefabById(string id)
        {
            var entry = GetEntryById(id);
            return entry?.prefab;
        }
        
#if UNITY_EDITOR
        /// <summary>
        /// Validate all entries have required fields.
        /// </summary>
        [ContextMenu("Validate Entries")]
        private void ValidateEntries()
        {
            int issues = 0;
            for (int i = 0; i < entries.Count; i++)
            {
                var entry = entries[i];
                if (string.IsNullOrEmpty(entry.id))
                {
                    Debug.LogWarning($"Catalog entry [{i}] has no ID");
                    issues++;
                }
                if (entry.prefab == null)
                {
                    Debug.LogWarning($"Catalog entry [{i}] ({entry.id}) has no prefab");
                    issues++;
                }
                if (entry.prefab != null && entry.prefab.GetComponent<PlaceableItem>() == null)
                {
                    Debug.LogWarning($"Catalog entry [{i}] ({entry.id}) prefab missing PlaceableItem component");
                    issues++;
                }
            }
            Debug.Log(issues == 0 ? "All catalog entries validated!" : $"Found {issues} issues");
        }
#endif
    }
}
