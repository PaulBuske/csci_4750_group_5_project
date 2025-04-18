import { SignupFormSchema, SignUpFormState } from '@/app/lib/definitions'
import bycrpt from 'bcrypt'
import {dbSingleton} from "@/app/lib/dbSingleton";

export async function signup(state: SignUpFormState, formData: FormData) {
    // 1. Validate form fields
    const validatedFields = SignupFormSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
    })

    // If any form fields are invalid, return early
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    // 2. Prepare data for insertion into database
    const {name, email, password} = validatedFields.data
    // e.g. Hash the user's password before storing it
    const hashedPassword = await bycrpt.hash(password, 10)
    // 3. Insert the user into the database or call an Auth Library's API
        const user = await dbSingleton.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
            select: {
                userId: true,
            },
        })

        if (!user) {
            return {
                message: 'An error occurred while creating your account.',
            }
        }
}
// TODO:
// 4. Create user session
// 5. Redirect user}