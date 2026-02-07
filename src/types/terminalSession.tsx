export interface TerminalSession {
    terminal_session_id: number;
    organization_id: string;
    terminal_id: number;
    opened_by_user_id: string;
    opened_at: string;
    closed_at: string | null;
    opening_balance: number;
    closing_balance: number | null;
    status: 'OPEN' | 'CLOSED';
}

export interface OpenSessionDisplay {
    terminal_session_id: number;
    terminal_name: string;
    user_name: string;
    opened_at: string;
}
