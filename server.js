const express = require('express');
const multer = require('multer');
const fs = require('fs').promises; // Use promises version of fs
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000; // Let's use a different port than the python server, e.g., 3000

// --- Configuration ---
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOAD_DIR = path.join(__dirname, 'images');

// --- Middleware ---
app.use(cors()); // Enable CORS for all origins (adjust if needed for production)
app.use(express.json()); // To parse JSON bodies (though we mainly use form-data here)
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies

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
        cb(null, UPLOAD_DIR); // Save files to the 'images' directory
    },
    filename: function (req, file, cb) {
        // Create a unique filename: dayX-<timestamp>-<original_name>
        const day = req.body.day || 'unknown'; // Get day from form data
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `day${day}-${uniqueSuffix}${extension}`);
    }
});

const upload = multer({ storage: storage });

// --- API Endpoint to Save Day Data ---
app.post('/api/save-day', upload.single('photo'), async (req, res) => {
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
    const photoFile = req.file; // Uploaded file info from multer

    console.log(`Received save request for Day ${day}`);
    console.log("Mood:", mood);
    console.log("Diet Rating:", diet_rating);
    console.log("Sleep Hours:", sleep_hours);
    console.log("Calories Burned:", calories_burned); // Log new fields
    console.log("Steps Taken:", steps_taken);
    console.log("Strength:", strength_workout);
    console.log("Cardio:", cardio_workout);
    console.log("Notes:", additional_notes);
    console.log("File:", photoFile);


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

        if (photoFile) {
            // If a new photo was uploaded, update the path
            dayData.photo = `images/${photoFile.filename}`;
        } else if (dayData.photo === undefined) {
             // Ensure photo field is null if never set and no new photo uploaded
             dayData.photo = null;
        }
        // If no new photo uploaded, keep the existing dayData.photo value

        data[day] = dayData; // Put the updated/new data back into the main object

        // 3. Write updated data back to file
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8'); // Pretty print JSON

        console.log(`Successfully updated Day ${day} with new fields`);
        res.json({ success: true, message: `Day ${day} updated successfully.`, photoPath: dayData.photo });

    } catch (error) {
        console.error(`Error saving data for Day ${day}:`, error);
        res.status(500).json({ success: false, message: 'Failed to save data. Check server logs.' });
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