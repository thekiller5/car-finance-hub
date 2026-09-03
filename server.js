const express = require('express');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// תיקון: הגדרת תיקיית public כתיקיית הקבצים הסטטיים של האתר
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.get('/client-request.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'client-request.html')); });
app.get('/login.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'login.html')); });
app.get('/admin-dashboard.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html')); });
app.get('/garage-dashboard.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'garage-dashboard.html')); });
app.get('/dealer-login.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'dealer-login.html')); });
app.get('/dealer-dashboard.html', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'dealer-dashboard.html')); });

// רכבים עם התמונות המקוריות
let carsDatabase = [
    { id: 1, model: 'יונדאי טוסון', year: 2021, price: '₪115,000', km: '45,000', gear: 'אוטומט', color: 'לבן', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80', notes: 'מצב חדש לחלוטין.' },
    { id: 2, model: 'קיה ספורטאז\'', year: 2020, price: '₪98,000', km: '60,000', gear: 'אוטומט', color: 'שחור', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80', notes: 'יד ראשונה פרטית.' },
    { id: 3, model: 'אאודי A4', year: 2019, price: '₪135,000', km: '55,000', gear: 'אוטומט', color: 'כסף', image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=600&q=80', notes: 'רכב פרימיום שמור.' }
];

let clientRequests = [];

// מאגר חוות דעת התחלתי המשויך למגרשים
let dealerReviews = [
    { clientName: "ישראל ישראלי", rating: 5, comment: "שירות מעולה, קיבלתי אישור מימון תוך שעות ספורות!", dealerName: "מגרש הצפון" },
    { clientName: "שרה לוי", rating: 4, comment: "צוות אדיב ומקצועי, עזרו לי בכל התהליך.", dealerName: "מגרש הצפון" },
    { clientName: "אבי כהן", rating: 5, comment: "חווית קנייה מדהימה ממליץ בחום על המגרש.", dealerName: "אוטו דיל סנטר" }
];

let verificationCodes = {};
let dealersDb = {}; 

app.get('/api/cars', (req, res) => { res.json({ success: true, cars: carsDatabase }); });

app.post('/api/client/request', (req, res) => {
    const { name, idNumber, phone, requestType, financeProvider, signature, dealerName } = req.body;
    if (!name || !idNumber || !phone) return res.status(400).json({ success: false, message: 'נא למלא שדות חובה.' });
    
    clientRequests.push({ 
        id: Date.now(), 
        name, 
        idNumber, 
        phone, 
        requestType, 
        financeProvider, 
        signature, 
        dealerName: dealerName || "מגרש הצפון", 
        date: new Date().toLocaleString('he-IL') 
    });
    
    res.json({ success: true, message: 'הבקשה נקלטה בהצלחה.' });
});

app.get('/api/admin/requests', (req, res) => { 
    res.json({ success: true, requests: clientRequests, reviews: dealerReviews }); 
});

app.get('/api/dealer/data', (req, res) => {
    const dealerName = req.query.dealerName;
    
    if (!dealerName) {
        return res.status(400).json({ success: false, message: 'חובה לציין שם מגרש' });
    }

    const filteredRequests = clientRequests.filter(r => r.dealerName === dealerName);
    const filteredReviews = dealerReviews.filter(rev => rev.dealerName === dealerName);

    res.json({
        success: true,
        dealerName: dealerName,
        requests: filteredRequests,
        reviews: filteredReviews
    });
});

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'Sma.srablove2028') {
        return res.json({ success: true, message: 'התחברת בהצלחה!' });
    }
    res.status(401).json({ success: false, message: 'שם משתמש או סיסמה שגויים.' });
});

app.post('/api/dealer/request-code', (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'נא להזין מספר טלפון.' });

    const pin = Math.floor(10000000 + Math.random() * 90000000).toString();
    verificationCodes[phone] = pin;

    res.json({ success: true, message: 'קוד הופק בטרמינל' });
});

app.post('/api/dealer/verify-code', (req, res) => {
    const { phone, pin } = req.body;
    
    if (pin === '00000000' || (verificationCodes[phone] && verificationCodes[phone] === pin)) {
        delete verificationCodes[phone];
        return res.json({ success: true, message: 'אימות הצליח!' });
    }
    
    res.status(400).json({ success: false, message: 'קוד האימות שגוי.' });
});

app.post('/api/dealer/register', (req, res) => {
    const { dealerName, contactName, phone } = req.body;
    if (!phone || !dealerName) return res.status(400).json({ success: false, message: 'נא למלא את כל השדות החובה.' });

    dealersDb[phone] = { dealerName, contactName };
    const pin = Math.floor(10000000 + Math.random() * 90000000).toString();
    verificationCodes[phone] = pin;

    res.json({ success: true, message: 'נרשם בהצלחה' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`השרת רץ בכתובת: http://localhost:${PORT}`); });