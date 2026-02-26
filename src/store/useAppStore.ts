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

export interface Product {
    id: string;
    sku: string;
    name: string;
    category: string;
    price: number;
    stockQuantity: number;
}

export interface StockMovement {
    id: string;
    productId: string;
    quantity: number;
    type: "In" | "Out";
    date: string;
    note?: string;
}

interface AppState {
    customers: Customer[];
    leads: Lead[];
    tasks: Task[];
    products: Product[];
    stockMovements: StockMovement[];
    addCustomer: (customer: Customer) => void;
    updateCustomer: (id: string, customerData: Partial<Customer>) => void;
    updateLeadStatus: (id: string, status: Lead["status"]) => void;
    updateTaskStatus: (id: string, status: Task["status"]) => void;
    addProduct: (product: Product) => void;
    updateProduct: (id: string, productData: Partial<Product>) => void;
    addStockMovement: (movement: StockMovement) => void;
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

const mockProducts: Product[] = [
    { id: "1", sku: "SRV-001", name: "Enterprise Server Unit", category: "Hardware", price: 4500, stockQuantity: 12 },
    { id: "2", sku: "LIC-002", name: "Cloud Storage 10TB/yr", category: "Software", price: 1200, stockQuantity: 999 },
    { id: "3", sku: "NET-003", name: "Core Router X900", category: "Networking", price: 2800, stockQuantity: 5 },
];

const mockStockMovements: StockMovement[] = [
    { id: "1", productId: "3", quantity: 5, type: "In", date: "2024-05-01", note: "Initial stock" },
    { id: "2", productId: "1", quantity: 2, type: "Out", date: "2024-05-05", note: "Deployed to client" },
];

export const useAppStore = create<AppState>((set) => ({
    customers: mockCustomers,
    leads: mockLeads,
    tasks: mockTasks,
    products: mockProducts,
    stockMovements: mockStockMovements,
    addCustomer: (customer) => set((state) => ({ customers: [...state.customers, customer] })),
    updateCustomer: (id, customerData) => set((state) => ({
        customers: state.customers.map((c) => c.id === id ? { ...c, ...customerData } : c)
    })),
    updateLeadStatus: (id, status) => set((state) => ({
        leads: state.leads.map((l) => l.id === id ? { ...l, status } : l)
    })),
    updateTaskStatus: (id, status) => set((state) => ({
        tasks: state.tasks.map((t) => t.id === id ? { ...t, status } : t)
    })),
    addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
    updateProduct: (id, productData) => set((state) => ({
        products: state.products.map((p) => p.id === id ? { ...p, ...productData } : p)
    })),
    addStockMovement: (movement) => set((state) => {
        // Find product to update stock
        const products = state.products.map(p => {
            if (p.id === movement.productId) {
                const stockChange = movement.type === "In" ? movement.quantity : -movement.quantity;
                return { ...p, stockQuantity: p.stockQuantity + stockChange };
            }
            return p;
        });

        return {
            stockMovements: [...state.stockMovements, movement],
            products
        };
    }),
}));
