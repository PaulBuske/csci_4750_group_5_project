/*
use'use server'
import { verifySession } from '@/app/lib/dal'

export async function serverAction(formData: FormData) {
    const session = await verifySession()
    const userRole = session?.user?.role

    // Return early if user is not authorized to perform the action
    if (userRole !== 'admin') {
        return null
    }
    // Proceed with the action for authorized users
}*/
