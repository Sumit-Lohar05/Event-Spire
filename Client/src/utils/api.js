const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

export const apiFetch = async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
            ...options.headers
        }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401) {
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        throw new ApiError(data.message || `Request failed with status ${response.status}`, response.status);
    }
    return data;
};
