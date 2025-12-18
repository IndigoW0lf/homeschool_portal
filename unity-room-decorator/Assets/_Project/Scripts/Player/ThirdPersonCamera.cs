using UnityEngine;

/// <summary>
/// Third-person camera that orbits around and follows a target.
/// Attach this to your Main Camera.
/// 
/// Controls:
/// - Mouse X/Y: Orbit around character
/// - Scroll Wheel: Zoom in/out
/// </summary>
public class ThirdPersonCamera : MonoBehaviour
{
    [Header("Target")]
    [Tooltip("The target to follow (usually the player character)")]
    public Transform target;
    
    [Tooltip("Offset from target's pivot point (usually up to shoulder level)")]
    public Vector3 targetOffset = new Vector3(0, 1.5f, 0);
    
    [Header("Distance")]
    [Tooltip("Default distance from target")]
    public float distance = 5f;
    
    [Tooltip("Minimum zoom distance")]
    public float minDistance = 2f;
    
    [Tooltip("Maximum zoom distance")]
    public float maxDistance = 10f;
    
    [Tooltip("Zoom speed with scroll wheel")]
    public float zoomSpeed = 2f;
    
    [Header("Rotation")]
    [Tooltip("Mouse sensitivity for horizontal rotation")]
    public float horizontalSensitivity = 3f;
    
    [Tooltip("Mouse sensitivity for vertical rotation")]
    public float verticalSensitivity = 2f;
    
    [Tooltip("Minimum vertical angle (looking up)")]
    public float minVerticalAngle = -20f;
    
    [Tooltip("Maximum vertical angle (looking down)")]
    public float maxVerticalAngle = 60f;
    
    [Header("Smoothing")]
    [Tooltip("How smoothly the camera follows the target")]
    public float followSmoothing = 0.1f;
    
    [Tooltip("How smoothly the camera rotates")]
    public float rotationSmoothing = 0.05f;
    
    [Header("Collision")]
    [Tooltip("Enable camera collision to prevent clipping through walls")]
    public bool enableCollision = true;
    
    [Tooltip("Layers the camera will collide with")]
    public LayerMask collisionLayers = ~0;
    
    [Tooltip("How close the camera can get to obstacles")]
    public float collisionBuffer = 0.2f;
    
    // Private variables
    private float currentHorizontalAngle;
    private float currentVerticalAngle = 20f; // Start slightly above
    private float currentDistance;
    private Vector3 currentVelocity;
    private float targetHorizontalAngle;
    private float targetVerticalAngle;
    
    void Start()
    {
        currentDistance = distance;
        
        // Initialize angles from current camera rotation
        Vector3 angles = transform.eulerAngles;
        currentHorizontalAngle = angles.y;
        currentVerticalAngle = angles.x;
        
        // Clamp initial vertical angle
        if (currentVerticalAngle > 180) currentVerticalAngle -= 360;
        currentVerticalAngle = Mathf.Clamp(currentVerticalAngle, minVerticalAngle, maxVerticalAngle);
        
        targetHorizontalAngle = currentHorizontalAngle;
        targetVerticalAngle = currentVerticalAngle;
        
        // Try to find player if target not set
        if (target == null)
        {
            ThirdPersonController player = FindObjectOfType<ThirdPersonController>();
            if (player != null)
            {
                target = player.transform;
            }
        }
    }
    
    void LateUpdate()
    {
        if (target == null) return;
        
        HandleInput();
        UpdateCameraPosition();
    }
    
    void HandleInput()
    {
        // Only process input when cursor is locked (gameplay mode)
        if (Cursor.lockState != CursorLockMode.Locked) return;
        
        // Get mouse input
        float mouseX = Input.GetAxis("Mouse X") * horizontalSensitivity;
        float mouseY = Input.GetAxis("Mouse Y") * verticalSensitivity;
        
        // Update target angles
        targetHorizontalAngle += mouseX;
        targetVerticalAngle -= mouseY; // Inverted for natural feel
        
        // Clamp vertical angle
        targetVerticalAngle = Mathf.Clamp(targetVerticalAngle, minVerticalAngle, maxVerticalAngle);
        
        // Handle zoom
        float scroll = Input.GetAxis("Mouse ScrollWheel");
        if (Mathf.Abs(scroll) > 0.01f)
        {
            distance -= scroll * zoomSpeed;
            distance = Mathf.Clamp(distance, minDistance, maxDistance);
        }
    }
    
    void UpdateCameraPosition()
    {
        // Smooth rotation
        currentHorizontalAngle = Mathf.LerpAngle(currentHorizontalAngle, targetHorizontalAngle, Time.deltaTime / rotationSmoothing);
        currentVerticalAngle = Mathf.Lerp(currentVerticalAngle, targetVerticalAngle, Time.deltaTime / rotationSmoothing);
        
        // Smooth zoom
        currentDistance = Mathf.Lerp(currentDistance, distance, Time.deltaTime / followSmoothing);
        
        // Calculate camera rotation
        Quaternion rotation = Quaternion.Euler(currentVerticalAngle, currentHorizontalAngle, 0);
        
        // Calculate desired position
        Vector3 targetPosition = target.position + targetOffset;
        Vector3 desiredPosition = targetPosition - (rotation * Vector3.forward * currentDistance);
        
        // Handle collision
        if (enableCollision)
        {
            desiredPosition = HandleCameraCollision(targetPosition, desiredPosition);
        }
        
        // Smoothly move camera
        transform.position = Vector3.SmoothDamp(transform.position, desiredPosition, ref currentVelocity, followSmoothing);
        
        // Always look at target
        transform.LookAt(targetPosition);
    }
    
    Vector3 HandleCameraCollision(Vector3 targetPos, Vector3 desiredPos)
    {
        Vector3 direction = desiredPos - targetPos;
        float desiredDistance = direction.magnitude;
        direction.Normalize();
        
        // Raycast from target to desired camera position
        RaycastHit hit;
        if (Physics.SphereCast(targetPos, collisionBuffer, direction, out hit, desiredDistance, collisionLayers, QueryTriggerInteraction.Ignore))
        {
            // Move camera closer to avoid clipping
            float adjustedDistance = hit.distance - collisionBuffer;
            adjustedDistance = Mathf.Max(adjustedDistance, minDistance * 0.5f);
            return targetPos + direction * adjustedDistance;
        }
        
        return desiredPos;
    }
    
    // Public method to set a new target
    public void SetTarget(Transform newTarget)
    {
        target = newTarget;
    }
    
    // Public method to reset camera behind character
    public void ResetBehindCharacter()
    {
        if (target == null) return;
        
        targetHorizontalAngle = target.eulerAngles.y;
        targetVerticalAngle = 20f;
    }
    
    // Visual debugging
    void OnDrawGizmosSelected()
    {
        if (target == null) return;
        
        // Draw target offset
        Gizmos.color = Color.cyan;
        Gizmos.DrawWireSphere(target.position + targetOffset, 0.2f);
        
        // Draw line to camera
        Gizmos.color = Color.yellow;
        Gizmos.DrawLine(target.position + targetOffset, transform.position);
    }
}
