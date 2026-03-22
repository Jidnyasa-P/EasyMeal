// frontend/js/script.js  — EasyMeal  (fully fixed)
//
// Key fixes vs previous version:
//  1. window.addItemToCart defined at TOP of file (outside any DOMReady block)
//     so it is always available regardless of which page / which block runs first.
//  2. Analytics: window.loadAnalytics defined at TOP of file too — admin.html
//     inline <script> calls showPanel() which calls loadAnalytics(); this used to
//     fail because the analytics $(function(){}) hadn't finished yet.
//  3. Email URLs now use query params (?email=...) matching the new server routes,
//     eliminating any path-param double-encoding problems.
//  4. Reorder + For You buttons use delegated event binding on stable containers.

// ── Global helpers (available immediately, before any DOMReady) ───────────────
window.addItemToCart = function (name, price) {
  var cart  = getCart();
  var found = cart.find(function (i) { return i.name === name; });
  if (found) found.qty += 1;
  else cart.push({ name: name, price: Number(price), qty: 1 });
  setCart(cart);
  // Update every cart-count badge on the page
  var count = cart.reduce(function (s, i) { return s + i.qty; }, 0);
  document.querySelectorAll('#cartCount').forEach(function (el) { el.textContent = count; });
  // Toast
  var toastEl = document.getElementById('cartToast');
  if (toastEl && window.bootstrap) new bootstrap.Toast(toastEl).show();
};

// ── Admin analytics — defined globally so showPanel() can call it immediately ─
window.loadAnalytics = (function () {
  var _days   = 7;
  var COLORS  = ['#0d6efd','#198754','#ffc107','#dc3545','#0dcaf0','#6f42c1','#fd7e14','#20c997','#6c757d','#d63384'];
  var CAT_CLR = { meal: '#198754', snack: '#ffc107', drink: '#0dcaf0' };

  return async function load(days) {
    if (days) _days = days;
    if (!document.getElementById('anItemBars')) return; // not on admin page

    var to   = new Date().toISOString().split('T')[0];
    var from = new Date(Date.now() - (_days - 1) * 86400000).toISOString().split('T')[0];

    $('#anItemBars,#anCatBars,#anDailyBars').html(
      '<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-info"></div></div>');
    $('#anTopStudents').html(
      '<li class="list-group-item text-center py-3"><div class="spinner-border spinner-border-sm"></div></li>');
    // Reset KPIs
    $('#kpiPopular,#kpiLeast,#kpiSold,#kpiRevItem').html(
      '<div class="spinner-border spinner-border-sm"></div>');
    $('#kpiPopularSub,#kpiLeastSub,#kpiSoldSub,#kpiRevItemSub').text('');

    try {
      var res  = await fetch(API.analytics + '?from=' + from + '&to=' + to);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      if (!data.success) throw new Error(data.message || 'API error');

      var itemStats   = data.data.itemStats   || [];
      var dailyOrders = data.data.dailyOrders || [];
      var catBreak    = data.data.catBreak    || [];
      var topStudents = data.data.topStudents || [];

      // KPI cards
      if (itemStats.length) {
        var byOrd = itemStats.slice().sort(function (a,b){ return b.order_count  - a.order_count;  });
        var byQty = itemStats.slice().sort(function (a,b){ return b.total_qty    - a.total_qty;    });
        var byRev = itemStats.slice().sort(function (a,b){ return b.total_revenue- a.total_revenue;});
        var least = itemStats.slice().sort(function (a,b){ return a.order_count  - b.order_count;  });
        $('#kpiPopular').text(byOrd[0].item_name); $('#kpiPopularSub').text(byOrd[0].order_count + ' orders');
        $('#kpiLeast'  ).text(least[0].item_name); $('#kpiLeastSub'  ).text(least[0].order_count + ' orders');
        $('#kpiSold'   ).text(byQty[0].item_name); $('#kpiSoldSub'   ).text(byQty[0].total_qty + ' units sold');
        $('#kpiRevItem' ).text(byRev[0].item_name); $('#kpiRevItemSub').text('₹' + parseFloat(byRev[0].total_revenue).toFixed(0));
      } else {
        $('#kpiPopular,#kpiLeast,#kpiSold,#kpiRevItem').text('No data');
        $('#kpiPopularSub,#kpiLeastSub,#kpiSoldSub,#kpiRevItemSub').text('No orders in period');
      }

      // Top-10 items bar
      var top10  = itemStats.slice().sort(function(a,b){ return b.total_qty-a.total_qty; }).slice(0,10);
      var maxQty = top10.length ? top10[0].total_qty : 1;
      if (!top10.length) {
        $('#anItemBars').html('<div class="text-muted text-center py-3">No order data for this period.</div>');
      } else {
        $('#anItemBars').html(top10.map(function(it,i){
          var w = Math.max(4,(it.total_qty/maxQty*100)).toFixed(1);
          return '<div class="d-flex align-items-center gap-2 mb-2">' +
            '<div style="width:130px;font-size:.78rem;font-weight:600;text-align:right;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+it.item_name+'">'+it.item_name+'</div>' +
            '<div class="bar-track flex-grow-1"><div class="bar-fill" style="width:'+w+'%;background:'+COLORS[i%10]+'"></div></div>' +
            '<div style="width:36px;font-size:.78rem;font-weight:700">'+it.total_qty+'</div></div>';
        }).join(''));
      }

      // Category breakdown
      var catTotal = catBreak.reduce(function(s,c){ return s+parseInt(c.total_qty||0); },0)||1;
      if (!catBreak.length) {
        $('#anCatBars').html('<div class="text-muted text-center py-3">No data.</div>');
      } else {
        $('#anCatBars').html(catBreak.map(function(c){
          var pct = ((c.total_qty/catTotal)*100).toFixed(1);
          var col = CAT_CLR[c.category]||'#6c757d';
          return '<div class="d-flex align-items-center gap-2 mb-2">' +
            '<span class="cat-pill" style="background:'+col+'22;color:'+col+';width:60px;text-align:center">'+c.category+'</span>' +
            '<div class="bar-track flex-grow-1"><div class="bar-fill" style="width:'+pct+'%;background:'+col+'"></div></div>' +
            '<span style="font-size:.78rem;font-weight:700;width:40px">'+pct+'%</span></div>';
        }).join(''));
      }

      // Top students
      if (!topStudents.length) {
        $('#anTopStudents').html('<li class="list-group-item text-muted text-center py-3">No data for this period.</li>');
      } else {
        $('#anTopStudents').html(topStudents.map(function(s,i){
          return '<li class="list-group-item d-flex justify-content-between align-items-center py-2">' +
            '<div><span class="badge me-2" style="background:'+COLORS[i]+'">'+(i+1)+'</span>' +
            '<strong style="font-size:.85rem">'+s.student_name+'</strong>' +
            '<span class="text-muted ms-1" style="font-size:.75rem">('+s.orders+' orders)</span></div>' +
            '<span class="fw-bold text-success">₹'+parseFloat(s.spent).toFixed(0)+'</span></li>';
        }).join(''));
      }

      // Daily bar chart
      if (!dailyOrders.length) {
        $('#anDailyBars').html('<div class="text-muted text-center py-3">No orders in the last 14 days.</div>');
      } else {
        var maxDay = Math.max.apply(null, dailyOrders.map(function(d){ return d.order_count; }));
        $('#anDailyBars').html(
          '<div class="d-flex align-items-end gap-1" style="height:90px">' +
          dailyOrders.map(function(d){
            var h   = Math.max(6,Math.round(d.order_count/maxDay*80));
            var lbl = new Date(d.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
            return '<div class="d-flex flex-column align-items-center flex-grow-1" title="'+lbl+': '+d.order_count+' orders">' +
              '<div style="font-size:.6rem;color:#6b7280;margin-bottom:2px">'+d.order_count+'</div>' +
              '<div style="height:'+h+'px;background:#0d6efd;border-radius:4px 4px 0 0;width:100%;min-width:14px"></div>' +
              '<div style="font-size:.55rem;color:#9ca3af;margin-top:2px;white-space:nowrap">'+lbl+'</div></div>';
          }).join('') + '</div>'
        );
      }

    } catch (e) {
      console.error('Analytics fetch error:', e);
      // Show the REAL error message so it's easier to diagnose
      var errDetail = e && e.message ? e.message : String(e);
      var msg = '<div class="text-danger text-center py-3">' +
        '<i class="bi bi-exclamation-triangle-fill me-2"></i>' +
        '<strong>Analytics failed.</strong><br>' +
        '<span style="font-size:.82rem">Error: ' + errDetail + '</span><br><br>' +
        '<span style="font-size:.8rem">Check: backend running at <strong>http://localhost:3000</strong>?</span><br>' +
        '<a href="http://localhost:3000/api/test" target="_blank" class="btn btn-sm btn-outline-danger mt-2">' +
        '<i class="bi bi-arrow-up-right-circle me-1"></i>Test backend connection</a>' +
        '</div>';
      $('#anItemBars').html(msg);
      $('#anCatBars, #anDailyBars').html('');
      $('#kpiPopular,#kpiLeast,#kpiSold,#kpiRevItem').text('—');
      $('#anTopStudents').html('<li class="list-group-item text-muted text-center py-3">Could not load data.</li>');
    }
  };
}());

// ── Admin order history — also global so showPanel can trigger auto-load ─────
window.loadOrderHistory = async function () {
  if (!document.getElementById('histTableBody')) return;
  var from    = $('#histFrom').val();
  var to      = $('#histTo').val();
  var student = $('#histStudent').val().trim();
  var qs = new URLSearchParams();
  if (from)    qs.append('from', from);
  if (to)      qs.append('to',   to);
  if (student) qs.append('student', student);

  $('#histTableBody').html(
    '<tr><td colspan="7" class="text-center py-4">' +
    '<div class="spinner-border spinner-border-sm text-secondary me-2"></div>Loading...</td></tr>');

  try {
    var res  = await fetch(API.orderHistory + (qs.toString() ? '?' + qs : ''));
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    if (!data.success) throw new Error(data.message || 'Server error');

    var rows = data.data;
    $('#histCount').text(rows.length);
    var rev = rows.reduce(function(s,r){ return s + parseFloat(r.total_amount||0); }, 0);
    $('#histRevenue').text('₹' + rev.toFixed(0));

    if (!rows.length) {
      $('#histTableBody').html(
        '<tr><td colspan="7" class="text-center py-5 text-muted">No orders found for the selected filters.</td></tr>');
      return;
    }

    function badge(s) {
      return s === 'ready'
        ? '<span class="badge text-bg-success">Ready</span>'
        : '<span class="badge text-bg-warning text-dark">Pending</span>';
    }

    $('#histTableBody').html(rows.map(function(o){
      var dt = new Date(o.created_at).toLocaleString('en-IN',{
        day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
      });
      return '<tr class="hist-row">' +
        '<td><strong>#'+o.order_code+'</strong></td>' +
        '<td><div style="font-size:.85rem;font-weight:600">'+o.student_name+'</div>' +
        '<div class="text-muted" style="font-size:.75rem">'+o.student_email+'</div></td>' +
        '<td style="font-size:.8rem;max-width:180px;white-space:normal">'+(o.items_summary||'—')+'</td>' +
        '<td class="fw-bold text-success">₹'+parseFloat(o.total_amount).toFixed(0)+'</td>' +
        '<td><span class="badge text-bg-secondary">'+(o.payment_method||'cod').toUpperCase()+'</span></td>' +
        '<td>'+badge(o.status)+'</td>' +
        '<td style="font-size:.8rem;white-space:nowrap">'+dt+'</td></tr>';
    }).join(''));
  } catch (e) {
    console.error('History fetch error:', e);
    $('#histTableBody').html(
      '<tr><td colspan="7" class="text-center text-danger py-3">' +
      '<i class="bi bi-exclamation-triangle-fill me-2"></i>' +
      'Failed to load history — is the backend running at <strong>http://localhost:3000</strong>?' +
      '</td></tr>');
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// DOM-READY
// ════════════════════════════════════════════════════════════════════════════════
$(function () {

  // ── Smooth scroll ──────────────────────────────────────────────────────────
  $('a[href^="#"]').on('click', function (e) {
    var target = $($(this).attr('href'));
    if (target.length) { e.preventDefault(); $('html,body').animate({ scrollTop: target.offset().top - 70 }, 500); }
  });

  function revealSections() {
    $('.fade-animation').each(function () {
      if ($(this).offset().top < $(window).scrollTop() + $(window).height() - 60) $(this).addClass('visible');
    });
  }
  revealSections();
  $(window).on('scroll', revealSections);

  // ── Cart count badge (all pages) ───────────────────────────────────────────
  function updateCartCount() {
    var count = getCart().reduce(function(s,i){ return s+i.qty; }, 0);
    $('#cartCount').text(count);
  }
  updateCartCount();

  // ══════════════════════════════════════════════════════════════════════════
  // LOGIN / REGISTER  (login.html)
  // ══════════════════════════════════════════════════════════════════════════
  if ($('#student-login').length) {

    $('#studentLoginForm').on('submit', async function (e) {
      e.preventDefault();
      var email    = $(this).find('input[name="email"]').val().trim();
      var password = $(this).find('input[name="password"]').val().trim();
      if (!email || !password) { showAlert('#formAlert','danger','Please enter email and password.'); return; }
      try {
        var res  = await fetch(API.login, { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ email, password, role:'student' }) });
        var data = await res.json();
        if (data.success) {
          setCurrentUser(data.user);
          showAlert('#formAlert','success','Welcome back, '+data.user.name+'! Redirecting...');
          setTimeout(function(){ window.location.href='dashboard.html'; }, 700);
        } else showAlert('#formAlert','danger', data.message||'Login failed.');
      } catch { showAlert('#formAlert','danger','Cannot connect to server. Make sure backend is running.'); }
    });

    $('#adminLoginForm').on('submit', async function (e) {
      e.preventDefault();
      var email    = $(this).find('input[name="email"]').val().trim();
      var password = $(this).find('input[name="password"]').val().trim();
      if (!email || !password) { showAlert('#formAlert','danger','Please enter email and password.'); return; }
      try {
        var res  = await fetch(API.login, { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ email, password, role:'admin' }) });
        var data = await res.json();
        if (data.success) {
          setCurrentUser(data.user);
          showAlert('#formAlert','success','Admin login successful! Redirecting...');
          setTimeout(function(){ window.location.href='admin.html'; }, 700);
        } else showAlert('#formAlert','danger', data.message||'Admin login failed.');
      } catch { showAlert('#formAlert','danger','Cannot connect to server. Make sure backend is running.'); }
    });

    $('#registerForm').on('submit', async function (e) {
      e.preventDefault();
      var name     = $(this).find('input[name="name"]').val().trim();
      var phone    = $(this).find('input[name="phone"]').val().trim();
      var email    = $(this).find('input[name="email"]').val().trim();
      var password = $(this).find('input[name="password"]').val().trim();
      if (!name||!email||!password) { showAlert('#formAlert','danger','Please fill all required fields.'); return; }
      if (password.length < 6)       { showAlert('#formAlert','danger','Password must be at least 6 characters.'); return; }
      try {
        var res  = await fetch(API.register, { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ name, phone, email, password }) });
        var data = await res.json();
        if (data.success) {
          setCurrentUser(data.user);
          showAlert('#formAlert','success','Account created! Redirecting to dashboard...');
          setTimeout(function(){ window.location.href='dashboard.html'; }, 700);
        } else showAlert('#formAlert','danger', data.message||'Registration failed.');
      } catch { showAlert('#formAlert','danger','Cannot connect to server. Make sure backend is running.'); }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DASHBOARD  (dashboard.html)
  // ══════════════════════════════════════════════════════════════════════════
  if ($('#menuGrid').length) {

    var user = getCurrentUser();
    if (user) $('.welcome-name').text('Welcome back, ' + user.name + ' 👋');

    var _menuCache = [];

    async function loadMenu(category) {
      category = category || 'all';
      try {
        var url  = category === 'all' ? API.menu : API.menu + '?category=' + category;
        var res  = await fetch(url);
        var data = await res.json();
        if (!data.success) throw new Error(data.message);
        _menuCache = data.data;
        renderMenu(data.data);
      } catch (err) { console.error('Menu load error:', err); }
    }

    function renderMenu(items) {
      var query    = ($('#menuSearch').val() || '').toLowerCase();
      var filtered = items.filter(function(item){ return item.name.toLowerCase().includes(query); });

      if (!filtered.length) {
        $('#menuGrid').html('<div class="col-12 text-center text-muted py-4">No items found.</div>');
        return;
      }

      var cart = getCart();
      var html = filtered.map(function(item) {
        var inCart = cart.find(function(i){ return i.name === item.name; });
        var qty    = inCart ? inCart.qty : 0;
        var imgHtml = item.image_url
          ? '<img src="'+item.image_url+'" class="card-img-top" alt="'+item.name+'" onerror="this.style.display=\'none\'" style="height:160px;object-fit:cover">'
          : '';
        var ctrlHtml = qty === 0
          ? '<button class="btn btn-sm btn-warning add-to-cart px-3" data-name="'+item.name+'" data-price="'+item.price+'"><i class="bi bi-cart-plus"></i> Add</button>'
          : '<button class="btn btn-sm btn-outline-secondary qty-dec" style="width:32px;height:32px;padding:0" data-name="'+item.name+'">−</button>' +
            '<span class="fw-bold text-dark" style="min-width:22px;text-align:center">'+qty+'</span>' +
            '<button class="btn btn-sm btn-warning qty-inc" style="width:32px;height:32px;padding:0" data-name="'+item.name+'" data-price="'+item.price+'">+</button>';

        return '<div class="col-sm-6 col-lg-4 items" data-category="'+item.category+'" data-name="'+item.name+'">' +
          '<div class="card cards h-100">' + imgHtml +
          '<div class="card-body d-flex flex-column">' +
          '<h5 class="card-title mb-1">'+item.name+'</h5>' +
          '<p class="text-muted small mb-2">'+(item.description||'')+'</p>' +
          '<div class="mt-auto d-flex justify-content-between align-items-center">' +
          '<span class="fw-semibold text-success fs-6">₹'+parseFloat(item.price).toFixed(0)+'</span>' +
          '<div class="qty-ctrl d-flex align-items-center gap-1">'+ctrlHtml+'</div>' +
          '</div></div></div></div>';
      }).join('');

      $('#menuGrid').html(html);
      bindMenuButtons();
    }

    function bindMenuButtons() {
      $('#menuGrid').off('click','.add-to-cart').on('click','.add-to-cart', function(){
        window.addItemToCart($(this).data('name'), $(this).data('price'));
        loadMenu($('#categoryFilter').val()||'all');
      });
      $('#menuGrid').off('click','.qty-inc').on('click','.qty-inc', function(){
        window.addItemToCart($(this).data('name'), $(this).data('price'));
        loadMenu($('#categoryFilter').val()||'all');
      });
      $('#menuGrid').off('click','.qty-dec').on('click','.qty-dec', function(){
        var name = $(this).data('name');
        var cart = getCart();
        var idx  = cart.findIndex(function(i){ return i.name===name; });
        if (idx===-1) return;
        cart[idx].qty -= 1;
        if (cart[idx].qty <= 0) cart.splice(idx,1);
        setCart(cart);
        updateCartCount();
        loadMenu($('#categoryFilter').val()||'all');
      });
    }

    // Recent orders (also drives track-order widget)
    async function loadRecentOrders() {
      var u = getCurrentUser();
      if (!u) { $('#latestOrderBadge').text('Login to view'); return; }
      try {
        var res  = await fetch(API.ordersByStudent(u.email));
        var data = await res.json();
        if (!data.success || !data.data.length) {
          $('#latestOrderBadge').text('No orders yet');
          $('#recentOrdersList').html('<li class="list-group-item text-muted">No orders placed yet.</li>');
          return;
        }
        var orders = data.data;
        var SC = { pending:'warning', ready:'success' };
        var SL = { pending:'Pending', ready:'Ready for Pickup' };
        var latest = orders[0];

        $('#latestOrderBadge').html('#'+latest.order_code+' &nbsp;<span class="badge text-bg-'+(SC[latest.status]||'secondary')+'">'+(SL[latest.status]||latest.status)+'</span>');

        $('#recentOrdersList').html(orders.slice(0,5).map(function(o){
          return '<li class="list-group-item d-flex justify-content-between align-items-center py-2">' +
            '<div><strong>#'+o.order_code+'</strong>' +
            '<div class="text-muted" style="font-size:.8rem">'+(o.items_summary||'')+'</div></div>' +
            '<span class="badge text-bg-'+(SC[o.status]||'secondary')+'">'+(SL[o.status]||o.status)+'</span></li>';
        }).join(''));

        // Track widget
        $('#trackOrderId').text('#'+latest.order_code);
        if (latest.status === 'ready') {
          $('#tStep-pending').addClass('done').removeClass('active');
          $('#tStep-ready').addClass('done active');
          $('#tLine-1').addClass('done');
          $('#trackStatusMsg').removeClass('alert-warning').addClass('alert-success')
            .html('<i class="bi bi-bag-check-fill me-1"></i><strong>Ready for pickup!</strong> Please collect from the counter.');
        } else {
          $('#tStep-pending').addClass('active').removeClass('done');
          $('#tStep-ready').removeClass('active done');
          $('#tLine-1').removeClass('done');
          $('#trackStatusMsg').removeClass('alert-success').addClass('alert-warning')
            .html('<i class="bi bi-hourglass-split me-1"></i>Preparing your order...');
        }
      } catch (err) { console.log('Could not load recent orders:', err.message); $('#latestOrderBadge').text('Unavailable'); }
    }

    $('#menuSearch, #categoryFilter').on('input change', function(){
      loadMenu($('#categoryFilter').val()||'all');
    });

    loadMenu();
    loadRecentOrders();
    setInterval(loadRecentOrders, 5000);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CART  (cart.html)
  // ══════════════════════════════════════════════════════════════════════════
  if ($('#cartTable').length) {
    function renderCart() {
      var $tbody = $('#cartTable tbody');
      var cart   = getCart();
      $tbody.empty();
      if (!cart.length) {
        $tbody.append('<tr><td colspan="5" class="text-center text-muted py-4">Your cart is empty. <a href="dashboard.html">Browse menu</a></td></tr>');
        $('#cartTotal').text('0');
        return;
      }
      var total = 0;
      cart.forEach(function(item, index) {
        var sub = item.price * item.qty;
        total += sub;
        $tbody.append('<tr><td>'+item.name+'</td><td>₹'+item.price+'</td>' +
          '<td><input type="number" class="form-control form-control-sm cart-qty" data-index="'+index+'" min="1" value="'+item.qty+'" style="max-width:90px"></td>' +
          '<td class="item-subtotal">₹'+sub+'</td>' +
          '<td><button class="btn btn-sm btn-outline-danger remove-item" data-index="'+index+'">Remove</button></td></tr>');
      });
      $('#cartTotal').text(total.toFixed(2));
    }
    renderCart();
    updateCartCount();

    $(document).on('click','.remove-item', function(){
      var idx = Number($(this).data('index'));
      var cart = getCart(); cart.splice(idx,1); setCart(cart);
      renderCart(); updateCartCount();
    });
    $('#updateCartBtn').on('click', function(){
      var cart = getCart();
      $('.cart-qty').each(function(){ var i=Number($(this).data('index')); if(cart[i]) cart[i].qty=Math.max(1,Number($(this).val())); });
      setCart(cart); renderCart();
      showAlert('#cartAlert','success','Cart updated successfully.');
      updateCartCount();
    });
    $('#placeOrderBtn').on('click', function(){
      var cart = getCart();
      if (!cart.length) { showAlert('#cartAlert','danger','Your cart is empty.'); return; }
      var m = new bootstrap.Modal('#loadingModal'); m.show();
      setTimeout(function(){ m.hide(); window.location.href='payment.html'; }, 1400);
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAYMENT  (payment.html)
  // ══════════════════════════════════════════════════════════════════════════
  if ($('.payments').length) {
    var selectedMethod = null;
    $('.payments').on('click', function(){
      $('.payments').removeClass('selected'); $(this).addClass('selected');
      selectedMethod = $(this).data('method');
      $('#continuePayment').prop('disabled', false);
    });

    $('#continuePayment').on('click', async function(){
      var cart = getCart();
      if (!cart.length) { alert('Your cart is empty!'); window.location.href='dashboard.html'; return; }
      var user   = getCurrentUser();
      var sName  = user ? user.name  : 'Guest';
      var sEmail = user ? user.email : 'guest@easymeal.com';
      try {
        $(this).prop('disabled',true).text('Processing...');
        var res  = await fetch(API.orders, { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ student_name:sName, student_email:sEmail, items:cart, payment_method:selectedMethod||'cod' }) });
        var data = await res.json();
        if (data.success) {
          sessionStorage.setItem('lastOrder', JSON.stringify(data.data));
          clearCart(); window.location.href='confirmation.html';
        } else {
          alert('Order failed: '+data.message);
          $(this).prop('disabled',false).text('Continue');
        }
      } catch {
        sessionStorage.setItem('lastOrder', JSON.stringify({ order_code:'EM'+Date.now().toString().slice(-6), total_amount:cart.reduce(function(s,i){ return s+i.price*i.qty; },0), status:'pending' }));
        clearCart(); window.location.href='confirmation.html';
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONFIRMATION  (confirmation.html)
  // ══════════════════════════════════════════════════════════════════════════
  if ($('#step-pending').length) {
    var confirmOrderId = null, pollTimer = null;
    try {
      var lastOrder = JSON.parse(sessionStorage.getItem('lastOrder')||'null');
      if (lastOrder) {
        confirmOrderId = lastOrder.id || null;
        $('#confirmOrderId').text('#'+lastOrder.order_code);
        $('#confirmTotal').text('₹'+parseFloat(lastOrder.total_amount||0).toFixed(0));
        applyStatus(lastOrder.status||'pending');
      }
    } catch {}

    function applyStatus(status) {
      if (status==='ready') {
        $('#step-pending').addClass('done').removeClass('active');
        $('#step-ready').addClass('active done'); $('#line-1').addClass('done');
        $('#statusMessage').removeClass('alert-warning').addClass('alert-success')
          .html('<i class="bi bi-bag-check-fill me-1"></i> <strong>Your order is ready for pickup!</strong> Please collect it from the counter.');
      } else {
        $('#step-pending').addClass('active').removeClass('done');
        $('#step-ready').removeClass('active done'); $('#line-1').removeClass('done');
        $('#statusMessage').removeClass('alert-success').addClass('alert-warning')
          .html('<i class="bi bi-hourglass-split me-1"></i> Your order is being prepared...');
      }
    }

    if (confirmOrderId) {
      pollTimer = setInterval(async function(){
        try {
          var res  = await fetch(API.orderById(confirmOrderId));
          var data = await res.json();
          if (data.success && data.data) { applyStatus(data.data.status); if (data.data.status==='ready') clearInterval(pollTimer); }
        } catch {}
      }, 8000);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN DASHBOARD  (admin.html)
  // ══════════════════════════════════════════════════════════════════════════
  if ($('#panelOrders').length) {

    var adminCache = [];

    async function loadAdminStats() {
      try {
        var res  = await fetch(API.adminStats);
        var data = await res.json();
        if (data.success) {
          var s = data.data;
          $('#statTotal'  ).text(s.total_orders);
          $('#statPending').text(s.pending_orders);
          $('#statReady'  ).text(s.ready_orders || adminCache.filter(function(o){ return o.status==='ready'; }).length);
          $('#statRevenue').text('₹'+parseFloat(s.total_revenue).toFixed(0));
        }
      } catch {}
    }

    // Menu management
    window.loadAdminMenu = async function() {
      try {
        var res  = await fetch(API.menuAll);
        var data = await res.json();
        if (!data.success) return;
        var html = data.data.map(function(item){
          return '<tr id="menu-row-'+item.id+'">' +
            '<td><strong>'+item.name+'</strong></td>' +
            '<td>'+item.category.charAt(0).toUpperCase()+item.category.slice(1)+'</td>' +
            '<td>₹'+parseFloat(item.price).toFixed(0)+'</td>' +
            '<td><span class="badge '+(item.is_available?'text-bg-success':'text-bg-secondary')+'">'+(item.is_available?'Available':'Unavailable')+'</span></td>' +
            '<td>' +
            '<button class="btn btn-sm btn-outline-warning me-1 edit-menu-item" data-id="'+item.id+'" data-name="'+item.name+'" data-category="'+item.category+'" data-price="'+item.price+'" data-desc="'+(item.description||'')+'"><i class="bi bi-pencil"></i> Edit</button>' +
            '<button class="btn btn-sm btn-outline-primary me-1 toggle-item" data-id="'+item.id+'" data-available="'+item.is_available+'">'+(item.is_available?'Disable':'Enable')+'</button>' +
            '<button class="btn btn-sm btn-outline-danger delete-menu-item" data-id="'+item.id+'">Delete</button>' +
            '</td></tr>';
        }).join('');
        $('#adminMenuTableBody').html(html);
        bindMenuActions();
      } catch {}
    };

    function bindMenuActions() {
      $('.toggle-item').off('click').on('click', async function(){
        var id = $(this).data('id'), cur = parseInt($(this).data('available')), nxt = cur?0:1;
        try {
          var mr = await fetch(API.menuAll); var md = await mr.json();
          var item = md.data.find(function(i){ return i.id===id; });
          if (!item) return;
          await fetch(API.menuItem(id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...item,is_available:nxt})});
          window.loadAdminMenu();
        } catch { alert('Failed to update item.'); }
      });
      $('.delete-menu-item').off('click').on('click', async function(){
        var id=$(this).data('id');
        if(!confirm('Delete this menu item?')) return;
        try { await fetch(API.menuItem(id),{method:'DELETE'}); $('#menu-row-'+id).remove(); }
        catch { alert('Failed to delete item.'); }
      });
      $('.edit-menu-item').off('click').on('click', function(){
        var b=$(this);
        $('#editItemId').val(b.data('id')); $('#editItemName').val(b.data('name'));
        $('#editItemCategory').val(b.data('category')); $('#editItemPrice').val(b.data('price'));
        $('#editItemDesc').val(b.data('desc'));
        new bootstrap.Modal(document.getElementById('editMenuModal')).show();
      });
    }

    $('#saveEditItemBtn').on('click', async function(){
      var id=$.trim($('#editItemId').val()), name=$.trim($('#editItemName').val()),
          cat=$('#editItemCategory').val(), price=$('#editItemPrice').val(), desc=$.trim($('#editItemDesc').val());
      if(!name||!price){ alert('Name and price required.'); return; }
      try {
        var res=await fetch(API.menuItem(id),{method:'PUT',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({name,category:cat,price:parseFloat(price),description:desc,is_available:1})});
        var d=await res.json();
        if(d.success){ bootstrap.Modal.getInstance(document.getElementById('editMenuModal')).hide(); window.loadAdminMenu(); }
        else alert('Failed: '+(d.message||''));
      } catch { alert('Cannot connect to server.'); }
    });

    $('#saveMenuItemBtn').on('click', async function(){
      var name=$.trim($('#newItemName').val()), cat=$('#newItemCategory').val(),
          price=$('#newItemPrice').val(), desc=$.trim($('#newItemDesc').val());
      if(!name||!price){ alert('Name and price required.'); return; }
      try {
        var res=await fetch(API.menu,{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({name,category:cat,price:parseFloat(price),description:desc})});
        var d=await res.json();
        if(d.success){
          bootstrap.Modal.getInstance(document.getElementById('menuModal')).hide();
          $('#newItemName,#newItemPrice,#newItemDesc').val('');
          window.loadAdminMenu(); loadAdminStats();
        } else alert('Failed: '+d.message);
      } catch { alert('Cannot connect to server.'); }
    });

    // Order board
    function renderOrderBoard(orders) {
      adminCache = orders;
      var q = ($('#adminOrderSearch').val()||'').toLowerCase();
      var pending = orders.filter(function(o){ return o.status==='pending' && (!q||o.order_code.toLowerCase().includes(q)||o.student_name.toLowerCase().includes(q)); });
      var ready   = orders.filter(function(o){ return o.status==='ready'   && (!q||o.order_code.toLowerCase().includes(q)||o.student_name.toLowerCase().includes(q)); });

      $('#pendingCount').text(pending.length);
      $('#readyCount'  ).text(ready.length);
      $('#statPending' ).text(pending.length);
      $('#statReady'   ).text(ready.length);

      if (!pending.length) {
        $('#pendingOrders').html('<div class="no-orders-msg"><i class="bi bi-check2-all d-block fs-2 mb-1"></i>No pending orders</div>');
      } else {
        $('#pendingOrders').html(pending.map(function(o){
          return '<div class="order-item" id="order-card-'+o.id+'">' +
            '<div class="order-info"><strong>#'+o.order_code+'</strong>' +
            '<div class="order-meta"><i class="bi bi-person me-1"></i>'+o.student_name+'</div>' +
            '<div class="order-meta"><i class="bi bi-basket me-1"></i>'+(o.items_summary||'-')+'</div></div>' +
            '<button class="btn btn-success mark-ready-btn" data-id="'+o.id+'"><i class="bi bi-check-lg me-1"></i>Mark Ready</button></div>';
        }).join(''));
      }

      if (!ready.length) {
        $('#readyOrders').html('<div class="no-orders-msg"><i class="bi bi-box-seam d-block fs-2 mb-1"></i>No ready orders</div>');
      } else {
        $('#readyOrders').html(ready.map(function(o){
          return '<div class="order-item" id="order-card-'+o.id+'">' +
            '<div class="order-info"><strong>#'+o.order_code+'</strong>' +
            '<div class="order-meta"><i class="bi bi-person me-1"></i>'+o.student_name+'</div>' +
            '<div class="order-meta"><i class="bi bi-basket me-1"></i>'+(o.items_summary||'-')+'</div></div>' +
            '<button class="btn btn-sm btn-outline-secondary mark-done-btn" data-id="'+o.id+'"><i class="bi bi-arrow-counterclockwise me-1"></i>Undo</button></div>';
        }).join(''));
      }

      var now = new Date();
      $('#lastRefreshedTime').text('Updated '+now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}));
      bindOrderActions();
    }

    function bindOrderActions() {
      $('.mark-ready-btn').off('click').on('click', async function(){
        var id=$(this).data('id'), btn=$(this);
        btn.prop('disabled',true).html('<span class="spinner-border spinner-border-sm"></span>');
        try {
          var r=await fetch(API.updateOrderStatus(id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'ready'})});
          var d=await r.json();
          if(d.success){ loadAdminOrders(); loadAdminStats(); }
          else btn.prop('disabled',false).html('<i class="bi bi-check-lg me-1"></i>Mark Ready');
        } catch { btn.prop('disabled',false).html('<i class="bi bi-check-lg me-1"></i>Mark Ready'); }
      });
      $('.mark-done-btn').off('click').on('click', async function(){
        var id=$(this).data('id'), btn=$(this);
        btn.prop('disabled',true);
        try {
          var r=await fetch(API.updateOrderStatus(id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'pending'})});
          var d=await r.json();
          if(d.success){ loadAdminOrders(); loadAdminStats(); }
          else btn.prop('disabled',false);
        } catch { btn.prop('disabled',false); }
      });
    }

    async function loadAdminOrders() {
      try {
        var res=await fetch(API.orders), data=await res.json();
        if(data.success) renderOrderBoard(data.data);
      } catch {}
    }

    $('#adminOrderSearch').on('input', function(){ renderOrderBoard(adminCache); });
    $('#refreshOrdersBtn').on('click', function(){
      $(this).find('i').addClass('spin-once');
      setTimeout(function(){ $('.spin-once').removeClass('spin-once'); }, 600);
      loadAdminOrders(); loadAdminStats();
    });

    // ── Guest Order panel ────────────────────────────────────────────────────
    var guestCart={}, guestMenuCache=[];

    window.loadGuestMenu = async function(category) {
      category = category||'all';
      try {
        var url  = category==='all' ? API.menu : API.menu+'?category='+category;
        var res  = await fetch(url); var data=await res.json();
        if(!data.success) return;
        guestMenuCache=data.data; renderGuestGrid(data.data);
      } catch { $('#guestMenuGrid').html('<div class="col-12 text-center text-muted py-4">Failed to load menu.</div>'); }
    };

    function renderGuestGrid(items) {
      var q = ($('#guestSearch').val()||'').toLowerCase();
      var f = items.filter(function(i){ return i.name.toLowerCase().includes(q); });
      if(!f.length){ $('#guestMenuGrid').html('<div class="col-12 text-center text-muted py-3">No items found.</div>'); return; }
      $('#guestMenuGrid').html(f.map(function(item){
        var qty=guestCart[item.name]?guestCart[item.name].qty:0;
        var imgHtml=item.image_url
          ?'<img src="'+item.image_url+'" class="guest-item-img" alt="'+item.name+'" onerror="this.outerHTML=\'<div class=\\\'guest-item-img-placeholder\\\'><i class=\\\'bi bi-egg-fried\\\'></i></div>\'">'
          :'<div class="guest-item-img-placeholder"><i class="bi bi-egg-fried"></i></div>';
        return '<div class="col-6 col-md-4 col-xl-3">' +
          '<div class="guest-item-card'+(qty?' has-qty':'')+'" data-name="'+item.name+'" data-price="'+item.price+'">' +
          '<div class="guest-card-img-wrap">'+imgHtml+'</div>' +
          '<div class="p-2 text-center">' +
          '<div class="guest-item-name">'+item.name+'</div>' +
          '<div class="guest-item-price">₹'+parseFloat(item.price).toFixed(0)+'</div>' +
          '<div class="guest-qty-row">' +
          (qty?'<button class="guest-qty-btn guest-qty-dec" data-name="'+item.name+'">−</button><span class="guest-qty-val">'+qty+'</span>':'') +
          '<button class="guest-qty-btn guest-qty-inc" data-name="'+item.name+'" data-price="'+item.price+'">+</button>' +
          '</div></div></div></div>';
      }).join(''));
      bindGuestActions();
    }

    function bindGuestActions(){
      $('#guestMenuGrid').off('click','.guest-card-img-wrap').on('click','.guest-card-img-wrap',function(){
        var c=$(this).closest('.guest-item-card'); gAdd(c.data('name'),Number(c.data('price')));
      });
      $('#guestMenuGrid').off('click','.guest-qty-inc').on('click','.guest-qty-inc',function(e){
        e.stopPropagation(); gAdd($(this).data('name'),Number($(this).data('price')));
      });
      $('#guestMenuGrid').off('click','.guest-qty-dec').on('click','.guest-qty-dec',function(e){
        e.stopPropagation();
        var name=$(this).data('name');
        if(!guestCart[name]) return;
        guestCart[name].qty-=1;
        if(guestCart[name].qty<=0) delete guestCart[name];
        renderGuestGrid(guestMenuCache); updateGuestSummary();
      });
    }
    function gAdd(name,price){
      if(!guestCart[name]) guestCart[name]={name,price,qty:0};
      guestCart[name].qty+=1;
      renderGuestGrid(guestMenuCache); updateGuestSummary();
    }
    function updateGuestSummary(){
      var items=Object.values(guestCart);
      if(!items.length){
        $('#guestCartList').html('<li class="list-group-item text-muted text-center py-4"><i class="bi bi-cart d-block fs-2 mb-1 text-muted"></i>Click items or tap + to add</li>');
        $('#guestTotal').text('₹0'); $('#placeGuestOrderBtn').prop('disabled',true); return;
      }
      $('#guestCartList').html(items.map(function(i){
        return '<li class="list-group-item d-flex justify-content-between align-items-center py-2">' +
          '<div><strong>'+i.name+'</strong><div class="text-muted" style="font-size:.78rem">₹'+i.price.toFixed(0)+' × '+i.qty+'</div></div>' +
          '<span class="fw-bold">₹'+(i.price*i.qty).toFixed(0)+'</span></li>';
      }).join(''));
      var total=items.reduce(function(s,i){ return s+i.price*i.qty; },0);
      $('#guestTotal').text('₹'+total.toFixed(0));
      $('#placeGuestOrderBtn').prop('disabled',false);
    }

    $('#placeGuestOrderBtn').on('click', async function(){
      var items=Object.values(guestCart); if(!items.length) return;
      var name=($('#guestName').val().trim())||'Guest';
      var btn=$(this); btn.prop('disabled',true).html('<span class="spinner-border spinner-border-sm me-2"></span>Placing...');
      try {
        var res=await fetch(API.orders,{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({student_name:name,student_email:'guest@easymeal.com',
            items:items.map(function(i){return{name:i.name,price:i.price,qty:i.qty};}),payment_method:'cod'})});
        var d=await res.json(); if(!d.success) throw new Error(d.message);
        await fetch(API.updateOrderStatus(d.data.order_id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'ready'})});
        guestCart={}; $('#guestName').val('');
        renderGuestGrid(guestMenuCache); updateGuestSummary(); loadAdminStats();
        btn.prop('disabled',false).html('<i class="bi bi-check2-circle me-2"></i>Place & Mark Ready');
        var $t=$('<div class="position-fixed top-0 start-50 translate-middle-x mt-3 z-3">' +
          '<div class="alert alert-success shadow fw-semibold px-4 py-2">' +
          '<i class="bi bi-check-circle me-2"></i>Order #'+d.data.order_code+' placed & ready!</div></div>').appendTo('body');
        setTimeout(function(){ $t.remove(); }, 3000);
      } catch(err){
        alert('Failed to place order: '+err.message);
        btn.prop('disabled',false).html('<i class="bi bi-check2-circle me-2"></i>Place & Mark Ready');
      }
    });

    $('#guestCatFilter').on('change', function(){ window.loadGuestMenu($(this).val()); });
    $('#guestSearch').on('input', function(){ renderGuestGrid(guestMenuCache); });

    // ── History panel bindings ───────────────────────────────────────────────
    $('#histFilterBtn').on('click', window.loadOrderHistory);
    $('#histClearBtn').on('click', function(){
      $('#histFrom,#histTo,#histStudent').val('');
      $('#histCount,#histRevenue').text('—');
      $('#histTableBody').html(
        '<tr><td colspan="7" class="text-center py-5 text-muted">' +
        '<i class="bi bi-calendar-range d-block fs-1 mb-2 opacity-25"></i>' +
        'Select a date range and click <strong>Filter</strong></td></tr>');
    });
    $('#histStudent').on('keydown', function(e){ if(e.key==='Enter') window.loadOrderHistory(); });

    // ── Analytics panel period buttons ────────────────────────────────────────
    $('.an-period').on('click', function(){
      $('.an-period').removeClass('btn-info active').addClass('btn-outline-info');
      $(this).removeClass('btn-outline-info').addClass('btn-info active');
      window.loadAnalytics(parseInt($(this).data('days')));
    });
    $('#anRefreshBtn').on('click', function(){ window.loadAnalytics(); });

    // ── Init ─────────────────────────────────────────────────────────────────
    loadAdminStats();
    loadAdminOrders();
    setInterval(function(){ loadAdminOrders(); loadAdminStats(); }, 3000);
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  $('#logoutBtn').on('click', function(e){
    e.preventDefault(); clearCurrentUser(); clearCart(); window.location.href='login.html';
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PERSONAL SECTION  (dashboard.html) — Offers / Reorder / For You
  // ══════════════════════════════════════════════════════════════════════════
  if ($('#personalSection').length) {

    var OFFERS = [
      { title:'Combo Deal',       desc:'Any Meal + Any Drink',         saving:'₹20 OFF',        bg:'linear-gradient(135deg,#667eea,#764ba2)', icon:'bi-bag-heart-fill',       code:'COMBO20'   },
      { title:'Snack Attack',     desc:'Buy 2 snacks, pay for 1',      saving:'Save up to ₹80', bg:'linear-gradient(135deg,#f7971e,#ffd200)', icon:'bi-lightning-charge-fill', code:'SNACK2X'   },
      { title:'First Drink Free', desc:'Order a meal & get drink ₹10', saving:'₹45 saved',      bg:'linear-gradient(135deg,#11998e,#38ef7d)', icon:'bi-cup-straw',             code:'DRINK10'   },
      { title:'Happy Hours',      desc:'All drinks 20% off 2–4 PM',    saving:'20% OFF',        bg:'linear-gradient(135deg,#ee0979,#ff6a00)', icon:'bi-clock-fill',            code:'HAPPY20'   },
      { title:'Welcome Bonus',    desc:'Flat ₹50 off on any order',    saving:'₹50 OFF',        bg:'linear-gradient(135deg,#43e97b,#38f9d7)', icon:'bi-gift-fill',             code:'WELCOME50' },
      { title:'Everyday Deal',    desc:'10% off entire order',         saving:'10% OFF',        bg:'linear-gradient(135deg,#4facfe,#00f2fe)', icon:'bi-percent',               code:'FRESH10'   },
    ];

    $('#offersGrid').html(OFFERS.map(function(o){
      return '<div class="col-sm-6 col-lg-4">' +
        '<div class="offer-card" style="background:'+o.bg+'">' +
        '<div style="font-size:.74rem;background:rgba(255,255,255,.22);border-radius:20px;padding:2px 10px;display:inline-block;margin-bottom:6px">'+o.saving+'</div>' +
        '<div class="fw-bold mb-1" style="font-size:.95rem">'+o.title+'</div>' +
        '<div style="font-size:.8rem;opacity:.9">'+o.desc+'</div>' +
        '<div class="offer-code">Code: '+o.code+'</div>' +
        '<i class="bi '+o.icon+' offer-icon"></i></div></div>';
    }).join(''));
    $('#personalSection').show();

    // Tab switching
    $('#personalTabs .nav-link').on('click', function(){
      $('#personalTabs .nav-link').removeClass('active'); $(this).addClass('active');
      var tab=$(this).data('ptab');
      $('#ptab-offers,#ptab-reorder,#ptab-foryou').hide();
      $('#ptab-'+tab).show();
    });

    var user = getCurrentUser();
    if (!user) return; // offers shown for all; reorder/foryou needs login

    async function loadPersonalData() {
      try {
        // Use the query-param URL that matches the new server route
        var res  = await fetch(API.studentOrderItems(user.email));
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var data = await res.json();

        // ── REORDER ──────────────────────────────────────────────────────────
        if (!data.success || !data.data || !data.data.length) {
          $('#reorderList').html(
            '<div class="text-muted text-center py-4 px-3">' +
            '<i class="bi bi-arrow-repeat d-block fs-2 mb-2 opacity-25"></i>' +
            'No past orders yet. Your quick-reorder shortcuts will appear here.</div>');
        } else {
          var items = data.data;

          // Render reorder rows
          $('#reorderList').html(items.slice(0,8).map(function(item){
            return '<div class="reorder-row">' +
              '<div><div class="rr-name">'+item.item_name+'</div>' +
              '<div class="rr-meta"><i class="bi bi-arrow-repeat me-1"></i>Ordered '+item.times_ordered+'x' +
              ' &nbsp;·&nbsp; ₹'+parseFloat(item.price||0).toFixed(0) +
              '<span class="badge text-bg-light text-secondary ms-1" style="font-size:.68rem">'+(item.category||'')+'</span></div></div>' +
              '<button class="btn btn-sm btn-warning fw-semibold reorder-btn" data-name="'+item.item_name+'" data-price="'+(item.price||0)+'">' +
              '<i class="bi bi-cart-plus me-1"></i>Reorder</button></div>';
          }).join(''));

          // Delegated click — uses global window.addItemToCart (always available)
          $('#reorderList').off('click','.reorder-btn').on('click','.reorder-btn', function(){
            var name=$(this).data('name'), price=Number($(this).data('price'));
            window.addItemToCart(name, price);
            var $b=$(this);
            $b.html('<i class="bi bi-check2 me-1"></i>Added!').addClass('btn-success').removeClass('btn-warning');
            setTimeout(function(){ $b.html('<i class="bi bi-cart-plus me-1"></i>Reorder').removeClass('btn-success').addClass('btn-warning'); }, 1500);
          });

          // ── FOR YOU ────────────────────────────────────────────────────────
          try {
            var mRes  = await fetch(API.menu);
            var mData = await mRes.json();
            if (!mData.success) throw new Error('menu failed');

            var allItems   = mData.data;
            var orderedSet = new Set(items.map(function(i){ return i.item_name; }));

            // Score categories by frequency
            var catScore = {};
            items.forEach(function(i){ catScore[i.category]=(catScore[i.category]||0)+parseInt(i.times_ordered||1); });
            var topCat = Object.entries(catScore).sort(function(a,b){return b[1]-a[1];}).map(function(e){return e[0];});

            var unseen = allItems.filter(function(i){ return !orderedSet.has(i.name); });
            unseen.sort(function(a,b){
              var sa=topCat.indexOf(a.category); if(sa===-1) sa=99;
              var sb=topCat.indexOf(b.category); if(sb===-1) sb=99;
              return sa-sb;
            });
            var recs = unseen.slice(0,6);

            if (!recs.length) {
              $('#forYouGrid').html('<div class="col-12 text-muted text-center py-4">You have tried everything on the menu! Great explorer.</div>');
            } else {
              $('#forYouGrid').html(recs.map(function(item){
                return '<div class="col-sm-6 col-lg-4">' +
                  '<div class="foryou-card">' +
                  (item.image_url?'<img src="'+item.image_url+'" alt="'+item.name+'" onerror="this.style.display=\'none\'">':'') +
                  '<div class="fc-body">' +
                  '<div class="fc-name">'+item.name+'</div>' +
                  '<div class="d-flex justify-content-between align-items-center">' +
                  '<span class="text-success fw-semibold">₹'+parseFloat(item.price).toFixed(0)+'</span>' +
                  '<button class="btn btn-warning btn-sm foryou-add-btn" style="font-size:.75rem;padding:3px 10px" data-name="'+item.name+'" data-price="'+item.price+'">' +
                  '<i class="bi bi-cart-plus"></i> Try it</button>' +
                  '</div></div></div></div>';
              }).join(''));

              // Delegated click — also uses global window.addItemToCart
              $('#forYouGrid').off('click','.foryou-add-btn').on('click','.foryou-add-btn', function(){
                var name=$(this).data('name'), price=Number($(this).data('price'));
                window.addItemToCart(name, price);
                var $b=$(this);
                $b.html('<i class="bi bi-check2"></i> Added!').addClass('btn-success').removeClass('btn-warning').prop('disabled',true);
                setTimeout(function(){ $b.html('<i class="bi bi-cart-plus"></i> Try it').removeClass('btn-success').addClass('btn-warning').prop('disabled',false); }, 1500);
              });
            }
          } catch(e2) {
            $('#forYouGrid').html('<div class="col-12 text-muted text-center py-3">Could not load recommendations.</div>');
          }
        }
      } catch(e) {
        console.error('Personal data error:', e);
        $('#reorderList').html('<div class="text-muted text-center py-3">Could not load past orders. Make sure the backend is running.</div>');
      }
    }

    loadPersonalData();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COUPON SYSTEM  (cart.html)
  // ══════════════════════════════════════════════════════════════════════════
  if ($('#couponInput').length) {
    var COUPONS = {
      'WELCOME50':{ type:'flat',    value:50, label:'WELCOME50 — ₹50 flat off' },
      'COMBO20':  { type:'flat',    value:20, label:'COMBO20 — ₹20 flat off'   },
      'HAPPY20':  { type:'percent', value:20, label:'HAPPY20 — 20% off'         },
      'FRESH10':  { type:'percent', value:10, label:'FRESH10 — 10% off'         },
      'SNACK2X':  { type:'percent', value:15, label:'SNACK2X — 15% off'         },
      'DRINK10':  { type:'flat',    value:10, label:'DRINK10 — ₹10 flat off'    },
    };
    var activeCoupon=null;

    function getCartTotal(){ return parseFloat($('#cartTotal').text())||0; }
    function refreshCouponUI(){
      if(!activeCoupon){ $('#couponBreakdown').hide(); return; }
      var sub=getCartTotal();
      var disc=activeCoupon.type==='flat'?Math.min(activeCoupon.value,sub):parseFloat((sub*activeCoupon.value/100).toFixed(2));
      var pay=Math.max(0,sub-disc);
      $('#couponSubtotal').text(sub.toFixed(2));
      $('#couponLabel').text(activeCoupon.label);
      $('#couponDiscount').text(disc.toFixed(2));
      $('#couponPayable').text(pay.toFixed(2));
      $('#couponBreakdown').show();
      sessionStorage.setItem('activeCoupon',JSON.stringify({code:activeCoupon.code,label:activeCoupon.label,discount:disc,payable:pay}));
    }
    function showCouponMsg(msg,type){
      $('#couponMsg').text(msg).css('color',type==='success'?'#198754':'#dc3545').show();
      if(type!=='success') setTimeout(function(){ $('#couponMsg').hide(); },3000);
    }
    $('#applyCouponBtn').on('click',function(){
      var code=$('#couponInput').val().trim().toUpperCase();
      if(!code){ showCouponMsg('Please enter a coupon code.','danger'); return; }
      var c=COUPONS[code];
      if(!c){ showCouponMsg('Invalid code. Try: WELCOME50, COMBO20, HAPPY20, FRESH10, SNACK2X, DRINK10','danger'); return; }
      if(!getCartTotal()){ showCouponMsg('Add items to cart first.','danger'); return; }
      activeCoupon=Object.assign({},c,{code});
      showCouponMsg('Coupon applied: '+c.label,'success');
      $('#couponInput').prop('disabled',true); $('#removeCouponBtn').show(); refreshCouponUI();
    });
    $('#removeCouponBtn').on('click',function(){
      activeCoupon=null; sessionStorage.removeItem('activeCoupon');
      $('#couponInput').val('').prop('disabled',false);
      $('#couponMsg').hide(); $('#couponBreakdown').hide(); $('#removeCouponBtn').hide();
    });
    $('#couponInput').on('keydown',function(e){ if(e.key==='Enter') $('#applyCouponBtn').trigger('click'); });
    $('#updateCartBtn').on('click',function(){ setTimeout(refreshCouponUI,150); });
  }

}); // end DOMReady
