import { NextResponse } from 'next/server';
import { seedDatabase, clearSeedData } from '@/lib/seedDatabase';

/**
 * POST /api/seed - Seed database with threat intelligence
 * DELETE /api/seed - Clear all seed data
 */

export async function POST() {
  try {
    const result = await seedDatabase();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 503 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in seed endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const result = await clearSeedData();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error in clear seed endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to clear seed data' },
      { status: 500 }
    );
  }
}
