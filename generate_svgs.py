import os

os.makedirs('reference/images/flat_svg', exist_ok=True)

svg_data = {
    'prompt_engineer.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="14" width="48" height="32" rx="8" fill="#4caf50"/><path d="M16 46v10l12-10h20" fill="#4caf50"/><circle cx="22" cy="30" r="3" fill="#fff"/><circle cx="32" cy="30" r="3" fill="#fff"/><circle cx="42" cy="30" r="3" fill="#fff"/></svg>''',
    'ml_engineer.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 10C20 10 12 18 12 30c0 10 8 16 16 18v6h8v-6c8-2 16-8 16-18 0-12-8-20-20-20z" fill="#ff9800"/><circle cx="24" cy="26" r="4" fill="#fff"/><circle cx="40" cy="26" r="4" fill="#fff"/><path d="M24 26l8 12 8-12" stroke="#fff" stroke-width="2" fill="none"/></svg>''',
    'ai_researcher.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="24" y="10" width="16" height="30" rx="4" fill="#03a9f4"/><path d="M20 40h24v4H20z" fill="#eceff1"/><path d="M16 44h32v8H16z" fill="#b0bec5"/><circle cx="32" cy="20" r="4" fill="#01579b"/></svg>''',
    'llm_app.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="16" width="44" height="28" rx="2" fill="#9c27b0"/><path d="M6 44h52v6H6z" fill="#7b1fa2"/><path d="M24 30l-6 6 6 6M40 30l6 6-6 6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>''',
    'data_scientist.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="36" width="10" height="20" fill="#f44336"/><rect x="26" y="24" width="10" height="32" fill="#ffeb3b"/><rect x="40" y="12" width="10" height="44" fill="#4caf50"/><path d="M8 40l18-16 14 8L56 16" stroke="#2196f3" stroke-width="4" fill="none" stroke-linecap="round"/></svg>''',
    'ai_agent.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="20" width="32" height="28" rx="6" fill="#e91e63"/><circle cx="24" cy="30" r="4" fill="#fff"/><circle cx="40" cy="30" r="4" fill="#fff"/><path d="M26 40h12" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M32 10v10" stroke="#c2185b" stroke-width="4"/><circle cx="32" cy="8" r="4" fill="#ffeb3b"/></svg>''',
    'gpu_monitor.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="14" width="44" height="36" rx="4" fill="#3f51b5"/><circle cx="32" cy="32" r="10" fill="#00bcd4"/><path d="M32 22v-6M32 48v-6M22 32h-6M48 32h-6" stroke="#cddc39" stroke-width="3" stroke-linecap="round"/></svg>''',
    'remote_house.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 8L10 26h6v28h12V40h8v14h12V26h6L32 8z" fill="#009688"/></svg>''',
    'thesis_book.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 16c-8-4-16-4-22 0v36c6-4 14-4 22 0 8-4 16-4 22 0V16c-6-4-14-4-22 0z" fill="#795548"/><path d="M16 26h10M16 34h10M38 26h10M38 34h10" stroke="#d7ccc8" stroke-width="2" stroke-linecap="round"/></svg>''',
    'beginner_sprout.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 50V30c0-10-10-14-18-14 0 10 4 18 18 18" fill="#8bc34a"/><path d="M32 34c0-10 10-14 18-14 0 10-4 18-18 18" fill="#4caf50"/><path d="M32 30v26" stroke="#388e3c" stroke-width="4" stroke-linecap="round"/></svg>''',
    'llm_rocket.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 6c10 10 12 26 12 34H20c0-8 2-24 12-34z" fill="#f44336"/><path d="M20 40H10l10 12v-12zM44 40h10L44 52v-12z" fill="#d32f2f"/><path d="M24 40h16v10H24z" fill="#ff9800"/><path d="M28 50h8v8h-8z" fill="#ffeb3b"/><circle cx="32" cy="24" r="5" fill="#fff"/></svg>''',
    'high_wage_money.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="26" fill="#ffeb3b"/><circle cx="32" cy="32" r="20" fill="#fbc02d"/><path d="M32 20v24M26 26h12M26 34h12" stroke="#f57f17" stroke-width="4" stroke-linecap="round"/></svg>''',
    'tokyo_tower.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M30 6h4l12 50H18L30 6z" fill="#e53935"/><path d="M24 24h16M20 40h24" stroke="#fff" stroke-width="2"/></svg>''',
    'remote_sleep.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="32" width="48" height="12" rx="4" fill="#eb144c"/><circle cx="18" cy="28" r="6" fill="#ffb74d"/><path d="M12 44v4M52 44v4" stroke="#795548" stroke-width="4" stroke-linecap="round"/><path d="M40 24l-4 4 4 4" stroke="#fff" stroke-width="2" fill="none"/></svg>''',
    'shibuya_wave.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M8 40Q20 20 32 40T56 40v12H8z" fill="#1e88e5"/><path d="M8 48Q20 28 32 48T56 48v4H8z" fill="#64b5f6"/></svg>''',
    'roppongi_crystal.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 8l16 20-16 28L16 28z" fill="#00bcd4"/><path d="M32 8v48l16-28z" fill="#0097a7"/><path d="M16 28h32" stroke="#e0f7fa" stroke-width="2"/></svg>''',
    'osaka_castle.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M16 36L32 16l16 20H16z" fill="#4caf50"/><path d="M12 50L32 30l20 20H12z" fill="#388e3c"/><rect x="24" y="50" width="16" height="10" fill="#795548"/></svg>''',
    'nagoya_factory.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M10 50h44v4H10z" fill="#607d8b"/><path d="M14 50V20l12 12V20l12 12V20l12 12v18z" fill="#90a4ae"/><rect x="42" y="10" width="4" height="10" fill="#455a64"/></svg>''',
    'fukuoka_palm.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M28 56c0-10 4-26 4-26h-4s4 16 4 26" stroke="#8d6e63" stroke-width="6"/><path d="M32 28c-10-10-16-4-16-4s4-8 16 4c10-10 16-4 16-4s-4-8-16 4" fill="#4caf50"/></svg>''',
    'global_earth.svg': '''<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="24" fill="#2196f3"/><path d="M20 24c8-8 16 4 24 0-4 12-16 12-20 20-8-4 0-16-4-20z" fill="#4caf50"/></svg>'''
}

for name, content in svg_data.items():
    with open(f"reference/images/flat_svg/{name}", "w") as f:
        f.write(content)

print(f"Generated {len(svg_data)} SVG flat illustrations successfully.")
