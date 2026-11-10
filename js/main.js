import { getWorkCategory, WORK_CATEGORIES } from '../src/data/work-categories.ts';
import {
  getResponsiveWorkImageSrcSet,
  PORTFOLIO_GRID_IMAGE_SIZES,
} from '../src/lib/work-images.ts';

const siteConfig = {
  companyName: 'SeaTechMedia',
  email: 'seatechp@gmail.com',
  phone: '9851084681',
  whatsappNumber: '9779851084681',
  address: 'Balakhu, Sorahkhutte',
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  youtube: 'https://youtube.com',
  tiktok: 'https://tiktok.com'
};

const heroVideo = document.querySelector('.hero-background-video');

if (heroVideo && document.documentElement.classList.contains('hero-video-enabled')) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const smallScreen = window.matchMedia('(max-width: 767px)');
  const connection = navigator.connection;

  const disableHeroVideo = (error) => {
    if (error) console.error('The hero background video could not start.', error);
    document.documentElement.classList.remove('hero-video-enabled');
    heroVideo.pause();
    heroVideo.removeAttribute('src');
    heroVideo.load();
  };

  const disableForReducedMotion = () => {
    if (reducedMotion.matches) disableHeroVideo();
  };

  const disableForSmallScreen = () => {
    if (smallScreen.matches) disableHeroVideo();
  };

  reducedMotion.addEventListener('change', disableForReducedMotion);
  smallScreen.addEventListener('change', disableForSmallScreen);
  connection?.addEventListener('change', () => {
    if (connection.saveData || ['slow-2g', '2g'].includes(connection.effectiveType)) {
      disableHeroVideo();
    }
  });

  heroVideo.addEventListener('error', () => disableHeroVideo(heroVideo.error), { once: true });
  heroVideo.src = new URL('../assets/perfect-live-hero-h264.mp4', import.meta.url).href;
  heroVideo.play().catch(disableHeroVideo);

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) disableHeroVideo();
  });
}

const brandVertexShader = `#version 300 es
in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const brandFragmentShader = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;
uniform sampler2D uMask;
uniform float uTime;
uniform vec2 uPointer;
uniform float uPointerActive;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += noise(p) * amplitude;
    p = p * 2.03 + 17.1;
    amplitude *= 0.5;
  }
  return value;
}

vec3 rainbow(float hue) {
  vec3 channels = abs(fract(hue + vec3(0.0, 0.6667, 0.3333)) * 6.0 - 3.0);
  return clamp(channels - 1.0, 0.0, 1.0);
}

void main() {
  vec2 uv = vUv;
  vec2 pointerDelta = uv - uPointer;
  float pointerPull = exp(-dot(pointerDelta, pointerDelta) * 85.0) * uPointerActive;
  float pointerAura = exp(-dot(pointerDelta, pointerDelta) * 34.0) * uPointerActive;
  float flow = fbm(uv * vec2(4.0, 7.0) + vec2(uTime * 0.12, -uTime * 0.16));
  float ripple = sin(uv.x * 17.0 + uv.y * 6.0 + flow * 5.0 - uTime * 0.6);
  vec2 distortion = vec2(
    sin(uv.y * 12.0 + uTime * 0.8),
    cos(uv.x * 13.0 - uTime * 0.7)
  ) * (0.002 + pointerPull * 0.012);

  float mask = texture(uMask, uv + distortion).a;
  float alpha = smoothstep(0.04, 0.72, mask);
  float sheen = smoothstep(0.38, 0.72, flow + ripple * 0.12);
  float highlight = pow(max(0.0, sin(uv.x * 20.0 + flow * 8.0 + uTime * 0.45)), 12.0);
  float edge = 1.0 - smoothstep(0.05, 0.28, abs(mask - 0.5));

  vec3 deepInk = vec3(0.12, 0.17, 0.23);
  vec3 liquidSilver = vec3(0.48, 0.58, 0.67);
  vec3 brightSilver = vec3(0.94, 0.97, 1.0);
  vec3 color = mix(deepInk, liquidSilver, 0.18 + sheen * 0.38);
  color = mix(color, brightSilver, clamp(highlight * 0.48 + edge * 0.28, 0.0, 0.64));
  vec3 cursorRainbow = rainbow(fract(uPointer.x * 0.72 + uv.x * 0.28 + flow * 0.08));
  color = mix(color, cursorRainbow, pointerAura * 0.88);
  color = mix(color, brightSilver, edge * 0.22);
  color = mix(color, cursorRainbow, edge * pointerAura * 0.34);

  outColor = vec4(color, alpha);
}`;

function createBrandShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to allocate a wordmark shader.');

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Unable to compile the wordmark shader: ${message}`);
  }

  return shader;
}

function initializeLiquidBrand(brandName) {
  const canvas = document.createElement('canvas');
  canvas.className = 'brand-liquid-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false
  });
  if (!gl) return;

  try {
    const vertexShader = createBrandShader(gl, gl.VERTEX_SHADER, brandVertexShader);
    const fragmentShader = createBrandShader(gl, gl.FRAGMENT_SHADER, brandFragmentShader);
    const program = gl.createProgram();
    if (!program) throw new Error('Unable to allocate the wordmark shader program.');

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Unable to link the wordmark shader: ${gl.getProgramInfoLog(program)}`);
    }

    const positionLocation = gl.getAttribLocation(program, 'aPosition');
    const timeLocation = gl.getUniformLocation(program, 'uTime');
    const pointerLocation = gl.getUniformLocation(program, 'uPointer');
    const pointerActiveLocation = gl.getUniformLocation(program, 'uPointerActive');
    const maskLocation = gl.getUniformLocation(program, 'uMask');
    const buffer = gl.createBuffer();
    const texture = gl.createTexture();
    if (!buffer || !texture) throw new Error('Unable to allocate wordmark rendering resources.');

    const maskCanvas = document.createElement('canvas');
    const maskContext = maskCanvas.getContext('2d');
    if (!maskContext) throw new Error('Unable to create the wordmark text mask.');

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.useProgram(program);
    gl.uniform1i(maskLocation, 0);

    brandName.append(canvas);
    brandName.classList.add('is-liquid');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = { x: 0.5, y: 0.5, active: 0 };
    let visible = true;
    let frameId = 0;
    let startTime = performance.now();
    let lastFrameTime = 0;

    const draw = (timestamp = performance.now()) => {
      frameId = 0;
      if (!visible) return;

      if (!reducedMotion.matches && timestamp - lastFrameTime < 40) {
        frameId = requestAnimationFrame(draw);
        return;
      }

      lastFrameTime = timestamp;
      const rect = brandName.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        maskCanvas.width = width;
        maskCanvas.height = height;

        const computed = getComputedStyle(brandName);
        maskContext.clearRect(0, 0, width, height);
        maskContext.setTransform(dpr, 0, 0, dpr, 0, 0);
        maskContext.font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
        maskContext.textAlign = 'center';
        maskContext.textBaseline = 'middle';
        if ('letterSpacing' in maskContext) {
          maskContext.letterSpacing = computed.letterSpacing;
        }
        maskContext.fillStyle = '#fff';
        maskContext.fillText(brandName.textContent.trim(), rect.width / 2, rect.height / 2);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, maskCanvas);
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(timeLocation, reducedMotion.matches ? 0 : (timestamp - startTime) / 1000);
      gl.uniform2f(pointerLocation, pointer.x, pointer.y);
      gl.uniform1f(pointerActiveLocation, pointer.active);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!reducedMotion.matches) frameId = requestAnimationFrame(draw);
    };

    const scheduleDraw = () => {
      if (visible && !frameId) frameId = requestAnimationFrame(draw);
    };

    brandName.addEventListener('pointermove', (event) => {
      const rect = brandName.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = 1 - (event.clientY - rect.top) / rect.height;
      pointer.active = 1;
      scheduleDraw();
    });

    brandName.addEventListener('pointerleave', () => {
      pointer.active = 0;
      scheduleDraw();
    });

    reducedMotion.addEventListener('change', () => {
      startTime = performance.now();
      lastFrameTime = 0;
      scheduleDraw();
    });

    if ('ResizeObserver' in window) {
      new ResizeObserver(scheduleDraw).observe(brandName);
    } else {
      window.addEventListener('resize', scheduleDraw);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          startTime = performance.now();
          scheduleDraw();
        } else if (frameId) {
          cancelAnimationFrame(frameId);
          frameId = 0;
        }
      }).observe(brandName);
    }

    scheduleDraw();
  } catch (error) {
    console.error('SeaTechMedia wordmark liquid effect could not start.', error);
    canvas.remove();
    brandName.classList.remove('is-liquid');
  }
}

const headerBrandName = document.querySelector('.site-header .brand-name');
const desktopBrandViewport = window.matchMedia('(min-width: 900px)');
let headerBrandInitialized = false;

const initializeDesktopHeaderBrand = () => {
  if (!headerBrandName || !desktopBrandViewport.matches || headerBrandInitialized) {
    return;
  }
  headerBrandInitialized = true;
  initializeLiquidBrand(headerBrandName);
};

initializeDesktopHeaderBrand();
desktopBrandViewport.addEventListener('change', initializeDesktopHeaderBrand);

document.querySelectorAll('.footer-brand .brand-name').forEach((brandName) => {
  initializeLiquidBrand(brandName);
});

const portfolioItems = WORK_CATEGORIES.flatMap((category) =>
  category.portfolioItems.map((item) => ({
    ...item,
    category: category.label,
    categoryId: category.id
  }))
);

const portfolioGrid = document.getElementById('portfolio-grid');
const portfolioFilters = document.getElementById('portfolio-filters');
const modal = document.getElementById('portfolio-modal');
const modalImage = document.getElementById('modal-image');
const modalCategory = document.getElementById('modal-category');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const backToTopButton = document.getElementById('back-to-top');

function createPortfolioFilters() {
  // Skip if the React PortfolioFilters component has already mounted here.
  if (portfolioFilters?.dataset.reactFilters === 'true') return;

  portfolioFilters.replaceChildren();

  WORK_CATEGORIES.forEach((category) => {
    const button = document.createElement('button');
    button.className = 'filter-btn';
    button.type = 'button';
    button.dataset.filter = category.id;
    button.textContent = category.label;
    button.setAttribute('aria-pressed', 'false');
    portfolioFilters.append(button);
  });
}

function renderPortfolio(filter, subcategory) {
  if (filter === undefined) filter = 'all';
  if (subcategory === undefined) subcategory = 'All';

  var selectedCategory = getWorkCategory(filter);
  var categoryItems = filter === 'all'
    ? portfolioItems
    : selectedCategory
      ? portfolioItems.filter(function(item) { return item.categoryId === selectedCategory.id; })
      : portfolioItems;

  // Apply subcategory filter when one is selected
  var items = (subcategory && subcategory !== 'All')
    ? categoryItems.filter(function(item) { return item.subcategory === subcategory; })
    : categoryItems;

  if (selectedCategory && categoryItems.length > 0) {
    // Category items shown by React deck — clear the HTML grid unless
    // there are no subcategory matches, in which case show an empty-state.
    if (items.length === 0 && subcategory !== 'All') {
      portfolioGrid.innerHTML = '<div class="portfolio-empty-state" role="status"><h3>No projects available in this category yet.</h3><p>Choose another subcategory or return to all ' + selectedCategory.label + ' projects.</p><button class="portfolio-empty-state__reset" type="button" data-reset-category="' + selectedCategory.id + '">Show all ' + selectedCategory.label + '</button></div>';
    } else {
      portfolioGrid.replaceChildren();
    }
    return;
  }

  if (items.length === 0) {
    var heading = selectedCategory
      ? selectedCategory.label + ' projects are coming soon'
      : 'No featured projects are available yet';
    portfolioGrid.innerHTML = '<div class="portfolio-empty-state" role="status"><h3>' + heading + '</h3><p>We\'re preparing verified project examples. <a href="#contact">Contact us</a> to discuss your project.</p></div>';
    return;
  }

  portfolioGrid.innerHTML = items
    .map(function(item) {
      var srcSet = getResponsiveWorkImageSrcSet(item.image);
      var responsiveAttributes = srcSet
        ? ' srcset="' + srcSet + '" sizes="' + PORTFOLIO_GRID_IMAGE_SIZES + '"'
        : '';
      return '<article class="portfolio-item" data-category="' + item.categoryId + '">' +
        '<img src="' + item.image + '"' + responsiveAttributes + ' alt="' + item.imageAlt + '" width="900" height="600" loading="lazy" decoding="async" />' +
        '<div class="portfolio-overlay"><div class="portfolio-copy"><div>' +
        '<strong>' + item.title + '</strong>' +
        '<span>' + item.category + '</span>' +
        '</div>' +
        '<button class="preview-btn" type="button" data-preview="' + item.id + '" aria-label="Open preview for ' + item.title + '">+</button>' +
        '</div></div>' +
        '</article>';
    })
    .join('');
}
function getCategoryFromUrl() {
  const slug = new URLSearchParams(window.location.search).get('category');
  return getWorkCategory(slug)?.id || WORK_CATEGORIES[0].id;
}

// Track the active subcategory for each category so renderPortfolio can use it
var _activeSubcategories = {};

function setPortfolioFilter(filter, options) {
  if (!options) options = {};
  var updateUrl = options.updateUrl || false;
  var scrollToWork = options.scrollToWork || false;
  var selectedFilter = getWorkCategory(filter) ? filter : WORK_CATEGORIES[0].id;
  var subcategory = _activeSubcategories[selectedFilter] || 'All';

  // Only update vanilla-JS buttons if React hasn't taken over the filter UI
  if (!portfolioFilters || portfolioFilters.dataset.reactFilters !== 'true') {
    portfolioFilters.querySelectorAll('[data-filter]').forEach(function(button) {
      var isActive = button.dataset.filter === selectedFilter;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }

  renderPortfolio(selectedFilter, subcategory);

  // Only dispatch if not coming from the React component (to avoid double-firing)
  if (!portfolioFilters || portfolioFilters.dataset.reactFilters !== 'true') {
    window.dispatchEvent(
      new CustomEvent('portfolio-category-change', {
        detail: { categoryId: selectedFilter }
      })
    );
  }

  if (updateUrl) {
    var url = new URL(window.location.href);
    url.searchParams.set('category', selectedFilter);
    url.hash = 'portfolio';
    window.history.pushState({ portfolioCategory: selectedFilter }, '', url);
  }

  if (scrollToWork) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('portfolio')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  }
}

// Listen for subcategory changes from the React PortfolioFilters component
window.addEventListener('portfolio-subcategory-change', function(event) {
  var detail = event.detail;
  if (!detail) return;
  _activeSubcategories[detail.categoryId] = detail.subcategory || 'All';
  renderPortfolio(detail.categoryId, detail.subcategory || 'All');
});

// Listen for category changes from the React PortfolioFilters component
window.addEventListener('portfolio-category-change', function(event) {
  var detail = event.detail;
  if (!detail) return;
  var categoryId = detail.categoryId;
  var subcategory = _activeSubcategories[categoryId] || 'All';
  renderPortfolio(categoryId, subcategory);
});

portfolioGrid?.addEventListener('click', function(event) {
  var target = event.target;
  if (!(target instanceof Element)) return;
  var resetButton = target.closest('[data-reset-category]');
  if (!resetButton) return;

  var categoryId = resetButton.getAttribute('data-reset-category');
  var categoryButton = Array.from(
    portfolioFilters?.querySelectorAll('[data-category-id]') || []
  ).find(function(button) {
    return button.getAttribute('data-category-id') === categoryId;
  });

  if (categoryButton instanceof HTMLButtonElement) {
    categoryButton.click();
  } else {
    console.error('Unable to reset the portfolio filter for category:', categoryId);
  }
});

function openModal(itemId) {
  const item = portfolioItems.find((entry) => entry.id === Number(itemId));
  if (!item) return;

  modalImage.src = item.image;
  modalImage.alt = `${item.title} project preview`;
  modalCategory.textContent = item.category;
  modalTitle.textContent = item.title;
  modalDescription.textContent = item.description;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
}

const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');
const navLetterSwapItems = siteNav?.querySelectorAll('.nav-link') || [];
const navSwapFrames = new WeakMap();
const navSwapCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

navLetterSwapItems.forEach((item) => {
  const label = item.textContent.trim();
  item.setAttribute('aria-label', label);
  item.classList.add('letter-swap');
  item.replaceChildren(
    ...Array.from(label, (character) => {
      const letter = document.createElement('span');
      letter.className = 'letter-swap-character';
      letter.setAttribute('aria-hidden', 'true');
      letter.textContent = character;
      return letter;
    })
  );

  const animateLetters = () => {
    const previousFrame = navSwapFrames.get(item);
    if (previousFrame) cancelAnimationFrame(previousFrame);

    const letters = [...item.querySelectorAll('.letter-swap-character')];
    const startTime = performance.now();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stagger = 12;
    const swapDuration = reducedMotion ? 180 : 240;
    const tickDuration = reducedMotion ? 70 : 40;
    let frame;

    const updateLetters = (now) => {
      let hasPendingLetters = false;

      letters.forEach((letter, index) => {
        const character = label[index];
        if (/\s/.test(character)) return;

        const elapsed = now - startTime - index * stagger;
        if (elapsed < 0) {
          hasPendingLetters = true;
          return;
        }

        if (elapsed >= swapDuration) {
          letter.textContent = character;
          return;
        }

        hasPendingLetters = true;
        const tick = Math.floor(elapsed / tickDuration);
        if (letter.dataset.tick !== String(tick)) {
          const originalIsUppercase = character === character.toUpperCase();
          const glyph = navSwapCharacters[Math.floor(Math.random() * navSwapCharacters.length)];
          letter.textContent = originalIsUppercase ? glyph.toUpperCase() : glyph.toLowerCase();
          letter.dataset.tick = String(tick);
        }
      });

      if (hasPendingLetters) {
        frame = requestAnimationFrame(updateLetters);
        navSwapFrames.set(item, frame);
      } else {
        navSwapFrames.delete(item);
      }
    };

    frame = requestAnimationFrame(updateLetters);
    navSwapFrames.set(item, frame);
  };

  const startLetterSwap = () => {
    item.classList.add('is-interacting');
    animateLetters();
  };
  const stopLetterSwap = () => item.classList.remove('is-interacting');

  item.addEventListener('pointerenter', startLetterSwap);
  item.addEventListener('pointerleave', stopLetterSwap);
  item.addEventListener('focus', startLetterSwap);
  item.addEventListener('blur', stopLetterSwap);
});

function toggleNav(forceOpen) {
  const isOpen = typeof forceOpen === 'boolean' ? forceOpen : !siteNav.classList.contains('is-open');
  siteNav.classList.toggle('is-open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
}

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => toggleNav());

  siteNav.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a[href^="#"]')) {
      toggleNav(false);
      if (event.detail === 0) navToggle.focus();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && siteNav.classList.contains('is-open')) {
      toggleNav(false);
      navToggle.focus();
    }
  });

  siteNav.querySelector('.btn-small')?.addEventListener('click', () => toggleNav(false));
}

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

const serviceCards = document.querySelectorAll('[data-service-card]');
serviceCards.forEach((card) => {
  const button = card.querySelector('.service-toggle');
  const panel = card.querySelector('.service-panel');

  button?.addEventListener('click', () => {
    const isOpen = card.classList.contains('is-open');

    card.classList.toggle('is-open', !isOpen);
    button.setAttribute('aria-expanded', String(!isOpen));

    if (!isOpen) {
      panel.style.maxHeight = `${panel.scrollHeight}px`;
    } else {
      panel.style.maxHeight = '0px';
    }
  });
});

const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach((item) => {
  const button = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');

  button?.addEventListener('click', () => {
    const isOpen = item.classList.contains('active');

    faqItems.forEach((faq) => {
      faq.classList.remove('active');
      const faqButton = faq.querySelector('.faq-question');
      const faqAnswer = faq.querySelector('.faq-answer');
      faqButton?.setAttribute('aria-expanded', 'false');
      if (faqAnswer) faqAnswer.style.maxHeight = '0px';
    });

    if (!isOpen) {
      item.classList.add('active');
      button.setAttribute('aria-expanded', 'true');
      if (answer) answer.style.maxHeight = `${answer.scrollHeight}px`;
    }
  });
});

setTimeout(() => {
  const firstFaq = document.querySelector('.faq-item.active .faq-answer');
  if (firstFaq) firstFaq.style.maxHeight = `${firstFaq.scrollHeight}px`;
}, 0);

const navLinks = document.querySelectorAll('.nav-link');
const sections = [...document.querySelectorAll('main section[id]')];

function updateActiveNavigation() {
  const headerHeight =
    document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
  const scrollPosition = window.scrollY + Math.max(180, headerHeight + 160);
  let activeId = sections[0]?.id || 'home';

  sections.forEach((section) => {
    if (scrollPosition >= section.offsetTop) {
      activeId = section.id;
    }
  });

  navLinks.forEach((link) => {
    const shouldBeActive = link.getAttribute('href') === `#${activeId}`;
    link.classList.toggle('active', shouldBeActive);
  });
}

window.addEventListener('scroll', updateActiveNavigation);
updateActiveNavigation();

createPortfolioFilters();
portfolioFilters.addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  setPortfolioFilter(button.dataset.filter, { updateUrl: true });
});

setPortfolioFilter(getCategoryFromUrl());

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-work-category-link]');
  if (
    !link ||
    link.target === '_blank' ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  const categoryId = link.dataset.category;
  if (!getWorkCategory(categoryId)) return;

  event.preventDefault();
  setPortfolioFilter(categoryId, { updateUrl: true, scrollToWork: true });
});

window.addEventListener('popstate', () => {
  setPortfolioFilter(getCategoryFromUrl());
});

portfolioGrid.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-preview]');
  if (!trigger) return;
  openModal(trigger.dataset.preview);
});

modal.addEventListener('click', (event) => {
  const closeTrigger = event.target.closest('[data-close-modal]');
  if (closeTrigger || event.target === modal) {
    closeModal();
  }
});

document.querySelector('.modal-close')?.addEventListener('click', closeModal);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal.classList.contains('is-open')) {
    closeModal();
  }
});

const statusMessage = () => document.getElementById('form-status');

function setFormStatus(message, type) {
  const target = statusMessage();
  if (!target) return;
  target.textContent = message;
  target.classList.remove('success', 'error');
  if (type) target.classList.add(type);
}

document.addEventListener('submit', (event) => {
  if (event.target?.id !== 'quote-form') return;
  event.preventDefault();

  const fullName = document.getElementById('fullName')?.value.trim() || '';
  const email = document.getElementById('email')?.value.trim() || '';
  const phone = document.getElementById('phone')?.value.trim() || '';
  const messageValue = document.getElementById('message')?.value.trim() || '';
  const service = document.getElementById('service')?.value || '';
  const contactMethod = document.getElementById('contactMethod')?.value || 'email';

  if (!fullName) {
    setFormStatus('Please enter your full name before submitting the inquiry.', 'error');
    return;
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    setFormStatus('Please enter a valid email address so we can respond to your inquiry.', 'error');
    return;
  }

  if (!messageValue) {
    setFormStatus('Please include a short project message so we understand your needs.', 'error');
    return;
  }

  const serviceText = service ? `Service: ${service}\n` : '';
  const budget = document.getElementById('budget')?.value.trim() || 'Not specified';
  const phoneText = phone ? `Phone: ${phone}\n` : 'Phone: Not provided\n';
  const inquiryBody = [
    `Name: ${fullName}`,
    `Email: ${email}`,
    phoneText,
    serviceText,
    `Budget: ${budget}`,
    '',
    'Project details:',
    messageValue
  ].join('\n');

  const subject = encodeURIComponent(`SeaTechMedia inquiry from ${fullName}`);
  const sanitizedBody = encodeURIComponent(inquiryBody);

  if (contactMethod === 'whatsapp') {
    const whatsappNumber = siteConfig.whatsappNumber.replace(/\D/g, '');
    const whatsappMessage = encodeURIComponent(`Hello SeaTechMedia, I'm ${fullName}.\n\n${inquiryBody}`);
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
    setFormStatus('Opening WhatsApp with your inquiry details so you can send it directly.', 'success');
    window.open(whatsappLink, '_blank', 'noopener');
    return;
  }

  const submitButton = event.target.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  setFormStatus('Sending your inquiry...', null);

  fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, phone, service, budget, message: messageValue })
  })
    .then(async (response) => {
      if (!response.ok) throw new Error('Request failed');
      const result = await response.json();
      if (result?.ok !== true) throw new Error('Acceptance not confirmed');
      event.target.reset();
      setFormStatus('Thanks! Your inquiry was sent. We will reply within one business day.', 'success');
    })
    .catch(() => {
      setFormStatus('We could not confirm your inquiry was sent. Please try again or ', 'error');
      const target = statusMessage();
      if (target) {
        const link = document.createElement('a');
        link.href = `mailto:${siteConfig.email}?subject=${subject}&body=${sanitizedBody}`;
        link.textContent = 'send it using your email app';
        target.append(link, '.');
      }
    })
    .finally(() => {
      if (submitButton) submitButton.disabled = false;
    });
});

const yearTarget = document.getElementById('year');
if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

window.addEventListener('scroll', () => {
  if (window.scrollY > 420) {
    backToTopButton.classList.add('visible');
  } else {
    backToTopButton.classList.remove('visible');
  }
});

backToTopButton?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
