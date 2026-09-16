const express = require('express');
const cors = require('cors');
const db = require('./db');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const documentRoutes = require('./routes/documents');
const leaveRequestRoutes = require('./routes/leaveRequests');
const paymentRoutes = require('./routes/payments');
const exitRecordRoutes = require('./routes/exitRecords');
const auditLogRoutes = require('./routes/auditLog');
const vacancyRoutes = require('./routes/vacancies');
const applicationRoutes = require('./routes/applications');
const messageRoutes = require('./routes/messages');
const departmentRoutes = require('./routes/departments');
const positionRoutes = require('./routes/positions');
const app = express();
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.get('/', (req, res) => {
  res.send('EFMS backend is running');
});
app.get('/test-db', async (req, res) => {
  try {
    const [results] = await db.query('SELECT 1 + 1 AS result');
    res.json({ message: 'Database connected successfully', result: results[0].result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});
app.use('/', authRoutes);
app.use('/employees', employeeRoutes);
app.use('/documents', documentRoutes);
app.use('/leave-requests', leaveRequestRoutes);
app.use('/payments', paymentRoutes);
app.use('/exit-records', exitRecordRoutes);
app.use('/audit-log', auditLogRoutes);
app.use('/vacancies', vacancyRoutes);
app.use('/applications', applicationRoutes);
app.use('/messages', messageRoutes);
app.use('/departments', departmentRoutes);
app.use('/positions', positionRoutes);
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});