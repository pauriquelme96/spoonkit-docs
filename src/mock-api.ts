import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import type { UserModel } from './domain/User/UserModel';

// Crear una instancia del mock adapter con delay de 500ms
const mock = new MockAdapter(axios, { delayResponse: 500 });

// Base de datos falsa de usuarios
let usersDb: (UserModel & { id: string })[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan.perez@example.com',
    age: 28
  },
  {
    id: '2',
    name: 'María García',
    email: 'maria.garcia@example.com',
    age: 32
  },
  {
    id: '3',
    name: 'Carlos López',
    email: 'carlos.lopez@example.com',
    age: 25
  },
  {
    id: '4',
    name: 'Ana Martínez',
    email: 'ana.martinez@example.com',
    age: 29
  }
];

// Función para generar IDs únicos
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// GET /users - Obtener todos los usuarios
mock.onGet('/api/users').reply(() => {
  return [200, usersDb];
});

// GET /users/:id - Obtener un usuario por ID
mock.onGet(/\/api\/users\/\d+/).reply((config) => {
  const id = config.url?.split('/').pop();
  const user = usersDb.find(u => u.id === id);
  
  if (user) {
    return [200, user];
  } else {
    return [404, { error: 'Usuario no encontrado' }];
  }
});

// POST /users - Crear un nuevo usuario
mock.onPost('/api/users').reply((config) => {
  try {
    const userData = JSON.parse(config.data) as UserModel;
    
    // Validar datos básicos
    if (!userData.name || !userData.email || !userData.age) {
      return [400, { error: 'Datos incompletos. Se requiere name, email y age.' }];
    }

    // Validar email único
    const existingUser = usersDb.find(u => u.email === userData.email);
    if (existingUser) {
      return [409, { error: 'El email ya está en uso.' }];
    }

    // Crear nuevo usuario
    const newUser = {
      id: generateId(),
      ...userData
    };

    usersDb.push(newUser);
    return [201, newUser];
  } catch (error) {
    return [400, { error: 'Datos inválidos' }];
  }
});

// PUT /users/:id - Actualizar un usuario completo
mock.onPut(/\/api\/users\/\w+/).reply((config) => {
  try {
    const id = config.url?.split('/').pop();
    const userData = JSON.parse(config.data) as UserModel;
    const userIndex = usersDb.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return [404, { error: 'Usuario no encontrado' }];
    }

    // Validar datos básicos
    if (!userData.name || !userData.email || !userData.age) {
      return [400, { error: 'Datos incompletos. Se requiere name, email y age.' }];
    }

    // Validar email único (excluyendo el usuario actual)
    const existingUser = usersDb.find(u => u.email === userData.email && u.id !== id);
    if (existingUser) {
      return [409, { error: 'El email ya está en uso.' }];
    }

    // Actualizar usuario
    usersDb[userIndex] = { id: id!, ...userData };
    return [200, usersDb[userIndex]];
  } catch (error) {
    return [400, { error: 'Datos inválidos' }];
  }
});

// PATCH /users/:id - Actualizar parcialmente un usuario
mock.onPatch(/\/api\/users\/\w+/).reply((config) => {
  try {
    const id = config.url?.split('/').pop();
    const partialData = JSON.parse(config.data) as Partial<UserModel>;
    const userIndex = usersDb.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return [404, { error: 'Usuario no encontrado' }];
    }

    // Validar email único si se está actualizando
    if (partialData.email) {
      const existingUser = usersDb.find(u => u.email === partialData.email && u.id !== id);
      if (existingUser) {
        return [409, { error: 'El email ya está en uso.' }];
      }
    }

    // Actualizar campos proporcionados
    usersDb[userIndex] = { ...usersDb[userIndex], ...partialData };
    return [200, usersDb[userIndex]];
  } catch (error) {
    return [400, { error: 'Datos inválidos' }];
  }
});

// DELETE /users/:id - Eliminar un usuario
mock.onDelete(/\/api\/users\/\w+/).reply((config) => {
  const id = config.url?.split('/').pop();
  const userIndex = usersDb.findIndex(u => u.id === id);

  if (userIndex === -1) {
    return [404, { error: 'Usuario no encontrado' }];
  } else {
    const deletedUser = usersDb.splice(userIndex, 1)[0];
    return [200, deletedUser];
  }
});

// GET /users/search - Buscar usuarios por nombre o email
mock.onGet('/api/users/search').reply((config) => {
  const query = config.params?.q?.toLowerCase() || '';
  
  if (!query) {
    return [400, { error: 'Parámetro de búsqueda requerido' }];
  }

  const filteredUsers = usersDb.filter(user => 
    user.name.toLowerCase().includes(query) || 
    user.email.toLowerCase().includes(query)
  );

  return [200, filteredUsers];
});

// Manejar rutas no encontradas
mock.onAny().passThrough();

export default mock;