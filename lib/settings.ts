import { adminDb } from '@/lib/firebase/admin';
import { Collections, SystemSettings } from '@/lib/firebase/schema';

export const defaultSettings: Omit<SystemSettings, 'id' | 'updatedAt' | 'updatedBy'> = {
    maintenanceMode: false,
    allowRegistration: true,
    allowHRRegistration: true,
    emailNotifications: true,
    maxInterviewDuration: 60,
    defaultInterviewDuration: 30,
    aiEnabled: true,
    vapiEnabled: false,
};

export async function getSystemSettings(): Promise<Partial<SystemSettings>> {
    try {
        const docRef = adminDb.collection(Collections.SETTINGS).doc('general');
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return defaultSettings;
        }

        return { ...defaultSettings, ...docSnap.data() } as SystemSettings;
    } catch (error) {
        console.error('Error fetching system settings:', error);
        return defaultSettings;
    }
}
