# Online Exam Platform

A production-level online examination system with separate admin and student panels, built with MERN stack.

## 📋 Features

### 👨‍💼 Admin Panel
- Dashboard with analytics and charts
- Group management (CRUD operations)
- Student management with bulk upload via Excel
- Exam creation (manual/Excel upload)
- Question bank management
- Exam assignment to students/groups
- Live exam monitoring
- Result management and publishing
- Report generation (CSV/Excel)
- Anti-cheating violation tracking

### 🧑‍🎓 Student Panel
- Secure login
- Dashboard with exam status (Upcoming/Live/Completed)
- Full-screen exam environment
- Auto-save answers
- Timer with warnings
- Anti-cheating detection (tab switch, full-screen exit)
- View results when published

### 🔒 Security Features
- JWT authentication
- Role-based access control
- Password hashing with bcrypt
- Rate limiting
- Input validation
- XSS protection
- MongoDB sanitization

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** with **Mongoose** - Database
- **JWT** - Authentication
- **Multer** - File upload
- **XLSX** - Excel processing
- **Helmet** - Security
- **Express Rate Limit** - Rate limiting

### Frontend
- **React** with **Vite** - UI framework
- **Bootstrap 5** - Styling
- **React Router** - Routing
- **Redux Toolkit** - State management
- **Axios** - HTTP client
- **Chart.js** - Analytics charts
- **React Hot Toast** - Notifications
