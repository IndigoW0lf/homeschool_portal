using UnityEditor;
using UnityEngine;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Editor window to analyze and bulk-fix model scales.
/// Window → Model Scale Analyzer
/// </summary>
public class ModelScaleAnalyzer : EditorWindow
{
    private Vector2 scrollPos;
    private List<ModelInfo> models = new List<ModelInfo>();
    private float sizeThreshold = 0.5f; // Models smaller than this are "tiny"
    private bool analyzed = false;
    
    private class ModelInfo
    {
        public string path;
        public string name;
        public float maxDimension;
        public float currentScale;
        public bool isTiny;
    }
    
    [MenuItem("Window/Model Scale Analyzer")]
    public static void ShowWindow()
    {
        GetWindow<ModelScaleAnalyzer>("Model Scale Analyzer");
    }
    
    void OnGUI()
    {
        GUILayout.Label("Model Scale Analyzer", EditorStyles.boldLabel);
        GUILayout.Space(10);
        
        sizeThreshold = EditorGUILayout.FloatField("Tiny Threshold (meters)", sizeThreshold);
        GUILayout.Label("Models smaller than this will be marked as 'tiny'", EditorStyles.miniLabel);
        
        GUILayout.Space(10);
        
        if (GUILayout.Button("Analyze Models in Assets/_Project/Art/Models", GUILayout.Height(30)))
        {
            AnalyzeModels();
        }
        
        if (!analyzed) return;
        
        GUILayout.Space(10);
        
        int tinyCount = models.Count(m => m.isTiny);
        int normalCount = models.Count - tinyCount;
        
        EditorGUILayout.HelpBox(
            $"Found {models.Count} models:\n" +
            $"  • {tinyCount} TINY (need 100x scale)\n" +
            $"  • {normalCount} NORMAL (already good)", 
            tinyCount > normalCount ? MessageType.Warning : MessageType.Info);
        
        GUILayout.Space(5);
        
        EditorGUILayout.BeginHorizontal();
        if (GUILayout.Button($"Fix All {tinyCount} Tiny Models (set to 100x)", GUILayout.Height(25)))
        {
            FixTinyModels();
        }
        if (GUILayout.Button($"Reset All {normalCount} Normal Models (set to 1x)", GUILayout.Height(25)))
        {
            ResetNormalModels();
        }
        EditorGUILayout.EndHorizontal();
        
        GUILayout.Space(10);
        GUILayout.Label("Model List:", EditorStyles.boldLabel);
        
        scrollPos = EditorGUILayout.BeginScrollView(scrollPos);
        
        foreach (var model in models.OrderBy(m => m.isTiny ? 0 : 1).ThenBy(m => m.name))
        {
            EditorGUILayout.BeginHorizontal();
            
            GUI.color = model.isTiny ? Color.yellow : Color.green;
            GUILayout.Label(model.isTiny ? "TINY" : "OK", GUILayout.Width(40));
            GUI.color = Color.white;
            
            GUILayout.Label($"{model.maxDimension:F2}m", GUILayout.Width(60));
            GUILayout.Label(model.name, GUILayout.Width(200));
            
            if (GUILayout.Button("Select", GUILayout.Width(50)))
            {
                Selection.activeObject = AssetDatabase.LoadMainAssetAtPath(model.path);
            }
            
            if (model.isTiny && GUILayout.Button("Fix (100x)", GUILayout.Width(70)))
            {
                SetModelScale(model.path, 100f);
                AnalyzeModels(); // Refresh
            }
            
            if (!model.isTiny && model.currentScale > 1 && GUILayout.Button("Reset (1x)", GUILayout.Width(70)))
            {
                SetModelScale(model.path, 1f);
                AnalyzeModels(); // Refresh
            }
            
            EditorGUILayout.EndHorizontal();
        }
        
        EditorGUILayout.EndScrollView();
    }
    
    void AnalyzeModels()
    {
        models.Clear();
        
        string[] guids = AssetDatabase.FindAssets("t:Model", new[] { "Assets/_Project/Art/Models" });
        
        foreach (string guid in guids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            
            if (prefab == null) continue;
            
            ModelImporter importer = AssetImporter.GetAtPath(path) as ModelImporter;
            if (importer == null) continue;
            
            // Get the mesh bounds
            float maxDim = 0f;
            MeshFilter[] meshFilters = prefab.GetComponentsInChildren<MeshFilter>();
            foreach (var mf in meshFilters)
            {
                if (mf.sharedMesh != null)
                {
                    Bounds bounds = mf.sharedMesh.bounds;
                    float dim = Mathf.Max(bounds.size.x, bounds.size.y, bounds.size.z);
                    maxDim = Mathf.Max(maxDim, dim);
                }
            }
            
            // Also check skinned mesh renderers
            SkinnedMeshRenderer[] skinnedMeshes = prefab.GetComponentsInChildren<SkinnedMeshRenderer>();
            foreach (var smr in skinnedMeshes)
            {
                if (smr.sharedMesh != null)
                {
                    Bounds bounds = smr.sharedMesh.bounds;
                    float dim = Mathf.Max(bounds.size.x, bounds.size.y, bounds.size.z);
                    maxDim = Mathf.Max(maxDim, dim);
                }
            }
            
            models.Add(new ModelInfo
            {
                path = path,
                name = System.IO.Path.GetFileNameWithoutExtension(path),
                maxDimension = maxDim,
                currentScale = importer.globalScale,
                isTiny = maxDim < sizeThreshold
            });
        }
        
        analyzed = true;
    }
    
    void FixTinyModels()
    {
        int count = 0;
        foreach (var model in models.Where(m => m.isTiny))
        {
            SetModelScale(model.path, 100f);
            count++;
        }
        EditorUtility.DisplayDialog("Done", $"Fixed {count} tiny models (set to 100x scale)", "OK");
        AnalyzeModels();
    }
    
    void ResetNormalModels()
    {
        int count = 0;
        foreach (var model in models.Where(m => !m.isTiny && m.currentScale > 1))
        {
            SetModelScale(model.path, 1f);
            count++;
        }
        EditorUtility.DisplayDialog("Done", $"Reset {count} normal models (set to 1x scale)", "OK");
        AnalyzeModels();
    }
    
    void SetModelScale(string path, float scale)
    {
        ModelImporter importer = AssetImporter.GetAtPath(path) as ModelImporter;
        if (importer != null)
        {
            importer.globalScale = scale;
            importer.SaveAndReimport();
        }
    }
}
