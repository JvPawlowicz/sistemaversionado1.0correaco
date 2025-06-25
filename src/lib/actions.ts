'use server';

import { z } from 'zod';
import { auth, db } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

// --- Create User Action ---

const CreateUserSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  role: z.enum(['Admin', 'Therapist', 'Receptionist', 'Coordinator']),
  unitIds: z.array(z.string()).min(1, { message: 'Selecione pelo menos uma unidade.' }),
});

export async function createUserAction(prevState: any, formData: FormData) {
  const validatedFields = CreateUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
    unitIds: formData.getAll('unitIds'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dados inválidos. Verifique os campos em vermelho.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password, name, role, unitIds } = validatedFields.data;

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      role,
      unitIds,
      status: 'Active',
      avatarUrl: `https://i.pravatar.cc/150?u=${userRecord.uid}`,
      createdAt: new Date(),
    });

  } catch (error: any) {
    let message = 'Ocorreu um erro desconhecido.';
    if (error.code === 'auth/email-already-exists') {
      message = 'Este e-mail já está em uso por outra conta.';
    }
    console.error('Error creating user:', error);
    return { success: false, message: message, errors: null };
  }

  revalidatePath('/users');
  return { success: true, message: 'Usuário criado com sucesso!', errors: null };
}


// --- Update User Password Action ---

export async function updateUserPasswordAction(uid: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!uid || !newPassword) {
        return { success: false, message: 'UID do usuário e nova senha são obrigatórios.' };
    }

    if (newPassword.length < 6) {
        return { success: false, message: 'A senha deve ter pelo menos 6 caracteres.' };
    }

    try {
        await auth.updateUser(uid, {
            password: newPassword,
        });
        return { success: true, message: 'Senha atualizada com sucesso!' };
    } catch (error: any) {
        console.error("Error updating password:", error);
        return { success: false, message: 'Falha ao atualizar a senha. Verifique os logs do servidor para mais detalhes.' };
    }
}
