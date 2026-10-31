/* Bộ biểu tượng nét đơn giản (24x24, nét theo màu chữ hiện tại). */
(function (root) {
  const P = {
    // 8 chuyên môn, cùng thứ tự với Logic.SKILLS
    sprout: '<path d="M12 21v-9"/><path d="M12 12c0-4 3-6 7.500-6 0 4.200-3 6-7.500 6z"/><path d="M12 15c0-3-2.500-5-6.500-5 0 3.200 2.500 5 6.500 5z"/>',
    coin: '<circle cx="12" cy="12" r="8.500"/><rect x="9.500" y="9.500" width="5" height="5" rx=".6"/>',
    anvil: '<path d="M3.500 7h13.500a3.200 3.200 0 0 1-3.200 4.500H12l1.200 3.500H16V18H7.500v-3H10l1-3.500H6.700A3.200 3.200 0 0 1 3.500 7z"/>',
    heart: '<path d="M12 20s-7.500-4.600-7.500-10.400A4.100 4.100 0 0 1 12 7.500a4.100 4.100 0 0 1 7.500 2.100C19.500 15.400 12 20 12 20z"/>',
    cauldron: '<path d="M4.500 10.500h15v2a7.500 7.500 0 0 1-15 0z"/><path d="M8 8c0-1.200 1-1.600 1-2.800M12 8c0-1.200 1-1.600 1-2.800M16 8c0-1.200 1-1.600 1-2.800"/><path d="M8 20l-1 1.500M16 20l1 1.500"/>',
    talisman: '<rect x="6.500" y="3" width="11" height="18" rx="1.600"/><path d="M12 6.500v11M9.200 9.500h5.600M9.200 13.500h5.600"/>',
    formation: '<path d="M12 3.500l7.800 13.500H4.200z"/><path d="M12 20.500L4.200 7h15.600z"/>',
    orb: '<circle cx="12" cy="12" r="4.600"/><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2 2M16.700 16.700l2 2M18.700 5.300l-2 2M7.300 16.700l-2 2"/>',
    // giao diện
    arrow: '<path d="M4 12h15M13.500 6.500L19 12l-5.500 5.500"/>',
    up: '<path d="M12 19V5M6.500 10.500L12 5l5.500 5.500"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    undo: '<path d="M9 8L4.500 12.500 9 17"/><path d="M5 12.500h8.500a6 6 0 0 1 0 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    edit: '<path d="M4 20l1-4.500L16.500 4a2.100 2.100 0 0 1 3 3L8 18.500z"/><path d="M14.500 6l3 3"/>',
    trash: '<path d="M4.500 7h15M9.500 7V4.500h5V7M6.500 7l1 13h9l1-13M10 11v6M14 11v6"/>',
    check: '<path d="M4.500 12.500l5 5L19.500 7"/>',
    crown: '<path d="M3.500 18.500h17M4.500 17.500L3.500 8l5 4 3.500-6 3.500 6 5-4-1 9.500z"/>',
    gem: '<path d="M6.500 4h11l4 6L12 21 2.500 10z"/><path d="M2.500 10h19M9 4l-1.500 6L12 21l4.500-11L15 4"/>',
    people: '<circle cx="9" cy="8" r="3.300"/><path d="M2.500 20c0-3.800 2.900-6 6.500-6s6.500 2.200 6.500 6"/><path d="M16 5a3.200 3.200 0 0 1 0 6.200M18 14.300c2 .8 3.500 2.600 3.500 5.700"/>',
    door: '<path d="M5 21V4h9v17"/><path d="M3 21h18"/><path d="M17 9l3 3-3 3M11.500 12H20"/>',
    download: '<path d="M12 4v11M7 10.500l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 16V5M7 9.500l5-5 5 5M5 20h14"/>',
    data: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.700 3.100 3 7 3s7-1.300 7-3V6M5 12v6c0 1.700 3.100 3 7 3s7-1.300 7-3v-6"/>',
    palette: '<path d="M12 3.500a8.500 8.500 0 1 0 0 17c1.400 0 2-1 1.500-2.200-.500-1.200.200-2.300 1.600-2.300H17a3.500 3.500 0 0 0 3.500-3.500C20.500 7 16.700 3.500 12 3.500z"/><circle cx="7.800" cy="11.500" r="1"/><circle cx="10.500" cy="7.500" r="1"/><circle cx="15" cy="7.800" r="1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.500v2.500M12 19v2.500M2.500 12H5M19 12h2.500M5.300 5.300l1.800 1.800M16.900 16.900l1.800 1.800M18.700 5.300l-1.800 1.800M7.100 16.900l-1.800 1.800"/>',
    moon: '<path d="M20 14.500A8 8 0 0 1 9.500 4 8 8 0 1 0 20 14.500z"/>',
    auto: '<rect x="3" y="4.500" width="18" height="12" rx="2"/><path d="M8.500 20h7M12 16.500V20"/>',
    scroll: '<path d="M6 4h12v13a3 3 0 0 1-3 3H6a3 3 0 0 0 3-3V7"/><path d="M6 4a3 3 0 0 0-3 3h6"/><path d="M12 9h3.500M12 12.500h3.500"/>',
  };
  const SKILL_ICONS = ['sprout', 'coin', 'anvil', 'heart', 'cauldron', 'talisman', 'formation', 'orb'];

  function svg(name, size) {
    const s = size || 20;
    return `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name]}</svg>`;
  }
  root.Icons = { svg, SKILL_ICONS };
})(window);
