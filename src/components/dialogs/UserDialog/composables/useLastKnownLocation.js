import { computed, onScopeDispose, ref, unref, watch } from 'vue';

import { database } from '../../../../services/database';
import { parseLocation } from '../../../../shared/utils';

function parseMaxAgeMinutes(value) {
    const minutes = Number(value);
    if (!Number.isFinite(minutes) || minutes <= 0) {
        return null;
    }
    return minutes;
}

/**
 * Resolves the instance the player shown in the user dialog was last seen in, so
 * it can still be shown while their location is hidden. `maxAgeMinutes` caps how
 * old that instance may be, measured from when it stopped being current; '0'
 * means no limit.
 *
 * @param {object} options
 * @param {import('vue').Ref<object> | object} options.userDialog
 * @param {import('vue').Ref<object> | object} options.currentUser
 * @param {import('vue').Ref<boolean> | boolean} options.isEnabled
 * @param {import('vue').Ref<string> | string} [options.maxAgeMinutes]
 * @returns {{
 *     lastKnownLocation: import('vue').Ref<object | null>;
 *     isLoading: import('vue').Ref<boolean>;
 * }}
 */
export function useLastKnownLocation({ userDialog, currentUser, isEnabled, maxAgeMinutes }) {
    const lastKnownLocation = ref(null);
    const isLoading = ref(false);
    const now = ref(Date.now());
    let requestId = 0;
    let expiryTimer;
    onScopeDispose(() => {
        requestId++;
        clearTimeout(expiryTimer);
    });

    const shouldLookup = computed(() => {
        const user = unref(userDialog);
        if (!unref(isEnabled) || !user?.visible || user.loading || !user.id) {
            return false;
        }
        if (user.id === unref(currentUser)?.id) {
            return false;
        }
        return Boolean(user.$location) && !user.$location.isRealInstance;
    });

    async function load() {
        const currentRequest = ++requestId;
        lastKnownLocation.value = null;
        isLoading.value = false;
        if (!shouldLookup.value) {
            lastKnownLocation.value = null;
            return;
        }

        const user = unref(userDialog);
        isLoading.value = true;
        try {
            const row = await database.getLastKnownGPSLocation({
                id: user.id,
                displayName: user.ref?.displayName || ''
            });
            if (currentRequest !== requestId) return;
            if (!row || !parseLocation(row.location).isRealInstance) {
                lastKnownLocation.value = null;
                return;
            }
            lastKnownLocation.value = {
                location: row.location,
                $location: parseLocation(row.location),
                worldName: row.worldName,
                lastSeenAt: Date.parse(row.createdAt) || 0
            };
        } catch (err) {
            if (currentRequest !== requestId) return;
            lastKnownLocation.value = null;
            console.error('Failed to resolve last known location:', err);
        } finally {
            if (currentRequest === requestId) isLoading.value = false;
        }
    }

    const visibleLocation = computed(() => {
        const found = lastKnownLocation.value;
        const limit = parseMaxAgeMinutes(unref(maxAgeMinutes));
        if (!found || limit === null) {
            return found;
        }
        return now.value - found.lastSeenAt >= limit * 60 * 1000 ? null : found;
    });

    watch([lastKnownLocation, () => unref(maxAgeMinutes)], ([found, maxAge]) => {
        clearTimeout(expiryTimer);
        now.value = Date.now();
        const limit = parseMaxAgeMinutes(maxAge);
        if (found && limit !== null) {
            const scheduleExpiry = () => {
                now.value = Date.now();
                const delay = found.lastSeenAt + limit * 60 * 1000 - now.value;
                if (delay > 0) expiryTimer = setTimeout(scheduleExpiry, Math.min(delay, 2147483647));
            };
            scheduleExpiry();
        }
    });

    watch(() => [shouldLookup.value, unref(userDialog)?.id, unref(userDialog)?.$location?.tag], load, {
        immediate: true
    });

    return { lastKnownLocation: visibleLocation, isLoading };
}

export { parseMaxAgeMinutes };
