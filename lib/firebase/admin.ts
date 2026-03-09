import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let serviceAccount: any = null;

if (serviceAccountStr) {
    serviceAccount = JSON.parse(serviceAccountStr);
} else if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
    serviceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
}

if (!getApps().length) {
    if (serviceAccount) {
        initializeApp({
            credential: cert(serviceAccount),
        });
    } else {
        // Dummy initialization to pass the build without credentials
        initializeApp({
            projectId: "demo-project-id",
        });
    }
}

export const adminDb = getFirestore();
