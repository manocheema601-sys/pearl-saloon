/**
 * Pearl Salon - Premium JS Controller
 * Logic for Mobile Nav, Service Tab Swapper, Live Booking Cart, and Multi-Step Wizard
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. MOBILE NAVIGATION DRAWER
    // -------------------------------------------------------------
    const menuToggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const mobileClose = document.getElementById('mobileClose');
    const mobLinks = document.querySelectorAll('.mob-link');

    const openDrawer = () => {
        mobileNav.classList.add('open');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    const closeDrawer = () => {
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
    };

    if (menuToggle && mobileNav && mobileClose) {
        menuToggle.addEventListener('click', openDrawer);
        mobileClose.addEventListener('click', closeDrawer);
    }

    mobLinks.forEach(link => {
        link.addEventListener('click', closeDrawer);
    });

    // -------------------------------------------------------------
    // 2. ACTIVE NAVIGATION LINK ON SCROLL
    // -------------------------------------------------------------
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const handleScrollActiveLink = () => {
        const scrollY = window.pageYOffset;

        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 120; // Offset for sticky header
            const sectionId = current.getAttribute('id');
            const navLink = document.querySelector(`.nav-menu a[href*=${sectionId}]`);

            if (navLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLinks.forEach(link => link.classList.remove('active'));
                    navLink.classList.add('active');
                }
            }
        });
    };

    window.addEventListener('scroll', handleScrollActiveLink);

    // -------------------------------------------------------------
    // 3. INTERACTIVE SERVICE TABS
    // -------------------------------------------------------------
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            // Set active class on button
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show corresponding tab pane
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.getAttribute('id') === `tab-${targetTab}`) {
                    pane.classList.add('active');
                }
            });
        });
    });

    // -------------------------------------------------------------
    // 4. BOOKING STATE MANAGEMENT (CART & MULTI-STEP WIZARD)
    // -------------------------------------------------------------
    let bookingState = {
        selectedServices: [], // Array of { id, name, price }
        selectedDate: null,   // Date object
        selectedTime: null,   // string, e.g. "2:30 PM"
        clientInfo: {
            name: '',
            phone: '',
            email: '',
            notes: ''
        }
    };

    const GST_RATE = 0.15; // 15% GST

    // Elements
    const serviceAddButtons = document.querySelectorAll('.btn-add-service');
    const selectedServicesList = document.getElementById('selectedServicesList');
    const selectedServicesPanel = document.getElementById('selectedServicesPanel');
    const totalSummary = document.getElementById('totalSummary');
    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryTax = document.getElementById('summaryTax');
    const summaryTotal = document.getElementById('summaryTotal');
    
    // Wizard Control Elements
    const stepIndicators = document.querySelectorAll('.step-indicator');
    const wizardPanes = document.querySelectorAll('.wizard-pane');
    
    // Step 1 Pane Buttons & Prompt
    const stepServicesContainer = document.getElementById('stepServicesContainer');
    const btnGoToStep2 = document.getElementById('btnGoToStep2');
    
    // Step 2 Pane Buttons & Controls
    const datesCarousel = document.getElementById('datesCarousel');
    const timeSlotsGrid = document.getElementById('timeSlotsGrid');
    const btnBackToStep1 = document.getElementById('btnBackToStep1');
    const btnGoToStep3 = document.getElementById('btnGoToStep3');
    
    // Step 3 Pane Buttons & Controls
    const bookingForm = document.getElementById('bookingForm');
    const btnBackToStep2 = document.getElementById('btnBackToStep2');
    const btnSubmitBooking = document.getElementById('btnSubmitBooking');
    
    // Step 4 Pane Buttons & Controls
    const btnResetBooking = document.getElementById('btnResetBooking');

    // Helper: Toast Notifications
    const showToast = (message, iconName = 'info') => {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);
        
        // Re-run lucide to render icon
        if (window.lucide) {
            window.lucide.createIcons();
        }

        setTimeout(() => {
            toast.classList.add('toast-remove');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    };

    // Live Cart Calculations
    const updateCartDisplay = () => {
        // Clear summary list
        selectedServicesList.innerHTML = '';

        if (bookingState.selectedServices.length === 0) {
            selectedServicesList.innerHTML = `<p class="empty-message">No services selected. Click "Add to Session" on the services menu above to begin your booking.</p>`;
            totalSummary.style.display = 'none';
            btnGoToStep2.disabled = true;
            
            // Show Step 1 empty prompt
            stepServicesContainer.innerHTML = `
                <div class="no-services-prompt">
                    <i data-lucide="sparkles" class="prompt-icon"></i>
                    <p>Please select at least one luxury service from our service menu above to proceed.</p>
                    <a href="#services" class="btn btn-bronze btn-sm">Browse Services</a>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        } else {
            // Render items in cart
            bookingState.selectedServices.forEach(service => {
                const item = document.createElement('div');
                item.className = 'selected-item';
                item.innerHTML = `
                    <div class="selected-item-info">
                        <span class="selected-item-name">${service.name}</span>
                        <span class="selected-item-price">Rs. ${service.price.toLocaleString()}</span>
                    </div>
                    <button class="btn-remove-item" data-id="${service.id}" aria-label="Remove item">
                        <i data-lucide="trash-2"></i>
                    </button>
                `;
                selectedServicesList.appendChild(item);
            });

            // Set up remove button events
            document.querySelectorAll('.btn-remove-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    removeService(id);
                });
            });

            // Calculate pricing
            const subtotal = bookingState.selectedServices.reduce((sum, item) => sum + item.price, 0);
            const tax = Math.round(subtotal * GST_RATE);
            const total = subtotal + tax;

            summarySubtotal.textContent = `Rs. ${subtotal.toLocaleString()}`;
            summaryTax.textContent = `Rs. ${tax.toLocaleString()}`;
            summaryTotal.textContent = `Rs. ${total.toLocaleString()}`;
            totalSummary.style.display = 'flex';
            btnGoToStep2.disabled = false;

            // Render Step 1 verify list
            stepServicesContainer.innerHTML = '';
            bookingState.selectedServices.forEach(service => {
                const stepItem = document.createElement('div');
                stepItem.className = 'prompt-services-list-item';
                stepItem.innerHTML = `
                    <span>${service.name}</span>
                    <span>Rs. ${service.price.toLocaleString()}</span>
                `;
                stepServicesContainer.appendChild(stepItem);
            });

            if (window.lucide) window.lucide.createIcons();
        }
    };

    // Add service action
    const addService = (id, name, price) => {
        if (!bookingState.selectedServices.some(s => s.id === id)) {
            bookingState.selectedServices.push({ id, name, price });
            updateCartDisplay();
            updateServiceButtonsState();
            showToast(`Added: ${name}`, 'check-circle');
        }
    };

    // Remove service action
    const removeService = (id) => {
        const index = bookingState.selectedServices.findIndex(s => s.id === id);
        if (index > -1) {
            const removedName = bookingState.selectedServices[index].name;
            bookingState.selectedServices.splice(index, 1);
            updateCartDisplay();
            updateServiceButtonsState();
            showToast(`Removed: ${removedName}`, 'info');
        }
    };

    // Keep Service Menu buttons in sync with the cart state
    const updateServiceButtonsState = () => {
        serviceAddButtons.forEach(btn => {
            const id = btn.getAttribute('data-id');
            const isAdded = bookingState.selectedServices.some(s => s.id === id);
            
            if (isAdded) {
                btn.innerHTML = `<i data-lucide="check"></i> Added`;
                btn.classList.add('added');
            } else {
                btn.innerHTML = `<i data-lucide="plus"></i> Add to Session`;
                btn.classList.remove('added');
            }
        });
        if (window.lucide) window.lucide.createIcons();
    };

    // Add listener on service menu item buttons
    serviceAddButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            const price = parseInt(btn.getAttribute('data-price'), 10);
            
            const isAdded = bookingState.selectedServices.some(s => s.id === id);
            if (isAdded) {
                removeService(id);
            } else {
                addService(id, name, price);
            }
        });
    });

    // -------------------------------------------------------------
    // 5. WIZARD STEP NAVIGATION
    // -------------------------------------------------------------
    const changeStep = (targetStep) => {
        // Toggle indicators
        stepIndicators.forEach(ind => {
            const stepNum = parseInt(ind.getAttribute('data-step'), 10);
            ind.classList.remove('active', 'complete');
            
            if (stepNum === targetStep) {
                ind.classList.add('active');
            } else if (stepNum < targetStep) {
                ind.classList.add('complete');
            }
        });

        // Toggle panes
        wizardPanes.forEach(pane => {
            pane.classList.remove('active');
            if (pane.getAttribute('id') === `stepPane-${targetStep}`) {
                pane.classList.add('active');
            }
        });
    };

    btnGoToStep2.addEventListener('click', () => {
        generateDatePicker();
        changeStep(2);
    });

    btnBackToStep1.addEventListener('click', () => {
        changeStep(1);
    });

    btnGoToStep3.addEventListener('click', () => {
        changeStep(3);
    });

    btnBackToStep2.addEventListener('click', () => {
        changeStep(2);
    });

    // -------------------------------------------------------------
    // 6. DATES & TIME GENERATOR (STEP 2)
    // -------------------------------------------------------------
    const generateDatePicker = () => {
        datesCarousel.innerHTML = '';
        bookingState.selectedDate = null;
        bookingState.selectedTime = null;
        btnGoToStep3.disabled = true;

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        let count = 0;
        let offset = 0;

        // Generate next 14 open days (salon is closed on Mondays)
        while (count < 14) {
            const date = new Date();
            date.setDate(date.getDate() + offset);
            
            // 1 represents Monday. We skip Mondays
            if (date.getDay() !== 1) {
                const dateObj = {
                    dayName: days[date.getDay()],
                    dayNum: date.getDate(),
                    month: months[date.getMonth()],
                    year: date.getFullYear(),
                    fullDate: date
                };

                const dateChip = document.createElement('div');
                dateChip.className = 'date-chip';
                dateChip.innerHTML = `
                    <span class="day-name">${dateObj.dayName}</span>
                    <span class="day-num">${dateObj.dayNum}</span>
                    <span class="day-name">${dateObj.month}</span>
                `;

                dateChip.addEventListener('click', () => {
                    document.querySelectorAll('.date-chip').forEach(c => c.classList.remove('active'));
                    dateChip.classList.add('active');
                    bookingState.selectedDate = dateObj;
                    
                    // Render relevant time slots
                    generateTimeSlots();
                    checkStep2Completion();
                });

                datesCarousel.appendChild(dateChip);
                count++;
            }
            offset++;
        }
    };

    const generateTimeSlots = () => {
        timeSlotsGrid.innerHTML = '';
        bookingState.selectedTime = null;
        btnGoToStep3.disabled = true;

        // Set standard times
        const slots = [
            '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', 
            '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'
        ];

        slots.forEach(slot => {
            const timeChip = document.createElement('div');
            timeChip.className = 'time-chip';
            timeChip.textContent = slot;

            timeChip.addEventListener('click', () => {
                document.querySelectorAll('.time-chip').forEach(c => c.classList.remove('active'));
                timeChip.classList.add('active');
                bookingState.selectedTime = slot;
                checkStep2Completion();
            });

            timeSlotsGrid.appendChild(timeChip);
        });
    };

    const checkStep2Completion = () => {
        if (bookingState.selectedDate && bookingState.selectedTime) {
            btnGoToStep3.disabled = false;
        } else {
            btnGoToStep3.disabled = true;
        }
    };

    // -------------------------------------------------------------
    // 7. CLIENT FORM VALIDATION (STEP 3)
    // -------------------------------------------------------------
    const validateForm = () => {
        const nameInput = document.getElementById('guestName');
        const phoneInput = document.getElementById('guestPhone');
        const emailInput = document.getElementById('guestEmail');

        let isValid = true;

        // Name check
        if (nameInput.value.trim() === '') {
            nameInput.parentElement.classList.add('invalid');
            isValid = false;
        } else {
            nameInput.parentElement.classList.remove('invalid');
        }

        // Phone check: Pakistani formats starting with 03xx or +923xx
        const phoneRegex = /^((\+92)|(0092)|(0))3\d{2}[- ]?\d{7}$/;
        if (!phoneRegex.test(phoneInput.value.trim())) {
            phoneInput.parentElement.classList.add('invalid');
            isValid = false;
        } else {
            phoneInput.parentElement.classList.remove('invalid');
        }

        // Email check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value.trim())) {
            emailInput.parentElement.classList.add('invalid');
            isValid = false;
        } else {
            emailInput.parentElement.classList.remove('invalid');
        }

        return isValid;
    };

    // Add real-time blur listeners
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('blur', () => {
            // Validate individual input logic for better visual cue
            if (input.id === 'guestName') {
                if (input.value.trim() === '') input.parentElement.classList.add('invalid');
                else input.parentElement.classList.remove('invalid');
            }
            if (input.id === 'guestPhone') {
                const phoneRegex = /^((\+92)|(0092)|(0))3\d{2}[- ]?\d{7}$/;
                if (!phoneRegex.test(input.value.trim())) input.parentElement.classList.add('invalid');
                else input.parentElement.classList.remove('invalid');
            }
            if (input.id === 'guestEmail') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value.trim())) input.parentElement.classList.add('invalid');
                else input.parentElement.classList.remove('invalid');
            }
        });
    });

    btnSubmitBooking.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            // Save info
            bookingState.clientInfo.name = document.getElementById('guestName').value.trim();
            bookingState.clientInfo.phone = document.getElementById('guestPhone').value.trim();
            bookingState.clientInfo.email = document.getElementById('guestEmail').value.trim();
            bookingState.clientInfo.notes = document.getElementById('guestNotes').value.trim();

            // Perform dynamic checkout compilation
            const receiptIdVal = 'PRL-' + Math.floor(10000 + Math.random() * 90000);
            
            // Format full date output
            const dayObj = bookingState.selectedDate;
            const fullDateString = `${dayObj.dayName}, ${dayObj.month} ${dayObj.dayNum}, ${dayObj.year} at ${bookingState.selectedTime}`;

            // Calculate prices for receipt
            const subtotal = bookingState.selectedServices.reduce((sum, item) => sum + item.price, 0);
            const total = subtotal + Math.round(subtotal * GST_RATE);

            // Populate receipt
            document.getElementById('receiptId').textContent = receiptIdVal;
            document.getElementById('receiptGuest').textContent = bookingState.clientInfo.name;
            document.getElementById('receiptDateTime').textContent = fullDateString;
            document.getElementById('receiptTotal').textContent = `Rs. ${total.toLocaleString()}`;

            const receiptServicesList = document.getElementById('receiptServicesList');
            receiptServicesList.innerHTML = '';
            bookingState.selectedServices.forEach(s => {
                const li = document.createElement('li');
                li.textContent = `${s.name} (Rs. ${s.price.toLocaleString()})`;
                receiptServicesList.appendChild(li);
            });

            // Transition to Success Step
            changeStep(4);
            showToast('Booking Request Logged!', 'check-circle');
        } else {
            showToast('Please correct form errors.', 'alert-triangle');
        }
    });

    // Reset Booking Action
    btnResetBooking.addEventListener('click', () => {
        // Clear selection arrays
        bookingState.selectedServices = [];
        bookingState.selectedDate = null;
        bookingState.selectedTime = null;
        bookingState.clientInfo = { name: '', phone: '', email: '', notes: '' };

        // Reset form inputs
        bookingForm.reset();
        document.querySelectorAll('.form-group').forEach(fg => fg.classList.remove('invalid'));

        // Refresh UI
        updateCartDisplay();
        updateServiceButtonsState();
        changeStep(1);
    });

    // -------------------------------------------------------------
    // 8. LUXURY NEWSLETTER SIGNUP
    // -------------------------------------------------------------
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('.newsletter-input');
            if (emailInput && emailInput.value.trim() !== '') {
                showToast('Welcome to the Pearl Club!', 'sparkles');
                emailInput.value = '';
            }
        });
    }

    // Initialize state
    updateCartDisplay();
});
