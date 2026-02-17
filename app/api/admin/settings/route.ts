import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Collections, SystemSettings } from '@/lib/firebase/schema';

export async function GET(request: NextRequest) {
    try {
        const docRef = adminDb.collection(Collections.SETTINGS).doc('general');
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            // Return default settings if not exists
            const defaultSettings: Partial<SystemSettings> = {
                maintenanceMode: false,
                allowRegistration: true,
                allowHRRegistration: true,
                emailNotifications: true,
                maxInterviewDuration: 60,
                defaultInterviewDuration: 30,
                aiEnabled: true,
                vapiEnabled: false,
            };
            return NextResponse.json(defaultSettings);
        }

        return NextResponse.json(docSnap.data());
    } catch (error: any) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const docRef = adminDb.collection(Collections.SETTINGS).doc('general');

        const settingsData = {
            ...body,
            updatedAt: new Date(),
        };

        await docRef.set(settingsData, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error saving settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
