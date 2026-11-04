// Topbar solid state
const topbar = document.querySelector('.topbar');
const onScroll = () => { topbar.classList.toggle('solid', window.scrollY > 60); };
window.addEventListener('scroll', onScroll); onScroll();

// Full nav toggle
const menuBtn = document.querySelector('.menu-btn');
const fullnav = document.querySelector('.fullnav');
menuBtn.addEventListener('click', () => {
  const open = fullnav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});
fullnav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => fullnav.classList.remove('open')));

// Reel arrows (only on pages that have a reel carousel)
const reel = document.querySelector('.reel');
if (reel) {
  const reelPrev = document.querySelector('.reel-prev');
  const reelNext = document.querySelector('.reel-next');
  if (reelPrev) reelPrev.addEventListener('click', () => reel.scrollBy({left: -360, behavior:'smooth'}));
  if (reelNext) reelNext.addEventListener('click', () => reel.scrollBy({left: 360, behavior:'smooth'}));
}

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); } });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));
} else { revealEls.forEach(el => el.classList.add('in')); }

// Suite details modal
const suiteModalOverlay = document.getElementById('suite-modal-overlay');
const suiteModalImg = document.getElementById('suite-modal-img');
const suiteModalAmenity = document.getElementById('suite-modal-amenity');
const suiteModalName = document.getElementById('suite-modal-name');
const suiteModalSlogan = document.getElementById('suite-modal-slogan');
const suiteModalDesc = document.getElementById('suite-modal-desc');
const suiteModalBook = document.getElementById('suite-modal-book');

document.querySelectorAll('.btn-details').forEach(btn => {
  btn.addEventListener('click', () => {
    const tile = btn.closest('.suite-tile');
    suiteModalImg.src = tile.dataset.img;
    suiteModalImg.alt = 'Suíte ' + tile.dataset.name;
    suiteModalAmenity.textContent = tile.dataset.amenity;
    suiteModalName.textContent = tile.dataset.name;
    suiteModalSlogan.textContent = tile.dataset.slogan;
    suiteModalDesc.textContent = tile.dataset.desc;
    suiteModalBook.href = 'https://api.whatsapp.com/send?phone=5514991797722&text=' + encodeURIComponent('Olá! Gostaria de reservar a Suíte ' + tile.dataset.name + '.');
    suiteModalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

function closeSuiteModal() {
  suiteModalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}
document.querySelector('.suite-modal-close').addEventListener('click', closeSuiteModal);
suiteModalOverlay.addEventListener('click', (e) => { if (e.target === suiteModalOverlay) closeSuiteModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSuiteModal(); });

// Gallery carousel
const galleryCarousel = document.getElementById('gallery-carousel');
const carouselImg = document.getElementById('carousel-img');
const carouselCounter = document.getElementById('carousel-counter');
let carouselItems = [];
let carouselIndex = 0;

function openCarousel(items, startIndex) {
  carouselItems = items;
  carouselIndex = startIndex;
  updateCarousel();
  galleryCarousel.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function updateCarousel() {
  const item = carouselItems[carouselIndex];
  carouselImg.src = item.src;
  carouselImg.alt = item.alt;
  carouselCounter.textContent = (carouselIndex + 1) + ' / ' + carouselItems.length;
}
function closeCarousel() {
  galleryCarousel.classList.remove('open');
  document.body.style.overflow = '';
}
function carouselNext() { carouselIndex = (carouselIndex + 1) % carouselItems.length; updateCarousel(); }
function carouselPrev() { carouselIndex = (carouselIndex - 1 + carouselItems.length) % carouselItems.length; updateCarousel(); }

document.querySelectorAll('.exp-gallery').forEach(gallery => {
  const links = Array.from(gallery.querySelectorAll('a'));
  const items = links.map(a => ({ src: a.getAttribute('href'), alt: a.querySelector('img').alt }));
  links.forEach((a, i) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      openCarousel(items, i);
    });
  });
});

document.getElementById('carousel-close').addEventListener('click', closeCarousel);
document.getElementById('carousel-next').addEventListener('click', carouselNext);
document.getElementById('carousel-prev').addEventListener('click', carouselPrev);
galleryCarousel.addEventListener('click', (e) => { if (e.target === galleryCarousel) closeCarousel(); });
document.addEventListener('keydown', (e) => {
  if (!galleryCarousel.classList.contains('open')) return;
  if (e.key === 'Escape') closeCarousel();
  if (e.key === 'ArrowRight') carouselNext();
  if (e.key === 'ArrowLeft') carouselPrev();
});
