import { useEffect, useMemo, useState } from "react";
import {
  Child,
  ConversationSession,
  FamilyOverview,
  Toy,
  UsageEvent,
  getFamilyOverview,
} from "./data/parentPortalData";

type Route =
  | { name: "home" }
  | { name: "child"; childId: string }
  | { name: "sessions"; childId: string }
  | { name: "session"; childId: string; sessionId: string }
  | { name: "toy"; childId: string; toyId: string };

const routeFromPath = (path: string): Route => {
  const parts = path.split("/").filter(Boolean);

  if (parts[0] === "children" && parts[1] && parts[2] === "sessions" && parts[3]) {
    return { name: "session", childId: parts[1], sessionId: parts[3] };
  }

  if (parts[0] === "children" && parts[1] && parts[2] === "sessions") {
    return { name: "sessions", childId: parts[1] };
  }

  if (parts[0] === "children" && parts[1] && parts[2] === "toy" && parts[3]) {
    return { name: "toy", childId: parts[1], toyId: parts[3] };
  }

  if (parts[0] === "children" && parts[1]) {
    return { name: "child", childId: parts[1] };
  }

  return { name: "home" };
};

const routeToPath = (route: Route): string => {
  if (route.name === "child") return `/children/${route.childId}`;
  if (route.name === "sessions") return `/children/${route.childId}/sessions`;
  if (route.name === "session") return `/children/${route.childId}/sessions/${route.sessionId}`;
  if (route.name === "toy") return `/children/${route.childId}/toy/${route.toyId}`;
  return "/";
};

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" }).format(new Date(value));

const messageCount = (session: ConversationSession) => session.messages.length;

function App() {
  const [data, setData] = useState<FamilyOverview | null>(null);
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname));

  useEffect(() => {
    getFamilyOverview().then(setData);
  }, []);

  useEffect(() => {
    const onPopState = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (nextRoute: Route) => {
    const nextPath = routeToPath(nextRoute);
    window.history.pushState(null, "", nextPath);
    setRoute(nextRoute);
  };

  const goBack = () => {
    window.history.back();
  };

  if (!data) {
    return (
      <PhoneShell>
        <div className="loading">Cargando familia...</div>
      </PhoneShell>
    );
  }

  const firstChild = data.children[0];
  const currentChildId = "childId" in route ? route.childId : firstChild.id;

  return (
    <PhoneShell>
      {route.name === "home" && <HomePage data={data} navigate={navigate} />}
      {route.name === "child" && (
        <ChildPage data={data} childId={route.childId} navigate={navigate} goBack={goBack} />
      )}
      {route.name === "sessions" && (
        <SessionsPage data={data} childId={route.childId} navigate={navigate} goBack={goBack} />
      )}
      {route.name === "session" && (
        <SessionPage
          data={data}
          childId={route.childId}
          sessionId={route.sessionId}
          navigate={navigate}
          goBack={goBack}
        />
      )}
      {route.name === "toy" && (
        <ToyPage data={data} childId={route.childId} toyId={route.toyId} goBack={goBack} />
      )}
      {route.name !== "session" && (
        <BottomNav route={route} childId={currentChildId} navigate={navigate} />
      )}
    </PhoneShell>
  );
}

function PhoneShell({ children }: { children: React.ReactNode }) {
  return <main className="phone-shell">{children}</main>;
}

function TopBar({
  title,
  action,
  onBack,
}: {
  title: string;
  action?: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <header className="topbar">
      {onBack ? (
        <button className="icon-btn" onClick={onBack} aria-label="Volver">
          <span aria-hidden="true">‹</span>
        </button>
      ) : (
        <div className="topbar-spacer" />
      )}
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-side">{action}</div>
    </header>
  );
}

function Avatar({
  label,
  color,
  size = 48,
}: {
  label: string;
  color: string;
  size?: number;
}) {
  return (
    <div className="avatar" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
      {label}
    </div>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "active" | "green" | "blue";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function HomePage({
  data,
  navigate,
}: {
  data: FamilyOverview;
  navigate: (route: Route) => void;
}) {
  const activeSessions = data.sessions.filter((session) => session.status === "active");
  const totalMessages = data.sessions.reduce((count, session) => count + session.messages.length, 0);
  const recentEvents = [...data.usageEvents].sort(
    (a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime(),
  );

  return (
    <>
      <section className="home-hero">
        <div>
          <p className="eyebrow">{data.name}</p>
          <h1>Buenas tardes, {data.parents[0].name}</h1>
        </div>
        <Avatar label={data.parents[0].name[0]} color={data.parents[0].avatarColor} size={42} />
      </section>

      <div className="scroll">
        <div className="pad">
          <div className="stats-grid">
            <Stat label="Conversaciones" value={`${activeSessions.length} activa`} accent />
            <Stat label="Mensajes" value={`${totalMessages} registrados`} />
          </div>

          <SectionTitle>Tus niños</SectionTitle>
          <div className="stack">
            {data.children.map((child) => {
              const toy = data.toys.find((item) => item.id === child.toyId)!;
              const childSessions = data.sessions.filter((session) => session.childId === child.id);
              const active = childSessions.some((session) => session.status === "active");

              return (
                <button
                  key={child.id}
                  className="card row-card"
                  onClick={() => navigate({ name: "child", childId: child.id })}
                >
                  <Avatar label={child.fullName[0]} color={child.avatarColor} size={52} />
                  <div className="row-main">
                    <h2>{child.fullName}</h2>
                    <p>
                      {child.nickname} · {child.age} años
                    </p>
                    <div className="inline-meta">
                      <ToyMark color={toy.color} />
                      <span>{toy.name}</span>
                      {active && <Badge tone="active">Sesion activa</Badge>}
                    </div>
                  </div>
                  <span className="chevron">›</span>
                </button>
              );
            })}
          </div>

          <SectionTitle>Uso reciente de peluches</SectionTitle>
          <div className="card">
            {recentEvents.map((event, index) => (
              <UsageRow
                key={event.id}
                data={data}
                event={event}
                last={index === recentEvents.length - 1}
                onClick={() =>
                  event.sessionId &&
                  navigate({ name: "session", childId: event.childId, sessionId: event.sessionId })
                }
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function ChildPage({
  data,
  childId,
  navigate,
  goBack,
}: {
  data: FamilyOverview;
  childId: string;
  navigate: (route: Route) => void;
  goBack: () => void;
}) {
  const child = data.children.find((item) => item.id === childId) ?? data.children[0];
  const toy = data.toys.find((item) => item.id === child.toyId)!;
  const sessions = data.sessions.filter((session) => session.childId === child.id);
  const activeSession = sessions.find((session) => session.status === "active");
  const usageEvents = data.usageEvents.filter((event) => event.childId === child.id);

  return (
    <>
      <TopBar title="" onBack={goBack} />
      <div className="child-header">
        <Avatar label={child.fullName[0]} color={child.avatarColor} size={64} />
        <div>
          <h1>{child.fullName}</h1>
          <p>
            {child.nickname} · {child.age} años
          </p>
          <div className="inline-meta">
            <ToyMark color={toy.color} />
            <span>{toy.name}</span>
          </div>
        </div>
      </div>

      <div className="scroll">
        <div className="pad">
          <div className="stats-grid triple">
            <Stat label="Peluche" value={toy.status === "online" ? "En linea" : "Disponible"} accent />
            <Stat label="Sesion" value={activeSession ? "Activa" : "Sin uso"} />
            <Stat label="Bateria" value={`${toy.battery}%`} />
          </div>

          <SectionTitle>Resumen</SectionTitle>
          <div className="card content-card">
            <p>{child.personality}</p>
            <div className="soft-note">
              <strong>Diagnostico base</strong>
              <span>{child.diagnosisBase}</span>
            </div>
          </div>

          <SectionTitle>Acciones</SectionTitle>
          <div className="grid-actions">
            <button className="action-card" onClick={() => navigate({ name: "toy", childId: child.id, toyId: toy.id })}>
              <span className="action-icon" style={{ background: `${toy.color}22` }}>
                🧸
              </span>
              <strong>Peluche</strong>
              <small>{toy.name} · {toy.kind}</small>
            </button>
            <button className="action-card" onClick={() => navigate({ name: "sessions", childId: child.id })}>
              <span className="action-icon">💬</span>
              <strong>Conversaciones</strong>
              <small>{sessions.length} sesiones registradas</small>
            </button>
          </div>

          <SectionTitle>Ultimos usos</SectionTitle>
          <div className="card">
            {usageEvents.map((event, index) => (
              <UsageRow
                key={event.id}
                data={data}
                event={event}
                last={index === usageEvents.length - 1}
                onClick={() =>
                  event.sessionId &&
                  navigate({ name: "session", childId: child.id, sessionId: event.sessionId })
                }
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function SessionsPage({
  data,
  childId,
  navigate,
  goBack,
}: {
  data: FamilyOverview;
  childId: string;
  navigate: (route: Route) => void;
  goBack: () => void;
}) {
  const child = data.children.find((item) => item.id === childId) ?? data.children[0];
  const sessions = data.sessions.filter((session) => session.childId === child.id);
  const active = sessions.filter((session) => session.status === "active");
  const closed = sessions.filter((session) => session.status === "closed");

  return (
    <>
      <TopBar title="Conversaciones" onBack={goBack} />
      <div className="scroll">
        <div className="pad top-pad">
          <SectionTitle>Sesion activa</SectionTitle>
          {active.length ? (
            <div className="stack">
              {active.map((session) => (
                <SessionCard
                  key={session.id}
                  data={data}
                  session={session}
                  highlight
                  onClick={() => navigate({ name: "session", childId: child.id, sessionId: session.id })}
                />
              ))}
            </div>
          ) : (
            <EmptyState text="No hay sesiones activas para este hijo." />
          )}

          <SectionTitle>Historial</SectionTitle>
          <div className="stack">
            {closed.map((session) => (
              <SessionCard
                key={session.id}
                data={data}
                session={session}
                onClick={() => navigate({ name: "session", childId: child.id, sessionId: session.id })}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function SessionPage({
  data,
  childId,
  sessionId,
  navigate,
  goBack,
}: {
  data: FamilyOverview;
  childId: string;
  sessionId: string;
  navigate: (route: Route) => void;
  goBack: () => void;
}) {
  const session = data.sessions.find((item) => item.id === sessionId);
  const child = data.children.find((item) => item.id === childId) ?? data.children[0];
  const toy = session ? data.toys.find((item) => item.id === session.toyId)! : undefined;

  if (!session || !toy) {
    return (
      <>
        <TopBar title="Conversacion" onBack={goBack} />
        <EmptyState text="No encontramos esta sesion." />
      </>
    );
  }

  return (
    <>
      <header className="chat-header">
        <button className="icon-btn" onClick={goBack} aria-label="Volver">
          <span aria-hidden="true">‹</span>
        </button>
        <ToyMark color={toy.color} size={38} />
        <div>
          <h1>{toy.name} y {child.nickname}</h1>
          <p>
            {formatDate(session.startedAt)} · {formatTime(session.startedAt)} · {messageCount(session)} mensajes
          </p>
        </div>
        <Badge tone={session.status === "active" ? "active" : "neutral"}>
          {session.status === "active" ? "Activa" : "Cerrada"}
        </Badge>
      </header>

      <div className="chat-scroll">
        <div className="date-pill">{formatDate(session.startedAt)}</div>
        {session.messages.map((message) => (
          <MessageBubble key={message.id} message={message} toy={toy} />
        ))}
        <div className="session-summary">
          <strong>Resumen para padres</strong>
          <p>{session.summary}</p>
          {session.emotion && <Badge tone="blue">Emocion: {session.emotion}</Badge>}
        </div>
        <button
          className="btn ghost"
          onClick={() => navigate({ name: "sessions", childId: child.id })}
        >
          Ver historial
        </button>
      </div>
    </>
  );
}

function ToyPage({
  data,
  childId,
  toyId,
  goBack,
}: {
  data: FamilyOverview;
  childId: string;
  toyId: string;
  goBack: () => void;
}) {
  const child = data.children.find((item) => item.id === childId) ?? data.children[0];
  const toy = data.toys.find((item) => item.id === toyId) ?? data.toys[0];
  const sessions = data.sessions.filter((session) => session.toyId === toy.id);
  const usageEvents = data.usageEvents.filter((event) => event.toyId === toy.id);

  return (
    <>
      <TopBar title={toy.name} onBack={goBack} />
      <div className="scroll">
        <div className="pad top-pad">
          <section className="toy-hero card">
            <ToyMark color={toy.color} size={72} />
            <h1>{toy.name}</h1>
            <p>{toy.kind}</p>
            <Badge tone={toy.status === "online" ? "active" : "neutral"}>
              {toy.status === "online" ? "En linea" : "Disponible"}
            </Badge>
          </section>

          <div className="stats-grid">
            <Stat label="Asignado a" value={child.nickname} accent />
            <Stat label="Bateria" value={`${toy.battery}%`} />
          </div>

          <SectionTitle>Personalidad</SectionTitle>
          <div className="card content-card">
            <p>{toy.description}</p>
            <div className="soft-note">
              <strong>Estilo de habla</strong>
              <span>{toy.style}</span>
            </div>
          </div>

          <SectionTitle>Uso del peluche</SectionTitle>
          <div className="card">
            {usageEvents.map((event, index) => (
              <UsageRow key={event.id} data={data} event={event} last={index === usageEvents.length - 1} />
            ))}
          </div>

          <SectionTitle>Sesiones asociadas</SectionTitle>
          <div className="stack">
            {sessions.map((session) => (
              <SessionCard key={session.id} data={data} session={session} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function BottomNav({
  route,
  childId,
  navigate,
}: {
  route: Route;
  childId: string;
  navigate: (route: Route) => void;
}) {
  const isHome = route.name === "home";
  const isChild = route.name === "child" || route.name === "toy";
  const isSessions = route.name === "sessions";

  return (
    <nav className="bottom-nav">
      <button className={isHome ? "active" : ""} onClick={() => navigate({ name: "home" })}>
        <span>⌂</span>
        Inicio
      </button>
      <button className={isChild ? "active" : ""} onClick={() => navigate({ name: "child", childId })}>
        <span>◉</span>
        Hijos
      </button>
      <button className={isSessions ? "active" : ""} onClick={() => navigate({ name: "sessions", childId })}>
        <span>☰</span>
        Sesiones
      </button>
    </nav>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="section-title">{children}</h2>;
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong className={accent ? "accent" : ""}>{value}</strong>
    </div>
  );
}

function ToyMark({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <span className="toy-mark" style={{ width: size, height: size, background: `${color}22`, color, fontSize: size * 0.5 }}>
      🧸
    </span>
  );
}

function UsageRow({
  data,
  event,
  last,
  onClick,
}: {
  data: FamilyOverview;
  event: UsageEvent;
  last: boolean;
  onClick?: () => void;
}) {
  const child = data.children.find((item) => item.id === event.childId)!;
  const toy = data.toys.find((item) => item.id === event.toyId)!;

  return (
    <button className={`usage-row ${last ? "last" : ""}`} onClick={onClick}>
      <ToyMark color={toy.color} size={42} />
      <div>
        <strong>{event.label}</strong>
        <p>
          {child.nickname} · {formatDate(event.usedAt)} {formatTime(event.usedAt)}
        </p>
        <small>{event.detail}</small>
      </div>
      {onClick && <span className="chevron">›</span>}
    </button>
  );
}

function SessionCard({
  data,
  session,
  highlight = false,
  onClick,
}: {
  data: FamilyOverview;
  session: ConversationSession;
  highlight?: boolean;
  onClick?: () => void;
}) {
  const child = data.children.find((item) => item.id === session.childId)!;
  const toy = data.toys.find((item) => item.id === session.toyId)!;

  return (
    <button className={`card session-card ${highlight ? "highlight" : ""}`} onClick={onClick}>
      <ToyMark color={toy.color} size={44} />
      <div>
        <h3>
          {toy.name} con {child.nickname}
        </h3>
        <p>{session.summary}</p>
        <div className="inline-meta">
          <span>{formatDate(session.startedAt)} · {formatTime(session.startedAt)}</span>
          <span>{messageCount(session)} mensajes</span>
          {session.durationMin && <span>{session.durationMin} min</span>}
        </div>
      </div>
      <Badge tone={session.status === "active" ? "active" : "neutral"}>
        {session.status === "active" ? "Activa" : "Cerrada"}
      </Badge>
    </button>
  );
}

function MessageBubble({ message, toy }: { message: { role: "child" | "toy"; text: string; sentAt: string }; toy: Toy }) {
  const isToy = message.role === "toy";

  return (
    <div className={`message-line ${isToy ? "toy" : "child"}`}>
      {isToy && <ToyMark color={toy.color} size={28} />}
      <div>
        <div className={`bubble ${isToy ? "bubble-toy" : "bubble-child"}`}>{message.text}</div>
        <div className="bubble-time">{formatTime(message.sentAt)}</div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

export default App;
