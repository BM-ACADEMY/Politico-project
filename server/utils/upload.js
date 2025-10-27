require("dotenv").config();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegStatic);

const SERVER_URL = process.env.SERVER_URL;
console.log(`Server URL: ${SERVER_URL}`);

// Ensure dynamic folder creation for candidateimage only
const createEntityFolder = (entity_type) => {
  const uploadDir = path.join(__dirname, "../Uploads", entity_type);

  try {
    if (!fs.existsSync(uploadDir)) {
      console.log(`Creating directory: ${uploadDir}`);
      fs.mkdirSync(uploadDir, { recursive: true });
    } else {
      console.log(`Directory already exists: ${uploadDir}`);
    }

    fs.accessSync(uploadDir, fs.constants.W_OK);
    console.log(`Write permissions confirmed for: ${uploadDir}`);
  } catch (error) {
    console.error(`Failed to create or access directory: ${uploadDir}`, error);
    throw new Error(`Failed to create or access directory: ${uploadDir}`);
  }

  return uploadDir;
};

// Delete File from Uploads
const deleteFile = (fileUrl, entityType) => {
  try {
    const url = new URL(fileUrl);
    const encodedFilename = path.basename(url.pathname);
    const filename = decodeURIComponent(encodedFilename);
    const filePath = path.join(__dirname, "../Uploads", entityType, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    } else {
      console.log(`File not found for deletion: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
  }
};

// Allowed file types
const allowedMimeTypes = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  video: ["video/mp4", "video/avi", "video/mov", "video/mkv"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/aac", "audio/webm"],
};

// Multer storage configuration
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allTypes = [
    ...allowedMimeTypes.image,
    ...allowedMimeTypes.video,
    ...allowedMimeTypes.audio,
  ];
  if (allTypes.includes(file.mimetype)) {
    console.log(`File type accepted: ${file.mimetype}`);
    cb(null, true);
  } else {
    console.error(`File type rejected: ${file.mimetype}`);
    cb(new Error("Only images, videos, and audio files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
});

// Compress and Save Image
const compressImage = async (buffer, outputPath) => {
  try {
    console.log(`Compressing image to: ${outputPath}`);
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (metadata.width > 2000) {
      console.log(`Resizing image: width=${metadata.width} to 2000`);
      await image.resize({ width: 2000 });
    }

    const finalPath = outputPath.replace(/\.\w+$/, ".webp");
    await image.toFormat("webp", { quality: 90 }).toFile(finalPath);
    console.log(`Image saved successfully: ${finalPath}`);
    return finalPath;
  } catch (error) {
    console.error(`Image compression failed: ${error.message}`);
    throw new Error("Image compression failed: " + error.message);
  }
};

// Compress and Save Video
const compressVideo = async (buffer, outputPath) => {
  return new Promise((resolve, reject) => {
    const tempFilePath = path.join(__dirname, "../Uploads/temp_" + Date.now() + ".mp4");
    console.log(`Writing temporary video file: ${tempFilePath}`);
    fs.writeFileSync(tempFilePath, buffer);

    const finalPath = outputPath.replace(/\.\w+$/, ".mp4");
    console.log(`Compressing video to: ${finalPath}`);
    ffmpeg(tempFilePath)
      .videoCodec("libx264")
      .outputOptions(["-preset fast", "-crf 28"])
      .on("end", () => {
        console.log(`Video compression completed: ${finalPath}`);
        fs.unlinkSync(tempFilePath);
        resolve(finalPath);
      })
      .on("error", (err) => {
        console.error(`Video compression failed: ${err.message}`);
        fs.unlinkSync(tempFilePath);
        reject(new Error("Video compression failed: " + err.message));
      })
      .save(finalPath);
  });
};

// Compress and Save Audio
const compressAudio = async (buffer, outputPath) => {
  return new Promise((resolve, reject) => {
    const inputTempPath = path.join(__dirname, "../Uploads/temp_" + Date.now() + ".webm");
    const outputFinalPath = outputPath.replace(/\.\w+$/, ".mp3");
    console.log(`Writing temporary audio file: ${inputTempPath}`);
    fs.writeFileSync(inputTempPath, buffer);

    console.log(`Compressing audio to: ${outputFinalPath}`);
    ffmpeg(inputTempPath)
      .inputFormat("webm")
      .audioCodec("libmp3lame")
      .audioBitrate("192k")
      .on("end", () => {
        console.log(`Audio compression completed: ${outputFinalPath}`);
        fs.unlinkSync(inputTempPath);
        resolve(outputFinalPath);
      })
      .on("error", (err) => {
        console.error(`Audio compression failed: ${err.message}`);
        fs.unlinkSync(inputTempPath);
        reject(new Error("Audio compression failed: " + err.message));
      })
      .save(outputFinalPath);
  });
};

// Process File and Return Public URL
const processFile = async (buffer, mimetype, entityType, fileName) => {
  const uploadPath = createEntityFolder(entityType);
  const filePath = path.join(uploadPath, fileName);
  console.log(`Processing file: ${filePath}, Type: ${mimetype}`);

  let finalFileName = fileName;
  if (allowedMimeTypes.image.includes(mimetype)) {
    const savedPath = await compressImage(buffer, filePath);
    finalFileName = path.basename(savedPath);
  } else if (allowedMimeTypes.video.includes(mimetype)) {
    const savedPath = await compressVideo(buffer, filePath);
    finalFileName = path.basename(savedPath);
  } else if (allowedMimeTypes.audio.includes(mimetype)) {
    const savedPath = await compressAudio(buffer, filePath);
    finalFileName = path.basename(savedPath);
  } else {
    console.error(`Unsupported file type: ${mimetype}`);
    throw new Error("Unsupported file type");
  }

  const encodedFilename = encodeURIComponent(finalFileName);
  const publicUrl = `${SERVER_URL}/Uploads/${entityType}/${encodedFilename}`;
  console.log(`Generated public URL: ${publicUrl}`);

  // Verify file exists
  try {
    fs.accessSync(path.join(uploadPath, finalFileName), fs.constants.R_OK);
    console.log(`File verified on disk: ${path.join(uploadPath, finalFileName)}`);
  } catch (error) {
    console.error(`File not found on disk: ${path.join(uploadPath, finalFileName)}`, error);
    throw new Error("Failed to verify saved file");
  }

  return publicUrl;
};

module.exports = { upload, createEntityFolder, compressAudio, processFile, deleteFile };
