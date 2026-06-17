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

require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Load variables from root .env

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
  isBanned: { type: Boolean, default: false },
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
  areaSqft: { type: Number },
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

// Marketplace Listing Schema
const ListingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true }, // e.g. Machinery, Seeds, Fertilizers, Tools, Livestock, Land
  price: { type: Number, required: true },
  location: { type: String, required: true },
  contact: { type: String, required: true },
  sellerName: { type: String, required: true },
  userId: { type: String, required: true }, // Matches User.uid
  imageUrl: { type: String, default: '' },
  date: { type: String, required: true }
}, { timestamps: true });

const Listing = mongoose.model('Listing', ListingSchema);

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
      contactInquiries: [],
      listings: []
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
  let lastResponse;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      lastResponse = response;
      if (response.ok) {
        return response;
      }
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        console.warn(`Fetch to ${url} failed with status ${response.status}. Retrying in ${backoff}ms... (Attempt ${i + 1}/${retries})`);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, backoff));
          backoff *= 2;
        }
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
  return lastResponse;
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
        const docs = await User.find({}, 'uid username email displayName photoURL phoneNumber role isOnboarded isBanned createdAt');
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
      isBanned: u.isBanned || false,
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

  // Marketplace Listings
  async getListings(query, category) {
    if (this.isMongoConnected()) {
      try {
        const filter = {};
        if (category) filter.category = category;
        if (query) {
          filter.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { location: { $regex: query, $options: 'i' } }
          ];
        }
        const docs = await Listing.find(filter).sort({ createdAt: -1 });
        return docs.map(d => d.toObject());
      } catch (err) {
        console.error("MongoDB getListings error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    if (!data.listings) data.listings = [];
    let list = data.listings;
    if (category) {
      list = list.filter(l => l.category === category);
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(l => 
        l.title.toLowerCase().includes(q) || 
        l.description.toLowerCase().includes(q) || 
        l.location.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  },

  async findListingById(id) {
    if (this.isMongoConnected()) {
      try {
        const doc = await Listing.findById(id);
        return doc ? doc.toObject() : null;
      } catch (err) {
        console.error("MongoDB findListingById error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    if (!data.listings) data.listings = [];
    return data.listings.find(l => l._id === id) || null;
  },

  async saveListing(listingObj) {
    if (this.isMongoConnected()) {
      try {
        if (listingObj._id && mongoose.Types.ObjectId.isValid(listingObj._id)) {
          const doc = await Listing.findById(listingObj._id);
          if (doc) {
            Object.assign(doc, listingObj);
            const saved = await doc.save();
            return saved.toObject();
          }
        }
        const docNew = new Listing(listingObj);
        const saved = await docNew.save();
        return saved.toObject();
      } catch (err) {
        console.error("MongoDB saveListing error:", err.message);
        throw err;
      }
    }
    const data = readJsonDb();
    if (!data.listings) data.listings = [];
    if (!listingObj._id) {
      listingObj._id = 'listing-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    const idx = data.listings.findIndex(l => l._id === listingObj._id);
    const updated = {
      ...listingObj,
      updatedAt: new Date().toISOString(),
      createdAt: listingObj.createdAt || new Date().toISOString()
    };
    if (idx !== -1) {
      data.listings[idx] = updated;
    } else {
      data.listings.push(updated);
    }
    writeJsonDb(data);
    return updated;
  },

  async deleteListing(id, userId) {
    if (this.isMongoConnected()) {
      try {
        const query = { _id: id };
        const user = await this.findUserByUid(userId);
        if (user && user.role !== 'admin') {
          query.userId = userId;
        }
        const res = await Listing.deleteOne(query);
        return res.deletedCount > 0;
      } catch (err) {
        console.error("MongoDB deleteListing error, falling back to JSON:", err.message);
      }
    }
    const data = readJsonDb();
    if (!data.listings) data.listings = [];
    const initialLen = data.listings.length;
    const user = data.users.find(u => u.uid === userId);
    const isAdmin = user && user.role === 'admin';
    data.listings = data.listings.filter(l => !(l._id === id && (l.userId === userId || isAdmin)));
    writeJsonDb(data);
    return data.listings.length < initialLen;
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

    if (user.isBanned) {
      return res.status(403).json({ error: 'This account has been banned by administrators.' });
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

// Password Reset Endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  const { username, phoneNumber, newPassword } = req.body;
  if (!username || !newPassword) {
    return res.status(400).json({ error: 'Username and new password are required.' });
  }

  try {
    const user = await DB.findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User does not exist.' });
    }

    if (user.phoneNumber && user.phoneNumber !== phoneNumber) {
      return res.status(400).json({ error: 'Verification failed: Phone number does not match.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await DB.saveUser(user);
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    console.error('[Password Reset Error]', err);
    res.status(500).json({ error: 'Failed to reset password.' });
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
    if (user && user.isBanned) {
      return res.status(403).json({ error: 'This account has been banned by administrators.' });
    }
    
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
    if (user.isBanned) {
      return res.status(403).json({ error: 'This account has been banned by administrators.' });
    }
    
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
  
  if (activeLang === 'te') {
    const reportsTe = {
      cotton: {
        diseaseName: 'ఆకు మాడు తెగులు (Leaf Blight)',
        confidence: 94,
        description: 'పత్తి ఆకులపై గుండ్రటి గోధుమ-నలుపు మచ్చలు ఏర్పడతాయి. దీనివల్ల ఆకులు త్వరగా రాలిపోయి, దిగుబడి తగ్గుతుంది.',
        prevention: 'పొలంలో నీరు నిల్వ ఉండకుండా చూసుకోవాలి. తెగులు సోకని ధృవీకరించబడిన విత్తనాలను మాత్రమే వాడాలి.',
        treatment: 'కాపర్ ఆక్సిక్లోరైడ్ (లీటరు నీటికి 2.5 గ్రాములు) లేదా మాంకోజెబ్ (లీటరు నీటికి 2 గ్రాములు) కలిపి పిచికారీ చేయాలి. అవసరమైతే 12-14 రోజుల తర్వాత మళ్లీ పిచికారీ చేయాలి.',
        fertilizer: 'పంట నిరోధక శక్తిని పెంచడానికి పొటాష్ ఎరువును వాడాలి. అధిక నత్రజని ఎరువుల వాడకాన్ని తగ్గించాలి.'
      },
      paddy: {
        diseaseName: 'వరి అగ్గి తెగులు (Rice Blast)',
        confidence: 96,
        description: 'ఆకులపై నూలు కండె ఆకారపు బూడిద రంగు మచ్చలు ఏర్పడతాయి. నివారించకపోతే పంట పూర్తిగా నష్టపోతుంది.',
        prevention: 'నత్రజని ఎరువులు మోతాదుకు మించి వేయకూడదు. నాటడానికి ముందు ట్రైసైక్లాజోల్‌తో విత్తన శుద్ధి చేయాలి.',
        treatment: 'ట్రైసైక్లాజోల్ (లీటరు నీటికి 0.6 గ్రాములు) లేదా కార్బెండజిమ్ (లీటరు నీటికి 1 గ్రాము) కలిపి పిచికారీ చేయాలి.',
        fertilizer: 'నత్రజనిని 3 లేదా 4 విడతలుగా వేయాలి. తగినంత పొటాష్ అందుబాటులో ఉంచాలి.'
      },
      maize: {
        diseaseName: 'మొక్కజొన్న ఆకు మాడు తెగులు (Turcicum Leaf Blight)',
        confidence: 91,
        description: 'ఆకులపై పొడవైన పిలక ఆకారపు మచ్చలు ఏర్పడతాయి. తెగులు క్రింది ఆకుల నుండి ప్రారంభమై పైకి వ్యాపిస్తుంది.',
        prevention: 'పప్పుధాన్యాల పంటలతో పంట మార్పిడి చేయాలి. లోతు దుక్కి దున్నాలి.',
        treatment: 'మాంకోజెబ్ (లీటరు నీటికి 2.5 గ్రాములు) లేదా జినెబ్ (లీటరు నీటికి 2 గ్రాములు) కలిపి పిచికారీ చేయాలి.',
        fertilizer: 'సమతుల్య ఎరువులు వేయాలి. ఎకరానికి 10 కిలోల జింక్ సల్ఫేట్ వేయడం వల్ల పంటకు నిరోधక శక్తి పెరుగుతుంది.'
      }
    };
    return reportsTe[key] || reportsTe.cotton;
  }
  
  if (activeLang === 'hi') {
    const reportsHi = {
      cotton: {
        diseaseName: 'पत्ती झुलसा रोग (Leaf Blight)',
        confidence: 94,
        description: 'कपास की पत्तियों पर भूरे-काले गोलाकार धब्बे बन जाते हैं, जिससे पत्तियां समय से पहले गिर जाती हैं और पैदावार कम हो जाती है।',
        prevention: 'खेत में जल निकास की उचित व्यवस्था करें। रोग प्रतिरोधी प्रमाणित बीजों का ही उपयोग करें।',
        treatment: 'कॉपर ऑक्सीक्लोराइड (2.5 ग्राम/लीटर) या मैंकोजेब (2 ग्राम/लीटर) का छिड़काव करें। 12-14 दिनों के बाद छिड़काव दोहराएं।',
        fertilizer: 'रोग प्रतिरोधकता बढ़ाने के लिए पोटाश उर्वरक का प्रयोग करें। अत्यधिक नाइट्रोजन से बचें।'
      },
      paddy: {
        diseaseName: 'धान का झोंका रोग (Rice Blast)',
        confidence: 96,
        description: 'पत्तियों पर राख के रंग के केंद्र वाले धब्बे बन जाते हैं, जिससे फसल पूरी तरह नष्ट हो सकती है।',
        prevention: 'अत्यधिक नाइट्रोजन उर्वरकों के उपयोग से बचें। बुवाई से पहले ट्राइसाइक्लाजोल से बीज उपचार करें।',
        treatment: 'ट्राइसाइक्लाजोल (0.6 ग्राम/लीटर) या कार्बेन्डाजिम (1 ग्राम/लीटर) का छिड़काव करें।',
        fertilizer: 'नाइट्रोजन को 3 या 4 खुराकों में विभाजित करके दें। पोटाश का उचित प्रयोग सुनिश्चित करें।'
      },
      maize: {
        diseaseName: 'मक्का पत्ती झुलसा रोग (Turcicum Leaf Blight)',
        confidence: 91,
        description: 'पत्तियों पर बड़े, लंबे, भूरे रंग के धब्बे दिखाई देते हैं। यह आमतौर पर नीचे की पत्तियों से शुरू होकर ऊपर की ओर बढ़ता है।',
        prevention: 'दलहन फसलों के साथ फसल चक्र अपनाएं। रोगग्रस्त अवशेषों को जला दें।',
        treatment: 'मैंकोजेब (2.5 ग्राम/लीटर) या ज़िनेब (2 ग्राम/लीटर) का छिड़काव तुरंत करें।',
        fertilizer: 'संतुलित खाद डालें। जिंक सल्फेट (10 किलोग्राम/एकड़) का प्रयोग करने से पौधे की ताकत बढ़ती है।'
      }
    };
    return reportsHi[key] || reportsHi.cotton;
  }

  return reports[key] || reports.cotton;
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

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  const isKeyValid = GEMINI_API_KEY.startsWith('AIzaSy') || GEMINI_API_KEY.startsWith('AQ');

  if (!GEMINI_API_KEY || !isKeyValid) {
    return res.status(400).json({ error: 'Gemini API key is invalid or not configured. Disease diagnostic scanner requires a valid Gemini API key starting with AIzaSy.' });
  }

  try {
    const rawData = image.split(',')[1] || image;
    let geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const systemInstructionText = `You are KisanAI Crop Diagnostic Agent. You must analyze the crop leaf image and diagnose the disease. You MUST respond strictly in the requested language: ${getLanguageName(activeLang)}. In the treatment section, you must suggest specific chemical or organic medicine names available in India (e.g. Blitox, Mancozeb M-45, Ridomil Gold, Amistar, etc.) and exact dosage parameters. Return the response strictly as a JSON object. The keys of the JSON object MUST remain in English: diseaseName, confidence, description, prevention, treatment, fertilizer. All values corresponding to these keys MUST be written entirely in ${getLanguageName(activeLang)}. Do not include any markdown styling like \`\`\`json or backticks in the response.`;

    const requestPacket = {
      contents: [
        {
          parts: [
            {
              text: `Analyze this crop leaf image for the crop type "${activeCrop}".`
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: rawData
              }
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstructionText }]
      }
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
      const errText = await response.text();
      console.error(`Gemini API error (disease analyze): status ${response.status}, payload:`, errText);
      throw new Error(`Gemini status ${response.status} - ${errText}`);
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
    try {
      const fallbackReport = getLocalDiseaseReport(activeCrop, activeLang);
      res.json(fallbackReport);
    } catch (fallbackErr) {
      console.error("Local fallback error:", fallbackErr.message);
      res.status(500).json({ error: `Gemini API leaf analysis error: ${err.message}` });
    }
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

  let activeLang = language;
  if (!activeLang) {
    try {
      const user = await DB.findUserByUid(req.user.uid);
      activeLang = (user && user.preferences && user.preferences.language) || 'en';
    } catch (e) {
      activeLang = 'en';
    }
  }
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  const isKeyValid = GEMINI_API_KEY.startsWith('AIzaSy') || GEMINI_API_KEY.startsWith('AQ');
  if (!GEMINI_API_KEY || !isKeyValid) {
    return res.status(400).json({ error: 'Gemini API key is invalid or not configured. Chatbot requires a valid Gemini API key starting with AIzaSy.' });
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
      parts: [{ text: prompt }]
    });

    const systemInstructionText = `You are KisanAI Copilot, an expert agricultural bot advising Indian farmers. Provide clear, direct actionable recommendations. You MUST respond in ${getLanguageName(activeLang)}. Make your response context-aware and focused on agriculture (soils, crops, fertilizers, irrigation, pests).`;

    const requestPacket = {
      contents,
      systemInstruction: {
        parts: [{ text: systemInstructionText }]
      }
    };

    let geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
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
        body: JSON.stringify({ contents })
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Gemini API error (chat): status ${response.status}, payload:`, errText);
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const json = await response.json();
    const reply = getSafeCandidateText(json);
    if (!reply) {
      throw new Error("Empty response from Gemini API");
    }
    res.json({ text: reply });
  } catch (err) {
    console.error("Gemini backend chat error:", err.message);
    res.status(500).json({ error: `Gemini API chat error: ${err.message}` });
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
    let activeLang = language;
    if (!activeLang) {
      try {
        const user = await DB.findUserByUid(req.user.uid);
        activeLang = (user && user.preferences && user.preferences.language) || 'en';
      } catch (e) {
        activeLang = 'en';
      }
    }
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    const isKeyValid = GEMINI_API_KEY.startsWith('AIzaSy') || GEMINI_API_KEY.startsWith('AQ');

    if (!GEMINI_API_KEY || !isKeyValid) {
      return res.status(400).json({ error: 'Gemini API key is invalid or not configured. Chatbot requires a valid Gemini API key starting with AIzaSy.' });
    }

    let reply = '';
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
        parts: [{ text: text }]
      });

      const systemInstructionText = `You are KisanAI Copilot, an expert agricultural bot advising Indian farmers. Provide clear, direct actionable recommendations. You MUST respond in ${getLanguageName(activeLang)}. Make your response context-aware and focused on agriculture (soils, crops, fertilizers, irrigation, pests).`;

      const requestPacket = {
        contents,
        systemInstruction: {
          parts: [{ text: systemInstructionText }]
        }
      };

      let geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
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
          body: JSON.stringify({ contents })
        });
      }

      if (!response.ok) {
        throw new Error(`Gemini API call failed with status ${response.status}`);
      }

      const json = await response.json();
      reply = getSafeCandidateText(json);
      if (!reply) {
        throw new Error("Empty response returned from Gemini API");
      }
    } catch (err) {
      console.error("Gemini session send message failure:", err);
      return res.status(500).json({ error: `Gemini API message error: ${err.message}` });
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

const WEATHER_TRANSLATIONS = {
  en: {
    rain_alert: 'Heavy Rain Alert: Severe rain predicted. Skip irrigation and protect harvested crops.',
    heat_alert: 'Heat Wave Alert: Extreme heat wave warning. Irrigate crop regularly to prevent wilting.',
    frost_alert: 'Frost Alert: Potential crop frost damage. Take protective shielding measures.',
    wind_alert: 'Strong Wind Alert: High velocity winds. Postpone pesticide sprays and secure crop stakes.',
    adv_rain: (crop) => `• Irrigation: Skip watering ${crop} crop to prevent waterlogging.\n• Spraying: Do not spray pesticide as it will leach.\n• Harvest: Move harvested crop to dry storage immediately.`,
    adv_wind: (crop) => `• Irrigation: Standard watering required.\n• Spraying: Postpone pesticide spray due to drift hazard.\n• Harvest: Secure shelter structures.`,
    adv_humidity: (crop) => `• Irrigation: Keep drainage channels active.\n• Spraying: High fungal risk, spray systemic fungicide.\n• Harvest: Dry yields thoroughly.`,
    adv_default: (crop) => `• Irrigation: Proceed with standard drip cycle.\n• Spraying: Weather is optimal for nitrogen/pest spraying.\n• Harvest: Safe to harvest crop now.`
  },
  te: {
    rain_alert: 'α░¡α░╛α░░α▒Ç α░╡α░░α▒ìα░╖ α░╣α▒åα░Üα▒ìα░Üα░░α░┐α░ò: α░ñα▒Çα░╡α▒ìα░░α░«α▒êα░¿ α░╡α░░α▒ìα░╖α░é α░¬α░íα▒ç α░àα░╡α░òα░╛α░╢α░é α░ëα░éα░ªα░┐. α░¿α▒Çα░ƒα░┐ α░¬α░╛α░░α▒üα░ªα░▓α░¿α░┐ α░¿α░┐α░▓α░┐α░¬α░┐α░╡α▒çα░»α░éα░íα░┐ α░«α░░α░┐α░»α▒ü α░òα▒ïα░╕α░┐α░¿ α░¬α░éα░ƒα░¿α▒ü α░░α░òα▒ìα░╖α░┐α░éα░Üα░éα░íα░┐.',
    heat_alert: 'α░╡α░íα░ùα░╛α░▓α▒ìα░¬α▒üα░▓ α░╣α▒åα░Üα▒ìα░Üα░░α░┐α░ò: α░ñα▒Çα░╡α▒ìα░░α░«α▒êα░¿ α░╡α▒çα░íα░┐ α░╡α░╛α░ñα░╛α░╡α░░α░úα░é. α░¬α░éα░ƒ α░Äα░éα░íα░┐α░¬α▒ïα░òα▒üα░éα░íα░╛ α░¿α░┐α░ñα▒ìα░»α░é α░¿α▒Çα░░α▒ü α░¬α▒åα░ƒα▒ìα░ƒα░éα░íα░┐.',
    frost_alert: 'α░ñα▒üα░╖α░╛α░░ α░╣α▒åα░Üα▒ìα░Üα░░α░┐α░ò: α░¬α░éα░ƒα░òα▒ü α░ñα▒üα░╖α░╛α░░ α░¿α░╖α▒ìα░ƒα░é α░£α░░α░┐α░ùα▒ç α░àα░╡α░òα░╛α░╢α░é α░ëα░éα░ªα░┐. α░░α░òα▒ìα░╖α░ú α░Üα░░α▒ìα░»α░▓α▒ü α░ñα▒Çα░╕α▒üα░òα▒ïα░éα░íα░┐.',
    wind_alert: 'α░êα░ªα▒üα░░α▒ü α░ùα░╛α░▓α▒üα░▓ α░╣α▒åα░Üα▒ìα░Üα░░α░┐α░ò: α░¼α░▓α░«α▒êα░¿ α░ùα░╛α░▓α▒üα░▓α▒ü α░╡α▒Çα░Üα▒ç α░àα░╡α░òα░╛α░╢α░é α░ëα░éα░ªα░┐. α░¬α░┐α░Üα░┐α░òα░╛α░░α▒Çα░¿α░┐ α░╡α░╛α░»α░┐α░ªα░╛ α░╡α▒çα░»α░éα░íα░┐.',
    adv_rain: (crop) => `• α░¿α▒Çα░ƒα░┐ α░»α░╛α░£α░«α░╛α░¿α▒ìα░»α░é: α░àα░ºα░┐α░ò α░ñα▒çα░«α░¿α▒ü α░¿α░┐α░╡α░╛α░░α░┐α░éα░Üα░íα░╛α░¿α░┐α░òα░┐ ${crop} α░¬α░éα░ƒα░òα▒ü α░¿α▒Çα░░α▒ü α░¬α▒åα░ƒα▒ìα░ƒα░íα░é α░¿α░┐α░▓α░┐α░¬α░┐α░╡α▒çα░»α░éα░íα░┐.\n• α░¬α░┐α░Üα░┐α░òα░╛α░░α▒Ç: α░╡α░░α▒ìα░╖α░é α░╡α░▓α▒ìα░▓ α░òα░íα░┐α░ùα░┐α░╡α▒çα░»α░¼α░íα▒üα░ñα▒üα░éα░ªα░┐ α░òα░╛α░¼α░ƒα▒ìα░ƒα░┐ α░«α░éα░ªα▒üα░▓α▒ü α░¬α░┐α░Üα░┐α░òα░╛α░░α▒Ç α░Üα▒çα░»α░╡α░ªα▒ìα░ªα▒ü.\n• α░òα▒ïα░ñ: α░òα▒ïα░╕α░┐α░¿ α░¬α░éα░ƒα░¿α▒ü α░╡α▒åα░éα░ƒα░¿α▒ç α░¬α▒èα░íα░┐ α░¿α░┐α░▓α▒ìα░╡ α░¬α▒ìα░░α░ªα▒çα░╢α░╛α░¿α░┐α░òα░┐ α░ñα░░α░▓α░┐α░éα░Üα░éα░íα░┐.`,
    adv_wind: (crop) => `• α░¿α▒Çα░ƒα░┐ α░»α░╛α░£α░«α░╛α░¿α▒ìα░»α░é: α░╕α░╛α░ºα░╛α░░α░ú α░¿α▒Çα░ƒα░┐ α░¬α░╛α░░α▒üα░ªα░▓ α░àα░╡α░╕α░░α░é.\n• α░¬α░┐α░Üα░┐α░òα░╛α░░α▒Ç: α░ùα░╛α░▓α░┐ α░╡α▒çα░ùα░é α░╡α░▓α▒ìα░▓ α░òα▒èα░ƒα▒ìα░ƒα▒üα░òα▒üα░¬α▒ïα░»α▒ç α░¬α▒ìα░░α░«α░╛α░ªα░é α░ëα░¿α▒ìα░¿α░éα░ªα▒üα░¿ α░«α░éα░ªα▒üα░▓ α░¬α░┐α░Üα░┐α░òα░╛α░░α▒Çα░¿α░┐ α░╡α░╛α░»α░┐α░ªα░╛ α░╡α▒çα░»α░éα░íα░┐.\n• α░òα▒ïα░ñ: α░¬α░éα░ƒ α░åα░╢α▒ìα░░α░» α░¿α░┐α░░α▒ìα░«α░╛α░úα░╛α░▓α░¿α▒ü α░╕α▒üα░░α░òα▒ìα░╖α░┐α░ñα░é α░Üα▒çα░»α░éα░íα░┐.`,
    adv_humidity: (crop) => `• α░¿α▒Çα░ƒα░┐ α░»α░╛α░£α░«α░╛α░¿α▒ìα░»α░é: α░íα▒ìα░░α▒êα░¿α▒çα░£α▒Ç α░òα░╛α░▓α▒üα░╡α░▓α░¿α▒ü α░╕α░òα▒ìα░░α░┐α░»α░éα░ùα░╛ α░ëα░éα░Üα░éα░íα░┐.\n• α░¬α░┐α░Üα░┐α░òα░╛α░░α▒Ç: α░╢α░┐α░▓α▒Çα░éα░ºα▒ìα░░α░╛α░▓ α░¬α▒ìα░░α░«α░╛α░ªα░é α░Äα░òα▒ìα░òα▒üα░╡α░ùα░╛ α░ëα░éα░ªα░┐, α░░α░òα▒ìα░╖α░┐α░ñ α░╢α░┐α░▓α▒Çα░éα░ªα▒ìα░░α░¿α░╛α░╢α░òα░╛α░¿α▒ìα░¿α░┐ α░¬α░┐α░Üα░┐α░òα░╛α░░α▒Ç α░Üα▒çα░»α░éα░íα░┐.\n• α░òα▒ïα░ñ: α░¬α░éα░ƒ α░ªα░┐α░ùα▒üα░¼α░íα░┐α░¿α░┐ α░¬α▒éα░░α▒ìα░ñα░┐α░ùα░╛ α░Äα░éα░íα░¼α▒åα░ƒα▒ìα░ƒα░éα░íα░┐.`,
    adv_default: (crop) => `• α░¿α▒Çα░ƒα░┐ α░»α░╛α░£α░«α░╛α░¿α▒ìα░»α░é: α░¬α▒ìα░░α░╛α░«α░╛α░úα░┐α░ò α░íα▒ìα░░α░┐α░¬α▒ì α░╕α▒êα░òα░┐α░▓α▒ì•α░ñα▒ï α░òα▒èα░¿α░╕α░╛α░ùα░éα░íα░┐.\n• α░¬α░┐α░Üα░┐α░òα░╛α░░α▒Ç: α░¿α░ñα▒ìα░░α░£α░¿α░┐ α░▓α▒çα░ªα░╛ α░ñα▒åα░ùα▒üα░│α▒ìα░▓ α░¬α░┐α░Üα░┐α░òα░╛α░░α▒Çα░òα░┐ α░╡α░╛α░ñα░╛α░╡α░░α░úα░é α░àα░¿α▒üα░òα▒éα░▓α░éα░ùα░╛ α░ëα░éα░ªα░┐.\n• α░òα▒ïα░ñ: α░çα░¬α▒ìα░¬α▒üα░íα▒ü α░¬α░éα░ƒα░¿α▒ü α░òα▒ïα░»α░íα░é α░╕α▒üα░░α░òα▒ìα░╖α░┐α░ñα░é.`
  },
  hi: {
    rain_alert: 'αñ¡αñ╛αñ░αÑÇ αñ¼αñ╛αñ░αñ┐αñ╢ αñòαÑÇ αñÜαÑçαññαñ╛αñ╡αñ¿αÑÇ: αñ¡αñ╛αñ░αÑÇ αñ¼αñ╛αñ░αñ┐αñ╢ αñòαÑÇ αñ¡αñ╡αñ┐αñ╖αÑìαñ»αñ╡αñ╛αñúαÑÇαÑñ αñ╕αñ┐αñéαñÜαñ╛αñê αñ░αÑïαñòαÑçαñé αñöαñ░ αñòαñƒαÑÇ αñ╣αÑüαñê αñ½αñ╕αñ▓αÑïαñé αñòαÑÇ αñ░αñòαÑìαñ╖αñ╛ αñòαñ░αÑçαñéαÑñ',
    heat_alert: 'αñ▓αÑé αñòαÑÇ αñÜαÑçαññαñ╛αñ╡αñ¿αÑÇ: αñàαññαÑìαñ»αñºαñ┐αñò αñ▓αÑé αñòαÑÇ αñÜαÑçαññαñ╛αñ╡αñ¿αÑÇαÑñ αñ╕αÑéαñûαñ¿αÑç αñ╕αÑç αñ¼αñÜαñ╛αñ¿αÑç αñòαÑç αñ▓αñ┐αñÅ αñ½αñ╕αñ▓ αñòαÑÇ αñ¿αñ┐αñ»αñ«αñ┐αññ αñ╕αñ┐αñéαñÜαñ╛αñê αñòαñ░αÑçαñéαÑñ',
    frost_alert: 'αñ¬αñ╛αñ▓αñ╛ αñÜαÑçαññαñ╛αñ╡αñ¿αÑÇ: αñ╕αñéαñ¡αñ╛αñ╡αñ┐αññ αñ¬αñ╛αñ▓αñ╛ αñòαÑìαñ╖αññαñ┐αÑñ αñ╕αÑüαñ░αñòαÑìαñ╖αñ╛αññαÑìαñ«αñò αñëαñ¬αñ╛αñ» αñòαñ░αÑçαñéαÑñ',
    wind_alert: 'αññαÑçαñ£ αñ╣αñ╡αñ╛ αñòαÑÇ αñÜαÑçαññαñ╛αñ╡αñ¿αÑÇ: αññαÑçαñ£ αñ╣αñ╡αñ╛αñÅαñé αñÜαñ▓αñ¿αÑç αñòαÑÇ αñåαñ╢αñéαñòαñ╛αÑñ αñòαÑÇαñƒαñ¿αñ╛αñ╢αñò αñ¢αñ┐αñíαñ╝αñòαñ╛αñ╡ αñ╕αÑìαñÑαñùαñ┐αññ αñòαñ░αÑçαñéαÑñ',
    adv_rain: (crop) => `• αñ╕αñ┐αñéαñÜαñ╛αñê: αñ£αñ▓αñ¡αñ░αñ╛αñ╡ αñ╕αÑç αñ¼αñÜαñ¿αÑç αñòαÑç αñ▓αñ┐αñÅ ${crop} αñòαÑÇ αñ╕αñ┐αñéαñÜαñ╛αñê αñ░αÑïαñòαÑçαñéαÑñ\n• αñ¢αñ┐αñíαñ╝αñòαñ╛αñ╡: αñòαÑÇαñƒαñ¿αñ╛αñ╢αñò αñòαñ╛ αñ¢αñ┐αñíαñ╝αñòαñ╛αñ╡ αñ¿ αñòαñ░αÑçαñé αñòαÑìαñ»αÑïαñéαñòαñ┐ αñ»αñ╣ αñºαÑüαñ▓ αñ£αñ╛αñÅαñùαñ╛αÑñ\n• αñòαñƒαñ╛αñê: αñòαñƒαÑÇ αñ╣αÑüαñê αñ½αñ╕αñ▓ αñòαÑï αññαÑüαñ░αñéαññ αñ╕αÑéαñûαÑç αñ╕αÑìαñÑαñ╛αñ¿ αñ¬αñ░ αñ▓αÑç αñ£αñ╛αñÅαñéαÑñ`,
    adv_wind: (crop) => `• αñ╕αñ┐αñéαñÜαñ╛αñê: αñ╕αñ╛αñ«αñ╛αñ¿αÑìαñ» αñ╕αñ┐αñéαñÜαñ╛αñê αñòαÑÇ αñåαñ╡αñ╢αÑìαñ»αñòαññαñ╛ αñ╣αÑêαÑñ\n• αñ¢αñ┐αñíαñ╝αñòαñ╛αñ╡: αññαÑçαñ£ αñ╣αñ╡αñ╛ αñòαÑç αñòαñ╛αñ░αñú αñòαÑÇαñƒαñ¿αñ╛αñ╢αñò αñ¢αñ┐αñíαñ╝αñòαñ╛αñ╡ αñ╕αÑìαñÑαñùαñ┐αññ αñòαñ░αÑçαñéαÑñ\n• αñòαñƒαñ╛αñê: αñ½αñ╕αñ▓ αñåαñ╢αÑìαñ░αñ»αÑïαñé αñòαÑï αñ╕αÑüαñ░αñòαÑìαñ╖αñ┐αññ αñòαñ░αÑçαñéαÑñ`,
    adv_humidity: (crop) => `• αñ╕αñ┐αñéαñÜαñ╛αñê: αñ£αñ▓ αñ¿αñ┐αñòαñ╛αñ╕αÑÇ αñÜαÑêαñ¿αñ▓αÑïαñé αñòαÑï αñÜαñ╛αñ▓αÑé αñ░αñûαÑçαñéαÑñ\n• αñ¢αñ┐αñíαñ╝αñòαñ╛αñ╡: αñëαñÜαÑìαñÜ αñòαñ╡αñò αñ£αÑïαñûαñ┐αñ«, αñ¬αÑìαñ░αñúαñ╛αñ▓αÑÇαñùαññ αñòαñ╡αñòαñ¿αñ╛αñ╢αÑÇ αñòαñ╛ αñ¢αñ┐αñíαñ╝αñòαñ╛αñ╡ αñòαñ░αÑçαñéαÑñ\n• αñòαñƒαñ╛αñê: αñòαñƒαÑÇ αñ╣αÑüαñê αñ½αñ╕αñ▓ αñòαÑï αñàαñÜαÑìαñ¢αÑÇ αññαñ░αñ╣ αñ╕αÑüαñûαñ╛αñÅαñéαÑñ`,
    adv_default: (crop) => `• αñ╕αñ┐αñéαñÜαñ╛αñê: αñ«αñ╛αñ¿αñò αñíαÑìαñ░αñ┐αñ¬ αñ╕αñ┐αñéαñÜαñ╛αñê αñÜαñòαÑìαñ░ αñòαñ╛ αñ¬αñ╛αñ▓αñ¿ αñòαñ░αÑçαñéαÑñ\n• αñ¢αñ┐αñíαñ╝αñòαñ╛αñ╡: αñëαñ░αÑìαñ╡αñ░αñò/αñòαÑÇαñƒαñ¿αñ╛αñ╢αñò αñ¢αñ┐αñíαñ╝αñòαñ╛αñ╡ αñòαÑç αñ▓αñ┐αñÅ αñ«αÑîαñ╕αñ« αñàαñ¿αÑüαñòαÑéαñ▓ αñ╣αÑêαÑñ\n• αñòαñƒαñ╛αñê: αñ½αñ╕αñ▓ αñòαÑÇ αñòαñƒαñ╛αñê αñòαñ░αñ¿αñ╛ αñ╕αÑüαñ░αñòαÑìαñ╖αñ┐αññ αñ╣αÑêαÑñ`
  },
  ta: {
    rain_alert: 'α«òα«⌐α««α«┤α»ê α«Äα«Üα»ìα«Üα«░α«┐α«òα»ìα«òα»ê: α«òα«⌐α««α«┤α»ê α«¬α»åα«»α»ìα«»α«òα»ìα«òα»éα«ƒα»üα««α»ì. α«¬α«╛α«Üα«⌐α«ñα»ìα«ñα»êα«ñα»ì α«ñα«╡α«┐α«░α»ìα«ñα»ìα«ñα»ü, α«àα«▒α»üα«╡α«ƒα»ê α«Üα»åα«»α»ìα«ñ α«¬α«»α«┐α«░α»ìα«òα«│α»êα«¬α»ì α«¬α«╛α«ñα»üα«òα«╛α«òα»ìα«òα«╡α»üα««α»ì.',
    heat_alert: 'α«╡α»åα«¬α»ìα«¬ α«àα«▓α»ê α«Äα«Üα»ìα«Üα«░α«┐α«òα»ìα«òα»ê: α«òα«ƒα»üα««α»êα«»α«╛α«⌐ α«╡α»åα«¬α»ìα«¬ α«àα«▓α»ê α«Äα«Üα»ìα«Üα«░α«┐α«òα»ìα«òα»ê. α«¬α«»α«┐α«░α»ì α«╡α«╛α«ƒα»üα«╡α«ñα»êα«ñα»ì α«ñα«ƒα»üα«òα»ìα«ò α«╡α«┤α«òα»ìα«òα««α«╛α«ò α«¿α»Çα«░α»ì α«¬α«╛α«»α»ìα«Üα»ìα«Üα«╡α»üα««α»ì.',
    frost_alert: 'α«¬α«⌐α«┐ α«Äα«Üα»ìα«Üα«░α«┐α«òα»ìα«òα»ê: α«¬α«»α«┐α«░α»ì α«¬α«⌐α«┐ α«Üα»çα«ñα««α«ƒα»êα«» α«╡α«╛α«»α»ìα«¬α»ìα«¬α»üα«│α»ìα«│α«ñα»ü. α«¬α«╛α«ñα»üα«òα«╛α«¬α»ìα«¬α»ü α«¿α«ƒα«╡α«ƒα«┐α«òα»ìα«òα»êα«òα«│α»ê α«Äα«ƒα»üα«òα»ìα«òα«╡α»üα««α»ì.',
    wind_alert: 'α«¬α«▓α«ñα»ìα«ñ α«òα«╛α«▒α»ìα«▒α»ü α«Äα«Üα»ìα«Üα«░α«┐α«òα»ìα«òα»ê: α«àα«ñα«┐α«╡α»çα«ò α«òα«╛α«▒α»ìα«▒α»ü α«╡α»Çα«Üα«òα»ìα«òα»éα«ƒα»üα««α»ì. α«¬α»éα«Üα»ìα«Üα«┐α«òα»ìα«òα»èα«▓α»ìα«▓α«┐ α«ñα»åα«│α«┐α«¬α»ìα«¬α«ñα»êα«ñα»ì α«ñα«│α»ìα«│α«┐α«¬α»ìα«¬α»ïα«ƒα«╡α»üα««α»ì.',
    adv_rain: (crop) => `• α«¿α»Çα«░α»ìα«¬α»ìα«¬α«╛α«Üα«⌐α««α»ì: α«ñα»çα«òα»ìα«òα«ñα»ìα«ñα»êα«ñα»ì α«ñα«ƒα»üα«òα»ìα«ò ${crop} α«¬α«»α«┐α«░α»üα«òα»ìα«òα»ü α«¿α»Çα«░α»ì α«¬α«╛α«»α»ìα«Üα»ìα«Üαºüα«╡α«ñα»êα«ñα»ì α«ñα«╡α«┐α«░α»ìα«òα»ìα«òα«╡α»üα««α»ì.\n• α«ñα»åα«│α«┐α«ñα»ìα«ñα«▓α»ì: α«¬α»éα«Üα»ìα«Üα«┐α«òα»ìα«òα»èα«▓α»ìα«▓α«┐ α««α«░α»üα«¿α»ìα«ñα»ü α«ñα»åα«│α«┐α«òα»ìα«ò α«╡α»çα«úα»ìα«ƒα«╛α««α»ì, α«àα«ñα»ü α«òα«░α»êα«¿α»ìα«ñα»üα«╡α«┐α«ƒα»üα««α»ì.\n• α«àα«▒α»üα«╡α«ƒα»ê: α«àα«▒α»üα«╡α«ƒα»ê α«Üα»åα«»α»ìα«ñ α«¬α«»α«┐α«░α»ìα«òα«│α»ê α«ëα«ƒα«⌐α«ƒα«┐α«»α«╛α«ò α«ëα«▓α«░α»ìα«¿α»ìα«ñ α«Üα»çα┤«α┤┐α«¬α»ìα«¬α»üα«òα»ìα«òα»ü α««α«╛α«▒α»ìα«▒α«╡α»üα««α»ì.`,
    adv_wind: (crop) => `• α«¿α»Çα«░α»ìα«¬α»ìα«¬α«╛α«Üα«⌐α««α»ì: α«Üα«╛α«ñα«╛α«░α«ú α«¿α»Çα«░α»ìα«¬α»ìα«¬α«╛α«Üα«⌐α««α»ì α«ñα»çα«╡α»ê.\n• α«ñα»åα«│α«┐α«ñα»ìα«ñα«▓α»ì: α«òα«╛α«▒α»ìα«▒α»ü α«òα«╛α«░α«úα««α«╛α«ò α«¬α»éα«Üα»ìα«Üα«┐α«òα»ìα«òα»èα«▓α»ìα«▓α«┐ α«ñα»åα«│α«┐α«¬α»ìα«¬α«ñα»êα«ñα»ì α«ñα«│α»ìα«│α«┐α«¬α»ìα«¬α»ïα«ƒα«╡α»üα««α»ì.\n• α«àα«▒α»üα«╡α«ƒα»ê: α«¬α«»α«┐α«░α»ì α«åα«ñα«░α«╡α»ü α«òα«ƒα»ìα«ƒα««α»êα«¬α»ìα«¬α»üα«òα«│α»êα«¬α»ì α«¬α«╛α«ñα»üα«òα«╛α«òα»ìα«òα«╡α»üα««α»ì.`,
    adv_humidity: (crop) => `• α«¿α»Çα«░α»ìα«¬α»ìα«¬α«╛α«Üα«⌐α««α»ì: α«╡α«ƒα«┐α«òα«╛α«▓α»ì α«╡α«╛α«»α»ìα«òα»ìα«òα«╛α«▓α»ìα«òα«│α»êα«Üα»ì α«Üα»åα«»α«▓α»ìα«¬α«╛α«ƒα»ìα«ƒα«┐α«▓α»ì α«╡α»êα«òα»ìα«òα«╡α»üα««α»ì.\n• α«ñα»åα«│α«┐α«ñα»ìα«ñα«▓α»ì: α«¬α»éα«₧α»ìα«Üα»ê α«ñα»èα«▒α»ìα«▒α»ü α«àα«¬α«╛α«»α««α»ì α«àα«ñα«┐α«òα««α»ì, α«¬α»éα«₧α»ìα«Üα»êα«òα»ì α«òα»èα«▓α»ìα«▓α«┐α«»α»êα«ñα»ì α«ñα»åα«│α«┐α«òα»ìα«òα«╡α»üα««α»ì.\n• α«àα«▒α»üα«╡α«ƒα»ê: α«╡α«┐α«│α»êα«Üα»ìα«Üα«▓α»ê α«¿α«⌐α»ìα«òα»ü α«ëα«▓αª░ α«╡α»êα«òα»ìα«òα«╡α»üα««α»ì.`,
    adv_default: (crop) => `• α«¿α»Çα«░α»ìα«¬α»ìα«¬α«╛α«Üα«⌐α««α»ì: α«¿α«┐α«▓α»êα«»α«╛α«⌐ α«Üα»èα«ƒα»ìα«ƒα»ü α«¿α»Çα«░α»ì α«¬α«╛α«Üα«⌐α«ñα»ìα«ñα»êα«ñα»ì α«ñα»èα«ƒα«░α«╡α»üα««α»ì.\n• α«ñα»åα«│α«┐α«ñα»ìα«ñα«▓α»ì: α«ëα«░α««α»ì/α«¬α»éα«Üα»ìα«Üα«┐ α««α«░α»üα«¿α»ìα«ñα»ü α«ñα»åα«│α«┐α«òα»ìα«ò α«╡α«╛α«⌐α«┐α«▓α»ê α«Üα«╛α«ñα«òα««α«╛α«ò α«ëα«│α»ìα«│α«ñα»ü.\n• α«àα«▒α»üα«╡α«ƒα»ê: α«¬α«»α«┐α«░α»ê α«àα«▒α»üα«╡α«ƒα»ê α«Üα»åα«»α»ìα«» α«çα«ñα»ü α«Üα«░α«┐α«»α«╛α«⌐ α«¿α»çα«░α««α»ì.`
  },
  kn: {
    rain_alert: 'α▓¡α▓╛α▓░α│Ç α▓«α▓│α│å α▓«α│üα▓¿α│ìα▓¿α│åα▓Üα│ìα▓Üα▓░α▓┐α▓òα│å: α▓¡α▓╛α▓░α│Ç α▓«α▓│α│åα▓» α▓«α│üα▓¿α│ìα▓╕α│éα▓Üα▓¿α│å. α▓¿α│Çα▓░α▓╛α▓╡α▓░α▓┐α▓»α▓¿α│ìα▓¿α│ü α▓¿α▓┐α▓▓α│ìα▓▓α▓┐α▓╕α▓┐ α▓«α▓ñα│ìα▓ñα│ü α▓òα▓ƒα▓╛α▓╡α│ü α▓«α▓╛α▓íα▓┐α▓ª α▓¼α│åα▓│α│åα▓ùα▓│α▓¿α│ìα▓¿α│ü α▓░α▓òα│ìα▓╖α▓┐α▓╕α▓┐.',
    heat_alert: 'α▓¼α▓┐α▓╕α▓┐α▓ùα▓╛α▓│α▓┐ α▓«α│üα▓¿α│ìα▓¿α│åα▓Üα│ìα▓Üα▓░α▓┐α▓òα│å: α▓ñα│Çα▓╡α│ìα▓░ α▓¼α▓┐α▓╕α▓┐α▓ùα▓╛α▓│α▓┐ α▓«α│üα▓¿α│ìα▓¿α│åα▓Üα│ìα▓Üα▓░α▓┐α▓òα│å. α▓¼α│åα▓│α│å α▓Æα▓úα▓ùα▓ªα▓éα▓ñα│å α▓¿α▓┐α▓»α▓«α▓┐α▓ñα▓╡α▓╛α▓ùα▓┐ α▓¿α│Çα▓░α│üα▓úα▓┐α▓╕α▓┐.',
    frost_alert: 'α▓╣α▓┐α▓« α▓«α│üα▓¿α│ìα▓¿α│åα▓Üα│ìα▓Üα▓░α▓┐α▓òα│å: α▓╣α▓┐α▓«α▓ªα▓┐α▓éα▓ª α▓¼α│åα▓│α│å α▓╣α▓╛α▓¿α▓┐α▓»α▓╛α▓ùα│üα▓╡ α▓╕α▓╛α▓ºα│ìα▓»α▓ñα│å. α▓░α▓òα│ìα▓╖α▓úα▓╛α▓ñα│ìα▓«α▓ò α▓òα│ìα▓░α▓«α▓ùα▓│α▓¿α│ìα▓¿α│ü α▓òα│êα▓ùα│èα▓│α│ìα▓│α▓┐.',
    wind_alert: 'α▓¼α▓▓α▓╡α▓╛α▓ª α▓ùα▓╛α▓│α▓┐ α▓«α│üα▓¿α│ìα▓¿α│åα▓Üα│ìα▓Üα▓░α▓┐α▓òα│å: α▓¼α▓┐α▓░α│üα▓ùα▓╛α▓│α▓┐ α▓¼α│Çα▓╕α│üα▓╡ α▓╕α▓╛α▓ºα│ìα▓»α▓ñα│å. α▓òα│Çα▓ƒα▓¿α▓╛α▓╢α▓ò α▓╕α▓┐α▓éα▓¬α▓íα▓úα│åα▓»α▓¿α│ìα▓¿α│ü α▓«α│üα▓éα▓ªα│éα▓íα▓┐.',
    adv_rain: (crop) => `• α▓¿α│Çα▓░α▓╛α▓╡α▓░α▓┐: α▓¿α│Çα▓░α│ü α▓¿α▓┐α▓▓α│ìα▓▓α▓ªα▓éα▓ñα│å α▓ñα▓íα│åα▓»α▓▓α│ü ${crop} α▓¼α│åα▓│α│åα▓ùα│å α▓¿α│Çα▓░α│üα▓úα▓┐α▓╕α│üα▓╡α│üα▓ªα▓¿α│ìα▓¿α│ü α▓¿α▓┐α▓▓α│ìα▓▓α▓┐α▓╕α▓┐.\n• α▓╕α▓┐α▓éα▓¬α▓íα▓úα│å: α▓«α▓│α│åα▓ùα│å α▓ñα│èα▓│α│åα▓ªα│ü α▓╣α│ïα▓ùα│üα▓╡α│üα▓ªα▓░α▓┐α▓éα▓ª α▓òα│Çα▓ƒα▓¿α▓╛α▓╢α▓ò α▓╕α▓┐α▓éα▓¬α▓íα▓┐α▓╕α▓¼α│çα▓íα▓┐.\n• α▓òα▓ƒα▓╛α▓╡α│ü: α▓òα▓ƒα▓╛α▓╡α│ü α▓«α▓╛α▓íα▓┐α▓ª α▓¼α│åα▓│α│åα▓»α▓¿α│ìα▓¿α│ü α▓ñα▓òα│ìα▓╖α▓úα▓╡α│ç α▓Æα▓úα▓ùα▓┐α▓ª α▓ªα▓╛α▓╕α│ìα▓ñα▓╛α▓¿α│ü α▓òα│èα▓áα▓íα▓┐α▓ùα│å α▓╕α│ìα▓Ñα▓│α▓╛α▓éα▓ñα▓░α▓┐α▓╕α▓┐.`,
    adv_wind: (crop) => `• α▓¿α│Çα▓░α▓╛α▓╡α▓░α▓┐: α▓╕α▓╛α▓«α▓╛α▓¿α│ìα▓» α▓¿α│Çα▓░α▓╛α▓╡α▓░α▓┐ α▓àα▓ùα▓ñα│ìα▓»α▓╡α▓┐α▓ªα│å.\n• α▓╕α▓┐α▓éα▓¬α▓íα▓úα│å: α▓¼α▓┐α▓░α│üα▓ùα▓╛α▓│α▓┐ α▓çα▓░α│üα▓╡α│üα▓ªα▓░α▓┐α▓éα▓ª α▓òα│Çα▓ƒα▓¿α▓╛α▓╢α▓ò α▓╕α▓┐α▓éα▓¬α▓íα▓úα│åα▓»α▓¿α│ìα▓¿α│ü α▓«α│üα▓éα▓ªα│éα▓íα▓┐.\n• α▓òα▓ƒα▓╛α▓╡α│ü: α▓¼α│åα▓│α│å α▓åα▓╢α│ìα▓░α▓» α▓░α▓Üα▓¿α│åα▓ùα▓│α▓¿α│ìα▓¿α│ü α▓¡α▓ªα│ìα▓░α▓¬α▓íα▓┐α▓╕α▓┐.`,
    adv_humidity: (crop) => `• α▓¿α│Çα▓░α▓╛α▓╡α▓░α▓┐: α▓¿α│Çα▓░α│ü α▓╣α▓░α▓┐α▓ªα│üα▓╣α│ïα▓ùα│üα▓╡ α▓òα▓╛α▓▓α│üα▓╡α│åα▓ùα▓│α▓¿α│ìα▓¿α│ü α▓╕α▓òα│ìα▓░α▓┐α▓»α▓╡α▓╛α▓ùα▓┐α▓íα▓┐.\n• α▓╕α▓┐α▓éα▓¬α▓íα▓úα│å: α▓╢α▓┐α▓▓α│Çα▓éα▓ºα│ìα▓░ α▓¼α▓╛α▓ºα│åα▓» α▓àα▓¬α▓╛α▓» α▓╣α│åα▓Üα│ìα▓Üα│ü, α▓╢α▓┐α▓▓α│Çα▓éα▓ºα│ìα▓░α▓¿α▓╛α▓╢α▓ò α▓╕α▓┐α▓éα▓¬α▓íα▓┐α▓╕α▓┐.\n• α▓òα▓ƒα▓╛α▓╡α│ü: α▓çα▓│α│üα▓╡α▓░α▓┐α▓»α▓¿α│ìα▓¿α│ü α▓Üα│åα▓¿α│ìα▓¿α▓╛α▓ùα▓┐ α▓Æα▓úα▓ùα▓┐α▓╕α▓┐.`,
    adv_default: (crop) => `• α▓¿α│Çα▓░α▓╛α▓╡α▓░α▓┐: α▓¬α│ìα▓░α▓«α▓╛α▓úα▓┐α▓ñ α▓╣α▓¿α▓┐ α▓¿α│Çα▓░α▓╛α▓╡α▓░α▓┐ α▓Üα▓òα│ìα▓░α▓╡α▓¿α│ìα▓¿α│ü α▓«α│üα▓éα▓ªα│üα▓╡α▓░α▓┐α▓╕α▓┐.\n• α▓╕α▓┐α▓éα▓¬α▓íα▓úα│å: α▓ùα│èα▓¼α│ìα▓¼α▓░/α▓òα│Çα▓ƒα▓¿α▓╛α▓╢α▓ò α▓╕α▓┐α▓éα▓¬α▓íα▓úα│åα▓ùα│å α▓╣α▓╡α▓╛α▓«α▓╛α▓¿α▓╡α│ü α▓ëα▓ñα│ìα▓ñα▓«α▓╡α▓╛α▓ùα▓┐α▓ªα│å.\n• α▓òα▓ƒα▓╛α▓╡α│ü: α▓¼α│åα▓│α│åα▓»α▓¿α│ìα▓¿α│ü α▓òα▓ƒα▓╛α▓╡α│ü α▓«α▓╛α▓íα▓▓α│ü α▓êα▓ù α▓╕α│üα▓░α▓òα│ìα▓╖α▓┐α▓ñα▓╡α▓╛α▓ùα▓┐α▓ªα│å.`
  },
  mr: {
    rain_alert: 'αñ«αÑüαñ╕αñ│αñºαñ╛αñ░ αñ¬αñ╛αñ╡αñ╕αñ╛αñÜαñ╛ αñçαñ╢αñ╛αñ░αñ╛: αñ«αÑüαñ╕αñ│αñºαñ╛αñ░ αñ¬αñ╛αñ╡αñ╕αñ╛αñÜαñ╛ αñàαñéαñªαñ╛αñ£. αñ╕αñ┐αñéαñÜαñ¿ αñÑαñ╛αñéαñ¼αñ╡αñ╛ αñåαñúαñ┐ αñòαñ╛αñóαñúαÑÇ αñòαÑçαñ▓αÑçαñ▓αÑç αñ¬αÑÇαñò αñ╕αÑüαñ░αñòαÑìαñ╖αñ┐αññ αñáαÑçαñ╡αñ╛.',
    heat_alert: 'αñëαñ╖αÑìαñúαññαÑçαñÜαÑìαñ»αñ╛ αñ▓αñ╛αñƒαÑçαñÜαñ╛ αñçαñ╢αñ╛αñ░αñ╛: αññαÑÇαñ╡αÑìαñ░ αñëαñ╖αÑìαñúαññαÑçαñÜαÑÇ αñ▓αñ╛αñƒ. αñ¬αÑÇαñò αñ╕αÑüαñòαÑé αñ¿αñ»αÑç αñ«αÑìαñ╣αñúαÑéαñ¿ αñ¿αñ┐αñ»αñ«αñ┐αññ αñ¬αñ╛αñúαÑÇ αñªαÑìαñ»αñ╛.',
    frost_alert: 'αñÑαñéαñíαÑÇαñÜαñ╛ αñçαñ╢αñ╛αñ░αñ╛: αñ¬αñ┐αñòαñ╛αñéαñÜαÑç αñ¿αÑüαñòαñ╕αñ╛αñ¿ αñ╣αÑïαñúαÑìαñ»αñ╛αñÜαÑÇ αñ╢αñòαÑìαñ»αññαñ╛. αñ╕αñéαñ░αñòαÑìαñ╖αñúαñ╛αññαÑìαñ«αñò αñëαñ¬αñ╛αñ»αñ»αÑïαñ£αñ¿αñ╛ αñòαñ░αñ╛.',
    wind_alert: 'αñ╡αñ╛αñªαñ│αÑÇ αñ╡αñ╛αñ▒αÑìαñ»αñ╛αñÜαñ╛ αñçαñ╢αñ╛αñ░αñ╛: αñ╡αñ╛αñªαñ│αÑÇ αñ╡αñ╛αñ░αÑç αñ╡αñ╛αñ╣αñúαÑìαñ»αñ╛αñÜαÑÇ αñ╢αñòαÑìαñ»αññαñ╛. αñòαÑÇαñƒαñòαñ¿αñ╛αñ╢αñò αñ½αñ╡αñ╛αñ░αñúαÑÇ αñ¬αÑüαñóαÑç αñóαñòαñ▓αñ╛.',
    adv_rain: (crop) => `• αñ╕αñ┐αñéαñÜαñ¿: αñªαñ▓αñªαñ▓ αñƒαñ╛αñ│αñúαÑìαñ»αñ╛αñ╕αñ╛αñáαÑÇ ${crop} αñ¬αñ┐αñòαñ╛αñ▓αñ╛ αñ¬αñ╛αñúαÑÇ αñªαÑçαñúαÑç αñÑαñ╛αñéαñ¼αñ╡αñ╛.\n• αñ½αñ╡αñ╛αñ░αñúαÑÇ: αñòαÑÇαñƒαñòαñ¿αñ╛αñ╢αñò αñ½αñ╡αñ╛αñ░αÑé αñ¿αñòαñ╛ αñòαñ╛αñ░αñú αññαÑç αñ╡αñ╛αñ╣αÑéαñ¿ αñ£αñ╛αñêαñ▓.\n• αñòαñ╛αñóαñúαÑÇ: αñòαñ╛αñóαñúαÑÇ αñòαÑçαñ▓αÑçαñ▓αÑç αñ¬αÑÇαñò αñ▓αñùαÑçαñÜ αñòαÑïαñ░αñíαÑìαñ»αñ╛ αñ╕αñ╛αñáαñ╡αñúαÑüαñòαÑÇαñÜαÑìαñ»αñ╛ αñ£αñ╛αñùαÑÇ αñ╣αñ▓αñ╡αñ╛.`,
    adv_wind: (crop) => `• αñ╕αñ┐αñéαñÜαñ¿: αñ╕αñ╛αñ«αñ╛αñ¿αÑìαñ» αñ╕αñ┐αñéαñÜαñ¿αñ╛αñÜαÑÇ αñåαñ╡αñ╢αÑìαñ»αñòαññαñ╛ αñåαñ╣αÑç.\n• αñ½αñ╡αñ╛αñ░αñúαÑÇ: αñ╡αñ╛αñ▒αÑìαñ»αñ╛αñÜαÑìαñ»αñ╛ αñ╡αÑçαñùαñ╛αñ«αÑüαñ│αÑç αñòαÑÇαñƒαñòαñ¿αñ╛αñ╢αñò αñ½αñ╡αñ╛αñ░αñúαÑÇ αñ¬αÑüαñóαÑç αñóαñòαñ▓αñ╛.\n• αñòαñ╛αñóαñúαÑÇ: αñ¬αñ┐αñòαñ╛αñéαñÜαÑç αñ¿αñ┐αñ╡αñ╛αñ░αÑç αñ╕αÑüαñ░αñòαÑìαñ╖αñ┐αññ αñòαñ░αñ╛.`,
    adv_humidity: (crop) => `• αñ╕αñ┐αñéαñÜαñ¿: αñ¬αñ╛αñúαÑìαñ»αñ╛αñÜαñ╛ αñ¿αñ┐αñÜαñ░αñ╛ αñ╣αÑïαñúαñ╛αñ░αÑç αñ«αñ╛αñ░αÑìαñù αñ«αÑïαñòαñ│αÑç αñáαÑçαñ╡αñ╛.\n• αñ½αñ╡αñ╛αñ░αñúαÑÇ: αñ¼αÑüαñ░αñ╢αÑÇαñ£αñ¿αÑìαñ» αñ░αÑïαñùαñ╛αñÜαñ╛ αñ£αñ╛αñ╕αÑìαññ αñºαÑïαñòαñ╛, αñ¼αÑüαñ░αñ╢αÑÇαñ¿αñ╛αñ╢αñò αñ½αñ╡αñ╛αñ░αñ╛.\n• αñòαñ╛αñóαñúαÑÇ: αñòαñ╛αñóαñúαÑÇ αñòαÑçαñ▓αÑçαñ▓αÑç αñ¬αÑÇαñò αñÜαñ╛αñéαñùαñ▓αÑç αñ╡αñ╛αñ│αñ╡αñ╛.`,
    adv_default: (crop) => `• αñ╕αñ┐αñéαñÜαñ¿: αñáαñ┐αñ¼αñò αñ╕αñ┐αñéαñÜαñ¿αñ╛αñÜαñ╛ αñ╡αñ╛αñ¬αñ░ αñ╕αÑüαñ░αÑé αñáαÑçαñ╡αñ╛.\n• αñ½αñ╡αñ╛αñ░αñúαÑÇ: αñûαññ/αñòαÑÇαñƒαñòαñ¿αñ╛αñ╢αñò αñ½αñ╡αñ╛αñ░αñúαÑÇαñ╕αñ╛αñáαÑÇ αñ╣αñ╡αñ╛αñ«αñ╛αñ¿ αñàαñ¿αÑüαñòαÑéαñ▓ αñåαñ╣αÑç.\n• αñòαñ╛αñóαñúαÑÇ: αñ¬αñ┐αñòαñ╛αñÜαÑÇ αñòαñ╛αñóαñúαÑÇ αñòαñ░αñúαÑç αñåαññαñ╛ αñ╕αÑüαñ░αñòαÑìαñ╖αñ┐αññ αñåαñ╣αÑç.`
  },
  gu: {
    rain_alert: 'α¬¡α¬╛α¬░α½ç α¬╡α¬░α¬╕α¬╛α¬ªα¬¿α½Ç α¬Üα½çα¬ñα¬╡α¬úα½Ç: α¬¡α¬╛α¬░α½ç α¬╡α¬░α¬╕α¬╛α¬ªα¬¿α½Ç α¬åα¬ùα¬╛α¬╣α½Ç. α¬╕α¬┐α¬éα¬Üα¬╛α¬ê α¬«α½üα¬▓α¬ñα¬╡α½Ç α¬░α¬╛α¬ûα½ï α¬àα¬¿α½ç α¬▓α¬úα¬úα½Ç α¬òα¬░α½çα¬▓ α¬¬α¬╛α¬òα¬¿α½ç α¬╕α½üα¬░α¬òα½ìα¬╖α¬┐α¬ñ α¬òα¬░α½ï.',
    heat_alert: 'α¬╣α½Çα¬ƒ α¬╡α½çα¬╡α¬¿α½Ç α¬Üα½çα¬ñα¬╡α¬úα½Ç: α¬àα¬ñα¬┐α¬╢α¬» α¬ùα¬░α¬«α½Çα¬¿α½Ç α¬Üα½çα¬ñα¬╡α¬úα½Ç. α¬¬α¬╛α¬òα¬¿α½ç α¬╕α½üα¬òα¬╛α¬ê α¬£α¬ñα½ï α¬¼α¬Üα¬╛α¬╡α¬╡α¬╛ α¬¿α¬┐α¬»α¬«α¬┐α¬ñ α¬╕α¬┐α¬éα¬Üα¬╛α¬ê α¬òα¬░α½ï.',
    frost_alert: 'α¬¥α¬╛α¬òα¬│/α¬¼α¬░α¬½α¬¿α½Ç α¬Üα½çα¬ñα¬╡α¬úα½Ç: α¬¬α¬╛α¬òα¬¿α½ç α¬¿α½üα¬òα¬╕α╕▓α╕Ö α¬Ñα¬╡α¬╛α¬¿α½Ç α¬╕α¬éα¬¡α¬╛α¬╡α¬¿α¬╛. α¬░α¬òα½ìα¬╖α¬úα¬╛α¬ñα½ìα¬«α¬ò α¬¬α¬ùα¬▓α¬╛α¬é α¬▓α½ï.',
    wind_alert: 'α¬ñα½çα¬£ α¬¬α¬╡α¬¿α¬¿α½Ç α¬Üα½çα¬ñα¬╡α¬úα½Ç: α¬ñα½çα¬£ α¬¬α¬╡α¬¿ α¬½α½éα¬éα¬òα¬╛α¬╡α¬╛α¬¿α½Ç α¬╢α¬òα½ìα¬»α¬ñα¬╛. α¬£α¬éα¬ñα½üα¬¿α¬╛α¬╢α¬ò α¬¢α¬éα¬ƒα¬òα¬╛α¬╡ α¬«α½ïα¬òα½éα¬½ α¬░α¬╛α¬ûα½ï.',
    adv_rain: (crop) => `• α¬╕α¬┐α¬éα¬Üα¬╛α¬ê: α¬¬α¬╛α¬úα½Ç α¬¡α¬░α¬╛α¬ê α¬£α¬╡α¬╛α¬Ñα½Ç α¬¼α¬Üα¬╡α¬╛ α¬«α¬╛α¬ƒα½ç ${crop} α¬¬α¬╛α¬òα¬«α¬╛α¬é α¬¬α¬╛α¬úα½Ç α¬åα¬¬α¬╡α¬╛α¬¿α½üα¬é α¬¼α¬éα¬º α¬òα¬░α½ï.\n• α¬¢α¬éα¬ƒα¬òα¬╛α¬╡: α¬£α¬éα¬ñα½üα¬¿α¬╛α¬╢α¬òα½ïα¬¿α½ï α¬¢α¬éα¬ƒα¬òα¬╛α¬╡ α¬òα¬░α¬╢α½ï α¬¿α¬╣α½Çα¬é α¬òα¬╛α¬░α¬ú α¬òα½ç α¬ñα½ç α¬ºα½ïα¬╡α¬╛α¬ê α¬£α¬╢α½ç.\n• α¬▓α¬úα¬úα½Ç: α¬▓α¬úα¬úα½Ç α¬òα¬░α½çα¬▓ α¬¬α¬╛α¬òα¬¿α½ç α¬ñα¬╛α¬ñα½ìα¬òα¬╛α¬▓α¬┐α¬ò α¬╕α½éα¬òα½Ç α¬£α¬ùα½ìα¬»α¬╛α¬Å α¬ûα¬╕α½çα¬íα½ï.`,
    adv_wind: (crop) => `• α¬╕α¬┐α¬éα¬Üα¬╛α¬ê: α¬╕α¬╛α¬«α¬╛α¬¿α½ìα¬» α¬¬α¬┐α¬»α¬ñα¬¿α½Ç α¬£α¬░α½éα¬░α¬┐α¬»α¬╛α¬ñ α¬¢α½ç.\n• α¬¢α¬éα¬ƒα¬òα¬╛α¬╡: α¬¬α¬╡α¬¿α¬¿α¬╛ α¬òα¬╛α¬░α¬úα½ç α¬£α¬éα¬ñα½üα¬¿α¬╛α¬╢α¬ò α¬¢α¬éα¬ƒα¬òα¬╛α¬╡ α¬«α½ïα¬òα½éα¬½ α¬░α¬╛α¬ûα½ï.\n• α¬▓α¬úα¬úα½Ç: α¬¬α¬╛α¬òα¬¿α¬╛ α¬åα¬╢α½ìα¬░α¬»α¬╕α½ìα¬Ñα¬╛α¬¿α½ïα¬¿α½ç α¬«α¬£α¬¼α½éα¬ñ α¬òα¬░α½ï.`,
    adv_humidity: (crop) => `• α¬╕α¬┐α¬éα¬Üα¬╛α¬ê: α¬¿α¬┐α¬òα¬╛α¬╕ α¬Üα½çα¬¿α¬▓α½ï α¬Üα¬╛α¬▓α½ü α¬░α¬╛α¬ûα½ï.\n• α¬¢α¬éα¬ƒα¬òα¬╛α¬╡: α¬½α½éα¬ùα¬¿α¬╛ α¬Üα½çα¬¬α¬¿α½üα¬é α¬£α½ïα¬ûα¬« α¬╡α¬ºα½ü α¬¢α½ç, α¬½α½éα¬ùα¬¿α¬╛α¬╢α¬ò α¬¢α¬╛α¬éα¬ƒα½ï.\n• α¬▓α¬úα¬úα½Ç: α¬▓α¬úα¬úα½Ç α¬òα¬░α½çα¬▓ α¬«α¬╛α¬▓α¬¿α½ç α¬╕α¬╛α¬░α½Ç α¬░α½Çα¬ñα½ç α¬╕α½éα¬òα¬╡α½ï.`,
    adv_default: (crop) => `• α¬╕α¬┐α¬éα¬Üα¬╛α¬ê: α¬¿α¬┐α¬»α¬«α¬┐α¬ñ α¬ƒα¬¬α¬ò α¬╕α¬┐α¬éα¬Üα¬╛α¬ê α¬Üα¬òα½ìα¬░ α¬Üα¬╛α¬▓α½ü α¬░α¬╛α¬ûα½ï.\n• α¬¢α¬éα¬ƒα¬òα¬╛α¬╡: α¬ûα¬╛α¬ñα¬░/α¬£α¬éα¬ñα½üα¬¿α¬╛α¬╢α¬ò α¬¢α¬éα¬ƒα¬òα¬╛α¬╡ α¬«α¬╛α¬ƒα½ç α¬╣α¬╡α¬╛α¬«α¬╛α¬¿ α¬àα¬¿α½üα¬òα½éα¬│ α¬¢α½ç.\n• α¬▓α¬úα¬úα½Ç: α¬¬α¬╛α¬òα¬¿α½Ç α¬▓α¬úα¬úα½Ç α¬òα¬░α¬╡α½Ç α¬╣α¬╡α½ç α¬╕α½üα¬░α¬òα½ìα¬╖α¬┐α¬ñ α¬¢α½ç.`
  },
  bn: {
    rain_alert: 'αª¡αª╛αª░αºÇ αª¼αºâαª╖αºìαªƒαª┐αª░ αª╕αªñαª░αºìαªòαªñαª╛: αª¬αºìαª░αª¼αª▓ αª¼αºâαª╖αºìαªƒαª┐αª░ αª¬αºéαª░αºìαª¼αª╛αª¡αª╛αª╕αÑñ αª╕αºçαªÜ αª¼αª¿αºìαªº αª░αª╛αªûαºüαª¿ αªÅαª¼αªé αªòαª╛αªƒαª╛ αª½αª╕αª▓ αª░αªòαºìαª╖αª╛ αªòαª░αºüαª¿αÑñ',
    heat_alert: 'αªªαª╛αª¼αªªαª╛αª╣αºçαª░ αª╕αªñαª░αºìαªòαªñαª╛: αªñαºÇαª¼αºìαª░ αªùαª░αª«αºçαª░ αª╕αªñαª░αºìαªòαªñαª╛αÑñ αª½αª╕αª▓ αª╢αºüαªòαª┐αª»αª╝αºç αª»αª╛αªôαª»αª╝αª╛ αª░αºïαªºαºç αª¿αª┐αª»αª╝αª«αª┐αªñ αª╕αºçαªÜ αªªαª┐αª¿αÑñ',
    frost_alert: 'αªñαºüαª╖αª╛αª░αª¬αª╛αªñαºçαª░ αª╕αªñαª░αºìαªòαªñαª╛: αª½αª╕αª▓αºçαª░ αªñαºüαª╖αª╛αª░αª£αª¿αª┐αªñ αªòαºìαª╖αªñαª┐ αª╣αªñαºç αª¬αª╛αª░αºçαÑñ αª╕αºüαª░αªòαºìαª╖αª╛αª«αºéαª▓αªò αª¼αºìαª»αª¼αª╕αºìαªÑαª╛ αª¿αª┐αª¿αÑñ',
    wind_alert: 'αª¥αªíαª╝αºï αª╣αª╛αªôαª»αª╝αª╛αª░ αª╕αªñαª░αºìαªòαªñαª╛: αª¬αºìαª░αª¼αª▓ αª¼αª╛αªñαª╛αª╕ αª¼αªçαªñαºç αª¬αª╛αª░αºçαÑñ αªòαºÇαªƒαª¿αª╛αª╢αªò αª╕αºìαª¬αºìαª░αºç αªòαª░αª╛ αª╕αºìαªÑαªùαª┐αªñ αªòαª░αºüαª¿αÑñ',
    adv_rain: (crop) => `• αª╕αºçαªÜ: αª£αª▓αª╛αª¼αªªαºìαªºαªñαª╛ αªÅαº£αª╛αªñαºç ${crop} αª½αª╕αª▓αºç αª╕αºçαªÜ αªªαºçαªôαºƒαª╛ αª¼αª¿αºìαªº αª░αª╛αªûαºüαª¿αÑñ\n• αª╕αºìαª¬αºìαª░αºç: αªòαºÇαªƒαª¿αª╛αª╢αªò αª╕αºìαª¬αºìαª░αºç αªòαª░αª¼αºçαª¿ αª¿αª╛ αªòαª╛αª░αªú αªÅαªƒαª┐ αªºαºüαºƒαºç αª»αª╛αª¼αºçαÑñ\n• αª½αª╕αª▓ αªòαª╛αªƒαª╛: αªòαª╛αªƒαª╛ αª½αª╕αª▓ αªàαª¼αª┐αª▓αª«αºìαª¼αºç αª╢αºüαªòαª¿αºï αªùαºüαªªαª╛αª«αºç αª╕αª░αª┐αºƒαºç αª¿αª┐αª¿αÑñ`,
    adv_wind: (crop) => `• αª╕αºçαªÜ: αª╕αºìαª¼αª╛αª¡αª╛αª¼αª┐αªò αª╕αºçαªÜ αª¬αºìαª░αª»αª╝αºïαª£αª¿αÑñ\n• αª╕αºìαª¬αºìαª░αºç: αª¼αª╛αªñαª╛αª╕αºçαª░ αªùαªñαª┐αª¼αºçαªùαºçαª░ αªòαª╛αª░αªúαºç αªòαºÇαªƒαª¿αª╛αª╢αªò αª╕αºìαª¬αºìαª░αºç αª╕αºìαªÑαªùαª┐αªñ αªòαª░αºüαª¿αÑñ\n• αª½αª╕αª▓ αªòαª╛αªƒαª╛: αª½αª╕αª▓αºçαª░ αªåαª╢αºìαª░αª»αª╝ αªòαª╛αªáαª╛αª«αºï αª¿αª┐αª░αª╛αª¬αªª αªòαª░αºüαª¿αÑñ`,
    adv_humidity: (crop) => `• αª╕αºçαªÜ: αª¿αª┐αªòαª╛αª╢αºÇ αª¿αª╛αª▓αª╛ αª╕αªòαºìαª░αª┐αºƒ αª░αª╛αªûαºüαª¿αÑñ\n• αª╕αºìαª¬αºìαª░αºç: αª¢αªñαºìαª░αª╛αªòαºçαª░ αªåαªòαºìαª░αª«αªú αª╣αªñαºç αª¬αª╛αª░αºç, αª¢αªñαºìαª░αª╛αªòαª¿αª╛αª╢αªò αª╕αºìαª¬αºìαª░αºç αªòαª░αºüαª¿αÑñ\n• αª½αª╕αª▓ αªòαª╛αªƒαª╛: αª½αª╕αª▓ αª¡αª╛αª▓αºï αªòαª░αºç αª╢αºüαªòαª┐αºƒαºç αª¿αª┐αª¿αÑñ`,
    adv_default: (crop) => `• αª╕αºçαªÜ: αª╕αºìαª¼αª╛αª¡αª╛αª¼αª┐αªò αªíαºìαª░αª┐αª¬ αª╕αºçαªÜ αªÜαª╛αª▓αºü αª░αª╛αªûαºüαª¿αÑñ\n• αª╕αºìαª¬αºìαª░αºç: αª╕αª╛αª░ αª¼αª╛ αªòαºÇαªƒαª¿αª╛αª╢αªò αª╕αºìαª¬αºìαª░αºç αªòαª░αª╛αª░ αª£αª¿αºìαª» αªåαª¼αª╣αª╛αªôαºƒαª╛ αªàαª¿αºüαªòαºéαª▓αÑñ\n• αª½αª╕αª▓ αªòαª╛αªƒαª╛: αªÅαªûαª¿ αª½αª╕αª▓ αªòαª╛αªƒαª╛ αª¿αª┐αª░αª╛αª¬αªªαÑñ`
  },
  pa: {
    rain_alert: 'α¿¡α¿╛α¿░α⌐Ç α¿«α⌐Çα¿éα¿╣ α¿ªα⌐Ç α¿Üα⌐çα¿ñα¿╛α¿╡α¿¿α⌐Ç: α¿¡α¿╛α¿░α⌐Ç α¿«α⌐Çα¿éα¿╣ α¿ªα⌐Ç α¿╕α⌐░α¿¡α¿╛α¿╡α¿¿α¿╛αÑñ α¿╕α¿┐α⌐░α¿Üα¿╛α¿ê α¿░α⌐ïα¿òα⌐ï α¿àα¿ñα⌐ç α¿òα⌐▒α¿ƒα⌐Ç α¿╣α⌐ïα¿ê α¿½α¿╝α¿╕α¿▓ α¿ªα⌐Ç α¿░α⌐▒α¿ûα¿┐α¿å α¿òα¿░α⌐ïαÑñ',
    heat_alert: 'α¿▓α⌐é α¿ªα⌐Ç α¿Üα⌐çα¿ñα¿╛α¿╡α¿¿α⌐Ç: α¿àα¿ñα¿┐ α¿ªα⌐Ç α¿ùα¿░α¿«α⌐Ç α¿ªα⌐Ç α¿Üα⌐çα¿ñα¿╛α¿╡α¿¿α⌐ÇαÑñ α¿╕α⌐üα⌐▒α¿òα¿ú α¿ñα⌐ïα¿é α¿¼α¿Üα¿╛α¿ëα¿ú α¿▓α¿ê α¿½α¿╝α¿╕α¿▓ α¿ªα⌐Ç α¿¿α¿┐α¿»α¿«α¿ñ α¿╕α¿┐α⌐░α¿Üα¿╛α¿ê α¿òα¿░α⌐ïαÑñ',
    frost_alert: 'α¿òα⌐ïα¿╣α¿░α⌐ç α¿ªα⌐Ç α¿Üα⌐çα¿ñα¿╛α¿╡α¿¿α⌐Ç: α¿òα⌐ïα¿╣α¿░α⌐ç α¿òα¿╛α¿░α¿¿ α¿½α¿╝α¿╕α¿▓ α¿ªα¿╛ α¿¿α⌐üα¿òα¿╕α¿╛α¿¿ α¿╣α⌐ïα¿ú α¿ªα¿╛ α¿ûα¿ªα¿╕α¿╝α¿╛αÑñ α¿¼α¿Üα¿╛α¿à α¿ªα⌐ç α¿ëα¿¬α¿╛α¿à α¿òα¿░α⌐ïαÑñ',
    wind_alert: 'α¿ñα⌐çα¿£α¿╝ α¿╣α¿╡α¿╛ α¿ªα⌐Ç α¿Üα⌐çα¿ñα¿╛α¿╡α¿¿α⌐Ç: α¿ñα⌐çα¿£α¿╝ α¿╣α¿╡α¿╛α¿╡α¿╛α¿é α¿Üα⌐▒α¿▓α¿ú α¿ªα¿╛ α¿ûα¿ªα¿╕α¿╝α¿╛αÑñ α¿òα⌐Çα¿ƒα¿¿α¿╛α¿╕α¿╝α¿òα¿╛α¿é α¿ªα¿╛ α¿¢α¿┐α⌐£α¿òα¿╛α¿à α¿«α⌐üα¿▓α¿ñα¿╡α⌐Ç α¿òα¿░α⌐ïαÑñ',
    adv_rain: (crop) => `• α¿╕α¿┐α⌐░α¿Üα¿╛α¿ê: α¿¬α¿╛α¿úα⌐Ç α¿£α¿«α⌐ìα¿╣α¿╛ α¿╣α⌐ïα¿ú α¿ñα⌐ïα¿é α¿¼α¿Üα¿╛α¿ëα¿ú α¿▓α¿ê ${crop} α¿½α¿╝α¿╕α¿▓ α¿¿α⌐éα⌐░ α¿¬α¿╛α¿úα⌐Ç α¿ªα⌐çα¿úα¿╛ α¿¼α⌐░α¿ª α¿òα¿░α⌐ïαÑñ\n• α¿¢α¿┐α⌐£α¿òα¿╛α¿à: α¿òα⌐Çα¿ƒα¿¿α¿╛α¿╕α¿╝α¿òα¿╛α¿é α¿ªα¿╛ α¿¢α¿┐α⌐£α¿òα¿╛α¿à α¿¿α¿╛ α¿òα¿░α⌐ï α¿òα¿┐α¿ëα¿éα¿òα¿┐ α¿çα¿╣ α¿ºα⌐üα¿▓ α¿£α¿╛α¿╡α⌐çα¿ùα¿╛αÑñ\n• α¿╡α¿╛α¿óα⌐Ç: α¿òα⌐▒α¿ƒα⌐Ç α¿╣α⌐ïα¿ê α¿½α¿╝α¿╕α¿▓ α¿¿α⌐éα⌐░ α¿ñα⌐üα¿░α⌐░α¿ñ α¿╕α⌐üα⌐▒α¿òα⌐Ç α¿Ñα¿╛α¿é 'α¿ñα⌐ç α¿▓α⌐ê α¿£α¿╛α¿ôαÑñ`,
    adv_wind: (crop) => `• α¿╕α¿┐α⌐░α¿Üα¿╛α¿ê: α¿åα¿« α¿╕α¿┐α⌐░α¿Üα¿╛α¿ê α¿ªα⌐Ç α¿▓α⌐ïα⌐£ α¿╣α⌐êαÑñ\n• α¿¢α¿┐α⌐£α¿òα¿╛α¿à: α¿ñα⌐çα¿£α¿╝ α¿╣α¿╡α¿╛ α¿òα¿╛α¿░α¿¿ α¿¢α¿┐α⌐£α¿òα¿╛α¿à α¿«α⌐üα¿▓α¿ñα¿╡α⌐Ç α¿òα¿░α⌐ïαÑñ\n• α¿╡α¿╛α¿óα⌐Ç: α¿½α¿╝α¿╕α¿▓α¿╛α¿é α¿ªα⌐ç α¿åα¿╕α¿░α⌐ç α¿╕α⌐üα¿░α⌐▒α¿ûα¿┐α¿àα¿ñ α¿òα¿░α⌐ïαÑñ`,
    adv_humidity: (crop) => `• α¿╕α¿┐α⌐░α¿Üα¿╛α¿ê: α¿¿α¿┐α¿òα¿╛α¿╕α⌐Ç α¿¿α¿╛α¿▓α⌐Çα¿åα¿é α¿╕α¿╛α¿½α¿╝ α¿░α⌐▒α¿ûα⌐ïαÑñ\n• α¿¢α¿┐α⌐£α¿òα¿╛α¿à: α¿ëα⌐▒α¿▓α⌐Ç α¿▓α⌐▒α¿ùα¿ú α¿ªα¿╛ α¿ûα¿╝α¿ñα¿░α¿╛, α¿ëα⌐▒α¿▓α⌐Çα¿¿α¿╛α¿╕α¿╝α¿ò α¿ªα¿╛ α¿¢α¿┐α⌐£α¿òα¿╛α¿à α¿òα¿░α⌐ïαÑñ\n• α¿╡α¿╛α¿óα⌐Ç: α¿òα⌐▒α¿ƒα⌐Ç α¿╣α⌐ïα¿ê α¿½α¿╝α¿╕α¿▓ α¿¿α⌐éα⌐░ α¿Üα⌐░α¿ùα⌐Ç α¿ñαª░α⌐ìα¿╣α¿╛α¿é α¿╕α⌐üα¿òα¿╛α¿ôαÑñ`,
    adv_default: (crop) => `• α¿╕α¿┐α⌐░α¿Üα¿╛α¿ê: α¿╕α¿ƒα⌐êα¿éα¿íα¿░α¿í α¿íα⌐ìα¿░α¿┐α⌐▒α¿¬ α¿╕α¿┐α¿╕α¿ƒα¿« α¿Üα¿╛α¿▓α⌐é α¿░α⌐▒α¿ûα⌐ïαÑñ\n• α¿¢α¿┐α⌐£α¿òα¿╛α¿à: α¿ûα¿╛α¿ª α¿£α¿╛α¿é α¿òα⌐Çα¿ƒα¿¿α¿╛α¿╕α¿╝α¿ò α¿¢α¿┐α⌐£α¿òα¿╛α¿à α¿▓α¿ê α¿«α⌐îα¿╕α¿« α¿àα¿¿α⌐üα¿òα⌐éα¿▓ α¿╣α⌐êαÑñ\n• α¿╡α¿╛α¿óα⌐Ç: α¿½α¿╝α¿╕α¿▓ α¿ªα⌐Ç α¿╡α¿╛α¿óα⌐Ç α¿òα¿░α¿¿ α¿ªα¿╛ α¿╣α⌐üα¿ú α¿╕α¿╣α⌐Ç α¿╕α¿«α¿╛α¿é α¿╣α⌐êαÑñ`
  },
  ml: {
    rain_alert: 'α┤╢α┤òα╡ìα┤ñα┤«α┤╛α┤» α┤«α┤┤ α┤«α╡üα┤¿α╡ìα┤¿α┤▒α┤┐α┤»α┤┐α┤¬α╡ìα┤¬α╡ì: α┤╢α┤òα╡ìα┤ñα┤«α┤╛α┤» α┤«α┤┤α┤»α╡ìα┤òα╡ìα┤òα╡ì α┤╕α┤╛α┤ºα╡ìα┤»α┤ñ. α┤¿α┤¿α┤»α╡ìα┤òα╡ìα┤òα╡üα┤¿α╡ìα┤¿α┤ñα╡ì α┤Æα┤┤α┤┐α┤╡α┤╛α┤òα╡ìα┤òα╡üα┤ò, α┤╡α┤┐α┤│α┤òα╡╛ α┤╕α┤éα┤░α┤òα╡ìα┤╖α┤┐α┤òα╡ìα┤òα╡üα┤ò.',
    heat_alert: 'α┤ëα┤╖α╡ìα┤úα┤ñα┤░α┤éα┤ù α┤«α╡üα┤¿α╡ìα┤¿α┤▒α┤┐α┤»α┤┐α┤¬α╡ìα┤¬α╡ì: α┤òα┤ƒα╡üα┤ñα╡ìα┤ñ α┤ëα┤╖α╡ìα┤úα┤ñα┤░α┤éα┤ù α┤«α╡üα┤¿α╡ìα┤¿α┤▒α┤┐α┤»α┤┐α┤¬α╡ìα┤¬α╡ì. α┤╡α┤┐α┤│α┤òα╡╛ α┤╡α┤╛α┤ƒα┤┐α┤¬α╡ìα┤¬α╡ïα┤òα┤╛α┤ñα┤┐α┤░α┤┐α┤òα╡ìα┤òα┤╛α╡╗ α┤òα╡âα┤ñα╡ìα┤»α┤«α┤╛α┤»α┤┐ α┤¿α┤¿α┤»α╡ìα┤òα╡ìα┤òα╡üα┤ò.',
    frost_alert: 'α┤«α┤₧α╡ìα┤₧α╡ü α┤╡α╡Çα┤┤α╡ìα┤Ü α┤«α╡üα┤¿α╡ìα┤¿α┤▒α┤┐α┤»α┤┐α┤¬α╡ìα┤¬α╡ì: α┤╡α┤┐α┤│α┤òα╡╛α┤òα╡ìα┤òα╡ì α┤«α┤₧α╡ìα┤₧α╡ü α┤«α╡éα┤▓α┤«α╡üα┤│α╡ìα┤│ α┤òα╡çα┤ƒα╡üα┤¬α┤╛α┤ƒα╡üα┤òα╡╛α┤òα╡ìα┤òα╡ì α┤╕α┤╛α┤ºα╡ìα┤»α┤ñ. α┤¬α╡ìα┤░α┤ñα┤┐α┤░α╡ïα┤º α┤¿α┤ƒα┤¬α┤ƒα┤┐α┤òα╡╛ α┤╕α╡ìα┤╡α╡Çα┤òα┤░α┤┐α┤òα╡ìα┤òα╡üα┤ò.',
    wind_alert: 'α┤╢α┤òα╡ìα┤ñα┤«α┤╛α┤» α┤òα┤╛α┤▒α╡ìα┤▒α╡ì α┤«α╡üα┤¿α╡ìα┤¿α┤▒α┤┐α┤»α┤┐α┤¬α╡ìα┤¬α╡ì: α┤àα┤ñα┤┐α┤╢α┤òα╡ìα┤ñα┤«α┤╛α┤» α┤òα┤╛α┤▒α╡ìα┤▒α┤┐α┤¿α╡ì α┤╕α┤╛α┤ºα╡ìα┤»α┤ñ. α┤òα╡Çα┤ƒα┤¿α┤╛α┤╢α┤┐α┤¿α┤┐ α┤ñα┤│α┤┐α┤òα╡ìα┤òα╡üα┤¿α╡ìα┤¿α┤ñα╡ì α┤«α┤╛α┤▒α╡ìα┤▒α┤┐α┤╡α╡åα┤òα╡ìα┤òα╡üα┤ò.',
    adv_rain: (crop) => `• α┤£α┤▓α┤╕α╡çα┤Üα┤¿α┤é: α┤╡α╡åα┤│α╡ìα┤│α┤òα╡ìα┤òα╡åα┤ƒα╡ìα┤ƒα╡ì α┤Æα┤┤α┤┐α┤╡α┤╛α┤òα╡ìα┤òα┤╛α╡╗ ${crop} α┤╡α┤┐α┤│α┤òα╡╛α┤òα╡ìα┤òα╡ì α┤¿α┤¿α┤»α╡ìα┤òα╡ìα┤òα╡üα┤¿α╡ìα┤¿α┤ñα╡ì α┤Æα┤┤α┤┐α┤╡α┤╛α┤òα╡ìα┤òα╡üα┤ò.\n• α┤╕α╡ìα┤¬α╡ìα┤░α╡çα┤»α┤┐α┤éα┤ùα╡ì: α┤òα╡Çα┤ƒα┤¿α┤╛α┤╢α┤┐α┤¿α┤┐ α┤¬α╡ìα┤░α┤»α╡ïα┤ùα┤é α┤Æα┤┤α┤┐α┤╡α┤╛α┤òα╡ìα┤òα╡üα┤ò, α┤«α┤┤α┤»α┤┐α╡╜ α┤Æα┤▓α┤┐α┤Üα╡ìα┤Üα╡üα┤¬α╡ïα┤òα╡üα┤é.\n• α┤╡α┤┐α┤│α┤╡α╡åα┤ƒα╡üα┤¬α╡ìα┤¬α╡ì: α┤╡α┤┐α┤│α┤╡α╡åα┤ƒα╡üα┤ñα╡ìα┤ñα┤╡ α┤ëα┤úα┤Öα╡ìα┤Öα┤┐α┤» α┤╕α╡ìα┤Ñα┤▓α┤ñα╡ìα┤ñα╡çα┤òα╡ìα┤òα╡ì α┤«α┤╛α┤▒α╡ìα┤▒α╡üα┤ò.`,
    adv_wind: (crop) => `• α┤£α┤▓α┤╕α╡çα┤Üα┤¿α┤é: α┤╕α┤╛α┤ºα┤╛α┤░α┤ú α┤░α╡Çα┤ñα┤┐α┤»α┤┐α┤▓α╡üα┤│α╡ìα┤│ α┤¿α┤¿ α┤«α┤ñα┤┐α┤»α┤╛α┤òα╡üα┤é.\n• α┤╕α╡ìα┤¬α╡ìα┤░α╡çα┤»α┤┐α┤éα┤ùα╡ì: α┤òα┤╛α┤▒α╡ìα┤▒α╡üα┤│α╡ìα┤│α┤ñα┤┐α┤¿α┤╛α╡╜ α┤òα╡Çα┤ƒα┤¿α┤╛α┤╢α┤┐α┤¿α┤┐ α┤ñα┤│α┤┐α┤òα╡ìα┤òα╡üα┤¿α╡ìα┤¿α┤ñα╡ì α┤«α┤╛α┤▒α╡ìα┤▒α┤┐α┤╡α╡åα┤òα╡ìα┤òα╡üα┤ò.\n• α┤╡α┤┐α┤│α┤╡α╡åα┤ƒα╡üα┤¬α╡ìα┤¬α╡ì: α┤╡α┤┐α┤│α┤òα╡╛α┤òα╡ìα┤òα╡ì α┤òα╡åα┤ƒα╡ìα┤ƒα┤┐α┤òα╡ìα┤òα┤┐α┤ƒα┤òα╡ìα┤òα╡üα┤¿α╡ìα┤¿ α┤ñα┤╛α┤Öα╡ìα┤Öα╡üα┤òα╡╛ α┤¡α┤ªα╡ìα┤░α┤«α┤╛α┤òα╡ìα┤òα╡üα┤ò.`,
    adv_humidity: (crop) => `• α┤£α┤▓α┤╕α╡çα┤Üα┤¿α┤é: α┤╡α╡åα┤│α╡ìα┤│α┤é α┤Æα┤┤α╡üα┤òα┤┐α┤¬α╡ìα┤¬α╡ïα┤òα┤╛α┤¿α╡üα┤│α╡ìα┤│ α┤Üα┤╛α┤▓α╡üα┤òα╡╛ α┤╡α╡âα┤ñα╡ìα┤ñα┤┐α┤»α┤╛α┤òα╡ìα┤òα╡üα┤ò.\n• α┤╕α╡ìα┤¬α╡ìα┤░α╡çα┤»α┤┐α┤éα┤ùα╡ì: α┤½α┤éα┤ùα┤╕α╡ì α┤╕α┤╛α┤ºα╡ìα┤»α┤ñ α┤òα╡éα┤ƒα╡üα┤ñα╡╜, α┤ëα┤Üα┤┐α┤ñα┤«α┤╛α┤» α┤½α┤éα┤ùα┤╕α╡ì α┤¿α┤╛α┤╢α┤┐α┤¿α┤┐ α┤ñα┤│α┤┐α┤òα╡ìα┤òα╡üα┤ò.\n• α┤╡α┤┐α┤│α┤╡α╡åα┤ƒα╡üα┤¬α╡ìα┤¬α╡ì: α┤╡α┤┐α┤│α┤╡α╡åα┤ƒα╡üα┤ñα╡ìα┤ñ α┤ºα┤╛α┤¿α╡ìα┤»α┤Öα╡ìα┤Öα╡╛ α┤¿α┤¿α╡ìα┤¿α┤╛α┤»α┤┐ α┤ëα┤úα┤òα╡ìα┤òα╡üα┤ò.`,
    adv_default: (crop) => `• α┤£α┤▓α┤╕α╡çα┤Üα┤¿α┤é: α┤╕α┤╛α┤ºα┤╛α┤░α┤ú α┤¬α╡ïα┤▓α╡åα┤»α╡üα┤│α╡ìα┤│ α┤íα╡ìα┤░α┤┐α┤¬α╡ìα┤¬α╡ì α┤¿α┤¿ α┤ñα╡üα┤ƒα┤░α╡üα┤ò.\n• α┤╕α╡ìα┤¬α╡ìα┤░α╡çα┤»α┤┐α┤éα┤ùα╡ì: α┤╡α┤│α┤é/α┤òα╡Çα┤ƒα┤¿α┤╛α┤╢α┤┐α┤¿α┤┐ α┤¬α╡ìα┤░α┤»α╡ïα┤ùα┤ñα╡ìα┤ñα┤┐α┤¿α╡ì α┤àα┤¿α╡üα┤òα╡éα┤▓ α┤òα┤╛α┤▓α┤╛α┤╡α┤╕α╡ìα┤Ñ.\n• α┤╡α┤┐α┤│α┤╡α╡åα┤ƒα╡üα┤¬α╡ìα┤¬α╡ì: α┤╡α┤┐α┤│α┤╡α╡åα┤ƒα╡üα┤òα╡ìα┤òα┤╛α╡╗ α┤Åα┤▒α╡ìα┤▒α┤╡α╡üα┤é α┤àα┤¿α╡üα┤»α╡ïα┤£α╡ìα┤»α┤«α┤╛α┤» α┤╕α┤«α┤»α┤«α┤╛α┤úα┤┐α┤ñα╡ì.`
  }
};

function getLocalWeatherAdvisory(temp, humidity, rainChance, windSpeed, crop, language) {
  const activeLang = WEATHER_TRANSLATIONS[language] ? language : 'en';
  const trans = WEATHER_TRANSLATIONS[activeLang];
  if (rainChance > 70) {
    return trans.adv_rain(crop);
  }
  if (windSpeed > 22) {
    return trans.adv_wind(crop);
  }
  if (humidity > 80 && temp > 30) {
    return trans.adv_humidity(crop);
  }
  return trans.adv_default(crop);
}

app.get('/api/weather', authenticateToken, async (req, res) => {
  const { lat, lng, crop, language } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'Latitude and Longitude are required.' });

  const apiKey = process.env.OPENWEATHERMAP_API_KEY || process.env.VITE_OPENWEATHERMAP_API_KEY;
  const targetCrop = crop || 'Cotton';
  const activeLang = language || 'en';

  if (!apiKey) {
    return res.status(400).json({ error: 'OpenWeatherMap API key is missing. Weather service requires VITE_OPENWEATHERMAP_API_KEY configured.' });
  }

  try {
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    );
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    );

    if (!currentRes.ok || !forecastRes.ok) {
      return res.status(502).json({ error: 'Failed to retrieve meteorological telemetry from OpenWeatherMap live servers.' });
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

    const trans = WEATHER_TRANSLATIONS[activeLang] || WEATHER_TRANSLATIONS.en;
    const alerts = [];
    if (rainChance > 70 || conditionMain === 'Rain') {
      alerts.push(trans.rain_alert);
    }
    if (temp > 40) {
      alerts.push(trans.heat_alert);
    }
    if (temp < 4) {
      alerts.push(trans.frost_alert);
    }
    if (windSpeed > 22) {
      alerts.push(trans.wind_alert);
    }

    // Dynamic AI weather recommendations from Gemini
    let recommendation = '';
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    const isKeyValid = GEMINI_API_KEY.startsWith('AIzaSy') || GEMINI_API_KEY.startsWith('AQ');

    if (GEMINI_API_KEY && isKeyValid) {
      try {
        const response = await fetchWithRetry(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Provide short agricultural recommendations for crop "${targetCrop}" in ${getLanguageName(activeLang)} language based on weather data: Temp ${temp}°C, Humidity ${humidity}%, Wind ${windSpeed} km/h, Rain Chance ${rainChance}%. Generate 3 short advice bullet points: 1. Irrigation advice, 2. Spray recommendations, 3. Harvest alerts. Keep it under 60 words and write entirely in ${getLanguageName(activeLang)}.`
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
        }
      } catch (err) {
        console.warn("Gemini weather advisory generation failed, using local rules:", err.message);
      }
    }
    
    if (!recommendation) {
      recommendation = getLocalWeatherAdvisory(temp, humidity, rainChance, windSpeed, targetCrop, activeLang);
    }

    const pressure = currentData.main?.pressure || 1012;
    const visibility = currentData.visibility ? Math.round(currentData.visibility / 1000) : 10;

    res.json({
      currentTemp: temp,
      description,
      rainChance,
      windSpeed,
      humidity,
      uvIndex,
      pressure,
      visibility,
      forecast,
      alerts,
      recommendation
    });
  } catch (err) {
    console.error("OpenWeatherMap request failure:", err.message);
    res.status(502).json({ error: `Weather service lookup failed: ${err.message}` });
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

app.get('/api/debug', async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  let localDbWritable = false;
  let writeError = null;
  
  try {
    const testPath = path.join(__dirname, 'test-write.json');
    fs.writeFileSync(testPath, JSON.stringify({ test: true }));
    fs.unlinkSync(testPath);
    localDbWritable = true;
  } catch (e) {
    writeError = e.message;
  }

  res.json({
    mongoConnected: mongoState === 1,
    mongoReadyState: mongoState,
    localDbWritable,
    writeError,
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasGeminiKey: !!process.env.VITE_GEMINI_API_KEY,
      hasWeatherKey: !!process.env.VITE_OPENWEATHERMAP_API_KEY
    }
  });
});

const seedMarketplaceListings = async () => {
  const seedItems = [
    {
      title: 'Mahindra 575 DI Tractor (45 HP)',
      description: 'Well maintained Mahindra 575 tractor, 2022 model, 1200 hours run. Excellent engine condition, new rear tires. Location near Karimnagar city. Ideal for heavy plowing and transport.',
      category: 'Machinery',
      price: 480000,
      location: 'Karimnagar, Telangana',
      contact: '+91 98480 22338',
      sellerName: 'Satyam Agri Machinery Sales',
      userId: 'system-seed-user-1',
      imageUrl: 'https://images.unsplash.com/photo-1594913785162-e67853f23bef?auto=format&fit=crop&q=80&w=600',
      date: new Date().toLocaleDateString()
    },
    {
      title: 'Certified High-Yield Paddy Seeds (BPT 5204)',
      description: 'Samba Mahsuri (BPT 5204) certified paddy seeds. High germination rate (>90%), premium grain quality, pest-resistant. Available in 25kg bags. Wholesale inquiries welcome.',
      category: 'Seeds',
      price: 1150,
      location: 'Guntur, Andhra Pradesh',
      contact: '+91 86322 44556',
      sellerName: 'Krishna Seed Corporation',
      userId: 'system-seed-user-2',
      imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=600',
      date: new Date().toLocaleDateString()
    },
    {
      title: 'Solar Water Pump System (5 HP)',
      description: 'Premium quality 5 HP solar submersible pump set with 16 solar panels (325W each), controller, and mounting structure. Government subsidy documents can be provided. 5 years warranty on panels.',
      category: 'Tools',
      price: 165000,
      location: 'Nagpur, Maharashtra',
      contact: '+91 71225 66778',
      sellerName: 'Surya Solar Solutions Ltd',
      userId: 'system-seed-user-3',
      imageUrl: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=600',
      date: new Date().toLocaleDateString()
    },
    {
      title: 'Precision Drone Pesticide Spraying Service',
      description: 'Get your crops sprayed efficiently with our advanced agricultural drones. Covers 1 acre in 10 minutes. Ensures uniform distribution and 40% chemical savings. Charges per acre.',
      category: 'Machinery',
      price: 450,
      location: 'Bhatinda, Punjab',
      contact: '+91 98140 33445',
      sellerName: 'Falcon Agri-Drones Pvt Ltd',
      userId: 'system-seed-user-4',
      imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=600',
      date: new Date().toLocaleDateString()
    },
    {
      title: 'Organic Neem Cake Fertilizer (Wholesale)',
      description: '100% pure organic neem cake powder. Excellent natural fertilizer and pest repellent for cotton, paddy, and vegetable crops. Increases nitrogen absorption and soil health. 50kg bags.',
      category: 'Fertilizers',
      price: 950,
      location: 'Coimbatore, Tamil Nadu',
      contact: '+91 94422 11223',
      sellerName: 'Kovai Bio Organics',
      userId: 'system-seed-user-5',
      imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=600',
      date: new Date().toLocaleDateString()
    },
    {
      title: 'John Deere 5050 D Tractor (50 HP)',
      description: 'John Deere 5050D tractor for sale, 2023 model, sparingly used (400 hours). Power steering, oil-immersed disc brakes. Mint condition, single owner. Contact for live demo.',
      category: 'Machinery',
      price: 690000,
      location: 'Ludhiana, Punjab',
      contact: '+91 98150 99887',
      sellerName: 'Punjab Tractors Dealer',
      userId: 'system-seed-user-6',
      imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
      date: new Date().toLocaleDateString()
    }
  ];

  try {
    // 1. Seed MongoDB
    if (mongoose.connection.readyState === 1) {
      const count = await Listing.countDocuments();
      if (count === 0) {
        await Listing.insertMany(seedItems);
        console.log('Γ£à Marketplace seed listings successfully imported into MongoDB.');
      }
    }

    // 2. Seed JSON Fallback DB
    initJsonDb();
    const data = readJsonDb();
    if (!data.listings) data.listings = [];
    if (data.listings.length === 0) {
      data.listings = seedItems.map((item, idx) => ({
        ...item,
        _id: 'listing-seed-' + (idx + 1) + '-' + Math.random().toString(36).substr(2, 5),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      writeJsonDb(data);
      console.log('Γ£à Marketplace seed listings successfully imported into JSON fallback database.');
    }
  } catch (err) {
    console.error('ΓÜá∩╕Å Error seeding marketplace listings:', err.message);
  }
};

// ==================== MARKETPLACE API ROUTES ====================

app.get('/api/marketplace', authenticateToken, async (req, res) => {
  const { q, category } = req.query;
  try {
    const list = await DB.getListings(q, category);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load marketplace listings.' });
  }
});

app.post('/api/marketplace', authenticateToken, async (req, res) => {
  const { title, description, category, price, location, contact, imageUrl } = req.body;
  if (!title || !description || !category || !price || !location || !contact) {
    return res.status(400).json({ error: 'Missing listing fields.' });
  }
  try {
    const user = await DB.findUserByUid(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User profile not found.' });

    const newListing = {
      title,
      description,
      category,
      price: Number(price),
      location,
      contact,
      sellerName: user.displayName || 'Farmer',
      userId: req.user.uid,
      imageUrl: imageUrl || '',
      date: new Date().toLocaleDateString()
    };

    const saved = await DB.saveListing(newListing);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to post listing.' });
  }
});

app.post('/api/marketplace/:id/delete', authenticateToken, async (req, res) => {
  try {
    const success = await DB.deleteListing(req.params.id, req.user.uid);
    if (!success) return res.status(404).json({ error: 'Listing not found or unauthorized.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete listing.' });
  }
});

// Server Listen
app.listen(PORT, async () => {
  console.log(`KisanAI Backend Node/Express Server running on port ${PORT}`);
  await seedAdminUser();
  await seedMarketplaceListings();
});
