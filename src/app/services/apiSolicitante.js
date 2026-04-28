// Definimos la URL base directamente
const API_URL = "http://localhost:3000";

// Función auxiliar para obtener el token automáticamente
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : ""
  };
};

export const apiSolicitante = {
  // GET / -> Lista todos
  getAll: async () => {
    const res = await fetch(API_URL, {
      method: "GET",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Error al obtener solicitantes");
    return res.json();
  },

  // GET /:id -> Obtiene uno por ID
  getById: async (id) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Error al obtener el solicitante");
    return res.json();
  },

  // POST / -> Crea uno nuevo (usa 'datos' en el body)
  create: async (datos) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error("Error al crear el solicitante");
    return res.json();
  },

  // PUT /:id -> Actualiza (id en URL y datos en body)
  update: async (id, datos) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error("Error al actualizar el solicitante");
    return res.json();
  },

  // DELETE /:id -> Elimina
  remove: async (id) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Error al eliminar el solicitante");
    return res.json();
  },
};