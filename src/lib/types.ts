export type Frequency = 'weekly' | 'monthly';
export type ContribStatus = 'due' | 'sent' | 'paid';
export type CircleStatus = 'forming' | 'active' | 'completed';
export type Method = 'mobile_money' | 'bank_transfer' | 'cash';

export type User = { id: string; displayName: string | null; isAdmin: boolean };

export type HomeData = {
  user: { id: string; displayName: string };
  year: number;
  saved: number;
  nextTurn: { circleId: string; circleName: string; pot: number; dueOn: string } | null;
  tickets: { count: number; max: number; drawOn: string };
  circles: {
    id: string;
    name: string;
    amount: number;
    frequency: Frequency;
    size: number;
    members: number;
    status: CircleStatus;
    startsOn: string | null;
    currentNumber: number | null;
    currentDue: string | null;
    iReceive: boolean | null;
    myStatus: ContribStatus | null;
  }[];
  feed: {
    kind: 'joined' | 'order_drawn' | 'contribution_sent' | 'contribution_validated';
    amount: number | null;
    createdAt: string;
    circle: string;
    actor: string | null;
    target: string | null;
    actorIsMe: boolean;
    targetIsMe: boolean;
  }[];
  reminders: { id: string; message: string; createdAt: string; fromName: string; circle: string; circleId: string }[];
};

export type CircleData = {
  me: string;
  circle: {
    id: string;
    name: string;
    amount: number;
    currency: 'XOF';
    frequency: Frequency;
    size: number;
    status: CircleStatus;
    newMembersLast: boolean;
    depositRequired: boolean;
    inviteCode: string;
    drawSeed: string | null;
    drawnAt: string | null;
    startsOn: string | null;
    createdBy: string;
    isOrganizer: boolean;
  };
  members: { id: string; name: string; role: 'organizer' | 'member'; position: number | null; isNew: boolean }[];
  rounds: { id: string; number: number; beneficiaryId: string; dueOn: string }[];
  current: {
    roundId: string;
    number: number;
    beneficiaryId: string;
    dueOn: string;
    contributions: {
      memberId: string;
      status: ContribStatus;
      method: Method | null;
      reference: string | null;
      sentAt: string | null;
    }[];
    remindedIds: string[];
  } | null;
  late: { roundId: string; number: number; memberId: string; beneficiaryId: string; dueOn: string; status: ContribStatus }[];
};

export type TicketsData = {
  drawOn: string;
  inPlay: number;
  max: number;
  tickets: { number: number; source: "on_time" | "loyalty" | "invite" | "free_entry"; detail: string | null; createdAt: string }[];
  nextDue: { circle: string; dueOn: string } | null;
  sponsor: string | null;
  prizes: { label: string; value: number; quantity: number }[];
  lastDraw: {
    drawOn: string;
    ticketsCount: number | null;
    winners: number;
    sponsor: string | null;
    myWins: { number: number; label: string; value: number; delivered: boolean }[];
  } | null;
};

export type MonthState = 'ontime' | 'late' | 'none' | 'current' | 'future';

export type ProfileData = {
  user: { id: string; displayName: string };
  memberSince: string;
  score: number | null;
  parts: { punctuality: number; seniority: number; completed: number };
  stats: { streak: number; completed: number; invited: number; payments: number; onTime: number };
  history: { year: number; months: MonthState[] }[];
};
