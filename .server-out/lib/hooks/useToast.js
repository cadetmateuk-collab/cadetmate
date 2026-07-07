'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useToast = useToast;
const react_1 = require("react");
function useToast() {
    const [toasts, setToasts] = (0, react_1.useState)([]);
    const addToast = (0, react_1.useCallback)((message, type = 'success') => {
        const id = Date.now();
        setToasts((t) => [...t, { id, message, type }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    }, []);
    const dismissToast = (0, react_1.useCallback)((id) => {
        setToasts((t) => t.filter((x) => x.id !== id));
    }, []);
    return { toasts, addToast, dismissToast };
}
