// Supabase Client Configuration
(function () {
  'use strict';

  var SUPABASE_URL = 'https://ebabjbaibbbgwnopkdiw.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_7KxUWiRNu-fxSBUpL44iZw_7KNMyFj5';

  if (typeof window.supabase === 'undefined') {
    console.error('Supabase SDK not loaded');
    return;
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
