/**
 * suite.js
 * Lightweight vanilla JS test suite for the Elevated Meeting Space MVP.
 * Traces every test case back to a requirement ID from docs/SRS.md.
 */
(function() {
    // ---------- Test helpers ----------
    function assert(condition, message) {
        if (!condition) throw new Error(message || 'Assertion failed.');
    }

    function assertEquals(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message || 'assertEquals failed'} — expected "${expected}", got "${actual}".`);
        }
    }

    async function assertRejects(fn, expectedFragment, message) {
        try {
            await fn();
        } catch (e) {
            if (expectedFragment && !e.message.includes(expectedFragment)) {
                throw new Error(`${message || 'assertRejects failed'} — expected error containing "${expectedFragment}", got "${e.message}".`);
            }
            return e;
        }
        throw new Error(`${message || 'assertRejects failed'} — operation was expected to fail, but it succeeded.`);
    }

    // Sessions are written directly (AuthService stores plain JSON in sessionStorage)
    const ADMIN = { userId: 'U001', email: 'admin@ems.com', role: 'ADMIN', name: 'System Admin' };
    const EMPLOYEE = { userId: 'U002', email: 'employee@ems.com', role: 'EMPLOYEE', name: 'Jane Smith' };
    const STUDENT = { userId: 'U003', email: 'student@ems.com', role: 'STUDENT', name: 'John Doe' };

    function setSession(user) {
        if (user) {
            sessionStorage.setItem('EMS_SESSION', JSON.stringify(user));
        } else {
            sessionStorage.removeItem('EMS_SESSION');
        }
    }

    // ---------- Test registry ----------
    const tests = [];
    function test(id, description, requirements, fn) {
        tests.push({ id, description, requirements, fn });
    }

    // TC-01 — Room catalog is seeded and complete (FR-002)
    test('TC-01', 'Storage seeds all 9 meeting rooms with size, capacity, amenities and hourly rate.', 'FR-002', () => {
        const rooms = window.EMS.Booking.getAllRooms();
        assertEquals(rooms.length, 9, 'Room catalog must contain 9 rooms');

        const validRates = [1000, 2000, 2500];
        rooms.forEach(r => {
            assert(r.name && r.id, `Room ${r.id} must have an id and name`);
            assert(r.capacity > 0, `Room ${r.id} must have a capacity`);
            assert(validRates.includes(r.rate), `Room ${r.id} rate must be ฿1,000 / ฿2,000 / ฿2,500`);
            assert(Array.isArray(r.amenities) && r.amenities.length > 0, `Room ${r.id} must list amenities`);
        });

        const sizes = rooms.map(r => r.size);
        assertEquals(sizes.filter(s => s === 'Small').length, 3, '3 Small rooms expected');
        assertEquals(sizes.filter(s => s === 'Medium').length, 3, '3 Medium rooms expected');
        assertEquals(sizes.filter(s => s === 'Large').length, 3, '3 Large rooms expected');
    });

    // TC-02 — Availability search excludes booked rooms and honours size filter (FR-003)
    test('TC-02', 'searchRooms excludes rooms with overlapping bookings and applies the size filter.', 'FR-003', async () => {
        setSession(EMPLOYEE);
        await window.EMS.Booking.createBooking('R001', '2026-09-01', '10:00', '12:00');

        // Overlaps 10:00-12:00 -> R001 must be excluded, other rooms still returned
        const overlapping = window.EMS.Booking.searchRooms('2026-09-01', '11:00', '13:00', '');
        assert(!overlapping.some(r => r.id === 'R001'), 'R001 must be unavailable for an overlapping slot');
        assertEquals(overlapping.length, 8, 'The other 8 rooms must remain available');

        // Non-overlapping -> R001 available again
        const later = window.EMS.Booking.searchRooms('2026-09-01', '13:00', '14:00', '');
        assert(later.some(r => r.id === 'R001'), 'R001 must be available after the booked slot ends');

        // Size filter
        const smallOnly = window.EMS.Booking.searchRooms('2026-09-01', '13:00', '14:00', 'small');
        assert(smallOnly.length > 0 && smallOnly.every(r => r.size === 'Small'), 'Size filter must only return Small rooms');
    });

    // TC-03 — Minimum 1-hour, whole-hour validation (FR-004)
    test('TC-03', 'validateBooking rejects durations under 1 hour and 30-minute increments.', 'FR-004', () => {
        const v = window.EMS.Booking.validateBooking;

        assert(!v('10:00', '10:30').valid, 'A 30-minute booking must be rejected');
        assert(!v('10:00', '09:00').valid, 'An end time before the start time must be rejected');
        assert(!v('10:30', '11:30').valid, 'Bookings not starting on the hour must be rejected');
        assert(v('10:00', '11:00').valid, 'A whole 1-hour booking must be accepted');
        assert(v('09:00', '17:00').valid, 'A multi-hour whole-hour booking must be accepted');
    });

    // TC-04 — Total price = hourly rate × duration (FR-005)
    test('TC-04', 'calculateTotal returns hourly rate multiplied by the booked duration.', 'FR-005', () => {
        const calc = window.EMS.Booking.calculateTotal;
        assertEquals(calc(1000, '09:00', '12:00'), 3000, '3h × ฿1,000 must be ฿3,000');
        assertEquals(calc(2500, '13:00', '14:00'), 2500, '1h × ฿2,500 must be ฿2,500');
        assertEquals(calc(2000, '08:00', '17:00'), 18000, '9h × ฿2,000 must be ฿18,000');
    });

    // TC-05 — Booking creation + double-booking prevention (FR-006, FR-007, NFR-005)
    test('TC-05', 'createBooking stores a PENDING booking and rejects overlapping or past-dated requests for the same room.', 'FR-006, FR-007, NFR-005', async () => {
        setSession(EMPLOYEE);

        const booking = await window.EMS.Booking.createBooking('R001', '2026-09-01', '10:00', '12:00');
        assertEquals(booking.status, 'PENDING', 'A new booking must start as PENDING');
        assertEquals(booking.totalAmount, 2000, 'Total must be 2h × ฿1,000');
        assert(booking.id.startsWith('BKG-'), 'Booking ID must follow the BKG-XXXX pattern');

        // Overlapping attempts must be rejected (same room, same date)
        await assertRejects(
            () => window.EMS.Booking.createBooking('R001', '2026-09-01', '11:00', '13:00'),
            'already booked', 'An overlapping booking must be rejected'
        );
        await assertRejects(
            () => window.EMS.Booking.createBooking('R001', '2026-09-01', '09:00', '11:00'),
            'already booked', 'A booking enclosing the existing slot must be rejected'
        );

        // Non-overlapping slot on the same room is allowed
        const later = await window.EMS.Booking.createBooking('R001', '2026-09-01', '13:00', '14:00');
        assertEquals(later.status, 'PENDING', 'A non-overlapping booking must succeed');

        // Bookings in the past must be rejected (FR-006)
        await assertRejects(
            () => window.EMS.Booking.createBooking('R002', '2020-01-01', '10:00', '11:00'),
            'past', 'Past dates must be rejected'
        );
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        await assertRejects(
            () => window.EMS.Booking.createBooking('R002', todayStr, '00:00', '01:00'),
            'past', 'Same-day slots that already started must be rejected'
        );

        // Not logged in
        setSession(null);
        await assertRejects(
            () => window.EMS.Booking.createBooking('R002', '2026-09-01', '10:00', '11:00'),
            'logged in', 'Anonymous booking attempts must be rejected'
        );
    });

    // TC-06 — Full payment required before CONFIRMED (FR-009, NFR-006)
    test('TC-06', 'A booking stays PENDING/UNPAID until confirmPayment flips it to CONFIRMED/PAID.', 'FR-009, NFR-006', async () => {
        setSession(EMPLOYEE);
        const booking = await window.EMS.Booking.createBooking('R003', '2026-09-01', '09:00', '11:00');
        assertEquals(booking.status, 'PENDING', 'Status must not be CONFIRMED before payment');
        assertEquals(booking.paymentStatus, 'UNPAID', 'Payment status must start as UNPAID');

        const paid = await window.EMS.Booking.confirmPayment(booking.id);
        assertEquals(paid.status, 'CONFIRMED', 'Status must become CONFIRMED after full payment');
        assertEquals(paid.paymentStatus, 'PAID', 'Payment status must become PAID');
    });

    // TC-07 — Admin check-in rules (FR-011, NFR-003)
    test('TC-07', 'Only admins can check in, and only CONFIRMED bookings become IN_USE.', 'FR-011, NFR-003', async () => {
        setSession(EMPLOYEE);
        const booking = await window.EMS.Booking.createBooking('R002', '2026-09-02', '10:00', '11:00');

        // Non-admin must be rejected
        await assertRejects(() => window.EMS.Admin.checkIn(booking.id), 'Unauthorized', 'Non-admins must not check in bookings');

        // Admin cannot check in a PENDING (unpaid) booking
        setSession(ADMIN);
        await assertRejects(
            () => window.EMS.Admin.checkIn(booking.id),
            'Only confirmed bookings', 'Unpaid bookings must not be checkable'
        );

        // After payment, admin check-in succeeds
        await window.EMS.Booking.confirmPayment(booking.id);
        const checkedIn = await window.EMS.Admin.checkIn(booking.id);
        assertEquals(checkedIn.status, 'IN_USE', 'Check-in must set the booking to IN_USE');

        // Non-admin dashboard access must be denied
        setSession(EMPLOYEE);
        await assertRejects(() => window.EMS.Admin.getAllBookings(), 'Access denied', 'Employees must not list all bookings');
    });

    // TC-08 — No-show enforcement keeps the payment (FR-011, FR-012)
    test('TC-08', 'markNoShow sets NO_SHOW and the payment is retained (no refund).', 'FR-011, FR-012', async () => {
        setSession(EMPLOYEE);
        const booking = await window.EMS.Booking.createBooking('R004', '2026-09-03', '14:00', '16:00');
        await window.EMS.Booking.confirmPayment(booking.id);

        setSession(ADMIN);
        const noShow = await window.EMS.Admin.markNoShow(booking.id);
        assertEquals(noShow.status, 'NO_SHOW', 'Booking must be marked NO_SHOW');
        assertEquals(noShow.paymentStatus, 'PAID', 'Payment must be retained — no refund for NO_SHOW');
    });

    // TC-09 — Audit trail with timestamps (FR-001, NFR-008)
    test('TC-09', 'Every status change is written to the audit log with action, actor and ISO timestamp.', 'FR-001, NFR-008', async () => {
        setSession(EMPLOYEE);
        const booking = await window.EMS.Booking.createBooking('R005', '2026-09-04', '09:00', '10:00');
        await window.EMS.Booking.confirmPayment(booking.id);
        setSession(ADMIN);
        await window.EMS.Admin.checkIn(booking.id);

        const logs = window.EMS.Audit.getLogs();
        const actions = logs.map(l => l.action);
        assert(actions.includes('BOOKING_CREATED'), 'Audit log must record BOOKING_CREATED');
        assert(actions.includes('PAYMENT_CONFIRMED'), 'Audit log must record PAYMENT_CONFIRMED');
        assert(actions.includes('CHECK_IN'), 'Audit log must record CHECK_IN');

        const entry = logs.find(l => l.action === 'CHECK_IN');
        assert(entry.actor === 'admin@ems.com', 'Audit entry must record the acting admin');
        assert(!isNaN(new Date(entry.timestamp).getTime()), 'Audit entry must carry a parseable timestamp');
    });

    // TC-10 — Password hashing (NFR-002)
    test('TC-10', 'Passwords are stored as SHA-256 hashes; no plaintext secrets exist in storage.', 'NFR-002', async () => {
        const data = window.EMS.Storage.getData();
        const admin = data.users.find(u => u.email === 'admin@ems.com');

        const hash = await window.EMS.Auth.getHash('admin123');
        assertEquals(hash, admin.passwordHash, 'SHA-256 of "admin123" must match the stored hash');
        assertEquals(hash.length, 64, 'SHA-256 hex digest must be 64 characters');

        const serialized = JSON.stringify(data.users);
        assert(!serialized.includes('admin123'), 'Plaintext password must never appear in storage');
        assert(!serialized.includes('emp123'), 'Plaintext password must never appear in storage');
        assert(!serialized.includes('std123'), 'Plaintext password must never appear in storage');

        // Duplicate email registration must be rejected
        setSession(null);
        await assertRejects(
            () => window.EMS.Auth.register('Clone', 'admin@ems.com', 'whatever1', 'EMPLOYEE'),
            'already registered', 'Registering an existing email must be rejected'
        );
    });

    // TC-11 — Users only see their own bookings (FR-010, NFR-007)
    test('TC-11', 'getUserBookings returns only the signed-in user\'s own bookings.', 'FR-010, NFR-007', async () => {
        setSession(EMPLOYEE);
        await window.EMS.Booking.createBooking('R006', '2026-09-05', '10:00', '12:00');

        setSession(STUDENT);
        assertEquals(window.EMS.Booking.getUserBookings().length, 0, 'Student must not see the employee\'s bookings');

        setSession(EMPLOYEE);
        const mine = window.EMS.Booking.getUserBookings();
        assertEquals(mine.length, 1, 'Employee must see exactly their own booking');
        assertEquals(mine[0].userId, 'U002', 'Returned booking must belong to the signed-in user');
    });

    // TC-12 — Customer cancellation: 7-day cooling-off from purchase (FR-013)
    test('TC-12', 'Customers can cancel their own bookings within 7 days of purchase and before start time; the slot is released and the payment refunded.', 'FR-013', async () => {
        // Future booking on R001, purchased just now -> cancellable
        const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setSession(EMPLOYEE);
        const far = await window.EMS.Booking.createBooking('R001', futureDate, '10:00', '12:00');
        await window.EMS.Booking.confirmPayment(far.id);

        // Another user must not cancel someone else's booking
        setSession(STUDENT);
        await assertRejects(
            () => window.EMS.Booking.cancelBooking(far.id),
            'own bookings', 'Users must only cancel their own bookings'
        );

        // Owner cancels during the cooling-off window: CANCELLED + refunded
        setSession(EMPLOYEE);
        const cancelled = await window.EMS.Booking.cancelBooking(far.id);
        assertEquals(cancelled.status, 'CANCELLED', 'Cancelled booking must be CANCELLED');
        assertEquals(cancelled.paymentStatus, 'REFUNDED', 'Paid amount must be refunded on cancellation');

        // The slot is bookable again
        const rebooked = await window.EMS.Booking.createBooking('R001', futureDate, '10:00', '12:00');
        assertEquals(rebooked.status, 'PENDING', 'Released slot must be immediately re-bookable');

        // Purchase older than 7 days must NOT be cancellable (backdate createdAt)
        const stale = await window.EMS.Booking.createBooking('R002', futureDate, '10:00', '11:00');
        const data = window.EMS.Storage.getData();
        data.bookings.find(b => b.id === stale.id).createdAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
        window.EMS.Storage.saveData(data);
        await assertRejects(
            () => window.EMS.Booking.cancelBooking(stale.id),
            'within 7 days of purchase', 'Cancellations after the 7-day cooling-off must be rejected'
        );

        // A booking whose start time has passed must NOT be cancellable
        // (past bookings can no longer be created, so simulate: book a future
        // slot, then rewrite its stored date to yesterday)
        const started = await window.EMS.Booking.createBooking('R003', futureDate, '15:00', '16:00');
        const data2 = window.EMS.Storage.getData();
        const sim = data2.bookings.find(x => x.id === started.id);
        sim.date = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        sim.startTime = '10:00';
        sim.endTime = '11:00';
        window.EMS.Storage.saveData(data2);
        await assertRejects(
            () => window.EMS.Booking.cancelBooking(started.id),
            'already started', 'Bookings whose start time passed must not be cancellable'
        );

        // Terminal statuses can no longer be cancelled
        const doomed = await window.EMS.Booking.createBooking('R004', futureDate, '13:00', '14:00');
        await window.EMS.Booking.confirmPayment(doomed.id);
        setSession(ADMIN);
        await window.EMS.Admin.markNoShow(doomed.id);
        setSession(EMPLOYEE);
        await assertRejects(
            () => window.EMS.Booking.cancelBooking(doomed.id),
            'PENDING or CONFIRMED', 'NO_SHOW bookings must not be cancellable'
        );

        // Audit trail records the cancellation
        const actions = window.EMS.Audit.getLogs().map(l => l.action);
        assert(actions.includes('BOOKING_CANCELLED'), 'Audit log must record BOOKING_CANCELLED');
    });

    // ---------- Runner ----------
    async function run() {
        const results = [];
        const started = performance.now();

        for (const t of tests) {
            // Full isolation: fresh DB + no session before every case
            window.EMS.Storage.reset();
            setSession(null);
            try {
                await t.fn();
                results.push({ ...t, status: 'PASS', note: '' });
            } catch (e) {
                results.push({ ...t, status: 'FAIL', note: e.message });
            }
        }

        setSession(null); // leave no session behind after the run
        render(results, performance.now() - started);
    }

    function render(results, durationMs) {
        const body = document.getElementById('results-body');
        body.innerHTML = '';

        results.forEach(r => {
            const tr = document.createElement('tr');
            const badge = r.status === 'PASS'
                ? 'background:#28A7451f;color:#28A745;border:1px solid #28A74540'
                : 'background:#DC35451f;color:#DC3545;border:1px solid #DC354540';
            tr.innerHTML = `
                <td class="p-4 font-semibold text-[#003f87]">${r.id}</td>
                <td class="p-4">${r.description}${r.note ? `<div class="text-xs mt-1 text-[#DC3545]">${r.note}</div>` : ''}</td>
                <td class="p-4 text-[#5c5f60]"><code class="text-xs">${r.requirements}</code></td>
                <td class="p-4 text-right"><span class="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide" style="${badge}">${r.status}</span></td>
            `;
            body.appendChild(tr);
        });

        const passed = results.filter(r => r.status === 'PASS').length;
        const allPass = passed === results.length;
        const summary = document.getElementById('test-summary');
        summary.textContent = `${passed} / ${results.length} test cases passed`;
        summary.style.color = allPass ? '#28A745' : '#DC3545';
        document.getElementById('test-duration').textContent = `Completed in ${durationMs.toFixed(0)} ms`;
    }

    document.addEventListener('DOMContentLoaded', run);
})();
