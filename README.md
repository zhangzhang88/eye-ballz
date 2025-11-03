# Eyeballz - Interactive Gaze-Following Video

Generate videos where the subject's gaze follows your cursor, with optional 3D depth mapping.

## Setup

```bash
# Install dependencies
pnpm install

# Create .env file with your Replicate API token
echo "REPLICATE_API_TOKEN=your_token_here" > .env
```

## Usage

### 1. Configure Your Settings

Edit `constants.ts`:

- `X_STEPS` / `Y_STEPS`: Grid size (e.g., 25x25 = 625 frames)
- `ROTATE_BOUND`: Head rotation angle range (degrees)
- `PUPIL_BOUND`: Pupil movement range
- `PREFIX`: Output folder name
- `FPS`: Video framerate

### 2. Generate Images and Video

```bash
# Generate all variations of the face + compile video
pnpm run generate
```

This will:

- Generate all X_STEPS × Y_STEPS image variations
- Create an MP4 video with all frames
- Save everything to `outputs/{PREFIX}/`

### 3. View Results

#### Standard Video Preview

```bash
pnpm run preview
```

Then open http://localhost:6767/preview.html

Features:

- Video scrubbing based on mouse position
- Grid of all image variations
- Each image independently follows cursor

#### 3D Depth Viewer

```bash
pnpm run preview
```

Then open http://localhost:6767/viewer-3d.html

Features:

- 3D displacement mapping using depth maps
- OrbitControls to rotate/zoom the view
- Depth scale slider
- Mouse-controlled gaze direction

**Note:** The 3D viewer requires depth maps. Generate them using the `depth.ts` script if you haven't already.

## File Structure

```
app/
├── constants.ts          # Configuration
├── generate.ts           # Image & video generation
├── client.ts             # 2D preview viewer
├── viewer-3d.ts          # 3D depth viewer
├── depth.ts              # Depth map generator (optional)
├── preview.html          # 2D viewer page
├── viewer-3d.html        # 3D viewer page
└── outputs/
    └── {PREFIX}/
        ├── *.webp        # Generated images
        ├── {PREFIX}.mp4  # Generated video
        └── depth/        # Depth maps (if generated)
```

## How It Works

1. **Image Generation**: Uses Replicate's expression-editor model to generate faces with different:

   - Yaw (horizontal head rotation)
   - Pitch (vertical head rotation)
   - Pupil X/Y positions

2. **Video Compilation**: FFmpeg stitches all images into a video at specified FPS

3. **Interactive Viewing**:

   - Mouse position maps to yaw/pitch values
   - Video seeks to corresponding frame
   - Smooth, throttled updates

4. **3D Enhancement** (optional):
   - Depth maps create displacement
   - Three.js renders 3D geometry
   - Real-time texture swapping

## Tips

- **Quality**: Lower CRF = better quality (18 is visually lossless)
- **Speed**: Higher FPS = smoother but slower to generate
- **Grid Size**: More steps = smoother tracking but exponentially more API calls
- **Depth**: Higher displacement scale = more dramatic 3D effect

## Cost Estimation

The script estimates API costs before generation:

- Cost per image: ~$0.00098
- 25x25 grid = 625 images = ~$0.61

## Credits

Based on [face_looker](https://github.com/kylan02/face_looker) by kylan02
