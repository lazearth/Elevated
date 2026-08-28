/**
 * BookingService.js
 * Core business logic for searching rooms and managing bookings.
 */
(function() {
    // Single source of truth for operating hours — the UI dropdowns and
    // search validation are generated from this constant (see app.js).
    const OPERATING_HOURS = { open: 10, close: 17 };

    // Closure so validateBooking works even when called detached (e.g. tests)
    const withinOperatingHours = (startTime, endTime) => {
        const start = parseInt(startTime.split(':')[0], 10);
        const end = parseInt(endTime.split(':')[0], 10);
        return start >= OPERATING_HOURS.open && end <= OPERATING_HOURS.close;
    };

    const BookingService = {
        OPERATING_HOURS,

        getAllRooms() {
            return window.EMS.Storage.getData().rooms;
        },

        searchRooms(date, startTime, endTime, size = '') {
            const data = window.EMS.Storage.getData();
            const rooms = data.rooms;
            const bookings = data.bookings;

            return rooms.filter(room => {
                // Size filter
                if (size && room.size.toLowerCase() !== size.toLowerCase()) return false;

                // Availability check
                const isOverlapping = bookings.some(b => {
                    return b.roomId === room.id && 
                           b.date === date && 
                           b.status !== 'CANCELLED' && 
                           b.status !== 'NO_SHOW' &&
                           ((startTime >= b.startTime && startTime < b.endTime) ||
                            (endTime > b.startTime && endTime <= b.endTime) ||
                            (startTime <= b.startTime && endTime >= b.endTime));
                });

                return !isOverlapping;
            });
        },

        isWithinOperatingHours(startTime, endTime) {
            return withinOperatingHours(startTime, endTime);
        },

        validateBooking(startTime, endTime) {
            const start = parseInt(startTime.split(':')[0]);
            const end = parseInt(endTime.split(':')[0]);

            if (end - start < 1) {
                return { valid: false, message: 'Minimum booking duration is 1 hour.' };
            }

            // Check for minutes (must be 00)
            if (startTime.split(':')[1] !== '00' || endTime.split(':')[1] !== '00') {
                return { valid: false, message: 'Bookings must be on the hour (e.g., 10:00, 11:00).' };
            }

            if (!withinOperatingHours(startTime, endTime)) {
                return { valid: false, message: `Bookings must fall within operating hours (${OPERATING_HOURS.open}:00 - ${OPERATING_HOURS.close}:00).` };
            }

            return { valid: true };
        },

        calculateTotal(rate, startTime, endTime) {
            const start = parseInt(startTime.split(':')[0]);
            const end = parseInt(endTime.split(':')[0]);
            return rate * (end - start);
        },

        async createBooking(roomId, date, startTime, endTime) {
            const user = window.EMS.Auth.getCurrentUser();
            if (!user) throw new Error('User must be logged in to book.');

            const validation = this.validateBooking(startTime, endTime);
            if (!validation.valid) throw new Error(validation.message);

            // FR-006: bookings must start in the future
            const startAt = new Date(`${date}T${startTime}`);
            if (startAt < new Date()) {
                throw new Error('Bookings cannot be made for past dates or times.');
            }

            const room = this.getAllRooms().find(r => r.id === roomId);
            const totalAmount = this.calculateTotal(room.rate, startTime, endTime);

            return window.EMS.Storage.withLock((data, tx) => {
                // Re-check availability inside lock (Atomic check)
                const isOverlapping = data.bookings.some(b => {
                    return b.roomId === roomId &&
                           b.date === date &&
                           b.status !== 'CANCELLED' &&
                           b.status !== 'NO_SHOW' &&
                           ((startTime >= b.startTime && startTime < b.endTime) ||
                            (endTime > b.startTime && endTime <= b.endTime) ||
                            (startTime <= b.startTime && endTime >= b.endTime));
                });

                if (isOverlapping) throw new Error('Room is already booked for this time.');

                const newBooking = {
                    id: 'BKG-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                    userId: user.userId,
                    userName: user.name,
                    userEmail: user.email,
                    roomId: room.id,
                    roomName: room.name,
                    date,
                    startTime,
                    endTime,
                    totalAmount,
                    status: 'PENDING',
                    paymentStatus: 'UNPAID',
                    createdAt: new Date().toISOString()
                };

                data.bookings.push(newBooking);

                tx.log('BOOKING_CREATED', `Booking ${newBooking.id} created for ${room.name}`, user.email);

                return newBooking;
            });
        },

        async confirmPayment(bookingId) {
            const user = window.EMS.Auth.getCurrentUser();
            
            return window.EMS.Storage.withLock((data, tx) => {
                const booking = data.bookings.find(b => b.id === bookingId);
                if (!booking) throw new Error('Booking not found.');

                booking.status = 'CONFIRMED';
                booking.paymentStatus = 'PAID';

                tx.log('PAYMENT_CONFIRMED', `Payment received for ${bookingId}. Status: CONFIRMED.`, user ? user.email : 'System');

                return booking;
            });
        },

        /**
         * FR-013: Customers may cancel their own PENDING/CONFIRMED booking
         * anytime within 7 days of hitting the "pay" button (cooling-off period).
         * Paid amounts are refunded and the time slot becomes available for re-booking.
         */
        async cancelBooking(bookingId) {
            const user = window.EMS.Auth.getCurrentUser();
            if (!user) throw new Error('User must be logged in.');

            return window.EMS.Storage.withLock((data, tx) => {
                const booking = data.bookings.find(b => b.id === bookingId);
                if (!booking) throw new Error('Booking not found.');
                if (booking.userId !== user.userId) throw new Error('You can only cancel your own bookings.');
                if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
                    throw new Error('Only PENDING or CONFIRMED bookings can be cancelled.');
                }

                // Prevent canceling a meeting that has already started
                const eventStart = new Date(`${booking.date}T${booking.startTime}`);
                if (eventStart < new Date()) {
                    throw new Error('Cannot cancel a booking that has already started or passed.');
                }

                // Enforce 7-day cooling off period (from time of purchase)
                const bookingAge = Date.now() - new Date(booking.createdAt).getTime();
                const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
                
                if (bookingAge > sevenDaysInMillis) {
                    throw new Error('Bookings can only be cancelled within 7 days of purchase.');
                }

                booking.status = 'CANCELLED';
                if (booking.paymentStatus === 'PAID') booking.paymentStatus = 'REFUNDED';

                tx.log('BOOKING_CANCELLED', `Booking ${booking.id} cancelled by customer (${booking.date} ${booking.startTime}). Payment: ${booking.paymentStatus}.`, user.email);

                return booking;
            });
        },

        getUserBookings() {
            const user = window.EMS.Auth.getCurrentUser();
            if (!user) return [];
            
            const data = window.EMS.Storage.getData();
            return data.bookings.filter(b => b.userId === user.userId);
        }
    };

    window.EMS = window.EMS || {};
    window.EMS.Booking = BookingService;
})();
