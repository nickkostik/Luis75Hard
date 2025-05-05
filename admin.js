document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const calendarHeader = document.getElementById('calendar-header');
    const calendarGrid = document.getElementById('calendar-grid');
    const modal = document.getElementById('edit-modal');
    const closeButton = modal.querySelector('.close-button');
    const cancelButton = modal.querySelector('.cancel-button');
    const editForm = document.getElementById('edit-form');
    const modalDayNumber = document.getElementById('edit-modal-day-number');
    const editDayInput = document.getElementById('edit-day-input');
    const photoGalleryContainer = document.getElementById('photo-gallery-container'); // New gallery container
    const photoUploadInput = document.getElementById('photo-upload'); // Now handles multiple files
    const moodSelect = document.getElementById('mood');
    const moodOtherInput = document.getElementById('mood-other');
    const adminDayCounterElement = document.getElementById('admin-day-counter');
    const dietRatingInput = document.getElementById('diet-rating');
    const dietRatingValueSpan = document.getElementById('diet-rating-value');
    const sleepHoursInput = document.getElementById('sleep-hours');
    const sleepHoursValueSpan = document.getElementById('sleep-hours-value');
    const caloriesSlider = document.getElementById('calories-burned-slider');
    const caloriesInput = document.getElementById('calories-burned-input');
    const stepsSlider = document.getElementById('steps-taken-slider');
    const stepsInput = document.getElementById('steps-taken-input');
    const strengthWorkoutInput = document.getElementById('strength-workout');
    const cardioWorkoutInput = document.getElementById('cardio-workout');
    const additionalNotesInput = document.getElementById('additional-notes');

    // --- Configuration & State ---
    const totalDays = 75;
    const startDate = new Date(2025, 3, 29); // April 29th, 2025
    let challengeData = {}; // Holds the fetched data

    // --- Initialization ---
    async function initializeAdmin() {
        try {
            if (window.location.protocol === 'file:') {
                 console.warn("Admin Panel: Running via file:// protocol. Fetching/Saving data requires a local web server.");
            }
            // Fetch data with cache busting
            const response = await fetch('data.json?cachebust=' + new Date().getTime());
            if (!response.ok) {
                 throw new Error(`Failed to load data (Status: ${response.status}). Ensure data.json exists and the page is served via HTTP(S), not file://.`);
            }
            challengeData = await response.json();

            generateAdminCalendar(challengeData);
            updateAdminDayCounter();
            updateAdminSummaryStats(challengeData);
        } catch (error) {
            console.error("Could not fetch or process challenge data for admin:", error);
            calendarGrid.innerHTML = `<p style="color: red; grid-column: 1 / -1; text-align: center;">${error.message}</p>`;
        }
    }

    // --- Calendar Generation ---
    function generateAdminCalendar(data) {
        generateHeaders();
        generateAdminCalendarCells(data);
    }

    function generateHeaders() {
        calendarHeader.innerHTML = '';
        const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        daysOfWeek.forEach(day => {
            const headerCell = document.createElement('div');
            headerCell.textContent = day;
            calendarHeader.appendChild(headerCell);
        });
    }

    function generateAdminCalendarCells(data) {
        calendarGrid.innerHTML = '';
        const startDayOfWeek = startDate.getDay();

        // Add empty cells for offset
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

            const dayNumberSpan = document.createElement('span');
            dayNumberSpan.classList.add('day-number');
            dayNumberSpan.textContent = i;
            cell.appendChild(dayNumberSpan);

            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + i - 1);
            const shortDate = cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const shortDateSpan = document.createElement('span');
            shortDateSpan.classList.add('short-date');
            shortDateSpan.textContent = shortDate;
            cell.appendChild(shortDateSpan);
            const fullDate = cellDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            cell.title = fullDate;

            // Append cell to grid *before* trying to update it
            calendarGrid.appendChild(cell);
            updateCalendarCell(i, data[i]); // Use helper to set initial appearance

            cell.addEventListener('click', () => openEditModal(i));
        }
    }

    // --- Calendar Cell Update Helper ---
    function updateCalendarCell(day, dayData) {
        const cell = calendarGrid.querySelector(`.calendar-cell[data-day="${day}"]`);
        if (!cell) {
            return;
        }

        // Reset styles
        cell.style.backgroundImage = '';
        cell.style.backgroundColor = '';
        cell.classList.remove('has-image');

        let hasContent = false;
        let coverPhotoPath = null;

        if (dayData) {
            // Find cover photo
            if (Array.isArray(dayData.photos) && dayData.photos.length > 0) {
                const coverPhoto = dayData.photos.find(p => p.isCover);
                coverPhotoPath = coverPhoto ? coverPhoto.path : dayData.photos[0].path; // Fallback to first if no cover explicitly set
                hasContent = true;
            }

            // Check if other fields have content
            if (dayData.mood || dayData.diet_rating !== null || dayData.sleep_hours !== null ||
                dayData.calories_burned !== null || dayData.steps_taken !== null ||
                dayData.strength_workout || dayData.cardio_workout || dayData.additional_notes) {
                hasContent = true;
            }
        }

        if (hasContent) {
            if (coverPhotoPath) {
                // Simplified direct application (Reverting preloading for testing)
                const imageUrl = `${coverPhotoPath}?cachebust=${new Date().getTime()}`;

                // Explicitly clear other background properties first
                cell.style.backgroundColor = '';
                cell.style.background = 'none'; // Clear shorthand property too

                // Apply the image
                cell.style.backgroundImage = `url("${imageUrl}")`;
                cell.classList.add('has-image');

                // Optional: Add error check without preloading complexity
                const checkImg = new Image();
                checkImg.onerror = () => {
                     // Keep error logging, but remove the console.error specific to this check
                     cell.style.backgroundImage = '';
                     cell.style.backgroundColor = '#F0F0F5'; // Fallback color
                     cell.classList.remove('has-image');
                };
                checkImg.src = imageUrl;

            } else {
                // Apply background color if other data exists but no photo
                cell.style.backgroundColor = '#F0F0F5';
                cell.style.backgroundImage = ''; // Ensure no lingering image
                cell.classList.remove('has-image');
            }
        } else {
             // Ensure styles are reset if no content
             cell.style.backgroundImage = '';
             cell.style.backgroundColor = '';
             cell.classList.remove('has-image');
        }
        // If !hasContent, styles remain reset (empty cell appearance)
    }


    // --- Modal Handling ---
    function openEditModal(day) {
        const defaultDayData = {
            photos: [], // Default to empty array
            mood: '', diet_rating: 5, sleep_hours: 7.5, calories_burned: 1000,
            steps_taken: 10000, strength_workout: '', cardio_workout: '', additional_notes: ''
        };
        const dayData = { ...defaultDayData, ...(challengeData[day] || {}) };

        modalDayNumber.textContent = `Edit Day ${day}`;
        editDayInput.value = day;

        // Populate form fields (Mood, Sliders, Textareas - same as before)
        const savedMood = dayData.mood || '';
        const standardMoods = Array.from(moodSelect.options).map(opt => opt.value).filter(val => val && val !== "Other");
        if (standardMoods.includes(savedMood)) {
            moodSelect.value = savedMood;
            moodOtherInput.style.display = 'none'; moodOtherInput.value = ''; moodOtherInput.required = false;
        } else if (savedMood) {
            moodSelect.value = 'Other';
            moodOtherInput.style.display = 'block'; moodOtherInput.value = savedMood; moodOtherInput.required = true;
        } else {
            moodSelect.value = ''; moodOtherInput.style.display = 'none'; moodOtherInput.value = ''; moodOtherInput.required = false;
        }
        dietRatingInput.value = dayData.diet_rating ?? 5; // Use nullish coalescing
        dietRatingValueSpan.textContent = dietRatingInput.value;
        updateSliderBackground(dietRatingInput);
        sleepHoursInput.value = dayData.sleep_hours ?? 7.5;
        updateSleepHoursDisplay(sleepHoursInput.value);
        updateSliderBackground(sleepHoursInput);
        caloriesSlider.value = dayData.calories_burned ?? 1000;
        caloriesInput.value = dayData.calories_burned ?? 1000;
        updateSliderBackground(caloriesSlider);
        stepsSlider.value = dayData.steps_taken ?? 10000;
        stepsInput.value = dayData.steps_taken ?? 10000;
        updateSliderBackground(stepsSlider);
        strengthWorkoutInput.value = dayData.strength_workout || '';
        cardioWorkoutInput.value = dayData.cardio_workout || '';
        additionalNotesInput.value = dayData.additional_notes || '';

        // Populate photo gallery
        renderPhotoGallery(day, dayData.photos || []);

        photoUploadInput.value = ''; // Clear the file input
        modal.style.display = 'block';
    }

    function closeEditModal() {
        modal.style.display = 'none';
    }

    // --- Photo Gallery Rendering ---
    function renderPhotoGallery(day, photos) {
        photoGalleryContainer.innerHTML = ''; // Clear previous photos

        if (!photos || photos.length === 0) {
            photoGalleryContainer.innerHTML = '<p>No photos uploaded yet.</p>';
            return;
        }

        photos.forEach((photo, index) => {
            const photoItem = document.createElement('div');
            photoItem.classList.add('photo-item');
            if (photo.isCover) {
                photoItem.classList.add('is-cover');
            }

            const img = document.createElement('img');
            img.src = `${photo.path}?cachebust=${new Date().getTime()}`;
            img.alt = `Day ${day} - Photo ${index + 1}`;
            img.onerror = () => { img.alt = 'Error loading image'; /* Handle broken images */ };

            const actions = document.createElement('div');
            actions.classList.add('photo-actions');

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-button');
            deleteButton.dataset.day = day;
            deleteButton.dataset.index = index;

            const coverButton = document.createElement('button');
            coverButton.type = 'button';
            coverButton.textContent = photo.isCover ? 'Cover Photo' : 'Set as Cover';
            coverButton.classList.add('cover-button');
            coverButton.disabled = photo.isCover; // Disable if already cover
            coverButton.dataset.day = day;
            coverButton.dataset.index = index;

            actions.appendChild(coverButton);
            actions.appendChild(deleteButton);
            photoItem.appendChild(img);
            photoItem.appendChild(actions);
            photoGalleryContainer.appendChild(photoItem);
        });
    }

    // --- Photo Actions (Delete & Set Cover) ---
    async function deletePhoto(day, index) {
        if (!confirm(`Are you sure you want to delete photo ${index + 1} for Day ${day}?`)) {
            return;
        }

        console.log(`Attempting to delete photo index ${index} for Day ${day}`);
        showLoadingFeedback('Deleting photo...'); // Show feedback

        try {
            const response = await fetch(`/api/delete-photo/${day}/${index}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || `Server error: ${response.status}`);
            }

            console.log('Delete successful:', result.message);
            // Update local data
            challengeData[day].photos = result.photos;
            // Re-render gallery and update calendar cell
            renderPhotoGallery(day, result.photos);
            updateCalendarCell(day, challengeData[day]);
            showLoadingFeedback(''); // Clear feedback

        } catch (error) {
            console.error("Error deleting photo:", error);
            alert(`Error deleting photo: ${error.message}`);
            showLoadingFeedback(''); // Clear feedback
        }
    }

    async function setCoverPhoto(day, index) {
        console.log(`Attempting to set photo index ${index} as cover for Day ${day}`);
        showLoadingFeedback('Setting cover photo...'); // Show feedback

        try {
            const response = await fetch(`/api/set-cover/${day}/${index}`, {
                method: 'POST'
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || `Server error: ${response.status}`);
            }

            console.log('Set cover successful:', result.message);
            // Update local data
            challengeData[day].photos = result.photos;
            // Re-render gallery and update calendar cell
            renderPhotoGallery(day, result.photos);
            updateCalendarCell(day, challengeData[day]);
            showLoadingFeedback(''); // Clear feedback

        } catch (error) {
            console.error("Error setting cover photo:", error);
            alert(`Error setting cover photo: ${error.message}`);
            showLoadingFeedback(''); // Clear feedback
        }
    }

    // --- Form Submission ---
    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const day = editDayInput.value;
        const filesToUpload = photoUploadInput.files; // Get FileList

        // Get other form values (mood, sliders, textareas)
        let mood = (moodSelect.value === 'Other') ? moodOtherInput.value.trim() : moodSelect.value;
        const dietRating = dietRatingInput.value;
        const sleepHours = sleepHoursInput.value;
        const caloriesBurned = caloriesInput.value;
        const stepsTaken = stepsInput.value;
        const strengthWorkout = strengthWorkoutInput.value;
        const cardioWorkout = cardioWorkoutInput.value;
        const additionalNotes = additionalNotesInput.value;

        console.log(`Attempting to save Day ${day}`);
        console.log("Files to Upload:", filesToUpload); // Log FileList

        const formData = new FormData();
        formData.append('day', day);
        formData.append('mood', mood);
        formData.append('diet_rating', dietRating);
        formData.append('sleep_hours', sleepHours);
        formData.append('calories_burned', caloriesBurned);
        formData.append('steps_taken', stepsTaken);
        formData.append('strength_workout', strengthWorkout);
        formData.append('cardio_workout', cardioWorkout);
        formData.append('additional_notes', additionalNotes);

        // Append each selected file
        if (filesToUpload.length > 0) {
            for (let i = 0; i < filesToUpload.length; i++) {
                formData.append('photos', filesToUpload[i]); // Use 'photos' as the field name
            }
        }

        // Visual feedback for saving
        const saveButton = editForm.querySelector('button[type="submit"]');
        const originalButtonText = saveButton.textContent;
        saveButton.textContent = 'Saving...';
        saveButton.disabled = true;
        showLoadingFeedback('Saving data...'); // Show feedback

        try {
            const response = await fetch('/api/save-day', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || `Server error: ${response.status}`);
            }

            console.log('Save successful:', result.message);

            // --- Update local data and UI ---
            if (!challengeData[day]) {
                challengeData[day] = {};
            }
            const dayData = challengeData[day];

            // Update with non-photo data
            dayData.mood = mood || null;
            dayData.diet_rating = dietRating ? parseFloat(dietRating) : null;
            dayData.sleep_hours = sleepHours ? parseFloat(sleepHours) : null;
            dayData.calories_burned = caloriesBurned ? parseInt(caloriesBurned, 10) : null;
            dayData.steps_taken = stepsTaken ? parseInt(stepsTaken, 10) : null;
            dayData.strength_workout = strengthWorkout || null;
            dayData.cardio_workout = cardioWorkout || null;
            dayData.additional_notes = additionalNotes || null;

            // Update photos array from server response
            dayData.photos = result.photos || []; // Use the photos array returned by the server

            // Update the main data object
            challengeData[day] = dayData;

            // Update the calendar cell visually
            updateCalendarCell(day, dayData);

            closeEditModal();

        } catch (error) {
            console.error("Error saving data:", error);
            alert(`Error saving data: ${error.message}`);
        } finally {
             // Restore button state and clear feedback
             saveButton.textContent = originalButtonText;
             saveButton.disabled = false;
             showLoadingFeedback('');
        }
    });

    // --- Event Listeners ---

    // Modal Closing
    closeButton.addEventListener('click', closeEditModal);
    cancelButton.addEventListener('click', closeEditModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeEditModal();
    });
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'block') closeEditModal();
    });

    // Slider Updates
    dietRatingInput.addEventListener('input', (e) => { dietRatingValueSpan.textContent = e.target.value; updateSliderBackground(e.target); });
    sleepHoursInput.addEventListener('input', (e) => { updateSleepHoursDisplay(e.target.value); updateSliderBackground(e.target); });
    caloriesSlider.addEventListener('input', (e) => { caloriesInput.value = e.target.value; updateSliderBackground(e.target); });
    caloriesInput.addEventListener('input', (e) => { syncSliderInput(e.target, caloriesSlider); });
    stepsSlider.addEventListener('input', (e) => { stepsInput.value = e.target.value; updateSliderBackground(e.target); });
    stepsInput.addEventListener('input', (e) => { syncSliderInput(e.target, stepsSlider); });

    // Mood Dropdown
    moodSelect.addEventListener('change', (event) => {
        if (event.target.value === 'Other') {
            moodOtherInput.style.display = 'block'; moodOtherInput.required = true; moodOtherInput.focus();
        } else {
            moodOtherInput.style.display = 'none'; moodOtherInput.required = false; moodOtherInput.value = '';
        }
    });

    // Photo Gallery Actions (Event Delegation)
    photoGalleryContainer.addEventListener('click', (event) => {
        const target = event.target;
        const day = target.dataset.day;
        const index = target.dataset.index;

        if (target.classList.contains('delete-button') && day && index !== undefined) {
            deletePhoto(day, parseInt(index, 10));
        } else if (target.classList.contains('cover-button') && day && index !== undefined && !target.disabled) {
            setCoverPhoto(day, parseInt(index, 10));
        }
    });


    // --- Helper Functions ---
    function updateAdminDayCounter() { /* ... (same as before) ... */
        let currentChallengeDay = 0;
        if (!adminDayCounterElement) return currentChallengeDay;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const timeDiff = today.getTime() - startDate.getTime();
        const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        if (dayDiff === -1) { adminDayCounterElement.textContent = "STARTS TOMORROW"; currentChallengeDay = 0; }
        else if (today < startDate) { adminDayCounterElement.textContent = "Starting Soon"; currentChallengeDay = 0; }
        else { currentChallengeDay = dayDiff + 1;
            if (currentChallengeDay > 0 && currentChallengeDay <= totalDays) { adminDayCounterElement.textContent = `Day ${currentChallengeDay}`; }
            else if (currentChallengeDay > totalDays) { adminDayCounterElement.textContent = "Challenge Complete!"; currentChallengeDay = totalDays; }
            else { adminDayCounterElement.textContent = "-"; currentChallengeDay = 0; }
        }
    }
    function updateAdminSummaryStats(data) { /* ... (same as before, uses challengeData) ... */
        const adminSummaryMood = document.getElementById('admin-summary-mood')?.querySelector('.value');
        const adminSummaryDiet = document.getElementById('admin-summary-diet')?.querySelector('.value');
        const adminSummarySleep = document.getElementById('admin-summary-sleep')?.querySelector('.value');
        const adminSummaryCalories = document.getElementById('admin-summary-calories')?.querySelector('.value');
        const adminSummarySteps = document.getElementById('admin-summary-steps')?.querySelector('.value');
        const days = Object.values(data);
        const completedDays = days.filter(day => day && (day.mood || day.diet_rating !== null || day.sleep_hours !== null || day.calories_burned !== null || day.steps_taken !== null || day.strength_workout || day.cardio_workout));
        if (completedDays.length === 0) { if(adminSummaryMood) adminSummaryMood.textContent = '-'; if(adminSummaryDiet) adminSummaryDiet.textContent = '-'; if(adminSummarySleep) adminSummarySleep.textContent = '-'; if(adminSummaryCalories) adminSummaryCalories.textContent = '-'; if(adminSummarySteps) adminSummarySteps.textContent = '-'; return; }
        if (adminSummaryMood) { const moodCounts = completedDays.reduce((acc, day) => { if (day.mood) { acc[day.mood] = (acc[day.mood] || 0) + 1; } return acc; }, {}); let topMood = '-'; let maxCount = 0; for (const mood in moodCounts) { if (moodCounts[mood] > maxCount) { maxCount = moodCounts[mood]; topMood = mood; } } adminSummaryMood.textContent = topMood; }
        const calculateAverage = (field) => { const values = completedDays.map(day => day[field]).filter(val => val !== null && val !== undefined && !isNaN(parseFloat(val))); if (values.length === 0) return null; const sum = values.reduce((acc, val) => acc + parseFloat(val), 0); return sum / values.length; };
        if (adminSummaryDiet) { const avgDiet = calculateAverage('diet_rating'); adminSummaryDiet.textContent = avgDiet !== null ? avgDiet.toFixed(1) : '-'; }
        if (adminSummarySleep) { const avgSleep = calculateAverage('sleep_hours'); adminSummarySleep.textContent = avgSleep !== null ? formatSleepHours(avgSleep) : '-'; }
        if (adminSummaryCalories) { const avgCalories = calculateAverage('calories_burned'); adminSummaryCalories.textContent = avgCalories !== null ? Math.round(avgCalories).toLocaleString() : '-'; }
        if (adminSummarySteps) { const avgSteps = calculateAverage('steps_taken'); adminSummarySteps.textContent = avgSteps !== null ? Math.round(avgSteps).toLocaleString() : '-'; }
    }
    function formatSleepHours(hours) { if (hours === null || hours === undefined) return '-'; const h = Math.floor(hours); const m = Math.round((hours - h) * 60); return `${h}h ${m}m`; }
    function updateSleepHoursDisplay(value) { sleepHoursValueSpan.textContent = formatSleepHours(value); }
    function updateSliderBackground(slider) { const min = slider.min || 0; const max = slider.max || 100; const value = slider.value; const percentage = ((value - min) / (max - min)) * 100; slider.style.backgroundSize = percentage + '% 100%'; }
    function syncSliderInput(inputElement, sliderElement) { let value = parseInt(inputElement.value, 10); const min = parseInt(sliderElement.min, 10); const max = parseInt(sliderElement.max, 10); if (isNaN(value)) value = min; if (value < min) value = min; if (value > max) value = max; inputElement.value = value; sliderElement.value = value; updateSliderBackground(sliderElement); }
    function showLoadingFeedback(message) {
        // Basic feedback - could be improved with a dedicated element
        const feedbackElement = document.getElementById('loading-feedback'); // Assume an element exists or create one
        if (feedbackElement) {
            feedbackElement.textContent = message;
            feedbackElement.style.display = message ? 'block' : 'none';
        } else if (message) {
            console.log("Feedback:", message); // Fallback to console
        }
        // You might want to disable form elements during loading too
    }

    // --- Start the application ---
    initializeAdmin();
});
