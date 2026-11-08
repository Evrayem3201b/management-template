export const JOB_STATUSES = {
    NEW: "new",
    ASSIGNED: "assigned",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
} as const;

export const JOB_STATUS_LABELS = {
    new: "New",
    assigned: "Assigned",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
} as const;

export const JOB_PRIORITIES = {
    LOW: "low",
    NORMAL: "normal",
    HIGH: "high",
    URGENT: "urgent",
} as const;

export const JOB_PRIORITY_LABELS = {
    low: "Low",
    normal: "Normal",
    high: "High",
    urgent: "Urgent",
} as const;