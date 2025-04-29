document.addEventListener('DOMContentLoaded', () => {
    const calendarHeader = document.getElementById('calendar-header'); // Added
    const calendarGrid = document.getElementById('calendar-grid');
    const modal = document.getElementById('edit-modal');
    const closeButton = modal.querySelector('.close-button');
    const cancelButton = modal.querySelector('.cancel-button');
    const editForm = document.getElementById('edit-form');
    const modalDayNumber = document.getElementById('edit-modal-day-number');
    const editDayInput = document.getElementById('edit-day-input');
    const currentPhotoPreview = document.getElementById('current-photo-preview');
    const photoUploadInput = document.getElementById('photo-upload');
    // const textDescriptionInput = document.getElementById('text-description'); // No longer exists
    const moodSelect = document.getElementById('mood'); // Renamed variable for clarity
    const moodOtherInput = document.getElementById('mood-other'); // New input field
    const adminDayCounterElement = document.getElementById('admin-day-counter'); // Added for admin page
    const dietRatingInput = document.getElementById('diet-rating');
    const dietRatingValueSpan = document.getElementById('diet-rating-value');
    const sleepHoursInput = document.getElementById('sleep-hours');
    const sleepHoursValueSpan = document.getElementById('sleep-hours-value');
    const caloriesSlider = document.getElementById('calories-burned-slider'); // New
    const caloriesInput = document.getElementById('calories-burned-input'); // New
    const stepsSlider = document.getElementById('steps-taken-slider'); // New
    const stepsInput = document.getElementById('steps-taken-input'); // New
    const strengthWorkoutInput = document.getElementById('strength-workout');
    const cardioWorkoutInput = document.getElementById('cardio-workout');
    const additionalNotesInput = document.getElementById('additional-notes');

    // Admin Summary Stat Elements (Moved inside updateAdminSummaryStats)

    const totalDays = 75;
    const startDate = new Date(2025, 3, 29); // NEW START DATE: April 29th, 2025
    let challengeData = {};

    // Function to fetch data and initialize admin calendar
    async function initializeAdminCalendar() {
        try {
            // Check if running locally via file:// protocol
            if (window.location.protocol === 'file:') {
                 console.warn("Admin Panel: Running via file:// protocol. Fetching/Saving data requires a local web server.");
                 // Saving will definitely fail without a server endpoint.
            }
            const response = await fetch('data.json?cachebust=' + new Date().getTime());
            if (!response.ok) {
                 throw new Error(`Failed to load data (Status: ${response.status}). Ensure data.json exists and the page is served via HTTP(S), not file://.`);
            }
            challengeData = await response.json();
            // Pass challengeData explicitly to functions that need it
            generateAdminCalendar(challengeData);
            updateAdminDayCounter(); // Doesn't need challengeData
            updateAdminSummaryStats(challengeData);
        } catch (error) {
            console.error("Could not fetch or process challenge data for admin:", error);
            calendarGrid.innerHTML = `<p style="color: red; grid-column: 1 / -1; text-align: center;">${error.message}</p>`;
        }
    }

    // Function to calculate and update the day counter for admin page (copied from script.js)
    function updateAdminDayCounter() {
        let currentChallengeDay = 0; // Default value
        if (!adminDayCounterElement) return currentChallengeDay;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate the difference in days
        const timeDiff = today.getTime() - startDate.getTime();
        const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // Difference in full days

        if (dayDiff === -1) { // Exactly one day before start date
             adminDayCounterElement.textContent = "STARTS TOMORROW";
             currentChallengeDay = 0; // Not started yet
        } else if (today < startDate) { // More than one day before start date
            adminDayCounterElement.textContent = "Starting Soon"; // Or clear: adminDayCounterElement.textContent = "";
            currentChallengeDay = 0;
        } else { // today >= startDate (Challenge started or completed)
            currentChallengeDay = dayDiff + 1;

            if (currentChallengeDay > 0 && currentChallengeDay <= totalDays) {
                adminDayCounterElement.textContent = `Day ${currentChallengeDay}`;
            } else if (currentChallengeDay > totalDays) {
                adminDayCounterElement.textContent = "Challenge Complete!";
                currentChallengeDay = totalDays; // Cap at total days for percentage
            } else {
                adminDayCounterElement.textContent = "-";
                currentChallengeDay = 0; // Reset if before start
            }
        }
        // We don't need to return the day for admin page currently
        // return currentChallengeDay;
    }


     // Main function to generate headers and cells for admin
    function generateAdminCalendar(data) { // Accept data
        generateHeaders();
        generateAdminCalendarCells(data); // Pass data along
    }

    // Function to generate day headers (Sun-Sat) - Same as public script
    function generateHeaders() {
        calendarHeader.innerHTML = ''; // Clear existing headers
        const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        daysOfWeek.forEach(day => {
            const headerCell = document.createElement('div');
            headerCell.textContent = day;
            calendarHeader.appendChild(headerCell);
        });
    }


    // Function to Generate Admin Calendar Cells (with offset)
    function generateAdminCalendarCells(data) { // Accept data
        calendarGrid.innerHTML = ''; // Clear previous cells

        // Calculate offset
        const startDayOfWeek = startDate.getDay(); // 1 (Monday)

        // Add empty cells for the offset
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-cell', 'empty');
            calendarGrid.appendChild(emptyCell);
        }

        // Add cells for the 75 days
        for (let i = 1; i <= totalDays; i++) {
            const cell = document.createElement('div');
            cell.classList.add('calendar-cell', 'admin-clickable');
            cell.dataset.day = i;

            // Create a span for the day number
            const dayNumberSpan = document.createElement('span');
            dayNumberSpan.classList.add('day-number');
            dayNumberSpan.textContent = i;
            cell.appendChild(dayNumberSpan);

             // --- Calculate and add date ---
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + i - 1); // Calculate date for day 'i'

            // Short date format (e.g., "Apr 29")
            const shortDate = cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const shortDateSpan = document.createElement('span');
            shortDateSpan.classList.add('short-date');
            shortDateSpan.textContent = shortDate;
            cell.appendChild(shortDateSpan);

            // Full date format for tooltip (e.g., "Tuesday, April 29")
            const fullDate = cellDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            cell.title = fullDate; // Set title attribute for hover tooltip
            // --- End Calculate and add date ---


            const dayData = data[i]; // Use passed data argument

            // Add visual cue and background image if data exists
            if (dayData && (dayData.photo || dayData.text)) {
                 // Apply background image if photo exists
                 if (dayData.photo) {
                     cell.style.backgroundImage = `url('${dayData.photo}')`;
                     cell.classList.add('has-image');
                 } else {
                     // If only text exists, maybe apply the background color cue
                     cell.style.backgroundColor = '#F0F0F5';
                 }
            }

            // Add event listener to open the edit modal
            cell.addEventListener('click', () => openEditModal(i));
            calendarGrid.appendChild(cell);
        }
    }

    // Function to Open Edit Modal
    function openEditModal(day) {
        // Default structure for a day's data, including new fields
        const defaultDayData = {
            photo: null,
            // text: null, // Deprecated
            mood: '',
            diet_rating: 5, // Default slider values
            sleep_hours: 7.5,
            calories_burned: 1000, // Default values for new fields
            steps_taken: 10000,
            strength_workout: '',
            cardio_workout: '',
            additional_notes: ''
        };
        const dayData = { ...defaultDayData, ...(challengeData[day] || {}) }; // Merge defaults with existing data

        modalDayNumber.textContent = `Edit Day ${day}`;
        editDayInput.value = day; // Store the day number

        // Populate form fields

        // --- Mood Handling ---
        const savedMood = dayData.mood || '';
        const standardMoods = Array.from(moodSelect.options).map(opt => opt.value).filter(val => val && val !== "Other"); // Get standard options dynamically

        if (standardMoods.includes(savedMood)) {
            moodSelect.value = savedMood;
            moodOtherInput.style.display = 'none'; // Hide custom input
            moodOtherInput.value = ''; // Clear custom input
            moodOtherInput.required = false; // Not required if standard mood selected
        } else if (savedMood) { // If saved mood is not standard (must be custom)
            moodSelect.value = 'Other';
            moodOtherInput.style.display = 'block'; // Show custom input
            moodOtherInput.value = savedMood; // Populate custom input
            moodOtherInput.required = true; // Required if "Other" is selected
        } else { // No mood saved
            moodSelect.value = ''; // Set to default placeholder
            moodOtherInput.style.display = 'none';
            moodOtherInput.value = '';
            moodOtherInput.required = false;
        }
        // --- End Mood Handling ---


        dietRatingInput.value = dayData.diet_rating || 5;
        dietRatingValueSpan.textContent = dietRatingInput.value;
        updateSliderBackground(dietRatingInput); // Update slider background fill
        sleepHoursInput.value = dayData.sleep_hours || 7.5;
        updateSleepHoursDisplay(sleepHoursInput.value);
        updateSliderBackground(sleepHoursInput); // Update slider background fill
        caloriesSlider.value = dayData.calories_burned || 1000; // Populate new fields
        caloriesInput.value = dayData.calories_burned || 1000;
        updateSliderBackground(caloriesSlider);
        stepsSlider.value = dayData.steps_taken || 10000;
        stepsInput.value = dayData.steps_taken || 10000;
        updateSliderBackground(stepsSlider);
        strengthWorkoutInput.value = dayData.strength_workout || '';
        cardioWorkoutInput.value = dayData.cardio_workout || '';
        additionalNotesInput.value = dayData.additional_notes || '';
        // textDescriptionInput.value = dayData.text || ''; // Deprecated

        // Handle photo preview
        if (dayData.photo) {
            currentPhotoPreview.src = dayData.photo + '?cachebust=' + new Date().getTime();
            currentPhotoPreview.style.display = 'block';
        } else {
            currentPhotoPreview.src = '';
            currentPhotoPreview.style.display = 'none';
        }
        photoUploadInput.value = ''; // Clear the file input

        modal.style.display = 'block';
    }

    // Function to Close Edit Modal
    function closeEditModal() {
        modal.style.display = 'none';
        // Optional: Reset form fields if needed, though opening re-populates them
        // editForm.reset();
        // currentPhotoPreview.style.display = 'none';
    }

    // Event Listeners for Closing Modal
    closeButton.addEventListener('click', closeEditModal);
    cancelButton.addEventListener('click', closeEditModal);

    modal.addEventListener('click', (event) => {
        if (event.target === modal) { // Click on backdrop
            closeEditModal();
        }
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            closeEditModal();
        }
    });

// Function to calculate and display summary statistics for Admin page (copied from script.js)
    function updateAdminSummaryStats(data) { // Accept data
        // Get element references inside the function to ensure they exist
        const adminSummaryMood = document.getElementById('admin-summary-mood')?.querySelector('.value');
        const adminSummaryDiet = document.getElementById('admin-summary-diet')?.querySelector('.value');
        const adminSummarySleep = document.getElementById('admin-summary-sleep')?.querySelector('.value');
        const adminSummaryCalories = document.getElementById('admin-summary-calories')?.querySelector('.value');
        const adminSummarySteps = document.getElementById('admin-summary-steps')?.querySelector('.value');

        const days = Object.values(data); // Use passed data argument
        const completedDays = days.filter(day => day && ( // Filter for days with *any* relevant data
            day.mood ||
            day.diet_rating !== null ||
            day.sleep_hours !== null ||
            day.calories_burned !== null ||
            day.steps_taken !== null ||
            day.strength_workout || // Keep these for filtering, even if not displayed
            day.cardio_workout
        ));

        if (completedDays.length === 0) {
            // Optionally clear stats or show 'No data yet'
            if(adminSummaryMood) adminSummaryMood.textContent = '-';
            if(adminSummaryDiet) adminSummaryDiet.textContent = '-';
            if(adminSummarySleep) adminSummarySleep.textContent = '-';
            if(adminSummaryCalories) adminSummaryCalories.textContent = '-';
            if(adminSummarySteps) adminSummarySteps.textContent = '-';
            return;
        }

        // Calculate Mood (Most Frequent)
        if (adminSummaryMood) {
            const moodCounts = completedDays.reduce((acc, day) => {
                if (day.mood) {
                    acc[day.mood] = (acc[day.mood] || 0) + 1;
                }
                return acc;
            }, {});
            let topMood = '-';
            let maxCount = 0;
            for (const mood in moodCounts) {
                if (moodCounts[mood] > maxCount) {
                    maxCount = moodCounts[mood];
                    topMood = mood;
                }
            }
            adminSummaryMood.textContent = topMood;
        }

        // Calculate Averages (Helper function)
        const calculateAverage = (field) => {
            const values = completedDays.map(day => day[field]).filter(val => val !== null && val !== undefined && !isNaN(parseFloat(val)));
            if (values.length === 0) return null;
            const sum = values.reduce((acc, val) => acc + parseFloat(val), 0);
            return sum / values.length;
        };

        // Diet Rating Average
        if (adminSummaryDiet) {
            const avgDiet = calculateAverage('diet_rating');
            adminSummaryDiet.textContent = avgDiet !== null ? avgDiet.toFixed(1) : '-';
        }

        // Sleep Hours Average
        if (adminSummarySleep) {
            const avgSleep = calculateAverage('sleep_hours');
            // Use existing formatSleepHours helper from admin.js
            adminSummarySleep.textContent = avgSleep !== null ? formatSleepHours(avgSleep) : '-';
        }

        // Calories Burned Average
        if (adminSummaryCalories) {
            const avgCalories = calculateAverage('calories_burned');
            adminSummaryCalories.textContent = avgCalories !== null ? Math.round(avgCalories).toLocaleString() : '-';
        }

        // Steps Taken Average
        if (adminSummarySteps) {
            const avgSteps = calculateAverage('steps_taken');
            adminSummarySteps.textContent = avgSteps !== null ? Math.round(avgSteps).toLocaleString() : '-';
        }
    }
    // Helper function to format sleep hours display (Also used by summary stats)
    function formatSleepHours(hours) {
         if (hours === null || hours === undefined) return ''; // Added check for summary stats
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    }

    // Helper function to update sleep hours display span
    function updateSleepHoursDisplay(value) {
        sleepHoursValueSpan.textContent = formatSleepHours(value);
    }

    // Function to update slider background fill dynamically
    function updateSliderBackground(slider) {
        const min = slider.min || 0;
        const max = slider.max || 100;
        const value = slider.value;
        const percentage = ((value - min) / (max - min)) * 100;
        slider.style.backgroundSize = percentage + '% 100%';
    }

    // Event listeners for sliders to update display values AND background
    dietRatingInput.addEventListener('input', (event) => {
        dietRatingValueSpan.textContent = event.target.value;
        updateSliderBackground(event.target); // Update background on input
    });

    // --- Sync Logic for Calories Slider/Input ---
    caloriesSlider.addEventListener('input', (event) => {
        caloriesInput.value = event.target.value;
        updateSliderBackground(event.target);
    });
    caloriesInput.addEventListener('input', (event) => {
        // Basic validation: ensure value is within range
        let value = parseInt(event.target.value, 10);
        const min = parseInt(caloriesSlider.min, 10);
        const max = parseInt(caloriesSlider.max, 10);
        if (isNaN(value)) value = min; // Default to min if invalid input
        if (value < min) value = min;
        if (value > max) value = max;
        event.target.value = value; // Update input field with validated value
        caloriesSlider.value = value;
        updateSliderBackground(caloriesSlider);
    });

    // --- Sync Logic for Steps Slider/Input ---
     stepsSlider.addEventListener('input', (event) => {
        stepsInput.value = event.target.value;
        updateSliderBackground(event.target);
    });
    stepsInput.addEventListener('input', (event) => {
        let value = parseInt(event.target.value, 10);
        const min = parseInt(stepsSlider.min, 10);
        const max = parseInt(stepsSlider.max, 10);
         if (isNaN(value)) value = min;
        if (value < min) value = min;
        if (value > max) value = max;
        event.target.value = value;
        stepsSlider.value = value;
        updateSliderBackground(stepsSlider);
    });

    // Event listener for mood dropdown change
    moodSelect.addEventListener('change', (event) => {
        if (event.target.value === 'Other') {
            moodOtherInput.style.display = 'block';
            moodOtherInput.required = true; // Make required when shown
            moodOtherInput.focus(); // Focus the input for convenience
        } else {
            moodOtherInput.style.display = 'none';
            moodOtherInput.required = false; // Not required when hidden
            moodOtherInput.value = ''; // Clear value when hidden
        }
    });

    sleepHoursInput.addEventListener('input', (event) => {
        updateSleepHoursDisplay(event.target.value);
        updateSliderBackground(event.target); // Update background on input
    });


    // Event Listener for Form Submission
    editForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const day = editDayInput.value;
        const photoFile = photoUploadInput.files[0];
        // const text = textDescriptionInput.value; // Deprecated

        // Get values from new fields
        let mood; // Declare mood variable
        if (moodSelect.value === 'Other') {
            mood = moodOtherInput.value.trim(); // Get value from text input if Other is selected
        } else {
            mood = moodSelect.value; // Otherwise get from dropdown
        }
        const dietRating = dietRatingInput.value;
        const sleepHours = sleepHoursInput.value;
        const caloriesBurned = caloriesInput.value; // Get value from number input
        const stepsTaken = stepsInput.value; // Get value from number input
        const strengthWorkout = strengthWorkoutInput.value;
        const cardioWorkout = cardioWorkoutInput.value;
        const additionalNotes = additionalNotesInput.value;


        console.log(`Attempting to save Day ${day}`);
        // console.log("Text:", text); // Deprecated
        console.log("Photo File:", photoFile);
        console.log("Mood:", mood);
        console.log("Diet Rating:", dietRating);
        console.log("Sleep Hours:", sleepHours);
        console.log("Calories Burned:", caloriesBurned); // Log new values
        console.log("Steps Taken:", stepsTaken);
        console.log("Strength:", strengthWorkout);
        console.log("Cardio:", cardioWorkout);
        console.log("Notes:", additionalNotes);


        // --- Send Data to Server ---
        const formData = new FormData();
        formData.append('day', day);
        // formData.append('text', text); // Deprecated
        if (photoFile) {
            formData.append('photo', photoFile); // Append file if selected
        }
        // Append new fields
        formData.append('mood', mood);
        formData.append('diet_rating', dietRating);
        formData.append('sleep_hours', sleepHours);
        formData.append('calories_burned', caloriesBurned); // Append new fields
        formData.append('steps_taken', stepsTaken);
        formData.append('strength_workout', strengthWorkout);
        formData.append('cardio_workout', cardioWorkout);
        formData.append('additional_notes', additionalNotes);


        // Add visual feedback for saving (optional)
        const saveButton = editForm.querySelector('button[type="submit"]');
        const originalButtonText = saveButton.textContent;
        saveButton.textContent = 'Saving...';
        saveButton.disabled = true;


        try {
            // Send request to the server endpoint
            const response = await fetch('/api/save-day', {
                method: 'POST',
                body: formData // Send as FormData
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || `Server error: ${response.status}`);
            }

            console.log('Save successful:', result.message);
            // alert('Save successful!'); // Replaced with less intrusive feedback

            // --- Update local data and UI after successful save ---
            // Ensure the day entry exists in challengeData
            if (!challengeData[day]) {
                challengeData[day] = {};
            }
            const dayData = challengeData[day];

            // Update with new data (or null if empty string)
            dayData.mood = mood || null;
            dayData.diet_rating = dietRating ? parseFloat(dietRating) : null;
            dayData.sleep_hours = sleepHours ? parseFloat(sleepHours) : null;
            dayData.calories_burned = caloriesBurned ? parseInt(caloriesBurned, 10) : null; // Update local data
            dayData.steps_taken = stepsTaken ? parseInt(stepsTaken, 10) : null;
            dayData.strength_workout = strengthWorkout || null;
            dayData.cardio_workout = cardioWorkout || null;
            dayData.additional_notes = additionalNotes || null;
            // dayData.text = text || null; // Deprecated

            // Determine if the day has any content (photo or any of the new fields)
            let hasContent = false;

            // Use the photo path returned by the server
            if (result.photoPath) {
                 dayData.photo = result.photoPath;
                 hasContent = true;
            } else if (!photoFile && dayData.photo) {
                 // No new photo, but existing photo exists
                 hasContent = true;
            } else if (!photoFile) {
                 // No new photo and no existing photo
                 dayData.photo = null;
            }

            // Check if any other field has content (including new fields)
            if (dayData.mood ||
                dayData.diet_rating !== null ||
                dayData.sleep_hours !== null ||
                dayData.calories_burned !== null ||
                dayData.steps_taken !== null ||
                dayData.strength_workout ||
                dayData.cardio_workout ||
                dayData.additional_notes) {
                hasContent = true;
            }

            // Update the main data object
            challengeData[day] = dayData;


            // Visually update the cell, including background image
            const cell = calendarGrid.querySelector(`.calendar-cell[data-day="${day}"]`);
            if (cell) {
                // Reset styles first
                cell.style.backgroundImage = '';
                cell.style.backgroundColor = '';
                cell.classList.remove('has-image');

                if (hasContent) {
                    // Explicitly clear old styles first
                    cell.style.backgroundImage = '';
                    cell.style.backgroundColor = '';
                    cell.classList.remove('has-image');

                    if (dayData.photo) {
                        // Preload the image before applying it as background
                        const imageUrl = `${dayData.photo}?cachebust=${new Date().getTime()}`;
                        console.log(`Preloading and applying cell ${day} background: ${imageUrl}`);
                        const img = new Image();
                        img.onload = () => {
                            console.log(`Image loaded for cell ${day}, applying background.`);
                            // Force reflow/repaint before applying style
                            void cell.offsetHeight;
                            cell.style.backgroundImage = `url('${imageUrl}')`; // Apply ONLY on load
                            cell.classList.add('has-image');
                            cell.style.backgroundColor = ''; // Ensure no fallback color remains
                        };
                        let retryCount = 0;
                        const maxRetries = 1; // Try reloading once more

                        img.onerror = (errorEvent) => { // Capture the error event
                             console.error(`img.onerror triggered for cell ${day} (Retry ${retryCount}). Image URL: ${imageUrl}`, errorEvent); // Log the event

                             if (retryCount < maxRetries) {
                                 retryCount++;
                                 const retryImageUrl = `${dayData.photo}?cachebust=${new Date().getTime()}&retry=${retryCount}`;
                                 console.log(`Retrying image load for cell ${day}: ${retryImageUrl}`);
                                 setTimeout(() => {
                                     img.src = retryImageUrl; // Try loading again after a delay
                                 }, 500); // Wait 500ms before retrying
                             } else {
                                 console.error(`Max retries reached for cell ${day}. Applying fallback.`);
                                 cell.style.backgroundColor = '#F0F0F5'; // Apply fallback color after final failure
                                 cell.classList.remove('has-image'); // Ensure class is removed on error
                             }
                        };
                        img.src = imageUrl; // Start loading the image
                    } else if (hasContent) { // Check hasContent *after* checking dayData.photo
                        console.log(`Applying fallback background color for cell ${day} because hasContent is true but dayData.photo is falsey.`); // Log this case
                        // Apply background color if other data exists but no photo
                        cell.style.backgroundColor = '#F0F0F5'; // Use a subtle indicator
                    }
                }
                // If !hasContent, styles remain reset (empty cell appearance)
            }

            // Update photo preview in modal (though it's about to close)
            if (dayData.photo) {
                currentPhotoPreview.src = dayData.photo + '?cachebust=' + new Date().getTime();
                currentPhotoPreview.style.display = 'block';
            } else {
                 currentPhotoPreview.style.display = 'none';
            }

            closeEditModal();

        } catch (error) {
            console.error("Error saving data:", error);
            alert(`Error saving data: ${error.message}`); // Show error to user
        } finally {
             // Restore button state regardless of success/error
             saveButton.textContent = originalButtonText;
             saveButton.disabled = false;
        }
        // --- End Send Data to Server ---
    });

    // Initialize the admin calendar
    initializeAdminCalendar();
});

