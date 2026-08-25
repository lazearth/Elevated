/**
 * AdminService.js
 * Handles administrative actions like check-ins and no-show management.
 */
(function() {
    const AdminService = {
        getAllBookings() {
            if (!window.EMS.Auth.isAdmin()) throw new Error('Access denied. Admin only.');
            return window.EMS.Storage.getData().bookings;
        },

        async checkIn(bookingId) {
            const admin = window.EMS.Auth.getCurrentUser();
            if (!admin || admin.role !== 'ADMIN') throw new Error('Unauthorized.');

            return window.EMS.Storage.withLock((data, tx) => {
                const booking = data.bookings.find(b => b.id === bookingId);
                if (!booking) throw new Error('Booking not found.');
                if (booking.status !== 'CONFIRMED') throw new Error('Only confirmed bookings can be checked in.');

                booking.status = 'IN_USE';

                tx.log('CHECK_IN', `Customer checked in for ${bookingId}. Status: IN_USE.`, admin.email);

                return booking;
            });
        },

        async markNoShow(bookingId) {
            const admin = window.EMS.Auth.getCurrentUser();
            if (!admin || admin.role !== 'ADMIN') throw new Error('Unauthorized.');

            return window.EMS.Storage.withLock((data, tx) => {
                const booking = data.bookings.find(b => b.id === bookingId);
                if (!booking) throw new Error('Booking not found.');

                // Note: Policy says no refund for NO_SHOW.
                booking.status = 'NO_SHOW';

                tx.log('NO_SHOW', `Booking ${bookingId} marked as NO_SHOW.`, admin.email);

                return booking;
            });
        }
    };

    window.EMS = window.EMS || {};
    window.EMS.Admin = AdminService;
})();
