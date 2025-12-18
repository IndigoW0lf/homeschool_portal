using UnityEngine;

/// <summary>
/// Third-person character controller for exploring the town.
/// Attach this to your character model along with a CharacterController component.
/// 
/// Controls:
/// - WASD: Move
/// - Mouse: Look around
/// - Space: Jump
/// - Shift: Run
/// </summary>
[RequireComponent(typeof(CharacterController))]
public class ThirdPersonController : MonoBehaviour
{
    [Header("Movement")]
    [Tooltip("Walking speed in units per second")]
    public float walkSpeed = 3f;
    
    [Tooltip("Running speed in units per second")]
    public float runSpeed = 6f;
    
    [Tooltip("How fast the character turns to face movement direction")]
    public float rotationSpeed = 10f;
    
    [Tooltip("Smoothing for movement transitions")]
    public float movementSmoothing = 0.1f;
    
    [Header("Jumping")]
    [Tooltip("How high the character can jump")]
    public float jumpHeight = 1.2f;
    
    [Tooltip("Gravity applied to the character")]
    public float gravity = -15f;
    
    [Header("Ground Check")]
    [Tooltip("Offset for ground check sphere")]
    public float groundCheckOffset = -0.1f;
    
    [Tooltip("Radius of ground check sphere")]
    public float groundCheckRadius = 0.3f;
    
    [Tooltip("Layers considered as ground")]
    public LayerMask groundLayers = ~0; // Default to all layers
    
    [Header("Camera")]
    [Tooltip("Reference to the camera following this character (auto-finds Main Camera if empty)")]
    public Transform cameraTransform;
    
    // Private variables
    private CharacterController controller;
    private Vector3 velocity;
    private Vector3 currentMovement;
    private Vector3 movementVelocity;
    private bool isGrounded;
    private float currentSpeed;
    
    // Animation support (optional)
    private Animator animator;
    private static readonly int SpeedHash = Animator.StringToHash("Speed");
    private static readonly int GroundedHash = Animator.StringToHash("Grounded");
    private static readonly int JumpHash = Animator.StringToHash("Jump");
    
    void Start()
    {
        controller = GetComponent<CharacterController>();
        animator = GetComponentInChildren<Animator>();
        
        // Auto-find main camera if not assigned
        if (cameraTransform == null && Camera.main != null)
        {
            cameraTransform = Camera.main.transform;
        }
        
        // Lock cursor for gameplay
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }
    
    void Update()
    {
        // Ground check
        CheckGrounded();
        
        // Handle movement input
        HandleMovement();
        
        // Handle jumping
        HandleJump();
        
        // Apply gravity
        ApplyGravity();
        
        // Move the character
        controller.Move((currentMovement + velocity) * Time.deltaTime);
        
        // Update animator if present
        UpdateAnimator();
    }
    
    void CheckGrounded()
    {
        Vector3 spherePosition = transform.position + Vector3.up * groundCheckOffset;
        isGrounded = Physics.CheckSphere(spherePosition, groundCheckRadius, groundLayers, QueryTriggerInteraction.Ignore);
    }
    
    void HandleMovement()
    {
        // Get input
        float horizontal = Input.GetAxisRaw("Horizontal");
        float vertical = Input.GetAxisRaw("Vertical");
        Vector3 inputDirection = new Vector3(horizontal, 0, vertical).normalized;
        
        // Determine speed
        bool isRunning = Input.GetKey(KeyCode.LeftShift);
        float targetSpeed = inputDirection.magnitude > 0.1f ? (isRunning ? runSpeed : walkSpeed) : 0f;
        currentSpeed = Mathf.Lerp(currentSpeed, targetSpeed, Time.deltaTime / movementSmoothing);
        
        if (inputDirection.magnitude > 0.1f)
        {
            // Calculate movement direction relative to camera
            Vector3 moveDirection = inputDirection;
            
            if (cameraTransform != null)
            {
                // Get camera forward and right (flattened to horizontal plane)
                Vector3 camForward = cameraTransform.forward;
                Vector3 camRight = cameraTransform.right;
                camForward.y = 0;
                camRight.y = 0;
                camForward.Normalize();
                camRight.Normalize();
                
                // Calculate world-space movement direction
                moveDirection = camForward * vertical + camRight * horizontal;
                moveDirection.Normalize();
            }
            
            // Rotate character to face movement direction
            if (moveDirection.magnitude > 0.1f)
            {
                Quaternion targetRotation = Quaternion.LookRotation(moveDirection);
                transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, Time.deltaTime * rotationSpeed);
            }
            
            // Apply movement
            Vector3 targetMovement = moveDirection * currentSpeed;
            currentMovement = Vector3.SmoothDamp(currentMovement, targetMovement, ref movementVelocity, movementSmoothing);
        }
        else
        {
            // Slow down when not moving
            currentMovement = Vector3.SmoothDamp(currentMovement, Vector3.zero, ref movementVelocity, movementSmoothing);
        }
    }
    
    void HandleJump()
    {
        if (Input.GetButtonDown("Jump") && isGrounded)
        {
            // Calculate jump velocity using physics formula: v = sqrt(2 * g * h)
            velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
            
            // Trigger jump animation if available
            if (animator != null)
            {
                animator.SetTrigger(JumpHash);
            }
        }
    }
    
    void ApplyGravity()
    {
        if (isGrounded && velocity.y < 0)
        {
            // Keep a small downward velocity when grounded to maintain ground contact
            velocity.y = -2f;
        }
        else
        {
            // Apply gravity over time
            velocity.y += gravity * Time.deltaTime;
        }
    }
    
    void UpdateAnimator()
    {
        if (animator == null) return;
        
        // Update animation parameters (if your character has an Animator)
        animator.SetFloat(SpeedHash, currentSpeed);
        animator.SetBool(GroundedHash, isGrounded);
    }
    
    // Visual debugging in editor
    void OnDrawGizmosSelected()
    {
        // Draw ground check sphere
        Vector3 spherePosition = transform.position + Vector3.up * groundCheckOffset;
        Gizmos.color = isGrounded ? Color.green : Color.red;
        Gizmos.DrawWireSphere(spherePosition, groundCheckRadius);
    }
    
    // Public method to unlock cursor (for menus, etc.)
    public void UnlockCursor()
    {
        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;
    }
    
    // Public method to lock cursor (resume gameplay)
    public void LockCursor()
    {
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }
}
