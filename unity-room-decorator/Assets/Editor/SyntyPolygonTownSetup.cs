using UnityEngine;
using UnityEditor;
using System.IO;
using System.Linq;

/// <summary>
/// Auto-setup materials for POLYGON_Town assets based on Synty's material mapping.
/// Most assets use PolygonTown_Texture_01_A, with special materials for glass, water, etc.
/// </summary>
public class SyntyPolygonTownSetup : EditorWindow
{
    private static readonly string TOWN_PATH = "Assets/_Project/ThirdParty/Synty/POLYGON_Town";
    private static readonly string MATERIALS_PATH = "Assets/_Project/ThirdParty/Synty/POLYGON_Town/Materials";
    
    // Material name mappings from the manifest
    private static readonly string[] MATERIAL_CONFIGS = new string[]
    {
        "PolygonTown_01_A|PolygonTown_Texture_01_A|Lit",
        "PolygonTown_01_B|PolygonTown_Texture_01_B|Lit",
        "PolygonTown_01_C|PolygonTown_Texture_01_C|Lit",
        "PolygonTown_Road|PolygonTown_Road_01|Lit",
        "Window_Glass|NONE|Transparent",
        "Window_Glass_Opaque|PolygonTown_Window_01|Lit",
        "Base_Glass|PolygonTown_Texture_01_A|Transparent",
        "Veh_Glass|NONE|Transparent",
        "Fridge_Glass|NONE|Transparent",
        "Mirror_Glass|NONE|Transparent",
        "Water|NONE|Transparent",
        "TelevisionScreen|NONE|Emissive"
    };
    
    [MenuItem("Tools/Synty/POLYGON Town Material Setup")]
    public static void ShowWindow()
    {
        GetWindow<SyntyPolygonTownSetup>("POLYGON Town Setup");
    }
    
    void OnGUI()
    {
        GUILayout.Label("POLYGON Town Material Setup", EditorStyles.boldLabel);
        GUILayout.Space(10);
        
        EditorGUILayout.HelpBox(
            "This tool creates all the materials needed for POLYGON_Town assets.\n\n" +
            "Most meshes use 'PolygonTown_01_A' material with 'PolygonTown_Texture_01_A.png'\n" +
            "Special materials are created for glass, water, windows, etc.",
            MessageType.Info);
        
        GUILayout.Space(15);
        
        if (GUILayout.Button("1. Create All Materials", GUILayout.Height(40)))
        {
            CreateAllMaterials();
        }
        
        GUILayout.Space(10);
        
        if (GUILayout.Button("2. Apply Materials to Selected Objects", GUILayout.Height(40)))
        {
            ApplyMaterialsToSelection();
        }
        
        GUILayout.Space(10);
        
        if (GUILayout.Button("3. Batch Apply to ALL FBX in Scene", GUILayout.Height(40)))
        {
            BatchApplyMaterialsInScene();
        }
        
        GUILayout.Space(20);
        GUILayout.Label("Quick Actions", EditorStyles.boldLabel);
        
        if (GUILayout.Button("Apply Main Texture to Selected"))
        {
            ApplyMainTextureToSelection();
        }
    }
    
    void CreateAllMaterials()
    {
        // Ensure materials folder exists
        if (!Directory.Exists(MATERIALS_PATH))
        {
            Directory.CreateDirectory(MATERIALS_PATH);
            AssetDatabase.Refresh();
        }
        
        int created = 0;
        
        foreach (string config in MATERIAL_CONFIGS)
        {
            string[] parts = config.Split('|');
            string matName = parts[0];
            string textureName = parts[1];
            string shaderType = parts[2];
            
            string matPath = $"{MATERIALS_PATH}/Mat_{matName}.mat";
            
            // Skip if already exists
            if (File.Exists(matPath))
            {
                Debug.Log($"[Synty] Material already exists: {matName}");
                continue;
            }
            
            // Find appropriate shader
            Shader shader = GetShaderForType(shaderType);
            if (shader == null)
            {
                Debug.LogWarning($"[Synty] Could not find shader for {shaderType}");
                continue;
            }
            
            Material mat = new Material(shader);
            mat.name = matName;
            
            // Set texture if specified
            if (textureName != "NONE")
            {
                string texPath = $"{TOWN_PATH}/Source_Files/Textures/{textureName}.png";
                Texture2D tex = AssetDatabase.LoadAssetAtPath<Texture2D>(texPath);
                
                if (tex != null)
                {
                    mat.mainTexture = tex;
                    
                    // For URP, also set _BaseMap
                    if (mat.HasProperty("_BaseMap"))
                    {
                        mat.SetTexture("_BaseMap", tex);
                    }
                }
                else
                {
                    Debug.LogWarning($"[Synty] Texture not found: {texPath}");
                }
            }
            
            // Configure transparency if needed
            if (shaderType == "Transparent")
            {
                ConfigureTransparentMaterial(mat);
            }
            
            AssetDatabase.CreateAsset(mat, matPath);
            created++;
            Debug.Log($"[Synty] Created material: {matName}");
        }
        
        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();
        
        EditorUtility.DisplayDialog("Materials Created", 
            $"Created {created} new materials in:\n{MATERIALS_PATH}", "OK");
    }
    
    Shader GetShaderForType(string type)
    {
        // Try URP shaders first
        Shader shader = null;
        
        switch (type)
        {
            case "Lit":
                shader = Shader.Find("Universal Render Pipeline/Lit");
                if (shader == null) shader = Shader.Find("Standard");
                break;
            case "Transparent":
                shader = Shader.Find("Universal Render Pipeline/Lit");
                if (shader == null) shader = Shader.Find("Standard");
                break;
            case "Emissive":
                shader = Shader.Find("Universal Render Pipeline/Lit");
                if (shader == null) shader = Shader.Find("Standard");
                break;
        }
        
        // Fallback to Unlit if nothing found
        if (shader == null)
        {
            shader = Shader.Find("Unlit/Texture");
        }
        
        return shader;
    }
    
    void ConfigureTransparentMaterial(Material mat)
    {
        // Set up transparency for URP
        if (mat.HasProperty("_Surface"))
        {
            mat.SetFloat("_Surface", 1); // 1 = Transparent
            mat.SetFloat("_Blend", 0); // Alpha blend
        }
        
        // Set alpha for a nice glass look
        if (mat.HasProperty("_BaseColor"))
        {
            Color c = mat.GetColor("_BaseColor");
            c.a = 0.3f;
            mat.SetColor("_BaseColor", c);
        }
        else if (mat.HasProperty("_Color"))
        {
            Color c = mat.GetColor("_Color");
            c.a = 0.3f;
            mat.SetColor("_Color", c);
        }
        
        // Enable transparency rendering
        mat.renderQueue = 3000;
    }
    
    void ApplyMaterialsToSelection()
    {
        if (Selection.gameObjects.Length == 0)
        {
            EditorUtility.DisplayDialog("No Selection", "Please select objects in the scene or hierarchy.", "OK");
            return;
        }
        
        int updated = 0;
        Material mainMat = LoadMaterial("PolygonTown_01_A");
        
        if (mainMat == null)
        {
            EditorUtility.DisplayDialog("Materials Not Found", 
                "Please run 'Create All Materials' first.", "OK");
            return;
        }
        
        foreach (GameObject go in Selection.gameObjects)
        {
            Renderer[] renderers = go.GetComponentsInChildren<Renderer>();
            foreach (Renderer r in renderers)
            {
                Material[] mats = r.sharedMaterials;
                bool changed = false;
                
                for (int i = 0; i < mats.Length; i++)
                {
                    // Replace missing or default materials
                    if (mats[i] == null || mats[i].name.Contains("Default") || 
                        mats[i].shader.name == "Standard")
                    {
                        // Try to match by slot name
                        Material replacement = GetMaterialForSlot(r.name, i);
                        if (replacement != null)
                        {
                            mats[i] = replacement;
                            changed = true;
                        }
                    }
                }
                
                if (changed)
                {
                    r.sharedMaterials = mats;
                    updated++;
                }
            }
        }
        
        Debug.Log($"[Synty] Updated {updated} renderers");
        EditorUtility.DisplayDialog("Done", $"Updated {updated} renderers with materials.", "OK");
    }
    
    Material GetMaterialForSlot(string meshName, int slotIndex)
    {
        // Default to main texture
        Material mat = LoadMaterial("PolygonTown_01_A");
        
        // Check for special cases based on mesh name
        if (meshName.Contains("Glass") || meshName.Contains("Window"))
        {
            Material glassMat = LoadMaterial("Window_Glass");
            if (glassMat != null) return glassMat;
        }
        
        if (meshName.Contains("Water"))
        {
            Material waterMat = LoadMaterial("Water");
            if (waterMat != null) return waterMat;
        }
        
        if (meshName.Contains("Road"))
        {
            Material roadMat = LoadMaterial("PolygonTown_Road");
            if (roadMat != null) return roadMat;
        }
        
        return mat;
    }
    
    Material LoadMaterial(string matName)
    {
        string path = $"{MATERIALS_PATH}/Mat_{matName}.mat";
        return AssetDatabase.LoadAssetAtPath<Material>(path);
    }
    
    void BatchApplyMaterialsInScene()
    {
        Material mainMat = LoadMaterial("PolygonTown_01_A");
        
        if (mainMat == null)
        {
            EditorUtility.DisplayDialog("Materials Not Found", 
                "Please run 'Create All Materials' first.", "OK");
            return;
        }
        
        // Find all renderers in scene
        Renderer[] allRenderers = FindObjectsOfType<Renderer>();
        int updated = 0;
        
        foreach (Renderer r in allRenderers)
        {
            // Check if this is a Synty POLYGON_Town asset
            string path = AssetDatabase.GetAssetPath(r.gameObject);
            if (!path.Contains("POLYGON_Town") && !r.gameObject.name.Contains("SM_"))
                continue;
            
            Material[] mats = r.sharedMaterials;
            bool changed = false;
            
            for (int i = 0; i < mats.Length; i++)
            {
                if (mats[i] == null || mats[i].name.Contains("Default-Material"))
                {
                    Material replacement = GetMaterialForSlot(r.name, i);
                    if (replacement != null)
                    {
                        mats[i] = replacement;
                        changed = true;
                    }
                }
            }
            
            if (changed)
            {
                r.sharedMaterials = mats;
                updated++;
            }
        }
        
        Debug.Log($"[Synty] Batch updated {updated} renderers in scene");
        EditorUtility.DisplayDialog("Batch Complete", 
            $"Updated {updated} renderers with POLYGON_Town materials.", "OK");
    }
    
    void ApplyMainTextureToSelection()
    {
        Material mainMat = LoadMaterial("PolygonTown_01_A");
        
        if (mainMat == null)
        {
            // Try to create it on the fly
            CreateAllMaterials();
            mainMat = LoadMaterial("PolygonTown_01_A");
        }
        
        if (mainMat == null)
        {
            EditorUtility.DisplayDialog("Error", "Could not create/find main material.", "OK");
            return;
        }
        
        int updated = 0;
        foreach (GameObject go in Selection.gameObjects)
        {
            Renderer[] renderers = go.GetComponentsInChildren<Renderer>();
            foreach (Renderer r in renderers)
            {
                Material[] mats = new Material[r.sharedMaterials.Length];
                for (int i = 0; i < mats.Length; i++)
                {
                    mats[i] = mainMat;
                }
                r.sharedMaterials = mats;
                updated++;
            }
        }
        
        Debug.Log($"[Synty] Applied main material to {updated} renderers");
    }
}
