# יצירת הקוד המעודכן של האפליקציה עם כל השיפורים
html_content = '''<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>מעקב אימון אקורדיון מתקדם</title>
    <link rel="stylesheet" href="style.css">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#32808d">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="אקורדיון">
</head>
<body>
    <div class="app">
        <!-- Header -->
        <header class="header">
            <h1>🪗 אימון אקורדיון מתקדם</h1>
        </header>

        <!-- Navigation -->
        <nav class="nav">
            <button class="nav-btn nav-btn--active" data-tab="practice">
                <span class="nav-icon">📝</span>
                אימון יומי
            </button>
            <button class="nav-btn" data-tab="progress">
                <span class="nav-icon">📈</span>
                התקדמות
            </button>
            <button class="nav-btn" data-tab="settings">
                <span class="nav-icon">⚙️</span>
                הגדרות
            </button>
        </nav>

        <!-- Main Content -->
        <main class="main">
            <!-- Daily Practice Tab -->
            <div id="practice" class="tab-content tab-content--active">
                <div class="section">
                    <h2>אימון יומי</h2>
                    <p class="section-subtitle">תאריך: <span id="current-date"></span></p>
                    
                    <!-- Metronome Section -->
                    <div class="metronome-section">
                        <h3>מטרונום</h3>
                        <div class="metronome-controls">
                            <div class="bpm-display">
                                <span id="bpm-value">120</span>
                                <small>BPM</small>
                            </div>
                            <div class="metronome-buttons">
                                <button id="bpm-minus" class="bpm-btn">-3</button>
                                <button id="metronome-toggle" class="metronome-toggle">▶️</button>
                                <button id="bpm-plus" class="bpm-btn">+3</button>
                            </div>
                            <div class="tempo-controls" style="display: none;" id="tempo-controls">
                                <button id="slower-btn" class="tempo-btn slower">איטי לי</button>
                                <button id="faster-btn" class="tempo-btn faster">מהר לי</button>
                            </div>
                        </div>
                        <div class="metronome-visual" id="metronome-visual">
                            <div class="beat-indicator"></div>
                        </div>
                    </div>

                    <!-- Exercises List -->
                    <div class="exercises-list" id="exercises-list">
                        <!-- Exercises will be dynamically populated -->
                    </div>

                    <div class="daily-tip">
                        <h3>💡 טיפ היום</h3>
                        <p id="daily-tip-text"></p>
                    </div>
                </div>
            </div>

            <!-- Progress Tab -->
            <div id="progress" class="tab-content">
                <div class="section">
                    <h2>מעקב התקדמות</h2>
                    <div class="progress-stats" id="progress-stats">
                        <!-- Progress stats will be populated -->
                    </div>
                    <canvas id="progress-chart" width="300" height="200"></canvas>
                </div>
            </div>

            <!-- Settings Tab -->
            <div id="settings" class="tab-content">
                <div class="section">
                    <h2>הגדרות</h2>
                    
                    <div class="setting-group">
                        <h3>הגדרות מטרונום</h3>
                        <label>צליל מטרונום:</label>
                        <select id="metronome-sound">
                            <option value="click">קליק</option>
                            <option value="beep">ביפ</option>
                            <option value="tick">טיק</option>
                            <option value="wood">עץ</option>
                        </select>
                        
                        <label>עוצמת קול:</label>
                        <input type="range" id="volume-slider" min="0" max="100" value="70">
                        <span id="volume-value">70%</span>
                        
                        <label>שלבי BPM:</label>
                        <select id="bpm-steps">
                            <option value="1">1 BPM</option>
                            <option value="3" selected>3 BPM</option>
                            <option value="5">5 BPM</option>
                            <option value="10">10 BPM</option>
                        </select>
                    </div>

                    <div class="setting-group">
                        <h3>הגדרות כלליות</h3>
                        <label>
                            <input type="checkbox" id="auto-increase-bpm">
                            העלאה אוטומטית של BPM
                        </label>
                        <label>
                            <input type="checkbox" id="vibrate-mode">
                            רטט במקום צליל
                        </label>
                    </div>

                    <button id="reset-data" class="btn btn--danger">איפוס נתונים</button>
                </div>
            </div>
        </main>
    </div>

    <!-- Feedback Modal -->
    <div id="feedback-modal" class="modal">
        <div class="modal-content">
            <h3>איך היה התרגיל?</h3>
            <p>האם המהירות הייתה מתאימה?</p>
            <div class="modal-buttons">
                <button id="feedback-good" class="btn btn--success">כן, היה טוב</button>
                <button id="feedback-ok" class="btn btn--neutral">בסדר</button>
                <button id="feedback-hard" class="btn btn--warning">היה קשה</button>
            </div>
        </div>
    </div>

    <!-- Edit Exercise Modal -->
    <div id="edit-modal" class="modal">
        <div class="modal-content">
            <h3>עריכת תרגיל</h3>
            <label>שם התרגיל:</label>
            <input type="text" id="edit-name" placeholder="שם התרגיל">
            <label>זמן (דקות):</label>
            <input type="number" id="edit-duration" min="1" max="60">
            <label>תיאור:</label>
            <textarea id="edit-description" rows="3"></textarea>
            <div class="modal-buttons">
                <button id="save-exercise" class="btn btn--success">שמור</button>
                <button id="cancel-edit" class="btn btn--neutral">בטל</button>
            </div>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>'''

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("נוצר index.html מעודכן")

# יצירת CSS מעודכן
css_content = '''/* Global Styles */
:root {
    --primary: #32808d;
    --primary-light: #4a9fb0;
    --primary-dark: #26626c;
    --secondary: #f8fffe;
    --accent: #e67e44;
    --success: #4caf50;
    --warning: #ff9800;
    --danger: #f44336;
    --text: #333;
    --text-light: #666;
    --bg: #fafafa;
    --white: #ffffff;
    --border: #e0e0e0;
    --shadow: 0 2px 10px rgba(0,0,0,0.1);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
}

.app {
    max-width: 500px;
    margin: 0 auto;
    min-height: 100vh;
    background: var(--white);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
}

/* Header */
.header {
    background: linear-gradient(135deg, var(--primary), var(--primary-light));
    color: var(--white);
    padding: 1rem;
    text-align: center;
    position: sticky;
    top: 0;
    z-index: 100;
}

.header h1 {
    font-size: 1.5rem;
    font-weight: 600;
}

/* Navigation */
.nav {
    display: flex;
    background: var(--white);
    border-bottom: 2px solid var(--border);
    position: sticky;
    top: 4rem;
    z-index: 90;
}

.nav-btn {
    flex: 1;
    padding: 1rem 0.5rem;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 0.9rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
}

.nav-btn:hover {
    background: var(--secondary);
}

.nav-btn--active {
    background: var(--primary);
    color: var(--white);
}

.nav-icon {
    font-size: 1.2rem;
}

/* Main Content */
.main {
    flex: 1;
    padding: 1rem;
}

.tab-content {
    display: none;
}

.tab-content--active {
    display: block;
}

.section {
    margin-bottom: 2rem;
}

.section h2 {
    margin-bottom: 1rem;
    color: var(--primary);
    font-size: 1.5rem;
}

.section-subtitle {
    color: var(--text-light);
    margin-bottom: 1.5rem;
}

/* Metronome Section */
.metronome-section {
    background: var(--white);
    border: 2px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: var(--shadow);
}

.metronome-section h3 {
    margin-bottom: 1rem;
    color: var(--primary);
    text-align: center;
}

.metronome-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.bpm-display {
    text-align: center;
    font-size: 3rem;
    font-weight: bold;
    color: var(--primary);
    line-height: 1;
}

.bpm-display small {
    display: block;
    font-size: 1rem;
    font-weight: normal;
    color: var(--text-light);
}

.metronome-buttons {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.bpm-btn {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 2px solid var(--primary);
    background: var(--white);
    color: var(--primary);
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
}

.bpm-btn:hover {
    background: var(--primary);
    color: var(--white);
}

.bpm-btn:active {
    transform: scale(0.95);
}

.metronome-toggle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: none;
    background: var(--primary);
    color: var(--white);
    font-size: 2rem;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: var(--shadow);
}

.metronome-toggle:hover {
    background: var(--primary-dark);
    transform: scale(1.05);
}

.metronome-toggle.playing {
    background: var(--danger);
}

.tempo-controls {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
}

.tempo-btn {
    padding: 0.75rem 1.5rem;
    border: 2px solid var(--accent);
    background: var(--white);
    color: var(--accent);
    border-radius: 25px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
}

.tempo-btn:hover {
    background: var(--accent);
    color: var(--white);
}

.tempo-btn.slower {
    border-color: var(--warning);
    color: var(--warning);
}

.tempo-btn.slower:hover {
    background: var(--warning);
    color: var(--white);
}

.metronome-visual {
    margin-top: 1rem;
    text-align: center;
}

.beat-indicator {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--border);
    margin: 0 auto;
    transition: all 0.1s;
}

.beat-indicator.active {
    background: var(--primary);
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(50, 128, 141, 0.5);
}

/* Exercises */
.exercises-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.exercise-card {
    background: var(--white);
    border: 2px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
    box-shadow: var(--shadow);
    transition: all 0.2s;
}

.exercise-card:hover {
    border-color: var(--primary);
}

.exercise-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.exercise-name {
    font-weight: 600;
    font-size: 1.1rem;
    color: var(--text);
}

.exercise-duration {
    color: var(--text-light);
    font-size: 0.9rem;
}

.exercise-description {
    color: var(--text-light);
    margin-bottom: 1rem;
    font-size: 0.9rem;
}

.exercise-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 0.9rem;
}

.btn--primary {
    background: var(--primary);
    color: var(--white);
}

.btn--primary:hover {
    background: var(--primary-dark);
}

.btn--success {
    background: var(--success);
    color: var(--white);
}

.btn--success:hover {
    background: #45a049;
}

.btn--warning {
    background: var(--warning);
    color: var(--white);
}

.btn--warning:hover {
    background: #e68900;
}

.btn--danger {
    background: var(--danger);
    color: var(--white);
}

.btn--danger:hover {
    background: #d32f2f;
}

.btn--neutral {
    background: var(--border);
    color: var(--text);
}

.btn--neutral:hover {
    background: #d0d0d0;
}

.btn-icon {
    padding: 0.5rem;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid var(--text-light);
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-icon:hover {
    border-color: var(--primary);
    background: var(--primary);
    color: var(--white);
}

.exercise-timer {
    background: var(--secondary);
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    margin-top: 1rem;
}

.timer-display {
    font-size: 2rem;
    font-weight: bold;
    color: var(--primary);
    margin-bottom: 0.5rem;
}

.exercise-notes {
    margin-top: 1rem;
}

.exercise-notes textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    resize: vertical;
    min-height: 60px;
    font-family: inherit;
}

.exercise-notes textarea:focus {
    outline: none;
    border-color: var(--primary);
}

.bpm-input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.bpm-input input {
    width: 80px;
    padding: 0.5rem;
    border: 2px solid var(--border);
    border-radius: 6px;
    text-align: center;
    font-weight: bold;
}

.bpm-input input:focus {
    outline: none;
    border-color: var(--primary);
}

/* Daily Tip */
.daily-tip {
    background: linear-gradient(135deg, var(--accent), #ff8c42);
    color: var(--white);
    padding: 1.5rem;
    border-radius: 12px;
    text-align: center;
}

.daily-tip h3 {
    margin-bottom: 0.5rem;
}

/* Progress */
.progress-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: var(--white);
    padding: 1.5rem;
    border-radius: 12px;
    text-align: center;
    box-shadow: var(--shadow);
    border: 2px solid var(--border);
}

.stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: var(--primary);
}

.stat-label {
    color: var(--text-light);
    margin-top: 0.5rem;
}

#progress-chart {
    width: 100%;
    height: auto;
    border: 2px solid var(--border);
    border-radius: 12px;
    background: var(--white);
}

/* Settings */
.setting-group {
    background: var(--white);
    padding: 1.5rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    box-shadow: var(--shadow);
    border: 2px solid var(--border);
}

.setting-group h3 {
    margin-bottom: 1rem;
    color: var(--primary);
}

.setting-group label {
    display: block;
    margin-bottom: 1rem;
    font-weight: 600;
    color: var(--text);
}

.setting-group input,
.setting-group select {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 1rem;
    margin-top: 0.5rem;
}

.setting-group input[type="checkbox"] {
    width: auto;
    margin-right: 0.5rem;
    transform: scale(1.2);
}

.setting-group input[type="range"] {
    width: 70%;
    margin-right: 1rem;
}

#volume-value {
    font-weight: bold;
    color: var(--primary);
}

/* Modal */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    justify-content: center;
    align-items: center;
    padding: 1rem;
}

.modal.show {
    display: flex;
}

.modal-content {
    background: var(--white);
    padding: 2rem;
    border-radius: 12px;
    max-width: 400px;
    width: 100%;
    text-align: center;
    box-shadow: var(--shadow);
}

.modal-content h3 {
    margin-bottom: 1rem;
    color: var(--primary);
}

.modal-content p {
    margin-bottom: 1.5rem;
    color: var(--text-light);
}

.modal-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

.modal-content label {
    display: block;
    text-align: right;
    margin-bottom: 1rem;
    font-weight: 600;
}

.modal-content input,
.modal-content textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    margin-top: 0.25rem;
}

.modal-content input:focus,
.modal-content textarea:focus {
    outline: none;
    border-color: var(--primary);
}

/* Mobile Responsive */
@media (max-width: 480px) {
    .header h1 {
        font-size: 1.3rem;
    }
    
    .nav-btn {
        font-size: 0.8rem;
        padding: 0.75rem 0.25rem;
    }
    
    .nav-icon {
        font-size: 1rem;
    }
    
    .main {
        padding: 0.75rem;
    }
    
    .bpm-display {
        font-size: 2.5rem;
    }
    
    .metronome-toggle {
        width: 70px;
        height: 70px;
        font-size: 1.5rem;
    }
    
    .modal-buttons {
        flex-direction: column;
    }
    
    .btn {
        padding: 0.75rem 1rem;
        font-size: 0.85rem;
    }
}

/* Firefox specific fixes */
@-moz-document url-prefix() {
    .metronome-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .btn {
        -moz-appearance: none;
    }
    
    input[type="range"] {
        -moz-appearance: none;
        background: var(--border);
        height: 8px;
        border-radius: 4px;
    }
    
    input[type="range"]::-moz-range-thumb {
        background: var(--primary);
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        cursor: pointer;
    }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* High contrast mode */
@media (prefers-contrast: high) {
    :root {
        --border: #000;
        --text-light: #333;
    }
    
    .btn {
        border: 2px solid currentColor;
    }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    :root {
        --bg: #121212;
        --white: #1e1e1e;
        --text: #e0e0e0;
        --text-light: #b0b0b0;
        --border: #333;
    }
}'''

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css_content)

print("נוצר style.css מעודכן")