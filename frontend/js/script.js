// frontend/js/script.js
$(function () {

  // ========================
  // SMOOTH SCROLL & ANIMATIONS
  // ========================
  $('a[href^="#"]').on('click', function (e) {
    const target = $($(this).attr('href'));
    if (target.length) {
      e.preventDefault();
      $('html, body').animate({ scrollTop: target.offset().top - 70 }, 500);
    }
  });

  function revealSections() {
    $('.fade-animation').each(function () {
      if ($(this).offset().top < $(window).scrollTop() + $(window).height() - 60) {
        $(this).addClass('visible');
      }
    });
  }
  revealSections();
  $(window).on('scroll', revealSections);

  // ========================
  // CART HELPERS
  // ========================
  const updateCartCount = () => {
    const count = getCart().reduce((sum, i) => sum + i.qty, 0);
    $('#cartCount').text(count);
  };
  updateCartCount();

  // ========================
  // LOGIN / REGISTER (login.html)
  // ========================
  if ($('#student-login').length) {

    // Student Login
    $('#studentLoginForm').on('submit', async function (e) {
      e.preventDefault();
      const email = $(this).find('input[name="email"]').val().trim();
      const password = $(this).find('input[name="password"]').val().trim();

      if (!email || !password) {
        showAlert('#formAlert', 'danger', 'Please enter email and password.');
        return;
      }

      try {
        const res = await fetch(API.login, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role: 'student' })
        });
        const data = await res.json();

        if (data.success) {
          setCurrentUser(data.user);
          showAlert('#formAlert', 'success', `Welcome back, ${data.user.name}! Redirecting...`);
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 700);
        } else {
          showAlert('#formAlert', 'danger', data.message || 'Login failed.');
        }
      } catch (err) {
        showAlert('#formAlert', 'danger', 'Cannot connect to server. Make sure backend is running.');
      }
    });

    // Admin Login
    $('#adminLoginForm').on('submit', async function (e) {
      e.preventDefault();
      const email = $(this).find('input[name="email"]').val().trim();
      const password = $(this).find('input[name="password"]').val().trim();

      if (!email || !password) {
        showAlert('#formAlert', 'danger', 'Please enter email and password.');
        return;
      }

      try {
        const res = await fetch(API.login, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role: 'admin' })
        });
        const data = await res.json();

        if (data.success) {
          setCurrentUser(data.user);
          showAlert('#formAlert', 'success', 'Admin login successful! Redirecting...');
          setTimeout(() => { window.location.href = 'admin.html'; }, 700);
        } else {
          showAlert('#formAlert', 'danger', data.message || 'Admin login failed.');
        }
      } catch (err) {
        showAlert('#formAlert', 'danger', 'Cannot connect to server. Make sure backend is running.');
      }
    });

    // Register
    $('#registerForm').on('submit', async function (e) {
      e.preventDefault();
      const name = $(this).find('input[name="name"]').val().trim();
      const phone = $(this).find('input[name="phone"]').val().trim();
      const email = $(this).find('input[name="email"]').val().trim();
      const password = $(this).find('input[name="password"]').val().trim();

      if (!name || !email || !password) {
        showAlert('#formAlert', 'danger', 'Please fill all required fields.');
        return;
      }
      if (password.length < 6) {
        showAlert('#formAlert', 'danger', 'Password must be at least 6 characters.');
        return;
      }

      try {
        const res = await fetch(API.register, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, email, password })
        });
        const data = await res.json();

        if (data.success) {
          setCurrentUser(data.user);
          showAlert('#formAlert', 'success', 'Account created! Redirecting to dashboard...');
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 700);
        } else {
          showAlert('#formAlert', 'danger', data.message || 'Registration failed.');
        }
      } catch (err) {
        showAlert('#formAlert', 'danger', 'Cannot connect to server. Make sure backend is running.');
      }
    });
  }

  // ========================
  // DASHBOARD (dashboard.html)
  // ========================
  if ($('#menuGrid').length) {

    // Show user's name if logged in
    const user = getCurrentUser();
    if (user) {
      $('.welcome-name').text(`Welcome back, ${user.name} 👋`);
    }

    // Load menu from backend
    async function loadMenu(category = 'all') {
      try {
        const url = category === 'all' ? API.menu : `${API.menu}?category=${category}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.success) throw new Error(data.message);
        renderMenu(data.data);
      } catch (err) {
        console.error('Menu load error:', err);
        // Keep static HTML as fallback, just bind add-to-cart
        bindAddToCart();
      }
    }

    function renderMenu(items) {
      const query = ($('#menuSearch').val() || '').toLowerCase();
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(query)
      );

      if (filtered.length === 0) {
        $('#menuGrid').html('<div class="col-12 text-center text-muted py-4">No items found.</div>');
        return;
      }

      const html = filtered.map(item => `
        <div class="col-sm-6 col-lg-4 items" data-category="${item.category}" data-name="${item.name}">
          <div class="card cards h-100">
            ${item.image_url ? `<img src="${item.image_url}" class="card-img-top" alt="${item.name}" onerror="this.style.display='none'">` : ''}
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${item.name}</h5>
              <p class="text-muted">${item.description || ''}</p>
              <div class="mt-auto d-flex justify-content-between align-items-center">
                <span class="fw-semibold text-success">₹${parseFloat(item.price).toFixed(0)}</span>
                <button class="btn btn-sm btn-warning add-to-cart"
                  data-name="${item.name}" data-price="${item.price}">Add to Cart</button>
              </div>
            </div>
          </div>
        </div>
      `).join('');

      $('#menuGrid').html(html);
      bindAddToCart();
    }

    function bindAddToCart() {
      $('.add-to-cart').off('click').on('click', function () {
        const name = $(this).data('name');
        const price = Number($(this).data('price'));
        const cart = getCart();
        const found = cart.find(i => i.name === name);

        if (found) found.qty += 1;
        else cart.push({ name, price, qty: 1 });

        setCart(cart);
        updateCartCount();

        const toastEl = document.getElementById('cartToast');
        if (toastEl) new bootstrap.Toast(toastEl).show();
      });
    }

    // Load recent orders for student (also updates top stat box + track section)
    async function loadRecentOrders() {
      const user = getCurrentUser();
      if (!user) {
        $('#latestOrderBadge').text('Login to view');
        return;
      }
      try {
        const res = await fetch(API.ordersByStudent(user.email));
        const data = await res.json();

        if (!data.success || data.data.length === 0) {
          $('#latestOrderBadge').text('No orders yet');
          $('#recentOrdersList').html('<li class="list-group-item text-muted">No orders placed yet.</li>');
          return;
        }

        const orders = data.data;
        const statusColors = { pending: 'warning', ready: 'success' };
        const statusLabels = { pending: 'Pending', ready: 'Ready for Pickup' };

        // Top stat box: latest order status
        const latest = orders[0];
        const latestLabel = statusLabels[latest.status] || latest.status;
        const latestColor = statusColors[latest.status] || 'secondary';
        $('#latestOrderBadge').html(
          '#' + latest.order_code + ' &nbsp;<span class="badge text-bg-' + latestColor + '">' + latestLabel + '</span>'
        );

        // Recent orders list (bottom section, up to 5)
        const html = orders.slice(0, 5).map(o =>
          '<li class="list-group-item d-flex justify-content-between align-items-center py-2">' +
            '<div>' +
              '<strong>#' + o.order_code + '</strong>' +
              '<div class="text-muted" style="font-size:.8rem">' + (o.items_summary || '') + '</div>' +
            '</div>' +
            '<span class="badge text-bg-' + (statusColors[o.status] || 'secondary') + '">' + (statusLabels[o.status] || o.status) + '</span>' +
          '</li>'
        ).join('');
        $('#recentOrdersList').html(html);

        // Update visual step tracker on dashboard
        $('#trackOrderId').text('#' + latest.order_code);
        if (latest.status === 'ready') {
          $('#tStep-pending').addClass('done').removeClass('active');
          $('#tStep-ready').addClass('done active');
          $('#tLine-1').addClass('done');
          $('#trackStatusMsg')
            .removeClass('alert-warning').addClass('alert-success')
            .html('<i class="bi bi-bag-check-fill me-1"></i><strong>Ready for pickup!</strong> Please collect from the counter.');
        } else {
          $('#tStep-pending').addClass('active').removeClass('done');
          $('#tStep-ready').removeClass('active done');
          $('#tLine-1').removeClass('done');
          $('#trackStatusMsg')
            .removeClass('alert-success').addClass('alert-warning')
            .html('<i class="bi bi-hourglass-split me-1"></i>Preparing your order...');
        }

      } catch (err) {
        console.log('Could not load recent orders:', err.message);
        $('#latestOrderBadge').text('Unavailable');
      }
    }

    // Search & filter
    $('#menuSearch, #categoryFilter').on('input change', function () {
      const category = $('#categoryFilter').val() || 'all';
      loadMenu(category);
    });

    // Override search to filter client-side after API load
    $('#menuSearch').on('input', function () {
      const query = $(this).val().toLowerCase();
      $('.items').each(function () {
        const name = ($(this).data('name') || '').toLowerCase();
        $(this).toggle(name.includes(query));
      });
    });

    loadMenu();
    loadRecentOrders();
    updateCartCount();

    // Real-time: refresh student orders every 5 seconds for instant status changes
    setInterval(loadRecentOrders, 5000);

    // Menu auto-refresh every 10 minutes (600000 ms)
    setInterval(function() {
      const cat = $('#categoryFilter').val() || 'all';
      loadMenu(cat);
    }, 600000);
  }

  // ========================
  // CART (cart.html)
  // ========================
  if ($('#cartTable').length) {

    function renderCart() {
      const $tbody = $('#cartTable tbody');
      const cart = getCart();
      $tbody.empty();

      if (!cart.length) {
        $tbody.append('<tr><td colspan="5" class="text-center text-muted py-4">Your cart is empty. <a href="dashboard.html">Browse menu</a></td></tr>');
        $('#cartTotal').text('0');
        return;
      }

      let total = 0;
      cart.forEach((item, index) => {
        const subtotal = item.price * item.qty;
        total += subtotal;
        $tbody.append(`
          <tr>
            <td>${item.name}</td>
            <td>₹${item.price}</td>
            <td><input type="number" class="form-control form-control-sm cart-qty" data-index="${index}" min="1" value="${item.qty}" style="max-width:90px"></td>
            <td class="item-subtotal">₹${subtotal}</td>
            <td><button class="btn btn-sm btn-outline-danger remove-item" data-index="${index}">Remove</button></td>
          </tr>
        `);
      });

      $('#cartTotal').text(total.toFixed(2));
    }

    renderCart();
    updateCartCount();

    $(document).on('click', '.remove-item', function () {
      const index = Number($(this).data('index'));
      const cart = getCart();
      cart.splice(index, 1);
      setCart(cart);
      renderCart();
      updateCartCount();
    });

    $('#updateCartBtn').on('click', function () {
      const cart = getCart();
      $('.cart-qty').each(function () {
        const index = Number($(this).data('index'));
        const qty = Math.max(1, Number($(this).val()));
        if (cart[index]) cart[index].qty = qty;
      });
      setCart(cart);
      renderCart();
      showAlert('#cartAlert', 'success', 'Cart updated successfully.');
      updateCartCount();
    });

    $('#placeOrderBtn').on('click', function () {
      const cart = getCart();
      if (!cart.length) {
        showAlert('#cartAlert', 'danger', 'Your cart is empty.');
        return;
      }
      const loadingModal = new bootstrap.Modal('#loadingModal');
      loadingModal.show();
      setTimeout(() => {
        loadingModal.hide();
        window.location.href = 'payment.html';
      }, 1400);
    });
  }

  // ========================
  // PAYMENT (payment.html)
  // ========================
  if ($('.payments').length) {
    let selectedMethod = null;

    $('.payments').on('click', function () {
      $('.payments').removeClass('selected');
      $(this).addClass('selected');
      selectedMethod = $(this).data('method');
      $('#continuePayment').prop('disabled', false);
    });

    $('#continuePayment').on('click', async function () {
      const cart = getCart();
      if (!cart.length) {
        alert('Your cart is empty!');
        window.location.href = 'dashboard.html';
        return;
      }

      const user = getCurrentUser();
      const studentName = user ? user.name : 'Guest';
      const studentEmail = user ? user.email : 'guest@easymeal.com';

      try {
        $(this).prop('disabled', true).text('Processing...');

        const res = await fetch(API.orders, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_name: studentName,
            student_email: studentEmail,
            items: cart,
            payment_method: selectedMethod || 'cod'
          })
        });

        const data = await res.json();

        if (data.success) {
          // Save order info for confirmation page
          sessionStorage.setItem('lastOrder', JSON.stringify(data.data));
          clearCart();
          window.location.href = 'confirmation.html';
        } else {
          alert('Order failed: ' + data.message);
          $(this).prop('disabled', false).text('Continue');
        }
      } catch (err) {
        console.error('Order error:', err);
        // Fallback: still go to confirmation even if backend is down
        sessionStorage.setItem('lastOrder', JSON.stringify({
          order_code: 'EM' + Date.now().toString().slice(-6),
          total_amount: cart.reduce((s, i) => s + i.price * i.qty, 0),
          status: 'pending'
        }));
        clearCart();
        window.location.href = 'confirmation.html';
      }
    });
  }

  // ========================
  // CONFIRMATION (confirmation.html)
  // ========================
  if ($('#step-pending').length) {
    let confirmOrderId = null;
    let confirmPollingTimer = null;

    // Load order details from session
    try {
      const lastOrder = JSON.parse(sessionStorage.getItem('lastOrder') || 'null');
      if (lastOrder) {
        confirmOrderId = lastOrder.id || null;
        $('#confirmOrderId').text('#' + lastOrder.order_code);
        $('#confirmTotal').text('\u20b9' + parseFloat(lastOrder.total_amount || 0).toFixed(0));
        applyConfirmStatus(lastOrder.status || 'pending');
      }
    } catch (e) {}

    function applyConfirmStatus(status) {
      if (status === 'ready') {
        $('#step-pending').addClass('done').removeClass('active');
        $('#step-ready').addClass('active done');
        $('#line-1').addClass('done');
        $('#statusMessage')
          .removeClass('alert-warning').addClass('alert-success')
          .html('<i class="bi bi-bag-check-fill me-1"></i> <strong>Your order is ready for pickup!</strong> Please collect it from the counter.');
      } else {
        $('#step-pending').addClass('active').removeClass('done');
        $('#step-ready').removeClass('active done');
        $('#line-1').removeClass('done');
        $('#statusMessage')
          .removeClass('alert-success').addClass('alert-warning')
          .html('<i class="bi bi-hourglass-split me-1"></i> Your order is being prepared...');
      }
    }

    // Real-time polling: if we have an order id, poll backend every 8 seconds
    async function pollOrderStatus() {
      if (!confirmOrderId) return;
      try {
        const res = await fetch(API.orderById(confirmOrderId));
        const data = await res.json();
        if (data.success && data.data) {
          applyConfirmStatus(data.data.status);
          if (data.data.status === 'ready') {
            clearInterval(confirmPollingTimer);
          }
        }
      } catch (e) {}
    }

    if (confirmOrderId) {
      confirmPollingTimer = setInterval(pollOrderStatus, 8000);
    }
  }

  // ========================
  // ADMIN DASHBOARD (admin.html)
  // ========================
  if ($('#panelOrders').length) {

    let adminOrdersCache = [];
    let autoRefreshTimer = null;

    // Load stats
    async function loadAdminStats() {
      try {
        const res = await fetch(API.adminStats);
        const data = await res.json();
        if (data.success) {
          const s = data.data;
          $('#statTotal').text(s.total_orders);
          $('#statPending').text(s.pending_orders);
          // Count ready from cache or fallback to 0
          const readyCount = adminOrdersCache.filter(o => o.status === 'ready').length;
          $('#statReady').text(readyCount || (s.ready_orders || 0));
          $('#statRevenue').text('₹' + parseFloat(s.total_revenue).toFixed(0));
        }
      } catch (err) {
        console.log('Stats load error:', err.message);
      }
    }

    // Expose for panel toggle
    window.loadAdminMenu = async function () {
      try {
        const res = await fetch(API.menuAll);
        const data = await res.json();
        if (!data.success) return;

        const html = data.data.map(item => `
          <tr id="menu-row-${item.id}">
            <td><strong>${item.name}</strong></td>
            <td>${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</td>
            <td>₹${parseFloat(item.price).toFixed(0)}</td>
            <td><span class="badge ${item.is_available ? 'text-bg-success' : 'text-bg-secondary'}">
              ${item.is_available ? 'Available' : 'Unavailable'}
            </span></td>
            <td>
              <button class="btn btn-sm btn-outline-warning me-1 edit-menu-item" data-id="${item.id}" data-name="${item.name}" data-category="${item.category}" data-price="${item.price}" data-desc="${item.description || ''}">
                <i class="bi bi-pencil"></i> Edit
              </button>
              <button class="btn btn-sm btn-outline-primary me-1 toggle-item" data-id="${item.id}" data-available="${item.is_available}">
                ${item.is_available ? 'Disable' : 'Enable'}
              </button>
              <button class="btn btn-sm btn-outline-danger delete-menu-item" data-id="${item.id}">Delete</button>
            </td>
          </tr>
        `).join('');

        $('#adminMenuTableBody').html(html);
        bindMenuActions();
      } catch (err) {
        console.log('Menu load error:', err.message);
      }
    };

    function bindMenuActions() {
      $('.toggle-item').off('click').on('click', async function () {
        const id = $(this).data('id');
        const currentAvail = parseInt($(this).data('available'));
        const newAvail = currentAvail ? 0 : 1;
        try {
          const menuRes = await fetch(API.menuAll);
          const menuData = await menuRes.json();
          const item = menuData.data.find(i => i.id === id);
          if (!item) return;
          await fetch(API.menuItem(id), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...item, is_available: newAvail })
          });
          window.loadAdminMenu();
        } catch (err) { alert('Failed to update item.'); }
      });

      $('.delete-menu-item').off('click').on('click', async function () {
        const id = $(this).data('id');
        if (!confirm('Delete this menu item?')) return;
        try {
          await fetch(API.menuItem(id), { method: 'DELETE' });
          $(`#menu-row-${id}`).remove();
        } catch (err) { alert('Failed to delete item.'); }
      });

      // Edit menu item — fill modal and switch to edit mode
      $('.edit-menu-item').off('click').on('click', function () {
        const btn = $(this);
        $('#editItemId').val(btn.data('id'));
        $('#editItemName').val(btn.data('name'));
        $('#editItemCategory').val(btn.data('category'));
        $('#editItemPrice').val(btn.data('price'));
        $('#editItemDesc').val(btn.data('desc'));
        new bootstrap.Modal(document.getElementById('editMenuModal')).show();
      });
    }

    // Render the two-column order board
    function renderOrderBoard(orders) {
      adminOrdersCache = orders;
      const q = ($('#adminOrderSearch').val() || '').toLowerCase();

      const pending = orders.filter(o => o.status === 'pending' &&
        (!q || o.order_code.toLowerCase().includes(q) || o.student_name.toLowerCase().includes(q)));
      const ready   = orders.filter(o => o.status === 'ready' &&
        (!q || o.order_code.toLowerCase().includes(q) || o.student_name.toLowerCase().includes(q)));

      $('#pendingCount').text(pending.length);
      $('#readyCount').text(ready.length);

      // Pending cards
      if (pending.length === 0) {
        $('#pendingOrders').html('<div class="no-orders-msg"><i class="bi bi-check2-all d-block fs-2 mb-1"></i>No pending orders</div>');
      } else {
        $('#pendingOrders').html(pending.map(o => `
          <div class="order-item" id="order-card-${o.id}">
            <div class="order-info">
              <strong>#${o.order_code}</strong>
              <div class="order-meta"><i class="bi bi-person me-1"></i>${o.student_name}</div>
              <div class="order-meta"><i class="bi bi-basket me-1"></i>${o.items_summary || '-'}</div>
            </div>
            <button class="btn btn-success mark-ready-btn" data-id="${o.id}">
              <i class="bi bi-check-lg me-1"></i>Mark Ready
            </button>
          </div>
        `).join(''));
      }

      // Ready cards
      if (ready.length === 0) {
        $('#readyOrders').html('<div class="no-orders-msg"><i class="bi bi-box-seam d-block fs-2 mb-1"></i>No ready orders</div>');
      } else {
        $('#readyOrders').html(ready.map(o => `
          <div class="order-item" id="order-card-${o.id}">
            <div class="order-info">
              <strong>#${o.order_code}</strong>
              <div class="order-meta"><i class="bi bi-person me-1"></i>${o.student_name}</div>
              <div class="order-meta"><i class="bi bi-basket me-1"></i>${o.items_summary || '-'}</div>
            </div>
            <button class="btn btn-sm btn-outline-secondary mark-done-btn" data-id="${o.id}">
              <i class="bi bi-arrow-counterclockwise me-1"></i>Undo
            </button>
          </div>
        `).join(''));
      }

      // Update stat card
      $('#statReady').text(ready.length);
      $('#statPending').text(pending.length);

      // Update refresh time
      const now = new Date();
      $('#lastRefreshedTime').text('Updated ' + now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));

      bindOrderCardActions();
    }

    function bindOrderCardActions() {
      // Mark as Ready
      $('.mark-ready-btn').off('click').on('click', async function () {
        const id = $(this).data('id');
        const btn = $(this);
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');
        try {
          const res = await fetch(API.updateOrderStatus(id), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ready' })
          });
          const data = await res.json();
          if (data.success) {
            loadAdminOrders();
            loadAdminStats();
          } else {
            btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Mark Ready');
          }
        } catch (err) {
          btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Mark Ready');
          alert('Failed to update status.');
        }
      });

      // Undo (back to pending)
      $('.mark-done-btn').off('click').on('click', async function () {
        const id = $(this).data('id');
        const btn = $(this);
        btn.prop('disabled', true);
        try {
          const res = await fetch(API.updateOrderStatus(id), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'pending' })
          });
          const data = await res.json();
          if (data.success) {
            loadAdminOrders();
            loadAdminStats();
          } else {
            btn.prop('disabled', false);
          }
        } catch (err) {
          btn.prop('disabled', false);
          alert('Failed to update status.');
        }
      });
    }

    async function loadAdminOrders() {
      try {
        const res = await fetch(API.orders);
        const data = await res.json();
        if (!data.success) return;
        renderOrderBoard(data.data);
      } catch (err) {
        console.log('Orders load error:', err.message);
      }
    }

    // Live search filter on cached data
    $('#adminOrderSearch').on('input', function () {
      renderOrderBoard(adminOrdersCache);
    });

    // Manual refresh button
    $('#refreshOrdersBtn').on('click', function () {
      const icon = $(this).find('i');
      icon.addClass('spin-once');
      setTimeout(() => icon.removeClass('spin-once'), 600);
      loadAdminOrders();
      loadAdminStats();
    });

    // Edit menu item form — save changes
    $('#saveEditItemBtn').on('click', async function () {
      const id = $('#editItemId').val();
      const name = $('#editItemName').val().trim();
      const category = $('#editItemCategory').val();
      const price = $('#editItemPrice').val();
      const description = $('#editItemDesc').val().trim();

      if (!name || !price) {
        alert('Item name and price are required.');
        return;
      }

      try {
        const res = await fetch(API.menuItem(id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, category, price: parseFloat(price), description, is_available: 1 })
        });
        const data = await res.json();

        if (data.success) {
          bootstrap.Modal.getInstance(document.getElementById('editMenuModal')).hide();
          window.loadAdminMenu();
        } else {
          alert('Failed to update: ' + (data.message || ''));
        }
      } catch (err) {
        alert('Cannot connect to server.');
      }
    });

    // Add menu item form
    $('#saveMenuItemBtn').on('click', async function () {
      const name = $('#newItemName').val().trim();
      const category = $('#newItemCategory').val();
      const price = $('#newItemPrice').val();
      const description = $('#newItemDesc').val().trim();

      if (!name || !price) {
        alert('Item name and price are required.');
        return;
      }

      try {
        const res = await fetch(API.menu, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, category, price: parseFloat(price), description })
        });
        const data = await res.json();

        if (data.success) {
          bootstrap.Modal.getInstance(document.getElementById('menuModal')).hide();
          $('#newItemName, #newItemPrice, #newItemDesc').val('');
          window.loadAdminMenu();
          loadAdminStats();
        } else {
          alert('Failed: ' + data.message);
        }
      } catch (err) {
        alert('Cannot connect to server.');
      }
    });

    // Auto-refresh orders every 2 seconds for near-real-time admin view
    autoRefreshTimer = setInterval(function () {
      loadAdminOrders();
      loadAdminStats();
    }, 2000);

    // Init — load stats only; panels load on click
    loadAdminStats();
    loadAdminOrders(); // pre-load orders so they're ready when panel opens
  }

  // ========================
  // LOGOUT
  // ========================
  $('#logoutBtn').on('click', function (e) {
    e.preventDefault();
    clearCurrentUser();
    clearCart();
    window.location.href = 'login.html';
  });

});
