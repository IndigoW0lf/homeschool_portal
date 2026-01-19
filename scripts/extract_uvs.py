import bpy
import json
import os
import sys

# Get output directory from command line
output_dir = sys.argv[-1]
input_fbx = sys.argv[-2]

# Clear existing scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Import FBX
bpy.ops.import_scene.fbx(filepath=input_fbx)

# Collect UV data for all meshes
uv_data = {}

for obj in bpy.data.objects:
    if obj.type == 'MESH':
        mesh = obj.data
        if mesh.uv_layers:
            uv_layer = mesh.uv_layers.active
            
            # Get UV bounds
            min_u, min_v = float('inf'), float('inf')
            max_u, max_v = float('-inf'), float('-inf')
            
            for loop in mesh.loops:
                uv = uv_layer.data[loop.index].uv
                min_u = min(min_u, uv.x)
                max_u = max(max_u, uv.x)
                min_v = min(min_v, uv.y)
                max_v = max(max_v, uv.y)
            
            uv_data[obj.name] = {
                'uv_bounds': {
                    'min_u': min_u,
                    'max_u': max_u,
                    'min_v': min_v,
                    'max_v': max_v
                },
                'num_vertices': len(mesh.vertices),
                'num_faces': len(mesh.polygons),
                'materials': [mat.name if mat else 'None' for mat in obj.data.materials]
            }
            
            print(f"Object: {obj.name}")
            print(f"  UV bounds: ({min_u:.3f}, {min_v:.3f}) to ({max_u:.3f}, {max_v:.3f})")
            print(f"  Materials: {uv_data[obj.name]['materials']}")

# Save UV data to JSON
uv_json_path = os.path.join(output_dir, 'uv_data.json')
with open(uv_json_path, 'w') as f:
    json.dump(uv_data, f, indent=2)

print(f"\nUV data saved to: {uv_json_path}")

# Export UV layout as SVG for the first mesh with UVs
for obj in bpy.data.objects:
    if obj.type == 'MESH' and obj.data.uv_layers:
        # Select the object
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        
        # Enter edit mode
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        
        # Export UV layout - try PNG first (more reliable)
        try:
            uv_path = os.path.join(output_dir, f'{obj.name}_uv_layout.png')
            bpy.ops.uv.export_layout(
                filepath=uv_path,
                size=(1024, 1024),
                opacity=1.0,
                mode='PNG'
            )
            print(f"UV layout exported: {uv_path}")
        except Exception as e:
            print(f"Failed to export UV for {obj.name}: {e}")
        
        bpy.ops.object.mode_set(mode='OBJECT')
        obj.select_set(False)

print("\nUV extraction complete!")
