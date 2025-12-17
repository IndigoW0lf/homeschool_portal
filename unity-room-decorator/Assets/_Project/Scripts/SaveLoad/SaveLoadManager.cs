using System.IO;
using UnityEngine;
using MoonRoom.Core;
using MoonRoom.Placement;

namespace MoonRoom.SaveLoad
{
    /// <summary>
    /// Manages saving and loading room state to/from JSON files.
    /// Supports keyboard shortcuts: Ctrl+S (save), Ctrl+L (load), Ctrl+N (clear).
    /// </summary>
    public class SaveLoadManager : MonoBehaviour
    {
        [Header("Settings")]
        [SerializeField] private string saveFileName = "room_save.json";
        
        [Header("References")]
        [SerializeField] private PlaceableCatalog catalog;
        [SerializeField] private PlacementController placementController;
        
        private string SavePath => Path.Combine(Application.persistentDataPath, saveFileName);
        
        /// <summary>
        /// Whether a save file exists.
        /// </summary>
        public bool HasSaveFile => File.Exists(SavePath);
        
        private void Update()
        {
            HandleKeyboardShortcuts();
        }
        
        private void HandleKeyboardShortcuts()
        {
            // Check for Ctrl/Cmd modifier
            bool ctrlHeld = Input.GetKey(KeyCode.LeftControl) || 
                           Input.GetKey(KeyCode.RightControl) ||
                           Input.GetKey(KeyCode.LeftCommand) || 
                           Input.GetKey(KeyCode.RightCommand);
            
            if (!ctrlHeld) return;
            
            // Ctrl+S: Save
            if (Input.GetKeyDown(KeyCode.S))
            {
                SaveRoom();
            }
            
            // Ctrl+L: Load
            if (Input.GetKeyDown(KeyCode.L))
            {
                LoadRoom();
            }
            
            // Ctrl+N: Clear (New)
            if (Input.GetKeyDown(KeyCode.N))
            {
                ClearRoom();
            }
        }
        
        /// <summary>
        /// Save the current room state to JSON file.
        /// </summary>
        public void SaveRoom()
        {
            if (placementController == null)
            {
                Debug.LogError("SaveLoadManager: PlacementController reference is missing!");
                return;
            }
            
            var saveData = new RoomSaveData();
            
            foreach (var item in placementController.PlacedItems)
            {
                if (item == null) continue;
                
                var placeable = item.GetComponent<PlaceableItem>();
                if (placeable == null)
                {
                    Debug.LogWarning($"SaveLoadManager: Item {item.name} missing PlaceableItem component, skipping");
                    continue;
                }
                
                var itemData = new PlacedItemData(
                    placeable.PlaceableId,
                    item.transform.position.x,
                    item.transform.position.y,
                    item.transform.position.z,
                    item.transform.eulerAngles.y
                );
                
                saveData.items.Add(itemData);
            }
            
            string json = JsonUtility.ToJson(saveData, true);
            
            try
            {
                File.WriteAllText(SavePath, json);
                Debug.Log($"Room saved! ({saveData.items.Count} items) -> {SavePath}");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to save room: {e.Message}");
            }
        }
        
        /// <summary>
        /// Load room state from JSON file.
        /// </summary>
        public void LoadRoom()
        {
            if (!HasSaveFile)
            {
                Debug.Log("No save file found, starting with empty room");
                return;
            }
            
            if (catalog == null)
            {
                Debug.LogError("SaveLoadManager: Catalog reference is missing!");
                return;
            }
            
            if (placementController == null)
            {
                Debug.LogError("SaveLoadManager: PlacementController reference is missing!");
                return;
            }
            
            try
            {
                string json = File.ReadAllText(SavePath);
                var saveData = JsonUtility.FromJson<RoomSaveData>(json);
                
                if (saveData == null || saveData.items == null)
                {
                    Debug.LogWarning("Save file is empty or corrupted");
                    return;
                }
                
                // Clear existing items first
                placementController.ClearAllItems();
                
                int loadedCount = 0;
                int failedCount = 0;
                
                foreach (var itemData in saveData.items)
                {
                    var prefab = catalog.GetPrefabById(itemData.placeableId);
                    if (prefab == null)
                    {
                        Debug.LogWarning($"Could not find prefab for ID: {itemData.placeableId}");
                        failedCount++;
                        continue;
                    }
                    
                    Vector3 position = new Vector3(itemData.posX, itemData.posY, itemData.posZ);
                    Quaternion rotation = Quaternion.Euler(0f, itemData.rotY, 0f);
                    
                    GameObject placed = Instantiate(prefab, position, rotation);
                    
                    var entry = catalog.GetEntryById(itemData.placeableId);
                    if (entry != null)
                    {
                        placed.name = entry.displayName;
                    }
                    
                    // Set layer to Placeable
                    SetLayerRecursive(placed, LayerMask.NameToLayer("Placeable"));
                    
                    placementController.RegisterPlacedItem(placed);
                    loadedCount++;
                }
                
                Debug.Log($"Room loaded! ({loadedCount} items" + 
                         (failedCount > 0 ? $", {failedCount} failed" : "") + ")");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to load room: {e.Message}");
            }
        }
        
        /// <summary>
        /// Clear the room and delete the save file.
        /// </summary>
        public void ClearRoom()
        {
            if (placementController != null)
            {
                placementController.ClearAllItems();
            }
            
            if (HasSaveFile)
            {
                try
                {
                    File.Delete(SavePath);
                    Debug.Log("Room cleared and save file deleted");
                }
                catch (System.Exception e)
                {
                    Debug.LogError($"Failed to delete save file: {e.Message}");
                }
            }
            else
            {
                Debug.Log("Room cleared");
            }
        }
        
        private void SetLayerRecursive(GameObject obj, int layer)
        {
            obj.layer = layer;
            foreach (Transform child in obj.transform)
            {
                SetLayerRecursive(child.gameObject, layer);
            }
        }
    }
}
