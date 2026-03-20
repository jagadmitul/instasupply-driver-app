/**
 * Seed script to populate Firestore with sample deliveries.
 * Signs in as the test driver, then uses the auth token for Firestore REST API.
 *
 * Run: node scripts/seed-firestore.js
 */

// Configure these values before running the seed script
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'YOUR_FIREBASE_API_KEY';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const DRIVER_UID = process.env.DRIVER_UID || 'YOUR_DRIVER_UID';

const TEST_EMAIL = process.env.TEST_EMAIL || 'driver@test.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test@123';

const deliveries = [
  {
    orderId: 'ORD-1001',
    customerName: 'Rahul Sharma',
    customerAddress: '42, MG Road, Bengaluru 560001',
    customerPhone: '+919876543210',
    latitude: 12.9716,
    longitude: 77.5946,
  },
  {
    orderId: 'ORD-1002',
    customerName: 'Priya Patel',
    customerAddress: '15, Indiranagar, Bengaluru 560038',
    customerPhone: '+919876543211',
    latitude: 12.9784,
    longitude: 77.6408,
  },
  {
    orderId: 'ORD-1003',
    customerName: 'Amit Singh',
    customerAddress: '88, Koramangala, Bengaluru 560034',
    customerPhone: '+919876543212',
    latitude: 12.9352,
    longitude: 77.6245,
  },
  {
    orderId: 'ORD-1004',
    customerName: 'Neha Gupta',
    customerAddress: '7, Whitefield, Bengaluru 560066',
    customerPhone: '+919876543213',
    latitude: 12.9698,
    longitude: 77.75,
  },
  {
    orderId: 'ORD-1005',
    customerName: 'Vikram Reddy',
    customerAddress: '23, JP Nagar, Bengaluru 560078',
    customerPhone: '+919876543214',
    latitude: 12.9063,
    longitude: 77.5857,
  },
];

/**
 * Sign in with email/password and get an ID token
 */
async function signIn() {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        returnSecureToken: true,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sign in failed: ${error}`);
  }

  const data = await response.json();
  return data.idToken;
}

function toFirestoreValue(value) {
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === 'boolean') return { booleanValue: value };
  if (value === null) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  return { stringValue: String(value) };
}

async function createDocument(collection, fields, token) {
  const body = {
    fields: Object.fromEntries(
      Object.entries(fields).map(([key, val]) => [key, toFirestoreValue(val)]),
    ),
  };

  const response = await fetch(`${FIRESTORE_URL}/${collection}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create document: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.name.split('/').pop();
}

async function setDocument(collection, docId, fields, token) {
  const body = {
    fields: Object.fromEntries(
      Object.entries(fields).map(([key, val]) => [key, toFirestoreValue(val)]),
    ),
  };

  const response = await fetch(`${FIRESTORE_URL}/${collection}/${docId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to set document: ${response.status} ${error}`);
  }
}

async function seed() {
  console.log('Signing in as test driver...');
  const token = await signIn();
  console.log('Authenticated successfully\n');

  console.log('Seeding Firestore...\n');

  // Create user profile
  console.log('Creating user profile...');
  await setDocument('users', DRIVER_UID, {
    uid: DRIVER_UID,
    email: TEST_EMAIL,
    name: 'Test Driver',
    phoneVerified: false,
    fcmToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }, token);
  console.log('  User profile created/updated\n');

  // Add deliveries
  console.log('Adding sample deliveries...');
  const now = new Date();

  for (const delivery of deliveries) {
    const docId = await createDocument('deliveries', {
      ...delivery,
      driverId: DRIVER_UID,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }, token);
    console.log(`  ${delivery.orderId} → ${docId}`);
  }

  console.log(`\nDone! ${deliveries.length} deliveries seeded.`);
}

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
