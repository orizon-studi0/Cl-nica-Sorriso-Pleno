(function () {
  'use strict';

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktopPointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  // =========================================================================
  // 1. STATUS DA CLÍNICA (HORÁRIO DE SÃO PAULO) & DESTAQUE DO DIA EM LOCALIZAÇÃO
  // =========================================================================
  function getSaoPauloNow() {
    try {
      const spString = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
      return new Date(spString);
    } catch (_err) {
      return new Date();
    }
  }

  function computeClinicStatus(now) {
    const day = now.getDay(); // 0 = Dom, 1 = Seg ... 6 = Sáb
    const minutes = now.getHours() * 60 + now.getMinutes();
    const openMin = 8 * 60;
    const weekdayClose = 19 * 60;
    const satClose = 13 * 60;

    if (day >= 1 && day <= 5) {
      if (minutes >= openMin && minutes < weekdayClose) {
        return { isOpen: true, label: 'Aberto agora', dayGroup: 'weekday' };
      }
      if (minutes < openMin) {
        return { isOpen: false, label: 'Fechado, abre hoje às 8h', dayGroup: 'weekday' };
      }
      return { isOpen: false, label: 'Fechado, abre amanhã às 8h', dayGroup: 'weekday' };
    }

    if (day === 6) {
      if (minutes >= openMin && minutes < satClose) {
        return { isOpen: true, label: 'Aberto agora', dayGroup: 'sat' };
      }
      if (minutes < openMin) {
        return { isOpen: false, label: 'Fechado, abre hoje às 8h', dayGroup: 'sat' };
      }
      return { isOpen: false, label: 'Fechado, abre segunda às 8h', dayGroup: 'sat' };
    }

    return { isOpen: false, label: 'Fechado, abre amanhã às 8h', dayGroup: 'sun' };
  }

  function applyClinicStatus() {
    const status = computeClinicStatus(getSaoPauloNow());
    const pill = document.getElementById('clinicStatusPill');
    const pillText = document.getElementById('clinicStatusText');
    const mobileStatus = document.getElementById('mobileStatusInline');

    if (pill && pillText) {
      pillText.textContent = status.label;
      pill.classList.toggle('is-open', status.isOpen);
    }
    if (mobileStatus) {
      mobileStatus.textContent = status.label + ' · Pinheiros, São Paulo';
    }

    const hourRows = document.querySelectorAll('.hours-row[data-day-group]');
    hourRows.forEach(function (row) {
      if (row.getAttribute('data-day-group') === status.dayGroup) {
        row.classList.add('is-today');
        if (!row.querySelector('.today-badge')) {
          const badge = document.createElement('span');
          badge.className = 'today-badge';
          badge.textContent = 'Hoje';
          const labelCell = row.querySelector('.hours-day');
          if (labelCell) labelCell.appendChild(badge);
        }
      }
    });
  }

  applyClinicStatus();

  // =========================================================================
  // 2. HEADER AUTO-HIDE ON SCROLL, BARRA DE PROGRESSO E SCROLLSPY
  // =========================================================================
  const siteHeader = document.getElementById('siteHeader');
  const progressBar = document.getElementById('readingProgress');
  const navLinks = document.querySelectorAll('.header-nav-link');
  const observedSections = document.querySelectorAll('section[id]');

  let lastScrollY = window.scrollY || 0;
  let mobileMenuOpen = false;

  function onScrollUpdate() {
    const currentY = window.scrollY || document.documentElement.scrollTop || 0;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

    if (progressBar && docHeight > 0) {
      const pct = Math.min(100, Math.max(0, (currentY / docHeight) * 100));
      progressBar.style.width = pct.toFixed(2) + '%';
    }

    if (siteHeader && !mobileMenuOpen) {
      if (currentY > 120 && currentY > lastScrollY + 4) {
        siteHeader.classList.add('is-hidden');
      } else if (currentY < lastScrollY - 4 || currentY <= 80) {
        siteHeader.classList.remove('is-hidden');
      }
    }

    // Active Nav Link
    const probeY = currentY + 150;
    let activeId = '';
    observedSections.forEach(function (sec) {
      if (probeY >= sec.offsetTop && probeY < sec.offsetTop + sec.offsetHeight) {
        activeId = sec.id;
      }
    });

    navLinks.forEach(function (link) {
      const matches = link.getAttribute('href') === '#' + activeId;
      link.classList.toggle('is-active', matches);
      if (matches) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    lastScrollY = currentY;
  }

  window.addEventListener('scroll', onScrollUpdate, { passive: true });
  onScrollUpdate();

  // =========================================================================
  // 3. MENU MOBILE TELA CHEIA VERDE-FLORESTA
  // =========================================================================
  const menuTrigger = document.getElementById('menuToggleBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuClose = document.getElementById('mobileMenuCloseBtn');
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link, .mobile-menu-cta');

  function setMobileMenuState(open) {
    if (!mobileMenu || !menuTrigger) return;
    mobileMenuOpen = open;
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    menuTrigger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';

    if (open) {
      if (siteHeader) siteHeader.classList.remove('is-hidden');
      if (mobileMenuClose) mobileMenuClose.focus();
    } else {
      menuTrigger.focus();
    }
  }

  if (menuTrigger && mobileMenu) {
    menuTrigger.addEventListener('click', function () {
      setMobileMenuState(true);
    });
    if (mobileMenuClose) {
      mobileMenuClose.addEventListener('click', function () {
        setMobileMenuState(false);
      });
    }
    mobileMenuLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        setMobileMenuState(false);
      });
    });
  }

  // =========================================================================
  // 4. LENIS SMOOTH SCROLL (SÓ DESKTOP) + ÂNCORAS SUAVES
  // =========================================================================
  let lenisInstance = null;
  if (!reducedMotion && window.innerWidth >= 1100 && typeof window.Lenis === 'function') {
    lenisInstance = new window.Lenis({
      duration: 1.05,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      smoothWheel: true,
    });

    if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
      window.gsap.registerPlugin(window.ScrollTrigger);
      lenisInstance.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) {
        lenisInstance.raf(time * 1000);
      });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenisInstance.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      if (lenisInstance) {
        e.preventDefault();
        lenisInstance.scrollTo(targetEl, { offset: -72 });
      }
    });
  });

  // =========================================================================
  // 5. REVELAÇÕES, ARCOS DE SORRISO, CONTADOR E PARALLAX DOS ADESIVOS
  // =========================================================================
  const revealTargets = document.querySelectorAll('.reveal-fade, .squircle-reveal, .smile-underline');

  if (!reducedMotion && 'IntersectionObserver' in window) {
    revealTargets.forEach(function (el) {
      // Elementos no Hero acima da dobra já animam na entrada imediata
      if (!el.closest('.hero-section')) {
        el.classList.add('is-waiting');
      }
    });

    const revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.remove('is-waiting');
            if (entry.target.classList.contains('smile-underline')) {
              entry.target.classList.add('is-drawn');
            } else {
              entry.target.classList.add('is-visible');
            }
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -30px 0px' }
    );

    revealTargets.forEach(function (el) {
      if (el.classList.contains('is-waiting')) {
        revealObserver.observe(el);
      } else if (el.classList.contains('smile-underline')) {
        setTimeout(function () {
          el.classList.add('is-drawn');
        }, 180);
      }
    });
  }

  // Contador animado "6+"
  const counterEl = document.getElementById('specialtiesCounter');
  if (counterEl && !reducedMotion && 'IntersectionObserver' in window) {
    const targetValue = parseInt(counterEl.getAttribute('data-target') || '6', 10);
    let hasCounted = false;

    const counterObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !hasCounted) {
            hasCounted = true;
            const start = performance.now();
            const duration = 750;
            function step(now) {
              const progress = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - progress, 3);
              counterEl.textContent = String(Math.max(1, Math.round(eased * targetValue))) + '+';
              if (progress < 1) {
                requestAnimationFrame(step);
              } else {
                counterEl.textContent = targetValue + '+';
              }
            }
            requestAnimationFrame(step);
            obs.unobserve(counterEl);
          }
        });
      },
      { threshold: 0.5 }
    );
    counterObserver.observe(counterEl);
  }

  // Parallax leve (máx 8%) nos 3 adesivos do Hero em velocidades diferentes
  const stickers = document.querySelectorAll('.hero-sticker[data-speed]');
  if (stickers.length && !reducedMotion) {
    function updateParallax() {
      if (window.innerWidth < 768) {
        stickers.forEach(function (s) {
          s.style.transform = '';
        });
        return;
      }
      const scrollY = window.scrollY || 0;
      if (scrollY > window.innerHeight * 1.3) return;

      stickers.forEach(function (sticker) {
        const speed = parseFloat(sticker.getAttribute('data-speed') || '0.05');
        const baseRotate = sticker.getAttribute('data-rotate') || '0deg';
        const offset = Math.min(34, Math.max(-34, scrollY * speed));
        sticker.style.transform = 'translate3d(0, ' + offset.toFixed(1) + 'px, 0) rotate(' + baseRotate + ')';
      });
    }
    window.addEventListener('scroll', updateParallax, { passive: true });
  }

  // Efeito magnético sutil em botões primários (desktop apenas)
  if (!reducedMotion && isDesktopPointer && window.innerWidth >= 1100) {
    document.querySelectorAll('.btn-magnetic').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        const rect = btn.getBoundingClientRect();
        const relX = (e.clientX - rect.left - rect.width / 2) * 0.14;
        const relY = (e.clientY - rect.top - rect.height / 2) * 0.18;
        btn.style.transform = 'translate3d(' + relX.toFixed(1) + 'px, ' + relY.toFixed(1) + 'px, 0)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  // =========================================================================
  // 6. DISCLOSURE "ATENDIMENTO HUMANIZADO" NA SEÇÃO SOBRE
  // =========================================================================
  const disclosureBtn = document.getElementById('humanizedDisclosureBtn');
  const disclosurePanel = document.getElementById('humanizedDisclosurePanel');

  if (disclosureBtn && disclosurePanel) {
    disclosureBtn.addEventListener('click', function () {
      const isOpen = disclosureBtn.getAttribute('aria-expanded') === 'true';
      disclosureBtn.setAttribute('aria-expanded', String(!isOpen));
      disclosurePanel.classList.toggle('is-open', !isOpen);
      const labelEl = disclosureBtn.querySelector('.disclosure-label');
      if (labelEl) {
        labelEl.textContent = !isOpen ? 'Recolher detalhes' : 'Ler mais sobre nossa conduta';
      }
    });
  }

  // =========================================================================
  // 7. ESPECIALIDADES BENTO GRID -> PAINEL LATERAL / BOTTOM SHEET
  // =========================================================================
  const specialtiesData = {
    'clinica-geral': {
      num: '01',
      title: 'Clínica Geral',
      desc: 'Consultas preventivas, profilaxia (limpeza), remoção de tártaro, restaurações estéticas e diagnóstico precoce de cáries e gengivites.',
    },
    ortodontia: {
      num: '02',
      title: 'Ortodontia',
      desc: 'Alinhamento dental e correção da oclusão funcional com alinhadores transparentes modernos e aparelhos fixos convencionais ou autoligados.',
    },
    implantes: {
      num: '03',
      title: 'Implantes',
      desc: 'Reabilitação da perda dentária unitária ou múltipla por meio de implantes de titânio com planejamento tomográfico computadorizado seguro.',
    },
    clareamento: {
      num: '04',
      title: 'Clareamento',
      desc: 'Técnicas seguras de clareamento dental em consultório com barreira gengival de proteção e clareamento caseiro supervisionado.',
    },
    endodontia: {
      num: '05',
      title: 'Endodontia',
      desc: 'Tratamento de canal mecanizado e preciso para alívio de quadros inflamatórios pulpares e infecções, preservando a raiz e a estrutura natural do dente.',
    },
    odontopediatria: {
      num: '06',
      title: 'Odontopediatria',
      desc: 'Abordagem lúdica e preventiva dedicada a bebês, crianças e adolescentes, criando memórias positivas e hábitos saudáveis de higiene oral.',
    },
  };

  const drawer = document.getElementById('specDrawer');
  const drawerBackdrop = document.getElementById('specDrawerBackdrop');
  const drawerClose = document.getElementById('specDrawerClose');
  const drawerNum = document.getElementById('drawerNum');
  const drawerTitle = document.getElementById('drawerTitle');
  const drawerDesc = document.getElementById('drawerDesc');
  const drawerCta = document.getElementById('drawerCta');
  let lastTriggerCell = null;

  function openSpecialtyDrawer(specKey, triggerEl) {
    const spec = specialtiesData[specKey];
    if (!spec || !drawer || !drawerBackdrop) return;
    lastTriggerCell = triggerEl || null;

    if (drawerNum) drawerNum.textContent = spec.num;
    if (drawerTitle) drawerTitle.textContent = spec.title;
    if (drawerDesc) drawerDesc.textContent = spec.desc;
    if (drawerCta) {
      drawerCta.textContent = 'Agendar avaliação em ' + spec.title;
      const msg = 'Olá! Gostaria de agendar uma avaliação em ' + spec.title + ' na Clínica Sorriso Pleno.';
      drawerCta.href = 'https://wa.me/5511999998888?text=' + encodeURIComponent(msg);
    }

    drawer.hidden = false;
    drawerBackdrop.hidden = false;
    requestAnimationFrame(function () {
      drawer.classList.add('is-open');
      drawerBackdrop.classList.add('is-open');
    });
    if (drawerClose) drawerClose.focus();
  }

  function closeSpecialtyDrawer() {
    if (!drawer || !drawerBackdrop) return;
    drawer.classList.remove('is-open');
    drawerBackdrop.classList.remove('is-open');
    setTimeout(function () {
      if (!drawer.classList.contains('is-open')) {
        drawer.hidden = true;
        drawerBackdrop.hidden = true;
      }
    }, 350);
    if (lastTriggerCell) {
      lastTriggerCell.focus();
      lastTriggerCell = null;
    }
  }

  document.querySelectorAll('.bento-cell[data-spec]').forEach(function (cell) {
    cell.addEventListener('click', function () {
      openSpecialtyDrawer(cell.getAttribute('data-spec'), cell);
    });
  });

  if (drawerClose) drawerClose.addEventListener('click', closeSpecialtyDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeSpecialtyDrawer);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (drawer && drawer.classList.contains('is-open')) {
        closeSpecialtyDrawer();
      }
      if (mobileMenuOpen) {
        setMobileMenuState(false);
      }
    }
  });

  // =========================================================================
  // 8. CORPO CLÍNICO — CARROSSEL ARRASTÁVEL COM AUTO-AVANÇO LENTO
  // =========================================================================
  const teamCarousel = document.getElementById('teamCarousel');
  const teamPrev = document.getElementById('teamPrevBtn');
  const teamNext = document.getElementById('teamNextBtn');

  if (teamCarousel) {
    let teamPaused = false;
    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    function scrollTeam(direction) {
      const card = teamCarousel.querySelector('.team-bizcard');
      const step = card ? card.getBoundingClientRect().width + 20 : 340;
      const maxScroll = teamCarousel.scrollWidth - teamCarousel.clientWidth;

      if (direction > 0 && teamCarousel.scrollLeft >= maxScroll - 8) {
        teamCarousel.scrollTo({ left: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
      } else if (direction < 0 && teamCarousel.scrollLeft <= 8) {
        teamCarousel.scrollTo({ left: maxScroll, behavior: reducedMotion ? 'auto' : 'smooth' });
      } else {
        teamCarousel.scrollBy({ left: step * direction, behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    }

    if (teamPrev) teamPrev.addEventListener('click', function () { scrollTeam(-1); });
    if (teamNext) teamNext.addEventListener('click', function () { scrollTeam(1); });

    teamCarousel.addEventListener('mouseenter', function () { teamPaused = true; });
    teamCarousel.addEventListener('mouseleave', function () {
      teamPaused = false;
      isDragging = false;
      teamCarousel.classList.remove('is-dragging');
    });
    teamCarousel.addEventListener('touchstart', function () { teamPaused = true; }, { passive: true });
    teamCarousel.addEventListener('touchend', function () {
      setTimeout(function () { teamPaused = false; }, 4000);
    }, { passive: true });

    // Arraste com mouse no desktop
    teamCarousel.addEventListener('mousedown', function (e) {
      isDragging = true;
      teamCarousel.classList.add('is-dragging');
      startX = e.pageX - teamCarousel.offsetLeft;
      startScrollLeft = teamCarousel.scrollLeft;
    });
    window.addEventListener('mouseup', function () {
      isDragging = false;
      teamCarousel.classList.remove('is-dragging');
    });
    teamCarousel.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - teamCarousel.offsetLeft;
      const walk = (x - startX) * 1.25;
      teamCarousel.scrollLeft = startScrollLeft - walk;
    });

    if (!reducedMotion) {
      setInterval(function () {
        if (!teamPaused && !isDragging) {
          scrollTeam(1);
        }
      }, 4500);
    }
  }

  // =========================================================================
  // 9. COMO FUNCIONA — BARRA DE PROGRESSO DO STICKY STACK
  // =========================================================================
  const stackCards = document.querySelectorAll('.stack-card');
  const stackRailLabel = document.getElementById('stackRailLabel');
  const stackRailFill = document.getElementById('stackRailFill');

  if (stackCards.length && stackRailLabel && stackRailFill) {
    function updateStackRail() {
      let activeStep = 1;
      const anchorY = window.innerHeight * 0.42;

      stackCards.forEach(function (card, idx) {
        const rect = card.getBoundingClientRect();
        if (rect.top <= anchorY) {
          activeStep = idx + 1;
        }
      });

      stackRailLabel.textContent = '0' + activeStep + ' / 0' + stackCards.length;
      stackRailFill.style.height = (activeStep / stackCards.length) * 100 + '%';
    }
    window.addEventListener('scroll', updateStackRail, { passive: true });
    updateStackRail();
  }

  // =========================================================================
  // 10. ESTRUTURA — ABAS AUTOMÁTICAS COM BARRA DE PROGRESSO (6 SEGUNDOS)
  // =========================================================================
  const structureShowcase = document.getElementById('structureShowcase');
  const structureTabs = document.querySelectorAll('.structure-tab');
  const structureSlides = document.querySelectorAll('.structure-slide-img');
  const structureCaption = document.getElementById('structureCaption');

  if (structureShowcase && structureTabs.length && structureSlides.length) {
    let activeTabIndex = 0;
    let structurePaused = false;
    let structureTimer = null;

    function activateStructureTab(index) {
      activeTabIndex = index;

      structureTabs.forEach(function (tab, i) {
        const isCurrent = i === index;
        tab.classList.toggle('is-active', isCurrent);
        tab.setAttribute('aria-selected', String(isCurrent));

        // Reinicia barra de progresso
        const bar = tab.querySelector('.tab-progress-bar');
        if (bar) {
          bar.style.animation = 'none';
          void bar.offsetWidth;
          bar.style.animation = '';
        }
      });

      structureSlides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });

      const activeTab = structureTabs[index];
      if (structureCaption && activeTab) {
        structureCaption.textContent = activeTab.getAttribute('data-caption') || '';
      }
    }

    function scheduleNextStructureTab() {
      clearTimeout(structureTimer);
      if (reducedMotion || structurePaused) return;
      structureTimer = setTimeout(function () {
        const nextIdx = (activeTabIndex + 1) % structureTabs.length;
        activateStructureTab(nextIdx);
        scheduleNextStructureTab();
      }, 6000);
    }

    structureTabs.forEach(function (tab, idx) {
      tab.addEventListener('click', function () {
        activateStructureTab(idx);
        scheduleNextStructureTab();
      });
    });

    structureShowcase.addEventListener('mouseenter', function () {
      structurePaused = true;
      structureShowcase.classList.add('is-paused');
      clearTimeout(structureTimer);
    });

    structureShowcase.addEventListener('mouseleave', function () {
      structurePaused = false;
      structureShowcase.classList.remove('is-paused');
      scheduleNextStructureTab();
    });

    scheduleNextStructureTab();
  }

  // =========================================================================
  // 11. FAQ ACCORDION (UM ABERTO POR VEZ)
  // =========================================================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', function () {
      const wasOpen = item.classList.contains('is-open');

      faqItems.forEach(function (other) {
        other.classList.remove('is-open');
        const otherBtn = other.querySelector('.faq-trigger');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // =========================================================================
  // 12. FORMULÁRIO DE AGENDAMENTO (CHIPS, RÓTULOS FLUTUANTES, VALIDAÇÃO)
  // =========================================================================
  const form = document.getElementById('appointmentForm');
  const nomeInput = document.getElementById('formNome');
  const telInput = document.getElementById('formTelefone');
  const obsInput = document.getElementById('formObs');
  const specialtyInput = document.getElementById('formEspecialidade');
  const timeInput = document.getElementById('formHorario');

  const errorNome = document.getElementById('errorNome');
  const errorTelefone = document.getElementById('errorTelefone');
  const errorInteresse = document.getElementById('errorInteresse');
  const formFeedback = document.getElementById('formFeedback');
  const formFeedbackLink = document.getElementById('formFeedbackLink');

  // Chips de Especialidade (seleção única)
  const specialtyChips = document.querySelectorAll('.specialty-chip');
  specialtyChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      specialtyChips.forEach(function (c) {
        c.classList.remove('is-selected');
        c.setAttribute('aria-checked', 'false');
      });
      chip.classList.add('is-selected');
      chip.setAttribute('aria-checked', 'true');
      if (specialtyInput) specialtyInput.value = chip.getAttribute('data-value') || '';
      if (errorInteresse) errorInteresse.classList.remove('is-visible');
    });
  });

  // Chips de Preferência de Horário (opcional, alternável)
  const timeChips = document.querySelectorAll('.time-chip');
  timeChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      const already = chip.classList.contains('is-selected');
      timeChips.forEach(function (c) {
        c.classList.remove('is-selected');
        c.setAttribute('aria-pressed', 'false');
      });
      if (!already) {
        chip.classList.add('is-selected');
        chip.setAttribute('aria-pressed', 'true');
        if (timeInput) timeInput.value = chip.getAttribute('data-value') || '';
      } else if (timeInput) {
        timeInput.value = '';
      }
    });
  });

  // Máscara de telefone com DDD
  if (telInput) {
    telInput.addEventListener('input', function (e) {
      let digits = e.target.value.replace(/\D/g, '').slice(0, 11);
      if (digits.length > 10) {
        e.target.value = digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
      } else if (digits.length > 6) {
        e.target.value = digits.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
      } else if (digits.length > 2) {
        e.target.value = digits.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
      } else {
        e.target.value = digits;
      }
      if (errorTelefone && digits.length >= 10) {
        errorTelefone.classList.remove('is-visible');
      }
    });
  }

  if (nomeInput && errorNome) {
    nomeInput.addEventListener('input', function () {
      if (nomeInput.value.trim().length >= 2) {
        errorNome.classList.remove('is-visible');
      }
    });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      let hasError = false;

      const nomeVal = nomeInput ? nomeInput.value.trim() : '';
      const telVal = telInput ? telInput.value.trim() : '';
      const telDigits = telVal.replace(/\D/g, '');
      const specVal = specialtyInput ? specialtyInput.value.trim() : '';
      const timeVal = timeInput ? timeInput.value.trim() : '';
      const obsVal = obsInput ? obsInput.value.trim() : '';

      if (nomeVal.length < 2) {
        if (errorNome) errorNome.classList.add('is-visible');
        if (nomeInput) nomeInput.focus();
        hasError = true;
      } else if (errorNome) {
        errorNome.classList.remove('is-visible');
      }

      if (telDigits.length < 10) {
        if (errorTelefone) errorTelefone.classList.add('is-visible');
        if (!hasError && telInput) telInput.focus();
        hasError = true;
      } else if (errorTelefone) {
        errorTelefone.classList.remove('is-visible');
      }

      if (!specVal) {
        if (errorInteresse) errorInteresse.classList.add('is-visible');
        if (!hasError && specialtyChips[0]) specialtyChips[0].focus();
        hasError = true;
      } else if (errorInteresse) {
        errorInteresse.classList.remove('is-visible');
      }

      if (hasError) return;

      let message = 'Olá! Gostaria de agendar uma consulta na Clínica Sorriso Pleno.\n\n';
      message += '*Nome:* ' + nomeVal + '\n';
      message += '*Telefone:* ' + telVal + '\n';
      message += '*Especialidade:* ' + specVal;
      if (timeVal) {
        message += '\n*Preferência de horário:* ' + timeVal;
      }
      if (obsVal) {
        message += '\n*Observações:* ' + obsVal;
      }

      const waUrl = 'https://wa.me/5511999998888?text=' + encodeURIComponent(message);

      if (formFeedback && formFeedbackLink) {
        formFeedbackLink.href = waUrl;
        formFeedback.classList.add('is-visible');
      }

      window.open(waUrl, '_blank', 'noopener,noreferrer');
    });
  }

  // =========================================================================
  // 13. BARRA INFERIOR MOBILE SE ESCONDE QUANDO O FORMULÁRIO ESTÁ VISÍVEL
  // =========================================================================
  const mobileStickyBar = document.getElementById('mobileStickyBar');
  if (mobileStickyBar && form && 'IntersectionObserver' in window) {
    const formVisibilityObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          mobileStickyBar.classList.toggle('is-hidden', entry.isIntersecting);
        });
      },
      { threshold: 0.12 }
    );
    formVisibilityObserver.observe(form);
  }
})();
