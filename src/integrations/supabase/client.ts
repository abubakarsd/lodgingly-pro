const API_URL = 'http://localhost:3000/api';

const authListeners = new Set<(event: string, session: any) => void>();

class QueryBuilder {
  table: string;
  method: string = 'GET';
  body: any = null;
  filters: Array<{ field: string; op: string; value: any }> = [];
  sortField: string | null = null;
  sortAscending = true;
  limitVal: number | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string = '*') {
    this.method = 'GET';
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: 'eq', value });
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push({ field, op: 'in', value: values });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.sortField = field;
    this.sortAscending = options?.ascending ?? true;
    return this;
  }

  limit(val: number) {
    this.limitVal = val;
    return this;
  }

  async execute() {
    const sessionStr = localStorage.getItem('auth_session');
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    const token = session?.access_token || '';

    const queryParams = new URLSearchParams();
    if (this.filters.length > 0) {
      queryParams.set('filters', JSON.stringify(this.filters));
    }
    if (this.sortField) {
      queryParams.set('sortField', this.sortField);
      queryParams.set('sortAscending', String(this.sortAscending));
    }
    if (this.limitVal !== null) {
      queryParams.set('limit', String(this.limitVal));
    }

    const url = `${API_URL}/db/${this.table}?${queryParams.toString()}`;
    const headers: any = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, {
        method: this.method,
        headers,
        body: this.body ? JSON.stringify(this.body) : undefined
      });
      const data = await res.json();
      if (!res.ok) {
        return { data: null, error: { message: data.message || 'Request failed' }, count: 0 };
      }
      // Return counts if requested in head/count mode (often used for badges)
      const count = Array.isArray(data) ? data.length : (data ? 1 : 0);
      return { data, error: null, count };
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Network error' }, count: 0 };
    }
  }

  // Thenable implementation to support direct await on the query builder
  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any): Promise<any> {
    return this.execute().then(onfulfilled, onrejected);
  }

  async maybeSingle() {
    const { data, error } = await this.execute();
    if (error) return { data: null, error };
    return { data: (data && data.length > 0) ? data[0] : null, error: null };
  }

  insert(body: any) {
    this.method = 'POST';
    this.body = body;
    return this;
  }

  update(body: any) {
    this.method = 'PATCH';
    this.body = body;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }
}

export const supabase = {
  auth: {
    async signInWithPassword({ email, password }: any) {
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          return { error: { message: data.message || 'Login failed' }, data: { user: null, session: null } };
        }
        
        localStorage.setItem('auth_session', JSON.stringify(data.session));
        authListeners.forEach(cb => cb('SIGNED_IN', data.session));
        return { data, error: null };
      } catch (err: any) {
        return { error: { message: err.message || 'Network error' }, data: { user: null, session: null } };
      }
    },

    async signUp({ email, password, options }: any) {
      try {
        const payload: any = { password, fullName: options?.data?.full_name };
        if (email.includes('@')) {
          payload.email = email;
        } else {
          payload.matricNumber = email;
        }

        const res = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
          return { error: { message: data.message || 'Signup failed' }, data: { user: null, session: null } };
        }
        
        localStorage.setItem('auth_session', JSON.stringify(data.session));
        authListeners.forEach(cb => cb('SIGNED_IN', data.session));
        return { data, error: null };
      } catch (err: any) {
        return { error: { message: err.message || 'Network error' }, data: { user: null, session: null } };
      }
    },

    async signOut() {
      localStorage.removeItem('auth_session');
      authListeners.forEach(cb => cb('SIGNED_OUT', null));
      return { error: null };
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      authListeners.add(callback);
      // Immediately trigger callback with current session
      const sessionStr = localStorage.getItem('auth_session');
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);

      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners.delete(callback);
            }
          }
        }
      };
    },

    async getSession() {
      const sessionStr = localStorage.getItem('auth_session');
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      return { data: { session }, error: null };
    },

    async setSession(session: any) {
      localStorage.setItem('auth_session', JSON.stringify(session));
      authListeners.forEach(cb => cb('SIGNED_IN', session));
      return { data: { session, user: session?.user }, error: null };
    }
  },

  from(table: string) {
    return new QueryBuilder(table);
  }
};
