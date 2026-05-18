const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
const mobileNavOverlay = document.getElementById('mobileNavOverlay');

function toggleMobileNav() {
  mobileNav.classList.toggle('active');
  mobileNavOverlay.classList.toggle('active');
  // 重点：删掉 document.body.style.overflow 这一行，不再锁滚动、不挤压布局
}

if (hamburger && mobileNavOverlay) {
  hamburger.addEventListener('click', toggleMobileNav);
  mobileNavOverlay.addEventListener('click', toggleMobileNav);
}