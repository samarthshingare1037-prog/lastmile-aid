import type {
  User, Donation, ReceivingSite, DeliveryTask, DeliveryEvent,
  Notification, LedgerEntry, OpenGateListing, RiderAvailability,
  SiteStatus, PlatformStats, LeaderboardEntry, Role
} from './types';
import { mockApi } from './mockApi';

const BACKEND_URL = 'http://localhost:4000/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw errorBody || new Error(`Request failed with status ${res.status}`);
  }

  return res.json();
}

export const httpApi = {
  async serverNow(): Promise<string> {
    try {
      const data = await request<{ serverNow: string }>('/server-now');
      return data.serverNow;
    } catch {
      return mockApi.serverNow();
    }
  },

  async me(userId: string): Promise<User> {
    try {
      return await request<User>(`/auth/me/${userId}`);
    } catch {
      return mockApi.me(userId);
    }
  },

  async register(input: {
    name: string;
    email: string;
    password: string;
    role: Role;
    organization?: string;
    phone?: string;
    vehicleType?: string;
    capacityQty?: number;
  }): Promise<User> {
    try {
      return await request<User>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch {
      return mockApi.register(input);
    }
  },

  async login(email: string, password?: string): Promise<User> {
    try {
      return await request<User>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch {
      return mockApi.login(email, password || 'demo123');
    }
  },

  async listDonations(userId?: string): Promise<Donation[]> {
    try {
      const query = userId ? `?donorId=${userId}` : '';
      return await request<Donation[]>(`/donations${query}`);
    } catch {
      return mockApi.listDonations(userId || 'donor1');
    }
  },

  async getDonation(id: string): Promise<{ donation: Donation; tasks: DeliveryTask[]; events: DeliveryEvent[] }> {
    try {
      return await request(`/donations/${id}`);
    } catch {
      return mockApi.getDonation(id);
    }
  },

  async createDonation(userId: string, input: any): Promise<Donation> {
    try {
      return await request<Donation>('/donations', {
        method: 'POST',
        body: JSON.stringify({ donorId: userId, ...input }),
      });
    } catch {
      return mockApi.createDonation(userId, input);
    }
  },

  async cancelDonation(userId: string, donationId: string, reason?: string): Promise<Donation> {
    try {
      return await request<Donation>(`/donations/${donationId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ userId, reason }),
      });
    } catch {
      return mockApi.cancelDonation(userId, donationId, reason);
    }
  },

  async switchToOpenGate(userId: string, donationId: string, input: any): Promise<OpenGateListing> {
    try {
      return await request<OpenGateListing>(`/donations/${donationId}/open-gate`, {
        method: 'POST',
        body: JSON.stringify({ userId, ...input }),
      });
    } catch {
      return mockApi.switchToOpenGate(userId, donationId, input);
    }
  },

  async listTasks(q?: { status?: string }): Promise<DeliveryTask[]> {
    try {
      const query = q?.status ? `?status=${q.status}` : '';
      return await request<DeliveryTask[]>(`/tasks${query}`);
    } catch {
      return mockApi.listTasks(q);
    }
  },

  async getTask(id: string): Promise<{ task: DeliveryTask; events: DeliveryEvent[]; donation?: Donation }> {
    try {
      return await request(`/tasks/${id}`);
    } catch {
      return mockApi.getTask(id);
    }
  },

  async claimTask(arg1: string, arg2: string): Promise<DeliveryTask> {
    const isFirstIdTask = arg1.startsWith('task-');
    const taskId = isFirstIdTask ? arg1 : arg2;
    const userId = isFirstIdTask ? arg2 : arg1;

    try {
      return await request<DeliveryTask>(`/tasks/${taskId}/claim`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    } catch {
      return mockApi.claimTask(arg1, arg2);
    }
  },

  async acknowledgeTask(userId: string, taskId: string): Promise<DeliveryTask> {
    try {
      return await request<DeliveryTask>(`/tasks/${taskId}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    } catch {
      return mockApi.acknowledgeTask(userId, taskId);
    }
  },

  async pickupTask(taskId: string, userId: string): Promise<DeliveryTask> {
    try {
      return await request<DeliveryTask>(`/tasks/${taskId}/pickup`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    } catch {
      return mockApi.pickupTask(taskId, userId);
    }
  },

  async deliverTask(taskId: string, userId: string, proof?: any): Promise<DeliveryTask> {
    try {
      return await request<DeliveryTask>(`/tasks/${taskId}/deliver`, {
        method: 'POST',
        body: JSON.stringify({ userId, proof }),
      });
    } catch {
      return mockApi.deliverTask(taskId, userId, proof);
    }
  },

  async verifyDelivery(taskId: string, userId: string): Promise<any> {
    try {
      return await request(`/tasks/${taskId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    } catch {
      return mockApi.verifyDelivery(taskId, userId);
    }
  },

  async acceptReroute(arg1: string, arg2: string): Promise<DeliveryTask> {
    const taskId = arg1.startsWith('task-') ? arg1 : arg2;
    const userId = arg1.startsWith('task-') ? arg2 : arg1;
    try {
      return await request<DeliveryTask>(`/tasks/${taskId}/accept-reroute`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    } catch {
      return mockApi.acceptReroute(arg1, arg2);
    }
  },

  async rejectReroute(arg1: string, arg2: string): Promise<DeliveryTask> {
    const taskId = arg1.startsWith('task-') ? arg1 : arg2;
    const userId = arg1.startsWith('task-') ? arg2 : arg1;
    try {
      return await request<DeliveryTask>(`/tasks/${taskId}/reject-reroute`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    } catch {
      return mockApi.rejectReroute(arg1, arg2);
    }
  },

  async listSites(): Promise<ReceivingSite[]> {
    try {
      return await request<ReceivingSite[]>('/sites');
    } catch {
      return mockApi.listSites();
    }
  },

  async getSite(id: string): Promise<ReceivingSite> {
    try {
      return await request<ReceivingSite>(`/sites/${id}`);
    } catch {
      return mockApi.getSite(id);
    }
  },

  async updateSiteStatus(siteId: string, status: SiteStatus, userId = 'system'): Promise<any> {
    try {
      return await request(`/sites/${siteId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, userId }),
      });
    } catch {
      return mockApi.updateSiteStatus(siteId, status, userId);
    }
  },

  async updateSiteDemand(siteId: string, category: string, demandQty: number, unit = 'meals'): Promise<any> {
    try {
      return await request(`/sites/${siteId}/demand`, {
        method: 'PATCH',
        body: JSON.stringify({ category, demandQty, unit }),
      });
    } catch {
      return mockApi.updateSiteDemand(siteId, category, demandQty, unit);
    }
  },

  async updateSiteCapabilities(siteId: string, capabilities: any): Promise<any> {
    try {
      return await request(`/sites/${siteId}/capabilities`, {
        method: 'PATCH',
        body: JSON.stringify({ capabilities }),
      });
    } catch {
      return mockApi.updateSiteCapabilities(siteId, capabilities);
    }
  },

  async listOpenGate(): Promise<OpenGateListing[]> {
    try {
      return await request<OpenGateListing[]>('/open-gate');
    } catch {
      return mockApi.listOpenGate();
    }
  },

  async recordHandout(userId: string, listingId: string, qty: number): Promise<OpenGateListing> {
    try {
      return await request<OpenGateListing>(`/open-gate/${listingId}/handout`, {
        method: 'POST',
        body: JSON.stringify({ userId, qty }),
      });
    } catch {
      return mockApi.recordHandout(userId, listingId, qty);
    }
  },

  async myCredits(userId: string): Promise<any> {
    try {
      return await request(`/credits/${userId}`);
    } catch {
      return mockApi.myCredits(userId);
    }
  },

  async leaderboard(type: any, period: any): Promise<LeaderboardEntry[]> {
    try {
      return await request<LeaderboardEntry[]>(`/leaderboard?type=${type}&period=${period}`);
    } catch {
      return mockApi.leaderboard(type, period);
    }
  },

  async audit(): Promise<DeliveryEvent[]> {
    try {
      return await request<DeliveryEvent[]>('/audit');
    } catch {
      return mockApi.audit();
    }
  },

  async platformStats(): Promise<PlatformStats> {
    try {
      return await request<PlatformStats>('/stats');
    } catch {
      return mockApi.platformStats();
    }
  },

  async notifications(userId: string): Promise<Notification[]> {
    return mockApi.notifications(userId);
  },

  async markRead(userId: string, ids: string[]): Promise<void> {
    return mockApi.markRead(userId, ids);
  },

  sim: {
    async runMatching(donationId?: string) {
      try {
        await request('/sim/matching', { method: 'POST', body: JSON.stringify({ donationId }) });
      } catch {
        if (donationId) await mockApi.sim.runMatching(donationId);
      }
    },
    async runClaimExpiry() {
      try {
        await request('/sim/claim-expiry', { method: 'POST' });
      } catch {
        await mockApi.sim.runClaimExpiry();
      }
    },
    async runExpirySweeper() {
      try {
        await request('/sim/sweeper', { method: 'POST' });
      } catch {
        await mockApi.sim.runExpirySweeper();
      }
    },
    async makeRiderUnresponsive(riderId: string) {
      try {
        await request('/sim/rider-dropout', { method: 'POST', body: JSON.stringify({ riderId }) });
      } catch {
        await mockApi.sim.makeRiderUnresponsive(riderId);
      }
    },
    async setSiteFull(siteId: string) {
      try {
        await request('/sim/site-full', { method: 'POST', body: JSON.stringify({ siteId }) });
      } catch {
        await mockApi.sim.setSiteFull(siteId);
      }
    },
    async reset() {
      try {
        await request('/sim/reset', { method: 'POST' });
      } catch {
        await mockApi.sim.reset();
      }
    },
    getStore: () => mockApi.sim.getStore(),
    getAllTasks: () => mockApi.sim.getAllTasks(),
    getAllDonations: () => mockApi.sim.getAllDonations(),
    getAllSites: () => mockApi.sim.getAllSites(),
    getAllEvents: () => mockApi.sim.getAllEvents(),
  },
};
