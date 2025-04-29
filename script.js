document.addEventListener('DOMContentLoaded', () => {
    const calendarHeader = document.getElementById('calendar-header');
    const calendarGrid = document.getElementById('calendar-grid');
    const modal = document.getElementById('day-modal');
    const modalContent = modal.querySelector('.modal-content');
    const closeButton = modal.querySelector('.close-button');
    const modalDayNumber = document.getElementById('modal-day-number');
    const modalPhoto = document.getElementById('modal-photo');
    // const modalText = document.getElementById('modal-text'); // Replaced by detail elements
    const dayCounterElement = document.getElementById('day-counter'); // Added

    // Get references to new detail elements
    const modalMoodContainer = document.getElementById('modal-mood-container');
    const modalMood = document.getElementById('modal-mood');
    const modalDietContainer = document.getElementById('modal-diet-container');
    const modalDiet = document.getElementById('modal-diet');
    const modalSleepContainer = document.getElementById('modal-sleep-container');
    const modalSleep = document.getElementById('modal-sleep');
    const modalCaloriesContainer = document.getElementById('modal-calories-container'); // New
    const modalCalories = document.getElementById('modal-calories'); // New
    const modalStepsContainer = document.getElementById('modal-steps-container'); // New
    const modalSteps = document.getElementById('modal-steps'); // New
    const modalStrengthContainer = document.getElementById('modal-strength-container');
    const modalStrength = document.getElementById('modal-strength');
    const modalCardioContainer = document.getElementById('modal-cardio-container');
    const modalCardio = document.getElementById('modal-cardio');
    const modalNotesContainer = document.getElementById('modal-notes-container');
    const modalNotes = document.getElementById('modal-notes');
    const progressPercentageElement = document.getElementById('progress-percentage'); // New element
    const dailyQuoteElement = document.getElementById('daily-quote'); // New element

    // Summary Stat Elements
    const summaryMood = document.getElementById('summary-mood')?.querySelector('.value');
    const summaryDiet = document.getElementById('summary-diet')?.querySelector('.value');
    const summarySleep = document.getElementById('summary-sleep')?.querySelector('.value');
    const summaryCalories = document.getElementById('summary-calories')?.querySelector('.value');
    const summarySteps = document.getElementById('summary-steps')?.querySelector('.value');
    // const summaryStrength = document.getElementById('summary-strength')?.querySelector('.value'); // Removed
    // const summaryCardio = document.getElementById('summary-cardio')?.querySelector('.value'); // Removed

    const totalDays = 75;
    const startDate = new Date(2025, 3, 29); // NEW START DATE: April 29th, 2025
    // Set start date to midnight for accurate day difference calculation
    startDate.setHours(0, 0, 0, 0);

    let challengeData = {};

    // Function to fetch data and initialize calendar
    async function initializeCalendar() {
        try {
            // Check if running locally via file:// protocol
            if (window.location.protocol === 'file:') {
                 console.warn("Running via file:// protocol. Fetching local JSON might be blocked by browser security settings. Use a local web server for reliable data loading.");
                 // Attempt to load anyway, but it might fail silently or throw a CORS error in console
            }
            const response = await fetch('data.json?cachebust=' + new Date().getTime());
            if (!response.ok) {
                // Provide a more user-friendly error message on the page
                throw new Error(`Failed to load data (Status: ${response.status}). Ensure data.json exists and the page is served via HTTP(S), not file://.`);
            }
            challengeData = await response.json();
            generateCalendar(); // Call the main generation function
            const currentDay = updateDayCounter(); // Calculate and display the current day
            updateProgressPercentage(currentDay); // Display progress percentage
            displayDailyQuote(currentDay); // Display daily quote
            updateSummaryStats(); // Calculate and display summary stats
            } catch (error) {
                console.error("Could not fetch or process challenge data:", error);
                // Display the error message within the calendar grid area
                calendarGrid.innerHTML = `<p style="color: red; grid-column: 1 / -1; text-align: center;">${error.message}</p>`;
                // Also hide or show error in day counter
                 if (dayCounterElement) dayCounterElement.textContent = '-';
            }
        }
    
        // Function to calculate and update the day counter, returns current day number
        function updateDayCounter() {
            let currentChallengeDay = 0; // Default value
            if (!dayCounterElement) return currentChallengeDay;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Calculate the difference in days
            const timeDiff = today.getTime() - startDate.getTime();
            const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // Difference in full days

            if (dayDiff === -1) { // Exactly one day before start date
                 dayCounterElement.textContent = "STARTS TOMORROW";
                 currentChallengeDay = 0; // Not started yet
            } else if (today < startDate) { // More than one day before start date
                dayCounterElement.textContent = "Starting Soon"; // Or clear: dayCounterElement.textContent = "";
                currentChallengeDay = 0;
            } else { // today >= startDate (Challenge started or completed)
                currentChallengeDay = dayDiff + 1;

                if (currentChallengeDay > 0 && currentChallengeDay <= totalDays) {
                    dayCounterElement.textContent = `Day ${currentChallengeDay}`;
                } else if (currentChallengeDay > totalDays) {
                    dayCounterElement.textContent = "Challenge Complete!";
                    currentChallengeDay = totalDays; // Cap at total days for percentage
                } else {
                    dayCounterElement.textContent = "-";
                    currentChallengeDay = 0; // Reset if before start
                }
            }
            return currentChallengeDay; // Return the calculated day
        }

        // Function to update progress percentage
        function updateProgressPercentage(currentDay) {
            if (!progressPercentageElement || currentDay <= 0) {
                 if(progressPercentageElement) progressPercentageElement.textContent = ''; // Clear if not started
                return;
            }
            const percentage = Math.min(100, Math.round(((currentDay -1) / totalDays) * 100)); // Day 1 means 0% done
             progressPercentageElement.textContent = `You are ${percentage}% done with 75 Hard!`;
             if (currentDay > totalDays) {
                 progressPercentageElement.textContent = `Congratulations on completing 75 Hard!`;
             }
        }

         // Function to display a daily quote
         function displayDailyQuote(currentDay) {
             if (!dailyQuoteElement || currentDay <= 0 || currentDay > totalDays) {
                 if(dailyQuoteElement) dailyQuoteElement.textContent = ''; // Clear if not in challenge
                 return;
             }
             // Simple list of quotes, index based on day modulo number of quotes
             const quotes = [
                 "The journey of a thousand miles begins with a single step.",
                 "Discipline is the bridge between goals and accomplishment.",
                 "Don't limit your challenges. Challenge your limits.",
                 "The hard days are what make you stronger.",
                 "Success is the sum of small efforts, repeated day in and day out.",
                 "Believe you can and you're halfway there.",
                 "It’s not about having time. It’s about making time.",
                 "The pain you feel today will be the strength you feel tomorrow.",
                 "Consistency is more important than perfection.",
                 "Push yourself because no one else is going to do it for you.",
                 "Your only limit is your mind.",
                 "Wake up with determination. Go to bed with satisfaction.",
                 "Do something today that your future self will thank you for.",
                 "It always seems impossible until it's done.",
                 "The difference between ordinary and extraordinary is that little extra."
             ];
             const quoteIndex = (currentDay - 1) % quotes.length; // Use day number (1-75) for index
             dailyQuoteElement.textContent = `"${quotes[quoteIndex]}"`;
         }
    
    
        // Main function to generate headers and cells
        function generateCalendar() {
            generateHeaders();
            generateCalendarCells();
        }

    // Function to generate day headers (Sun-Sat)
    function generateHeaders() {
        calendarHeader.innerHTML = ''; // Clear existing headers
        const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        daysOfWeek.forEach(day => {
            const headerCell = document.createElement('div');
            headerCell.textContent = day;
            calendarHeader.appendChild(headerCell);
        });
    }

    // Function to Generate Calendar Cells (with offset)
    function generateCalendarCells() {
        calendarGrid.innerHTML = ''; // Clear previous cells

        // Calculate offset: 0 for Sunday, 1 for Monday, ..., 6 for Saturday
        const startDayOfWeek = startDate.getDay(); // 1 (Monday for April 28, 2025)

        // Add empty cells for the offset
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-cell', 'empty');
            calendarGrid.appendChild(emptyCell);
        }

        // Add cells for the 75 days
        for (let i = 1; i <= totalDays; i++) {
            const cell = document.createElement('div');
            cell.classList.add('calendar-cell');
            cell.dataset.day = i;

            // Create a span for the day number to allow styling over background
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


            const dayData = challengeData[i];

            // Check if data exists and has content (photo or any new field)
            const hasContent = dayData && (
                dayData.photo ||
                dayData.mood ||
                dayData.diet_rating !== null || // Check for null explicitly for numbers
                dayData.sleep_hours !== null ||
                dayData.calories_burned !== null || // Add new fields to check
                dayData.steps_taken !== null ||
                dayData.strength_workout ||
                dayData.cardio_workout ||
                dayData.additional_notes
                // || dayData.text // Old check, removed
            );

            if (hasContent) {
                cell.classList.add('completed');
                cell.addEventListener('click', () => openModal(i)); // Listener only added if hasContent

                // Apply background image if photo exists
                if (dayData.photo) {
                    cell.style.backgroundImage = `url('${dayData.photo}')`;
                    cell.classList.add('has-image'); // Add class for specific image styling/hover
                }
            }

            calendarGrid.appendChild(cell);
        }
    }

    // Helper function to format sleep hours display (same as admin.js)
    function formatSleepHours(hours) {
        if (hours === null || hours === undefined) return '';
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    }

    // Function to Open Modal
    function openModal(day) {
        const dayData = challengeData[day];
        if (!dayData) return; // Restore check: Only proceed if data exists

        modalDayNumber.textContent = `Day ${day}`;

        // Handle Photo
        modalPhoto.src = dayData.photo || ''; // Set src to empty if no photo
        modalPhoto.style.display = dayData.photo ? 'block' : 'none'; // Hide img element if no photo

        // --- Populate Details ---
        // Mood
        if (dayData.mood) {
            modalMood.textContent = dayData.mood;
            modalMoodContainer.style.display = 'block';
        } else {
            modalMoodContainer.style.display = 'none';
        }

        // Diet Rating
        if (dayData.diet_rating !== null && dayData.diet_rating !== undefined) {
            modalDiet.textContent = dayData.diet_rating;
            modalDietContainer.style.display = 'block';
        } else {
            modalDietContainer.style.display = 'none';
        }

        // Sleep Hours
        if (dayData.sleep_hours !== null && dayData.sleep_hours !== undefined) {
            modalSleep.textContent = formatSleepHours(dayData.sleep_hours);
            modalSleepContainer.style.display = 'block';
        } else {
            modalSleepContainer.style.display = 'none';
        }

        // Calories Burned
        if (dayData.calories_burned !== null && dayData.calories_burned !== undefined) {
            modalCalories.textContent = dayData.calories_burned.toLocaleString(); // Format number
            modalCaloriesContainer.style.display = 'block';
        } else {
            modalCaloriesContainer.style.display = 'none';
        }

        // Steps Taken
        if (dayData.steps_taken !== null && dayData.steps_taken !== undefined) {
            modalSteps.textContent = dayData.steps_taken.toLocaleString(); // Format number
            modalStepsContainer.style.display = 'block';
        } else {
            modalStepsContainer.style.display = 'none';
        }

        // Strength Workout
        if (dayData.strength_workout) {
            modalStrength.textContent = dayData.strength_workout; // Use textContent for <pre>
            modalStrengthContainer.style.display = 'block';
        } else {
            modalStrengthContainer.style.display = 'none';
        }

        // Cardio Workout
        if (dayData.cardio_workout) {
            modalCardio.textContent = dayData.cardio_workout; // Use textContent for <pre>
            modalCardioContainer.style.display = 'block';
        } else {
            modalCardioContainer.style.display = 'none';
        }

        // Additional Notes
        if (dayData.additional_notes) {
            modalNotes.textContent = dayData.additional_notes; // Use textContent for <p>
            modalNotesContainer.style.display = 'block';
        } else {
            modalNotesContainer.style.display = 'none';
        }

        // modalText.innerHTML = dayData.text?.replace(/\n/g, '<br>') || ''; // Old logic removed

        modal.classList.remove('closing'); // Ensure closing class is removed before display
        modal.style.display = 'block'; // Display the modal (triggers opening animation)
    }

    // Function to Close Modal with Animation
    function closeModal() {
        modal.classList.add('closing'); // Add class to trigger closing animations

        // Wait for animation to finish before hiding
        modal.addEventListener('animationend', () => {
            modal.style.display = 'none';
            modal.classList.remove('closing'); // Remove class for next time
        }, { once: true }); // Remove listener after it runs once
    }

    // Event Listeners for Closing Modal
    closeButton.addEventListener('click', closeModal);

    // Close modal if user clicks on the background overlay
    modal.addEventListener('click', (event) => {
        if (event.target === modal) { // Check if the click is directly on the modal backdrop
            closeModal();
        }
    });

    // Close modal with Escape key
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });

    // Initialize the calendar when the DOM is loaded
    initializeCalendar();

    // TODO: Create placeholder image if needed (or ensure styling handles missing img src gracefully)
    // TODO: Implement Admin page functionality

    // Function to calculate and display summary statistics
    function updateSummaryStats() {
        const days = Object.values(challengeData); // Get all day data objects
        const completedDays = days.filter(day => day && ( // Filter for days with *any* relevant data
            day.mood ||
            day.diet_rating !== null ||
            day.sleep_hours !== null ||
            day.calories_burned !== null ||
            day.steps_taken !== null ||
            day.strength_workout ||
            day.cardio_workout
        ));

        if (completedDays.length === 0) {
            // Optionally clear stats or show 'No data yet'
            if(summaryMood) summaryMood.textContent = '-';
            if(summaryDiet) summaryDiet.textContent = '-';
            if(summarySleep) summarySleep.textContent = '-';
            if(summaryCalories) summaryCalories.textContent = '-';
            if(summarySteps) summarySteps.textContent = '-';
            // if(summaryStrength) summaryStrength.textContent = '-'; // Removed
            // if(summaryCardio) summaryCardio.textContent = '-'; // Removed
            return;
        }

        // Calculate Mood (Most Frequent)
        if (summaryMood) {
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
            summaryMood.textContent = topMood;
        }

        // Calculate Averages (Helper function)
        const calculateAverage = (field) => {
            const values = completedDays.map(day => day[field]).filter(val => val !== null && val !== undefined && !isNaN(parseFloat(val)));
            if (values.length === 0) return null;
            const sum = values.reduce((acc, val) => acc + parseFloat(val), 0);
            return sum / values.length;
        };

        // Diet Rating Average
        if (summaryDiet) {
            const avgDiet = calculateAverage('diet_rating');
            summaryDiet.textContent = avgDiet !== null ? avgDiet.toFixed(1) : '-';
        }

        // Sleep Hours Average
        if (summarySleep) {
            const avgSleep = calculateAverage('sleep_hours');
            summarySleep.textContent = avgSleep !== null ? formatSleepHours(avgSleep) : '-';
        }

        // Calories Burned Average
        if (summaryCalories) {
            const avgCalories = calculateAverage('calories_burned');
            summaryCalories.textContent = avgCalories !== null ? Math.round(avgCalories).toLocaleString() : '-';
        }

        // Steps Taken Average
        if (summarySteps) {
            const avgSteps = calculateAverage('steps_taken');
            summarySteps.textContent = avgSteps !== null ? Math.round(avgSteps).toLocaleString() : '-';
        }

        // Strength Workout Count (Removed)
        // if (summaryStrength) {
        //     const strengthCount = completedDays.filter(day => day.strength_workout && day.strength_workout.trim() !== '').length;
        //     summaryStrength.textContent = strengthCount;
        // }

         // Cardio Workout Count (Removed)
         // if (summaryCardio) {
         //    const cardioCount = completedDays.filter(day => day.cardio_workout && day.cardio_workout.trim() !== '').length;
         //    summaryCardio.textContent = cardioCount;
        // }
    }

});