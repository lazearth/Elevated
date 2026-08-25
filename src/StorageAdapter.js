/**
 * StorageAdapter.js
 * Handles all localStorage interactions and initializes the default application state.
 * Implements a simple locking mechanism to simulate concurrency control.
 */
(function() {
    const STORAGE_KEY = 'EMS_DATA';

    const INITIAL_STATE = {
        rooms: [
            { id: 'R001', name: 'Focus Pod Alpha', size: 'Small', capacity: 6, rate: 1000, amenities: ['Wifi', 'TV Display', 'Whiteboard'], image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDi4tjEMF9EtYihlqFmu4HjYfEyQFimtYtsoNrTcUOiNj18dA-G9Tk-Y8XZ7zmwyocNyIO7lGsyXw5UMzTsZAyAiTOggTNc-GJ1oevtqVQ-mXFRfw3A_n9SlQ915I0YzqTu4AenXG_aDnI-PM1TpSpiy0QVGvNPRvrlpeMZyBIjGMyr4F_lJ3RPn3FmV5nkyAl2-mtC1oRA0LoHmC4vUgLIFl-ed6QXaaatpTMyhZPs0q-xwg6dGkGShQ' },
            { id: 'R002', name: 'Collaboration Room B', size: 'Medium', capacity: 15, rate: 2000, amenities: ['Wifi', 'TV Display', 'Video Conferencing', 'Coffee'], image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGyPCltyWnXICeSwzu9XH1zHWUgy0aQ3oyUBfgBujP-KBA59nlNmoyHAowq3HOCyD3-Q4fo5WDsjz4jIrv660oEo7IEd6jxlEzErhjjPGJ0rXT819aRS1mUzEiLLtrZJmEcD_mWqLPhzYNyyiI4N5P4OUUvSaW3kELuAjUdzEu24VjSpMR3-dxOohd2RzL7QIOxUcx625iuxRdznbP1hBiHivUmQoVWF8RKWU8-uUqHkMcvcSUwi0XOQ' },
            { id: 'R003', name: 'The Grand Boardroom', size: 'Large', capacity: 25, rate: 2500, amenities: ['Wifi', 'Projector', 'Sound System', 'Catering'], image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAC_q1_0mXpFKc78M0JisiCgrIHuhZIpnJjCq77WgS0fROo4pCawYkukXZ3MYqqRb1qWToszbe2MT3dqfANKQU7vrZeG43GxVYI8uRp8hzSsNZH3WSli1cjTaTNURlwNmhcgHN2nzvcuMV2lbIc8IYKDZKPw0hAXi_IdeoAkKIhJCBefGXrbICNvKYF3FfUMUkdywAn_EBlEaKDC8jX2COdJ8xxW4iwWF0rblW62qsFkRf2wdRyUcbfLQ' },
            { id: 'R004', name: 'Huddle Room 1', size: 'Small', capacity: 6, rate: 1000, amenities: ['Wifi', 'TV Display'], image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFTrI7HuAJuMoj3YxTvVViF1LX1mPXsRFPs7eRMbFmNaNwDWLwxhTIFb2_y2G8Nfa_aCMU31JFR_BCCa96sOZcYLVZHavuRBcvB5ZoP0yckH9mlYdietGk-xDKvm4n5IvAoGxS7qYAvegxEHh5wRQQ72hI4uLrqazERhhU_0ajzrtHOvkxgikaxALbBRPMrOVoDQrT6Y3uS25Tv-TI3s3Sld2-JeRuGCu4qwHl0SvDv4k3RtJk2cxxKw' },
            { id: 'R005', name: 'Strategy Room', size: 'Medium', capacity: 15, rate: 2000, amenities: ['Wifi', 'Whiteboard', 'Coffee'], image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOu9_7sQHM3h0RnJ95KWp-x1OmPqaYsjhJ5nXi_g9cxtbqB-SqMyUnUKanArQt8sx5pEKF-FJ0-ZmIlIAP5JN2ykKE9gWOAOBIgv9y6fPjDNm_rimyLZHaMHu0Yo3t9TB0fz2cNtzwGjUCxIa68Xi3v97R2SiPBQi-h-CkTMm96kAvXbs0QRAJU9J4pJxVSeKVDHEA0zjEd6mz5-vrlGD5fNVTbb7atRmyrdToFxCcApIZBihryRKBNw' },
            { id: 'R006', name: 'Seminar Space Alpha', size: 'Large', capacity: 25, rate: 2500, amenities: ['Wifi', 'Projector', 'Microphone'], image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCF6HWGLmfyl-0x54squB_ZNm79iQlC2cdeFjwXP9Akn2rPED9YQJcssCUVOrw5mRQyUrIznUqgqC7D6px3lCFXEXZbwnmSOvn3iXFzfaz6GzW2EGPH2YTLdUIQpTWc8D-j-veWnRrPqKzJ3uWEroTT9cPbI43iwYzYMFziToKWs8T0AHWZIYSIWWOeq4yCqAE8TWmVLa5ASRsxA34kVOUFqvReEGRvDEzkYBEwcMxk8kip0u9xLfl8JQ' },
            { id: 'R007', name: 'Focus Room B', size: 'Small', capacity: 6, rate: 1000, amenities: ['Wifi', 'Whiteboard'], image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDi4tjEMF9EtYihlqFmu4HjYfEyQFimtYtsoNrTcUOiNj18dA-G9Tk-Y8XZ7zmwyocNyIO7lGsyXw5UMzTsZAyAiTOggTNc-GJ1oevtqVQ-mXFRfw3A_n9SlQ915I0YzqTu4AenXG_aDnI-PM1TpSpiy0QVGvNPRvrlpeMZyBIjGMyr4F_lJ3RPn3FmV5nkyAl2-mtC1oRA0LoHmC4vUgLIFl-ed6QXaaatpTMyhZPs0q-xwg6dGkGShQ' },
            { id: 'R008', name: 'Collaboration Lab', size: 'Medium', capacity: 15, rate: 2000, amenities: ['Wifi', 'Projector', 'Coffee'], image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGyPCltyWnXICeSwzu9XH1zHWUgy0aQ3oyUBfgBujP-KBA59nlNmoyHAowq3HOCyD3-Q4fo5WDsjz4jIrv660oEo7IEd6jxlEzErhjjPGJ0rXT819aRS1mUzEiLLtrZJmEcD_mWqLPhzYNyyiI4N5P4OUUvSaW3kELuAjUdzEu24VjSpMR3-dxOohd2RzL7QIOxUcx625iuxRdznbP1hBiHivUmQoVWF8RKWU8-uUqHkMcvcSUwi0XOQ' },
            { id: 'R009', name: 'Innovation Hall', size: 'Large', capacity: 25, rate: 2500, amenities: ['Wifi', 'Sound System', 'Catering'], image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAC_q1_0mXpFKc78M0JisiCgrIHuhZIpnJjCq77WgS0fROo4pCawYkukXZ3MYqqRb1qWToszbe2MT3dqfANKQU7vrZeG43GxVYI8uRp8hzSsNZH3WSli1cjTaTNURlwNmhcgHN2nzvcuMV2lbIc8IYKDZKPw0hAXi_IdeoAkKIhJCBefGXrbICNvKYF3FfUMUkdywAn_EBlEaKDC8jX2COdJ8xxW4iwWF0rblW62qsFkRf2wdRyUcbfLQ' }
        ],
        users: [
            { id: 'U001', email: 'admin@ems.com', passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', role: 'ADMIN', name: 'System Admin' }, // admin123
            { id: 'U002', email: 'employee@ems.com', passwordHash: 'e03d3ec8d5035f8721f5dc64546e59ed790dbcb3b7b598fe57057ccd7b683b00', role: 'EMPLOYEE', name: 'Jane Smith' }, // emp123
            { id: 'U003', email: 'student@ems.com', passwordHash: 'a8cf15ed11889d8d11b49c2cbab0c2be89b17d02b4588eee25cc2c91dace1ba5', role: 'STUDENT', name: 'John Doe' } // std123
        ],
        bookings: [],
        auditLogs: []
    };

    const StorageAdapter = {
        init() {
            if (!localStorage.getItem(STORAGE_KEY)) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
                console.log('EMS: Initialized storage with default state.');
            }
        },

        getData() {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : INITIAL_STATE;
        },

        saveData(data) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        },

        /**
         * Simulates a transactional lock to prevent concurrency issues.
         * @param {Function} callback - The logic to execute while "locked".
         *   Receives (data, tx). Use tx.log(...) to record audit entries —
         *   they are applied AFTER the transaction commits so they are never
         *   overwritten by the save below.
         * @returns {Promise}
         */
        async withLock(callback) {
            // In a real app, this would involve a server-side lock.
            // Here, we simulate a small delay and atomic read-modify-write.
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    try {
                        const data = this.getData();
                        const pendingLogs = [];
                        const tx = {
                            log: (action, details, actor = 'System') => pendingLogs.push({ action, details, actor })
                        };
                        const result = callback(data, tx);
                        this.saveData(data);

                        if (pendingLogs.length > 0) {
                            const fresh = this.getData();
                            pendingLogs.forEach(l => {
                                fresh.auditLogs.unshift({
                                    id: 'LOG' + Date.now() + Math.random().toString(36).substr(2, 5),
                                    timestamp: new Date().toISOString(),
                                    ...l
                                });
                            });
                            this.saveData(fresh);
                        }

                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                }, 100);
            });
        },

        reset() {
            localStorage.removeItem(STORAGE_KEY);
            this.init();
        }
    };

    // Export to global namespace
    window.EMS = window.EMS || {};
    window.EMS.Storage = StorageAdapter;
    StorageAdapter.init();
})();
