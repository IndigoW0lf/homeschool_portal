using UnityEngine;

/// <summary>
/// ScriptableObject defining a placeable building item.
/// Create via: Right-click > Create > Building > Buildable Item
/// </summary>
[CreateAssetMenu(fileName = "NewBuildableItem", menuName = "Building/Buildable Item")]
public class BuildableItem : ScriptableObject
{
    [Header("Display")]
    public string displayName;
    public Sprite icon;
    [TextArea(2, 4)]
    public string description;
    
    [Header("Prefab")]
    public GameObject prefab;
    
    [Header("Category")]
    public BuildingCategory category;
    
    [Header("Placement")]
    public bool snapToGrid = true;
    public float gridSize = 1f;
    public Vector3 placementOffset = Vector3.zero;
    
    [Header("Optional")]
    public int cost = 0; // For future economy system
}

public enum BuildingCategory
{
    Buildings,
    Furniture,
    Nature,
    Props,
    Vehicles,
    Decorations
}
