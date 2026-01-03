using UnityEngine;
using UnityEditor;
using System.IO;
using System.Collections.Generic;

/// <summary>
/// Auto-generates BuildableItem ScriptableObjects from Synty prefabs.
/// Run via: Tools > Building > Generate Buildable Items from Synty
/// </summary>
public class BuildableItemGenerator : EditorWindow
{
    private const string SYNTY_PATH = "Assets/_Project/ThirdParty/Synty";
    private const string OUTPUT_PATH = "Assets/_Project/Data/BuildableItems";
    private const string CATALOG_PATH = "Assets/_Project/Data/BuildingCatalog.asset";
    
    [MenuItem("Tools/Building/Generate Buildable Items from Synty")]
    public static void GenerateItems()
    {
        // Create output directory
        if (!Directory.Exists(OUTPUT_PATH))
        {
            Directory.CreateDirectory(OUTPUT_PATH);
            AssetDatabase.Refresh();
        }
        
        int created = 0;
        int skipped = 0;
        List<BuildableItem> allItems = new List<BuildableItem>();
        
        // Find all prefab files in Synty folders
        string[] prefabGuids = AssetDatabase.FindAssets("t:Prefab", new[] { SYNTY_PATH });
        
        foreach (string guid in prefabGuids)
        {
            string prefabPath = AssetDatabase.GUIDToAssetPath(guid);
            string prefabName = Path.GetFileNameWithoutExtension(prefabPath);
            
            // Skip certain prefabs (characters, demos, etc.)
            if (ShouldSkipPrefab(prefabName, prefabPath))
            {
                skipped++;
                continue;
            }
            
            // Check if BuildableItem already exists
            string itemPath = $"{OUTPUT_PATH}/{prefabName}.asset";
            if (File.Exists(itemPath))
            {
                // Load existing
                var existing = AssetDatabase.LoadAssetAtPath<BuildableItem>(itemPath);
                if (existing != null)
                {
                    allItems.Add(existing);
                    skipped++;
                    continue;
                }
            }
            
            // Load prefab
            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
            if (prefab == null) continue;
            
            // Create BuildableItem
            BuildableItem item = ScriptableObject.CreateInstance<BuildableItem>();
            item.displayName = CleanupName(prefabName);
            item.prefab = prefab;
            item.category = DetermineCategory(prefabName, prefabPath);
            item.snapToGrid = true;
            item.gridSize = 1f;
            
            // Save asset
            AssetDatabase.CreateAsset(item, itemPath);
            allItems.Add(item);
            created++;
        }
        
        // Create or update catalog
        BuildingCatalog catalog = AssetDatabase.LoadAssetAtPath<BuildingCatalog>(CATALOG_PATH);
        if (catalog == null)
        {
            catalog = ScriptableObject.CreateInstance<BuildingCatalog>();
            AssetDatabase.CreateAsset(catalog, CATALOG_PATH);
        }
        
        catalog.allItems = allItems;
        EditorUtility.SetDirty(catalog);
        AssetDatabase.SaveAssets();
        
        EditorGUIUtility.PingObject(catalog);
        
        string message = $"Done!\n\n";
        message += $"Created: {created} new BuildableItems\n";
        message += $"Skipped: {skipped} (existing or excluded)\n";
        message += $"Total in catalog: {allItems.Count}\n";
        message += $"\nCatalog saved to: {CATALOG_PATH}";
        
        EditorUtility.DisplayDialog("Generation Complete", message, "OK");
    }
    
    private static bool ShouldSkipPrefab(string name, string path)
    {
        string nameLower = name.ToLower();
        string pathLower = path.ToLower();
        
        // Skip characters
        if (pathLower.Contains("character")) return true;
        if (nameLower.StartsWith("sk_chr")) return true;
        if (nameLower.StartsWith("chr_")) return true;
        
        // Skip demos
        if (pathLower.Contains("demo")) return true;
        
        // Skip animations
        if (pathLower.Contains("animation")) return true;
        
        // Skip FX/particles
        if (nameLower.StartsWith("fx_")) return true;
        
        return false;
    }
    
    private static string CleanupName(string name)
    {
        // Remove common prefixes
        string result = name;
        
        string[] prefixesToRemove = { "SM_", "Prop_", "Bld_", "Env_", "Veh_" };
        foreach (var prefix in prefixesToRemove)
        {
            if (result.StartsWith(prefix))
            {
                result = result.Substring(prefix.Length);
                break;
            }
        }
        
        // Replace underscores with spaces
        result = result.Replace("_", " ");
        
        return result;
    }
    
    private static BuildingCategory DetermineCategory(string name, string path)
    {
        string nameLower = name.ToLower();
        string pathLower = path.ToLower();
        
        // Buildings
        if (nameLower.Contains("bld_") || nameLower.Contains("building") ||
            nameLower.Contains("house") || nameLower.Contains("shop") ||
            pathLower.Contains("/buildings/"))
            return BuildingCategory.Buildings;
        
        // Vehicles
        if (nameLower.StartsWith("veh_") || nameLower.Contains("car") ||
            nameLower.Contains("truck") || nameLower.Contains("vehicle") ||
            pathLower.Contains("/vehicles/"))
            return BuildingCategory.Vehicles;
        
        // Nature
        if (nameLower.Contains("tree") || nameLower.Contains("bush") ||
            nameLower.Contains("plant") || nameLower.Contains("rock") ||
            nameLower.Contains("grass") || nameLower.Contains("flower") ||
            pathLower.Contains("/nature/") || pathLower.Contains("/foliage/"))
            return BuildingCategory.Nature;
        
        // Furniture
        if (nameLower.Contains("chair") || nameLower.Contains("table") ||
            nameLower.Contains("bed") || nameLower.Contains("desk") ||
            nameLower.Contains("couch") || nameLower.Contains("shelf") ||
            pathLower.Contains("/furniture/") || pathLower.Contains("/interior/"))
            return BuildingCategory.Furniture;
        
        // Default to Props
        return BuildingCategory.Props;
    }
    
    [MenuItem("Tools/Building/Create Ghost Materials")]
    public static void CreateGhostMaterials()
    {
        string matPath = "Assets/_Project/Materials";
        if (!Directory.Exists(matPath))
        {
            Directory.CreateDirectory(matPath);
            AssetDatabase.Refresh();
        }
        
        // Valid placement material (green transparent)
        Material validMat = new Material(Shader.Find("Standard"));
        validMat.color = new Color(0f, 1f, 0f, 0.5f);
        validMat.SetFloat("_Mode", 3); // Transparent
        validMat.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
        validMat.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
        validMat.SetInt("_ZWrite", 0);
        validMat.DisableKeyword("_ALPHATEST_ON");
        validMat.EnableKeyword("_ALPHABLEND_ON");
        validMat.DisableKeyword("_ALPHAPREMULTIPLY_ON");
        validMat.renderQueue = 3000;
        AssetDatabase.CreateAsset(validMat, $"{matPath}/GhostValid.mat");
        
        // Invalid placement material (red transparent)
        Material invalidMat = new Material(Shader.Find("Standard"));
        invalidMat.color = new Color(1f, 0f, 0f, 0.5f);
        invalidMat.SetFloat("_Mode", 3);
        invalidMat.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
        invalidMat.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
        invalidMat.SetInt("_ZWrite", 0);
        invalidMat.DisableKeyword("_ALPHATEST_ON");
        invalidMat.EnableKeyword("_ALPHABLEND_ON");
        invalidMat.DisableKeyword("_ALPHAPREMULTIPLY_ON");
        invalidMat.renderQueue = 3000;
        AssetDatabase.CreateAsset(invalidMat, $"{matPath}/GhostInvalid.mat");
        
        AssetDatabase.SaveAssets();
        
        EditorUtility.DisplayDialog("Materials Created", 
            "Created ghost materials:\n• GhostValid.mat (green)\n• GhostInvalid.mat (red)\n\nAssign these to BuildingPlacer!", "OK");
    }
}
