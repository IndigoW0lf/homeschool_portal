using UnityEngine;

/// <summary>
/// Handles the placement of buildable items.
/// Attach to an empty GameObject in the scene.
/// </summary>
public class BuildingPlacer : MonoBehaviour
{
    [Header("Settings")]
    public LayerMask placementLayers = ~0; // What can we place on
    public Material ghostMaterialValid;    // Green/transparent when valid
    public Material ghostMaterialInvalid;  // Red when can't place
    public float rotationStep = 45f;       // Degrees per R press
    public KeyCode rotateKey = KeyCode.R;
    public KeyCode cancelKey = KeyCode.Escape;
    public KeyCode deleteKey = KeyCode.X;
    public KeyCode gridSnapKey = KeyCode.G;
    
    [Header("State")]
    public bool isInBuildMode = false;
    public bool gridSnapEnabled = true;
    public float gridSize = 1f;
    
    // Current placement state
    private BuildableItem currentItem;
    private GameObject ghostObject;
    private float currentRotation = 0f;
    private bool canPlace = false;
    
    // Singleton for easy access
    public static BuildingPlacer Instance { get; private set; }
    
    void Awake()
    {
        Instance = this;
    }
    
    void Update()
    {
        if (!isInBuildMode) return;
        
        if (ghostObject != null)
        {
            UpdateGhostPosition();
            HandleInput();
        }
    }
    
    /// <summary>
    /// Start placing a specific item.
    /// </summary>
    public void StartPlacing(BuildableItem item)
    {
        if (item == null || item.prefab == null) return;
        
        // Cancel any current placement
        CancelPlacement();
        
        currentItem = item;
        isInBuildMode = true;
        gridSize = item.gridSize;
        
        // Create ghost preview
        ghostObject = Instantiate(item.prefab);
        ghostObject.name = "PlacementGhost";
        
        // Disable all colliders on ghost
        foreach (var col in ghostObject.GetComponentsInChildren<Collider>())
            col.enabled = false;
        
        // Apply ghost material
        ApplyGhostMaterial(true);
        
        // Unlock cursor for building
        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;
    }
    
    /// <summary>
    /// Cancel current placement.
    /// </summary>
    public void CancelPlacement()
    {
        if (ghostObject != null)
        {
            Destroy(ghostObject);
            ghostObject = null;
        }
        currentItem = null;
        currentRotation = 0f;
    }
    
    /// <summary>
    /// Exit build mode entirely.
    /// </summary>
    public void ExitBuildMode()
    {
        CancelPlacement();
        isInBuildMode = false;
        
        // Lock cursor again for gameplay
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }
    
    private void UpdateGhostPosition()
    {
        Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
        
        if (Physics.Raycast(ray, out RaycastHit hit, 100f, placementLayers))
        {
            Vector3 targetPos = hit.point + currentItem.placementOffset;
            
            // Apply grid snapping
            if (gridSnapEnabled && gridSize > 0)
            {
                targetPos.x = Mathf.Round(targetPos.x / gridSize) * gridSize;
                targetPos.z = Mathf.Round(targetPos.z / gridSize) * gridSize;
            }
            
            ghostObject.transform.position = targetPos;
            ghostObject.transform.rotation = Quaternion.Euler(0, currentRotation, 0);
            
            canPlace = true;
            ApplyGhostMaterial(true);
        }
        else
        {
            canPlace = false;
            ApplyGhostMaterial(false);
        }
    }
    
    private void HandleInput()
    {
        // Rotate
        if (Input.GetKeyDown(rotateKey))
        {
            currentRotation += rotationStep;
            if (currentRotation >= 360f) currentRotation = 0f;
        }
        
        // Toggle grid snap
        if (Input.GetKeyDown(gridSnapKey))
        {
            gridSnapEnabled = !gridSnapEnabled;
            Debug.Log($"Grid snap: {(gridSnapEnabled ? "ON" : "OFF")}");
        }
        
        // Cancel
        if (Input.GetKeyDown(cancelKey))
        {
            CancelPlacement();
            return;
        }
        
        // Place
        if (Input.GetMouseButtonDown(0) && canPlace)
        {
            PlaceObject();
        }
    }
    
    private void PlaceObject()
    {
        // Create the actual object
        GameObject placed = Instantiate(
            currentItem.prefab,
            ghostObject.transform.position,
            ghostObject.transform.rotation
        );
        placed.name = currentItem.displayName;
        
        // Add a component to track placed objects (for save/load later)
        var tracker = placed.AddComponent<PlacedObject>();
        tracker.itemName = currentItem.name;
        
        Debug.Log($"Placed: {currentItem.displayName}");
        
        // Keep ghost active for placing more of the same item
        // (User can press Esc to stop or select a different item)
    }
    
    private void ApplyGhostMaterial(bool valid)
    {
        if (ghostObject == null) return;
        
        Material mat = valid ? ghostMaterialValid : ghostMaterialInvalid;
        if (mat == null) return;
        
        foreach (var renderer in ghostObject.GetComponentsInChildren<Renderer>())
        {
            Material[] mats = new Material[renderer.materials.Length];
            for (int i = 0; i < mats.Length; i++)
                mats[i] = mat;
            renderer.materials = mats;
        }
    }
}

/// <summary>
/// Attached to placed objects for tracking/saving.
/// </summary>
public class PlacedObject : MonoBehaviour
{
    public string itemName;
}
