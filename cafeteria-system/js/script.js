$(function () {
  // Smooth scrolling for anchor links
  $('a[href^="#"]').on('click', function (e) {
    const target = $($(this).attr('href'));
    if (target.length) {
      e.preventDefault();
      $('html, body').animate({ scrollTop: target.offset().top - 70 }, 500);
    }
  });

  // Fade-in sections on scroll
  function revealSections() {
    $('.fade-in-section').each(function () {
      if ($(this).offset().top < $(window).scrollTop() + $(window).height() - 60) {
        $(this).addClass('visible');
      }
    });
  }
  revealSections();
  $(window).on('scroll', revealSections);

  // Storage helpers
  const getCart = () => JSON.parse(localStorage.getItem('easymealCart') || '[]');
  const setCart = (cart) => localStorage.setItem('easymealCart', JSON.stringify(cart));
  const updateCartCount = () => {
    const count = getCart().reduce((sum, i) => sum + i.qty, 0);
    $('#cartCount').text(count);
  };
  updateCartCount();

  // Add-to-cart feature
  $('.add-to-cart').on('click', function () {
    const name = $(this).data('name');
    const price = Number($(this).data('price'));
    const cart = getCart();
    const found = cart.find((item) => item.name === name);

    if (found) found.qty += 1;
    else cart.push({ name, price, qty: 1 });

    setCart(cart);
    updateCartCount();

    const toastEl = document.getElementById('cartToast');
    if (toastEl) new bootstrap.Toast(toastEl).show();
  });

  // Menu search + filter
  function filterMenu() {
    const query = ($('#menuSearch').val() || '').toLowerCase();
    const category = $('#categoryFilter').val() || 'all';

    $('.menu-item').each(function () {
      const name = ($(this).data('name') || '').toLowerCase();
      const cat = $(this).data('category');
      const matchesSearch = name.includes(query);
      const matchesCategory = category === 'all' || cat === category;
      $(this).toggle(matchesSearch && matchesCategory);
    });
  }
  $('#menuSearch, #categoryFilter').on('input change', filterMenu);

  // Render cart table
  function renderCart() {
    const $tbody = $('#cartTable tbody');
    if (!$tbody.length) return;
    const cart = getCart();
    $tbody.empty();

    if (!cart.length) {
      $tbody.append('<tr><td colspan="5" class="text-center text-muted py-4">Your cart is empty. Add items from dashboard.</td></tr>');
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

    $('#cartTotal').text(total);
  }
  renderCart();

  // Update and remove cart items
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
    $('#cartAlert').removeClass('d-none alert-danger').addClass('alert-success').text('Cart updated successfully.');
    updateCartCount();
  });

  // Place order loading animation
  $('#placeOrderBtn').on('click', function () {
    const cart = getCart();
    if (!cart.length) {
      $('#cartAlert').removeClass('d-none alert-success').addClass('alert-danger').text('Your cart is empty.');
      return;
    }
    const loadingModal = new bootstrap.Modal('#loadingModal');
    loadingModal.show();
    setTimeout(() => {
      loadingModal.hide();
      window.location.href = 'payment.html';
    }, 1400);
  });

  // Payment selection cards
  $('.payment-card').on('click', function () {
    $('.payment-card').removeClass('selected');
    $(this).addClass('selected');
    $('#continuePayment').prop('disabled', false);
  });

  $('#continuePayment').on('click', function () {
    window.location.href = 'confirmation.html';
  });

  // Basic jQuery validation for auth forms
  $('.auth-form').on('submit', function (e) {
    e.preventDefault();
    let valid = true;

    $(this).find('input[required]').each(function () {
      if (!$(this).val().trim()) valid = false;
      if ($(this).attr('type') === 'email') {
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($(this).val().trim());
        if (!ok) valid = false;
      }
    });

    const $alert = $('#formAlert');
    if (!valid) {
      $alert.removeClass('d-none alert-success').addClass('alert-danger').text('Please fill all fields with valid details.');
      return;
    }

    $alert.removeClass('d-none alert-danger').addClass('alert-success').text('Success! Redirecting...');
    const target = $(this).data('target') || 'dashboard.html';
    setTimeout(() => { window.location.href = target; }, 600);
  });

  // Admin order search/filter
  function filterAdminOrders() {
    const q = ($('#adminOrderSearch').val() || '').toLowerCase();
    const status = $('#adminOrderFilter').val() || 'all';

    $('#adminOrdersTable tbody tr').each(function () {
      const rowText = $(this).text().toLowerCase();
      const rowStatus = $(this).data('status');
      const matchQ = rowText.includes(q);
      const matchStatus = status === 'all' || rowStatus === status;
      $(this).toggle(matchQ && matchStatus);
    });
  }
  $('#adminOrderSearch, #adminOrderFilter').on('input change', filterAdminOrders);

  // Simulate status progress animation
  const statusSteps = [
    { text: 'Preparing', width: 35 },
    { text: 'Ready', width: 70 },
    { text: 'Completed', width: 100 }
  ];
  let stepIndex = 0;
  if ($('#statusProgress').length) {
    setInterval(() => {
      stepIndex = (stepIndex + 1) % statusSteps.length;
      const step = statusSteps[stepIndex];
      $('#statusProgress').css('width', step.width + '%').text(step.text);
      $('.status-badge').removeClass('active').eq(stepIndex).addClass('active');
    }, 3000);
  }
});
