// App State
let currentTab = 'practice';
let metronomeInterval = null;
let metronomeAudioContext = null;
let metronomeIsRunning = false;
let currentBPM = 120;

let exerciseTimer = null;
let exerciseStartTime = null;
let exerciseDuration = 0;
let isTimerRunning = false;
let currentExercise = null;

// Default data from JSON
const defaultExercises = [
    {
        name: "תרגילי אצבעות",
        duration: 8,
        description: "סולמות ותרגילי זריזות"
    },
    {
        name: "חילופי אקורדים", 
        duration: 8,
        description: "מעבר בין אקורדים שונים"
    },
    {
        name: "קואורדינציה",
        duration: 7,
        description: "תיאום ידיים ובלגן"
    },
    {
        name: "רפרטואר",
        duration: 7,
        description: "יצירות שלמות או קטעים"
    }
];

const tips = [
    "התחל איטי והעלה מהירות בהדרגה",
    "שמור על דיוק לפני מהירות", 
    "תרגל עם מטרונום תמיד",
    "רשום הערות על קשיים טכניים"
];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadCurrentDate();
    loadDailyTip();
    loadExercises();
    loadProgress();
    loadSettings();
});

function initializeApp() {
    // Initialize localStorage if empty
    if (!localStorage.getItem('accordionData')) {
        const initialData = {
            exercises: defaultExercises,
            sessions: [],
            settings: {
                defaultBPM: 120
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

    // Metronome
    document.getElementById('metronome-toggle').addEventListener('click', toggleMetronome);
    document.getElementById('bpm-plus').addEventListener('click', () => adjustBPM(5));
    document.getElementById('bpm-minus').addEventListener('click', () => adjustBPM(-5));

    // Exercise modal - Fixed event listeners
    document.getElementById('close-modal').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeExerciseModal();
    });
    
    document.getElementById('overlay').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeExerciseModal();
    });
    
    document.getElementById('start-timer').addEventListener('click', startTimer);
    document.getElementById('pause-timer').addEventListener('click', pauseTimer);
    document.getElementById('reset-timer').addEventListener('click', resetTimer);
    document.getElementById('complete-exercise').addEventListener('click', completeExercise);

    // Settings
    document.getElementById('add-exercise-btn').addEventListener('click', addNewExercise);
    document.getElementById('reset-data-btn').addEventListener('click', resetAllData);
    document.getElementById('export-data-btn').addEventListener('click', exportData);
    
    // Keyboard escape for modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeExerciseModal();
        }
    });
}

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('nav-btn--active', btn.dataset.tab === tabName);
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('tab-content--active', content.id === tabName);
    });

    // Load tab-specific content
    if (tabName === 'progress') {
        loadProgress();
    }
}

function loadCurrentDate() {
    const today = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    };
    document.getElementById('current-date').textContent = 
        today.toLocaleDateString('he-IL', options);
}

function loadDailyTip() {
    const today = new Date().getDate();
    const tipIndex = today % tips.length;
    document.getElementById('daily-tip-text').textContent = tips[tipIndex];
}

function loadExercises() {
    const data = JSON.parse(localStorage.getItem('accordionData'));
    const exercisesList = document.getElementById('exercises-list');
    const today = new Date().toDateString();
    
    exercisesList.innerHTML = '';
    
    data.exercises.forEach((exercise, index) => {
        const todaySession = data.sessions.find(s => 
            s.date === today && s.exerciseIndex === index
        );
        
        const exerciseCard = document.createElement('div');
        exerciseCard.className = 'exercise-card';
        exerciseCard.innerHTML = `
            <div class="exercise-header">
                <h3 class="exercise-name">${exercise.name}</h3>
                <div class="exercise-duration">${exercise.duration} דקות</div>
            </div>
            <p class="exercise-description">${exercise.description}</p>
            <div class="exercise-controls">
                <span class="exercise-status ${todaySession ? 'status--success' : 'status--info'}">
                    ${todaySession ? '✓ הושלם' : 'ממתין'}
                </span>
                <button class="btn btn--primary" onclick="startExercise(${index})">
                    ${todaySession ? 'תרגל שוב' : 'התחל תרגיל'}
                </button>
            </div>
        `;
        exercisesList.appendChild(exerciseCard);
    });
}

function startExercise(exerciseIndex) {
    const data = JSON.parse(localStorage.getItem('accordionData'));
    currentExercise = {
        ...data.exercises[exerciseIndex],
        index: exerciseIndex
    };
    
    document.getElementById('modal-exercise-name').textContent = currentExercise.name;
    exerciseDuration = currentExercise.duration * 60; // Convert to seconds
    updateTimerDisplay();
    
    // Reset form
    document.getElementById('achieved-bpm').value = '';
    document.getElementById('exercise-notes').value = '';
    
    showExerciseModal();
}

function showExerciseModal() {
    const modal = document.getElementById('exercise-modal');
    const overlay = document.getElementById('overlay');
    
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    
    // Ensure modal is visible
    modal.style.display = 'flex';
    overlay.style.display = 'block';
}

function closeExerciseModal() {
    const modal = document.getElementById('exercise-modal');
    const overlay = document.getElementById('overlay');
    
    // Stop timer if running
    if (isTimerRunning) {
        pauseTimer();
    }
    
    // Reset timer
    resetTimer();
    
    // Hide modal
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    
    // Ensure modal is hidden
    modal.style.display = 'none';
    overlay.style.display = 'none';
    
    // Clear current exercise
    currentExercise = null;
}

function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        exerciseStartTime = Date.now() - (currentExercise.duration * 60 - exerciseDuration) * 1000;
        
        exerciseTimer = setInterval(() => {
            exerciseDuration--;
            updateTimerDisplay();
            
            if (exerciseDuration <= 0) {
                pauseTimer();
                // Timer completed - could add sound notification here
                alert('⏰ זמן התרגיל הסתיים!');
            }
        }, 1000);
        
        document.getElementById('start-timer').textContent = 'פועל...';
        document.getElementById('start-timer').disabled = true;
    }
}

function pauseTimer() {
    if (isTimerRunning) {
        isTimerRunning = false;
        clearInterval(exerciseTimer);
        document.getElementById('start-timer').textContent = 'המשך';
        document.getElementById('start-timer').disabled = false;
    }
}

function resetTimer() {
    isTimerRunning = false;
    clearInterval(exerciseTimer);
    if (currentExercise) {
        exerciseDuration = currentExercise.duration * 60;
    }
    updateTimerDisplay();
    document.getElementById('start-timer').textContent = 'התחל';
    document.getElementById('start-timer').disabled = false;
}

function updateTimerDisplay() {
    const minutes = Math.floor(exerciseDuration / 60);
    const seconds = exerciseDuration % 60;
    document.getElementById('timer-minutes').textContent = 
        minutes.toString().padStart(2, '0');
    document.getElementById('timer-seconds').textContent = 
        seconds.toString().padStart(2, '0');
}

function completeExercise() {
    const achievedBPM = document.getElementById('achieved-bpm').value;
    const notes = document.getElementById('exercise-notes').value;
    
    if (!currentExercise) {
        alert('שגיאה: לא נבחר תרגיל');
        return;
    }
    
    const session = {
        date: new Date().toDateString(),
        exerciseIndex: currentExercise.index,
        exerciseName: currentExercise.name,
        duration: currentExercise.duration,
        achievedBPM: achievedBPM ? parseInt(achievedBPM) : null,
        notes: notes,
        timestamp: Date.now()
    };
    
    const data = JSON.parse(localStorage.getItem('accordionData'));
    
    // Remove existing session for today if exists
    data.sessions = data.sessions.filter(s => 
        !(s.date === session.date && s.exerciseIndex === session.exerciseIndex)
    );
    
    data.sessions.push(session);
    localStorage.setItem('accordionData', JSON.stringify(data));
    
    // Close modal first
    closeExerciseModal();
    
    // Then update UI
    loadExercises();
    
    // Show success message
    setTimeout(() => {
        alert('תרגיל הושלם בהצלחה! 🎉');
    }, 100);
}

// Metronome functionality
function initAudioContext() {
    if (!metronomeAudioContext) {
        metronomeAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playMetronomeClick() {
    if (!metronomeAudioContext) return;
    
    const oscillator = metronomeAudioContext.createOscillator();
    const gainNode = metronomeAudioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(metronomeAudioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.3, metronomeAudioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, metronomeAudioContext.currentTime + 0.1);
    
    oscillator.start(metronomeAudioContext.currentTime);
    oscillator.stop(metronomeAudioContext.currentTime + 0.1);
    
    // Visual feedback
    const visual = document.getElementById('metronome-visual');
    visual.classList.add('active');
    setTimeout(() => visual.classList.remove('active'), 100);
}

function toggleMetronome() {
    if (metronomeIsRunning) {
        stopMetronome();
    } else {
        startMetronome();
    }
}

function startMetronome() {
    initAudioContext();
    metronomeIsRunning = true;
    
    const interval = 60000 / currentBPM; // Convert BPM to milliseconds
    metronomeInterval = setInterval(playMetronomeClick, interval);
    
    document.getElementById('metronome-text').textContent = 'עצור';
    document.getElementById('metronome-toggle').classList.add('btn--secondary');
    document.getElementById('metronome-toggle').classList.remove('btn--primary');
}

function stopMetronome() {
    metronomeIsRunning = false;
    clearInterval(metronomeInterval);
    
    document.getElementById('metronome-text').textContent = 'הפעל';
    document.getElementById('metronome-toggle').classList.add('btn--primary');
    document.getElementById('metronome-toggle').classList.remove('btn--secondary');
}

function adjustBPM(change) {
    currentBPM = Math.max(40, Math.min(300, currentBPM + change));
    document.getElementById('bpm-value').textContent = currentBPM;
    
    if (metronomeIsRunning) {
        stopMetronome();
        startMetronome();
    }
}

// Progress tracking
function loadProgress() {
    const data = JSON.parse(localStorage.getItem('accordionData'));
    
    // Update stats
    document.getElementById('total-sessions').textContent = data.sessions.length;
    
    // Weekly completion
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const thisWeekSessions = data.sessions.filter(s => {
        const sessionDate = new Date(s.date);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
    });
    
    const expectedSessions = data.exercises.length * 7; // Exercises per day * 7 days
    const completionRate = Math.round((thisWeekSessions.length / expectedSessions) * 100);
    document.getElementById('weekly-completion').textContent = `${completionRate}%`;
    
    // Average BPM
    const bpmSessions = data.sessions.filter(s => s.achievedBPM);
    const avgBPM = bpmSessions.length > 0 
        ? Math.round(bpmSessions.reduce((sum, s) => sum + s.achievedBPM, 0) / bpmSessions.length)
        : 0;
    document.getElementById('avg-bpm').textContent = avgBPM;
    
    // Load chart
    loadProgressChart();
    
    // Load sessions log
    loadSessionsLog();
}

function loadProgressChart() {
    const canvas = document.getElementById('progress-chart');
    const ctx = canvas.getContext('2d');
    
    // Clear any existing chart
    if (window.progressChart) {
        window.progressChart.destroy();
    }
    
    const data = JSON.parse(localStorage.getItem('accordionData'));
    const bpmSessions = data.sessions
        .filter(s => s.achievedBPM)
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-10); // Last 10 sessions
    
    const labels = bpmSessions.map(s => new Date(s.date).toLocaleDateString('he-IL'));
    const chartData = bpmSessions.map(s => s.achievedBPM);
    
    window.progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'BPM',
                data: chartData,
                borderColor: '#1FB8CD',
                backgroundColor: 'rgba(31, 184, 205, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(94, 82, 64, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(94, 82, 64, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function loadSessionsLog() {
    const data = JSON.parse(localStorage.getItem('accordionData'));
    const sessionsList = document.getElementById('sessions-list');
    
    const recentSessions = data.sessions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
    
    sessionsList.innerHTML = '';
    
    if (recentSessions.length === 0) {
        sessionsList.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center;">אין אימונים רשומים</p>';
        return;
    }
    
    recentSessions.forEach(session => {
        const sessionItem = document.createElement('div');
        sessionItem.className = 'session-item';
        sessionItem.innerHTML = `
            <div>
                <div class="session-date">${new Date(session.date).toLocaleDateString('he-IL')}</div>
                <div class="session-details">${session.exerciseName}</div>
            </div>
            <div style="text-align: left;">
                ${session.achievedBPM ? `<div class="session-details">${session.achievedBPM} BPM</div>` : ''}
                <div class="session-details">${session.duration} דקות</div>
            </div>
        `;
        sessionsList.appendChild(sessionItem);
    });
}

// Settings
function loadSettings() {
    const data = JSON.parse(localStorage.getItem('accordionData'));
    const exercisesSettings = document.getElementById('exercises-settings');
    
    exercisesSettings.innerHTML = '';
    
    data.exercises.forEach((exercise, index) => {
        const exerciseSetting = document.createElement('div');
        exerciseSetting.className = 'exercise-setting';
        exerciseSetting.innerHTML = `
            <div class="exercise-setting-info">
                <div class="exercise-setting-name">${exercise.name}</div>
                <div class="exercise-setting-duration">${exercise.duration} דקות</div>
            </div>
            <div class="exercise-setting-controls">
                <input type="number" class="form-control duration-input" 
                       value="${exercise.duration}" min="1" max="60"
                       onchange="updateExerciseDuration(${index}, this.value)">
                <button class="btn btn--outline btn--danger btn--sm" 
                        onclick="removeExercise(${index})">מחק</button>
            </div>
        `;
        exercisesSettings.appendChild(exerciseSetting);
    });
}

function updateExerciseDuration(index, newDuration) {
    const data = JSON.parse(localStorage.getItem('accordionData'));
    data.exercises[index].duration = parseInt(newDuration);
    localStorage.setItem('accordionData', JSON.stringify(data));
    loadExercises();
}

function removeExercise(index) {
    if (confirm('האם אתה בטוח שברצונך למחוק תרגיל זה?')) {
        const data = JSON.parse(localStorage.getItem('accordionData'));
        data.exercises.splice(index, 1);
        localStorage.setItem('accordionData', JSON.stringify(data));
        loadSettings();
        loadExercises();
    }
}

function addNewExercise() {
    const name = document.getElementById('new-exercise-name').value.trim();
    const duration = document.getElementById('new-exercise-duration').value;
    
    if (!name || !duration) {
        alert('נא למלא את כל השדות');
        return;
    }
    
    const data = JSON.parse(localStorage.getItem('accordionData'));
    data.exercises.push({
        name: name,
        duration: parseInt(duration),
        description: 'תרגיל מותאם אישית'
    });
    
    localStorage.setItem('accordionData', JSON.stringify(data));
    
    // Clear form
    document.getElementById('new-exercise-name').value = '';
    document.getElementById('new-exercise-duration').value = '';
    
    loadSettings();
    loadExercises();
    
    alert('תרגיל נוסף בהצלחה!');
}

function exportData() {
    const data = localStorage.getItem('accordionData');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `accordion-practice-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function resetAllData() {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו לא ניתנת לביטול.')) {
        localStorage.removeItem('accordionData');
        initializeApp();
        loadExercises();
        loadProgress();
        loadSettings();
        alert('כל הנתונים נמחקו');
    }
}