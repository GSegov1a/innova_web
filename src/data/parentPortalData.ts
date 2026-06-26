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

type BackendChild = {
  id: number;
  name: string;
  age: number;
  toy_name: string | null;
  created_at: string;
};

type BackendSession = {
  id: number;
  child_id: number;
  status: string;
  started_at: string;
  ended_at: string | null;
};

type BackendTurn = {
  id: number;
  session_id: number;
  role: "child" | "assistant" | "toy" | string;
  text: string;
  created_at: string;
};

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "https://innovabackend-production-c18a.up.railway.app"
).replace(/\/+$/, "");

const childColors = ["#C04A6A", "#4A6FA5", "#3A8A5A", "#C47A1E"];
const toyColors = ["#4A6FA5", "#3A8A5A", "#2B8C8C", "#C04A6A"];

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status} ${path}`);
  }

  return response.json() as Promise<T>;
}

function mapChild(child: BackendChild, index: number): Child {
  const name = child.name || `Niño ${child.id}`;

  return {
    id: String(child.id),
    fullName: name,
    nickname: name.split(" ")[0],
    age: child.age,
    avatarColor: childColors[index % childColors.length],
    diagnosisBase: "No registrado en backend",
    personality: "Perfil pendiente de completar desde el panel de padres.",
    toyId: toyIdForChild(child.id),
  };
}

function mapToy(child: BackendChild, index: number, activeSession?: BackendSession | null): Toy {
  const toyName = child.toy_name || "Peluche";
  const lastUsedAt = activeSession?.started_at ?? child.created_at;

  return {
    id: toyIdForChild(child.id),
    childId: String(child.id),
    name: toyName,
    kind: "Peluche conectado",
    style: "Acompañante y tranquilo",
    description: `${toyName} conversa con ${child.name} y registra las sesiones para que los papas puedan revisarlas.`,
    color: toyColors[index % toyColors.length],
    status: activeSession ? "online" : "idle",
    battery: 100,
    lastUsedAt,
  };
}

function mapSession(session: BackendSession, child: BackendChild, messages: ConversationMessage[]): ConversationSession {
  const lastChildMessage = [...messages].reverse().find((message) => message.role === "child");
  const lastToyMessage = [...messages].reverse().find((message) => message.role === "toy");
  const summary = lastChildMessage
    ? `${child.name} dijo: "${lastChildMessage.text}"`
    : `Sesion activa iniciada para ${child.name}.`;

  return {
    id: String(session.id),
    childId: String(session.child_id),
    toyId: toyIdForChild(session.child_id),
    status: session.status === "closed" ? "closed" : "active",
    startedAt: session.started_at,
    endedAt: session.ended_at ?? undefined,
    durationMin: session.ended_at ? minutesBetween(session.started_at, session.ended_at) : undefined,
    summary: lastToyMessage ? `${summary} Ultima respuesta del peluche registrada.` : summary,
    emotion: inferEmotion(messages),
    messages,
  };
}

function mapTurn(turn: BackendTurn): ConversationMessage {
  return {
    id: String(turn.id),
    role: turn.role === "child" ? "child" : "toy",
    text: turn.text,
    sentAt: turn.created_at,
  };
}

function toyIdForChild(childId: number) {
  return `toy-${childId}`;
}

function minutesBetween(start: string, end: string) {
  return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

function inferEmotion(messages: ConversationMessage[]) {
  const text = messages
    .filter((message) => message.role === "child")
    .map((message) => message.text.toLowerCase())
    .join(" ");

  if (text.includes("nervios") || text.includes("nervioso") || text.includes("vergüenza")) return "Nervioso";
  if (text.includes("triste") || text.includes("llorar")) return "Triste";
  if (text.includes("enojado") || text.includes("rabia")) return "Enojado";
  if (text.includes("miedo")) return "Asustado";
  return undefined;
}

function usageFromSession(session: ConversationSession, child: Child, toy: Toy): UsageEvent {
  const lastMessage = session.messages[session.messages.length - 1];

  return {
    id: `usage-${session.id}`,
    childId: child.id,
    toyId: toy.id,
    usedAt: lastMessage?.sentAt ?? session.startedAt,
    label: `${toy.name} fue usado por ${child.nickname}`,
    detail: `${session.status === "active" ? "Sesion activa" : "Sesion cerrada"}, ${session.messages.length} mensajes registrados.`,
    sessionId: session.id,
  };
}

async function getActiveSessionForChild(childId: number) {
  const session = await fetchJson<BackendSession | null>(`/sessions/active/${childId}`);
  return session && "id" in session ? session : null;
}

async function getTurnsForSession(sessionId: number) {
  const turns = await fetchJson<BackendTurn[] | { error: string }>(`/sessions/${sessionId}/turns`);
  return Array.isArray(turns) ? turns.map(mapTurn) : [];
}

async function buildFamilyOverview(): Promise<FamilyOverview> {
  const backendChildren = await fetchJson<BackendChild[]>("/children");
  const activeSessions = await Promise.all(
    backendChildren.map(async (child) => ({
      child,
      activeSession: await getActiveSessionForChild(child.id),
    })),
  );

  const children = backendChildren.map(mapChild);
  const toys = backendChildren.map((child, index) => {
    const activeSession = activeSessions.find((entry) => entry.child.id === child.id)?.activeSession;
    return mapToy(child, index, activeSession);
  });

  const sessions = (
    await Promise.all(
      activeSessions
        .filter((entry): entry is { child: BackendChild; activeSession: BackendSession } => Boolean(entry.activeSession))
        .map(async ({ child, activeSession }) => {
          const messages = await getTurnsForSession(activeSession.id);
          return mapSession(activeSession, child, messages);
        }),
    )
  ).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  const usageEvents = sessions
    .map((session) => {
      const child = children.find((item) => item.id === session.childId);
      const toy = toys.find((item) => item.id === session.toyId);
      return child && toy ? usageFromSession(session, child, toy) : null;
    })
    .filter((event): event is UsageEvent => Boolean(event))
    .sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime());

  return {
    id: "backend-family",
    name: "Mi familia",
    parents: [{ id: "parent-default", name: "Papa/Mama", role: "Cuidador", avatarColor: "var(--teal)" }],
    children,
    toys,
    sessions,
    usageEvents,
  };
}

let familyCache: FamilyOverview | null = null;

export async function getFamilyOverview(): Promise<FamilyOverview> {
  familyCache = await buildFamilyOverview();
  return familyCache;
}

export async function getChild(childId: string): Promise<Child | undefined> {
  const family = familyCache ?? (await getFamilyOverview());
  return family.children.find((child) => child.id === childId);
}

export async function getChildSessions(childId: string): Promise<ConversationSession[]> {
  const family = familyCache ?? (await getFamilyOverview());
  return family.sessions.filter((session) => session.childId === childId);
}

export async function getSession(sessionId: string): Promise<ConversationSession | undefined> {
  const family = familyCache ?? (await getFamilyOverview());
  return family.sessions.find((session) => session.id === sessionId);
}

export async function getToy(toyId: string): Promise<Toy | undefined> {
  const family = familyCache ?? (await getFamilyOverview());
  return family.toys.find((toy) => toy.id === toyId);
}
