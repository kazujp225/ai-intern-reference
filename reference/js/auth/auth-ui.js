// Auth Modal UI
(function () {
  'use strict';

  function openAuthModal(tab) {
    var overlay = document.getElementById('auth-modal-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    switchAuthTab(tab || 'login');
    clearAuthMessages();
  }

  function closeAuthModal() {
    var overlay = document.getElementById('auth-modal-overlay');
    if (!overlay) return;
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    clearAuthMessages();
  }

  function switchAuthTab(tab) {
    var loginTab = document.getElementById('auth-tab-login');
    var registerTab = document.getElementById('auth-tab-register');
    var loginForm = document.getElementById('auth-form-login');
    var registerForm = document.getElementById('auth-form-register');

    if (!loginTab || !registerTab || !loginForm || !registerForm) return;

    if (tab === 'login') {
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
    } else {
      loginTab.classList.remove('active');
      registerTab.classList.add('active');
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
    }
  }

  function showError(msg) {
    var el = document.getElementById('auth-error');
    if (el) {
      el.textContent = msg;
      el.style.display = 'block';
    }
  }

  function showSuccess(msg) {
    var el = document.getElementById('auth-success');
    if (el) {
      el.textContent = msg;
      el.style.display = 'block';
    }
  }

  function clearAuthMessages() {
    var err = document.getElementById('auth-error');
    var suc = document.getElementById('auth-success');
    if (err) { err.textContent = ''; err.style.display = 'none'; }
    if (suc) { suc.textContent = ''; suc.style.display = 'none'; }
  }

  function setLoading(form, loading) {
    var btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? '...' : btn.getAttribute('data-label');
  }

  function handleLogin(e) {
    e.preventDefault();
    clearAuthMessages();

    var form = e.target;
    var email = form.querySelector('[name="email"]').value.trim();
    var password = form.querySelector('[name="password"]').value;

    if (!email || !password) {
      showError('メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(form, true);

    window.supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    }).then(function (result) {
      setLoading(form, false);
      if (result.error) {
        showError('ログインに失敗しました: ' + result.error.message);
        return;
      }
      closeAuthModal();
      form.reset();
    }).catch(function () {
      setLoading(form, false);
      showError('通信エラーが発生しました');
    });
  }

  function handleRegister(e) {
    e.preventDefault();
    clearAuthMessages();

    var form = e.target;
    var email = form.querySelector('[name="email"]').value.trim();
    var password = form.querySelector('[name="password"]').value;
    var passwordConfirm = form.querySelector('[name="password_confirm"]').value;

    if (!email || !password || !passwordConfirm) {
      showError('全ての項目を入力してください');
      return;
    }

    if (password.length < 6) {
      showError('パスワードは6文字以上で入力してください');
      return;
    }

    if (password !== passwordConfirm) {
      showError('パスワードが一致しません');
      return;
    }

    setLoading(form, true);

    window.supabaseClient.auth.signUp({
      email: email,
      password: password
    }).then(function (result) {
      setLoading(form, false);
      if (result.error) {
        showError('登録に失敗しました: ' + result.error.message);
        return;
      }
      if (result.data.user && !result.data.session) {
        showSuccess('確認メールを送信しました。メールのリンクをクリックして登録を完了してください。');
      } else {
        closeAuthModal();
      }
      form.reset();
    }).catch(function () {
      setLoading(form, false);
      showError('通信エラーが発生しました');
    });
  }

  function handlePasswordReset() {
    clearAuthMessages();
    var emailInput = document.querySelector('#auth-form-login [name="email"]');
    var email = emailInput ? emailInput.value.trim() : '';

    if (!email) {
      showError('パスワードリセット用のメールアドレスを入力してください');
      return;
    }

    window.supabaseClient.auth.resetPasswordForEmail(email).then(function (result) {
      if (result.error) {
        showError('エラー: ' + result.error.message);
        return;
      }
      showSuccess('パスワードリセット用メールを送信しました');
    });
  }

  // Event bindings on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    var overlay = document.getElementById('auth-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeAuthModal();
      });
    }

    var closeBtn = document.getElementById('auth-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeAuthModal);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAuthModal();
    });

    var loginTab = document.getElementById('auth-tab-login');
    var registerTab = document.getElementById('auth-tab-register');
    if (loginTab) loginTab.addEventListener('click', function () { switchAuthTab('login'); });
    if (registerTab) registerTab.addEventListener('click', function () { switchAuthTab('register'); });

    var loginForm = document.getElementById('auth-form-login');
    var registerForm = document.getElementById('auth-form-register');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    var resetLink = document.getElementById('auth-reset-password');
    if (resetLink) {
      resetLink.addEventListener('click', function (e) {
        e.preventDefault();
        handlePasswordReset();
      });
    }

    var loginBtn = document.getElementById('auth-login-btn');
    var registerBtn = document.getElementById('auth-register-btn');
    var heroRegisterBtn = document.getElementById('auth-hero-register');
    if (loginBtn) loginBtn.addEventListener('click', function (e) { e.preventDefault(); openAuthModal('login'); });
    if (registerBtn) registerBtn.addEventListener('click', function (e) { e.preventDefault(); openAuthModal('register'); });
    if (heroRegisterBtn) heroRegisterBtn.addEventListener('click', function (e) { e.preventDefault(); openAuthModal('register'); });
  });

  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;
})();
