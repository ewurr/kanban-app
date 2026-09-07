const API_BASE_URL = 'http://localhost:8000/api';

let onUnauthorized: (() => void)| null = null

export function setUnauthorizedHandler(handler: () => void) {
    onUnauthorized = handler
}


export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}


async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
            const data = await response.json();
            message = data.error || data.errors?.[0] || data.message || message;
        } catch {
            // response body JSON değilse, varsayılan mesajı kullan
        }

        if(response.status === 401 && onUnauthorized){
            onUnauthorized();
        }
        
        throw new ApiError(response.status, message);
    }

    if(response.status === 204) {
        return undefined as T;
    }

    return response.json(); 
}

export const apiClient = {
    
    get: async <T>(path: string): Promise<T> => {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            credentials: 'include',
        })

        return handleResponse<T>(response)
    },

    post: async <T>(path: string, body?: unknown): Promise<T> => {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        })
        return handleResponse<T>(response)
    },

    put: async <T>(path: string, body?: unknown): Promise<T> => {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        })
        return handleResponse<T>(response)
    },

    patch: async <T>(path: string, body?: unknown): Promise<T> => {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        })
        return handleResponse<T>(response)
    },

    delete: async <T>(path: string): Promise<T> => {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'DELETE',
            credentials: 'include',
            
        })
        return handleResponse<T>(response)
    },

}