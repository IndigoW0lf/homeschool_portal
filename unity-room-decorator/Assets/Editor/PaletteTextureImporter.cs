using UnityEditor;
using UnityEngine;

public class PaletteTextureImporter : AssetPostprocessor
{
    void OnPreprocessTexture()
    {
        // Only process textures in the Textures folder
        // We look for "Textures" in the path to be safe, assuming the structure Assets/_Project/Art/Textures
        if (!assetPath.Contains("Textures")) return;
        
        TextureImporter importer = (TextureImporter)assetImporter;
        
        // Settings for low-poly/pixel art palette textures
        importer.filterMode = FilterMode.Point;
        importer.textureCompression = TextureImporterCompression.Uncompressed;
        importer.mipmapEnabled = false;
        importer.sRGBTexture = true;
    }
}
