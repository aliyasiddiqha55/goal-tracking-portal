# Goal Tracking Portal
A web-based portal to help organizations set, track, and review employee goals across the year.
Built for the 48-hour hackathon challeng
## Live Links
- App: https://goal-tracking-portal-five.vercel.app
- API: https://goal-tracking-portal-backend.onrender.com
- Code: https://github.com/aliyasiddiqha55/goal-tracking-portal
## Login Details

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@portal.com | password |
| Manager | manager@portal.com | password |
| Employee | employee@portal.com | password |
## What It Does
Employees create their yearly goals and submit them to their manager for approval. Once approved, goals are locked and tracked every quarter. Managers review progress and add comments. Admins manage the org setup and can see reports.
### Phase 1 - Goal Setting
- Employees fill a goal sheet with thrust area, target, weightage and UoM
- Total weightage must add up to 100%, minimum 10% per goal, max 8 goals
- Manager can approve, edit, or send back for rework
- Approved goals get locked
- Managers can push shared goals to the whole team

### Phase 2 - Quarterly Tracking
- Employees log actual achievement every quarter
- System calculates score based on UoM type
- Manager reviews planned vs actual and adds comments
- Portal enforces quarterly windows - cant update outside the window

### Admin Features
- Manage departments, thrust areas, users
- Configure goal cycles and dates
- View audit logs of all changes
- Download CSV achievement report
- Unlock goals if needed

### Bonus Features
- Email alerts when goals are submitted, approved or returned
- Analytics page with charts showing team performance
- Escalation reminders for overdue submissions
## Tech Stack
- Frontend: React.js hosted on Vercel
- Backend: Node.js with Express hosted on Render
- Database: PostgreSQL on Neon.tech
- Auth: JWT based role login
All hosted on free tiers - total cost is zero.
## How to Run Locally
git clone https://github.com/aliyasiddiqha55/goal-tracking-portal
cd backend && npm install && node server.js
cd frontend && npm install && npm start

Add a .env file in backend with your DATABASE_URL and JWT_SECRET.
