using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

/// <summary>
/// Main UI controller for build mode.
/// Manages the catalog panel, category tabs, and item selection.
/// </summary>
public class BuildModeUI : MonoBehaviour
{
    [Header("References")]
    public BuildingCatalog catalog;
    public BuildingPlacer placer;
    
    [Header("UI Elements")]
    public GameObject buildPanel;           // Main build mode panel
    public Transform categoryButtonContainer; // Where category buttons go
    public Transform itemGridContainer;     // Where item buttons go
    public Button buildModeToggleButton;    // Button to enter/exit build mode
    public Text currentCategoryText;        // Shows current category name
    public Text controlsHintText;           // Shows keyboard shortcuts
    
    [Header("Prefabs")]
    public GameObject categoryButtonPrefab;
    public GameObject itemButtonPrefab;
    
    [Header("Settings")]
    public KeyCode toggleBuildModeKey = KeyCode.B;
    
    private BuildingCategory currentCategory;
    private List<Button> categoryButtons = new List<Button>();
    private List<GameObject> itemButtons = new List<GameObject>();
    
    void Start()
    {
        // Hide panel initially
        if (buildPanel != null)
            buildPanel.SetActive(false);
        
        // Setup toggle button
        if (buildModeToggleButton != null)
            buildModeToggleButton.onClick.AddListener(ToggleBuildMode);
        
        // Generate category buttons
        if (catalog != null)
            GenerateCategoryButtons();
        
        UpdateControlsHint();
    }
    
    void Update()
    {
        // Toggle with keyboard
        if (Input.GetKeyDown(toggleBuildModeKey))
        {
            ToggleBuildMode();
        }
    }
    
    public void ToggleBuildMode()
    {
        bool entering = !buildPanel.activeSelf;
        
        buildPanel.SetActive(entering);
        
        if (entering)
        {
            // Entering build mode
            if (placer != null)
                placer.isInBuildMode = true;
            
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
            
            // Show first category
            if (catalog != null)
            {
                var categories = catalog.GetAvailableCategories();
                if (categories.Count > 0)
                    ShowCategory(categories[0]);
            }
        }
        else
        {
            // Exiting build mode
            if (placer != null)
                placer.ExitBuildMode();
        }
    }
    
    private void GenerateCategoryButtons()
    {
        // Clear existing
        foreach (var btn in categoryButtons)
            Destroy(btn.gameObject);
        categoryButtons.Clear();
        
        if (categoryButtonPrefab == null || categoryButtonContainer == null) return;
        
        var categories = catalog.GetAvailableCategories();
        
        // If no categories defined, create all default ones
        if (categories.Count == 0)
        {
            categories = new List<BuildingCategory>
            {
                BuildingCategory.Buildings,
                BuildingCategory.Furniture,
                BuildingCategory.Nature,
                BuildingCategory.Props,
                BuildingCategory.Decorations
            };
        }
        
        foreach (var cat in categories)
        {
            GameObject btnObj = Instantiate(categoryButtonPrefab, categoryButtonContainer);
            Button btn = btnObj.GetComponent<Button>();
            Text btnText = btnObj.GetComponentInChildren<Text>();
            
            if (btnText != null)
                btnText.text = cat.ToString();
            
            BuildingCategory capturedCat = cat; // Capture for closure
            btn.onClick.AddListener(() => ShowCategory(capturedCat));
            
            categoryButtons.Add(btn);
        }
    }
    
    public void ShowCategory(BuildingCategory category)
    {
        currentCategory = category;
        
        if (currentCategoryText != null)
            currentCategoryText.text = category.ToString();
        
        // Clear existing item buttons
        foreach (var obj in itemButtons)
            Destroy(obj);
        itemButtons.Clear();
        
        if (catalog == null || itemButtonPrefab == null || itemGridContainer == null) return;
        
        var items = catalog.GetItemsByCategory(category);
        
        foreach (var item in items)
        {
            if (item == null) continue;
            
            GameObject btnObj = Instantiate(itemButtonPrefab, itemGridContainer);
            Button btn = btnObj.GetComponent<Button>();
            Image img = btnObj.transform.Find("Icon")?.GetComponent<Image>();
            Text txt = btnObj.GetComponentInChildren<Text>();
            
            if (img != null && item.icon != null)
                img.sprite = item.icon;
            
            if (txt != null)
                txt.text = item.displayName;
            
            BuildableItem capturedItem = item;
            btn.onClick.AddListener(() => SelectItem(capturedItem));
            
            itemButtons.Add(btnObj);
        }
    }
    
    public void SelectItem(BuildableItem item)
    {
        if (placer != null && item != null)
        {
            placer.StartPlacing(item);
        }
    }
    
    private void UpdateControlsHint()
    {
        if (controlsHintText != null)
        {
            controlsHintText.text = "[R] Rotate | [G] Grid Snap | [X] Delete | [Esc] Cancel | [B] Exit Build";
        }
    }
}
