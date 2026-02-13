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

    try {
      // Call Python script to search for similar faces
      // const pythonScriptPath = path.join(process.cwd(), 'search_api.py');
      const pythonScriptPath = '/app/search_api.py';

      console.log("search_api.py: python script called")
      // Use python -m to ensure proper module loading
      const command = `python3 "${pythonScriptPath}" "${filePath}"`;
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 120000, // 2 minute timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });
      console.log("STDOUT:", stdout);
      console.log("STDERR:", stderr);
      
      console.log("printing stdout:start")
      console.log(stdout.trim())
      console.log("printing stdout:complete")

      if (stderr && !stdout) {
        throw new Error(stderr);
      }

        const jsonStart = stdout.indexOf("{\"success\"");

        if (jsonStart === -1) {
        throw new Error("No JSON found in stdout");
        }

        const jsonString = stdout.slice(jsonStart);
        const result = JSON.parse(jsonString);
    //   const result = JSON.parse(stdout.trim());

      return NextResponse.json(result);
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.error('Failed to clean up temp file:', cleanupError);
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
