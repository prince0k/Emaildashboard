export type Route = {
  _id: string;
  vmta: string;
  domain: string;
  from_user: string;
  trackingDomain?: string;
  active: boolean;
};

export type Sender = {
  _id: string;
  name: string;
  code: string;
  provider?: string;
  baseUrl: string;
  dba?: string; // NEW
  active: boolean;
  routes: Route[];
  priority: number;
  createdAt?: string;
};