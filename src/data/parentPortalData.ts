export type Parent = {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
};

export type Toy = {
  id: string;
  childId: string;
  name: string;
  kind: string;
  style: string;
  description: string;
  color: string;
  status: "online" | "idle" | "offline";
  battery: number;
  lastUsedAt: string;
};

export type Child = {
  id: string;
  fullName: string;
  nickname: string;
  age: number;
  avatarColor: string;
  diagnosisBase: string;
  personality: string;
  toyId: string;
};

export type ConversationMessage = {
  id: string;
  role: "child" | "toy";
  text: string;
  sentAt: string;
};

export type ConversationSession = {
  id: string;
  childId: string;
  toyId: string;
  status: "active" | "closed";
  startedAt: string;
  endedAt?: string;
  durationMin?: number;
  summary: string;
  emotion?: string;
  messages: ConversationMessage[];
};

export type UsageEvent = {
  id: string;
  childId: string;
  toyId: string;
  usedAt: string;
  label: string;
  detail: string;
  sessionId?: string;
};

export type FamilyOverview = {
  id: string;
  name: string;
  parents: Parent[];
  children: Child[];
  toys: Toy[];
  sessions: ConversationSession[];
  usageEvents: UsageEvent[];
};

const family: FamilyOverview = {
  id: "family-aravena",
  name: "Familia Aravena",
  parents: [
    { id: "parent-camila", name: "Camila", role: "Madre", avatarColor: "var(--teal)" },
    { id: "parent-felipe", name: "Felipe", role: "Padre", avatarColor: "var(--ink)" },
  ],
  children: [
    {
      id: "child-luna",
      fullName: "Luna Aravena",
      nickname: "Lu",
      age: 5,
      avatarColor: "#C04A6A",
      diagnosisBase: "TDAH leve",
      personality: "Muy empatica, sensible a ruidos fuertes, le encantan los animales.",
      toyId: "toy-teddy",
    },
    {
      id: "child-mateo",
      fullName: "Mateo Aravena",
      nickname: "Teo",
      age: 7,
      avatarColor: "#4A6FA5",
      diagnosisBase: "Sin diagnostico base",
      personality: "Curioso, creativo, disfruta construir historias con bloques y dibujos.",
      toyId: "toy-nube",
    },
  ],
  toys: [
    {
      id: "toy-teddy",
      childId: "child-luna",
      name: "Teddy",
      kind: "Osito de peluche azul",
      style: "Suave y calido",
      description: "Le gusta inventar canciones cortas. Escucha con atencion y habla con mucho carino.",
      color: "#4A6FA5",
      status: "online",
      battery: 82,
      lastUsedAt: "2026-05-03T15:42:00",
    },
    {
      id: "toy-nube",
      childId: "child-mateo",
      name: "Nube",
      kind: "Conejo de tela",
      style: "Curioso y jugueton",
      description: "Hace preguntas simples, propone juegos de imaginacion y ayuda a ordenar ideas.",
      color: "#3A8A5A",
      status: "idle",
      battery: 64,
      lastUsedAt: "2026-05-03T11:10:00",
    },
  ],
  sessions: [
    {
      id: "session-luna-1",
      childId: "child-luna",
      toyId: "toy-teddy",
      status: "active",
      startedAt: "2026-05-03T15:42:00",
      summary: "Lu hablo con Teddy sobre su miedo antes de ir al doctor.",
      emotion: "Ansiosa",
      messages: [
        {
          id: "msg-1",
          role: "child",
          text: "Teddy, tengo miedo de ir al doctor",
          sentAt: "2026-05-03T15:42:00",
        },
        {
          id: "msg-2",
          role: "toy",
          text: "Entiendo, Lu. Los doctores ayudan a que te sientas mejor, y yo voy a estar pensando en ti.",
          sentAt: "2026-05-03T15:42:20",
        },
        {
          id: "msg-3",
          role: "child",
          text: "Me va a doler?",
          sentAt: "2026-05-03T15:43:00",
        },
        {
          id: "msg-4",
          role: "toy",
          text: "A veces un poquito, pero tu eres muy valiente. Quieres que inventemos una cancion para ir juntos?",
          sentAt: "2026-05-03T15:43:20",
        },
      ],
    },
    {
      id: "session-luna-2",
      childId: "child-luna",
      toyId: "toy-teddy",
      status: "closed",
      startedAt: "2026-05-02T18:05:00",
      endedAt: "2026-05-02T18:17:00",
      durationMin: 12,
      summary: "Teddy ayudo a Lu a bajar la frustracion despues de una tarea dificil.",
      emotion: "Frustrada",
      messages: [
        {
          id: "msg-5",
          role: "child",
          text: "No quiero hacer la tarea, es muy dificil.",
          sentAt: "2026-05-02T18:05:00",
        },
        {
          id: "msg-6",
          role: "toy",
          text: "Podemos partir por una parte pequena. Yo te acompano y despues descansamos.",
          sentAt: "2026-05-02T18:06:00",
        },
        {
          id: "msg-7",
          role: "child",
          text: "Solo una parte.",
          sentAt: "2026-05-02T18:07:00",
        },
      ],
    },
    {
      id: "session-mateo-1",
      childId: "child-mateo",
      toyId: "toy-nube",
      status: "closed",
      startedAt: "2026-05-03T11:10:00",
      endedAt: "2026-05-03T11:21:00",
      durationMin: 11,
      summary: "Mateo y Nube inventaron una historia sobre astronautas.",
      emotion: "Entusiasmado",
      messages: [
        {
          id: "msg-8",
          role: "child",
          text: "Nube, quiero hacer un cohete.",
          sentAt: "2026-05-03T11:10:00",
        },
        {
          id: "msg-9",
          role: "toy",
          text: "Buena idea, capitan Teo. Que planeta vamos a visitar primero?",
          sentAt: "2026-05-03T11:10:30",
        },
      ],
    },
  ],
  usageEvents: [
    {
      id: "usage-1",
      childId: "child-luna",
      toyId: "toy-teddy",
      usedAt: "2026-05-03T15:42:00",
      label: "Teddy fue usado por Lu",
      detail: "Sesion activa, 4 mensajes registrados.",
      sessionId: "session-luna-1",
    },
    {
      id: "usage-2",
      childId: "child-mateo",
      toyId: "toy-nube",
      usedAt: "2026-05-03T11:10:00",
      label: "Nube converso con Teo",
      detail: "Historia guiada, 11 minutos.",
      sessionId: "session-mateo-1",
    },
    {
      id: "usage-3",
      childId: "child-luna",
      toyId: "toy-teddy",
      usedAt: "2026-05-02T18:05:00",
      label: "Teddy acompano una frustracion",
      detail: "Sesion cerrada, emocion detectada: frustrada.",
      sessionId: "session-luna-2",
    },
  ],
};

const wait = async <T,>(value: T): Promise<T> =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(value), 80);
  });

export async function getFamilyOverview(): Promise<FamilyOverview> {
  return wait(family);
}

export async function getChild(childId: string): Promise<Child | undefined> {
  return wait(family.children.find((child) => child.id === childId));
}

export async function getChildSessions(childId: string): Promise<ConversationSession[]> {
  return wait(family.sessions.filter((session) => session.childId === childId));
}

export async function getSession(sessionId: string): Promise<ConversationSession | undefined> {
  return wait(family.sessions.find((session) => session.id === sessionId));
}

export async function getToy(toyId: string): Promise<Toy | undefined> {
  return wait(family.toys.find((toy) => toy.id === toyId));
}
