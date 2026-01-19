import bpy
import sys

# Get input/output paths from command line
input_fbx = sys.argv[-2]
output_glb = sys.argv[-1]

# Clear existing scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Import FBX
bpy.ops.import_scene.fbx(filepath=input_fbx)

# Export as GLB
bpy.ops.export_scene.gltf(
    filepath=output_glb,
    export_format='GLB',
    use_selection=False
)

print(f"Converted {input_fbx} to {output_glb}")
