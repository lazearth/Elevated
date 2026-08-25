# UI/UX & Architecture Specification: Elevated Meeting Space MVP

## 1. Project Overview
Create a standalone, responsive web application for meeting room booking[cite: 2]. The application will serve as a Minimum Viable Product (MVP) using HTML, CSS, and plain JavaScript. All data persistence must be handled via the browser's `localStorage` to simulate a database.

## 2. Design System & Theming
The interface must prioritize readability, navigation, and a modern, minimalist aesthetic[cite: 2]. 
*   **Color Palette:**
    *   **Primary Background:** Pure White (`#FFFFFF`) to ensure a clean look[cite: 2].
    *   **Secondary Background:** Light Gray (`#F8F9FA`) for section dividers, modals, and room cards.
    *   **Primary Text:** Dark Slate (`#212529`) for maximum contrast and legibility[cite: 2].
    *   **Interactive Accent:** Professional Blue (`#0056B3`) for primary buttons (e.g., "Book Now", "Pay").
*   **Typography:** Use a clean, sans-serif font like `Inter` or `Roboto`[cite: 2].
*   **Animations & Motion:**
    *   **Hero Section:** Implement a subtle, pure CSS keyframe animation in the background of the landing page hero section (e.g., slow-moving abstract geometric shapes or soft gradients). It must not break the light color scheme or distract the user[cite: 2].
    *   **Interactions:** Add a slight `-2px` Y-axis translation and shadow expansion on hover for interactive elements like Room Cards.

## 3. Core Pages & Layouts

### A. Global Navigation (Navbar)
*   **Logo/Brand:** "Elevated Space" aligned to the left.
*   **Links:** "Home", "My Bookings" (for Users), "Admin Dashboard" (for Admins).
*   **Action:** A "Login/Register" button.

### B. Landing Page (Room Discovery)
*   **Hero Section:** Contains the animated background and a clear Call-to-Action.
*   **Search Bar:** Inputs for Date, Start Time, End Time, and Room Size dropdown (Small, Medium, Large)[cite: 2].
*   **Room Grid:** Displays 9 meeting rooms[cite: 2]. 
    *   **Room Card Layout:** Must include a room thumbnail, Name, Capacity (6, 15, or 25 people), Amenities, and Price per hour (฿1,000, ฿2,000, or ฿2,500)[cite: 2].
    *   **Action:** A "Book Now" button on each card.

### C. Booking & Payment Modal (Overlay)
*   **Validation Rules:** The UI must enforce a minimum 1-hour booking duration (no 30-minute intervals)[cite: 2].
*   **Summary:** Display the selected Room, Date, Start Time, End Time, and auto-calculated Total Cost[cite: 2].
*   **Action:** A "Pay Full Amount" button. The booking status cannot be set to "CONFIRMED" until this action is simulated[cite: 2].

### D. User Dashboard ("My Bookings")
*   **Layout:** A table or list view showing the user's historical and upcoming bookings[cite: 2].
*   **Data Points:** Room Name, Date, Time, Total Paid, and Status Badges (e.g., PENDING, CONFIRMED, NO_SHOW, IN_USE)[cite: 2].

### E. Admin Dashboard
*   **Layout:** A data table summarizing all system bookings.
*   **Admin Actions:** 
    *   A "Check-in" button to change a booking status to `IN_USE`[cite: 2].
    *   A "Mark No-Show" button for customers who fail to arrive 30 minutes before the booking time[cite: 2].

## 4. Technical Constraints for UI Generator
*   **Framework:** Use standard HTML, CSS, and Vanilla JavaScript.
*   **State Management:** Mock all backend interactions using `localStorage`. Create a mock data structure on initialization for `users`, `rooms`, `bookings`, and `payments`.
*   **Responsiveness:** Ensure CSS Flexbox or Grid is used so the layout adapts seamlessly from mobile screens to desktop monitors[cite: 2].
