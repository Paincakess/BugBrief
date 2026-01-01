'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface UseNavigationGuardOptions {
    hasUnsavedChanges: boolean;
    onSave?: () => Promise<void>;
    onDiscard?: () => void;
}

export function useNavigationGuard({ hasUnsavedChanges, onSave, onDiscard }: UseNavigationGuardOptions) {
    const router = useRouter();

    // Use refs to avoid stale closures - update synchronously during render
    const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
    const onSaveRef = useRef(onSave);
    const onDiscardRef = useRef(onDiscard);

    // Update refs synchronously (not in useEffect to avoid timing issues)
    hasUnsavedChangesRef.current = hasUnsavedChanges;
    onSaveRef.current = onSave;
    onDiscardRef.current = onDiscard;

    const showConfirmDialog = useCallback(async (): Promise<'save' | 'discard' | 'cancel'> => {
        const result = await MySwal.fire({
            title: 'Unsaved Changes',
            text: 'You have unsaved changes. What would you like to do?',
            icon: 'warning',
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: 'Save & Leave',
            denyButtonText: 'Discard',
            cancelButtonText: 'Stay',
            confirmButtonColor: '#10b981',
            denyButtonColor: '#ef4444',
            background: '#0a0a0a',
            color: '#fff',
            customClass: {
                popup: 'border border-white/10 rounded-2xl',
            },
            reverseButtons: true,
        });

        if (result.isConfirmed) return 'save';
        if (result.isDenied) return 'discard';
        return 'cancel';
    }, []);

    // Handle browser back/forward and refresh
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChangesRef.current) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // Intercept link clicks
    useEffect(() => {
        const handleClick = async (e: MouseEvent) => {
            // Check current state via ref
            if (!hasUnsavedChangesRef.current) return;

            const target = e.target as HTMLElement;
            const link = target.closest('a');

            if (!link) return;

            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

            // Check if it's an internal link
            const isInternal = href.startsWith('/') || link.origin === window.location.origin;
            if (!isInternal) return;

            // Prevent default navigation
            e.preventDefault();
            e.stopPropagation();

            const action = await showConfirmDialog();

            if (action === 'save') {
                try {
                    if (onSaveRef.current) {
                        await onSaveRef.current();
                    }
                    // Small delay to ensure state clears before navigation
                    await new Promise(resolve => setTimeout(resolve, 100));
                    window.location.href = href;
                } catch (err) {
                    console.error('Save failed:', err);
                    MySwal.fire({
                        title: 'Save Failed',
                        text: 'Could not save the report. Please try again.',
                        icon: 'error',
                        background: '#0a0a0a',
                        color: '#fff',
                        customClass: {
                            popup: 'border border-white/10 rounded-2xl',
                        }
                    });
                }
            } else if (action === 'discard') {
                if (onDiscardRef.current) {
                    onDiscardRef.current();
                }
                // Small delay to ensure state clears before navigation
                await new Promise(resolve => setTimeout(resolve, 50));
                window.location.href = href;
            }
            // 'cancel' - do nothing, stay on page
        };

        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, [showConfirmDialog, router]);

    // Handle browser popstate (back/forward buttons)
    useEffect(() => {
        if (!hasUnsavedChanges) return;

        // Push a dummy state to prevent immediate navigation
        const currentUrl = window.location.href;
        window.history.pushState({ guard: true }, '', currentUrl);

        const handlePopState = async () => {
            if (!hasUnsavedChangesRef.current) return;

            // Push state back to prevent navigation
            window.history.pushState({ guard: true }, '', currentUrl);

            const action = await showConfirmDialog();

            if (action === 'save') {
                try {
                    if (onSaveRef.current) {
                        await onSaveRef.current();
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                    window.history.go(-2);
                } catch (err) {
                    console.error('Save failed:', err);
                }
            } else if (action === 'discard') {
                if (onDiscardRef.current) {
                    onDiscardRef.current();
                }
                await new Promise(resolve => setTimeout(resolve, 50));
                window.history.go(-2);
            }
            // 'cancel' - do nothing, stay on page
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [hasUnsavedChanges, showConfirmDialog]);

    return { showConfirmDialog };
}
