using UnityEngine;

/// <summary>
/// Third-person camera that orbits around and follows a target.
/// Attach this to your Main Camera.
/// </summary>
public class ThirdPersonCamera : MonoBehaviour
{
    [Header("Target")]
    [Tooltip("The target to follow (usually the player character)")]
    public Transform target;
    
    [Tooltip("Offset from target's pivot point")]
    public Vector3 targetOffset = new Vector3(0, 1.5f, 0);
    
    [Header("Distance")]
    public float distance = 5f;
    public float minDistance = 2f;
    public float maxDistance = 10f;
    public float zoomSpeed = 2f;
    
    [Header("Rotation")]
    public float horizontalSensitivity = 3f;
    public float verticalSensitivity = 2f;
    public float minVerticalAngle = -20f;
    public float maxVerticalAngle = 60f;
    
    [Header("Smoothing")]
    public float followSmoothing = 0.1f;
    public float rotationSmoothing = 0.05f;
    
    [Header("Collision")]
    public bool enableCollision = true;
    public LayerMask collisionLayers = ~0;
    public float collisionBuffer = 0.2f;
    
    // Private variables
    private float currentHorizontalAngle;
    private float currentVerticalAngle = 20f;
    private float currentDistance;
    private Vector3 currentVelocity;
    private float targetHorizontalAngle;
    private float targetVerticalAngle;
    
    void Start()
    {
        currentDistance = distance;
        
        Vector3 angles = transform.eulerAngles;
        currentHorizontalAngle = angles.y;
        currentVerticalAngle = angles.x;
        
        if (currentVerticalAngle > 180) currentVerticalAngle -= 360;
        currentVerticalAngle = Mathf.Clamp(currentVerticalAngle, minVerticalAngle, maxVerticalAngle);
        
        targetHorizontalAngle = currentHorizontalAngle;
        targetVerticalAngle = currentVerticalAngle;
        
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
        if (Cursor.lockState != CursorLockMode.Locked) return;
        
        // Get mouse input using legacy Input
        float mouseX = UnityEngine.Input.GetAxis("Mouse X") * horizontalSensitivity;
        float mouseY = UnityEngine.Input.GetAxis("Mouse Y") * verticalSensitivity;
        
        // Update target angles
        targetHorizontalAngle += mouseX;
        targetVerticalAngle -= mouseY;
        
        // Clamp vertical angle
        targetVerticalAngle = Mathf.Clamp(targetVerticalAngle, minVerticalAngle, maxVerticalAngle);
        
        // Handle zoom with scroll wheel
        float scroll = UnityEngine.Input.GetAxis("Mouse ScrollWheel");
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
        
        RaycastHit hit;
        if (Physics.SphereCast(targetPos, collisionBuffer, direction, out hit, desiredDistance, collisionLayers, QueryTriggerInteraction.Ignore))
        {
            float adjustedDistance = hit.distance - collisionBuffer;
            adjustedDistance = Mathf.Max(adjustedDistance, minDistance * 0.5f);
            return targetPos + direction * adjustedDistance;
        }
        
        return desiredPos;
    }
    
    public void SetTarget(Transform newTarget)
    {
        target = newTarget;
    }
    
    void OnDrawGizmosSelected()
    {
        if (target == null) return;
        
        Gizmos.color = Color.cyan;
        Gizmos.DrawWireSphere(target.position + targetOffset, 0.2f);
        
        Gizmos.color = Color.yellow;
        Gizmos.DrawLine(target.position + targetOffset, transform.position);
    }
}
