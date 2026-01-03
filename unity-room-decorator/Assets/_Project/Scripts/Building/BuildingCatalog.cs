using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// ScriptableObject containing all available building items.
/// Create via: Right-click > Create > Building > Building Catalog
/// </summary>
[CreateAssetMenu(fileName = "BuildingCatalog", menuName = "Building/Building Catalog")]
public class BuildingCatalog : ScriptableObject
{
    public List<BuildableItem> allItems = new List<BuildableItem>();
    
    /// <summary>
    /// Get all items in a specific category.
    /// </summary>
    public List<BuildableItem> GetItemsByCategory(BuildingCategory category)
    {
        List<BuildableItem> result = new List<BuildableItem>();
        foreach (var item in allItems)
        {
            if (item != null && item.category == category)
                result.Add(item);
        }
        return result;
    }
    
    /// <summary>
    /// Get all unique categories that have items.
    /// </summary>
    public List<BuildingCategory> GetAvailableCategories()
    {
        HashSet<BuildingCategory> categories = new HashSet<BuildingCategory>();
        foreach (var item in allItems)
        {
            if (item != null)
                categories.Add(item.category);
        }
        return new List<BuildingCategory>(categories);
    }
}
