/**
 * app.js
 * Orchestrates the SPA: manages views, user session, modal events, 
 * dynamic rendering, time inputs restricted to whole hours, and mobile drawer.
 */
(function() {
    // Current state
    let activeView = 'home';
    let currentBookingRoomId = null;

    // Dom elements cache
    const views = {
        home: document.getElementById('view-home'),
        'my-bookings': document.getElementById('view-my-bookings'),
        'admin-dashboard': document.getElementById('view-admin-dashboard')
    };

    const navLinks = document.querySelectorAll('.nav-link');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    const authBtn = document.getElementById('auth-btn');
    const mobileAuthBtn = document.getElementById('mobile-auth-btn');
    const userDisplay = document.getElementById('user-display');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    // 1. View Toggling (Routing)
    function switchView(viewName) {
        const user = window.EMS.Auth.getCurrentUser();
        
        // Access controls
        if (viewName === 'my-bookings' && !user) {
            showAuthModal('login');
            return;
        }
        if (viewName === 'admin-dashboard' && (!user || user.role !== 'ADMIN')) {
            alert('Access denied. Admin only.');
            switchView('home');
            return;
        }

        activeView = viewName;

        // Toggle visibility
        Object.keys(views).forEach(key => {
            if (views[key]) {
                if (key === viewName) {
                    views[key].classList.remove('hidden');
                } else {
                    views[key].classList.add('hidden');
                }
            }
        });

        // Update active class on desktop nav (preserve any 'hidden' set by updateAuthState)
        navLinks.forEach(link => {
            const dest = link.getAttribute('data-view');
            const base = (dest === viewName)
                ? "text-primary dark:text-primary-fixed-dim font-bold border-b-2 border-primary dark:border-primary-fixed-dim pb-1 font-label-md text-label-md transition-colors duration-200 opacity-80 nav-link cursor-pointer"
                : "text-secondary dark:text-secondary-fixed-dim font-medium font-label-md text-label-md hover:text-primary-container dark:hover:text-primary-fixed transition-colors duration-200 nav-link cursor-pointer";
            link.className = base + (link.classList.contains('hidden') ? ' hidden' : '');
        });

        // Close mobile drawer if open
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }

        // Load view data
        if (viewName === 'home') {
            renderRooms();
        } else if (viewName === 'my-bookings') {
            renderMyBookings();
        } else if (viewName === 'admin-dashboard') {
            renderAdminDashboard();
        }
    }

    // 2. Authentication State Management
    function updateAuthState() {
        const user = window.EMS.Auth.getCurrentUser();
        
        if (user) {
            // Logged in
            authBtn.textContent = 'Logout';
            if (mobileAuthBtn) mobileAuthBtn.textContent = 'Logout';
            
            if (userDisplay) {
                userDisplay.textContent = `Welcome, ${user.name} (${user.role})`;
                userDisplay.classList.remove('hidden');
            }

            // Show appropriate nav items
            document.querySelectorAll('[data-view="my-bookings"]').forEach(el => el.classList.remove('hidden'));
            if (user.role === 'ADMIN') {
                document.querySelectorAll('[data-view="admin-dashboard"]').forEach(el => el.classList.remove('hidden'));
            } else {
                document.querySelectorAll('[data-view="admin-dashboard"]').forEach(el => el.classList.add('hidden'));
            }
        } else {
            // Logged out
            authBtn.textContent = 'Login/Register';
            if (mobileAuthBtn) mobileAuthBtn.textContent = 'Login/Register';
            
            if (userDisplay) {
                userDisplay.textContent = '';
                userDisplay.classList.add('hidden');
            }

            // Hide customer/admin nav items
            document.querySelectorAll('[data-view="my-bookings"]').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('[data-view="admin-dashboard"]').forEach(el => el.classList.add('hidden'));

            if (activeView !== 'home') {
                switchView('home');
            }
        }
    }

    // 3. Render Room Discovery Grid
    function renderRooms(filteredRooms = null) {
        const grid = document.getElementById('room-grid');
        if (!grid) return;

        const rooms = filteredRooms || window.EMS.Booking.getAllRooms();
        grid.innerHTML = '';

        if (rooms.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <span class="material-symbols-outlined text-6xl text-outline mb-4">search_off</span>
                    <p class="font-headline-md text-headline-md text-secondary">No available rooms match your criteria.</p>
                </div>
            `;
            return;
        }

        rooms.forEach(room => {
            const card = document.createElement('div');
            card.className = "bg-background-pure rounded-xl border border-surface-variant overflow-hidden card-hover flex flex-col shadow-sm";
            
            card.innerHTML = `
                <div class="h-48 w-full bg-surface-container-high relative">
                    <img class="w-full h-full object-cover" src="${room.image}" alt="${room.name}" />
                    <div class="absolute top-2 right-2 bg-background-pure/90 px-2 py-1 rounded font-label-sm text-label-sm text-primary flex items-center gap-1 backdrop-blur-sm">
                        <span class="material-symbols-outlined text-[16px]">groups</span> ${room.capacity}
                    </div>
                </div>
                <div class="p-6 flex-grow flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-start mb-1">
                            <h3 class="font-headline-md text-headline-md text-on-surface">${room.name}</h3>
                            <span class="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant">${room.size}</span>
                        </div>
                        <div class="flex flex-wrap gap-2 mb-6">
                            ${room.amenities.map(a => `
                                <span class="inline-flex items-center gap-1 bg-surface-container-low text-secondary px-2.5 py-1 rounded-full text-xs font-medium">
                                    <span class="material-symbols-outlined text-[14px]">
                                        ${a === 'Wifi' ? 'wifi' : a === 'TV Display' ? 'tv' : a === 'Whiteboard' ? 'edit_square' : a === 'Video Conferencing' ? 'videocam' : a === 'Coffee' ? 'local_cafe' : a === 'Projector' ? 'videocam' : a === 'Sound System' ? 'speaker' : a === 'Catering' ? 'restaurant' : a === 'Microphone' ? 'mic' : 'featured_play_list'}
                                    </span> ${a}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    <div class="pt-4 border-t border-surface-variant flex justify-between items-end">
                        <div>
                            <p class="font-label-sm text-label-sm text-secondary">Rate</p>
                            <p class="font-headline-md text-headline-md text-primary">฿${room.rate.toLocaleString()}<span class="font-body-md text-body-md text-secondary font-normal">/hr</span></p>
                        </div>
                        <button class="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm font-semibold" onclick="window.EMS.App.openBookingModal('${room.id}')">
                            Book Now
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // 4. Render My Bookings
    function renderMyBookings(filter = 'all') {
        const container = document.getElementById('my-bookings-list');
        if (!container) return;

        const bookings = window.EMS.Booking.getUserBookings();
        container.innerHTML = '';

        // Apply tab filter
        const filtered = bookings.filter(b => {
            if (filter === 'upcoming') return b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'IN_USE';
            if (filter === 'past') return b.status === 'NO_SHOW' || b.status === 'COMPLETED' || b.status === 'CANCELLED';
            return true;
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="py-12 text-center text-secondary">
                        <span class="material-symbols-outlined text-5xl mb-2 text-outline">calendar_today</span>
                        <p class="font-medium">No bookings found in this section.</p>
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(b => {
            let badgeClass = '';
            switch (b.status) {
                case 'PENDING': badgeClass = 'bg-status-pending/15 text-status-pending border border-status-pending/20'; break;
                case 'CONFIRMED': badgeClass = 'bg-status-confirmed/15 text-status-confirmed border border-status-confirmed/20'; break;
                case 'IN_USE': badgeClass = 'bg-status-in-use/15 text-status-in-use border border-status-in-use/20'; break;
                case 'NO_SHOW': badgeClass = 'bg-status-no-show/15 text-status-no-show border border-status-no-show/20'; break;
                default: badgeClass = 'bg-surface-variant text-on-surface-variant border border-outline-variant';
            }

            const row = document.createElement('tr');
            row.className = "hover:bg-surface-bright transition-colors border-b border-outline-variant";
            row.innerHTML = `
                <td class="py-4 px-6 font-semibold text-primary">${b.id}</td>
                <td class="py-4 px-6">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary text-[20px]">meeting_room</span>
                        <span class="font-semibold text-on-surface">${b.roomName}</span>
                    </div>
                </td>
                <td class="py-4 px-6 text-secondary">${b.date}</td>
                <td class="py-4 px-6 text-secondary">${b.startTime} - ${b.endTime}</td>
                <td class="py-4 px-6 font-semibold text-on-surface">฿${b.totalAmount.toLocaleString()}</td>
                <td class="py-4 px-6 text-right">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${badgeClass}">
                        ${b.status}
                    </span>
                </td>
            `;
            container.appendChild(row);
        });
    }

    // 5. Render Admin Dashboard
    function renderAdminDashboard() {
        const container = document.getElementById('admin-bookings-list');
        const logsContainer = document.getElementById('admin-logs-list');
        if (!container) return;

        const bookings = window.EMS.Admin.getAllBookings();
        container.innerHTML = '';

        if (bookings.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="py-12 text-center text-secondary">
                        <span class="material-symbols-outlined text-5xl mb-2 text-outline">history</span>
                        <p class="font-medium">No bookings logged in the system yet.</p>
                    </td>
                </tr>
            `;
        } else {
            bookings.forEach(b => {
                let badgeClass = '';
                switch (b.status) {
                    case 'PENDING': badgeClass = 'bg-status-pending/15 text-status-pending border border-status-pending/20'; break;
                    case 'CONFIRMED': badgeClass = 'bg-status-confirmed/15 text-status-confirmed border border-status-confirmed/20'; break;
                    case 'IN_USE': badgeClass = 'bg-status-in-use/15 text-status-in-use border border-status-in-use/20'; break;
                    case 'NO_SHOW': badgeClass = 'bg-status-no-show/15 text-status-no-show border border-status-no-show/20'; break;
                    default: badgeClass = 'bg-surface-variant text-on-surface-variant border border-outline-variant';
                }

                const initials = b.userName.split(' ').map(n => n[0]).join('').toUpperCase().substr(0, 2);

                const row = document.createElement('tr');
                row.className = "hover:bg-surface-container-lowest transition-colors border-b border-outline-variant";
                row.innerHTML = `
                    <td class="p-4 font-semibold text-primary">${b.id}</td>
                    <td class="p-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-sm">
                                ${initials}
                            </div>
                            <div>
                                <div class="font-medium text-on-surface">${b.userName}</div>
                                <div class="text-label-sm text-secondary">${b.userEmail}</div>
                            </div>
                        </div>
                    </td>
                    <td class="p-4 font-semibold">${b.roomName}</td>
                    <td class="p-4 text-secondary">
                        <div>${b.date}</div>
                        <div class="text-label-sm">${b.startTime} - ${b.endTime}</div>
                    </td>
                    <td class="p-4">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${badgeClass}">
                            ${b.status}
                        </span>
                    </td>
                    <td class="p-4 text-right">
                        <div class="flex justify-end gap-2">
                            ${b.status === 'CONFIRMED' ? `
                                <button class="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md font-semibold text-label-sm transition-colors flex items-center gap-1 shadow-sm" onclick="window.EMS.App.adminCheckIn('${b.id}')">
                                    <span class="material-symbols-outlined text-[16px]">how_to_reg</span> Check-in
                                </button>
                            ` : ''}
                            ${(b.status === 'PENDING' || b.status === 'CONFIRMED') ? `
                                <button class="px-3 py-1.5 bg-status-no-show/10 hover:bg-status-no-show/20 text-status-no-show rounded-md font-semibold text-label-sm transition-colors flex items-center gap-1 shadow-sm" onclick="window.EMS.App.adminMarkNoShow('${b.id}')">
                                    <span class="material-symbols-outlined text-[16px]">person_off</span> No-Show
                                </button>
                            ` : `<span class="text-secondary italic text-label-sm p-1.5">No actions</span>`}
                        </div>
                    </td>`;
                container.appendChild(row);
            });
        }

        // Render logs
        if (logsContainer) {
            const logs = window.EMS.Audit.getLogs();
            logsContainer.innerHTML = '';
            if (logs.length === 0) {
                logsContainer.innerHTML = `<li class="text-secondary p-3 text-center text-label-sm">No audit entries found.</li>`;
            } else {
                logs.slice(0, 15).forEach(l => {
                    const li = document.createElement('li');
                    li.className = "p-3 border-b border-surface-variant flex flex-col md:flex-row justify-between gap-2 text-label-sm text-secondary hover:bg-surface-container-low transition-colors";
                    const formattedTime = new Date(l.timestamp).toLocaleTimeString();
                    li.innerHTML = `
                        <div class="flex items-start gap-2">
                            <span class="font-bold text-primary shrink-0">[${l.action}]</span>
                            <span class="text-on-surface">${l.details}</span>
                        </div>
                        <div class="flex shrink-0 gap-3 justify-between font-mono text-[11px]">
                            <span>by ${l.actor}</span>
                            <span>${formattedTime}</span>
                        </div>
                    `;
                    logsContainer.appendChild(li);
                });
            }
        }

        // Render Admin Metrics
        updateAdminMetrics(bookings);
    }

    function updateAdminMetrics(bookings) {
        const totalElem = document.getElementById('metric-total-bookings');
        const confirmedElem = document.getElementById('metric-confirmed');
        const inUseElem = document.getElementById('metric-in-use');
        const noShowElem = document.getElementById('metric-no-show');
        const utilizationElem = document.getElementById('metric-utilization');

        if (!totalElem) return;

        const total = bookings.length;
        const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
        const inUse = bookings.filter(b => b.status === 'IN_USE').length;
        const noShow = bookings.filter(b => b.status === 'NO_SHOW').length;

        totalElem.textContent = total;
        confirmedElem.textContent = confirmed;
        inUseElem.textContent = inUse;
        noShowElem.textContent = noShow;

        // Simple mock utilization metric: percentage of rooms booked on active date
        if (utilizationElem) {
            const totalRooms = 9;
            const activeBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'IN_USE').length;
            const rate = totalRooms > 0 ? Math.min(Math.round((activeBookings / totalRooms) * 100), 100) : 0;
            utilizationElem.textContent = `${rate}%`;
        }
    }

    // 6. Modal Functions (Booking, Auth, Mobile Menu)
    function openBookingModal(roomId) {
        const user = window.EMS.Auth.getCurrentUser();
        if (!user) {
            showAuthModal('login');
            return;
        }

        currentBookingRoomId = roomId;
        const room = window.EMS.Booking.getAllRooms().find(r => r.id === roomId);

        document.getElementById('modalRoomName').textContent = room.name;
        document.getElementById('modalRoomRate').textContent = `฿${room.rate.toLocaleString()} / hr`;
        document.getElementById('modalTotalRow').classList.add('hidden');

        // Set date to today as default
        const todayStr = new Date().toISOString().split('T')[0];
        document.getElementById('bookingDateInput').value = todayStr;

        // Reset selects
        const startSelect = document.getElementById('bookingStartSelect');
        const endSelect = document.getElementById('bookingEndSelect');
        startSelect.value = '';
        endSelect.value = '';

        // Update booking summary
        updateBookingSummary(room.rate);

        const modal = document.getElementById('bookingModal');
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('.modal-content').classList.remove('scale-95');
            modal.querySelector('.modal-content').classList.add('scale-100');
        }, 10);
    }

    function closeBookingModal() {
        const modal = document.getElementById('bookingModal');
        modal.classList.add('opacity-0');
        modal.querySelector('.modal-content').classList.remove('scale-100');
        modal.querySelector('.modal-content').classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
            currentBookingRoomId = null;
        }, 300);
    }

    function updateBookingSummary(rate) {
        const start = document.getElementById('bookingStartSelect').value;
        const end = document.getElementById('bookingEndSelect').value;
        const summaryBox = document.getElementById('bookingSummaryDetails');
        const totalRow = document.getElementById('modalTotalRow');
        const totalPrice = document.getElementById('modalTotalPrice');

        if (!start || !end) {
            summaryBox.classList.add('hidden');
            totalRow.classList.add('hidden');
            return;
        }

        const startHour = parseInt(start.split(':')[0]);
        const endHour = parseInt(end.split(':')[0]);
        const duration = endHour - startHour;

        if (duration <= 0) {
            summaryBox.classList.add('hidden');
            totalRow.classList.add('hidden');
            return;
        }

        summaryBox.classList.remove('hidden');
        document.getElementById('summaryDuration').textContent = `${duration} hr${duration > 1 ? 's' : ''}`;
        
        const total = rate * duration;
        totalRow.classList.remove('hidden');
        totalPrice.textContent = `฿${total.toLocaleString()}`;
    }

    async function handleBookingSubmit() {
        const roomId = currentBookingRoomId;
        const date = document.getElementById('bookingDateInput').value;
        const startTime = document.getElementById('bookingStartSelect').value;
        const endTime = document.getElementById('bookingEndSelect').value;

        if (!date || !startTime || !endTime) {
            alert('Please select date, start time, and end time.');
            return;
        }

        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);

        if (endHour <= startHour) {
            alert('End time must be after start time.');
            return;
        }

        try {
            // Create pending booking
            const booking = await window.EMS.Booking.createBooking(roomId, date, startTime, endTime);
            
            // Immediately trigger simulation of successful payment
            alert(`Booking successfully created (#${booking.id}). Directing to mock Payment Gateway...`);
            
            // Confirm payment automatically for MVP
            await window.EMS.Booking.confirmPayment(booking.id);
            alert(`Payment of ฿${booking.totalAmount.toLocaleString()} successfully processed! Your booking is officially CONFIRMED.`);
            
            closeBookingModal();
            switchView('my-bookings');
        } catch (error) {
            alert(error.message);
        }
    }

    // Search room list from search bar
    function handleRoomSearch() {
        const dateInput = document.getElementById('search-date').value;
        const startHour = document.getElementById('search-start-time').value;
        const endHour = document.getElementById('search-end-time').value;
        const sizeInput = document.getElementById('search-size').value;

        if (!dateInput || !startHour || !endHour) {
            alert('Please specify Date, Start Time, and End Time to search room availability.');
            return;
        }

        const startInt = parseInt(startHour.split(':')[0]);
        const endInt = parseInt(endHour.split(':')[0]);

        if (endInt - startInt < 1) {
            alert('Booking duration must be at least 1 hour.');
            return;
        }

        const available = window.EMS.Booking.searchRooms(dateInput, startHour, endHour, sizeInput);
        renderRooms(available);
    }

    // 7. Auth Modal Trigger
    function showAuthModal(type = 'login') {
        const modal = document.getElementById('authModal');
        const modalTitle = document.getElementById('authModalTitle');
        const registerFields = document.getElementById('authRegisterFields');
        const submitBtn = document.getElementById('authSubmitBtn');
        const tabLogin = document.getElementById('authTabLogin');
        const tabRegister = document.getElementById('authTabRegister');

        if (type === 'login') {
            modalTitle.textContent = 'Sign In';
            registerFields.classList.add('hidden');
            submitBtn.textContent = 'Sign In';
            tabLogin.className = "flex-1 pb-2 text-center font-bold border-b-2 border-primary text-primary cursor-pointer";
            tabRegister.className = "flex-1 pb-2 text-center font-medium text-secondary hover:text-on-surface cursor-pointer";
            document.getElementById('authModeInput').value = 'login';
        } else {
            modalTitle.textContent = 'Create Account';
            registerFields.classList.remove('hidden');
            submitBtn.textContent = 'Register';
            tabLogin.className = "flex-1 pb-2 text-center font-medium text-secondary hover:text-on-surface cursor-pointer";
            tabRegister.className = "flex-1 pb-2 text-center font-bold border-b-2 border-primary text-primary cursor-pointer";
            document.getElementById('authModeInput').value = 'register';
        }

        // Reset forms
        document.getElementById('authEmail').value = '';
        document.getElementById('authPassword').value = '';
        document.getElementById('authName').value = '';

        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('.modal-content').classList.remove('scale-95');
            modal.querySelector('.modal-content').classList.add('scale-100');
        }, 10);
    }

    function closeAuthModal() {
        const modal = document.getElementById('authModal');
        modal.classList.add('opacity-0');
        modal.querySelector('.modal-content').classList.remove('scale-100');
        modal.querySelector('.modal-content').classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }, 300);
    }

    async function handleAuthSubmit(e) {
        e.preventDefault();
        const mode = document.getElementById('authModeInput').value;
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;

        if (!email || !password) {
            alert('Please enter email and password.');
            return;
        }

        if (mode === 'login') {
            const result = await window.EMS.Auth.login(email, password);
            if (result.success) {
                closeAuthModal();
                updateAuthState();
                switchView('home');
            } else {
                alert(result.message);
            }
        } else {
            const name = document.getElementById('authName').value.trim();
            const role = document.getElementById('authRoleSelect').value;

            if (!name) {
                alert('Please enter your name.');
                return;
            }

            try {
                await window.EMS.Auth.register(name, email, password, role);
                alert('Account registered successfully! Logging you in...');
                const result = await window.EMS.Auth.login(email, password);
                if (result.success) {
                    closeAuthModal();
                    updateAuthState();
                    switchView('home');
                }
            } catch (err) {
                alert(err.message);
            }
        }
    }

    function selectQuickLogin(email, password) {
        document.getElementById('authEmail').value = email;
        document.getElementById('authPassword').value = password;
        document.getElementById('authModeInput').value = 'login';
        
        // Hide name/fields just in case
        document.getElementById('authRegisterFields').classList.add('hidden');
        document.getElementById('authModalTitle').textContent = 'Sign In';
        document.getElementById('authSubmitBtn').textContent = 'Sign In';
        document.getElementById('authTabLogin').className = "flex-1 pb-2 text-center font-bold border-b-2 border-primary text-primary cursor-pointer";
        document.getElementById('authTabRegister').className = "flex-1 pb-2 text-center font-medium text-secondary hover:text-on-surface cursor-pointer";
    }

    // 8. Admin operations
    async function adminCheckIn(bookingId) {
        try {
            await window.EMS.Admin.checkIn(bookingId);
            renderAdminDashboard();
        } catch (err) {
            alert(err.message);
        }
    }

    async function adminMarkNoShow(bookingId) {
        if (!confirm('Mark this booking as No-Show? The user is late and no refund will be issued.')) return;
        try {
            await window.EMS.Admin.markNoShow(bookingId);
            renderAdminDashboard();
        } catch (err) {
            alert(err.message);
        }
    }

    // Toggle Mobile Drawer
    function toggleMobileMenu() {
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
        }
    }

    // 9. Initializing Page Wires
    function init() {
        // Nav Links Wireup
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchView(link.getAttribute('data-view'));
            });
        });

        mobileNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchView(link.getAttribute('data-view'));
            });
        });

        // Mobile drawer toggling
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        }

        // My Bookings filter tabs (All / Upcoming / Past)
        document.querySelectorAll('#booking-filter-tabs [data-filter]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#booking-filter-tabs [data-filter]').forEach(b => {
                    b.className = "px-4 py-2 rounded-full bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors";
                });
                btn.className = "px-4 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md";
                renderMyBookings(btn.getAttribute('data-filter'));
            });
        });

        // Auth Buttons Wireup
        const authAction = () => {
            const user = window.EMS.Auth.getCurrentUser();
            if (user) {
                window.EMS.Auth.logout();
                updateAuthState();
                switchView('home');
            } else {
                showAuthModal('login');
            }
        };

        if (authBtn) authBtn.addEventListener('click', authAction);
        if (mobileAuthBtn) mobileAuthBtn.addEventListener('click', authAction);

        // Search inputs change trigger (ensure start < end hour, and whole hours step check)
        const startSelect = document.getElementById('bookingStartSelect');
        const endSelect = document.getElementById('bookingEndSelect');

        if (startSelect && endSelect) {
            const triggerSummary = () => {
                if (currentBookingRoomId) {
                    const room = window.EMS.Booking.getAllRooms().find(r => r.id === currentBookingRoomId);
                    updateBookingSummary(room.rate);
                }
            };
            startSelect.addEventListener('change', triggerSummary);
            endSelect.addEventListener('change', triggerSummary);
        }

        // Register Quick presets logins clicking
        window.EMS.App = {
            openBookingModal,
            closeBookingModal,
            handleBookingSubmit,
            handleRoomSearch,
            showAuthModal,
            closeAuthModal,
            handleAuthSubmit,
            selectQuickLogin,
            adminCheckIn,
            adminMarkNoShow,
            renderMyBookings,
            switchView
        };

        // Render Home View initially
        updateAuthState();
        switchView('home');
    }

    // Run after DOM content loaded
    document.addEventListener('DOMContentLoaded', init);
})();
