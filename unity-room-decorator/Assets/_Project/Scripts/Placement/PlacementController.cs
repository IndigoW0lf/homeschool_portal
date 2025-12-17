using System.Collections.Generic;
using UnityEngine;
using MoonRoom.Core;

namespace MoonRoom.Placement
{
    /// <summary>
    /// Handles object placement mechanics including ghost preview, rotation, and placing.
    /// </summary>
    public class PlacementController : MonoBehaviour
    {
        [Header("Settings")]
        [SerializeField] private LayerMask floorLayer = 1 << 8; // Layer 8 = Floor
        [SerializeField] private float rotationStep = 90f;
        [SerializeField] private Color ghostColor = new Color(0.5f, 0.8f, 1f, 0.5f);
        
        [Header("References")]
        [SerializeField] private Transform placedItemsParent;
        
        private PlaceableCatalog catalog;
        private GameObject ghostObject;
        private CatalogEntry selectedEntry;
        private float currentRotation = 0f;
        private Material ghostMaterial;
        private List<GameObject> placedItems = new List<GameObject>();
        
        /// <summary>
        /// Whether the controller is currently in placement mode.
        /// </summary>
        public bool IsPlacing => ghostObject != null;
        
        /// <summary>
        /// List of all placed items in the scene.
        /// </summary>
        public IReadOnlyList<GameObject> PlacedItems => placedItems;
        
        /// <summary>
        /// Event fired when an item is placed.
        /// </summary>
        public event System.Action<GameObject> OnItemPlaced;
        
        /// <summary>
        /// Event fired when all items are cleared.
        /// </summary>
        public event System.Action OnItemsCleared;
        
        /// <summary>
        /// Initialize the placement controller with a catalog.
        /// </summary>
        public void Initialize(PlaceableCatalog catalog)
        {
            this.catalog = catalog;
            
            // Create ghost material
            ghostMaterial = new Material(Shader.Find("Standard"));
            ghostMaterial.SetFloat("_Mode", 3); // Transparent
            ghostMaterial.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
            ghostMaterial.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
            ghostMaterial.SetInt("_ZWrite", 0);
            ghostMaterial.DisableKeyword("_ALPHATEST_ON");
            ghostMaterial.EnableKeyword("_ALPHABLEND_ON");
            ghostMaterial.DisableKeyword("_ALPHAPREMULTIPLY_ON");
            ghostMaterial.renderQueue = 3000;
            ghostMaterial.color = ghostColor;
            
            // Create parent for placed items if not assigned
            if (placedItemsParent == null)
            {
                var parent = new GameObject("PlacedItems");
                placedItemsParent = parent.transform;
            }
        }
        
        private void Update()
        {
            if (!IsPlacing) return;
            
            UpdateGhostPosition();
            HandleInput();
        }
        
        /// <summary>
        /// Start placing an item from the catalog.
        /// </summary>
        public void StartPlacing(string placeableId)
        {
            if (catalog == null)
            {
                Debug.LogError("PlacementController: No catalog assigned!");
                return;
            }
            
            var entry = catalog.GetEntryById(placeableId);
            if (entry == null || entry.prefab == null)
            {
                Debug.LogError($"PlacementController: Could not find prefab for ID: {placeableId}");
                return;
            }
            
            StartPlacing(entry);
        }
        
        /// <summary>
        /// Start placing an item from a catalog entry.
        /// </summary>
        public void StartPlacing(CatalogEntry entry)
        {
            // Cancel any existing placement
            CancelPlacement();
            
            selectedEntry = entry;
            currentRotation = 0f;
            
            // Create ghost object
            ghostObject = Instantiate(entry.prefab);
            ghostObject.name = $"Ghost_{entry.displayName}";
            
            // Disable colliders on ghost
            foreach (var col in ghostObject.GetComponentsInChildren<Collider>())
            {
                col.enabled = false;
            }
            
            // Apply ghost material
            foreach (var renderer in ghostObject.GetComponentsInChildren<Renderer>())
            {
                var materials = new Material[renderer.materials.Length];
                for (int i = 0; i < materials.Length; i++)
                {
                    materials[i] = ghostMaterial;
                }
                renderer.materials = materials;
            }
            
            // Set layer to Ghost
            SetLayerRecursive(ghostObject, LayerMask.NameToLayer("Ghost"));
        }
        
        /// <summary>
        /// Cancel the current placement and destroy ghost.
        /// </summary>
        public void CancelPlacement()
        {
            if (ghostObject != null)
            {
                Destroy(ghostObject);
                ghostObject = null;
            }
            selectedEntry = null;
            currentRotation = 0f;
        }
        
        /// <summary>
        /// Place the current ghost as a real object.
        /// </summary>
        public void PlaceItem()
        {
            if (!IsPlacing || selectedEntry == null) return;
            
            // Get ghost position and rotation
            Vector3 position = ghostObject.transform.position;
            Quaternion rotation = ghostObject.transform.rotation;
            
            // Destroy ghost
            Destroy(ghostObject);
            ghostObject = null;
            
            // Create real object
            GameObject placed = Instantiate(selectedEntry.prefab, position, rotation, placedItemsParent);
            placed.name = selectedEntry.displayName;
            
            // Set layer to Placeable
            SetLayerRecursive(placed, LayerMask.NameToLayer("Placeable"));
            
            // Track placed item
            placedItems.Add(placed);
            
            // Fire event
            OnItemPlaced?.Invoke(placed);
            
            selectedEntry = null;
            currentRotation = 0f;
        }
        
        /// <summary>
        /// Add an existing item to the placed items list (used by save/load).
        /// </summary>
        public void RegisterPlacedItem(GameObject item)
        {
            if (!placedItems.Contains(item))
            {
                placedItems.Add(item);
                if (placedItemsParent != null)
                {
                    item.transform.SetParent(placedItemsParent);
                }
            }
        }
        
        /// <summary>
        /// Clear all placed items from the scene.
        /// </summary>
        public void ClearAllItems()
        {
            CancelPlacement();
            
            foreach (var item in placedItems)
            {
                if (item != null)
                    Destroy(item);
            }
            placedItems.Clear();
            
            OnItemsCleared?.Invoke();
        }
        
        /// <summary>
        /// Rotate the ghost by the rotation step.
        /// </summary>
        public void RotateGhost()
        {
            if (!IsPlacing) return;
            
            currentRotation += rotationStep;
            if (currentRotation >= 360f)
                currentRotation -= 360f;
                
            ghostObject.transform.rotation = Quaternion.Euler(0f, currentRotation, 0f);
        }
        
        private void UpdateGhostPosition()
        {
            Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
            
            if (Physics.Raycast(ray, out RaycastHit hit, 100f, floorLayer))
            {
                ghostObject.transform.position = hit.point;
            }
        }
        
        private void HandleInput()
        {
            // Left click to place
            if (Input.GetMouseButtonDown(0))
            {
                // Check if mouse is over floor
                Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
                if (Physics.Raycast(ray, out RaycastHit hit, 100f, floorLayer))
                {
                    PlaceItem();
                }
            }
            
            // R to rotate
            if (Input.GetKeyDown(KeyCode.R))
            {
                RotateGhost();
            }
            
            // Escape to cancel
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                CancelPlacement();
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
        
        private void OnDestroy()
        {
            if (ghostMaterial != null)
            {
                Destroy(ghostMaterial);
            }
        }
    }
}
