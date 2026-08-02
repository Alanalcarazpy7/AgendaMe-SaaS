export type RubroNegocio = {
  id: string;
  clave: string;
  nombre: string;
  descripcion: string;
  icono: string;
  orden: number;
};

export const RUBROS_NEGOCIO_INICIALES: RubroNegocio[] = [
  {
    id: "a1000000-0000-4000-8000-000000000001",
    clave: "barberia",
    nombre: "Barbería",
    descripcion: "Barberías, grooming y cuidado masculino.",
    icono: "scissors",
    orden: 10,
  },
  {
    id: "a1000000-0000-4000-8000-000000000002",
    clave: "peluqueria",
    nombre: "Peluquería",
    descripcion: "Salones de cabello, color y peinado.",
    icono: "sparkles",
    orden: 20,
  },
  {
    id: "a1000000-0000-4000-8000-000000000003",
    clave: "estetica-belleza",
    nombre: "Estética y belleza",
    descripcion: "Centros de estética, maquillaje y cuidado personal.",
    icono: "wand-sparkles",
    orden: 30,
  },
  {
    id: "a1000000-0000-4000-8000-000000000004",
    clave: "unas-manicura",
    nombre: "Uñas y manicura",
    descripcion: "Manicura, pedicura y nail art.",
    icono: "hand",
    orden: 40,
  },
  {
    id: "a1000000-0000-4000-8000-000000000005",
    clave: "spa-masajes",
    nombre: "Spa y masajes",
    descripcion: "Spa, masajes, relajación y bienestar corporal.",
    icono: "flower-2",
    orden: 50,
  },
  {
    id: "a1000000-0000-4000-8000-000000000006",
    clave: "salud-bienestar",
    nombre: "Salud y bienestar",
    descripcion: "Consultorios, nutrición, fisioterapia y terapias.",
    icono: "heart-pulse",
    orden: 60,
  },
  {
    id: "a1000000-0000-4000-8000-000000000007",
    clave: "odontologia",
    nombre: "Odontología",
    descripcion: "Clínicas y consultorios odontológicos.",
    icono: "badge-plus",
    orden: 70,
  },
  {
    id: "a1000000-0000-4000-8000-000000000008",
    clave: "psicologia-terapias",
    nombre: "Psicología y terapias",
    descripcion: "Psicología, coaching y acompañamiento profesional.",
    icono: "brain",
    orden: 80,
  },
  {
    id: "a1000000-0000-4000-8000-000000000009",
    clave: "fitness-deporte",
    nombre: "Fitness y deporte",
    descripcion: "Gimnasios, entrenadores, yoga y clases deportivas.",
    icono: "dumbbell",
    orden: 90,
  },
  {
    id: "a1000000-0000-4000-8000-000000000010",
    clave: "tatuajes-piercing",
    nombre: "Tatuajes y piercing",
    descripcion: "Estudios de tatuajes, piercing y arte corporal.",
    icono: "pen-tool",
    orden: 100,
  },
  {
    id: "a1000000-0000-4000-8000-000000000011",
    clave: "veterinaria-mascotas",
    nombre: "Veterinaria y mascotas",
    descripcion: "Veterinarias, peluquería y cuidado de mascotas.",
    icono: "paw-print",
    orden: 110,
  },
  {
    id: "a1000000-0000-4000-8000-000000000012",
    clave: "educacion-clases",
    nombre: "Educación y clases",
    descripcion: "Academias, docentes, tutorías y clases particulares.",
    icono: "graduation-cap",
    orden: 120,
  },
  {
    id: "a1000000-0000-4000-8000-000000000013",
    clave: "servicios-profesionales",
    nombre: "Servicios profesionales",
    descripcion: "Asesorías, consultorías y atención profesional.",
    icono: "briefcase-business",
    orden: 130,
  },
  {
    id: "a1000000-0000-4000-8000-000000000014",
    clave: "fotografia-eventos",
    nombre: "Fotografía y eventos",
    descripcion: "Fotografía, producción y servicios para eventos.",
    icono: "camera",
    orden: 140,
  },
  {
    id: "a1000000-0000-4000-8000-000000000015",
    clave: "automotor-taller",
    nombre: "Automotor y taller",
    descripcion: "Talleres, detailing y servicios para vehículos.",
    icono: "car-front",
    orden: 150,
  },
  {
    id: "a1000000-0000-4000-8000-000000000016",
    clave: "otro",
    nombre: "Otro tipo de negocio",
    descripcion: "Para actividades que todavía no figuran en el catálogo.",
    icono: "shapes",
    orden: 999,
  },
];

export function normalizarRubroClave(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buscarRubroInicial(claveONombre: string) {
  const clave = normalizarRubroClave(claveONombre);

  return RUBROS_NEGOCIO_INICIALES.find(
    (rubro) =>
      rubro.clave === clave || normalizarRubroClave(rubro.nombre) === clave,
  );
}
