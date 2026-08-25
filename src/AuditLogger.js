/**
 * AuditLogger.js
 * Automatically records status changes and important actions for traceability.
 */
(function() {
    const AuditLogger = {
        log(action, details, actor = 'System') {
            const data = window.EMS.Storage.getData();
            
            const logEntry = {
                id: 'LOG' + Date.now() + Math.random().toString(36).substr(2, 5),
                timestamp: new Date().toISOString(),
                action,
                details,
                actor
            };
            
            data.auditLogs.unshift(logEntry); // Newest first
            window.EMS.Storage.saveData(data);
            console.log(`[AUDIT] ${action}: ${details} (by ${actor})`);
        },

        getLogs() {
            return window.EMS.Storage.getData().auditLogs;
        }
    };

    window.EMS = window.EMS || {};
    window.EMS.Audit = AuditLogger;
})();
