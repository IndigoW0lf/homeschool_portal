using UnityEngine;
using UnityEditor;
using System.IO;
using System.Linq;
using System.Collections.Generic;

/// <summary>
/// Auto-applies Synty color palette textures to materials.
/// Run via: Tools > Synty > Apply All Textures
/// </summary>
public class SyntyTextureApplier : EditorWindow
{
    private const string SYNTY_PATH = "Assets/_Project/ThirdParty/Synty";
    
    [MenuItem("Tools/Synty/Apply All Textures")]
    public static void ApplyTextures()
    {
        int materialsFixed = 0;
        int totalMaterials = 0;
        
        // Find all materials in Synty folders
        string[] materialGuids = AssetDatabase.FindAssets("t:Material", new[] { SYNTY_PATH });
        
        // Build a cache of available textures by folder
        Dictionary<string, Texture2D> textureCache = BuildTextureCache();
        
        foreach (string guid in materialGuids)
        {
            string matPath = AssetDatabase.GUIDToAssetPath(guid);
            Material mat = AssetDatabase.LoadAssetAtPath<Material>(matPath);
            
            if (mat == null) continue;
            totalMaterials++;
            
            // Check if material already has a texture
            if (mat.mainTexture != null) continue;
            
            // Try to find appropriate texture
            Texture2D texture = FindTextureForMaterial(mat, matPath, textureCache);
            
            if (texture != null)
            {
                mat.mainTexture = texture;
                EditorUtility.SetDirty(mat);
                materialsFixed++;
                Debug.Log($"✓ Applied '{texture.name}' to material '{mat.name}'");
            }
        }
        
        AssetDatabase.SaveAssets();
        
        string message = $"Done!\n\n";
        message += $"Total materials found: {totalMaterials}\n";
        message += $"Materials updated: {materialsFixed}\n";
        message += $"Materials already had textures: {totalMaterials - materialsFixed}";
        
        EditorUtility.DisplayDialog("Texture Application Complete", message, "OK");
    }
    
    private static Dictionary<string, Texture2D> BuildTextureCache()
    {
        var cache = new Dictionary<string, Texture2D>();
        
        string[] textureGuids = AssetDatabase.FindAssets("t:Texture2D", new[] { SYNTY_PATH });
        
        foreach (string guid in textureGuids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            string name = Path.GetFileNameWithoutExtension(path).ToLower();
            Texture2D tex = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
            
            if (tex != null && !cache.ContainsKey(name))
            {
                cache[name] = tex;
            }
        }
        
        Debug.Log($"Built texture cache with {cache.Count} textures");
        return cache;
    }
    
    private static Texture2D FindTextureForMaterial(Material mat, string matPath, Dictionary<string, Texture2D> cache)
    {
        string matName = mat.name.ToLower();
        string folder = Path.GetDirectoryName(matPath).ToLower();
        
        // Determine which pack this is from
        string packName = "";
        if (folder.Contains("city")) packName = "city";
        else if (folder.Contains("town")) packName = "town";
        else if (folder.Contains("farm")) packName = "farm";
        else if (folder.Contains("coffee")) packName = "coffee";
        else if (folder.Contains("shop")) packName = "shop";
        else if (folder.Contains("plaza")) packName = "plaza";
        
        // Try to find matching texture
        // Synty typically uses: Polygon_PackName_Texture_01_A.png pattern
        
        // First try exact name match
        if (cache.TryGetValue(matName, out Texture2D exactMatch))
            return exactMatch;
        
        // Try common Synty patterns
        string[] patternsToTry = new[]
        {
            $"polygon_{packName}_texture_01_a",
            $"polygon_texture_01_a",
            $"t_polygon{packName}_01",
            $"polygon_{packName}_01_a",
            $"{packName}_texture_01",
            "polygon_texture_01_a",
            "generic_01_a"
        };
        
        foreach (string pattern in patternsToTry)
        {
            if (cache.TryGetValue(pattern, out Texture2D patternMatch))
                return patternMatch;
        }
        
        // Fallback: find any texture in the same pack folder
        string packFolder = "";
        if (folder.Contains("city")) packFolder = "city";
        else if (folder.Contains("town")) packFolder = "town";
        else if (folder.Contains("farm")) packFolder = "farm";
        else if (folder.Contains("coffee")) packFolder = "coffee shop";
        else if (folder.Contains("shop")) packFolder = "shops";
        else if (folder.Contains("plaza")) packFolder = "shopping plaza";
        
        foreach (var kvp in cache)
        {
            string texPath = AssetDatabase.GetAssetPath(kvp.Value).ToLower();
            if (texPath.Contains(packFolder) && 
                (kvp.Key.Contains("texture") || kvp.Key.Contains("polygon")) &&
                kvp.Key.EndsWith("_a"))
            {
                return kvp.Value;
            }
        }
        
        return null;
    }
}
