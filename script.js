(function () {
  'use strict';

  var reducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // =========================================================================
  // 1. STATUS DA CLÍNICA (FUSO DE SÃO PAULO) & HORÁRIO DE HOJE
  // =========================================================================
  function getSaoPauloNow() {
    try {
      var spString = new Date().toLocaleString('en-US', {
        timeZone: 'America/Sao_Paulo',
      });
      return new Date(spString);
    } catch (_err) {
      return new Date();
    }
  }

  function computeClinicStatus(now) {
    var day = now.getDay(); // 0 = Dom ... 6 = Sáb
    var minutes = now.getHours() * 60 + now.getMinutes();
    var openMin = 8 * 60;
    var weekdayClose = 19 * 60;
    var satClose = 13 * 60;

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
    var status = computeClinicStatus(getSaoPauloNow());
    var pill = document.getElementById('clinicStatusPill');
    var pillText = document.getElementById('clinicStatusText');
    var mobileStatus = document.getElementById('mobileStatusInline');

    if (pill && pillText) {
      pillText.textContent = status.label;
      pill.classList.toggle('is-open', status.isOpen);
    }
    if (mobileStatus) {
      mobileStatus.textContent = status.label + ' · Pinheiros, São Paulo';
    }

    document.querySelectorAll('.hours-row[data-day-group]').forEach(function (row) {
      if (row.getAttribute('data-day-group') === status.dayGroup) {
        row.classList.add('is-today');
        if (!row.querySelector('.today-badge')) {
          var badge = document.createElement('span');
          badge.className = 'today-badge';
          badge.textContent = 'Hoje';
          var labelEl = row.querySelector('.hours-day');
          if (labelEl) labelEl.appendChild(badge);
        }
      }
    });
  }

  applyClinicStatus();

  // =========================================================================
  // 2. HEADER TRANSPARENTE -> CREME AO ROLAR & SCROLLSPY
  // =========================================================================
  var siteHeader = document.getElementById('siteHeader');
  var navLinks = document.querySelectorAll('.header-nav-link');
  var sections = document.querySelectorAll('section[id]');

  function handleHeaderScroll() {
    var scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    if (siteHeader) {
      siteHeader.classList.toggle('is-scrolled', scrollY > 36);
    }

    var probeY = scrollY + 140;
    var activeId = '';
    sections.forEach(function (sec) {
      if (probeY >= sec.offsetTop && probeY < sec.offsetTop + sec.offsetHeight) {
        activeId = sec.id;
      }
    });

    navLinks.forEach(function (link) {
      var isCurrent = link.getAttribute('href') === '#' + activeId;
      link.classList.toggle('is-active', isCurrent);
    });
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();

  // =========================================================================
  // 3. MENU MOBILE TELA CHEIA
  // =========================================================================
  var menuTrigger = document.getElementById('menuToggleBtn');
  var mobileMenu = document.getElementById('mobileMenu');
  var mobileMenuClose = document.getElementById('mobileMenuCloseBtn');
  var mobileMenuOpen = false;

  function setMobileMenuState(open) {
    if (!mobileMenu || !menuTrigger) return;
    mobileMenuOpen = open;
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    menuTrigger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';

    if (open) {
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
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setMobileMenuState(false);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuState(false);
      }
    });
  }

  // =========================================================================
  // 4. REVELAÇÕES LEVES, ARCOS DE SORRISO E CONTADOR 6+
  // =========================================================================
  var revealNodes = document.querySelectorAll('.reveal, .smile-underline');

  if (!reducedMotion && 'IntersectionObserver' in window) {
    revealNodes.forEach(function (el) {
      if (!el.closest('.hero')) {
        el.classList.add('is-waiting');
      }
    });

    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove('is-waiting');
          if (entry.target.classList.contains('smile-underline')) {
            entry.target.classList.add('is-drawn');
          } else {
            entry.target.classList.add('is-visible');
          }
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -24px 0px' }
    );

    revealNodes.forEach(function (el) {
      if (el.classList.contains('is-waiting')) {
        revealObserver.observe(el);
      } else if (el.classList.contains('smile-underline')) {
        setTimeout(function () {
          el.classList.add('is-drawn');
        }, 160);
      }
    });
  } else {
    document.querySelectorAll('.smile-underline').forEach(function (el) {
      el.classList.add('is-drawn');
    });
  }

  var counterEl = document.getElementById('specialtiesCounter');
  if (counterEl && !reducedMotion && 'IntersectionObserver' in window) {
    var targetVal = parseInt(counterEl.getAttribute('data-target') || '6', 10);
    var counterDone = false;
    var counterObs = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || counterDone) return;
          counterDone = true;
          var start = performance.now();
          var duration = 650;
          function tick(now) {
            var progress = Math.min(1, (now - start) / duration);
            var eased = 1 - Math.pow(1 - progress, 3);
            counterEl.textContent = String(Math.max(1, Math.round(eased * targetVal))) + '+';
            if (progress < 1) {
              requestAnimationFrame(tick);
            } else {
              counterEl.textContent = targetVal + '+';
            }
          }
          requestAnimationFrame(tick);
          obs.unobserve(counterEl);
        });
      },
      { threshold: 0.5 }
    );
    counterObs.observe(counterEl);
  }

  // =========================================================================
  // 5. CARROSSEL COM DESTAQUE CENTRAL (Reutilizável em 4 seções)
  // =========================================================================
  var structureCaptionEl = document.getElementById('structureActiveCaption');

  function initCenterFocusCarousel(carousel) {
    var track = carousel.querySelector('.cf-track');
    var cards = Array.prototype.slice.call(carousel.querySelectorAll('.cf-card'));
    var dotsWrap = carousel.querySelector('.cf-dots');
    var carouselType = carousel.getAttribute('data-carousel');

    if (!track || !cards.length) return;

    var AUTO_INTERVAL_MS = 4000;
    var activeIndex = 0;
    var interactionPaused = false;
    var inViewport = false;
    var autoTimer = null;
    var suppressClickUntil = 0;

    // Gera pontos indicadores dinâmicos
    var dots = [];
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      cards.forEach(function (_card, idx) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'cf-dot' + (idx === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', 'Ir para o item ' + (idx + 1));
        dot.setAttribute('aria-current', idx === 0 ? 'true' : 'false');
        dot.addEventListener('click', function () {
          goToIndex(idx, true);
          restartAutoCount();
        });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    function setActiveCard(idx) {
      if (idx < 0 || idx >= cards.length) return;
      activeIndex = idx;

      cards.forEach(function (c, i) {
        c.classList.toggle('is-center', i === idx);
      });

      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === idx);
        d.setAttribute('aria-current', i === idx ? 'true' : 'false');
      });

      if (carouselType === 'estrutura' && structureCaptionEl) {
        var caption = cards[idx].getAttribute('data-caption');
        if (caption) structureCaptionEl.textContent = caption;
      }
    }

    function goToIndex(idx, smooth) {
      var wrapped = ((idx % cards.length) + cards.length) % cards.length;
      var card = cards[wrapped];
      if (!card) return;
      var targetLeft = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2;
      track.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: smooth && !reducedMotion ? 'smooth' : 'auto',
      });
      setActiveCard(wrapped);
    }

    function syncClosestToCenter() {
      var centerX = track.scrollLeft + track.clientWidth / 2;
      var bestIdx = 0;
      var bestDist = Infinity;
      cards.forEach(function (card, idx) {
        var cardCenter = card.offsetLeft + card.clientWidth / 2;
        var dist = Math.abs(centerX - cardCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });
      setActiveCard(bestIdx);
    }

    // Detecta card central via IntersectionObserver com rootMargin lateral de -40%
    if ('IntersectionObserver' in window) {
      var centerObserver = new IntersectionObserver(
        function (entries) {
          if (entries.some(function (e) { return e.isIntersecting; })) {
            syncClosestToCenter();
          }
        },
        {
          root: track,
          rootMargin: '0px -40% 0px -40%',
          threshold: 0.1,
        }
      );

      cards.forEach(function (card) {
        centerObserver.observe(card);
      });
    }

    var scrollRaf = 0;
    track.addEventListener(
      'scroll',
      function () {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(function () {
          scrollRaf = 0;
          syncClosestToCenter();
        });
      },
      { passive: true }
    );

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        goToIndex(activeIndex, false);
      }, 120);
    });

    function clearAutoTimers() {
      clearTimeout(autoTimer);
      autoTimer = null;
    }

    function canAutoPlay() {
      return !reducedMotion && !interactionPaused && inViewport && !document.hidden;
    }

    function scheduleNextTick() {
      clearAutoTimers();
      if (!canAutoPlay()) return;
      autoTimer = setTimeout(function () {
        if (!canAutoPlay()) return;
        goToIndex(activeIndex + 1, true);
        scheduleNextTick();
      }, AUTO_INTERVAL_MS);
    }

    function restartAutoCount() {
      interactionPaused = false;
      scheduleNextTick();
    }

    // Ao sair da viewport, pausa exatamente no item atual; ao voltar, conta 4s novamente
    if ('IntersectionObserver' in window) {
      var visibilityObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            inViewport = entry.isIntersecting;
            if (inViewport) {
              restartAutoCount();
            } else {
              interactionPaused = false;
              clearAutoTimers();
            }
          });
        },
        { threshold: 0.2 }
      );
      visibilityObserver.observe(carousel);
    } else {
      inViewport = true;
      scheduleNextTick();
    }

    // Pausa quando a aba fica oculta; conta 4s novamente ao retornar
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        clearAutoTimers();
      } else if (inViewport) {
        restartAutoCount();
      }
    });

    // Clique nos cards: foca card lateral ao clicar (e abre modal de especialidade após focar)
    cards.forEach(function (card, idx) {
      card.addEventListener('click', function (e) {
        if (Date.now() < suppressClickUntil) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        var specKey = card.getAttribute('data-spec');
        if (idx !== activeIndex) {
          goToIndex(idx, true);
          restartAutoCount();
          if (specKey) {
            setTimeout(function () {
              openSpecialtyDialog(specKey, card);
            }, 220);
          }
          return;
        }

        if (specKey) {
          openSpecialtyDialog(specKey, card);
        }
      });
    });

    // Arrastar com o mouse no desktop
    var isMouseDown = false;
    var dragStartX = 0;
    var dragStartScrollLeft = 0;
    var hasDragged = false;

    track.addEventListener('dragstart', function (e) {
      e.preventDefault();
    });

    track.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      isMouseDown = true;
      hasDragged = false;
      dragStartX = e.clientX;
      dragStartScrollLeft = track.scrollLeft;
      interactionPaused = true;
      clearAutoTimers();
    });

    window.addEventListener('mousemove', function (e) {
      if (!isMouseDown) return;
      var dx = e.clientX - dragStartX;
      if (!hasDragged && Math.abs(dx) > 6) {
        hasDragged = true;
        track.classList.add('is-dragging');
      }
      if (hasDragged) {
        track.scrollLeft = dragStartScrollLeft - dx;
      }
    });

    function finishMouseDrag() {
      if (!isMouseDown) return;
      isMouseDown = false;
      track.classList.remove('is-dragging');
      if (hasDragged) {
        suppressClickUntil = Date.now() + 140;
        syncClosestToCenter();
        goToIndex(activeIndex, true);
      }
      restartAutoCount();
    }

    window.addEventListener('mouseup', finishMouseDrag);
    window.addEventListener('blur', finishMouseDrag);

    // Eventos de toque (dedo no mobile), hover, foco e teclado
    track.addEventListener(
      'touchstart',
      function () {
        interactionPaused = true;
        clearAutoTimers();
      },
      { passive: true }
    );
    track.addEventListener(
      'touchend',
      function () {
        restartAutoCount();
      },
      { passive: true }
    );
    track.addEventListener(
      'touchcancel',
      function () {
        restartAutoCount();
      },
      { passive: true }
    );
    carousel.addEventListener('mouseenter', function () {
      interactionPaused = true;
      clearAutoTimers();
    });
    carousel.addEventListener('mouseleave', function () {
      if (!isMouseDown) {
        restartAutoCount();
      }
    });
    carousel.addEventListener('focusin', function () {
      interactionPaused = true;
      clearAutoTimers();
    });
    carousel.addEventListener('focusout', function () {
      restartAutoCount();
    });

    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToIndex(activeIndex + 1, true);
        restartAutoCount();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToIndex(activeIndex - 1, true);
        restartAutoCount();
      }
    });

    // Centraliza o primeiro item ao iniciar
    setActiveCard(0);
  }

  document.querySelectorAll('.cf-carousel').forEach(initCenterFocusCarousel);

  // =========================================================================
  // 6. GAVETA <dialog> DE ESPECIALIDADES
  // =========================================================================
  var specialtiesData = {
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

  var specDialog = document.getElementById('specDialog');
  var specDialogNum = document.getElementById('specDialogNum');
  var specDialogTitle = document.getElementById('specDialogTitle');
  var specDialogDesc = document.getElementById('specDialogDesc');
  var specDialogCta = document.getElementById('specDialogCta');
  var specDialogCloseBtn = document.getElementById('specDialogCloseBtn');
  var lastSpecTrigger = null;

  function openSpecialtyDialog(specKey, triggerEl) {
    var spec = specialtiesData[specKey];
    if (!spec || !specDialog) return;
    lastSpecTrigger = triggerEl || null;

    if (specDialogNum) specDialogNum.textContent = spec.num;
    if (specDialogTitle) specDialogTitle.textContent = spec.title;
    if (specDialogDesc) specDialogDesc.textContent = spec.desc;
    if (specDialogCta) {
      specDialogCta.textContent = 'Agendar avaliação em ' + spec.title;
      var msg =
        'Olá! Gostaria de agendar uma avaliação em ' +
        spec.title +
        ' na Clínica Sorriso Pleno.';
      specDialogCta.href = 'https://wa.me/5511999998888?text=' + encodeURIComponent(msg);
    }

    if (typeof specDialog.showModal === 'function') {
      specDialog.showModal();
    } else {
      specDialog.setAttribute('open', 'open');
    }
    if (specDialogCloseBtn) specDialogCloseBtn.focus();
  }

  function closeSpecialtyDialog() {
    if (!specDialog) return;
    if (typeof specDialog.close === 'function') {
      specDialog.close();
    } else {
      specDialog.removeAttribute('open');
    }
    if (lastSpecTrigger) {
      lastSpecTrigger.focus();
      lastSpecTrigger = null;
    }
  }

  if (specDialogCloseBtn) {
    specDialogCloseBtn.addEventListener('click', closeSpecialtyDialog);
  }

  if (specDialog) {
    specDialog.addEventListener('click', function (e) {
      if (e.target === specDialog) {
        closeSpecialtyDialog();
      }
    });
    specDialog.addEventListener('close', function () {
      if (lastSpecTrigger) {
        lastSpecTrigger.focus();
        lastSpecTrigger = null;
      }
    });
  }

  // =========================================================================
  // 7. DISCLOSURE "ATENDIMENTO PARTICULAR E REEMBOLSO"
  // =========================================================================
  var privateDisclosureBtn = document.getElementById('privateDisclosureBtn');
  var privateDisclosurePanel = document.getElementById('privateDisclosurePanel');

  if (privateDisclosureBtn && privateDisclosurePanel) {
    privateDisclosureBtn.addEventListener('click', function () {
      var expanded = privateDisclosureBtn.getAttribute('aria-expanded') === 'true';
      privateDisclosureBtn.setAttribute('aria-expanded', String(!expanded));
      privateDisclosurePanel.classList.toggle('is-open', !expanded);
    });
  }

  // =========================================================================
  // 8. FAQ ACORDEÃO (UM ABERTO POR VEZ, ANIMAÇÃO CSS)
  // =========================================================================
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    var trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', function () {
      var wasOpen = item.classList.contains('is-open');

      faqItems.forEach(function (other) {
        other.classList.remove('is-open');
        var btn = other.querySelector('.faq-trigger');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // =========================================================================
  // 9. BOTÃO FLUTUANTE DO WHATSAPP (Oculto no mobile enquanto #inicio está visível)
  // =========================================================================
  var heroSection = document.getElementById('inicio');
  var whatsappFab = document.getElementById('whatsappFab');

  if (heroSection && whatsappFab && 'IntersectionObserver' in window) {
    var heroFabObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          whatsappFab.classList.toggle('is-hero-hidden', entry.isIntersecting);
        });
      },
      { threshold: 0.2 }
    );
    heroFabObserver.observe(heroSection);
  }
})();
