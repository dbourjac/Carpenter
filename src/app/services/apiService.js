// Definimos la URL base para comunicarnos con el servidor en la sección de servicios
const API_URL = "http://localhost:3000";

// Función auxiliar para obtener los encabezados con el token del localStorage
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : ""
  };
};

export const apiService = {
  // --- OPERACIONES BÁSICAS (CRUD) ---

  // Trae la lista de todos los servicios registrados
  getAll: async () => {
    const res = await fetch(API_URL, {
      method: "GET",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Error al obtener servicios del servidor");
    return res.json();
  },

  // Busca un servicio específico usando su ID
  getById: async (id) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("No se pudo encontrar el servicio");
    return res.json();
  },

  // Envía la información para crear un nuevo servicio
  create: async (datos) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(datos) // Convertimos el objeto a texto para el envío
    });
    if (!res.ok) throw new Error("Error al registrar el nuevo servicio");
    return res.json();
  },

  // Actualiza la información de un servicio existente
  update: async (id, datos) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error("Error al modificar los datos del servicio");
    return res.json();
  },

  // Elimina un servicio definitivamente
  remove: async (id) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("No se pudo eliminar el servicio");
    return res.json();
  },

  // --- CAMBIOS DE ESTADO RÁPIDOS (PATCH) ---

  // Marca el servicio como terminado (requiere fecha de finalización)
  completar: async (id, fecha_fin) => {
    const res = await fetch(`${API_URL}/${id}/completar`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ fecha_fin })
    });
    if (!res.ok) throw new Error("No se pudo registrar la finalización");
    return res.json();
  },

  // Cambia el estatus (ej: de 'Pendiente' a 'En progreso')
  cambiarStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error("Error al actualizar el estado del servicio");
    return res.json();
  },

  // Cambia qué tan urgente es el servicio (baja, media, alta)
  cambiarPrioridad: async (id, prioridad) => {
    const res = await fetch(`${API_URL}/${id}/prioridad`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ prioridad })
    });
    if (!res.ok) throw new Error("No se pudo cambiar la prioridad");
    return res.json();
  },

  // --- GESTIÓN DE UTENSILIOS (Herramientas utilizadas) ---

  // Lista qué herramientas se están usando en este servicio específico
  getUtensilios: async (id) => {
    const res = await fetch(`${API_URL}/${id}/utensilios`, { headers: getHeaders() });
    if (!res.ok) throw new Error("No se pudo obtener la lista de herramientas");
    return res.json();
  },

  // Agrega una herramienta al registro del servicio
  addUtensilio: async (id, datos) => {
    const res = await fetch(`${API_URL}/${id}/utensilios`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error("Error al asignar la herramienta");
    return res.json();
  },

  // Quita una herramienta del servicio
  removeUtensilio: async (id, utensilio_id) => {
    const res = await fetch(`${API_URL}/${id}/utensilios/${utensilio_id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("No se pudo quitar la herramienta del registro");
    return res.json();
  },

  // --- GESTIÓN DE EVIDENCIAS (Fotos del trabajo) ---

  // Obtiene las fotos o evidencias cargadas para este servicio
  getEvidencias: async (id) => {
    const res = await fetch(`${API_URL}/${id}/evidencias`, { headers: getHeaders() });
    if (!res.ok) throw new Error("No se pudieron cargar las fotos");
    return res.json();
  },

  // Sube una nueva foto (el servidor la recibe en formato Base64)
  addEvidencia: async (id, datos) => {
    const res = await fetch(`${API_URL}/${id}/evidencias`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error("Error al subir la evidencia");
    return res.json();
  },

  // Elimina una foto específica del registro
  deleteEvidencia: async (id, evidencia_id) => {
    const res = await fetch(`${API_URL}/${id}/evidencias/${evidencia_id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("No se pudo eliminar la evidencia");
    return res.json();
  }
};
