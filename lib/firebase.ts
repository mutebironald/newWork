import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const hasServiceAccountCredentials = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

// Firebase App Hosting / Cloud Run set FIREBASE_CONFIG and provide Application
// Default Credentials, so no service-account key is needed there.
const hasAmbientCredentials = !!process.env.FIREBASE_CONFIG;

const hasFirebaseCredentials = hasServiceAccountCredentials || hasAmbientCredentials;

// ─── OFFLINE LOCAL FILESYSTEM EMULATOR MOCK ───────────────────────────────────

const MOCK_DB_DIR = path.join(process.cwd(), ".firebase_mock", "firestore");
const MOCK_STORAGE_DIR = path.join(process.cwd(), ".firebase_mock", "storage");

function getCollectionDir(collectionName: string): string {
  const dir = path.join(MOCK_DB_DIR, collectionName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function readDoc(collectionName: string, docId: string): any | null {
  const file = path.join(getCollectionDir(collectionName), `${docId}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function writeDoc(collectionName: string, docId: string, data: any, merge = false): void {
  const file = path.join(getCollectionDir(collectionName), `${docId}.json`);
  let finalData = { ...data, id: docId };
  if (merge && fs.existsSync(file)) {
    const existing = readDoc(collectionName, docId) || {};
    finalData = { ...existing, ...data, id: docId };
  }
  fs.writeFileSync(file, JSON.stringify(finalData, null, 2), "utf8");
}

function deleteDoc(collectionName: string, docId: string): void {
  const file = path.join(getCollectionDir(collectionName), `${docId}.json`);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
}

function readAllDocs(collectionName: string): any[] {
  const dir = getCollectionDir(collectionName);
  const files = fs.readdirSync(dir);
  const docs: any[] = [];
  for (const f of files) {
    if (f.endsWith(".json")) {
      const d = readDoc(collectionName, f.replace(".json", ""));
      if (d) docs.push(d);
    }
  }
  return docs;
}

// Mock Firestore Classes
class MockDocumentReference {
  constructor(private collectionPath: string, private docId: string) {}
  get id() { return this.docId; }
  async get() {
    const data = readDoc(this.collectionPath, this.docId);
    return {
      exists: !!data,
      id: this.docId,
      data: () => data,
    };
  }
  async set(data: any, options?: { merge?: boolean }) {
    writeDoc(this.collectionPath, this.docId, data, options?.merge);
    return { writeTime: new Date() };
  }
  async update(data: any) {
    writeDoc(this.collectionPath, this.docId, data, true);
    return { writeTime: new Date() };
  }
  async delete() {
    deleteDoc(this.collectionPath, this.docId);
    return { writeTime: new Date() };
  }
}

class MockQuery {
  constructor(
    private collectionPath: string,
    private filters: Array<[string, string, any]> = [],
    private order?: { field: string; direction: string },
    private limitNum?: number
  ) {}

  where(field: string, op: string, value: any) {
    return new MockQuery(
      this.collectionPath,
      [...this.filters, [field, op, value]],
      this.order,
      this.limitNum
    );
  }

  orderBy(field: string, direction?: "asc" | "desc") {
    return new MockQuery(
      this.collectionPath,
      this.filters,
      { field, direction: direction || "asc" },
      this.limitNum
    );
  }

  limit(n: number) {
    return new MockQuery(this.collectionPath, this.filters, this.order, n);
  }

  async get() {
    let docs = readAllDocs(this.collectionPath);
    for (const [field, op, value] of this.filters) {
      docs = docs.filter((doc) => {
        const val = doc[field];
        if (op === "==") return val === value;
        if (op === "array-contains") return Array.isArray(val) && val.includes(value);
        if (op === ">") return val > value;
        if (op === "<") return val < value;
        if (op === ">=") return val >= value;
        if (op === "<=") return val <= value;
        return true;
      });
    }

    if (this.order) {
      const { field, direction } = this.order;
      docs.sort((a, b) => {
        if (a[field] < b[field]) return direction === "asc" ? -1 : 1;
        if (a[field] > b[field]) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    if (this.limitNum !== undefined) {
      docs = docs.slice(0, this.limitNum);
    }

    return {
      empty: docs.length === 0,
      size: docs.length,
      docs: docs.map((d) => ({
        id: d.id,
        data: () => d,
        ref: new MockDocumentReference(this.collectionPath, d.id),
      })),
    };
  }
}

class MockCollectionReference extends MockQuery {
  constructor(private colPath: string) {
    super(colPath);
  }
  doc(id?: string) {
    const docId = id || crypto.randomUUID();
    return new MockDocumentReference(this.colPath, docId);
  }
  async add(data: any) {
    const docId = crypto.randomUUID();
    const ref = this.doc(docId);
    await ref.set(data);
    return ref;
  }
}

class MockFirestore {
  collection(name: string) {
    return new MockCollectionReference(name);
  }
}

// Mock Firebase Auth Classes
class MockAuth {
  async createUser(properties: any) {
    const uid = crypto.randomUUID();
    writeDoc("users", uid, {
      uid,
      email: properties.email,
      displayName: properties.displayName || "",
      createdAt: new Date(),
    });
    return { uid, email: properties.email };
  }

  async getUserByEmail(email: string) {
    const users = readAllDocs("users");
    const user = users.find((u) => u.email === email);
    if (!user) throw new Error("User not found");
    return { uid: user.id, email: user.email };
  }

  async createSessionCookie(idToken: string, options: any) {
    // Simply return the idToken (user ID) as session token
    return idToken;
  }

  async verifySessionCookie(cookieValue: string) {
    const user = readDoc("users", cookieValue);
    if (!user) throw new Error("Invalid session cookie");
    return { uid: cookieValue, email: user.email };
  }
}

// Mock Cloud Storage Classes
class MockFile {
  constructor(private bucketName: string, private filePath: string) {}
  async save(buffer: Buffer) {
    const p = path.join(MOCK_STORAGE_DIR, this.bucketName, this.filePath);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, buffer);
  }
  async getSignedUrl(config: any) {
    // Return a mock readable URL
    return [`/api/storage-mock/${this.bucketName}/${this.filePath}`];
  }
}

class MockBucket {
  constructor(private bucketName: string) {}
  file(filePath: string) {
    return new MockFile(this.bucketName, filePath);
  }
}

class MockStorage {
  bucket(name?: string) {
    return new MockBucket(name || "default-bucket");
  }
}

// ─── INITIALIZE CLIENT ────────────────────────────────────────────────────────

let db: any;
let auth: any;
let storage: any;

if (hasFirebaseCredentials) {
  if (!admin.apps.length) {
    if (hasServiceAccountCredentials) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
        storageBucket: process.env.GCS_PROOF_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      });
    } else {
      admin.initializeApp();
    }
  }
  db = admin.firestore();
  auth = admin.auth();
  storage = admin.storage();
} else {
  // Offline Mock instances
  db = new MockFirestore();
  auth = new MockAuth();
  storage = new MockStorage();
}

export { db, auth, storage, hasFirebaseCredentials };
