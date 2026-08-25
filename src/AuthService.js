/**
 * AuthService.js
 * Handles authentication, registration, and session management.
 */
(function() {
    const SESSION_KEY = 'EMS_SESSION';

    // Simple SHA-256 implementation (for engineering evidence, avoiding external dependencies)
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    const AuthService = {
        async login(email, password) {
            const data = window.EMS.Storage.getData();
            const passwordHash = await sha256(password);
            
            const user = data.users.find(u => u.email === email && u.passwordHash === passwordHash);
            
            if (user) {
                const session = { 
                    userId: user.id, 
                    email: user.email, 
                    role: user.role, 
                    name: user.name,
                    timestamp: Date.now() 
                };
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
                return { success: true, user: session };
            }
            
            return { success: false, message: 'Invalid email or password.' };
        },

        logout() {
            sessionStorage.removeItem(SESSION_KEY);
        },

        getCurrentUser() {
            const session = sessionStorage.getItem(SESSION_KEY);
            return session ? JSON.parse(session) : null;
        },

        isAdmin() {
            const user = this.getCurrentUser();
            return user && user.role === 'ADMIN';
        },

        async register(name, email, password, role = 'STUDENT') {
            const passwordHash = await sha256(password);
            
            return window.EMS.Storage.withLock((data) => {
                if (data.users.find(u => u.email === email)) {
                    throw new Error('Email already registered.');
                }
                
                const newUser = {
                    id: 'U' + Date.now(),
                    name,
                    email,
                    passwordHash,
                    role
                };
                
                data.users.push(newUser);
                return { success: true, user: newUser };
            });
        },
        
        // Helper for testing/evidence to verify hashing
        async getHash(text) {
            return await sha256(text);
        }
    };

    window.EMS = window.EMS || {};
    window.EMS.Auth = AuthService;
})();
