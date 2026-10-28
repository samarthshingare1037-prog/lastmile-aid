import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(process.cwd(), 'dev-db.json');

interface DatabaseSchema {
  users: any[];
  donations: any[];
  receivingSites: any[];
  deliveryTasks: any[];
  deliveryEvents: any[];
  ledgerEntries: any[];
  openGateListings: any[];
  riderAvailabilities: any[];
}

function initialData(): DatabaseSchema {
  return {
    users: [],
    donations: [],
    receivingSites: [],
    deliveryTasks: [],
    deliveryEvents: [],
    ledgerEntries: [],
    openGateListings: [],
    riderAvailabilities: [],
  };
}

class Store {
  data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read existing db file, initializing fresh store.');
    }
    const fresh = initialData();
    this.save(fresh);
    return fresh;
  }

  save(data?: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data || this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist database file', e);
    }
  }
}

const store = new Store();

function matchesFilter(item: any, where: any): boolean {
  if (!where) return true;
  for (const [key, value] of Object.entries(where)) {
    if (value && typeof value === 'object') {
      const vObj = value as Record<string, any>;
      if ('lte' in vObj && (item[key] > vObj.lte || !item[key])) return false;
      if ('gte' in vObj && (item[key] < vObj.gte || !item[key])) return false;
      if ('in' in vObj && Array.isArray(vObj.in) && !vObj.in.includes(item[key])) return false;
      if ('not' in vObj && item[key] === vObj.not) return false;
    } else {
      if (item[key] !== value) return false;
    }
  }
  return true;
}

class Table<T extends { id?: any; userId?: any }> {
  constructor(private getList: () => T[], private setList: (items: T[]) => void) {}

  async findMany(args?: { where?: any }): Promise<T[]> {
    const list = this.getList();
    if (!args?.where) return list.map((i) => ({ ...i }));
    return list.filter((item) => matchesFilter(item, args.where)).map((i) => ({ ...i }));
  }

  async findUnique(args: { where: any }): Promise<T | null> {
    const list = this.getList();
    const found = list.find((item) => matchesFilter(item, args.where));
    return found ? { ...found } : null;
  }

  async findFirst(args: { where: any }): Promise<T | null> {
    return this.findUnique(args);
  }

  async create(args: { data: T }): Promise<T> {
    const list = this.getList();
    const item = { ...args.data };
    list.push(item);
    this.setList(list);
    store.save();
    return { ...item };
  }

  async createMany(args: { data: T[] }): Promise<{ count: number }> {
    const list = this.getList();
    for (const d of args.data) {
      list.push({ ...d });
    }
    this.setList(list);
    store.save();
    return { count: args.data.length };
  }

  async update(args: { where: any; data: Partial<T> }): Promise<T> {
    const list = this.getList();
    const idx = list.findIndex((item) => matchesFilter(item, args.where));
    if (idx === -1) throw new Error('Record not found to update');
    list[idx] = { ...list[idx], ...args.data };
    this.setList(list);
    store.save();
    return { ...list[idx] };
  }

  async updateMany(args: { where: any; data: Partial<T> }): Promise<{ count: number }> {
    const list = this.getList();
    let count = 0;
    for (let i = 0; i < list.length; i++) {
      if (matchesFilter(list[i], args.where)) {
        list[i] = { ...list[i], ...args.data };
        count++;
      }
    }
    this.setList(list);
    store.save();
    return { count };
  }

  async deleteMany(args?: { where?: any }): Promise<{ count: number }> {
    if (!args?.where) {
      const count = this.getList().length;
      this.setList([]);
      store.save();
      return { count };
    }
    const list = this.getList();
    const remaining = list.filter((item) => !matchesFilter(item, args.where));
    const count = list.length - remaining.length;
    this.setList(remaining);
    store.save();
    return { count };
  }

  async count(args?: { where?: any }): Promise<number> {
    const list = await this.findMany(args);
    return list.length;
  }
}

export const prisma = {
  user: new Table<any>(() => store.data.users, (v) => { store.data.users = v; }),
  donation: new Table<any>(() => store.data.donations, (v) => { store.data.donations = v; }),
  receivingSite: new Table<any>(() => store.data.receivingSites, (v) => { store.data.receivingSites = v; }),
  deliveryTask: new Table<any>(() => store.data.deliveryTasks, (v) => { store.data.deliveryTasks = v; }),
  deliveryEvent: new Table<any>(() => store.data.deliveryEvents, (v) => { store.data.deliveryEvents = v; }),
  ledgerEntry: new Table<any>(() => store.data.ledgerEntries, (v) => { store.data.ledgerEntries = v; }),
  openGateListing: new Table<any>(() => store.data.openGateListings, (v) => { store.data.openGateListings = v; }),
  riderAvailability: new Table<any>(() => store.data.riderAvailabilities, (v) => { store.data.riderAvailabilities = v; }),
};
