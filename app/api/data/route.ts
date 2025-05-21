import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch data from your local endpoint
    const response = await fetch('http://localhost:3001/api/data');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return the data to the client
    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: `Failed to fetch sensor data: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}