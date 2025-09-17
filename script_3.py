# יצירת אייקונים פשוטים בפורמט SVG לPWA
icon_192_svg = '''<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" rx="24" fill="#32808d"/>
  <text x="96" y="120" text-anchor="middle" font-size="80" fill="white">🪗</text>
  <text x="96" y="160" text-anchor="middle" font-size="16" fill="white" font-family="Arial">אקורדיון</text>
</svg>'''

icon_512_svg = '''<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="64" fill="#32808d"/>
  <text x="256" y="320" text-anchor="middle" font-size="200" fill="white">🪗</text>
  <text x="256" y="420" text-anchor="middle" font-size="48" fill="white" font-family="Arial">אקורדיון</text>
</svg>'''

with open('icon-192.svg', 'w', encoding='utf-8') as f:
    f.write(icon_192_svg)

with open('icon-512.svg', 'w', encoding='utf-8') as f:
    f.write(icon_512_svg)

print("נוצרו אייקונים SVG לPWA (icon-192.svg, icon-512.svg)")

# יצירת קובץ README עם הוראות התקנה
readme_content = '''# אפליקציית אימון אקורדיון מתקדמת

אפליקציית PWA מקצועית לאימון אקורדיון עם מטרונום מובנה ומעקב התקדמות.

## תכונות עיקריות

- 🎵 מטרונום מתקדם עם אפשרויות סאונד
- ⏱️ טיימר אימון אוטומטי
- 📈 מעקב התקדמות וגרפים
- ✏️ עריכת תרגילים מותאמת אישית
- 🚀 PWA - ניתן להתקנה כאפליקציה
- 📱 מותאם למובייל ולדסקטופ
- 🔄 עבודה אופליין

## התקנה

### הרצה ישירה
1. פתח את הקבצים בדפדפן
2. האפליקציה תעבוד מיד

### התקנה כPWA
1. פתח בדפדפן Chrome/Safari
2. לחץ על "הוסף למסך הבית"
3. האפליקציה תופיע כאייקון

### העלאה לשרת (GitHub Pages)
1. העלה את כל הקבצים ל-repository ב-GitHub
2. הפעל GitHub Pages
3. גש לכתובת: username.github.io/repository-name

## קבצים נדרשים
- index.html
- style.css
- app.js
- manifest.json
- sw.js
- icon-192.svg
- icon-512.svg

## שימוש

1. **אימון יומי**: בחר תרגיל ולחץ "התחל תרגיל"
2. **מטרונום**: יפעל אוטומטי או ידני
3. **משוב**: בסיום תרגיל תקבל אפשרות לדרג
4. **עריכה**: לחץ על ✏️ לעריכת תרגיל
5. **הגדרות**: התאם סאונד, עוצמה ועוד

## תמיכה טכנית
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

הפיתוח: אסיסטנט AI עבור אימון אקורדיון מקצועי
'''

with open('README.md', 'w', encoding='utf-8') as f:
    f.write(readme_content)

print("נוצר קובץ README.md עם הוראות מפורטות")

print("\\n=== הקבצים המלאים מוכנים להעלאה ===")
print("כל הקבצים נוצרו בהצלחה ומוכנים להעלאה ל-GitHub או Netlify")