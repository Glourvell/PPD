// Function to enlarge image in modal
function enlargeImage(imgElement) {
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modalImage');
    
    // Set the source of the modal image to the clicked image source
    modalImage.src = imgElement.src;
    
    // Display the modal
    modal.style.display = 'flex';
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}
