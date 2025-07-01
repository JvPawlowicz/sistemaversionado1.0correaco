'use server';

import { z } from 'zod';
import { auth, db, storageAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { checkAdminInit } from './helpers';
import { DEFAULT_AVATAR_URL } from '@/lib/utils';

const CreateUserSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  role: z.enum(['Admin', 'Therapist', 'Receptionist', 'Coordinator']),
  unitIds: z.array(z.string()).min(1, { message: 'Selecione pelo menos uma unidade.' }),
});

export async function createUserAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;

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

  const { name, role, unitIds, email, password } = validatedFields.data;

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
      avatarUrl: DEFAULT_AVATAR_URL,
      createdAt: FieldValue.serverTimestamp(),
      availability: [],
      professionalCouncil: null,
      councilNumber: null,
      specialties: [],
    });
    
    revalidatePath('/users');
  } catch (error: any) {
    let message = 'Ocorreu um erro desconhecido.';
    if (error.code === 'auth/email-already-exists') {
      message = 'Este e-mail já está em uso por outra conta.';
    }
    console.error('Error creating user:', error);
    return { success: false, message: message, errors: null };
  }

  return { success: true, message: 'Usuário criado com sucesso!', errors: null };
}

const UpdateUserSchema = z.object({
  uid: z.string().min(1, { message: 'ID do usuário é obrigatório.' }),
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }).optional().or(z.literal('')),
  role: z.enum(['Admin', 'Therapist', 'Receptionist', 'Coordinator']),
  unitIds: z.array(z.string()).min(1, { message: 'Selecione pelo menos uma unidade.' }),
});

export async function updateUserAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;

  const validatedFields = UpdateUserSchema.safeParse({
    uid: formData.get('uid'),
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
  
  const { uid, name, email, password, role, unitIds } = validatedFields.data;

  try {
    const userToUpdate: { displayName: string; email?: string; password?: string } = {
      displayName: name,
    };
    if (email) userToUpdate.email = email;
    if (password) userToUpdate.password = password;

    await auth.updateUser(uid, userToUpdate);

    const firestoreUpdateData: any = {
      name,
      role,
      unitIds,
    };
    if (email) firestoreUpdateData.email = email;

    await db.collection('users').doc(uid).update(firestoreUpdateData);

    revalidatePath('/users');
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.code === 'auth/email-already-exists') {
        return { success: false, message: 'Este e-mail já está em uso por outra conta.', errors: null };
    }
    return { success: false, message: 'Ocorreu um erro desconhecido ao atualizar o usuário.', errors: null };
  }

  return { success: true, message: 'Usuário atualizado com sucesso!', errors: null };
}

const ProfessionalDetailsSchema = z.object({
  userId: z.string().min(1),
  professionalCouncil: z.string().min(2, { message: 'O conselho profissional é obrigatório.' }),
  councilNumber: z.string().min(1, { message: 'O número do conselho é obrigatório.' }),
  specialties: z.string().optional(),
});

export async function updateUserProfessionalDetailsAction(prevState: any, formData: FormData) {
    const adminCheck = checkAdminInit();
    if (adminCheck) return adminCheck;

    const validatedFields = ProfessionalDetailsSchema.safeParse({
        userId: formData.get('userId'),
        professionalCouncil: formData.get('professionalCouncil'),
        councilNumber: formData.get('councilNumber'),
        specialties: formData.get('specialties'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Dados inválidos. Verifique os campos em vermelho.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { userId, professionalCouncil, councilNumber, specialties } = validatedFields.data;
    const specialtiesArray = specialties ? specialties.split(',').map(s => s.trim()).filter(Boolean) : [];

    try {
        await db.collection('users').doc(userId).update({
            professionalCouncil,
            councilNumber,
            specialties: specialtiesArray,
        });
        revalidatePath('/profile');
        return { success: true, message: 'Dados profissionais atualizados com sucesso!', errors: null };
    } catch (error) {
        console.error('Error updating professional details:', error);
        return { success: false, message: 'Ocorreu um erro ao salvar os dados.', errors: null };
    }
}

export async function updateUserPasswordAction(uid: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const adminCheck = checkAdminInit();
    if (adminCheck) return { success: adminCheck.success, message: adminCheck.message };

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
        revalidatePath('/users');
        return { success: true, message: 'Senha atualizada com sucesso!' };
    } catch (error: any) {
        console.error("Error updating password:", error);
        return { success: false, message: 'Falha ao atualizar a senha. Verifique os logs do servidor para mais detalhes.' };
    }
}

export async function deleteUserAction(uid: string): Promise<{ success: boolean; message: string }> {
  const adminCheck = checkAdminInit();
  if (adminCheck) return { success: adminCheck.success, message: adminCheck.message };
  
  if (!uid) {
    return { success: false, message: 'UID do usuário é obrigatório.' };
  }

  try {
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists && userDoc.data()?.role === 'Admin') {
      const adminUsersSnapshot = await db.collection('users').where('role', '==', 'Admin').get();
      if (adminUsersSnapshot.size <= 1) {
        return { success: false, message: 'Não é possível excluir o último administrador do sistema.' };
      }
    }

    await auth.deleteUser(uid);
    await userRef.delete();

    revalidatePath('/users');
    return { success: true, message: 'Usuário excluído com sucesso.' };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      try {
        await db.collection('users').doc(uid).delete();
        revalidatePath('/users');
        return { success: true, message: 'Usuário órfão removido do banco de dados.' };
      } catch (dbError) {
        console.error("Error deleting orphan user from Firestore:", dbError);
        return { success: false, message: 'Usuário não encontrado na autenticação e falha ao remover do banco de dados.' };
      }
    }
    console.error("Error deleting user:", error);
    return { success: false, message: 'Falha ao excluir o usuário.' };
  }
}

const UpdateAvatarSchema = z.object({
  userId: z.string().min(1, 'ID do usuário é obrigatório.'),
  avatar: z.custom<File>(val => val instanceof File, "Por favor, envie um arquivo.")
    .refine((file) => file.size > 0, 'O arquivo não pode estar vazio.')
    .refine((file) => file.size <= 2 * 1024 * 1024, `O tamanho máximo é 2MB.`)
    .refine((file) => file.type?.startsWith("image/"), ".Somente imagens são permitidas"),
});

export async function updateUserAvatarAction(prevState: any, formData: FormData) {
  const adminCheck = checkAdminInit();
  if (adminCheck) return adminCheck;

  const validatedFields = UpdateAvatarSchema.safeParse({
    userId: formData.get('userId'),
    avatar: formData.get('avatar'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.flatten().fieldErrors.avatar?.[0] || 'Arquivo inválido.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { userId, avatar } = validatedFields.data;
  
  try {
    if (!storageAdmin) throw new Error("Firebase Storage Admin not initialized.");
    const bucket = storageAdmin.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const filePath = `avatars/${userId}`;
    const fileUpload = bucket.file(filePath);

    const buffer = Buffer.from(await avatar.arrayBuffer());

    await fileUpload.save(buffer, {
      metadata: { contentType: avatar.type },
    });
    
    await fileUpload.makePublic();
    const downloadURL = fileUpload.publicUrl();
    
    await db.collection('users').doc(userId).update({
        avatarUrl: downloadURL,
    });
    
    revalidatePath('/profile');
    revalidatePath('/(dashboard)', 'layout'); // Revalidate layout to update header avatar

    return { success: true, message: 'Avatar atualizado com sucesso!', errors: null };

  } catch (error) {
    console.error('Error uploading avatar via server action:', error);
    return { success: false, message: 'Ocorreu um erro ao fazer upload do avatar.', errors: null };
  }
}
