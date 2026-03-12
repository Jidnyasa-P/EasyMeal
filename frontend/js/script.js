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

    // Load recent orders for student
    async function loadRecentOrders() {
      const user = getCurrentUser();
      if (!user) return;

      try {
        const res = await fetch(API.ordersByStudent(user.email));
        const data = await res.json();

        if (!data.success || data.data.length === 0) return;

        const orders = data.data.slice(0, 3);
        const statusColors = { pending: 'warning', preparing: 'warning', ready: 'info', completed: 'success' };

        const html = orders.map(o => `
          <li class="list-group-item d-flex justify-content-between">
            Order #${o.order_code}
            <span class="badge text-bg-${statusColors[o.status] || 'secondary'}">${o.status}</span>
          </li>
        `).join('');

        $('#recentOrdersList').html(html);

        // Update track order
        const latest = orders[0];
        const progressMap = { pending: 20, preparing: 50, ready: 75, completed: 100 };
        const progress = progressMap[latest.status] || 35;
        $('#trackOrderId').text(`#${latest.order_code}`);
        $('#trackProgress').css('width', progress + '%').text(`${latest.status} (${progress}%)`);
      } catch (err) {
        console.log('Could not load recent orders:', err.message);
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
  if ($('#statusProgress').length) {
    // Load order details from session
    try {
      const lastOrder = JSON.parse(sessionStorage.getItem('lastOrder') || 'null');
      if (lastOrder) {
        $('#confirmOrderId').text(`#${lastOrder.order_code}`);
        $('#confirmTotal').text(`₹${parseFloat(lastOrder.total_amount || 0).toFixed(0)}`);
      }
    } catch (e) {}

    // Animate status
    const statusSteps = [
      { text: 'Preparing', width: 35 },
      { text: 'Ready', width: 70 },
      { text: 'Completed', width: 100 }
    ];
    let stepIndex = 0;
    setInterval(() => {
      stepIndex = (stepIndex + 1) % statusSteps.length;
      const step = statusSteps[stepIndex];
      $('#statusProgress').css('width', step.width + '%').text(step.text);
      $('.status').removeClass('active').eq(stepIndex).addClass('active');
    }, 3000);
  }

  // ========================
  // ADMIN DASHBOARD (admin.html)
  // ========================
  if ($('#adminOrdersTable').length) {

    // Load stats
    async function loadAdminStats() {
      try {
        const res = await fetch(API.adminStats);
        const data = await res.json();
        if (data.success) {
          const s = data.data;
          $('#statTotal').text(s.total_orders);
          $('#statPending').text(s.pending_orders);
          $('#statCompleted').text(s.completed_orders);
          $('#statRevenue').text('₹' + parseFloat(s.total_revenue).toFixed(0));
        }
      } catch (err) {
        console.log('Stats load error:', err.message);
      }
    }

    // Load menu items for admin
    async function loadAdminMenu() {
      try {
        const res = await fetch(API.menuAll);
        const data = await res.json();
        if (!data.success) return;

        const html = data.data.map(item => `
          <tr id="menu-row-${item.id}">
            <td>${item.name}</td>
            <td>${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</td>
            <td>₹${parseFloat(item.price).toFixed(0)}</td>
            <td><span class="badge ${item.is_available ? 'text-bg-success' : 'text-bg-secondary'}">
              ${item.is_available ? 'Available' : 'Unavailable'}
            </span></td>
            <td>
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
    }

    function bindMenuActions() {
      // Toggle availability
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
          loadAdminMenu();
        } catch (err) {
          alert('Failed to update item.');
        }
      });

      // Delete menu item
      $('.delete-menu-item').off('click').on('click', async function () {
        const id = $(this).data('id');
        if (!confirm('Delete this menu item?')) return;
        try {
          await fetch(API.menuItem(id), { method: 'DELETE' });
          $(`#menu-row-${id}`).remove();
        } catch (err) {
          alert('Failed to delete item.');
        }
      });
    }

    // Load orders
    async function loadAdminOrders(status = 'all') {
      try {
        const url = status === 'all' ? API.orders : `${API.orders}?status=${status}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.success) return;

        const statusColors = { pending: 'warning', preparing: 'info', ready: 'primary', completed: 'success' };

        const html = data.data.map(order => `
          <tr data-status="${order.status}" data-id="${order.id}">
            <td>#${order.order_code}</td>
            <td>${order.student_name}</td>
            <td>${order.items_summary || '-'}</td>
            <td><span class="badge text-bg-${statusColors[order.status] || 'secondary'}">${order.status}</span></td>
            <td>
              <select class="form-select form-select-sm order-status-select" data-id="${order.id}" style="min-width:120px">
                <option value="pending" ${order.status==='pending'?'selected':''}>Pending</option>
                <option value="preparing" ${order.status==='preparing'?'selected':''}>Preparing</option>
                <option value="ready" ${order.status==='ready'?'selected':''}>Ready</option>
                <option value="completed" ${order.status==='completed'?'selected':''}>Completed</option>
              </select>
            </td>
          </tr>
        `).join('');

        $('#adminOrdersTable tbody').html(html || '<tr><td colspan="5" class="text-center text-muted">No orders found.</td></tr>');
        bindOrderActions();
      } catch (err) {
        console.log('Orders load error:', err.message);
      }
    }

    function bindOrderActions() {
      $('.order-status-select').off('change').on('change', async function () {
        const id = $(this).data('id');
        const status = $(this).val();
        try {
          const res = await fetch(API.updateOrderStatus(id), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          });
          const data = await res.json();
          if (data.success) {
            loadAdminOrders($('#adminOrderFilter').val() || 'all');
            loadAdminStats();
          }
        } catch (err) {
          alert('Failed to update status.');
        }
      });
    }

    // Admin order search/filter
    $('#adminOrderSearch').on('input', function () {
      const q = $(this).val().toLowerCase();
      $('#adminOrdersTable tbody tr').each(function () {
        $(this).toggle($(this).text().toLowerCase().includes(q));
      });
    });

    $('#adminOrderFilter').on('change', function () {
      loadAdminOrders($(this).val());
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
          loadAdminMenu();
          loadAdminStats();
        } else {
          alert('Failed: ' + data.message);
        }
      } catch (err) {
        alert('Cannot connect to server.');
      }
    });

    // Init
    loadAdminStats();
    loadAdminMenu();
    loadAdminOrders();
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
