// Select elements
const settingsIcon = document.getElementById("settingsIcon");
const settingsModal = document.getElementById("settingsModal");
const saveSettingsButton = document.getElementById("saveSettings");
const countdownTitleElement = document.getElementById("countdownTitle");
const gridContainer = document.getElementById("gridContainer");
const tabLifespan = document.getElementById("tabLifespan");
const tabEvent = document.getElementById("tabEvent");
const errorMessage = document.getElementById("errorMessage");

// Variables to hold interval IDs
let countdownInterval;
let millisecondsInterval;
let lastUpdatedSquare = 0;

// Show settings modal
settingsIcon.addEventListener("click", () => {
  settingsModal.style.display = "flex";
  openTab("Lifespan"); // Default to Lifespan tab
});

// Close modal if clicked outside of the modal content
window.addEventListener("click", (event) => {
  if (event.target === settingsModal) {
    settingsModal.style.display = "none";
    resetErrorStyles();
  }
});

// Tab Switching Logic
function openTab(tabName) {
  const tabcontent = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  document.getElementById(tabName).style.display = "block";
  resetErrorStyles(); // Clear error styles when switching tabs
}

// Add event listeners for tabs
tabLifespan.addEventListener("click", () => openTab("Lifespan"));
tabEvent.addEventListener("click", () => openTab("Event"));

// Reset error styles for all inputs
function resetErrorStyles() {
  errorMessage.style.display = "none";
  document.getElementById("dobInput").style.borderColor = "";
  document.getElementById("eventTitle").style.borderColor = "";
  document.getElementById("startDate").style.borderColor = "";
  document.getElementById("endDate").style.borderColor = "";
}

// Save settings based on selected tab
saveSettingsButton.addEventListener("click", () => {
  const settings = {};
  let totalSquares = 80; // Default for lifespan
  let isValid = true;

  resetErrorStyles(); // Reset any previous error styles

  if (document.getElementById("Lifespan").style.display === "block") {
    const dob = document.getElementById("dobInput").value;
    if (dob) {
      // Set lifespan countdown
      settings.type = "lifespan";
      settings.dob = new Date(dob).getTime();
      totalSquares = 80; // Fixed at 80 years
    } else {
      document.getElementById("dobInput").style.borderColor = "red";
      isValid = false;
    }
  } else if (document.getElementById("Event").style.display === "block") {
    const eventTitle = document.getElementById("eventTitle").value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    if (eventTitle && startDate && endDate) {
      // Set event deadline countdown
      settings.type = "event";
      settings.title = eventTitle;
      settings.startDate = new Date(startDate).getTime();
      settings.endDate = new Date(endDate).getTime();

      // Calculate total months between start and end dates
      const totalMonths =
        (new Date(endDate).getFullYear() - new Date(startDate).getFullYear()) *
          12 +
        new Date(endDate).getMonth() -
        new Date(startDate).getMonth();
      totalSquares = totalMonths;
    } else {
      // Highlight missing fields in red
      if (!eventTitle)
        document.getElementById("eventTitle").style.borderColor = "red";
      if (!startDate)
        document.getElementById("startDate").style.borderColor = "red";
      if (!endDate)
        document.getElementById("endDate").style.borderColor = "red";
      isValid = false;
    }
  }

  if (!isValid) {
    errorMessage.style.display = "block";
    return; // Stop execution if there are validation errors
  }

  settings.totalSquares = totalSquares; // Save the total number of squares
  // Clear existing settings and intervals
  clearIntervals();
  chrome.storage.sync.set({ settings }, () => {
    settingsModal.style.display = "none";
    lastUpdatedSquare = 0; // Reset grid tracking
    loadSettings(); // Load and apply new settings
  });
});

// Load and apply settings
function loadSettings() {
  chrome.storage.sync.get("settings", ({ settings }) => {
    if (settings) {
      const totalSquares = settings.totalSquares || 80; // Default to 80 if not set
      createGrid(totalSquares); // Create the grid with the correct number of squares
      if (settings.type === "lifespan") {
        const lifespan = settings.dob + 80 * 365 * 24 * 60 * 60 * 1000;
        startCountdown(lifespan, settings.dob);
        countdownTitleElement.innerText = "Your Lifespan Countdown";
        updateGrid(Date.now(), settings.dob, lifespan, totalSquares); // Initial color update
      } else if (settings.type === "event") {
        startCountdown(settings.endDate, settings.startDate, settings.title);
        countdownTitleElement.innerText = settings.title;
        updateGrid(
          Date.now(),
          settings.startDate,
          settings.endDate,
          totalSquares
        ); // Initial color update
      }
    }
  });
}

// Countdown and grid initialization
function startCountdown(targetDate, startDate, title) {
  clearIntervals(); // Clear any existing intervals

  // Update the countdown every second
  countdownInterval = setInterval(() => {
    const now = Date.now();
    const remainingTime = targetDate - now;

    if (remainingTime <= 0) {
      countdownTitleElement.innerText = "Countdown Complete!";
      clearIntervals();
      return;
    }

    const years = Math.floor(remainingTime / (365 * 24 * 60 * 60 * 1000));
    const months = Math.floor(
      (remainingTime % (365 * 24 * 60 * 60 * 1000)) / (30 * 24 * 60 * 60 * 1000)
    );
    const days = Math.floor(
      (remainingTime % (30 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000)
    );
    const hours = Math.floor(
      (remainingTime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
    );
    const minutes = Math.floor(
      (remainingTime % (60 * 60 * 1000)) / (60 * 1000)
    );
    const seconds = Math.floor((remainingTime % (60 * 1000)) / 1000);

    document.getElementById("years").innerText = String(years).padStart(2, "0");
    document.getElementById("months").innerText = String(months).padStart(
      2,
      "0"
    );
    document.getElementById("days").innerText = String(days).padStart(2, "0");
    document.getElementById("hours").innerText = String(hours).padStart(2, "0");
    document.getElementById("minutes").innerText = String(minutes).padStart(
      2,
      "0"
    );
    document.getElementById("seconds").innerText = String(seconds).padStart(
      2,
      "0"
    );
  }, 1000);

  // Update milliseconds separately
  millisecondsInterval = setInterval(() => {
    const now = Date.now();
    const remainingTime = targetDate - now;
    const milliseconds = remainingTime % 1000;
    document.getElementById("milliseconds").innerText = String(
      milliseconds
    ).padStart(3, "0");
  }, 10); // Set interval for milliseconds
}

// Create grid based on total squares (80 for lifespan, or total months for deadline)
function createGrid(totalSquares) {
  gridContainer.innerHTML = ""; // Clear existing grid

  // Calculate optimal rows and columns to fill screen
  const screenRatio = window.innerWidth / window.innerHeight;
  const columns = Math.ceil(Math.sqrt(totalSquares * screenRatio));
  const rows = Math.ceil(totalSquares / columns);

  // Set grid template for dynamic sizing
  gridContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

  for (let i = 0; i < totalSquares; i++) {
    const square = document.createElement("div");
    square.classList.add("square");
    square.style.backgroundColor = "#333"; // Default color for squares
    gridContainer.appendChild(square);
  }
}

// Update grid based on time passed
function updateGrid(now, startDate, targetDate, totalSquares) {
  const squares = document.querySelectorAll(".square");
  const timePassedRatio = startDate
    ? (now - startDate) / (targetDate - startDate)
    : 0;
  const squaresPassed = Math.floor(timePassedRatio * totalSquares);

  for (let i = lastUpdatedSquare; i < squaresPassed; i++) {
    if (i < squares.length) {
      squares[i].style.backgroundColor = "#2e7d32";
    }
  }
  lastUpdatedSquare = squaresPassed;
}

// Clear existing intervals to prevent flickering
function clearIntervals() {
  if (countdownInterval) clearInterval(countdownInterval);
  if (millisecondsInterval) clearInterval(millisecondsInterval);
}

// Load settings on page load to ensure the latest settings are applied
document.addEventListener("DOMContentLoaded", loadSettings);
