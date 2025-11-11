import Replicate from "replicate";
import fs from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import {
  FPS,
  type Step,
  generateSteps,
} from "./constants.ts";
import pAll from 'p-all';
import { photos } from './photos.ts';

const activePhoto = {
  filename: 'photos/photo.jpg',
  PREFIX: 'photo-1762837379010',
  X_STEPS: 15,
  Y_STEPS: 15
};

const {steps, PREFIX, X_STEPS, Y_STEPS} = generateSteps({
  X_STEPS: activePhoto.X_STEPS,
  Y_STEPS: activePhoto.Y_STEPS,
  PREFIX: activePhoto.PREFIX,
});

const execAsync = promisify(exec);

const model =
  "fofr/expression-editor:bf913bc90e1c44ba288ba3942a538693b72e8cc7df576f3beebe56adc0a92b86";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const image = fs.readFileSync(activePhoto.filename);


const __dirname = path.dirname(new URL(import.meta.url).pathname);
async function generate(step: Step) {
  const outputDir = path.join(__dirname, "outputs", PREFIX);
  const outputPath = path.join(outputDir, step.filename);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Skip this step if the file already exists
  if (fs.existsSync(outputPath)) {
    console.log(`Skipping ${step.filename} because it already exists`);
    return;
  }
  console.log(`Generating ${step.filename}...`);
  const output = await replicate.run(model, {
    input: {
      image,
      ...step,
    },
  }) as any;
  
  console.log(`Output type for ${step.filename}:`, typeof output, Array.isArray(output) ? 'Array' : '');
  console.log(`Output content:`, JSON.stringify(output, null, 2));
  
  // Replicate returns a URL string or FileOutput object
  let imageUrl: string;
  
  if (typeof output === 'string') {
    // Direct URL string
    imageUrl = output;
  } else if (Array.isArray(output) && output.length > 0) {
    // Array with FileOutput objects
    const firstItem = output[0];
    if (typeof firstItem === 'string') {
      imageUrl = firstItem;
    } else if (firstItem && typeof firstItem.url === 'function') {
      // url is a getter function
      imageUrl = firstItem.url();
    } else if (firstItem && typeof firstItem.url === 'string') {
      imageUrl = firstItem.url;
    } else {
      imageUrl = String(firstItem);
    }
  } else if (output && typeof output === 'object') {
    // Object with url property
    if (typeof output.url === 'function') {
      imageUrl = output.url();
    } else {
      imageUrl = output.url || output.toString();
    }
  } else {
    throw new Error(`Unexpected output format: ${JSON.stringify(output)}`);
  }
  
  console.log(`Downloading from: ${imageUrl}`);
  
  // Download the image
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const imageData = Buffer.from(arrayBuffer);
  
  console.log(`Downloaded ${imageData.length} bytes for ${step.filename}`);
  
  await writeFile(outputPath, imageData);
  console.log(`Generated ${step.filename}...`);
}

async function generateVideo() {
  console.log("Generating video with ffmpeg...");

  const outputDir = path.join(__dirname, "outputs", PREFIX);
  const videoOutput = path.join(outputDir, `${PREFIX}.mp4`);
  const concatFile = path.join(outputDir, "concat.txt");

  // Create a concat file listing all images in order
  const concatContent = steps.flat()
    .map((step) => `file '${path.join(outputDir, step.filename)}'`)
    .join("\n");

  await writeFile(concatFile, concatContent);

  // Full ffmpeg command
  // -r 10 = 10fps = each image shown for 100ms
  // -crf 18 = visually lossless quality (lower = better, range 0-51)
  // -preset slow = better compression efficiency (slower encoding)
  // Using concat demuxer to ensure correct order
  const command = `ffmpeg -y \
    -f concat \
    -safe 0 \
    -r ${FPS} \
    -i "${concatFile}" \
    -c:v libx264 \
    -preset slow \
    -crf 23 \
    -pix_fmt yuv420p \
    "${videoOutput}"`;

  try {
    const { stdout, stderr } = await execAsync(command);
    console.log("Video generated successfully:", videoOutput);
    if (stderr) console.log("FFmpeg output:", stderr);

    // Clean up concat file
    fs.unlinkSync(concatFile);
  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
}

const cost = steps.flat().length * 0.00098;
const formatter=new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

console.log(`Estimated cost: ${formatter.format(cost)}`);

const actions = steps.flat().map((step) => () => generate(step));
await pAll(actions, { concurrency: 5 });

// Generate the video from all images
console.log(`Generating video from ${steps.flat().length} images...`);
await generateVideo();

/*
  Based on https://github.com/kylan02/face_looker/blob/main/main.py
*/
