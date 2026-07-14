import multer from "multer";

const storage = multer.memoryStorage();

const allowedMimePrefixes = ["audio/"];
const MAX_FILE_SIZE_MB = 10;

function fileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  const ok = allowedMimePrefixes.some((prefix) =>
    file.mimetype.startsWith(prefix),
  );
  if (ok) cb(null, true);
  else cb(new Error("Only audio files are allowed"));
}

const limits = {
  fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
};

export const upload = multer({ storage, fileFilter, limits });

export default upload;
