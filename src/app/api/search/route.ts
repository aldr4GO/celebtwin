import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No image provided' 
        },
        { status: 400 }
      );
    }

    // Create temp directory if it doesn't exist
    // const tempDir = path.join(process.cwd(), 'temp');
    const tempDir = '/app/temp';
    await fs.mkdir(tempDir, { recursive: true });

    // Save the uploaded file
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(tempDir, fileName);

    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));

    // const appDir = '/app';
    const appDir = '';
    const command = `cd ${appDir} && python search_api.py "${filePath}"`;
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
        cwd: appDir,
      });
      
      if (stderr) {
        console.log("SEARCH STDERR (debug):", stderr);
      }
      console.log("SEARCH STDOUT:", stdout);

      if (!stdout || stdout.trim().length === 0) {
        const errorMsg = stderr || 'Python returned empty output';
        console.error('SEARCH - Empty output, stderr:', errorMsg);
        return NextResponse.json(
          {
            success: false,
            error: 'Search failed',
            details: 'Python script produced no output',
          },
          { status: 500 }
        );
      }

      // Extract JSON safely - most reliable method is to find last { and parse from there
      const jsonStart = stdout.lastIndexOf('{');

      if (jsonStart === -1) {
        console.error('SEARCH - No JSON object found in output:', stdout);
        return NextResponse.json(
          {
            success: false,
            error: 'Search failed',
            details: `No valid JSON in response. Got: ${stdout.substring(0, 100)}`,
          },
          { status: 500 }
        );
      }

      // Find the matching closing brace
      let braceCount = 0;
      let jsonEnd = -1;
      for (let i = jsonStart; i < stdout.length; i++) {
        if (stdout[i] === '{') braceCount++;
        if (stdout[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
      }

      if (jsonEnd === -1) {
        console.error('SEARCH - Incomplete JSON object found in output:', stdout);
        return NextResponse.json(
          {
            success: false,
            error: 'Search failed',
            details: 'Incomplete JSON response from Python script',
          },
          { status: 500 }
        );
      }

      const jsonString = stdout.slice(jsonStart, jsonEnd);
      
      let result;
      try {
        result = JSON.parse(jsonString);
      } catch (parseError) {
        console.error("SEARCH - JSON PARSE ERROR:", jsonString);
        return NextResponse.json(
          {
            success: false,
            error: 'Search failed',
            details: 'Invalid JSON response from Python',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(result);
    } finally {
      // Clean up temp file
      if (filePath) {
        try {
          await fs.unlink(filePath);
        } catch (cleanupError) {
          console.error('SEARCH - Failed to clean up temp file:', cleanupError);
        }
      }
    }
  } catch (error) {
    console.error('Search error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process image search',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
