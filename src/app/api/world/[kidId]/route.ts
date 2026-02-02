/**
 * World API Route - GET/PUT world map for a kid
 * Uses service role to bypass RLS for kid sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createEmptyWorld, WorldMap } from '@/types/world';

interface RouteParams {
  params: Promise<{ kidId: string }>;
}

// GET: Fetch or create world for kid
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { kidId } = await params;
  
  try {
    const supabase = await createServiceRoleClient();
    
    // Try to fetch existing world
    const { data: existing, error: fetchError } = await supabase
      .from('world_maps')
      .select('*')
      .eq('kid_id', kidId)
      .single();
    
    if (existing) {
      return NextResponse.json({ world: existing });
    }
    
    // If not found, create a new one
    if (fetchError?.code === 'PGRST116') {
      const newWorld = createEmptyWorld(kidId);
      
      const { data: created, error: createError } = await supabase
        .from('world_maps')
        .insert(newWorld)
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating world:', createError);
        return NextResponse.json(
          { error: 'Failed to create world' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ world: created });
    }
    
    // Other fetch errors
    if (fetchError) {
      console.error('Error fetching world:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch world' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ world: null });
  } catch (error) {
    console.error('World GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update world for kid
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { kidId } = await params;
  
  try {
    const body = await request.json() as WorldMap;
    
    // Validate body has required fields
    if (!body.terrain || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: 'Invalid world data' },
        { status: 400 }
      );
    }
    
    const supabase = await createServiceRoleClient();
    
    // Upsert the world map
    const { data, error } = await supabase
      .from('world_maps')
      .upsert({
        kid_id: kidId,
        width: body.width || 10,
        height: body.height || 10,
        terrain: body.terrain,
        items: body.items,
        avatar_x: body.avatar_x ?? 5,
        avatar_y: body.avatar_y ?? 5,
      }, {
        onConflict: 'kid_id',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving world:', error);
      return NextResponse.json(
        { error: 'Failed to save world' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ world: data });
  } catch (error) {
    console.error('World PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
