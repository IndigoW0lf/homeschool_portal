# MoonRoom Project Notes

## Palette Texture Import Settings

When importing low-poly palette textures (e.g., `palette1.png`), configure the following settings to ensure correct rendering:

### Required Settings

| Setting | Value | Reason |
|---------|-------|--------|
| **Filter Mode** | Point (no filter) | Prevents color bleeding between palette entries |
| **Compression** | None | Preserves exact colors without artifacts |
| **Max Size** | 256 or smaller | Palette textures are typically small |
| **sRGB (Color Texture)** | ✓ On | Ensures correct gamma for color data |
| **Generate Mip Maps** | ✗ Off | Not needed for palette lookups |

### How to Configure

1. Select your palette texture in the Project window
2. In the Inspector, find the **Import Settings**
3. Set **Filter Mode** to **Point (no filter)**
4. Under **Advanced**, set **Compression** to **None**
5. Click **Apply**

### Why This Matters

Low-poly assets typically use a single palette texture where each polygon samples a specific pixel for its color. If filtering is enabled, Unity will blend adjacent pixels, causing:
- Color bleeding at palette boundaries
- Muddied colors on model edges
- Visual artifacts inconsistent with the art style

### Example Import Script (Optional)

If you have many palette textures, you can create an AssetPostprocessor:

```csharp
using UnityEditor;
using UnityEngine;

public class PaletteTextureImporter : AssetPostprocessor
{
    void OnPreprocessTexture()
    {
        // Only process textures in the Textures/Palettes folder
        if (!assetPath.Contains("Palettes")) return;
        
        TextureImporter importer = (TextureImporter)assetImporter;
        importer.filterMode = FilterMode.Point;
        importer.textureCompression = TextureImporterCompression.Uncompressed;
        importer.mipmapEnabled = false;
    }
}
```

Place this script in an `Editor` folder.

---

## Project Structure

```
Assets/_Project/
├── Art/
│   ├── Models/       <- Import .fbx/.obj models here
│   ├── Textures/     <- Palette textures go here
│   └── Materials/    <- Shared materials
├── Prefabs/
│   ├── Placeables/   <- Chair, Table, Lamp, etc.
│   └── Environment/  <- Room parts, decorations
├── Scenes/
│   └── Room_V0.unity <- Main test scene
├── Scripts/
│   ├── Core/         <- PlaceableItem, GameManager
│   ├── Placement/    <- PlacementController, PlacementUI
│   └── SaveLoad/     <- SaveData, SaveLoadManager
├── ScriptableObjects/
│   └── Catalogs/     <- MainCatalog.asset
└── ThirdParty/       <- External packages
```

---

## Controls

| Key | Action |
|-----|--------|
| **Click item in UI** | Start placing that item |
| **Mouse Move** | Ghost follows mouse on floor |
| **Left Click** | Place item |
| **R** | Rotate 90° |
| **Escape** | Cancel placement |
| **Ctrl+S** | Save room |
| **Ctrl+L** | Load room |
| **Ctrl+N** | Clear room (and delete save) |

---

## Save File Location

Saves are stored at:
- **Windows**: `%USERPROFILE%\AppData\LocalLow\MoonRoom Studio\MoonRoom\room_save.json`
- **macOS**: `~/Library/Application Support/MoonRoom Studio/MoonRoom/room_save.json`

---

## Adding New Placeables

1. Create/import your model in `Assets/_Project/Art/Models/`
2. Drag it into the scene and configure:
   - Add `BoxCollider` (or appropriate collider)
   - Add `PlaceableItem` component
   - Right-click component → Generate New GUID
   - Set `Display Name`
3. Drag to `Assets/_Project/Prefabs/Placeables/` to create prefab
4. Open `MainCatalog.asset` in `ScriptableObjects/Catalogs/`
5. Add new entry with matching ID, name, and prefab reference

---

## Unity Version

This project targets **Unity 2022.3 LTS**.
