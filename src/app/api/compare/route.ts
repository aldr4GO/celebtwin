import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image1 = formData.get('image1') as File;
    const image2 = formData.get('image2') as File;

    if (!image1 || !image2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Both images are required',
        },
        { status: 400 }
      );
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    // Save both files
    const fileName1 = `${Date.now()}-1-${image1.name}`;
    const fileName2 = `${Date.now()}-2-${image2.name}`;
    const filePath1 = path.join(tempDir, fileName1);
    const filePath2 = path.join(tempDir, fileName2);

    const bytes1 = await image1.arrayBuffer();
    const bytes2 = await image2.arrayBuffer();
    await fs.writeFile(filePath1, Buffer.from(bytes1));
    await fs.writeFile(filePath2, Buffer.from(bytes2));

    try {
      // Call Python script to compare faces
      const pythonScriptPath = path.join(process.cwd(), 'compare_api.py');

      const command = `python "${pythonScriptPath}" "${filePath1}" "${filePath2}"`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      });
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
      // Clean up temp files
      try {
        await fs.unlink(filePath1);
        await fs.unlink(filePath2);
      } catch (cleanupError) {
        console.error('Failed to clean up temp files:', cleanupError);
      }
    }
  } catch (error) {
    console.error('Compare error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to compare images',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
