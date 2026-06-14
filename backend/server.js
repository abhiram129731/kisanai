const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Force Node to resolve IPv4 first to prevent local IPv6 connection timeouts on Windows.
// Also configure custom DNS servers to bypass broken local router DNS proxies for MongoDB Atlas SRV resolution.
const dns = require('dns');
if (dns.setServers) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

require('dotenv').config({ path: '../.env' }); // Load variables from root .env

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'kisanai_jwt_secret_token_12345';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kisanai';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected successfully to MongoDB: ' + MONGODB_URI))
  .catch(err => {
    console.error('MongoDB database connection failure:', err.message);
    console.log('⚠️ MongoDB is not running or unreachable. KisanAI backend will run in hybrid JSON fallback mode using local file db.json.');
  });

// ==================== DATABASE SCHEMAS & MODELS ====================

// User Schema
const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // Auth identifier (uuid or firebase uid)
  username: { type: String, unique: true, sparse: true }, // Present for local accounts
  email: { type: String, unique: true, sparse: true }, // Optional/sparse to prevent unique index clashes
  passwordHash: { type: String }, // Present only for email/password accounts
  displayName: { type: String, default: 'Farmer' },
  photoURL: { type: String, default: '' },
  phoneNumber: { type: String, default: '' },
  isOnboarded: { type: Boolean, default: false }, // Default to false so new users are forced to onboard
  role: { type: String, enum: ['farmer', 'admin'], default: 'farmer' },
  preferences: {
    language: { type: String, default: 'en' },
    weatherAlerts: { type: Boolean, default: true },
    diseaseAlerts: { type: Boolean, default: true },
    schemeAlerts: { type: Boolean, default: true }
  }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// Farm Schema
const FarmSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true }, // Matches User.uid
  name: { type: String, required: true },
  location: { type: String, required: true },
  crop: { type: String, required: true },
  area: { type: Number, required: true },
  areaHectares: { type: Number },
  areaSqm: { type: Number },
  perimeter: { type: Number },
  soilType: { type: String, required: true },
  irrigationMethod: { type: String, required: true },
  notes: { type: String, default: '' },
  coordinates: [{
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  }],
  timeline: [{
    id: { type: String, required: true },
    date: { type: String, required: true },
    action: { type: String, required: true },
    category: { type: String, required: true }
  }]
}, { timestamps: true });

const Farm = mongoose.model('Farm', FarmSchema);

// Cashbook Entry Schema
const CashEntrySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  farmId: { type: String, index: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  description: { type: String, default: '' }
}, { timestamps: true });

const CashEntry = mongoose.model('CashEntry', CashEntrySchema);

// Disease Report Schema
const DiseaseReportSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  farmId: { type: String },
  date: { type: String, required: true },
  cropType: { type: String, required: true },
  diseaseName: { type: String, required: true },
  confidence: { type: Number, required: true },
  description: { type: String, required: true },
  prevention: { type: String, default: '' },
  treatment: { type: String, default: '' },
  fertilizer: { type: String, default: '' },
  imageUrl: { type: String, default: '' }
}, { timestamps: true });

const DiseaseReport = mongoose.model('DiseaseReport', DiseaseReportSchema);

// Community Post Schema
const CommunityPostSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Author UID
  author: { type: String, required: true },
  authorRole: { type: String, default: 'farmer' },
  authorAvatar: { type: String, default: '' },
  content: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }], // Array of user UIDs who liked
  comments: [{
    id: { type: String, required: true },
    author: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: String, required: true }
  }],
  category: { type: String, default: 'feed' },
  date: { type: String, required: true }
}, { timestamps: true });

const CommunityPost = mongoose.model('CommunityPost', CommunityPostSchema);

// Conversation Schema
const MessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true },
  date: { type: String, required: true }
});

const ConversationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, default: 'New Conversation' },
  messages: [MessageSchema]
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', ConversationSchema);

// Saved Recommendation Schema
const SavedRecommendationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  farmId: { type: String, default: '' },
  farmName: { type: String, default: '' },
  type: { type: String, enum: ['irrigation', 'spray', 'harvest', 'general'], required: true },
  recommendation: { type: String, required: true },
  date: { type: String, required: true }
}, { timestamps: true });

const SavedRecommendation = mongoose.model('SavedRecommendation', SavedRecommendationSchema);

// Contact Inquiry Schema
const ContactInquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  message: { type: String, required: true },
  date: { type: String, required: true }
}, { timestamps: true });

const ContactInquiry = mongoose.model('ContactInquiry', ContactInquirySchema);

// ==================== DATABASE ABSTRACTION LAYER (HYBRID FALLBACK) ====================
const JSON_DB_PATH = path.join(__dirname, 'db.json');

const initJsonDb = () => {
  if (!fs.existsSync(JSON_DB_PATH)) {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify({
      users: [],
      farms: [],
      cashEntries: [],
      diseaseReports: [],
      communityPosts: [],
      conversations: [],
      savedRecommendations: [],
      contactInquiries: []
    }, null, 2));
  }
};

const readJsonDb = () => {
  initJsonDb();
  try {
    return JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf8'));
  } catch (err) {
    return { users: [], farms: [], cashEntries: [], diseaseReports: [], communityPosts: [] };
  }
};

const writeJsonDb = (data) => {
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2));
};

const fetchWithRetry = async (url, options = {}, retries = 3, backoff = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        console.warn(`Fetch to ${url} failed with status ${response.status}. Retrying in ${backoff}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        backoff *= 2;
        continue;
      }
      return response;
    } catch (err) {
      if (i === retries - 1) {
        throw err;
      }
      console.warn(`Fetch to ${url} threw error: ${err.message}. Retrying in ${backoff}ms... (Attempt ${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      backoff *= 2;
    }
  }
};

const getSafeCandidateText = (json) => {
  try {
    return json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (err) {
    return '';
  }
};

const DB = {
  isMongoConnected() {
    return mongoose.connection.readyState === 1;
  },

  async findUserByUid(uid) {
    if (this.isMongoConnected()) {
      try {
        const doc = await User.findOne({ uid });
        return doc ? doc.toObject() : null;
      } catch (err) {
        console.error("MongoDB findUserByUid error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    return data.users.find(u => u.uid === uid) || null;
  },

  async findUserByUsername(username) {
    if (this.isMongoConnected()) {
      try {
        const doc = await User.findOne({ username: username.toLowerCase() });
        return doc ? doc.toObject() : null;
      } catch (err) {
        console.error("MongoDB findUserByUsername error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    return data.users.find(u => u.username && u.username.toLowerCase() === username.toLowerCase()) || null;
  },

  async findUserByEmail(email) {
    if (this.isMongoConnected()) {
      try {
        const doc = await User.findOne({ email: email.toLowerCase() });
        return doc ? doc.toObject() : null;
      } catch (err) {
        console.error("MongoDB findUserByEmail error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    return data.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async saveUser(userObj) {
    if (this.isMongoConnected()) {
      try {
        const doc = await User.findOne({ uid: userObj.uid });
        if (doc) {
          Object.assign(doc, userObj);
          const saved = await doc.save();
          return saved.toObject();
        } else {
          const docNew = new User(userObj);
          const saved = await docNew.save();
          return saved.toObject();
        }
      } catch (err) {
        console.error("MongoDB saveUser error:", err.message);
        throw err;
      }
    }
    const data = readJsonDb();
    
    // Unique constraints check for JSON fallback DB
    if (userObj.username) {
      const dupUser = data.users.find(u => u.uid !== userObj.uid && u.username && u.username.toLowerCase() === userObj.username.toLowerCase());
      if (dupUser) {
        const err = new Error(`E11000 duplicate key error collection: User index: username_1 dup key: { username: "${userObj.username}" }`);
        err.code = 11000;
        err.keyPattern = { username: 1 };
        err.keyValue = { username: userObj.username };
        throw err;
      }
    }
    if (userObj.email) {
      const dupEmail = data.users.find(u => u.uid !== userObj.uid && u.email && u.email.toLowerCase() === userObj.email.toLowerCase());
      if (dupEmail) {
        const err = new Error(`E11000 duplicate key error collection: User index: email_1 dup key: { email: "${userObj.email}" }`);
        err.code = 11000;
        err.keyPattern = { email: 1 };
        err.keyValue = { email: userObj.email };
        throw err;
      }
    }

    const idx = data.users.findIndex(u => u.uid === userObj.uid);
    const updated = {
      ...userObj,
      updatedAt: new Date().toISOString(),
      createdAt: userObj.createdAt || new Date().toISOString()
    };
    if (idx !== -1) {
      data.users[idx] = { ...data.users[idx], ...updated };
    } else {
      data.users.push(updated);
    }
    writeJsonDb(data);
    return updated;
  },

  async getAllFarmers() {
    if (this.isMongoConnected()) {
      try {
        const docs = await User.find({}, 'uid displayName photoURL role preferences.language');
        return docs.map(d => d.toObject());
      } catch (err) {
        console.error("MongoDB getAllFarmers error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    return data.users.map(u => ({
      uid: u.uid,
      displayName: u.displayName,
      photoURL: u.photoURL,
      role: u.role,
      preferences: u.preferences
    }));
  },

  async getAllUsersAdmin() {
    if (this.isMongoConnected()) {
      try {
        const docs = await User.find({}, 'uid username email displayName photoURL phoneNumber role isOnboarded createdAt');
        return docs.map(d => d.toObject());
      } catch (err) {
        console.error("MongoDB getAllUsersAdmin error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    return data.users.map(u => ({
      uid: u.uid,
      username: u.username,
      email: u.email,
      displayName: u.displayName,
      photoURL: u.photoURL,
      phoneNumber: u.phoneNumber,
      role: u.role,
      isOnboarded: u.isOnboarded,
      createdAt: u.createdAt
    }));
  },

  async deleteUser(uid) {
    if (this.isMongoConnected()) {
      try {
        const res = await User.deleteOne({ uid });
        if (res.deletedCount > 0) {
          await Farm.deleteMany({ userId: uid });
          await CashEntry.deleteMany({ userId: uid });
          await DiseaseReport.deleteMany({ userId: uid });
          return true;
        }
        return false;
      } catch (err) {
        console.error("MongoDB deleteUser error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    const initialLen = data.users.length;
    data.users = data.users.filter(u => u.uid !== uid);
    data.farms = data.farms.filter(f => f.userId !== uid);
    data.cashEntries = data.cashEntries.filter(c => c.userId !== uid);
    data.diseaseReports = data.diseaseReports.filter(d => d.userId !== uid);
    writeJsonDb(data);
    return data.users.length < initialLen;
  },

  // Farms
  async getFarms(userId) {
    if (this.isMongoConnected()) {
      try {
        const docs = await Farm.find({ userId });
        return docs.map(d => d.toObject());
      } catch (err) {
        console.error("MongoDB getFarms error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    return data.farms.filter(f => f.userId === userId);
  },

  async findFarmById(id, userId) {
    if (this.isMongoConnected()) {
      try {
        const doc = await Farm.findOne({ _id: id, userId });
        return doc ? doc.toObject() : null;
      } catch (err) {
        console.error("MongoDB findFarmById error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    return data.farms.find(f => f._id === id && f.userId === userId) || null;
  },

  async saveFarm(farmObj) {
    if (this.isMongoConnected()) {
      try {
        if (farmObj._id && mongoose.Types.ObjectId.isValid(farmObj._id)) {
          const doc = await Farm.findOne({ _id: farmObj._id });
          if (doc) {
            Object.assign(doc, farmObj);
            const saved = await doc.save();
            return saved.toObject();
          }
        }
        // If it doesn't exist or doesn't have an ID, create it
        const docNew = new Farm(farmObj);
        const saved = await docNew.save();
        return saved.toObject();
      } catch (err) {
        console.error("MongoDB saveFarm error:", err.message);
        throw err;
      }
    }
    const data = readJsonDb();
    if (!farmObj._id) {
      farmObj._id = 'farm-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    const idx = data.farms.findIndex(f => f._id === farmObj._id);
    const updated = {
      ...farmObj,
      updatedAt: new Date().toISOString(),
      createdAt: farmObj.createdAt || new Date().toISOString()
    };
    if (idx !== -1) {
      data.farms[idx] = { ...data.farms[idx], ...updated };
    } else {
      data.farms.push(updated);
    }
    writeJsonDb(data);
    return updated;
  },

  async deleteFarm(id, userId) {
    if (this.isMongoConnected()) {
      try {
        const res = await Farm.deleteOne({ _id: id, userId });
        return res.deletedCount > 0;
      } catch (err) {
        console.error("MongoDB deleteFarm error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    const initialLen = data.farms.length;
    data.farms = data.farms.filter(f => !(f._id === id && f.userId === userId));
    writeJsonDb(data);
    return data.farms.length < initialLen;
  },

  // Cash Entries
  async getCashEntries(userId) {
    if (this.isMongoConnected()) {
      try {
        const docs = await CashEntry.find({ userId }).sort({ createdAt: -1 });
        return docs.map(d => d.toObject());
      } catch (err) {
        console.error("MongoDB getCashEntries error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    return data.cashEntries
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  },

  async saveCashEntry(entryObj) {
    if (this.isMongoConnected()) {
      try {
        const docNew = new CashEntry(entryObj);
        const saved = await docNew.save();
        return saved.toObject();
      } catch (err) {
        console.error("MongoDB saveCashEntry error:", err.message);
        throw err;
      }
    }
    const data = readJsonDb();
    if (!entryObj._id) {
      entryObj._id = 'cash-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    const updated = {
      ...entryObj,
      _id: entryObj._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.cashEntries.push(updated);
    writeJsonDb(data);
    return updated;
  },

  async deleteCashEntry(id, userId) {
    if (this.isMongoConnected()) {
      try {
        const res = await CashEntry.deleteOne({ _id: id, userId });
        return res.deletedCount > 0;
      } catch (err) {
        console.error("MongoDB deleteCashEntry error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    const initialLen = data.cashEntries.length;
    data.cashEntries = data.cashEntries.filter(c => !(c._id === id && c.userId === userId));
    writeJsonDb(data);
    return data.cashEntries.length < initialLen;
  },

  // Disease reports
  async getDiseaseReports(userId) {
    if (this.isMongoConnected()) {
      try {
        const docs = await DiseaseReport.find({ userId }).sort({ createdAt: -1 });
        return docs.map(d => d.toObject());
      } catch (err) {
        console.error("MongoDB getDiseaseReports error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    return data.diseaseReports
      .filter(d => d.userId === userId)
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  },

  async saveDiseaseReport(reportObj) {
    if (this.isMongoConnected()) {
      try {
        const docNew = new DiseaseReport(reportObj);
        const saved = await docNew.save();
        return saved.toObject();
      } catch (err) {
        console.error("MongoDB saveDiseaseReport error:", err.message);
        throw err;
      }
    }
    const data = readJsonDb();
    if (!reportObj._id) {
      reportObj._id = 'disease-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    const updated = {
      ...reportObj,
      _id: reportObj._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.diseaseReports.push(updated);
    writeJsonDb(data);
    return updated;
  },

  // Community Posts
  async getCommunityPosts() {
    if (this.isMongoConnected()) {
      try {
        const docs = await CommunityPost.find().sort({ createdAt: -1 });
        return docs.map(d => d.toObject());
      } catch (err) {
        console.error("MongoDB getCommunityPosts error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    return data.communityPosts.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  },

  async findPostById(id) {
    if (this.isMongoConnected()) {
      try {
        const doc = await CommunityPost.findById(id);
        return doc ? doc.toObject() : null;
      } catch (err) {
        console.error("MongoDB findPostById error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    return data.communityPosts.find(p => p._id === id) || null;
  },

  async saveCommunityPost(postObj) {
    if (this.isMongoConnected()) {
      try {
        if (postObj._id && mongoose.Types.ObjectId.isValid(postObj._id)) {
          const doc = await CommunityPost.findById(postObj._id);
          if (doc) {
            Object.assign(doc, postObj);
            const saved = await doc.save();
            return saved.toObject();
          }
        }
        const docNew = new CommunityPost(postObj);
        const saved = await docNew.save();
        return saved.toObject();
      } catch (err) {
        console.error("MongoDB saveCommunityPost error:", err.message);
        throw err;
      }
    }
    const data = readJsonDb();
    if (!postObj._id) {
      postObj._id = 'post-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    const idx = data.communityPosts.findIndex(p => p._id === postObj._id);
    const updated = {
      likedBy: [],
      comments: [],
      likes: 0,
      ...postObj,
      updatedAt: new Date().toISOString(),
      createdAt: postObj.createdAt || new Date().toISOString()
    };
    if (idx !== -1) {
      data.communityPosts[idx] = { ...data.communityPosts[idx], ...updated };
    } else {
      data.communityPosts.push(updated);
    }
    writeJsonDb(data);
    return updated;
  },

  async deleteCommunityPost(id) {
    if (this.isMongoConnected()) {
      try {
        const res = await CommunityPost.deleteOne({ _id: id });
        return res.deletedCount > 0;
      } catch (err) {
        console.error("MongoDB deleteCommunityPost error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    const initialLen = data.communityPosts.length;
    data.communityPosts = data.communityPosts.filter(p => p._id !== id);
    writeJsonDb(data);
    return data.communityPosts.length < initialLen;
  },

  // Conversations (Chat History)
  async getConversations(userId) {
    if (this.isMongoConnected()) {
      try {
        const docs = await Conversation.find({ userId }).sort({ updatedAt: -1 });
        return docs.map(d => d.toObject());
      } catch (err) {
        console.error("MongoDB getConversations error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    if (!data.conversations) data.conversations = [];
    return data.conversations
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  },

  async findConversationById(id) {
    if (this.isMongoConnected()) {
      try {
        const doc = await Conversation.findById(id);
        return doc ? doc.toObject() : null;
      } catch (err) {
        console.error("MongoDB findConversationById error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    if (!data.conversations) data.conversations = [];
    return data.conversations.find(c => c._id === id) || null;
  },

  async saveConversation(convObj) {
    if (this.isMongoConnected()) {
      try {
        if (convObj._id && mongoose.Types.ObjectId.isValid(convObj._id)) {
          const doc = await Conversation.findById(convObj._id);
          if (doc) {
            Object.assign(doc, convObj);
            const saved = await doc.save();
            return saved.toObject();
          }
        }
        const docNew = new Conversation(convObj);
        const saved = await docNew.save();
        return saved.toObject();
      } catch (err) {
        console.error("MongoDB saveConversation error:", err.message);
        throw err;
      }
    }
    const data = readJsonDb();
    if (!data.conversations) data.conversations = [];
    if (!convObj._id) {
      convObj._id = 'chat-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    const idx = data.conversations.findIndex(c => c._id === convObj._id);
    const updated = {
      messages: [],
      ...convObj,
      _id: convObj._id,
      updatedAt: new Date().toISOString(),
      createdAt: convObj.createdAt || new Date().toISOString()
    };
    if (idx !== -1) {
      data.conversations[idx] = updated;
    } else {
      data.conversations.push(updated);
    }
    writeJsonDb(data);
    return updated;
  },

  async deleteConversation(id) {
    if (this.isMongoConnected()) {
      try {
        const res = await Conversation.deleteOne({ _id: id });
        return res.deletedCount > 0;
      } catch (err) {
        console.error("MongoDB deleteConversation error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    if (!data.conversations) data.conversations = [];
    const initialLen = data.conversations.length;
    data.conversations = data.conversations.filter(c => c._id !== id);
    writeJsonDb(data);
    return data.conversations.length < initialLen;
  },

  // Saved Recommendations
  async getSavedRecommendations(userId) {
    if (this.isMongoConnected()) {
      try {
        const docs = await SavedRecommendation.find({ userId }).sort({ createdAt: -1 });
        return docs.map(d => d.toObject());
      } catch (err) {
        console.error("MongoDB getSavedRecommendations error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    if (!data.savedRecommendations) data.savedRecommendations = [];
    return data.savedRecommendations
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  },

  async saveRecommendation(recObj) {
    if (this.isMongoConnected()) {
      try {
        const docNew = new SavedRecommendation(recObj);
        const saved = await docNew.save();
        return saved.toObject();
      } catch (err) {
        console.error("MongoDB saveRecommendation error:", err.message);
        throw err;
      }
    }
    const data = readJsonDb();
    if (!data.savedRecommendations) data.savedRecommendations = [];
    if (!recObj._id) {
      recObj._id = 'rec-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    const updated = {
      ...recObj,
      _id: recObj._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.savedRecommendations.push(updated);
    writeJsonDb(data);
    return updated;
  },

  async deleteSavedRecommendation(id) {
    if (this.isMongoConnected()) {
      try {
        const res = await SavedRecommendation.deleteOne({ _id: id });
        return res.deletedCount > 0;
      } catch (err) {
        console.error("MongoDB deleteSavedRecommendation error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    if (!data.savedRecommendations) data.savedRecommendations = [];
    const initialLen = data.savedRecommendations.length;
    data.savedRecommendations = data.savedRecommendations.filter(r => r._id !== id);
    writeJsonDb(data);
    return data.savedRecommendations.length < initialLen;
  },

  // Contact Inquiries
  async getContactInquiries() {
    if (this.isMongoConnected()) {
      try {
        const docs = await ContactInquiry.find().sort({ createdAt: -1 });
        return docs.map(d => d.toObject());
      } catch (err) {
        console.error("MongoDB getContactInquiries error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    if (!data.contactInquiries) data.contactInquiries = [];
    return data.contactInquiries.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
  },

  async saveContactInquiry(inquiryObj) {
    if (this.isMongoConnected()) {
      try {
        const docNew = new ContactInquiry(inquiryObj);
        const saved = await docNew.save();
        return saved.toObject();
      } catch (err) {
        console.error("MongoDB saveContactInquiry error:", err.message);
        throw err;
      }
    }
    const data = readJsonDb();
    if (!data.contactInquiries) data.contactInquiries = [];
    if (!inquiryObj._id) {
      inquiryObj._id = 'inq-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    const updated = {
      ...inquiryObj,
      _id: inquiryObj._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.contactInquiries.push(updated);
    writeJsonDb(data);
    return updated;
  },

  async deleteContactInquiry(id) {
    if (this.isMongoConnected()) {
      try {
        const res = await ContactInquiry.deleteOne({ _id: id });
        return res.deletedCount > 0;
      } catch (err) {
        console.error("MongoDB deleteContactInquiry error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    if (!data.contactInquiries) data.contactInquiries = [];
    const initialLen = data.contactInquiries.length;
    data.contactInquiries = data.contactInquiries.filter(i => i._id !== id);
    writeJsonDb(data);
    return data.contactInquiries.length < initialLen;
  }
};

// ==================== AUTH MIDDLEWARE ====================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required.' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = decoded;
    next();
  });
};

const requireAdmin = async (req, res, next) => {
  try {
    const user = await DB.findUserByUid(req.user.uid);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin authorization required.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal validation error.' });
  }
};

// ==================== AUTHENTICATION API ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password, displayName, phone } = req.body;
  if (!username || !password || !displayName) {
    return res.status(400).json({ error: 'Missing registration parameters.' });
  }

  const trimmedUsername = username.trim().toLowerCase();
  const trimmedDisplayName = displayName.trim();

  if (!trimmedUsername || !trimmedDisplayName) {
    return res.status(400).json({ error: 'Username and Display Name cannot be empty.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  try {
    const existing = await DB.findUserByUsername(trimmedUsername);
    if (existing) {
      // Check if password matches to log them in directly
      if (existing.passwordHash) {
        const match = await bcrypt.compare(password, existing.passwordHash);
        if (match) {
          const token = jwt.sign({ uid: existing.uid, role: existing.role }, JWT_SECRET, { expiresIn: '30d' });
          return res.json({
            token,
            user: {
              uid: existing.uid,
              username: existing.username,
              email: existing.email,
              displayName: existing.displayName,
              photoURL: existing.photoURL,
              phoneNumber: existing.phoneNumber,
              role: existing.role,
              isOnboarded: existing.isOnboarded,
              preferences: existing.preferences
            }
          });
        }
      }
      return res.status(400).json({ error: 'Username already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const uid = 'mongo-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    
    // Developer initial admin role grant
    const role = trimmedUsername === 'admin' ? 'admin' : 'farmer';

    const newUser = {
      uid,
      username: trimmedUsername,
      email: null,
      passwordHash,
      displayName: trimmedDisplayName,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedDisplayName)}`,
      phoneNumber: phone || '',
      role,
      isOnboarded: false // New users are NOT onboarded initially
    };

    const saved = await DB.saveUser(newUser);

    const token = jwt.sign({ uid: saved.uid, role: saved.role }, JWT_SECRET, { expiresIn: '30d' });
    
    res.status(201).json({
      token,
      user: {
        uid: saved.uid,
        username: saved.username,
        email: saved.email,
        displayName: saved.displayName,
        photoURL: saved.photoURL,
        phoneNumber: saved.phoneNumber,
        role: saved.role,
        isOnboarded: saved.isOnboarded,
        preferences: saved.preferences
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database save error.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  try {
    const user = await DB.findUserByUsername(username);
    if (!user) {
      return res.status(400).json({ error: 'User does not exist.' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ error: 'Google SSO user. Log in with Google.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(400).json({ error: 'Incorrect credentials.' });
    }

    const token = jwt.sign({ uid: user.uid, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        uid: user.uid,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isOnboarded: user.isOnboarded,
        preferences: user.preferences
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query error.' });
  }
});

// Google Single Sign-In Sync
app.post('/api/auth/google', async (req, res) => {
  const { uid, email, displayName, photoURL } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: 'Invalid Google sign-in packet.' });
  }

  try {
    let user = await DB.findUserByEmail(email);
    
    if (!user) {
      // Create user record linked to MongoDB
      const role = 'farmer';
      const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.-]/g, '');
      let usernameCandidate = baseUsername || 'user';
      let suffix = 1;
      while (true) {
        const existingUsername = await DB.findUserByUsername(usernameCandidate);
        if (!existingUsername) {
          break;
        }
        usernameCandidate = `${baseUsername}${suffix}`;
        suffix++;
      }

      user = {
        uid, // Link Firebase UID to MongoDB identifier
        email: email.toLowerCase(),
        username: usernameCandidate,
        displayName: displayName || 'Farmer',
        photoURL: photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
        role,
        isOnboarded: false // New Google user must complete onboarding (Step 1 to 4)
      };
      user = await DB.saveUser(user);
    } else {
      // Sync Google UID if mismatch
      if (user.uid !== uid) {
        user.uid = uid;
        user = await DB.saveUser(user);
      }
    }

    const token = jwt.sign({ uid: user.uid, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        uid: user.uid,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isOnboarded: user.isOnboarded,
        preferences: user.preferences
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database Google sync error.' });
  }
});

// List all users for community network tab (authenticated users only)
app.get('/api/auth/farmers', authenticateToken, async (req, res) => {
  try {
    const list = await DB.getAllFarmers();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve farmers network.' });
  }
});

// Load Current Profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await DB.findUserByUid(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User profile not found.' });
    
    res.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isOnboarded: user.isOnboarded,
      preferences: user.preferences
    });
  } catch (err) {
    res.status(500).json({ error: 'Server profile retrieval failure.' });
  }
});

// Complete Onboarding & Preferences
app.post('/api/auth/onboarding', authenticateToken, async (req, res) => {
  const { language, alerts } = req.body;
  try {
    const user = await DB.findUserByUid(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User account not found.' });

    user.isOnboarded = true;
    user.preferences = {
      language: language || 'en',
      weatherAlerts: alerts ? alerts.weather : true,
      diseaseAlerts: alerts ? alerts.disease : true,
      schemeAlerts: alerts ? alerts.schemes : true
    };

    const saved = await DB.saveUser(user);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete onboarding.' });
  }
});

// Toggle Role (called from Profile directly or settings updates)
app.post('/api/auth/update-role', authenticateToken, async (req, res) => {
  const { role } = req.body;
  if (!['farmer', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role selection.' });
  }
  try {
    const user = await DB.findUserByUid(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (role === 'admin' && user.username !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Only the admin account can have the admin role.' });
    }

    user.role = role;
    const saved = await DB.saveUser(user);
    res.json({ success: true, role: saved.role });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// ==================== FARMS API ROUTES ====================

// Fetch All Farms
app.get('/api/farms', authenticateToken, async (req, res) => {
  try {
    const list = await DB.getFarms(req.user.uid);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to query farms.' });
  }
});

// Add Farm
app.post('/api/farms', authenticateToken, async (req, res) => {
  const { name, location, crop, area, areaHectares, areaSqm, perimeter, soilType, irrigationMethod, notes, coordinates } = req.body;
  try {
    const newFarm = {
      userId: req.user.uid,
      name,
      location,
      crop,
      area,
      areaHectares: areaHectares || null,
      areaSqm: areaSqm || null,
      perimeter: perimeter || null,
      soilType,
      irrigationMethod,
      notes: notes || '',
      coordinates: coordinates || [],
      timeline: [{
        id: 't-init-' + Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        action: `Farm Profile Created: growing ${crop}`,
        category: 'general'
      }]
    };

    const saved = await DB.saveFarm(newFarm);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create farm.' });
  }
});

// Update Farm (Redraw boundaries/change crop specs)
app.put('/api/farms/:id', authenticateToken, async (req, res) => {
  try {
    const farm = await DB.findFarmById(req.params.id, req.user.uid);
    if (!farm) return res.status(404).json({ error: 'Farm profile not found.' });

    const updates = req.body;
    
    // If timeline event is appended in updates body:
    if (updates.timeline) {
      farm.timeline = updates.timeline;
    } else {
      Object.assign(farm, updates);
    }

    const saved = await DB.saveFarm(farm);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update farm details.' });
  }
});

// Delete Farm Profile
app.post('/api/farms/:id/delete', authenticateToken, async (req, res) => {
  try {
    const success = await DB.deleteFarm(req.params.id, req.user.uid);
    if (!success) return res.status(404).json({ error: 'Farm profile not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete farm profile.' });
  }
});

// ==================== CASHBOOK ENDPOINTS ====================

// Fetch user cash ledger
app.get('/api/cashbook', authenticateToken, async (req, res) => {
  try {
    const list = await DB.getCashEntries(req.user.uid);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ledger logs.' });
  }
});

// Add Cash Entry
app.post('/api/cashbook', authenticateToken, async (req, res) => {
  const { farmId, type, category, amount, date, description } = req.body;
  try {
    const newEntry = {
      userId: req.user.uid,
      farmId,
      type,
      category,
      amount,
      date,
      description: description || ''
    };

    const saved = await DB.saveCashEntry(newEntry);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log financial entry.' });
  }
});

// Delete Cash Entry
app.post('/api/cashbook/:id/delete', authenticateToken, async (req, res) => {
  try {
    const success = await DB.deleteCashEntry(req.params.id, req.user.uid);
    if (!success) return res.status(404).json({ error: 'Entry not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete ledger entry.' });
  }
});

// ==================== DISEASE DETECTION REPORTS ====================

// Fetch user leaf scan archives
app.get('/api/disease', authenticateToken, async (req, res) => {
  try {
    const list = await DB.getDiseaseReports(req.user.uid);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve scanner records.' });
  }
});

// Log Leaf Scan Diagnosis
app.post('/api/disease', authenticateToken, async (req, res) => {
  const { farmId, cropType, diseaseName, confidence, description, prevention, treatment, fertilizer, imageUrl } = req.body;
  try {
    const newReport = {
      userId: req.user.uid,
      farmId,
      date: new Date().toISOString().split('T')[0],
      cropType,
      diseaseName,
      confidence,
      description,
      prevention,
      treatment,
      fertilizer,
      imageUrl: imageUrl || ''
    };

    const saved = await DB.saveDiseaseReport(newReport);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive leaf scan diagnosis.' });
  }
});

// Crop Disease Fallback Knowledge Base
const getLocalDiseaseReport = (cropType, language) => {
  const activeLang = (language === 'te' || language === 'hi') ? language : 'en';
  
  const reports = {
    cotton: {
      diseaseName: 'Leaf Blight (Alternaria macrospora)',
      confidence: 94,
      description: 'Leaf Blight causes small, brown-black circular spots with concentric rings on cotton leaves, leading to premature leaf drop and boll yield reductions.',
      prevention: 'Ensure proper soil drainage. Clear and burn previous crop residues. Choose disease-resistant certified cotton seed varieties.',
      treatment: 'Spray Copper Oxychloride (2.5g/litre of water) or Mancozeb (2g/litre). Repeat after 12-14 days if spreading persists.',
      fertilizer: 'Apply potash fertilizer to improve resistance. Avoid excessive nitrogen applications that increase dense vegetative canopy.'
    },
    paddy: {
      diseaseName: 'Rice Blast (Magnaporthe oryzae)',
      confidence: 96,
      description: 'Rice Blast affects leaves (producing spindle-shaped lesions with grey centers), nodes, and panicles. It can lead to complete yield failure if uncontrolled.',
      prevention: 'Avoid excessive nitrogen fertilizers. Maintain consistent water levels in the paddy fields. Seed treatment with Tricyclazole before planting.',
      treatment: 'Spray Tricyclazole (0.6g/litre) or Carbendazim (1g/litre) at the first appearance of leaf lesions.',
      fertilizer: 'Split nitrogen application into 3 or 4 doses rather than a large single dose. Ensure adequate potash nourishment.'
    },
    maize: {
      diseaseName: 'Turcicum Leaf Blight (Exserohilum turcicum)',
      confidence: 91,
      description: 'Causes large, long, elliptical, grayish-green or light brown lesions on leaves. Typically starts on lower leaves and progresses upwards.',
      prevention: 'Practice crop rotation with legumes. Deep ploughing to bury crop residues. Sow resistant hybrids.',
      treatment: 'Spray Mancozeb (2.5g/litre) or Zineb (2g/litre) immediately upon leaf spot appearance.',
      fertilizer: 'Ensure balanced fertilization. Zinc application (10kg Zinc Sulphate/acre) increases plant vigor and resistance.'
    }
  };

  const key = cropType.toLowerCase();
  const activeReport = reports[key] || reports.cotton;
  
  if (activeLang === 'te') {
    return {
      diseaseName: activeReport.diseaseName,
      confidence: activeReport.confidence,
      description: `పంట ఆకులపై నల్లటి మచ్చలు ఏర్పడి రాలిపోతాయి. ${activeReport.description}`,
      prevention: `నీరు నిల్వ ఉండకుండా చూసుకోవాలి. ${activeReport.prevention}`,
      treatment: `కాపర్ ఆక్సిక్లోరైడ్ పిచికారీ చేయండి. ${activeReport.treatment}`,
      fertilizer: `పోటాష్ వేయడం వల్ల పంట నిరోధక శక్తి పెరుగుతుంది. ${activeReport.fertilizer}`
    };
  }
  
  if (activeLang === 'hi') {
    return {
      diseaseName: activeReport.diseaseName,
      confidence: activeReport.confidence,
      description: `पत्तियों पर धब्बे पड़ना और फसल का सूखना। ${activeReport.description}`,
      prevention: `खेत में जल निकास दुरुस्त रखें। ${activeReport.prevention}`,
      treatment: `कॉपर ऑक्सीक्लोराइड का छिड़काव करें। ${activeReport.treatment}`,
      fertilizer: `पोटाश की उचित मात्रा दें। ${activeReport.fertilizer}`
    };
  }

  return activeReport;
};

const getLanguageName = (lang) => {
  switch (lang) {
    case 'te': return 'Telugu';
    case 'hi': return 'Hindi';
    case 'gu': return 'Gujarati';
    case 'mr': return 'Marathi';
    case 'ta': return 'Tamil';
    case 'kn': return 'Kannada';
    case 'bn': return 'Bengali';
    case 'pa': return 'Punjabi';
    case 'ml': return 'Malayalam';
    default: return 'English';
  }
};

// Analyze Crop Disease (Secure backend Gemini endpoint)
app.post('/api/disease/analyze', authenticateToken, async (req, res) => {
  const { image, cropType, language } = req.body;
  if (!image) return res.status(400).json({ error: 'Image data is required.' });
  const activeCrop = cropType || 'Cotton';
  const activeLang = language || 'en';

  const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || '';
  const isKeyValid = GEMINI_API_KEY.startsWith('AIzaSy') || GEMINI_API_KEY.startsWith('AQ');

  if (!GEMINI_API_KEY || !isKeyValid) {
    return res.json(getLocalDiseaseReport(activeCrop, activeLang));
  }

  try {
    const rawData = image.split(',')[1] || image;
    let geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestPacket = {
      contents: [
        {
          parts: [
            {
              text: `Analyze this crop leaf image for the crop type "${activeCrop}". Identify the crop disease, provide a confidence score, a description, prevention tips, specific treatment methods (including organic and chemical treatments, specific medicine names, and exact dosage ratios), and fertilizer recommendations. Return the response strictly as a JSON object with keys: diseaseName, confidence (number between 50-100), description, prevention, treatment, fertilizer. Respond in ${getLanguageName(activeLang)}.`
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: rawData
              }
            }
          ]
        }
      ]
    };

    let response = await fetchWithRetry(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPacket)
    });

    if (!response.ok && response.status === 404) {
      geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      response = await fetchWithRetry(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPacket)
      });
    }

    if (!response.ok) {
      throw new Error(`Gemini status ${response.status}`);
    }

    const json = await response.json();
    const text = getSafeCandidateText(json);
    if (!text) {
      throw new Error("Empty content returned from Gemini API");
    }
    
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : JSON.parse(text);

    // Normalize potential nested objects to strings to prevent frontend React render crashes
    if (parsed.treatment && typeof parsed.treatment === 'object') {
      if (parsed.treatment.organic || parsed.treatment.chemical) {
        parsed.treatment = `${parsed.treatment.organic || ''}\n${parsed.treatment.chemical || ''}`.trim();
      } else {
        parsed.treatment = JSON.stringify(parsed.treatment);
      }
    }
    if (parsed.prevention && typeof parsed.prevention === 'object') {
      parsed.prevention = parsed.prevention.organic || parsed.prevention.chemical || JSON.stringify(parsed.prevention);
    }
    if (parsed.fertilizer && typeof parsed.fertilizer === 'object') {
      parsed.fertilizer = JSON.stringify(parsed.fertilizer);
    }
    if (parsed.description && typeof parsed.description === 'object') {
      parsed.description = JSON.stringify(parsed.description);
    }

    res.json(parsed);
  } catch (err) {
    console.warn("Gemini backend leaf analyze error, falling back to local fallback:", err.message);
    res.json(getLocalDiseaseReport(activeCrop, activeLang));
  }
});


// ==================== COMMUNITY FORUM ROUTES ====================

// Get All shared posts (Shared globally, showing real discussions)
app.get('/api/community', authenticateToken, async (req, res) => {
  try {
    const list = await DB.getCommunityPosts();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load community discussion feed.' });
  }
});

// Post a new Community Thread
app.post('/api/community', authenticateToken, async (req, res) => {
  const { content, imageUrl, category } = req.body;
  try {
    const user = await DB.findUserByUid(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User details not found.' });

    const newPost = {
      userId: user.uid,
      author: user.displayName,
      authorRole: user.role,
      authorAvatar: user.photoURL,
      content,
      imageUrl: imageUrl || '',
      category: category || 'feed',
      likes: 0,
      likedBy: [],
      comments: [],
      date: new Date().toISOString()
    };

    const saved = await DB.saveCommunityPost(newPost);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload post.' });
  }
});

// Delete Community Post
app.post('/api/community/:id/delete', authenticateToken, async (req, res) => {
  try {
    // Users can delete their own posts, or administrators can delete any posts
    const post = await DB.findPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    if (post.userId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this post.' });
    }

    await DB.deleteCommunityPost(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete community post.' });
  }
});

// Toggle Post Like
app.post('/api/community/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await DB.findPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const userId = req.user.uid;
    const likedIdx = post.likedBy.indexOf(userId);

    if (likedIdx === -1) {
      post.likedBy.push(userId);
      post.likes = (post.likes || 0) + 1;
    } else {
      post.likedBy.splice(likedIdx, 1);
      post.likes = (post.likes || 0) - 1;
    }

    await DB.saveCommunityPost(post);
    res.json({ success: true, likes: post.likes, likedBy: post.likedBy });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record like state.' });
  }
});

// Add Comment on Post
app.post('/api/community/:id/comment', authenticateToken, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Comment content required.' });

  try {
    const post = await DB.findPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const user = await DB.findUserByUid(req.user.uid);
    const newComment = {
      id: 'comment-' + Math.random().toString(36).substr(2, 9),
      author: user ? user.displayName : 'Farmer',
      content,
      date: new Date().toISOString()
    };

    post.comments.push(newComment);
    await DB.saveCommunityPost(post);
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to append comment.' });
  }
});

// ==================== ADMIN PANEL MANAGEMENT ENDPOINTS ====================

// Retrieve All registered user profiles
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usersList = await DB.getAllUsersAdmin();
    res.json(usersList);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list user accounts.' });
  }
});

// Change user role
app.put('/api/admin/users/:uid/role', authenticateToken, requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'farmer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role selection.' });
  }

  try {
    const user = await DB.findUserByUid(req.params.uid);
    if (!user) return res.status(404).json({ error: 'User accounts not found.' });

    user.role = role;
    const saved = await DB.saveUser(user);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update database role.' });
  }
});

// Delete User Account
app.post('/api/admin/users/:uid/delete', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const success = await DB.deleteUser(req.params.uid);
    if (!success) return res.status(404).json({ error: 'User accounts not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user profile.' });
  }
});

// ==================== AI CHATBOT & HISTORY ENDPOINTS ====================

const LOCAL_BOT_RESPONSES = {
  en: {
    default: "I am analyzing your farm parameters. For optimal growth, ensure regular soil testing every two seasons, maintain appropriate drainage, and apply organic manures. What specific questions do you have today?",
    yellow_leaves: "Yellowing of leaves (chlorosis) in cotton/maize is typically caused by: 1. Nitrogen deficiency (apply 20-25kg Nitrogen/acre). 2. Waterlogging (drain excess water immediately). 3. Fungal infection. Check for soil moisture and apply copper oxychloride if symptoms persist.",
    crop_recommendation: "Based on Karimnagar soils (loam/black cotton): 1. Cotton is excellent for high yields. 2. Maize works well in well-drained sandy loam patches. 3. Paddy is ideal for heavy clay soils with good water storage. Select seeds certified by ANGRAU.",
    fertilizer: "General fertilizer rule: 1. Cotton: Apply 120:60:60 N:P:K kg/hectare. 2. Paddy: Apply 100:60:40 N:P:K kg/hectare. Split Nitrogen application into 3 doses: sowing, tillering, and panicle initiation phases.",
    irrigation: "Irrigation guide: Drip irrigation saves 40% water in cotton and reduces weed growth. For Paddy, maintain 2-5cm standing water in the main field until 15 days before harvest.",
    disease_blight: "Leaf Blight detected. Action Plan: 1. Spray Copper Oxychloride (3g/litre) or Mancozeb (2.5g/litre). 2. Destroy infected crop debris. 3. Maintain wider row spacing to reduce humidity."
  },
  te: {
    default: "నేను మీ పొలం పారామితులను విశ్లేషిస్తున్నాను. సరైన దిగుబడి కోసం ప్రతి రెండు పంటల కాలానికి నేల పరీక్ష చేయించండి, నీటి పారుదల సరిగ్గా ఉంచండి. ఈరోజు మీకు ఎలాంటి సందేహాలు ఉన్నాయి?",
    yellow_leaves: "ఆకులు పసుపు రంగులోకి మారడానికి (క్లోరోసిస్) ప్రధాన కారణాలు: 1. నత్రజని లోపం (ఎకరానికి 20-25 కిలోల యూరియా వేయండి). 2. నిల్వ నీరు (వెంటనే అదనపు నీటిని బయటకు పంపండి). 3. శిలీంధ్ర తెగుళ్లు. నివారణకు కాపర్ ఆక్సిక్లోరైడ్ పిచికారీ చేయండి.",
    crop_recommendation: "కరీంనగర్ నేలల ప్రకారం (నల్ల రేగడి/దుబ్బ నేలలు): 1. పత్తి పంట అత్యధిక దిగుబడికి అనుకూలం. 2. మొక్కజొన్న ఇసుక నేలలలో బాగా పండుతుంది. 3. వరి పంట నల్ల రేగడి నేలలలో అనుకూలం. ANGRAU గుర్తింపు పొందిన విత్తనాలను ఎంచుకోండి.",
    fertilizer: "ఎరువుల యాజమాన్యం: 1. పత్తి: ఎకరానికి 80:40:40 కిలోల N:P:K వేయాలి. 2. వరి: ఎకరానికి 100:60:40 N:P:K వేయాలి. నత్రజనిని మూడు విడతలుగా (నాట్లు వేసేటప్పుడు, దుబ్బు చేసేటప్పుడు, చిరుపొట్ట దశలో) వేయండి.",
    irrigation: "నీటి యాజమాన్యం: పత్తిలో బిందు సేద్యం (డ్రిప్) ద్వారా 40% నీరు ఆదా అవుతుంది. వరి పొలంలో కోతకు 15 రోజుల ముందు వరకు 2-5 సెం.మీ నీరు ఉండేలా చూసుకోండి.",
    disease_blight: "ఆకు మాడు తెగులు (లీఫ్ బ్లైట్) గుర్తించబడింది. నివారణ: 1. కాపర్ ఆక్సిక్లోరైడ్ (లీటరు నీటికి 3 గ్రాములు) లేదా మాంకోజెబ్ (లీటరు నీటికి 2.5 గ్రాములు) కలిపి పిచికారీ చేయండి. 2. తెగులు సోకిన ఆకులను ఏరి తగులబెట్టండి."
  },
  hi: {
    default: "मैं आपके खेत के मापदंडों का विश्लेषण कर रहा हूँ। बेहतर उपज के लिए हर दो सीजन में मिट्टी की जांच कराएं, जल निकासी बनाए रखें और जैविक खाद का प्रयोग करें। आज आपका क्या सवाल है?",
    yellow_leaves: "पत्तियों का पीला पड़ना (क्लोरोसिस) आमतौर पर इन कारणों से होता है: 1. नाइट्रोजन की कमी (20-25 किलोग्राम नाइट्रोजन/एकड़ डालें)। 2. जलभराव (तुरंत अतिरिक्त पानी निकालें)। 3. फंगल संक्रमण। मिट्टी की नमी की जांच करें और तांबा ऑक्सीक्लोराइड का छिड़काव करें।",
    crop_recommendation: "करीमनगर की मिट्टी (दोमट/काली कपास मिट्टी) के लिए: 1. कपास अधिक उपज के लिए बहुत अच्छा है। 2. मक्का जल-निकासी वाली दोमट मिट्टी में अच्छा काम करता है। 3. धान भारी मिट्टी के लिए आदर्श है। सरकारी प्रमाणित बीजों का ही चयन करें।",
    fertilizer: "उर्वरक नियम: 1. कपास: 120:60:60 N:P:K किलोग्राम/हेक्टेयर डालें। 2. धान: 100:60:40 N:P:K किलोग्राम/हेक्टेयर डालें। नाइट्रोजन को तीन खुराकों में विभाजित करें: बुवाई, कल्ले निकलने और बालियां बनते समय।",
    irrigation: "सिंचाई निर्देश: कपास में ड्रिप सिंचाई से 40% पानी की बचत होती है और खरपतवार कम होते हैं। धान के लिए, कटाई से 15 दिन पहले तक खेत में 2-5 सेमी पानी बनाए रखें।",
    disease_blight: "लीफ ब्लाइट (पत्ती झुलसा रोग) का पता चला है। कार्य योजना: 1. कॉपर कॉक्स (3 ग्राम/लीटर) या मैंकोजेब (2.5 ग्राम/लीटर) का छिड़काव करें। 2. संक्रमित पौधों के अवशेषों को नष्ट करें। 3. हवा के संचार के लिए कतारों के बीच उचित दूरी रखें।"
  }
};

function getLocalBotResponse(prompt, language) {
  const normalizedPrompt = prompt.toLowerCase();
  const activeLang = (language === 'te' || language === 'hi') ? language : 'en';

  if (normalizedPrompt.includes('yellow') || normalizedPrompt.includes('పసుపు') || normalizedPrompt.includes('पीला')) {
    return LOCAL_BOT_RESPONSES[activeLang].yellow_leaves;
  }
  if (normalizedPrompt.includes('grow') || normalizedPrompt.includes('crop') || normalizedPrompt.includes('పంట') || normalizedPrompt.includes('फसल')) {
    return LOCAL_BOT_RESPONSES[activeLang].crop_recommendation;
  }
  if (normalizedPrompt.includes('fertilizer') || normalizedPrompt.includes('ఎరువు') || normalizedPrompt.includes('खाद')) {
    return LOCAL_BOT_RESPONSES[activeLang].fertilizer;
  }
  if (normalizedPrompt.includes('water') || normalizedPrompt.includes('irrigation') || normalizedPrompt.includes('నీరు') || normalizedPrompt.includes('सिंचाई')) {
    return LOCAL_BOT_RESPONSES[activeLang].irrigation;
  }
  if (normalizedPrompt.includes('blight') || normalizedPrompt.includes('మాడు') || normalizedPrompt.includes('झुलसा')) {
    return LOCAL_BOT_RESPONSES[activeLang].disease_blight;
  }
  return LOCAL_BOT_RESPONSES[activeLang].default;
}

// Generate Chat Response (Secure Gemini API)
app.post('/api/chat', authenticateToken, async (req, res) => {
  const { prompt, history, language } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

  const activeLang = language || 'en';
  const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || '';
  const systemContext = `You are KisanAI Copilot, an expert agricultural bot advising Indian farmers. Provide clear, direct actionable recommendations. Respond in ${getLanguageName(activeLang)}. Make your response context-aware and focused on agriculture (soils, crops, fertilizers, irrigation, pests). Context prompt: ${prompt}`;

  const isKeyValid = GEMINI_API_KEY.startsWith('AIzaSy') || GEMINI_API_KEY.startsWith('AQ');
  if (!GEMINI_API_KEY || !isKeyValid) {
    const fallbackText = getLocalBotResponse(prompt, activeLang);
    return res.json({ text: fallbackText });
  }

  try {
    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach(h => {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: systemContext }]
    });

    let geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    let response = await fetchWithRetry(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!response.ok && response.status === 404) {
      geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      response = await fetchWithRetry(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });
    }

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const json = await response.json();
    const reply = getSafeCandidateText(json);
    if (!reply) {
      throw new Error("Empty response from Gemini API");
    }
    res.json({ text: reply });
  } catch (err) {
    console.warn("Gemini backend chat error, falling back to local database directly:", err.message);
    const fallbackText = getLocalBotResponse(prompt, activeLang);
    res.json({ text: fallbackText });
  }
});

// Chat Conversations CRUD
app.get('/api/chat/conversations', authenticateToken, async (req, res) => {
  try {
    const list = await DB.getConversations(req.user.uid);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
});

app.post('/api/chat/conversations', authenticateToken, async (req, res) => {
  const { title } = req.body;
  try {
    const newConv = {
      userId: req.user.uid,
      title: title || 'New Chat Session',
      messages: []
    };
    const saved = await DB.saveConversation(newConv);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create conversation.' });
  }
});

app.get('/api/chat/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const conv = await DB.findConversationById(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });
    if (conv.userId !== req.user.uid) return res.status(403).json({ error: 'Unauthorized.' });
    res.json(conv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

app.post('/api/chat/conversations/:id/messages', authenticateToken, async (req, res) => {
  const { text, language } = req.body;
  if (!text) return res.status(400).json({ error: 'Message text is required.' });

  try {
    const conv = await DB.findConversationById(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });
    if (conv.userId !== req.user.uid) return res.status(403).json({ error: 'Unauthorized.' });

    // User message
    const userMsg = {
      sender: 'user',
      text,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    conv.messages.push(userMsg);

    // Call Gemini (or local fallback)
    const activeLang = language || 'en';
    const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || '';
    const systemContext = `You are KisanAI Copilot, an expert agricultural bot advising Indian farmers. Provide clear, direct actionable recommendations. Respond in ${getLanguageName(activeLang)}. Make your response context-aware and focused on agriculture (soils, crops, fertilizers, irrigation, pests). Context prompt: ${text}`;

    let reply = '';
    const isKeyValid = GEMINI_API_KEY.startsWith('AIzaSy') || GEMINI_API_KEY.startsWith('AQ');
    if (GEMINI_API_KEY && isKeyValid) {
      try {
        const contents = [];
        conv.messages.slice(0, -1).forEach(m => {
          contents.push({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          });
        });
        contents.push({
          role: 'user',
          parts: [{ text: systemContext }]
        });

        let geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        let response = await fetchWithRetry(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents })
        });

        if (!response.ok && response.status === 404) {
          geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
          response = await fetchWithRetry(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
          });
        }

        if (response.ok) {
          const json = await response.json();
          reply = getSafeCandidateText(json);
          if (!reply) {
            reply = getLocalBotResponse(text, activeLang);
          }
        } else {
          reply = getLocalBotResponse(text, activeLang);
        }
      } catch (err) {
        reply = getLocalBotResponse(text, activeLang);
      }
    } else {
      reply = getLocalBotResponse(text, activeLang);
    }

    const botMsg = {
      sender: 'bot',
      text: reply,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    conv.messages.push(botMsg);

    if (conv.title === 'New Conversation' || conv.title === 'New Chat Session') {
      conv.title = text.length > 25 ? text.substring(0, 25) + '...' : text;
    }

    await DB.saveConversation(conv);
    res.status(201).json({ conversation: conv, userMessage: userMsg, botMessage: botMsg });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process message.' });
  }
});

app.delete('/api/chat/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const conv = await DB.findConversationById(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });
    if (conv.userId !== req.user.uid) return res.status(403).json({ error: 'Unauthorized.' });

    await DB.deleteConversation(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete conversation.' });
  }
});

app.get('/api/chat/search', authenticateToken, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    const list = await DB.getConversations(req.user.uid);
    const results = [];
    list.forEach(c => {
      const matchingMessages = c.messages.filter(m => m.text.toLowerCase().includes(q.toLowerCase()));
      if (matchingMessages.length > 0) {
        results.push({
          conversationId: c._id,
          conversationTitle: c.title,
          messages: matchingMessages
        });
      }
    });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search chat history.' });
  }
});

// ==================== SAVED ADVISORIES & RECOMMENDATIONS ====================

app.get('/api/chat/recommendations/saved', authenticateToken, async (req, res) => {
  try {
    const list = await DB.getSavedRecommendations(req.user.uid);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch saved recommendations.' });
  }
});

app.post('/api/chat/recommendations/save', authenticateToken, async (req, res) => {
  const { farmId, farmName, type, recommendation } = req.body;
  if (!recommendation || !type) return res.status(400).json({ error: 'Type and recommendation text are required.' });

  try {
    const newRec = {
      userId: req.user.uid,
      farmId: farmId || '',
      farmName: farmName || '',
      type,
      recommendation,
      date: new Date().toLocaleDateString()
    };
    const saved = await DB.saveRecommendation(newRec);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save recommendation.' });
  }
});

app.post('/api/chat/recommendations/:id/delete', authenticateToken, async (req, res) => {
  try {
    await DB.deleteSavedRecommendation(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete recommendation.' });
  }
});

// ==================== LIVE WEATHER PROXY API ====================

function getLocalWeatherAdvisory(temp, humidity, rainChance, windSpeed, crop) {
  if (rainChance > 70) {
    return `• Irrigation: Skip watering ${crop} crop to prevent waterlogging.\n• Spraying: Do not spray pesticide as it will leach.\n• Harvest: Move harvested crop to dry storage immediately.`;
  }
  if (windSpeed > 22) {
    return `• Irrigation: Standard watering required.\n• Spraying: Postpone pesticide spray due to drift hazard.\n• Harvest: Secure shelter structures.`;
  }
  if (humidity > 80 && temp > 30) {
    return `• Irrigation: Keep drainage channels active.\n• Spraying: High fungal risk, spray systemic fungicide.\n• Harvest: Dry yields thoroughly.`;
  }
  return `• Irrigation: Proceed with standard drip cycle.\n• Spraying: Weather is optimal for nitrogen/pest spraying.\n• Harvest: Safe to harvest cotton/paddy now.`;
}

app.get('/api/weather', authenticateToken, async (req, res) => {
  const { lat, lng, crop } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'Latitude and Longitude are required.' });

  const apiKey = process.env.VITE_OPENWEATHERMAP_API_KEY;
  const targetCrop = crop || 'Cotton';

  const localFallback = () => {
    const hash = Math.abs(Math.floor((Math.sin(lat) * Math.cos(lng)) * 1000));
    const temp = 28 + (hash % 8);
    const rainChance = (hash * 7) % 100;
    const humidity = 50 + (hash % 40);
    const windSpeed = 8 + (hash % 18);
    const uvIndex = 4 + (hash % 7);

    const sortedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const conditions = ['Sunny', 'Cloudy', 'Drizzle', 'Showers', 'Heavy Rain', 'Partly Cloudy'];

    const forecast = sortedDays.map((day, idx) => {
      const dailyRainChance = ((hash + idx) * 13) % 100;
      let condition = conditions[0];
      if (dailyRainChance > 75) condition = conditions[4];
      else if (dailyRainChance > 50) condition = conditions[3];
      else if (dailyRainChance > 30) condition = conditions[2];
      else if (dailyRainChance > 15) condition = conditions[1];
      return { day, temp: temp + (hash + idx) % 5 - 2, rainChance: dailyRainChance, condition };
    });

    const recommendations = getLocalWeatherAdvisory(temp, humidity, rainChance, windSpeed, targetCrop);

    return {
      currentTemp: temp,
      description: rainChance > 60 ? 'Rainy' : rainChance > 30 ? 'Cloudy' : 'Sunny',
      rainChance,
      windSpeed,
      humidity,
      uvIndex,
      forecast,
      alerts: rainChance > 70 ? ['Heavy Rain Alert: Outbreak expected in 6 hours.'] : [],
      recommendation: recommendations
    };
  };

  if (!apiKey) {
    return res.json(localFallback());
  }

  try {
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    );
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    );

    if (!currentRes.ok || !forecastRes.ok) {
      return res.json(localFallback());
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    const temp = Math.round(currentData.main.temp);
    const humidity = currentData.main.humidity;
    const windSpeed = Math.round(currentData.wind.speed * 3.6);
    const conditionMain = currentData.weather?.[0]?.main || 'Clear';

    let description = 'Sunny';
    if (conditionMain === 'Rain') description = 'Rainy';
    else if (conditionMain === 'Clouds') description = 'Cloudy';
    else if (conditionMain === 'Drizzle' || conditionMain === 'Mist' || conditionMain === 'Haze') description = 'Cloudy';
    else if (conditionMain === 'Clear') description = 'Sunny';
    else description = 'Partly Cloudy';

    const list = forecastData.list || [];
    const forecast = [];
    const daysSeen = new Set();

    for (const item of list) {
      const date = new Date(item.dt * 1000);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'short' });

      if (dayName === currentDayName || daysSeen.has(dayName)) continue;

      daysSeen.add(dayName);
      const itemTemp = Math.round(item.main.temp);
      const pop = item.pop !== undefined ? Math.round(item.pop * 100) : 0;

      const forecastCondMain = item.weather?.[0]?.main || 'Clear';
      let forecastCond = 'Sunny';
      if (forecastCondMain === 'Rain') forecastCond = 'Heavy Rain';
      else if (forecastCondMain === 'Clouds') forecastCond = 'Cloudy';
      else if (forecastCondMain === 'Drizzle' || forecastCondMain === 'Mist') forecastCond = 'Showers';
      else forecastCond = 'Sunny';

      forecast.push({
        day: dayName,
        temp: itemTemp,
        rainChance: pop,
        condition: forecastCond
      });

      if (forecast.length >= 7) break;
    }

    const rainChance = list[0] && list[0].pop !== undefined ? Math.round(list[0].pop * 100) : (conditionMain === 'Rain' ? 90 : 10);
    const uvIndex = conditionMain === 'Clear' ? 9 : conditionMain === 'Clouds' ? 4 : 2;

    const alerts = [];
    if (rainChance > 70 || conditionMain === 'Rain') {
      alerts.push('Heavy Rain Alert: Outbreak expected in 6 hours.');
    }
    if (windSpeed > 22) {
      alerts.push('Strong Wind Alert: Gusts exceeding 22 km/h tomorrow.');
    }

    // Dynamic AI weather recommendations from Gemini
    let recommendation = '';
    const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || '';
    const isKeyValid = GEMINI_API_KEY.startsWith('AIzaSy') || GEMINI_API_KEY.startsWith('AQ');

    if (GEMINI_API_KEY && isKeyValid) {
      try {
        const response = await fetchWithRetry(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Provide short agricultural recommendations for crop "${targetCrop}" based on weather data: Temp ${temp}°C, Humidity ${humidity}%, Wind ${windSpeed} km/h, Rain Chance ${rainChance}%. Generate 3 short advice bullet points: 1. Irrigation advice, 2. Spray recommendations, 3. Harvest alerts. Keep it under 60 words.`
                    }
                  ]
                }
              ]
            })
          }
        );
        if (response.ok) {
          const json = await response.json();
          recommendation = getSafeCandidateText(json);
          if (!recommendation) {
            recommendation = getLocalWeatherAdvisory(temp, humidity, rainChance, windSpeed, targetCrop);
          }
        } else {
          recommendation = getLocalWeatherAdvisory(temp, humidity, rainChance, windSpeed, targetCrop);
        }
      } catch (err) {
        recommendation = getLocalWeatherAdvisory(temp, humidity, rainChance, windSpeed, targetCrop);
      }
    } else {
      recommendation = getLocalWeatherAdvisory(temp, humidity, rainChance, windSpeed, targetCrop);
    }

    res.json({
      currentTemp: temp,
      description,
      rainChance,
      windSpeed,
      humidity,
      uvIndex,
      forecast,
      alerts,
      recommendation
    });
  } catch (err) {
    res.json(localFallback());
  }
});

// ==================== PUBLIC CONTACT INQUIRIES API ====================

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  try {
    const newInquiry = {
      name,
      email,
      phone: phone || '',
      message,
      date: new Date().toLocaleDateString()
    };
    const saved = await DB.saveContactInquiry(newInquiry);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit inquiry.' });
  }
});

app.get('/api/admin/inquiries', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const inquiries = await DB.getContactInquiries();
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inquiries.' });
  }
});

app.post('/api/admin/inquiries/:id/delete', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const success = await DB.deleteContactInquiry(req.params.id);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete inquiry.' });
  }
});

const seedAdminUser = async () => {
  const adminUsername = 'admin';
  const adminPassword = 'AdminPassword123!';
  const adminDisplayName = 'System Administrator';
  const adminUid = 'admin-uid-system-111222';

  try {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const adminUserObj = {
      uid: adminUid,
      username: adminUsername,
      email: null,
      passwordHash,
      displayName: adminDisplayName,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(adminDisplayName)}`,
      phoneNumber: '',
      isOnboarded: true,
      role: 'admin',
      preferences: {
        language: 'en',
        weatherAlerts: true,
        diseaseAlerts: true,
        schemeAlerts: true
      }
    };

    // 1. Seed MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      const existing = await User.findOne({ username: adminUsername });
      if (!existing) {
        const doc = new User(adminUserObj);
        await doc.save();
        console.log('✅ Admin user successfully seeded into MongoDB.');
      }
    }

    // 2. Seed JSON Fallback DB
    initJsonDb();
    const data = readJsonDb();
    const existingJson = data.users.find(u => u.username === adminUsername);
    if (!existingJson) {
      data.users.push(adminUserObj);
      writeJsonDb(data);
      console.log('✅ Admin user successfully seeded into JSON fallback database.');
    }
  } catch (err) {
    console.error('⚠️ Error seeding admin user:', err.message);
  }
};

// Server Listen
app.listen(PORT, () => {
  console.log(`KisanAI Backend Node/Express Server running on port ${PORT}`);
  seedAdminUser();
});
