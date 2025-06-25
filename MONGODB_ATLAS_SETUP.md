# MongoDB Atlas Setup Guide
**Date:** June 24, 2025  
**Project:** MSA Educational Platform  
**Purpose:** Configure MongoDB Atlas for Mini-Games System  

---

## 🚀 Quick Setup Steps

### **1. Create MongoDB Atlas Account**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account or log in
3. Create a new project called "MSA Educational Platform"

### **2. Create Database Cluster**
1. Click "Build a Database"
2. Choose **FREE** tier (M0 Sandbox)
3. Select your preferred region (closest to you)
4. Name your cluster: `msa-cluster`
5. Click "Create Cluster"

### **3. Create Database User**
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `msa-user`
5. Password: Generate a secure password (save it!)
6. Database User Privileges: "Atlas admin"
7. Click "Add User"

### **4. Configure Network Access**
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow access from anywhere" (0.0.0.0/0)
   - For production, restrict to specific IPs
4. Click "Confirm"

### **5. Get Connection String**
1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "4.1 or later"
5. Copy the connection string

---

## 🔧 Configure Your Application

### **Update .env File**
Replace the MongoDB URI in your `backend/.env` file:

```env
# Replace with your actual connection string
MONGODB_URI=mongodb+srv://msa-user:<password>@msa-cluster.xxxxx.mongodb.net/kaizenverse_games?retryWrites=true&w=majority
```

**Important:** Replace `<password>` with your actual database user password!

---

## 📊 Database Structure

Your MongoDB Atlas database will automatically create these collections:

### **Collections for Mini-Games System:**
- `gamecontents` - Static and AI-generated questions
- `gameanalytics` - Detailed session analytics
- `aicontentqueues` - AI content generation requests (future)

### **Sample Connection String Examples:**
```javascript
// Development
MONGODB_URI=mongodb+srv://msa-user:mypassword123@msa-cluster.abcde.mongodb.net/kaizenverse_games?retryWrites=true&w=majority

// Production (with IP restrictions)
MONGODB_URI=mongodb+srv://prod-user:securepassword@prod-cluster.xyz123.mongodb.net/kaizenverse_games_prod?retryWrites=true&w=majority
```

---

## 🔍 Troubleshooting

### **Common Issues:**

**1. Connection Refused Error**
```
Error: connect ECONNREFUSED ::1:27017
```
**Solution:** Make sure MONGODB_URI is set in your .env file

**2. Authentication Failed**
```
Error: Authentication failed
```
**Solution:** Check username/password in connection string

**3. Network Timeout**
```
Error: Server selection timed out
```
**Solution:** Check Network Access settings in Atlas

**4. Database Not Found**
```
Warning: Database doesn't exist
```
**Solution:** MongoDB will create the database automatically on first write

---

## 🧪 Test Your Connection

Run this command to test your MongoDB connection:

```bash
cd backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ MongoDB Atlas connected successfully!'); process.exit(0); })
  .catch(err => { console.error('❌ Connection failed:', err.message); process.exit(1); });
"
```

---

## 🔐 Security Best Practices

### **For Production:**
1. **Restrict IP Access:** Don't use 0.0.0.0/0 in production
2. **Strong Passwords:** Use complex passwords for database users
3. **Least Privilege:** Give users only necessary permissions
4. **Environment Variables:** Never commit connection strings to git
5. **SSL/TLS:** Always use encrypted connections (default in Atlas)

### **Environment Variables Security:**
```env
# ✅ Good - using environment variables
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# ❌ Bad - hardcoded in code
const mongoURI = "mongodb+srv://user:pass@cluster.mongodb.net/db"
```

---

## 📈 Monitoring

### **Atlas Monitoring Features:**
- **Real-time Metrics:** Monitor connections, operations, memory usage
- **Performance Advisor:** Get suggestions for query optimization
- **Profiler:** Analyze slow operations
- **Alerts:** Set up email/SMS alerts for issues

### **Application Monitoring:**
The improved MongoDB connection includes:
- Connection event logging
- Automatic reconnection handling
- Detailed error reporting
- Connection pool management

---

## 🎯 Next Steps

After setting up MongoDB Atlas:

1. **Test Connection:** Run the test command above
2. **Initialize Data:** The system will auto-create collections on first use
3. **Monitor Performance:** Check Atlas dashboard for connection health
4. **Scale as Needed:** Upgrade cluster tier as user base grows

---

## 📞 Support

**MongoDB Atlas Support:**
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB University](https://university.mongodb.com/)
- [Community Forums](https://developer.mongodb.com/community/forums/)

**Application-Specific Issues:**
- Check `backend/config/mongodb.js` for connection logs
- Verify `.env` file configuration
- Review server startup logs for MongoDB connection status

---

**Setup Complete!** 🎉  
*Your MongoDB Atlas database is now ready for the Mini-Games system.*
