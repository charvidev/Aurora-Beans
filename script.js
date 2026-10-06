

const CART_KEY = 'auroraCart';

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(id, name, price) {
    const cart = getCart();
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, name, price, qty: 1 });
    }
    saveCart(cart);
}

function removeFromCart(id) {
    saveCart(getCart().filter(item => item.id !== id));
}

function setQty(id, qty) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    if (qty <= 0) {
        saveCart(cart.filter(i => i.id !== id));
    } else {
        item.qty = qty;
        saveCart(cart);
    }
}

function cartCount(cart = getCart()) {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    const count = cartCount();
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
}

document.addEventListener('DOMContentLoaded', () => {

    updateCartBadge();

    /* ── Add to Cart buttons ── */
    document.querySelectorAll('.add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            const price = parseFloat(btn.dataset.price);
            if (!id) return; // no product data attached, let the link behave normally
            e.preventDefault();
            addToCart(id, name, price);

            window.location.href = 'checkout.html';
        });
    });

    /* ── Navbar shrink / solidify on scroll ── */
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        const setScrolled = () => {
            navbar.classList.toggle('scrolled', window.scrollY > 40);
            // keep anchor-link jumps (e.g. #about, #contact) from landing under the fixed navbar
            document.documentElement.style.scrollPaddingTop = navbar.offsetHeight + 12 + 'px';
        };
        setScrolled();
        window.addEventListener('scroll', setScrolled);
        window.addEventListener('resize', setScrolled);
    }

    /* ── Scroll-triggered fade-in animation ── */
    let scrollObserver;

    function observeScrollFades() {
        if (scrollObserver) scrollObserver.disconnect();
        scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.12 });

        document.querySelectorAll('.scroll-fade:not(.hidden *)').forEach(el => {
            scrollObserver.observe(el);
        });
    }

    observeScrollFades();

    /* ── Active nav link on scroll (home page sections) ── */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.navbar a:not([href="menu5.html"])');

    if (sections.length && navLinks.length) {
        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(sec => {
                if (window.scrollY >= sec.offsetTop - 80) {
                    current = sec.getAttribute('id');
                }
            });
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) {
                    link.classList.add('active');
                }
            });
        });
    }

    /* ── Contact form handler ── */
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = document.getElementById('contact-submit-btn');
            const originalText = btn.textContent;
            btn.textContent = '✅ Message Sent!';
            btn.style.background = '#4caf50';
            btn.style.color = 'white';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.style.color = '';
                contactForm.reset();
            }, 3000);
        });
    }

    /* ── Menu page: category filter tabs ── */
    const tabButtons = document.querySelectorAll('.tab-btn');
    if (tabButtons.length) {
        const categories = ['hot', 'cold', 'food'];

        function filterMenu(category) {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            const activeTab = document.getElementById('tab-' + category);
            if (activeTab) activeTab.classList.add('active');

            categories.forEach(cat => {
                const el = document.getElementById('section-' + cat);
                if (!el) return;
                if (category === 'all' || category === cat) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            });

            observeScrollFades();
        }

        tabButtons.forEach(btn => {
            const category = btn.id.replace('tab-', '');
            btn.addEventListener('click', () => filterMenu(category));
        });
    }

    /* ── Checkout / cart page ── */
    const cartList = document.getElementById('cart-list');
    if (cartList) {

        function renderCart() {
            const cart = getCart();

            if (cart.length === 0) {
                cartList.innerHTML = '<p class="cart-empty">Your cart is empty. <a href="menu5.html">Browse the menu</a> to add something.</p>';
                document.getElementById('cart-summary').classList.add('hidden');
                return;
            }

            document.getElementById('cart-summary').classList.remove('hidden');

            cartList.innerHTML = cart.map(item => `
                <div class="cart-row" data-id="${item.id}">
                    <span class="cart-row-name">${item.name}</span>
                    <span class="cart-row-price">₹${item.price}</span>
                    <span class="cart-row-qty">
                        <button class="qty-btn qty-minus" aria-label="Decrease quantity">−</button>
                        <span class="qty-val">${item.qty}</span>
                        <button class="qty-btn qty-plus" aria-label="Increase quantity">+</button>
                    </span>
                    <span class="cart-row-total">₹${item.price * item.qty}</span>
                    <button class="cart-row-remove" aria-label="Remove ${item.name}">✕</button>
                </div>
            `).join('');

            const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
            document.getElementById('cart-subtotal').textContent = '₹' + subtotal;

            cartList.querySelectorAll('.cart-row').forEach(row => {
                const id = row.dataset.id;
                row.querySelector('.qty-plus').addEventListener('click', () => {
                    const item = getCart().find(i => i.id === id);
                    setQty(id, item.qty + 1);
                    renderCart();
                });
                row.querySelector('.qty-minus').addEventListener('click', () => {
                    const item = getCart().find(i => i.id === id);
                    setQty(id, item.qty - 1);
                    renderCart();
                });
                row.querySelector('.cart-row-remove').addEventListener('click', () => {
                    removeFromCart(id);
                    renderCart();
                });
            });
        }

        renderCart();

        const placeOrderBtn = document.getElementById('place-order-btn');
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', () => {
                if (getCart().length === 0) return;
                const original = placeOrderBtn.textContent;
                placeOrderBtn.textContent = '✅ Order Placed!';
                placeOrderBtn.disabled = true;
                setTimeout(() => {
                    saveCart([]);
                    renderCart();
                    placeOrderBtn.textContent = original;
                    placeOrderBtn.disabled = false;
                }, 2000);
            });
        }
    }

});