import { create } from "zustand";

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    status: "Active" | "Inactive";
}

export interface Lead {
    id: string;
    title: string;
    value: number;
    status: "New" | "Contacted" | "Qualified" | "Proposal" | "Won" | "Lost";
    customerName: string;
}

export interface Task {
    id: string;
    title: string;
    priority: "Low" | "Medium" | "High";
    status: "Todo" | "In Progress" | "Done";
    dueDate: string;
}

interface AppState {
    customers: Customer[];
    leads: Lead[];
    tasks: Task[];
    addCustomer: (customer: Customer) => void;
    updateLeadStatus: (id: string, status: Lead["status"]) => void;
    updateTaskStatus: (id: string, status: Task["status"]) => void;
}

const mockCustomers: Customer[] = [
    { id: "1", name: "Alice Smith", email: "alice@acme.corp", phone: "555-0100", company: "Acme Corp", status: "Active" },
    { id: "2", name: "Bob Jones", email: "bob@globex.inc", phone: "555-0200", company: "Globex Inc", status: "Active" },
    { id: "3", name: "Charlie Brown", email: "charlie@stark.ind", phone: "555-0300", company: "Stark Industries", status: "Inactive" },
];

const mockLeads: Lead[] = [
    { id: "1", title: "Enterprise License Expansion", value: 15000, status: "Qualified", customerName: "Acme Corp" },
    { id: "2", title: "New Regional Office Setup", value: 8500, status: "Contacted", customerName: "Globex Inc" },
    { id: "3", title: "Cloud Migration Project", value: 45000, status: "Proposal", customerName: "Stark Industries" },
    { id: "4", title: "Security Audit", value: 5000, status: "Won", customerName: "Acme Corp" },
    { id: "5", title: "Q3 Marketing Retainer", value: 12000, status: "New", customerName: "Wayne Enterprises" },
];

const mockTasks: Task[] = [
    { id: "1", title: "Send follow-up email to Alice", priority: "High", status: "Todo", dueDate: "2024-05-15" },
    { id: "2", title: "Prepare Q3 proposal for Globex", priority: "Medium", status: "In Progress", dueDate: "2024-05-20" },
    { id: "3", title: "Schedule demo with Stark Industries", priority: "Low", status: "Done", dueDate: "2024-05-10" },
];

export const useAppStore = create<AppState>((set) => ({
    customers: mockCustomers,
    leads: mockLeads,
    tasks: mockTasks,
    addCustomer: (customer) => set((state) => ({ customers: [...state.customers, customer] })),
    updateLeadStatus: (id, status) => set((state) => ({
        leads: state.leads.map((l) => l.id === id ? { ...l, status } : l)
    })),
    updateTaskStatus: (id, status) => set((state) => ({
        tasks: state.tasks.map((t) => t.id === id ? { ...t, status } : t)
    })),
}));
