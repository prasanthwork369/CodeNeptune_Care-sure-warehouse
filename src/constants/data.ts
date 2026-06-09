import { icons } from "./icons";
import { Order, OrderItem } from "../types/order.types";
import { WarehouseStat } from "../types/stat.types";

export const APP_TITLE = {
    name: "CareSure",
}

export const USER_DATA = {
    name: "Stefeni Wong",
    empId: "EMP-88210",
    email: "stefeni.wong@logistics.com",
    joinDate: "October 14, 2021",
    shift: "08:00 -16:00",
    avatar: "profile", // Referring to the key in images constant
};

export const tabs = [
    {
        name: "index",
        title: "Home",
        icon: icons.home,
    },
    {
        name: "picker",
        title: "Picker",
        icon: icons.picker,
    },
    {
        name: "packer",
        title: "Packer",
        icon: icons.packer,
    },
    {
        name: "dispatcher",
        title: "Dispatcher",
        icon: icons.dispatch,
    },
];

export const WAREHOUSE_STATS = [
    {
        id: "picks",
        title: "Today's Picks",
        badge: "Almost there! 1500 to go",
        value: 140,
        label: "Orders",
        itemsPerHr: 245,
        activeHours: 6,
        totalItems: 1470,
        gradient: ["#8A84FF", "#7D79DC"] as [string, string],
        illustration: "picks" as const,
    },
    {
        id: "packs",
        title: "Today's Packs",
        badge: null,
        value: 136,
        label: "Orders",
        itemsPerHr: 193,
        activeHours: 7,
        totalItems: 1210,
        gradient: ["#F0948A", "#E36C61"] as [string, string],
        illustration: "packs" as const,
    },
    {
        id: "dispatch",
        title: "Sent Out Today",
        badge: null,
        value: 210,
        label: "Orders",
        itemsPerHr: 82,
        activeHours: 5,
        totalItems: 1050,
        gradient: ["#609470", "#4B7D5B"] as [string, string],
        illustration: "dispatch" as const,
    },
];

export const MOCK_PICKING_ITEMS: OrderItem[] = [
    {
        id: "item1",
        name: "Amoxicillin",
        manufacturer: "Pfizer Inc.",
        batchNo: "B12345",
        expiryDate: "05/2026",
        requiredQty: 2,
        pickedQty: 0,
        description: "10 tablets per strip",
        status: "pending"
    },
    {
        id: "item2",
        name: "Insulin Glargine",
        manufacturer: "Sanofi",
        batchNo: "B12345",
        expiryDate: "05/2026",
        requiredQty: 6,
        pickedQty: 0,
        description: "",
        status: "pending"
    },
    {
        id: "item3",
        name: "Cetirizine",
        manufacturer: "GlaxoSmithKline",
        batchNo: "B12345",
        expiryDate: "05/2026",
        requiredQty: 8,
        pickedQty: 0,
        description: "",
        status: "pending"
    }
];

export const ORDERS: Order[] = [
    // NEW ORDERS
    {
        id: "Order #RX-7721",
        items: ["Paracetamol", "Amoxicillin"],
        extraItems: 3,
        customerName: "Paracetamol, Amoxicillin...+3 items",
        timeAgo: "22m ago",
        status: "new",
        totalCount: 10,
        pickingItems: MOCK_PICKING_ITEMS
    },
    {
        id: "Order #RX-5846",
        items: ["Paracetamol", "Amoxicillin"],
        extraItems: 3,
        customerName: "Paracetamol, Amoxicillin...+3 items",
        timeAgo: "17m ago",
        status: "new",
        totalCount: 10,
        pickingItems: MOCK_PICKING_ITEMS
    },
    {
        id: "Order #RX-6817",
        items: ["Paracetamol", "Amoxicillin"],
        extraItems: 3,
        customerName: "Paracetamol, Amoxicillin...+3 items",
        timeAgo: "15m ago",
        status: "new"
    },
    {
        id: "Order #RX-8546",
        items: ["Paracetamol", "Amoxicillin"],
        extraItems: 3,
        customerName: "Paracetamol, Amoxicillin...+3 items",
        timeAgo: "9m ago",
        status: "new"
    },

    // PARTIAL ORDERS
    {
        id: "Order #RX-7721-P",
        date: "04 Apr, 10:30 AM",
        outOfStockMeds: ["Amoxicillin", "Cetirizine"],
        pickedCount: 8,
        totalCount: 10,
        stockStatus: "available",
        status: "partial"
    },

    // COMPLETED ORDERS
    {
        id: "Order #RX-9824",
        customerName: "Eleanor Fitzpatrick",
        date: "Apr 12, 2026 • 10:30 AM",
        completionDate: "Apr 12, 2026 • 11:15 AM",
        totalItems: 7,
        status: "completed",
        pickingItems: [
            { id: "i1", name: "Amoxicillin", manufacturer: "Pfizer Inc.", batchNo: "B12345", expiryDate: "05/2026", requiredQty: 2, pickedQty: 2, status: "packed", description: "10 tablets per strip" },
            { id: "i2", name: "Lisinopril", manufacturer: "Pfizer Inc.", batchNo: "B12345", expiryDate: "05/2026", requiredQty: 4, pickedQty: 4, status: "picked", description: "10 tablets per strip" },
            { id: "i3", name: "Ibuprofen", manufacturer: "Pfizer Inc.", batchNo: "B12345", expiryDate: "05/2026", requiredQty: 1, pickedQty: 1, status: "picked", description: "10 tablets per strip" },
        ]
    },
    {
        id: "Order #RX-7721",
        customerName: "Marcus Johnson",
        date: "Apr 12, 2026 • 10:30 AM",
        totalItems: 4,
        status: "completed"
    },
    {
        id: "Order #RX-6817",
        customerName: "Mary Grace",
        date: "Apr 12, 2026 • 10:30 AM",
        totalItems: 7,
        status: "completed"
    },
    {
        id: "Order #RX-8546",
        customerName: "Anna Beth",
        date: "Apr 12, 2026 • 10:30 AM",
        totalItems: 2,
        status: "completed"
    }
];

// 20 Packed Orders for the Packer module
export const PACKED_ORDERS: Order[] = [
    { id: "#RX-9824", customerName: "Eleanor Fitzpatrick", totalItems: 10, date: "Apr 11, 2026 • 10:30 AM", status: "completed" },
    { id: "#RX-7721", customerName: "Marcus Johnson", totalItems: 4, date: "Apr 11, 2026 • 10:45 AM", status: "completed" },
    { id: "#RX-6817", customerName: "Mary Grace", totalItems: 7, date: "Apr 11, 2026 • 11:00 AM", status: "completed" },
    { id: "#RX-8546", customerName: "Anna Beth", totalItems: 2, date: "Apr 11, 2026 • 11:15 AM", status: "completed" },
    { id: "#RX-3301", customerName: "Daniel Rivera", totalItems: 5, date: "Apr 11, 2026 • 11:30 AM", status: "completed" },
    { id: "#RX-4412", customerName: "Sophia Chen", totalItems: 8, date: "Apr 11, 2026 • 11:45 AM", status: "completed" },
    { id: "#RX-5523", customerName: "James Wilson", totalItems: 3, date: "Apr 11, 2026 • 12:00 PM", status: "completed" },
    { id: "#RX-6634", customerName: "Olivia Brown", totalItems: 12, date: "Apr 11, 2026 • 12:15 PM", status: "completed" },
    { id: "#RX-7745", customerName: "Liam Davis", totalItems: 6, date: "Apr 11, 2026 • 12:30 PM", status: "completed" },
    { id: "#RX-8856", customerName: "Emma Martinez", totalItems: 9, date: "Apr 11, 2026 • 12:45 PM", status: "completed" },
    { id: "#RX-9967", customerName: "Noah Taylor", totalItems: 11, date: "Apr 11, 2026 • 01:00 PM", status: "completed" },
    { id: "#RX-1078", customerName: "Ava Anderson", totalItems: 4, date: "Apr 11, 2026 • 01:15 PM", status: "completed" },
    { id: "#RX-1189", customerName: "William Thomas", totalItems: 7, date: "Apr 11, 2026 • 01:30 PM", status: "completed" },
    { id: "#RX-1290", customerName: "Isabella Garcia", totalItems: 3, date: "Apr 11, 2026 • 01:45 PM", status: "completed" },
    { id: "#RX-1301", customerName: "Benjamin Lee", totalItems: 15, date: "Apr 11, 2026 • 02:00 PM", status: "completed" },
    { id: "#RX-1412", customerName: "Mia Robinson", totalItems: 6, date: "Apr 11, 2026 • 02:15 PM", status: "completed" },
    { id: "#RX-1523", customerName: "Lucas Clark", totalItems: 8, date: "Apr 11, 2026 • 02:30 PM", status: "completed" },
    { id: "#RX-1634", customerName: "Charlotte Lewis", totalItems: 2, date: "Apr 11, 2026 • 02:45 PM", status: "completed" },
    { id: "#RX-1745", customerName: "Henry Walker", totalItems: 10, date: "Apr 11, 2026 • 03:00 PM", status: "completed" },
    { id: "#RX-1856", customerName: "Amelia Hall", totalItems: 5, date: "Apr 11, 2026 • 03:15 PM", status: "completed" },
];

export const DISPATCHED_ORDERS = [
    {
        id: "#RX-9824",
        customerName: "Eleanor Fitzpatrick",
        reviewedOn: "Apr 12, 2026 • 11:15 AM",
        status: "dispatched"
    },
    {
        id: "#RX-5698",
        customerName: "Marcus Johnson",
        reviewedOn: "Apr 12, 2026 • 11:45 AM",
        status: "dispatched"
    },
    {
        id: "#RX-9824_2",
        id_display: "#RX-9824",
        customerName: "Michael Chang",
        reviewedOn: "Apr 11, 2026 • 05:00 PM",
        status: "dispatched"
    },
    {
        id: "#RX-4486",
        customerName: "David Fetcher",
        reviewedOn: "Apr 13, 2026 • 05:00 PM",
        status: "dispatched"
    }
];