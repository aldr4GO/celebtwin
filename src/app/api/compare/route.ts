import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  let filePath1 = '';
  let filePath2 = '';

  try {
    const formData = await request.formData();
    const image1 = formData.get('image1') as File;
    const image2 = formData.get('image2') as File;

    if (!image1 || !image2) {
      return NextResponse.json(
        { success: false, error: 'Both images are required' },
        { status: 400 }
      );
    }

    // ✅ Use fixed absolute temp directory
    const tempDir = '/app/temp';
    await fs.mkdir(tempDir, { recursive: true });

    filePath1 = path.join(tempDir, `${Date.now()}-1-${image1.name}`);
    filePath2 = path.join(tempDir, `${Date.now()}-2-${image2.name}`);

    // Save files
    const bytes1 = await image1.arrayBuffer();
    const bytes2 = await image2.arrayBuffer();

    await fs.writeFile(filePath1, Buffer.from(bytes1));
    await fs.writeFile(filePath2, Buffer.from(bytes2));

    // ✅ Absolute Python path
    const pythonScriptPath = '/app/compare_api.py';

    // ✅ safer command (no weird quoting issues)
    const command = `python3 ${pythonScriptPath} "${filePath1}" "${filePath2}"`;

    const { stdout, stderr } = await execAsync(command, {
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
    });

    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);

    // ❗ DO NOT fail just because stderr exists
    // InsightFace prints logs to stderr sometimes

    if (!stdout || stdout.trim().length === 0) {
      throw new Error("Python returned empty output");
    }

    // ✅ Extract JSON safely
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) {
      throw new Error("No JSON found in Python output");
    }

    const jsonString = stdout.slice(jsonStart);

    let result;
    try {
      result = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON PARSE ERROR:", jsonString);
      throw new Error("Invalid JSON from Python");
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('COMPARE ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Comparison failed',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    // ✅ Cleanup safely
    try {
      if (filePath1) await fs.unlink(filePath1);
      if (filePath2) await fs.unlink(filePath2);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
  }
}
