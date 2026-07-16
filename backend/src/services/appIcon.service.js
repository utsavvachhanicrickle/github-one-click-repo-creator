import { Octokit } from '@octokit/rest';
import sharp from 'sharp';
import { getIo } from '../socket.js';

export async function generateAndCommitAppIcons({ owner, repo, branch, commitMessage, fileBuffer, accessToken }) {
  const io = getIo();
  const emitLog = (msg) => {
    io.emit('upload_log', { repoFullName: `${owner}/${repo}`, message: msg });
  };
  const emitProgress = (progress, statusText) => {
    io.emit('upload_progress', { repoFullName: `${owner}/${repo}`, progress, status: statusText });
  };

  const octokit = new Octokit({ auth: accessToken });

  emitLog('Validating icon image dimensions...');
  const metadata = await sharp(fileBuffer).metadata();
  if (metadata.width !== 1024 || metadata.height !== 1024) {
    throw new Error(`Uploaded image must be exactly 1024x1024 pixels. Got ${metadata.width}x${metadata.height}.`);
  }

  emitLog('Generating Flutter App Icons...');

  const androidIcons = [
    { width: 48, folder: "android/app/src/main/res/mipmap-mdpi", filename: "ic_launcher.png" },
    { width: 72, folder: "android/app/src/main/res/mipmap-hdpi", filename: "ic_launcher.png" },
    { width: 96, folder: "android/app/src/main/res/mipmap-xhdpi", filename: "ic_launcher.png" },
    { width: 144, folder: "android/app/src/main/res/mipmap-xxhdpi", filename: "ic_launcher.png" },
    { width: 192, folder: "android/app/src/main/res/mipmap-xxxhdpi", filename: "ic_launcher.png" },
    { width: 512, folder: "android/app/src/main/play-store", filename: "play_store_icon.png" }
  ];

  const iosIcons = [
    { width: 20, filename: "Icon-App-20x20@1x.png" },
    { width: 40, filename: "Icon-App-20x20@2x.png" },
    { width: 60, filename: "Icon-App-20x20@3x.png" },
    { width: 29, filename: "Icon-App-29x29@1x.png" },
    { width: 58, filename: "Icon-App-29x29@2x.png" },
    { width: 87, filename: "Icon-App-29x29@3x.png" },
    { width: 40, filename: "Icon-App-40x40@1x.png" },
    { width: 80, filename: "Icon-App-40x40@2x.png" },
    { width: 120, filename: "Icon-App-40x40@3x.png" },
    { width: 120, filename: "Icon-App-60x60@2x.png" },
    { width: 180, filename: "Icon-App-60x60@3x.png" },
    { width: 76, filename: "Icon-App-76x76@1x.png" },
    { width: 152, filename: "Icon-App-76x76@2x.png" },
    { width: 167, filename: "Icon-App-83.5x83.5@2x.png" },
    { width: 1024, filename: "Icon-App-1024x1024@1x.png" }
  ];

  const generatedFiles = [];

  // Generate Android icons
  for (const icon of androidIcons) {
    const buffer = await sharp(fileBuffer)
      .resize(icon.width, icon.width, { fit: "cover", position: "centre", kernel: sharp.kernel.lanczos3 })
      .png({ quality: 100, compressionLevel: 9 })
      .toBuffer();
    generatedFiles.push({ path: `${icon.folder}/${icon.filename}`, buffer });
  }

  // Generate iOS icons
  const iosFolder = "ios/Runner/Assets.xcassets/AppIcon.appiconset";
  for (const icon of iosIcons) {
    const buffer = await sharp(fileBuffer)
      .resize(icon.width, icon.width, { fit: "cover", position: "centre", kernel: sharp.kernel.lanczos3 })
      .png({ quality: 100, compressionLevel: 9 })
      .toBuffer();
    generatedFiles.push({ path: `${iosFolder}/${icon.filename}`, buffer });
  }

  emitLog(`Uploading ${generatedFiles.length} generated icons to GitHub...`);
  let completedFiles = 0;
  const blobPromises = generatedFiles.map(async (f) => {
    const { data: blob } = await octokit.git.createBlob({
      owner,
      repo,
      content: f.buffer.toString('base64'),
      encoding: 'base64'
    });
    completedFiles++;
    emitProgress((completedFiles / generatedFiles.length) * 100, `Uploaded ${completedFiles}/${generatedFiles.length} icons...`);
    return {
      path: f.path,
      mode: '100644',
      type: 'blob',
      sha: blob.sha
    };
  });

  const newBlobs = await Promise.all(blobPromises);
  return newBlobs;
}
