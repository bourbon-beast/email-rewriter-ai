document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const originalEmailTextarea = document.getElementById('original-email');
    const rewrittenEmailTextarea = document.getElementById('rewritten-email');
    const rewriteBtn = document.getElementById('rewrite-btn');
    const copyBtn = document.getElementById('copy-btn');
    const toneButtons = document.querySelectorAll('.tone-btn');
    const resultContainer = document.querySelector('.result-container');
    
    // Current selected tone
    let selectedTone = 'professional';
    
    // Add event listeners to tone buttons
    toneButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            toneButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update selected tone
            selectedTone = this.getAttribute('data-tone');
        });
    });
    
    // Add event listener to rewrite button
    rewriteBtn.addEventListener('click', function() {
        const originalEmail = originalEmailTextarea.value.trim();
        
        // Validate input
        if (originalEmail === '') {
            alert('Please enter an email to rewrite.');
            return;
        }
        
        // Show loading state
        rewriteBtn.textContent = 'Rewriting...';
        rewriteBtn.disabled = true;
        
        // Make API request to rewrite email
        fetch('/rewrite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: originalEmail,
                tone: selectedTone
            })
        })
        .then(response => response.json())
        .then(data => {
            // Display rewritten email
            rewrittenEmailTextarea.value = data.rewritten;
            
            // Show result container
            resultContainer.classList.remove('hidden');
            
            // Reset button state
            rewriteBtn.textContent = 'Rewrite Email';
            rewriteBtn.disabled = false;
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while rewriting the email. Please try again.');
            
            // Reset button state
            rewriteBtn.textContent = 'Rewrite Email';
            rewriteBtn.disabled = false;
        });
    });
    
    // Add event listener to copy button
    copyBtn.addEventListener('click', function() {
        // Select and copy text
        rewrittenEmailTextarea.select();
        document.execCommand('copy');
        
        // Show feedback
        const originalText = this.textContent;
        this.textContent = 'Copied!';
        
        // Reset button text after 2 seconds
        setTimeout(() => {
            this.textContent = originalText;
        }, 2000);
    });
});
