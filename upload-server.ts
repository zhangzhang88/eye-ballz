import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const photosDir = path.join(__dirname, 'photos');
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }
    cb(null, photosDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = req.body.photoName || 'photo';
    cb(null, `${name}${ext}`);
  }
});

const upload = multer({ storage });

// 静态文件服务
app.use(express.static(__dirname));
app.use(express.json());

// 上传接口
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传照片' });
    }

    const { photoName, xSteps, ySteps } = JSON.parse(req.body.config);
    const photoPath = path.join('photos', req.file.filename);

    console.log('📸 照片已保存:', photoPath);
    console.log('⚙️ 配置:', { photoName, xSteps, ySteps });

    // 更新 constants.ts
    await updateConstants(photoName, parseInt(xSteps), parseInt(ySteps));
    console.log('✅ constants.ts 已更新');

    // 更新 generate.ts
    await updateGenerate(photoPath, photoName, parseInt(xSteps), parseInt(ySteps));
    console.log('✅ generate.ts 已更新');

    // 更新 photos.ts
    await updatePhotos(photoPath, photoName, parseInt(xSteps), parseInt(ySteps));
    console.log('✅ photos.ts 已更新');

    res.json({
      success: true,
      message: '配置已更新',
      photoPath,
      config: { photoName, xSteps, ySteps }
    });

  } catch (error) {
    console.error('❌ 错误:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// 生成接口
app.post('/api/generate', async (req, res) => {
  try {
    console.log('🚀 开始生成...');
    
    // 设置较长的超时时间
    req.setTimeout(600000); // 10分钟
    
    const { stdout, stderr } = await execAsync('pnpm run generate');
    
    console.log('✅ 生成完成!');
    if (stdout) console.log(stdout);
    
    res.json({
      success: true,
      message: '生成完成',
      output: stdout
    });
    
  } catch (error) {
    console.error('❌ 生成错误:', error);
    res.status(500).json({
      error: (error as Error).message,
      stderr: (error as any).stderr
    });
  }
});

// 删除照片接口
app.delete('/api/photo/:photoKey', async (req, res) => {
  try {
    const { photoKey } = req.params;
    console.log('🗑️ 开始删除照片:', photoKey);

    // 获取照片信息
    const photosPath = path.join(__dirname, 'photos.ts');
    let photosContent = fs.readFileSync(photosPath, 'utf-8');
    
    // 解析照片配置
    let photoData;
    try {
      // 提取 photos 对象
      const photosMatch = photosContent.match(/export const photos = ([\s\S]*?);\s*export type Photo/);
      if (!photosMatch) {
        return res.status(400).json({ error: '无法找到 photos 对象' });
      }
      
      // 使用 eval 来解析对象（仅在信任环境中使用）
      const photosObj = eval(`(${photosMatch[1]})`);
      photoData = photosObj[photoKey];
      
      if (!photoData) {
        return res.status(404).json({ error: '照片不存在' });
      }
    } catch (error) {
      return res.status(400).json({ error: '照片数据格式错误' });
    }

    const photoFilePath = path.join(__dirname, photoData.filename);
    const outputDir = path.join(__dirname, 'outputs', photoKey);
    const outputDirDeep = path.join(__dirname, 'outputs', photoKey, 'depth');

    // 删除照片文件
    if (fs.existsSync(photoFilePath)) {
      fs.unlinkSync(photoFilePath);
      console.log('✅ 照片文件已删除:', photoFilePath);
    }

    // 删除输出目录
    if (fs.existsSync(outputDirDeep)) {
      fs.rmSync(outputDirDeep, { recursive: true, force: true });
      console.log('✅ 深度图目录已删除:', outputDirDeep);
    }
    
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
      console.log('✅ 输出目录已删除:', outputDir);
    }

    // 从 photos.ts 中删除配置
    const photoKeyRegex = new RegExp(`\\s*'${photoKey}': {[^}]*},?`, 'g');
    photosContent = photosContent.replace(photoKeyRegex, '');
    fs.writeFileSync(photosPath, photosContent, 'utf-8');
    console.log('✅ photos.ts 配置已删除');

    // 如果删除的是当前激活的照片，需要更新配置文件
    if (photoData.PREFIX === photoKey) {
      // 获取剩余的照片
      let remainingPhotos;
      try {
        const photosMatch = photosContent.match(/export const photos = ([\s\S]*?);\s*export type Photo/);
        if (photosMatch) {
          remainingPhotos = eval(`(${photosMatch[1]})`);
        }
      } catch (error) {
        console.warn('无法解析剩余照片:', error);
      }

      if (remainingPhotos && Object.keys(remainingPhotos).length > 0) {
        const firstPhoto = Object.values(remainingPhotos)[0] as any;
        
        // 更新 constants.ts
        await updateConstants(firstPhoto.PREFIX, firstPhoto.X_STEPS, firstPhoto.Y_STEPS);
        console.log('✅ constants.ts 已更新为新的默认照片');

        // 更新 generate.ts
        await updateGenerate(firstPhoto.filename, firstPhoto.PREFIX, firstPhoto.X_STEPS, firstPhoto.Y_STEPS);
        console.log('✅ generate.ts 已更新为新的默认照片');
      }
    }

    res.json({
      success: true,
      message: '照片已删除',
      deletedPhoto: {
        key: photoKey,
        file: photoData.filename
      }
    });

  } catch (error) {
    console.error('❌ 删除错误:', error);
    res.status(500).json({
      error: (error as Error).message
    });
  }
});

// 更新 constants.ts
async function updateConstants(prefix: string, xSteps: number, ySteps: number) {
  const constantsPath = path.join(__dirname, 'constants.ts');
  let content = fs.readFileSync(constantsPath, 'utf-8');
  
  content = content.replace(/export const X_STEPS = \d+;/, `export const X_STEPS = ${xSteps};`);
  content = content.replace(/export const Y_STEPS = \d+;/, `export const Y_STEPS = ${ySteps};`);
  content = content.replace(/export const PREFIX = ["'].*?["'];/, `export const PREFIX = "${prefix}";`);
  
  fs.writeFileSync(constantsPath, content, 'utf-8');
}

// 更新 generate.ts
async function updateGenerate(photoPath: string, prefix: string, xSteps: number, ySteps: number) {
  const generatePath = path.join(__dirname, 'generate.ts');
  let content = fs.readFileSync(generatePath, 'utf-8');
  
  // 更新 activePhoto 配置
  const photoConfig = `const activePhoto = {
  filename: '${photoPath}',
  PREFIX: '${prefix}',
  X_STEPS: ${xSteps},
  Y_STEPS: ${ySteps}
};`;
  
  // 替换 activePhoto 定义 - 匹配对象形式或 photos.xxx 形式
  content = content.replace(
    /const activePhoto = (?:photos\.\w+|{[\s\S]*?});/,
    photoConfig
  );
  
  fs.writeFileSync(generatePath, content, 'utf-8');
}

// 更新 photos.ts
async function updatePhotos(photoPath: string, prefix: string, xSteps: number, ySteps: number) {
  const photosPath = path.join(__dirname, 'photos.ts');
  let content = fs.readFileSync(photosPath, 'utf-8');
  
  // 创建新的照片配置
  const newPhotoConfig = `  '${prefix}': {
    filename: '${photoPath}',
    PREFIX: '${prefix}',
    X_STEPS: ${xSteps},
    Y_STEPS: ${ySteps},
  },`;
  
  // 在 export const photos = { 后插入新配置
  content = content.replace(
    /export const photos = \{/,
    `export const photos = {\n${newPhotoConfig}`
  );
  
  fs.writeFileSync(photosPath, content, 'utf-8');
}

app.listen(port, () => {
  console.log(`
🎨 Eyeballz 上传服务器已启动!

📍 访问地址: http://localhost:${port}/upload.html
🚀 上传照片并自动生成视线跟随效果

🗑️ 删除API: DELETE http://localhost:${port}/api/photo/{photoKey}

提示: 确保已在 .env 文件中配置 REPLICATE_API_TOKEN
  `);
});
