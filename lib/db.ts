import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import UserModel from '@/models/User';
import VolunteerProfileModel from '@/models/VolunteerProfile';
import AssistanceRequestModel from '@/models/AssistanceRequest';
import AssignmentModel from '@/models/Assignment';
import KycReviewModel from '@/models/KycReview';
import NotificationModel from '@/models/Notification';
import { calculateHaversineDistance, pointToCoords } from './geo';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/careconnect';
const STORAGE_DIR = process.env.KYC_STORAGE_DIR ? path.dirname(process.env.KYC_STORAGE_DIR) : path.join(process.cwd(), 'storage');
const DB_FILE_PATH = path.join(STORAGE_DIR, 'careconnect_store.json');

interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  useFallback: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseGlobal: GlobalMongoose | undefined;
}

let cached: GlobalMongoose = global.mongooseGlobal || {
  conn: null,
  promise: null,
  useFallback: false,
};

if (!global.mongooseGlobal) {
  global.mongooseGlobal = cached;
}

// Ensure storage dir exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Fallback in-memory / JSON persisted store
interface FileDBStore {
  users: any[];
  volunteerProfiles: any[];
  assistanceRequests: any[];
  assignments: any[];
  kycReviews: any[];
  notifications: any[];
}

function loadFileStore(): FileDBStore {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading JSON store, initializing fresh:', err);
  }
  return {
    users: [],
    volunteerProfiles: [],
    assistanceRequests: [],
    assignments: [],
    kycReviews: [],
    notifications: [],
  };
}

let memStore: FileDBStore = loadFileStore();

function persistStore() {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(memStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting store:', err);
  }
}

export async function connectDB() {
  if (cached.conn) {
    return { isMongoose: !cached.useFallback };
  }

  if (cached.useFallback) {
    return { isMongoose: false };
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 1500, // Quick fail if local mongo not running
      connectTimeoutMS: 1500,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        console.log('✅ Connected to MongoDB via Mongoose');
        cached.conn = m;
        cached.useFallback = false;
        return m;
      })
      .catch((err) => {
        console.warn('⚠️ MongoDB connection could not be established:', err.message);
        console.log('⚡ CareConnect is operating with resilient local storage adapter.');
        cached.useFallback = true;
        cached.conn = null;
        return null as any;
      });
  }

  try {
    await cached.promise;
  } catch (e) {
    cached.useFallback = true;
  }

  return { isMongoose: !cached.useFallback };
}

/**
 * Universal Data Access Layer
 * Seamlessly talks to Mongoose when available, or to local JSON store
 */
export const db = {
  async isUsingMongoose(): Promise<boolean> {
    const { isMongoose } = await connectDB();
    return isMongoose;
  },

  // USERS
  users: {
    async find(query: any = {}) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return UserModel.find(query).lean();
      }
      return memStore.users.filter((u) => matchesQuery(u, query));
    },

    async findOne(query: any) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return UserModel.findOne(query).lean();
      }
      return memStore.users.find((u) => matchesQuery(u, query)) || null;
    },

    async findById(id: string) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return UserModel.findById(id).lean();
      }
      return memStore.users.find((u) => u._id === id || u.id === id) || null;
    },

    async create(doc: any) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return (await UserModel.create(doc)).toObject();
      }
      const record = {
        ...doc,
        _id: doc._id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memStore.users.push(record);
      persistStore();
      return record;
    },

    async updateById(id: string, updates: any) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      }
      const idx = memStore.users.findIndex((u) => u._id === id || u.id === id);
      if (idx !== -1) {
        memStore.users[idx] = {
          ...memStore.users[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        persistStore();
        return memStore.users[idx];
      }
      return null;
    },

    async count(query: any = {}) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return UserModel.countDocuments(query);
      }
      return memStore.users.filter((u) => matchesQuery(u, query)).length;
    },
  },

  // VOLUNTEER PROFILES
  volunteerProfiles: {
    async find(query: any = {}) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return VolunteerProfileModel.find(query).populate('userId').lean();
      }
      const results = memStore.volunteerProfiles.filter((vp) => matchesQuery(vp, query));
      return results.map((vp) => populateUser(vp));
    },

    async findOne(query: any) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return VolunteerProfileModel.findOne(query).populate('userId').lean();
      }
      const vp = memStore.volunteerProfiles.find((v) => matchesQuery(v, query));
      return vp ? populateUser(vp) : null;
    },

    async findByUserId(userId: string) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return VolunteerProfileModel.findOne({ userId }).populate('userId').lean();
      }
      const vp = memStore.volunteerProfiles.find((v) => {
        const uid = typeof v.userId === 'object' ? v.userId._id : v.userId;
        return uid === userId;
      });
      return vp ? populateUser(vp) : null;
    },

    async findById(id: string) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return VolunteerProfileModel.findById(id).populate('userId').lean();
      }
      const vp = memStore.volunteerProfiles.find((v) => v._id === id || v.id === id);
      return vp ? populateUser(vp) : null;
    },

    async create(doc: any) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return (await VolunteerProfileModel.create(doc)).toObject();
      }
      const record = {
        ...doc,
        _id: doc._id || crypto.randomUUID(),
        completedTasks: doc.completedTasks || 0,
        kycStatus: doc.kycStatus || 'PENDING_KYC',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memStore.volunteerProfiles.push(record);
      persistStore();
      return record;
    },

    async updateByUserId(userId: string, updates: any) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return VolunteerProfileModel.findOneAndUpdate({ userId }, { $set: updates }, { new: true }).lean();
      }
      const idx = memStore.volunteerProfiles.findIndex((v) => {
        const uid = typeof v.userId === 'object' ? v.userId._id : v.userId;
        return uid === userId;
      });
      if (idx !== -1) {
        memStore.volunteerProfiles[idx] = {
          ...memStore.volunteerProfiles[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        persistStore();
        return populateUser(memStore.volunteerProfiles[idx]);
      }
      return null;
    },

    async updateById(id: string, updates: any) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return VolunteerProfileModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      }
      const idx = memStore.volunteerProfiles.findIndex((v) => v._id === id || v.id === id);
      if (idx !== -1) {
        memStore.volunteerProfiles[idx] = {
          ...memStore.volunteerProfiles[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        persistStore();
        return populateUser(memStore.volunteerProfiles[idx]);
      }
      return null;
    },

    async count(query: any = {}) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return VolunteerProfileModel.countDocuments(query);
      }
      return memStore.volunteerProfiles.filter((v) => matchesQuery(v, query)).length;
    },
  },

  // ASSISTANCE REQUESTS
  assistanceRequests: {
    async find(query: any = {}) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return AssistanceRequestModel.find(query)
          .populate('requesterId', 'name email phone address')
          .populate('assignedVolunteerId', 'name email phone')
          .sort({ createdAt: -1 })
          .lean();
      }
      return memStore.assistanceRequests
        .filter((r) => matchesQuery(r, query))
        .map((r) => populateRequest(r))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    async findById(id: string) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return AssistanceRequestModel.findById(id)
          .populate('requesterId', 'name email phone address')
          .populate('assignedVolunteerId', 'name email phone')
          .lean();
      }
      const req = memStore.assistanceRequests.find((r) => r._id === id || r.id === id);
      return req ? populateRequest(req) : null;
    },

    async create(doc: any) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return (await AssistanceRequestModel.create(doc)).toObject();
      }
      const record = {
        ...doc,
        _id: doc._id || crypto.randomUUID(),
        status: doc.status || 'PENDING',
        currentSearchRadius: doc.currentSearchRadius || 2,
        notifiedVolunteers: doc.notifiedVolunteers || [],
        declinedVolunteers: doc.declinedVolunteers || [],
        assignedVolunteerId: doc.assignedVolunteerId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memStore.assistanceRequests.unshift(record);
      persistStore();
      return record;
    },

    async updateById(id: string, updates: any) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return AssistanceRequestModel.findByIdAndUpdate(id, { $set: updates }, { new: true })
          .populate('requesterId', 'name email phone address')
          .populate('assignedVolunteerId', 'name email phone')
          .lean();
      }
      const idx = memStore.assistanceRequests.findIndex((r) => r._id === id || r.id === id);
      if (idx !== -1) {
        memStore.assistanceRequests[idx] = {
          ...memStore.assistanceRequests[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        persistStore();
        return populateRequest(memStore.assistanceRequests[idx]);
      }
      return null;
    },

    async count(query: any = {}) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return AssistanceRequestModel.countDocuments(query);
      }
      return memStore.assistanceRequests.filter((r) => matchesQuery(r, query)).length;
    },
  },

  // ASSIGNMENTS
  assignments: {
    async find(query: any = {}) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return AssignmentModel.find(query)
          .populate('requestId')
          .populate('volunteerId', 'name email phone')
          .populate('requesterId', 'name email phone')
          .sort({ assignedAt: -1 })
          .lean();
      }
      return memStore.assignments
        .filter((a) => matchesQuery(a, query))
        .map((a) => populateAssignment(a))
        .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
    },

    async findOne(query: any) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return AssignmentModel.findOne(query)
          .populate('requestId')
          .populate('volunteerId', 'name email phone')
          .populate('requesterId', 'name email phone')
          .lean();
      }
      const a = memStore.assignments.find((item) => matchesQuery(item, query));
      return a ? populateAssignment(a) : null;
    },

    async findById(id: string) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return AssignmentModel.findById(id)
          .populate('requestId')
          .populate('volunteerId', 'name email phone')
          .populate('requesterId', 'name email phone')
          .lean();
      }
      const a = memStore.assignments.find((item) => item._id === id || item.id === id);
      return a ? populateAssignment(a) : null;
    },

    async create(doc: any) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return (await AssignmentModel.create(doc)).toObject();
      }
      const record = {
        ...doc,
        _id: doc._id || crypto.randomUUID(),
        status: doc.status || 'ASSIGNED',
        assignedAt: new Date().toISOString(),
        acceptedAt: doc.acceptedAt || new Date().toISOString(),
      };
      memStore.assignments.unshift(record);
      persistStore();
      return record;
    },

    async updateById(id: string, updates: any) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return AssignmentModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      }
      const idx = memStore.assignments.findIndex((a) => a._id === id || a.id === id);
      if (idx !== -1) {
        memStore.assignments[idx] = {
          ...memStore.assignments[idx],
          ...updates,
        };
        persistStore();
        return populateAssignment(memStore.assignments[idx]);
      }
      return null;
    },

    async count(query: any = {}) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return AssignmentModel.countDocuments(query);
      }
      return memStore.assignments.filter((a) => matchesQuery(a, query)).length;
    },
  },

  // KYC REVIEWS
  kycReviews: {
    async find(query: any = {}) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return KycReviewModel.find(query)
          .populate('volunteerId', 'name email phone')
          .populate('coordinatorId', 'name email')
          .sort({ reviewedAt: -1 })
          .lean();
      }
      return memStore.kycReviews
        .filter((r) => matchesQuery(r, query))
        .map((r) => {
          const v = memStore.users.find((u) => u._id === r.volunteerId);
          const c = memStore.users.find((u) => u._id === r.coordinatorId);
          return {
            ...r,
            volunteerId: v ? { _id: v._id, name: v.name, email: v.email, phone: v.phone } : r.volunteerId,
            coordinatorId: c ? { _id: c._id, name: c.name, email: c.email } : r.coordinatorId,
          };
        });
    },

    async create(doc: any) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return (await KycReviewModel.create(doc)).toObject();
      }
      const record = {
        ...doc,
        _id: doc._id || crypto.randomUUID(),
        reviewedAt: new Date().toISOString(),
      };
      memStore.kycReviews.unshift(record);
      persistStore();
      return record;
    },
  },

  // NOTIFICATIONS
  notifications: {
    async find(query: any = {}) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return NotificationModel.find(query).sort({ createdAt: -1 }).lean();
      }
      return memStore.notifications
        .filter((n) => matchesQuery(n, query))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    async create(doc: any) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return (await NotificationModel.create(doc)).toObject();
      }
      const record = {
        ...doc,
        _id: doc._id || crypto.randomUUID(),
        read: false,
        createdAt: new Date().toISOString(),
      };
      memStore.notifications.unshift(record);
      persistStore();
      return record;
    },

    async markAsRead(id: string) {
      const { isMongoose } = await connectDB();
      if (isMongoose) {
        return NotificationModel.findByIdAndUpdate(id, { $set: { read: true } }).lean();
      }
      const notif = memStore.notifications.find((n) => n._id === id);
      if (notif) {
        notif.read = true;
        persistStore();
      }
      return notif;
    },
  },

  // RESET / RE-SEED
  async resetAll() {
    memStore = {
      users: [],
      volunteerProfiles: [],
      assistanceRequests: [],
      assignments: [],
      kycReviews: [],
      notifications: [],
    };
    persistStore();

    const { isMongoose } = await connectDB();
    if (isMongoose) {
      await UserModel.deleteMany({});
      await VolunteerProfileModel.deleteMany({});
      await AssistanceRequestModel.deleteMany({});
      await AssignmentModel.deleteMany({});
      await KycReviewModel.deleteMany({});
      await NotificationModel.deleteMany({});
    }
  },
};

// Helper: Query matching for local JSON store
function matchesQuery(doc: any, query: any): boolean {
  if (!query || Object.keys(query).length === 0) return true;

  for (const [key, val] of Object.entries(query)) {
    if (val === undefined) continue;

    // Handle $in operator
    if (val && typeof val === 'object' && '$in' in val) {
      const list = (val as any).$in;
      if (Array.isArray(doc[key])) {
        // e.g. capabilities contains any
        if (!doc[key].some((item: any) => list.includes(item))) return false;
      } else if (!list.includes(doc[key])) {
        return false;
      }
      continue;
    }

    // Handle $nin operator
    if (val && typeof val === 'object' && '$nin' in val) {
      const list = (val as any).$nin;
      if (list.includes(doc[key])) return false;
      continue;
    }

    // Handle $ne operator
    if (val && typeof val === 'object' && '$ne' in val) {
      if (doc[key] === (val as any).$ne) return false;
      continue;
    }

    // Handle ObjectId vs String comparisons
    const docVal = doc[key]?.toString();
    const queryVal = val?.toString();
    if (docVal !== queryVal) {
      return false;
    }
  }

  return true;
}

function populateUser(vp: any) {
  const uid = typeof vp.userId === 'object' ? vp.userId._id : vp.userId;
  const user = memStore.users.find((u) => u._id === uid);
  return {
    ...vp,
    userId: user ? { _id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address } : vp.userId,
  };
}

function populateRequest(req: any) {
  const rId = typeof req.requesterId === 'object' ? req.requesterId._id : req.requesterId;
  const requester = memStore.users.find((u) => u._id === rId);

  let volunteer = null;
  if (req.assignedVolunteerId) {
    const vId = typeof req.assignedVolunteerId === 'object' ? req.assignedVolunteerId._id : req.assignedVolunteerId;
    volunteer = memStore.users.find((u) => u._id === vId);
  }

  return {
    ...req,
    requesterId: requester
      ? { _id: requester._id, name: requester.name, email: requester.email, phone: requester.phone, address: requester.address }
      : req.requesterId,
    assignedVolunteerId: volunteer
      ? { _id: volunteer._id, name: volunteer.name, email: volunteer.email, phone: volunteer.phone }
      : req.assignedVolunteerId,
  };
}

function populateAssignment(a: any) {
  const req = memStore.assistanceRequests.find((r) => r._id === (typeof a.requestId === 'object' ? a.requestId._id : a.requestId));
  const vol = memStore.users.find((u) => u._id === (typeof a.volunteerId === 'object' ? a.volunteerId._id : a.volunteerId));
  const rqu = memStore.users.find((u) => u._id === (typeof a.requesterId === 'object' ? a.requesterId._id : a.requesterId));

  return {
    ...a,
    requestId: req ? populateRequest(req) : a.requestId,
    volunteerId: vol ? { _id: vol._id, name: vol.name, email: vol.email, phone: vol.phone } : a.volunteerId,
    requesterId: rqu ? { _id: rqu._id, name: rqu.name, email: rqu.email, phone: rqu.phone } : a.requesterId,
  };
}
