/* ==========================================================================
   auth-header.js - 全ページ共通：ヘッダーのログイン状態切り替え
   .site-nav 内のリンクを認証状態に応じて表示/非表示にする
   ========================================================================== */
(function () {
  'use strict';

  function updateNav(session) {
    var nav = document.querySelector('.site-nav');
    if (!nav) return;

    var links = nav.querySelectorAll('a');
    var hasMypage = false;
    var hasLogout = false;

    links.forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href.indexOf('mypage.html') !== -1) hasMypage = true;
      if (a.id === 'logout-link' || a.id === 'auth-header-logout') hasLogout = true;
    });

    if (session && session.user) {
      // ログイン済み: login/signup を隠す
      links.forEach(function (a) {
        var href = a.getAttribute('href') || '';
        if (href.indexOf('login.html') !== -1 && !a.classList.contains('current')) {
          a.style.display = 'none';
        }
        if ((href.indexOf('signup.html') !== -1 || href.indexOf('signup-role.html') !== -1) && !a.classList.contains('current')) {
          a.style.display = 'none';
        }
      });

      // マイページリンクがなければ追加
      if (!hasMypage) {
        var mp = document.createElement('a');
        mp.href = 'mypage.html';
        mp.textContent = 'マイページ';
        mp.id = 'auth-header-mypage';
        // register ボタンの前か末尾に挿入
        var regBtn = nav.querySelector('.register');
        if (regBtn) {
          nav.insertBefore(mp, regBtn);
        } else {
          nav.appendChild(mp);
        }
      } else {
        // 既存のマイページリンクを表示
        links.forEach(function (a) {
          if ((a.getAttribute('href') || '').indexOf('mypage.html') !== -1) {
            a.style.display = '';
          }
        });
      }

      // ログアウトリンクがなければ追加
      if (!hasLogout) {
        var lo = document.createElement('a');
        lo.href = '#';
        lo.textContent = 'ログアウト';
        lo.className = 'login';
        lo.id = 'auth-header-logout';
        lo.addEventListener('click', function (e) {
          e.preventDefault();
          if (window.sb) {
            window.sb.auth.signOut().then(function () {
              window.location.href = 'original.html';
            });
          }
        });
        nav.appendChild(lo);
      } else {
        // 既存のログアウトリンクを表示 & イベント付与
        var existingLogout = document.getElementById('logout-link') || document.getElementById('auth-header-logout');
        if (existingLogout) {
          existingLogout.style.display = '';
          if (!existingLogout._authBound) {
            existingLogout._authBound = true;
            existingLogout.addEventListener('click', function (e) {
              e.preventDefault();
              if (window.sb) {
                window.sb.auth.signOut().then(function () {
                  window.location.href = 'original.html';
                });
              }
            });
          }
        }
      }
    } else {
      // 未ログイン: login/signup 表示、マイページ/ログアウト非表示
      var authMypage = document.getElementById('auth-header-mypage');
      if (authMypage) authMypage.remove();

      var authLogout = document.getElementById('auth-header-logout');
      if (authLogout) authLogout.remove();
    }
  }

  function init() {
    if (!window.sb) return;
    window.sb.auth.getSession().then(function (result) {
      updateNav(result.data.session);
    });
    window.sb.auth.onAuthStateChange(function (_event, session) {
      updateNav(session);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
