import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  console.log("🔥 API STARTED");

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
    const appDir = '/app';

    // ✅ safer command (no weird quoting issues)
    console.log("⚙️ Running python...");

    const command = `cd ${appDir} && python3 compare_api.py "${filePath1}" "${filePath2}"`;
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
      cwd: appDir,
    });
    console.log("✅ Python finished");

    if (stderr) {
      console.log("COMPARE STDERR (debug):", stderr);
    }
    console.log("COMPARE STDOUT:", stdout);

    // ❗ DO NOT fail just because stderr exists
    // InsightFace prints logs to stderr sometimes

    if (!stdout || stdout.trim().length === 0) {
      const errorMsg = stderr || 'Python returned empty output';
      console.error('COMPARE - Empty output, stderr:', errorMsg);
      return NextResponse.json(
        {
          success: false,
          error: 'Comparison failed',
          details: 'Python script produced no output',
        },
        { status: 500 }
      );
    }

    // ✅ Extract JSON safely - most reliable method is to find last { and parse from there
    const jsonStart = stdout.lastIndexOf('{');
    if (jsonStart === -1) {
      console.error('COMPARE - No JSON object found in output:', stdout);
      return NextResponse.json(
        {
          success: false,
          error: 'Comparison failed',
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
      console.error('COMPARE - Incomplete JSON object found in output:', stdout);
      return NextResponse.json(
        {
          success: false,
          error: 'Comparison failed',
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
      console.error("COMPARE - JSON PARSE ERROR:", jsonString);
      return NextResponse.json(
        {
          success: false,
          error: 'Comparison failed',
          details: 'Invalid JSON response from Python',
        },
        { status: 500 }
      );
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
