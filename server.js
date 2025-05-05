process.on('uncaughtException', (err, origin) => {
  console.error(`\n\n--------------------\nCaught exception: ${err}\n` + `Exception origin: ${origin}\n--------------------\n\n`);
  process.exit(1); // Exit after logging
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n\n--------------------\nUnhandled Rejection at:', promise, 'reason:', reason, '\n--------------------\n\n');
  process.exit(1); // Exit after logging
});

const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path'); // Keep path for __dirname if needed
const cors = require('cors');

const app = express();
const port = 3000; // Let's use a different port than the python server, e.g., 3000

// --- Configuration ---
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOAD_DIR = path.join(__dirname, 'images');

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS, images) from the current directory
// --- Route for /admin ---
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});
app.use(express.static(__dirname));

// --- Multer Setup for File Uploads ---
// Ensure upload directory exists
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        // Create a unique filename: dayX-<timestamp>-<original_name>
        const day = req.body.day || 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `day${day}-${uniqueSuffix}${extension}`);
    }
});

const upload = multer({ storage: storage });

// --- API Endpoint to Save Day Data ---
// Allow uploading multiple photos (e.g., up to 10 at once)
app.post('/api/save-day', upload.array('photos', 10), async (req, res) => {
    // Extract all expected fields from the form data
    const {
        day,
        // text, // Deprecated
        mood,
        diet_rating,
        sleep_hours,
        calories_burned, // New field
        steps_taken, // New field
        strength_workout,
        cardio_workout,
        additional_notes
    } = req.body;
    const uploadedFiles = req.files; // Array of uploaded file info from multer

    console.log(`Received save request for Day ${day}`);
    console.log("Mood:", mood);
    console.log("Diet Rating:", diet_rating);
    console.log("Sleep Hours:", sleep_hours);
    console.log("Calories Burned:", calories_burned); // Log new fields
    console.log("Steps Taken:", steps_taken);
    console.log("Strength:", strength_workout);
    console.log("Cardio:", cardio_workout);
    console.log("Notes:", additional_notes);
    console.log("Files:", uploadedFiles); // Log the array of files


    if (!day) {
        return res.status(400).json({ success: false, message: 'Day number is required.' });
    }

    try {
        // 1. Read current data
        let data = {};
        try {
            const rawData = await fs.readFile(DATA_FILE, 'utf8');
            data = JSON.parse(rawData);
        } catch (readError) {
            // If file doesn't exist or is invalid JSON, start with an empty object
            console.warn(`Could not read ${DATA_FILE}, starting fresh. Error: ${readError.message}`);
        }

        // 2. Update data for the specific day
        const dayData = data[day] || {}; // Get existing data or create new object

        // Update with new fields (set to null if empty/undefined)
        dayData.mood = mood || null;
        // Convert numeric fields, defaulting to null if invalid
        dayData.diet_rating = diet_rating ? parseFloat(diet_rating) : null;
        dayData.sleep_hours = sleep_hours ? parseFloat(sleep_hours) : null;
        dayData.calories_burned = calories_burned ? parseInt(calories_burned, 10) : null; // Save new fields
        dayData.steps_taken = steps_taken ? parseInt(steps_taken, 10) : null;
        dayData.strength_workout = strength_workout || null;
        dayData.cardio_workout = cardio_workout || null;
        dayData.additional_notes = additional_notes || null;
        // delete dayData.text; // Optionally remove the old field if it exists

        // Initialize photos array if it doesn't exist
        if (!Array.isArray(dayData.photos)) {
            dayData.photos = [];
        }

        // Process uploaded files
        if (uploadedFiles && uploadedFiles.length > 0) {
            const newPhotos = uploadedFiles.map(file => ({
                path: `images/${file.filename}`,
                isCover: false // Default to not cover
            }));

            // Add new photos to the existing array
            dayData.photos.push(...newPhotos);

            // Ensure at least one photo is marked as cover if there wasn't one before
            const hasCover = dayData.photos.some(p => p.isCover);
            if (!hasCover && dayData.photos.length > 0) {
                dayData.photos[0].isCover = true; // Mark the first one as cover
            }
        }

        // Remove the old single 'photo' field if it exists
        delete dayData.photo;

        data[day] = dayData; // Put the updated/new data back into the main object

        // 3. Write updated data back to file
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8'); // Pretty print JSON

        console.log(`Successfully updated Day ${day} with new fields and photos`);
        // Return the updated photos array
        res.json({ success: true, message: `Day ${day} updated successfully.`, photos: dayData.photos });

    } catch (error) {
        console.error(`Error saving data for Day ${day}:`, error);
        res.status(500).json({ success: false, message: 'Failed to save data. Check server logs.' });
    }
});

// --- API Endpoint to Delete a Specific Photo ---
app.delete('/api/delete-photo/:day/:photoIndex', async (req, res) => {
    const { day, photoIndex } = req.params;
    const index = parseInt(photoIndex, 10);

    console.log(`Received delete request for Day ${day}, Photo Index ${index}`);

    if (isNaN(index) || index < 0) {
        return res.status(400).json({ success: false, message: 'Invalid photo index.' });
    }

    try {
        // 1. Read current data
        let data = {};
        try {
            const rawData = await fs.readFile(DATA_FILE, 'utf8');
            data = JSON.parse(rawData);
        } catch (readError) {
            return res.status(404).json({ success: false, message: 'Data file not found or corrupted.' });
        }

        // 2. Find the day's data and the photo to delete
        const dayData = data[day];
        if (!dayData || !Array.isArray(dayData.photos) || index >= dayData.photos.length) {
            return res.status(404).json({ success: false, message: 'Day or photo not found.' });
        }

        const photoToDelete = dayData.photos[index];
        const photoPathToDelete = path.join(__dirname, photoToDelete.path);

        // 3. Remove the photo entry from the array
        dayData.photos.splice(index, 1);

        // 4. If the deleted photo was the cover, designate a new cover if possible
        if (photoToDelete.isCover && dayData.photos.length > 0) {
            // Check if another cover already exists (shouldn't happen, but safety check)
            if (!dayData.photos.some(p => p.isCover)) {
                 dayData.photos[0].isCover = true; // Make the new first photo the cover
            }
        }
         // If no photos left, the array is empty, which is fine.

        // 5. Write updated data back to file
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');

        // 6. Delete the actual image file
        try {
            await fs.unlink(photoPathToDelete);
            console.log(`Deleted image file: ${photoPathToDelete}`);
        } catch (unlinkError) {
            // Log error but don't fail the request, as the JSON is updated
            console.error(`Error deleting image file ${photoPathToDelete}:`, unlinkError);
        }

        console.log(`Successfully deleted photo index ${index} for Day ${day}`);
        res.json({ success: true, message: 'Photo deleted successfully.', photos: dayData.photos });

    } catch (error) {
        console.error(`Error deleting photo for Day ${day}, Index ${index}:`, error);
        res.status(500).json({ success: false, message: 'Failed to delete photo. Check server logs.' });
    }
});

// --- API Endpoint to Set Cover Photo ---
app.post('/api/set-cover/:day/:photoIndex', async (req, res) => {
    const { day, photoIndex } = req.params;
    const index = parseInt(photoIndex, 10);

    console.log(`Received set cover request for Day ${day}, Photo Index ${index}`);

    if (isNaN(index) || index < 0) {
        return res.status(400).json({ success: false, message: 'Invalid photo index.' });
    }

    try {
        // 1. Read current data
        let data = {};
        try {
            const rawData = await fs.readFile(DATA_FILE, 'utf8');
            data = JSON.parse(rawData);
        } catch (readError) {
            return res.status(404).json({ success: false, message: 'Data file not found or corrupted.' });
        }

        // 2. Find the day's data
        const dayData = data[day];
        if (!dayData || !Array.isArray(dayData.photos) || index >= dayData.photos.length) {
            return res.status(404).json({ success: false, message: 'Day or photo not found.' });
        }

        // 3. Set all isCover to false, then set the selected one to true
        dayData.photos.forEach((photo, i) => {
            photo.isCover = (i === index);
        });

        // 4. Write updated data back to file
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');

        console.log(`Successfully set photo index ${index} as cover for Day ${day}`);
        res.json({ success: true, message: 'Cover photo set successfully.', photos: dayData.photos });

    } catch (error) {
        console.error(`Error setting cover photo for Day ${day}, Index ${index}:`, error);
        res.status(500).json({ success: false, message: 'Failed to set cover photo. Check server logs.' });
    }
});
// --- Start Server ---
app.listen(port, '0.0.0.0', () => { // Explicitly listen on all interfaces
    console.log(`Server listening on port ${port}`);
    console.log(`Access locally: http://localhost:${port}`);
    // You might need to replace 'localhost' with your machine's actual IP address
    // when accessing from other devices on the same network.
    console.log(`Serving files from: ${__dirname}`);
    console.log(`Public site access: /index.html`);
    console.log(`Admin site access: /admin.html`);
});