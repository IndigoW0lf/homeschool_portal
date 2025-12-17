using UnityEngine;
using MoonRoom.Core;

namespace MoonRoom.Placement
{
    /// <summary>
    /// Simple IMGUI-based UI for browsing and selecting catalog items.
    /// Shows a panel with buttons for each available placeable.
    /// </summary>
    public class PlacementUI : MonoBehaviour
    {
        [Header("Settings")]
        [SerializeField] private float panelWidth = 200f;
        [SerializeField] private float buttonHeight = 40f;
        [SerializeField] private float padding = 10f;
        
        [Header("References")]
        [SerializeField] private PlaceableCatalog catalog;
        [SerializeField] private PlacementController placementController;
        
        private Vector2 scrollPosition;
        private GUIStyle titleStyle;
        private GUIStyle buttonStyle;
        private GUIStyle infoStyle;
        private bool stylesInitialized = false;
        
        private void InitStyles()
        {
            if (stylesInitialized) return;
            
            titleStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 18,
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter
            };
            
            buttonStyle = new GUIStyle(GUI.skin.button)
            {
                fontSize = 14,
                alignment = TextAnchor.MiddleCenter
            };
            
            infoStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 12,
                wordWrap = true,
                alignment = TextAnchor.MiddleCenter
            };
            
            stylesInitialized = true;
        }
        
        private void OnGUI()
        {
            InitStyles();
            
            if (catalog == null || placementController == null) return;
            
            // Draw catalog panel on the left
            float panelHeight = Screen.height - padding * 2;
            Rect panelRect = new Rect(padding, padding, panelWidth, panelHeight);
            
            GUI.Box(panelRect, "");
            
            GUILayout.BeginArea(new Rect(panelRect.x + 5, panelRect.y + 5, panelRect.width - 10, panelRect.height - 10));
            
            // Title
            GUILayout.Label("🏠 MoonRoom", titleStyle);
            GUILayout.Space(5);
            GUILayout.Label("Placeable Items", GUI.skin.label);
            GUILayout.Space(10);
            
            // Scroll view for items
            scrollPosition = GUILayout.BeginScrollView(scrollPosition, GUILayout.Height(panelHeight - 150));
            
            foreach (var entry in catalog.Entries)
            {
                if (GUILayout.Button(entry.displayName, buttonStyle, GUILayout.Height(buttonHeight)))
                {
                    placementController.StartPlacing(entry);
                }
            }
            
            GUILayout.EndScrollView();
            
            GUILayout.Space(10);
            
            // Status/Help
            GUILayout.Label("Controls:", GUI.skin.label);
            if (placementController.IsPlacing)
            {
                GUILayout.Label("• Click to place", infoStyle);
                GUILayout.Label("• R to rotate", infoStyle);
                GUILayout.Label("• Esc to cancel", infoStyle);
            }
            else
            {
                GUILayout.Label("• Click item above", infoStyle);
            }
            
            GUILayout.Space(10);
            
            // Save/Load info
            GUILayout.Label("Shortcuts:", GUI.skin.label);
            GUILayout.Label("Ctrl+S: Save", infoStyle);
            GUILayout.Label("Ctrl+L: Load", infoStyle);
            GUILayout.Label("Ctrl+N: Clear", infoStyle);
            
            GUILayout.EndArea();
        }
    }
}
