// Auth State Management
(function () {
  'use strict';

  function updateHeaderUI(session) {
    var loginBtn = document.getElementById('auth-login-btn');
    var registerBtn = document.getElementById('auth-register-btn');
    var userInfo = document.getElementById('auth-user-info');
    var userEmail = document.getElementById('auth-user-email');

    if (!loginBtn || !registerBtn || !userInfo) return;

    if (session && session.user) {
      loginBtn.style.display = 'none';
      registerBtn.style.display = 'none';
      userInfo.style.display = 'flex';
      userEmail.textContent = session.user.email;
    } else {
      loginBtn.style.display = '';
      registerBtn.style.display = '';
      userInfo.style.display = 'none';
      userEmail.textContent = '';
    }
  }

  function handleLogout() {
    if (!window.supabaseClient) return;
    window.supabaseClient.auth.signOut().then(function () {
      updateHeaderUI(null);
    });
  }

  function initAuthState() {
    if (!window.supabaseClient) return;

    window.supabaseClient.auth.getSession().then(function (result) {
      updateHeaderUI(result.data.session);
    });

    window.supabaseClient.auth.onAuthStateChange(function (_event, session) {
      updateHeaderUI(session);
    });

    var logoutBtn = document.getElementById('auth-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        handleLogout();
      });
    }
  }

  window.initAuthState = initAuthState;
  window.updateHeaderUI = updateHeaderUI;

  document.addEventListener('DOMContentLoaded', initAuthState);
})();
