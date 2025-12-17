using UnityEngine;
using MoonRoom.Placement;
using MoonRoom.SaveLoad;

namespace MoonRoom.Core
{
    /// <summary>
    /// Central game manager handling initialization and coordination between systems.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private PlaceableCatalog catalog;
        [SerializeField] private PlacementController placementController;
        [SerializeField] private SaveLoadManager saveLoadManager;
        
        /// <summary>
        /// Singleton instance for easy access.
        /// </summary>
        public static GameManager Instance { get; private set; }
        
        /// <summary>
        /// The active placeable catalog.
        /// </summary>
        public PlaceableCatalog Catalog => catalog;
        
        /// <summary>
        /// The placement controller for placing items.
        /// </summary>
        public PlacementController PlacementController => placementController;
        
        /// <summary>
        /// The save/load manager for persistence.
        /// </summary>
        public SaveLoadManager SaveLoadManager => saveLoadManager;
        
        private void Awake()
        {
            // Singleton pattern
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            
            // Validate references
            if (catalog == null)
                Debug.LogError("GameManager: Catalog reference is missing!");
            if (placementController == null)
                Debug.LogError("GameManager: PlacementController reference is missing!");
            if (saveLoadManager == null)
                Debug.LogError("GameManager: SaveLoadManager reference is missing!");
        }
        
        private void Start()
        {
            // Initialize systems
            if (placementController != null && catalog != null)
            {
                placementController.Initialize(catalog);
            }
            
            // Auto-load saved room
            if (saveLoadManager != null)
            {
                saveLoadManager.LoadRoom();
            }
        }
        
        private void OnDestroy()
        {
            if (Instance == this)
                Instance = null;
        }
    }
}
