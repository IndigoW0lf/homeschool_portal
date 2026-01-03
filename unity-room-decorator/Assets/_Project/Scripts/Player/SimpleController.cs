using UnityEngine;

/// <summary>
/// Super simple third-person controller. Just movement, nothing fancy.
/// </summary>
[RequireComponent(typeof(CharacterController))]
public class SimpleController : MonoBehaviour
{
    public float moveSpeed = 5f;
    public float turnSpeed = 10f;
    public float gravity = -20f;
    public float jumpHeight = 1.5f;
    
    private CharacterController cc;
    private Vector3 velocity;
    
    void Start()
    {
        cc = GetComponent<CharacterController>();
    }
    
    void Update()
    {
        // Ground check using CharacterController's built-in
        if (cc.isGrounded && velocity.y < 0)
        {
            velocity.y = -2f; // Small downward force to stay grounded
        }
        
        // Get input
        float h = Input.GetAxisRaw("Horizontal");
        float v = Input.GetAxisRaw("Vertical");
        Vector3 move = new Vector3(h, 0, v).normalized;
        
        // Move relative to camera if one exists
        if (Camera.main != null && move.magnitude > 0.1f)
        {
            Vector3 camForward = Camera.main.transform.forward;
            Vector3 camRight = Camera.main.transform.right;
            camForward.y = 0;
            camRight.y = 0;
            camForward.Normalize();
            camRight.Normalize();
            
            move = camForward * v + camRight * h;
            move.Normalize();
            
            // Rotate to face movement direction
            transform.rotation = Quaternion.Slerp(
                transform.rotation,
                Quaternion.LookRotation(move),
                turnSpeed * Time.deltaTime
            );
        }
        
        // Apply horizontal movement
        cc.Move(move * moveSpeed * Time.deltaTime);
        
        // Jump
        if (Input.GetButtonDown("Jump") && cc.isGrounded)
        {
            velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
        }
        
        // Apply gravity
        velocity.y += gravity * Time.deltaTime;
        cc.Move(velocity * Time.deltaTime);
    }
}
