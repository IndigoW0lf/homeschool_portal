using UnityEngine;

/// <summary>
/// Third-person controller configured for Synty's AC_Polygon_Feminine Animator Controller.
/// Drives all required animator parameters for proper animation playback.
/// </summary>
[RequireComponent(typeof(CharacterController))]
public class ThirdPersonController : MonoBehaviour
{
    [Header("Movement")]
    public float walkSpeed = 3f;
    public float runSpeed = 6f;
    public float rotationSpeed = 10f;
    
    [Header("Jumping")]
    public float jumpHeight = 1.2f;
    public float gravity = -15f;
    
    [Header("Ground Check")]
    public float groundCheckOffset = -0.1f;
    public float groundCheckRadius = 0.3f;
    public LayerMask groundLayers = ~0;
    
    [Header("Camera")]
    public Transform cameraTransform;
    
    [Header("Debug")]
    public bool showAvatarDiagnostics = true;
    
    private CharacterController controller;
    private Animator animator;
    private Vector3 velocity;
    private float currentSpeed;
    private bool isGrounded;
    private bool wasGrounded;
    private bool hasMovementInput;
    private bool isJumping;
    private float fallingDuration;
    private float horizontalInput;
    private float verticalInput;
    
    void Start()
    {
        controller = GetComponent<CharacterController>();
        animator = GetComponentInChildren<Animator>();
        
        if (cameraTransform == null && Camera.main != null)
            cameraTransform = Camera.main.transform;
        
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
        
        if (showAvatarDiagnostics)
            DiagnoseAvatar();
    }
    
    void DiagnoseAvatar()
    {
        Debug.Log("=== AVATAR DIAGNOSTICS ===");
        
        if (animator == null)
        {
            Debug.LogError("❌ NO ANIMATOR FOUND on " + gameObject.name);
            return;
        }
        
        Debug.Log($"✓ Animator found on: {animator.gameObject.name}");
        
        if (animator.avatar == null)
        {
            Debug.LogError("❌ AVATAR IS NULL - This causes T-pose! Assign an Avatar to the Animator.");
        }
        else
        {
            Debug.Log($"✓ Avatar: {animator.avatar.name}");
            Debug.Log($"  - IsHuman: {animator.avatar.isHuman}");
            Debug.Log($"  - IsValid: {animator.avatar.isValid}");
            
            if (!animator.avatar.isValid)
                Debug.LogError("❌ AVATAR IS INVALID - Reconfigure the Avatar in the model's Rig settings!");
            if (!animator.avatar.isHuman && animator.runtimeAnimatorController != null)
                Debug.LogWarning("⚠️ Avatar is Generic but using Humanoid animations - this causes T-pose!");
        }
        
        if (animator.runtimeAnimatorController == null)
        {
            Debug.LogError("❌ NO ANIMATOR CONTROLLER - Assign an Animator Controller!");
        }
        else
        {
            Debug.Log($"✓ Controller: {animator.runtimeAnimatorController.name}");
        }
        
        var smr = GetComponentInChildren<SkinnedMeshRenderer>();
        if (smr == null)
        {
            Debug.LogError("❌ NO SKINNED MESH RENDERER - Character has no mesh to animate!");
        }
        else
        {
            Debug.Log($"✓ SkinnedMeshRenderer: {smr.gameObject.name} ({smr.bones.Length} bones)");
        }
        
        Debug.Log("=== END DIAGNOSTICS ===");
    }
    
    void Update()
    {
        if (UnityEngine.Input.GetKeyDown(KeyCode.Escape))
            ToggleCursor();
        
        if (UnityEngine.Input.GetKeyDown(KeyCode.D) && UnityEngine.Input.GetKey(KeyCode.LeftShift))
            DiagnoseAvatar();
        
        wasGrounded = isGrounded;
        CheckGrounded();
        HandleMovement();
        HandleJump();
        ApplyGravity();
        
        controller.Move(velocity * Time.deltaTime);
        UpdateAnimator();
    }
    
    void CheckGrounded()
    {
        Vector3 spherePos = transform.position + Vector3.up * groundCheckOffset;
        isGrounded = Physics.CheckSphere(spherePos, groundCheckRadius, groundLayers, QueryTriggerInteraction.Ignore);
        
        // Track falling duration for landing animations
        if (!isGrounded)
        {
            fallingDuration += Time.deltaTime;
        }
        else
        {
            if (!wasGrounded) // Just landed
                isJumping = false;
            fallingDuration = 0f;
        }
    }
    
    void HandleMovement()
    {
        horizontalInput = UnityEngine.Input.GetAxisRaw("Horizontal");
        verticalInput = UnityEngine.Input.GetAxisRaw("Vertical");
        Vector3 input = new Vector3(horizontalInput, 0, verticalInput).normalized;
        
        hasMovementInput = input.magnitude > 0.1f;
        
        bool isRunning = UnityEngine.Input.GetKey(KeyCode.LeftShift);
        float targetSpeed = hasMovementInput ? (isRunning ? runSpeed : walkSpeed) : 0f;
        currentSpeed = Mathf.MoveTowards(currentSpeed, targetSpeed, 10f * Time.deltaTime);
        
        if (hasMovementInput)
        {
            Vector3 moveDir = input;
            if (cameraTransform != null)
            {
                Vector3 camFwd = cameraTransform.forward; camFwd.y = 0; camFwd.Normalize();
                Vector3 camRight = cameraTransform.right; camRight.y = 0; camRight.Normalize();
                moveDir = (camFwd * verticalInput + camRight * horizontalInput).normalized;
            }
            
            if (moveDir.magnitude > 0.1f)
            {
                transform.rotation = Quaternion.Slerp(transform.rotation, 
                    Quaternion.LookRotation(moveDir), Time.deltaTime * rotationSpeed);
            }
            
            velocity.x = moveDir.x * currentSpeed;
            velocity.z = moveDir.z * currentSpeed;
        }
        else
        {
            velocity.x = Mathf.MoveTowards(velocity.x, 0, 10f * Time.deltaTime);
            velocity.z = Mathf.MoveTowards(velocity.z, 0, 10f * Time.deltaTime);
        }
    }
    
    void HandleJump()
    {
        if (UnityEngine.Input.GetButtonDown("Jump") && isGrounded)
        {
            velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
            isJumping = true;
        }
    }
    
    void ApplyGravity()
    {
        if (isGrounded && velocity.y < 0)
            velocity.y = -2f;
        else
            velocity.y += gravity * Time.deltaTime;
    }
    
    void UpdateAnimator()
    {
        if (animator == null) return;
        
        // Debug: Press Shift+D to see values
        if (UnityEngine.Input.GetKeyDown(KeyCode.V))
        {
            Debug.Log($"[DEBUG] currentSpeed={currentSpeed}, hasMovement={hasMovementInput}, isGrounded={isGrounded}");
        }
        
        // IMPORTANT: Set 'Speed' - this is what CleanFeminineController uses!
        animator.SetFloat("Speed", currentSpeed);
        animator.SetFloat("MoveSpeed", currentSpeed);
        
        animator.SetBool("MovementInputHeld", hasMovementInput);
        animator.SetBool("IsStopped", !hasMovementInput && currentSpeed < 0.1f);
        animator.SetBool("IsWalking", hasMovementInput && currentSpeed > 0.1f && currentSpeed <= walkSpeed + 0.5f);
        
        // Ground and jump state
        animator.SetBool("IsGrounded", isGrounded);
        animator.SetBool("IsJumping", isJumping && !isGrounded);
        animator.SetFloat("FallingDuration", fallingDuration);
        
        // Strafe/direction parameters (for more advanced movement)
        animator.SetFloat("StrafeDirectionX", horizontalInput);
        animator.SetFloat("StrafeDirectionZ", verticalInput);
        
        // CurrentGait: 0 = idle, 1 = walk, 2 = run (roughly)
        float gait = 0f;
        if (currentSpeed > 0.5f) gait = 1f;
        if (currentSpeed > walkSpeed + 0.5f) gait = 2f;
        animator.SetFloat("CurrentGait", gait);
    }
    
    void ToggleCursor()
    {
        bool locked = Cursor.lockState == CursorLockMode.Locked;
        Cursor.lockState = locked ? CursorLockMode.None : CursorLockMode.Locked;
        Cursor.visible = locked;
    }
    
    void OnDrawGizmosSelected()
    {
        Gizmos.color = isGrounded ? Color.green : Color.red;
        Gizmos.DrawWireSphere(transform.position + Vector3.up * groundCheckOffset, groundCheckRadius);
    }
}

