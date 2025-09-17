// App State
let currentTab = 'practice';
let metronomeInterval = null;
let metronomeAudioContext = null;
let metronomeIsRunning = false;
let currentBPM = 120;

let exerciseTimers = {};
let exerciseStartTimes = {};
let exerciseDurations = {};
let isTimerRunning = {};
let currentExercise = null;
let currentEditingExercise = null;

// Audio variables
let clickBuffer = null;
let gainNode = null;

// Default data
const defaultExercises = [
    {
        id: 1,
        name: "תרגילי אצבעות",
        duration: 8,
        description: "סולמות ותרגילי זריזות",
        currentBPM: 80,
        targetBPM: 120
    },
    {
        id: 2,
        name: "חילופי אקורדים", 
        duration: 8,
        description: "מעבר בין אקורדים שונים",
        currentBPM: 75,
        targetBPM: 110
    },
    {
        id: 3,
        name: "קואורדינציה",
        duration: 7,
        description: "תיאום ידיים ובלגן",
        currentBPM: 70,
        targetBPM: 100
    },
    {
        id: 4,
        name: "רפרטואר",
        duration: 7,
        description: "יצירות שלמות או קטעים",
        currentBPM: 85,
        targetBPM: 130
    }
];

const tips = [
    "התחל איטי והעלה מהירות בהדרגה",
    "שמור על דיוק לפני מהירות", 
    "תרגל עם מטרונום תמיד",
    "רשום הערות על קשיים טכניים",
    "תרגל באותה שעה כל יום",
    "קח הפסקות קצרות בין תרגילים",
    "תמקד על איכות הצליל",
    "שימו לב ליציבה נכונה"
];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
        .then(registration => console.log('SW registered'))
        .catch(error => console.log('SW registration failed'));
    }

    initializeApp();
    setupEventListeners();
    loadCurrentDate();
    loadDailyTip();
    loadExercises();
    loadProgress();
    loadSettings();
    initializeAudio();
});

function initializeApp() {
    // Initialize localStorage if empty
    if (!localStorage.getItem('accordionData')) {
        const initialData = {
            exercises: defaultExercises,
            sessions: [],
            settings: {
                defaultBPM: 120,
                metronomeSound: 'click',
                volume: 70,
                bpmSteps: 3,
                autoIncreaseBPM: true,
                vibrateMode: false
            }
        };
        localStorage.setItem('accordionData', JSON.stringify(initialData));
    }
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            if (tab) {
                switchTab(tab);
            }
        });
    });

    // Metronome controls
    document.getElementById('metronome-toggle').addEventListener('click', toggleMetronome);
    document.getElementById('bpm-plus').addEventListener('click', () => adjustBPM(getBPMSteps()));
    document.getElementById('bpm-minus').addEventListener('click', () => adjustBPM(-getBPMSteps()));
    document.getElementById('faster-btn').addEventListener('click', () => adjustBPM(3));
    document.getElementById('slower-btn').addEventListener('click', () => adjustBPM(-3));

    // Settings
    document.getElementById('metronome-sound').addEventListener('change', updateSound);
    document.getElementById('volume-slider').addEventListener('input', updateVolume);
    document.getElementById('bpm-steps').addEventListener('change', saveBPMSteps);
    document.getElementById('auto-increase-bpm').addEventListener('change', saveSettings);
    document.getElementById('vibrate-mode').addEventListener('change', saveSettings);
    document.getElementById('reset-data').addEventListener('click', resetAllData);

    // Modal controls
    document.getElementById('feedback-good').addEventListener('click', () => handleFeedback('good'));
    document.getElementById('feedback-ok').addEventListener('click', () => handleFeedback('ok'));
    document.getElementById('feedback-hard').addEventListener('click', () => handleFeedback('hard'));
    document.getElementById('save-exercise').addEventListener('click', saveExerciseEdit);
    document.getElementById('cancel-edit').addEventListener('click', closeFeedbackModal);
}

function initializeAudio() {
    try {
        metronomeAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = metronomeAudioContext.createGain();
        gainNode.connect(metronomeAudioContext.destination);

        // Create click sound
        createClickSound();
        updateVolume();
    } catch (error) {
        console.error('Audio initialization failed:', error);
    }
}

function createClickSound() {
    if (!metronomeAudioContext) return;

    const sampleRate = metronomeAudioContext.sampleRate;
    const clickDuration = 0.1;
    const buffer = metronomeAudioContext.createBuffer(1, sampleRate * clickDuration, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate click sound
    for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        data[i] = Math.sin(2 * Math.PI * 1000 * t) * Math.exp(-t * 30);
    }

    clickBuffer = buffer;
}

function playClick() {
    if (!metronomeAudioContext || !clickBuffer) return;

    const settings = getSettings();

    if (settings.vibrateMode && 'vibrate' in navigator) {
        navigator.vibrate(50);
        return;
    }

    if (metronomeAudioContext.state === 'suspended') {
        metronomeAudioContext.resume();
    }

    const source = metronomeAudioContext.createBufferSource();
    source.buffer = clickBuffer;
    source.connect(gainNode);
    source.start();

    // Visual feedback
    const indicator = document.querySelector('.beat-indicator');
    indicator.classList.add('active');
    setTimeout(() => indicator.classList.remove('active'), 100);
}

function toggleMetronome() {
    if (metronomeIsRunning) {
        stopMetronome();
    } else {
        startMetronome();
    }
}

function startMetronome() {
    if (metronomeIsRunning) return;

    const interval = 60000 / currentBPM; // milliseconds

    metronomeInterval = setInterval(playClick, interval);
    metronomeIsRunning = true;

    const toggleBtn = document.getElementById('metronome-toggle');
    toggleBtn.textContent = '⏸️';
    toggleBtn.classList.add('playing');

    // Show tempo controls
    document.getElementById('tempo-controls').style.display = 'flex';

    // Play first click immediately
    playClick();
}

function stopMetronome() {
    if (metronomeInterval) {
        clearInterval(metronomeInterval);
        metronomeInterval = null;
    }

    metronomeIsRunning = false;

    const toggleBtn = document.getElementById('metronome-toggle');
    toggleBtn.textContent = '▶️';
    toggleBtn.classList.remove('playing');

    // Hide tempo controls
    document.getElementById('tempo-controls').style.display = 'none';
}

function adjustBPM(change) {
    currentBPM = Math.max(40, Math.min(200, currentBPM + change));
    document.getElementById('bpm-value').textContent = currentBPM;

    if (metronomeIsRunning) {
        stopMetronome();
        startMetronome();
    }
}

function getBPMSteps() {
    const data = getData();
    return data.settings.bpmSteps || 3;
}

function switchTab(tabName) {
    currentTab = tabName;

    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('nav-btn--active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('nav-btn--active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('tab-content--active');
    });
    document.getElementById(tabName).classList.add('tab-content--active');

    // Stop any running timers when switching tabs
    if (tabName !== 'practice') {
        Object.values(exerciseTimers).forEach(timer => clearInterval(timer));
        exerciseTimers = {};
    }

    if (tabName === 'progress') {
        drawProgressChart();
    }
}

function loadCurrentDate() {
    const today = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    document.getElementById('current-date').textContent = 
        today.toLocaleDateString('he-IL', options);
}

function loadDailyTip() {
    const today = new Date();
    const tipIndex = today.getDate() % tips.length;
    document.getElementById('daily-tip-text').textContent = tips[tipIndex];
}

function loadExercises() {
    const data = getData();
    const exercisesList = document.getElementById('exercises-list');
    exercisesList.innerHTML = '';

    data.exercises.forEach(exercise => {
        const exerciseCard = createExerciseCard(exercise);
        exercisesList.appendChild(exerciseCard);
    });
}

function createExerciseCard(exercise) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.innerHTML = `
        <div class="exercise-header">
            <div>
                <div class="exercise-name">${exercise.name}</div>
                <div class="exercise-duration">${exercise.duration} דקות</div>
            </div>
            <button class="btn-icon" onclick="editExercise(${exercise.id})" title="עריכה">
                ✏️
            </button>
        </div>
        <div class="exercise-description">${exercise.description}</div>
        <div class="exercise-controls">
            <button class="btn btn--primary" onclick="startExercise(${exercise.id})">
                התחל תרגיל
            </button>
            <button class="btn btn--neutral" onclick="stopExercise(${exercise.id})" style="display: none;" id="stop-${exercise.id}">
                עצור
            </button>
        </div>
        <div class="exercise-timer" style="display: none;" id="timer-${exercise.id}">
            <div class="timer-display" id="timer-display-${exercise.id}">
                ${formatTime(exercise.duration * 60)}
            </div>
            <div style="color: #666;">BPM נוכחי: ${exercise.currentBPM}</div>
        </div>
        <div class="exercise-notes" style="display: none;" id="notes-${exercise.id}">
            <label>הערות:</label>
            <textarea placeholder="רשום הערות על התרגיל..." id="notes-text-${exercise.id}"></textarea>
            <div class="bpm-input">
                <label>BPM שהושג:</label>
                <input type="number" min="40" max="200" value="${exercise.currentBPM}" id="bpm-achieved-${exercise.id}">
            </div>
            <button class="btn btn--success" onclick="saveExerciseResult(${exercise.id})">
                שמור תוצאות
            </button>
        </div>
    `;
    return card;
}

function startExercise(exerciseId) {
    const data = getData();
    const exercise = data.exercises.find(ex => ex.id === exerciseId);

    if (!exercise) return;

    // Set BPM to exercise current BPM
    currentBPM = exercise.currentBPM;
    document.getElementById('bpm-value').textContent = currentBPM;

    // Start metronome automatically
    if (!metronomeIsRunning) {
        startMetronome();
    }

    // Start timer
    exerciseDurations[exerciseId] = exercise.duration * 60; // seconds
    exerciseStartTimes[exerciseId] = Date.now();

    const timerDisplay = document.getElementById(`timer-display-${exerciseId}`);
    const timerSection = document.getElementById(`timer-${exerciseId}`);
    const stopBtn = document.getElementById(`stop-${exerciseId}`);
    const startBtn = document.querySelector(`[onclick="startExercise(${exerciseId})"]`);

    timerSection.style.display = 'block';
    stopBtn.style.display = 'inline-block';
    startBtn.style.display = 'none';

    exerciseTimers[exerciseId] = setInterval(() => {
        const elapsed = Math.floor((Date.now() - exerciseStartTimes[exerciseId]) / 1000);
        const remaining = Math.max(0, exerciseDurations[exerciseId] - elapsed);

        timerDisplay.textContent = formatTime(remaining);

        if (remaining === 0) {
            finishExercise(exerciseId);
        }
    }, 1000);

    currentExercise = exerciseId;
}

function stopExercise(exerciseId) {
    if (exerciseTimers[exerciseId]) {
        clearInterval(exerciseTimers[exerciseId]);
        delete exerciseTimers[exerciseId];
    }

    const timerSection = document.getElementById(`timer-${exerciseId}`);
    const stopBtn = document.getElementById(`stop-${exerciseId}`);
    const startBtn = document.querySelector(`[onclick="startExercise(${exerciseId})"]`);

    timerSection.style.display = 'none';
    stopBtn.style.display = 'none';
    startBtn.style.display = 'inline-block';

    currentExercise = null;
}

function finishExercise(exerciseId) {
    stopExercise(exerciseId);

    // Show notes section
    const notesSection = document.getElementById(`notes-${exerciseId}`);
    notesSection.style.display = 'block';

    // Show feedback modal
    showFeedbackModal(exerciseId);
}

function showFeedbackModal(exerciseId) {
    currentExercise = exerciseId;
    const modal = document.getElementById('feedback-modal');
    modal.classList.add('show');
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    modal.classList.remove('show');

    const editModal = document.getElementById('edit-modal');
    editModal.classList.remove('show');

    currentExercise = null;
    currentEditingExercise = null;
}

function handleFeedback(feedback) {
    if (!currentExercise) return;

    const data = getData();
    const exercise = data.exercises.find(ex => ex.id === currentExercise);

    if (feedback === 'good' && data.settings.autoIncreaseBPM) {
        exercise.currentBPM = Math.min(exercise.targetBPM, exercise.currentBPM + 3);
    } else if (feedback === 'hard') {
        exercise.currentBPM = Math.max(40, exercise.currentBPM - 2);
    }

    saveData(data);
    loadExercises();
    closeFeedbackModal();
}

function saveExerciseResult(exerciseId) {
    const notes = document.getElementById(`notes-text-${exerciseId}`).value;
    const bpmAchieved = parseInt(document.getElementById(`bpm-achieved-${exerciseId}`).value);

    const data = getData();
    const exercise = data.exercises.find(ex => ex.id === exerciseId);

    const session = {
        id: Date.now(),
        exerciseId: exerciseId,
        exerciseName: exercise.name,
        date: new Date().toISOString(),
        bpmAchieved: bpmAchieved,
        duration: exercise.duration,
        notes: notes
    };

    data.sessions.push(session);
    saveData(data);

    // Hide notes section
    const notesSection = document.getElementById(`notes-${exerciseId}`);
    notesSection.style.display = 'none';

    // Reset UI
    const startBtn = document.querySelector(`[onclick="startExercise(${exerciseId})"]`);
    startBtn.style.display = 'inline-block';

    alert('תוצאות נשמרו בהצלחה!');
}

function editExercise(exerciseId) {
    const data = getData();
    const exercise = data.exercises.find(ex => ex.id === exerciseId);

    if (!exercise) return;

    currentEditingExercise = exerciseId;

    document.getElementById('edit-name').value = exercise.name;
    document.getElementById('edit-duration').value = exercise.duration;
    document.getElementById('edit-description').value = exercise.description;

    const modal = document.getElementById('edit-modal');
    modal.classList.add('show');
}

function saveExerciseEdit() {
    if (!currentEditingExercise) return;

    const data = getData();
    const exercise = data.exercises.find(ex => ex.id === currentEditingExercise);

    exercise.name = document.getElementById('edit-name').value;
    exercise.duration = parseInt(document.getElementById('edit-duration').value);
    exercise.description = document.getElementById('edit-description').value;

    saveData(data);
    loadExercises();
    closeFeedbackModal();
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function loadProgress() {
    const data = getData();
    const statsContainer = document.getElementById('progress-stats');

    const totalSessions = data.sessions.length;
    const avgBPM = totalSessions > 0 ? 
        Math.round(data.sessions.reduce((sum, s) => sum + s.bpmAchieved, 0) / totalSessions) : 0;
    const totalMinutes = data.sessions.reduce((sum, s) => sum + s.duration, 0);

    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${totalSessions}</div>
            <div class="stat-label">סך אימונים</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${avgBPM}</div>
            <div class="stat-label">BPM ממוצע</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${totalMinutes}</div>
            <div class="stat-label">דקות אימון</div>
        </div>
    `;
}

function drawProgressChart() {
    const canvas = document.getElementById('progress-chart');
    const ctx = canvas.getContext('2d');
    const data = getData();

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (data.sessions.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('אין נתונים להצגה', canvas.width/2, canvas.height/2);
        return;
    }

    // Group sessions by exercise
    const exerciseData = {};
    data.sessions.forEach(session => {
        if (!exerciseData[session.exerciseName]) {
            exerciseData[session.exerciseName] = [];
        }
        exerciseData[session.exerciseName].push({
            date: new Date(session.date),
            bpm: session.bpmAchieved
        });
    });

    // Simple line chart
    const colors = ['#32808d', '#e67e44', '#4caf50', '#ff9800'];
    let colorIndex = 0;

    Object.keys(exerciseData).forEach(exerciseName => {
        const sessions = exerciseData[exerciseName].sort((a, b) => a.date - b.date);

        ctx.strokeStyle = colors[colorIndex % colors.length];
        ctx.lineWidth = 2;
        ctx.beginPath();

        sessions.forEach((session, index) => {
            const x = (index / (sessions.length - 1)) * (canvas.width - 40) + 20;
            const y = canvas.height - 40 - ((session.bpm - 40) / 160) * (canvas.height - 80);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
        colorIndex++;
    });

    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 20);
    ctx.lineTo(canvas.width - 20, canvas.height - 20);
    ctx.moveTo(20, 20);
    ctx.lineTo(20, canvas.height - 20);
    ctx.stroke();
}

function loadSettings() {
    const data = getData();
    const settings = data.settings;

    document.getElementById('metronome-sound').value = settings.metronomeSound || 'click';
    document.getElementById('volume-slider').value = settings.volume || 70;
    document.getElementById('volume-value').textContent = (settings.volume || 70) + '%';
    document.getElementById('bpm-steps').value = settings.bpmSteps || 3;
    document.getElementById('auto-increase-bpm').checked = settings.autoIncreaseBPM !== false;
    document.getElementById('vibrate-mode').checked = settings.vibrateMode || false;
}

function updateSound() {
    const sound = document.getElementById('metronome-sound').value;
    const data = getData();
    data.settings.metronomeSound = sound;
    saveData(data);

    // Recreate sound based on selection
    createClickSound();
}

function updateVolume() {
    const volume = document.getElementById('volume-slider').value;
    document.getElementById('volume-value').textContent = volume + '%';

    if (gainNode) {
        gainNode.gain.value = volume / 100;
    }

    const data = getData();
    data.settings.volume = parseInt(volume);
    saveData(data);
}

function saveBPMSteps() {
    const steps = document.getElementById('bpm-steps').value;
    const data = getData();
    data.settings.bpmSteps = parseInt(steps);
    saveData(data);
}

function saveSettings() {
    const data = getData();
    data.settings.autoIncreaseBPM = document.getElementById('auto-increase-bpm').checked;
    data.settings.vibrateMode = document.getElementById('vibrate-mode').checked;
    saveData(data);
}

function resetAllData() {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו לא ניתנת לביטול.')) {
        localStorage.removeItem('accordionData');
        location.reload();
    }
}

// Utility functions
function getData() {
    return JSON.parse(localStorage.getItem('accordionData')) || {
        exercises: defaultExercises,
        sessions: [],
        settings: {}
    };
}

function saveData(data) {
    localStorage.setItem('accordionData', JSON.stringify(data));
}

function getSettings() {
    const data = getData();
    return data.settings || {};
}

// Handle audio context resume (required for mobile browsers)
document.addEventListener('touchstart', function() {
    if (metronomeAudioContext && metronomeAudioContext.state === 'suspended') {
        metronomeAudioContext.resume();
    }
}, { once: true });

// Handle page visibility change (stop metronome when page is hidden)
document.addEventListener('visibilitychange', function() {
    if (document.hidden && metronomeIsRunning) {
        stopMetronome();
    }
});

// Handle browser back button
window.addEventListener('popstate', function(e) {
    if (metronomeIsRunning) {
        stopMetronome();
    }
});