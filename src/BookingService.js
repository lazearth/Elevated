/**
 * BookingService.js
 * Core business logic for searching rooms and managing bookings.
 */
(function() {
    const BookingService = {
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

        validateBooking(startTime, endTime) {
            const start = parseInt(startTime.split(':')[0]);
            const end = parseInt(endTime.split(':')[0]);
            
            if (end - start < 1) {
                return { valid: false, message: 'Minimum booking duration is 1 hour.' };
            }
            
            // Check for minutes (must be 00)
            if (startTime.split(':')[1] !== '00' || endTime.split(':')[1] !== '00') {
                return { valid: false, message: 'Bookings must be on the hour (e.g., 08:00, 09:00).' };
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

            const room = this.getAllRooms().find(r => r.id === roomId);
            const totalAmount = this.calculateTotal(room.rate, startTime, endTime);

            return window.EMS.Storage.withLock((data) => {
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
                
                window.EMS.Audit.log('BOOKING_CREATED', `Booking ${newBooking.id} created for ${room.name}`, user.email);
                
                return newBooking;
            });
        },

        async confirmPayment(bookingId) {
            const user = window.EMS.Auth.getCurrentUser();
            
            return window.EMS.Storage.withLock((data) => {
                const booking = data.bookings.find(b => b.id === bookingId);
                if (!booking) throw new Error('Booking not found.');
                
                booking.status = 'CONFIRMED';
                booking.paymentStatus = 'PAID';
                
                window.EMS.Audit.log('PAYMENT_CONFIRMED', `Payment received for ${bookingId}. Status: CONFIRMED.`, user ? user.email : 'System');
                
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
