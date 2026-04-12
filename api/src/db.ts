import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbRepo {
  id: string;
  userId: string;
  teamId: string | null;
  name: string;
  githubUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  nodeCount: number;
  edgeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbTeam {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
}

export interface DbTeamMember {
  id: string;
  teamId: string;
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

const DB_PATH = path.join(process.cwd(), 'data');

if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
}

const readJsonFile = <T>(filename: string, defaultValue: T): T => {
  const filePath = path.join(DB_PATH, filename);
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
};

const writeJsonFile = <T>(filename: string, data: T): void => {
  const filePath = path.join(DB_PATH, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

class Database {
  private users: Map<string, DbUser>;
  private repos: Map<string, DbRepo>;
  private teams: Map<string, DbTeam>;
  private teamMembers: Map<string, DbTeamMember[]>;
  private refreshTokens: Map<string, string>;

  constructor() {
    const usersData = readJsonFile<DbUser[]>('users.json', []);
    const reposData = readJsonFile<DbRepo[]>('repos.json', []);
    const teamsData = readJsonFile<DbTeam[]>('teams.json', []);
    const teamMembersData = readJsonFile<DbTeamMember[]>('team_members.json', []);

    this.users = new Map(usersData.map((u) => [u.id, u]));
    this.repos = new Map(reposData.map((r) => [r.id, r]));
    this.teams = new Map(teamsData.map((t) => [t.id, t]));
    this.teamMembers = new Map();
    for (const tm of teamMembersData) {
      const existing = this.teamMembers.get(tm.teamId) || [];
      existing.push(tm);
      this.teamMembers.set(tm.teamId, existing);
    }
    this.refreshTokens = new Map();
  }

  save(): void {
    writeJsonFile('users.json', Array.from(this.users.values()));
    writeJsonFile('repos.json', Array.from(this.repos.values()));
    writeJsonFile('teams.json', Array.from(this.teams.values()));
    writeJsonFile(
      'team_members.json',
      Array.from(this.teamMembers.values()).flat()
    );
  }

  // Users
  createUser(data: Omit<DbUser, 'id' | 'createdAt' | 'updatedAt'>): DbUser {
    const user: DbUser = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(user.id, user);
    this.save();
    return user;
  }

  findUserByEmail(email: string): DbUser | undefined {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  findUserById(id: string): DbUser | undefined {
    return this.users.get(id);
  }

  // Repos
  createRepo(data: Omit<DbRepo, 'id' | 'createdAt' | 'updatedAt'>): DbRepo {
    const repo: DbRepo = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.repos.set(repo.id, repo);
    this.save();
    return repo;
  }

  findRepoById(id: string): DbRepo | undefined {
    return this.repos.get(id);
  }

  findReposByUserId(userId: string): DbRepo[] {
    return Array.from(this.repos.values()).filter((r) => r.userId === userId);
  }

  deleteRepo(id: string): boolean {
    const result = this.repos.delete(id);
    if (result) this.save();
    return result;
  }

  updateRepoStatus(
    id: string,
    status: DbRepo['status'],
    nodeCount?: number,
    edgeCount?: number
  ): DbRepo | undefined {
    const repo = this.repos.get(id);
    if (!repo) return undefined;
    repo.status = status;
    if (nodeCount !== undefined) repo.nodeCount = nodeCount;
    if (edgeCount !== undefined) repo.edgeCount = edgeCount;
    repo.updatedAt = new Date().toISOString();
    this.save();
    return repo;
  }

  // Teams
  createTeam(data: Omit<DbTeam, 'id' | 'createdAt'>): DbTeam {
    const team: DbTeam = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    this.teams.set(team.id, team);
    this.save();
    return team;
  }

  findTeamById(id: string): DbTeam | undefined {
    return this.teams.get(id);
  }

  findTeamBySlug(slug: string): DbTeam | undefined {
    for (const team of this.teams.values()) {
      if (team.slug === slug) return team;
    }
    return undefined;
  }

  // Team Members
  addTeamMember(data: Omit<DbTeamMember, 'id' | 'joinedAt'>): DbTeamMember {
    const member: DbTeamMember = {
      ...data,
      id: uuidv4(),
      joinedAt: new Date().toISOString(),
    };
    const existing = this.teamMembers.get(data.teamId) || [];
    existing.push(member);
    this.teamMembers.set(data.teamId, existing);
    this.save();
    return member;
  }

  getTeamMembers(teamId: string): DbTeamMember[] {
    return this.teamMembers.get(teamId) || [];
  }

  // Refresh Tokens
  storeRefreshToken(token: string, userId: string): void {
    this.refreshTokens.set(token, userId);
  }

  getRefreshTokenUserId(token: string): string | undefined {
    return this.refreshTokens.get(token);
  }

  deleteRefreshToken(token: string): void {
    this.refreshTokens.delete(token);
  }
}

export const db = new Database();
