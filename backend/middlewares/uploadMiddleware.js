const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 5 MB

// Allowed MIME types and their canonical extensions
const ALLOWED_MIME_TYPES = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "application/pdf": ".pdf",
};

// Allowed magic bytes (file signatures) for deeper validation
// Prevents MIME spoofing by checking actual file content
const MAGIC_BYTES = {
  "image/jpeg": [
    [0xff, 0xd8, 0xff], // JPEG
  ],
  "image/jpg": [
    [0xff, 0xd8, 0xff], // JPEG
  ],
  "image/png": [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
  ],
  "application/pdf": [
    [0x25, 0x50, 0x44, 0x46], // %PDF
  ],
};

// ─── Ensure Upload Directory Exists ──────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o755 });
}

// ─── Storage Engine ───────────────────────────────────────────────────────────
// Files are renamed with a UUID to:
// 1. Prevent path traversal attacks (e.g. "../../etc/passwd")
// 2. Prevent filename collision
// 3. Prevent directory listing enumeration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // UUID v4 + canonical extension from MIME type (NOT from original filename)
    // This completely neutralises path traversal via crafted filenames
    const ext = ALLOWED_MIME_TYPES[file.mimetype] || ".bin";
    const safeFilename = `${uuidv4()}${ext}`;
    cb(null, safeFilename);
  },
});

// ─── MIME Type Filter ─────────────────────────────────────────────────────────
// Called before the file is written to disk. Rejects disallowed types early.
function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES[file.mimetype]) {
    const error = new Error(
      `Invalid file type "${file.mimetype}". Only JPG, PNG, and PDF files are allowed.`
    );
    error.code = "INVALID_FILE_TYPE";
    error.status = 400;
    return cb(error, false);
  }
  cb(null, true);
}

// ─── Core Multer Instance ─────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES, // 5 MB hard limit
    files: 1,                      // Single file per request
    fields: 20,                    // Max non-file fields
    fieldNameSize: 100,            // Max field name length
    fieldSize: 10 * 1024,          // Max field value size: 10 KB
  },
});

// ─── Magic Bytes Validator ────────────────────────────────────────────────────
// Second layer: reads the first bytes of the saved file to verify actual content.
// Defends against MIME type spoofing (e.g. a .exe renamed to .pdf).
async function validateMagicBytes(filePath, mimetype) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { start: 0, end: 7 });
    const chunks = [];

    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", () => resolve(false)); // If unreadable, reject
    stream.on("end", () => {
      const bytes = Buffer.concat(chunks);
      const signatures = MAGIC_BYTES[mimetype] || [];

      const isValid = signatures.some((sig) =>
        sig.every((byte, i) => bytes[i] === byte)
      );

      resolve(isValid);
    });
  });
}

// ─── Cleanup Helper ───────────────────────────────────────────────────────────
// Safely deletes a file that failed validation (don't leave orphaned files)
function cleanupFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error(`[UPLOAD] Failed to clean up file ${filePath}:`, err.message);
    }
  });
}

// ─── Multer Error Handler ─────────────────────────────────────────────────────
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`,
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Only one file may be uploaded at a time.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: `Unexpected file field "${err.field}". Use the correct field name for file upload.`,
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  if (err && err.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next(err);
}

// ─── Single-File Upload Middleware Factory ────────────────────────────────────
// Returns a middleware chain:
//   1. multer (parses + saves file)
//   2. magic bytes check (validates real content)
//   3. attaches sanitized file info to req.uploadedFile
//
// Usage: router.post("/upload", uploadSingle("file"), handler)
function uploadSingle(fieldName = "file") {
  return [
    // Step 1: Multer parse + disk write
    (req, res, next) => {
      upload.single(fieldName)(req, res, (err) => {
        if (err) return handleMulterError(err, req, res, next);
        next();
      });
    },

    // Step 2: Require file (if a file was expected)
    (req, res, next) => {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded. Please attach a file to the request.",
        });
      }
      next();
    },

    // Step 3: Magic bytes validation
    async (req, res, next) => {
      try {
        const isValid = await validateMagicBytes(req.file.path, req.file.mimetype);
        if (!isValid) {
          // Delete the fraudulent file immediately
          cleanupFile(req.file.path);
          return res.status(400).json({
            success: false,
            message:
              "File content does not match the declared type. The file may be corrupted or invalid.",
          });
        }
        next();
      } catch (err) {
        cleanupFile(req.file.path);
        next(err);
      }
    },

    // Step 4: Attach sanitized file info to req for downstream handlers
    (req, res, next) => {
      req.uploadedFile = {
        filename: req.file.filename,          // UUID-based safe name
        originalName: req.file.originalname,  // Original (for display only, never use as path)
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        // Public-facing URL path (relative)
        url: `/uploads/${req.file.filename}`,
      };
      next();
    },
  ];
}

// ─── Optional-File Upload Middleware Factory ──────────────────────────────────
// Same as uploadSingle but does NOT reject if no file is provided.
function uploadOptional(fieldName = "file") {
  return [
    (req, res, next) => {
      upload.single(fieldName)(req, res, (err) => {
        if (err) return handleMulterError(err, req, res, next);
        next();
      });
    },

    async (req, res, next) => {
      if (!req.file) {
        req.uploadedFile = null;
        return next();
      }

      try {
        const isValid = await validateMagicBytes(req.file.path, req.file.mimetype);
        if (!isValid) {
          cleanupFile(req.file.path);
          return res.status(400).json({
            success: false,
            message:
              "File content does not match the declared type. The file may be corrupted or invalid.",
          });
        }

        req.uploadedFile = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          url: `/uploads/${req.file.filename}`,
        };
        next();
      } catch (err) {
        if (req.file) cleanupFile(req.file.path);
        next(err);
      }
    },
  ];
}

module.exports = {
  uploadSingle,
  uploadOptional,
  handleMulterError,
  cleanupFile,
  UPLOAD_DIR,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
};
