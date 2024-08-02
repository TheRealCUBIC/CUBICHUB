const swiper = new Swiper('.slider-wrapper', {
  loop: false,
  spaceBetween: -5,

  // Pagination bullets
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },


  // Responsive breakpoints
  breakpoints: {
    0: {
      slidesPerView: 1
    },
    768: {
      slidesPerView: 2
    },
    1024: {
      slidesPerView: 3
    },
    1280: {
      slidesPerView: 4
    }
  }
});