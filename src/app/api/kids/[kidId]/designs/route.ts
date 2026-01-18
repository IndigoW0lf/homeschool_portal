import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { ItemDesignRow, DesignRegion } from '@/types/design-studio';

interface RouteParams {
  params: Promise<{ kidId: string }>;
}

// GET /api/kids/[kidId]/designs - List all designs for a kid
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { kidId } = await params;
  
  try {
    const supabase = await createServiceRoleClient();
    
    const { data: designs, error } = await supabase
      .from('kid_designs')
      .select('*')
      .eq('kid_id', kidId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[Designs API] Error fetching designs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ designs: designs || [] });
  } catch (error) {
    console.error('[Designs API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/kids/[kidId]/designs - Save a new design
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { kidId } = await params;
  
  try {
    const body = await request.json();
    const { templateId, name, regions, textureImage } = body as {
      templateId: string;
      name: string;
      regions: Record<string, DesignRegion>;
      textureImage?: string; // Base64 data URL
    };
    
    if (!templateId || !name || !regions) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId, name, regions' },
        { status: 400 }
      );
    }
    
    const supabase = await createServiceRoleClient();
    let texture_url = null;

    // Handle texture upload if provided
    if (textureImage) {
      try {
        const base64Data = textureImage.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `${kidId}/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

        const { error: uploadError } = await supabase.storage
          .from('kid-skins')
          .upload(fileName, buffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error('[Designs API] Texture upload failed:', uploadError);
        } else {
          const { data } = supabase.storage.from('kid-skins').getPublicUrl(fileName);
          texture_url = data.publicUrl;
        }
      } catch (e) {
        console.error('[Designs API] Error processing texture:', e);
      }
    }
    
    const { data: design, error } = await supabase
      .from('kid_designs')
      .insert({
        kid_id: kidId,
        template_id: templateId,
        name: name.trim(),
        design_data: { regions },
        is_equipped: false,
        texture_url: texture_url
      })
      .select()
      .single();
    
    if (error) {
      console.error('[Designs API] Error saving design:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ design }, { status: 201 });
  } catch (error) {
    console.error('[Designs API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/kids/[kidId]/designs - Update an existing design
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { kidId } = await params;
  
  try {
    const body = await request.json();
    const { id, templateId, name, regions, isEquipped, textureImage } = body as {
      id: string;
      templateId?: string;
      name?: string;
      regions?: Record<string, DesignRegion>;
      isEquipped?: boolean;
      textureImage?: string;
    };
    
    if (!id) {
      return NextResponse.json({ error: 'Missing design id' }, { status: 400 });
    }
    
    const supabase = await createServiceRoleClient();
    
    const updateData: Partial<ItemDesignRow> = {
      updated_at: new Date().toISOString(),
    };
    
    if (templateId) updateData.template_id = templateId;
    if (name) updateData.name = name.trim();
    if (regions) updateData.design_data = { regions };
    if (typeof isEquipped === 'boolean') updateData.is_equipped = isEquipped;

    // Handle texture upload if provided
    if (textureImage) {
      try {
        const base64Data = textureImage.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `${kidId}/${id}-${Date.now()}.png`; // Use ID in filename for updates

        const { error: uploadError } = await supabase.storage
          .from('kid-skins')
          .upload(fileName, buffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
           console.error('[Designs API] Texture upload failed:', uploadError);
        } else {
           const { data } = supabase.storage.from('kid-skins').getPublicUrl(fileName);
           updateData.texture_url = data.publicUrl;
        }
      } catch (e) {
        console.error('[Designs API] Error processing texture:', e);
      }
    }
    
    const { data: design, error } = await supabase
      .from('kid_designs')
      .update(updateData)
      .eq('id', id)
      .eq('kid_id', kidId) // Ensure kid owns this design
      .select()
      .single();
    
    if (error) {
      console.error('[Designs API] Error updating design:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }
    
    return NextResponse.json({ design });
  } catch (error) {
    console.error('[Designs API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/kids/[kidId]/designs?id=xxx - Delete a design
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { kidId } = await params;
  const url = new URL(request.url);
  const designId = url.searchParams.get('id');
  
  if (!designId) {
    return NextResponse.json({ error: 'Missing design id' }, { status: 400 });
  }
  
  try {
    const supabase = await createServiceRoleClient();
    
    const { error } = await supabase
      .from('kid_designs')
      .delete()
      .eq('id', designId)
      .eq('kid_id', kidId); // Ensure kid owns this design
    
    if (error) {
      console.error('[Designs API] Error deleting design:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Designs API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
