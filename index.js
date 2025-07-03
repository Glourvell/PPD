const track = document.querySelector('.carousel-track');
    const slides = document.querySelectorAll('.carousel img');
    let currentIndex = 0;

    function moveToNextSlide() {
      currentIndex = (currentIndex + 1) % slides.length;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    setInterval(moveToNextSlide, 3000); // Change image every 3 seconds