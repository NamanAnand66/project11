class AIStudio {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadSavedImages();
        this.setupSpeechRecognition();
    }

    initializeElements() {
        // selecting all the elements by id that helps in generating an image
        this.promptInput = document.getElementById('promptInput');
        this.micButton = document.getElementById('micButton');
        this.generateButton = document.getElementById('generateButton');
        this.imageGrid = document.getElementById('imageGrid');
        this.savedImagesGrid = document.getElementById('savedImagesGrid');
        this.speechStatus = document.getElementById('speechStatus');
    }

    setupEventListeners() {
        // these are the event listeners for prompt section , mic and generate button
        this.micButton.addEventListener('click', () => this.toggleSpeechRecognition());
        this.generateButton.addEventListener('click', () => this.generateImage());
        this.promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.generateImage();
        });
    }
 // this section is for speech recognition web api
    setupSpeechRecognition() {
        // conditional statement to check browser compatible or not
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();

            // configuring the recognition
            this.recognition.continuous = false;  // this stops continous recognition
            this.recognition.interimResults = false;  // processes only final result

            // once recognised , after that it will extract the text
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.promptInput.value = transcript;
                this.speechStatus.classList.add('hidden');
            };

            // to handle error in voice recognition
            this.recognition.onerror = () => {
                this.speechStatus.classList.add('hidden');
                alert('Speech recognition error occurred.');
            };

            // when speech recognition stops
            this.recognition.onend = () => {
                this.speechStatus.classList.add('hidden');
                this.micButton.classList.remove('bg-red-600');
                this.micButton.classList.add('bg-purple-600');
            };
        }
    }

    toggleSpeechRecognition() {
        if (!this.recognition) {
            alert('Speech recognition is not supported in your browser.');
            return;
        }

        if (this.micButton.classList.contains('bg-purple-600')) {
            this.recognition.start();
            this.speechStatus.classList.remove('hidden');
            this.micButton.classList.remove('bg-purple-600');
            this.micButton.classList.add('bg-red-600');
        } else {
            this.recognition.stop();
            this.speechStatus.classList.add('hidden');
            this.micButton.classList.remove('bg-red-600');
            this.micButton.classList.add('bg-purple-600');
        }
    }
 // an async function that is called when the recognition has finished
    async generateImage() {
        const prompt = this.promptInput.value.trim();
        if (!prompt) {
            alert('Please enter a prompt');
            return;
        }

        const loadingCard = this.createLoadingCard();
        this.imageGrid.insertBefore(loadingCard, this.imageGrid.firstChild);
   // creating a new image using try and fetch to generate image from api
        try {
            const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sk-Z6mdiFVRjjpVggjIZLmOM5QfdXGlIcoytkmryEHIhZrCFYSH', // this is the api key
                },
                body: JSON.stringify({
                    text_prompts: [{ text: prompt }],
                    cfg_scale: 7,
                    height: 1024,
                    width: 1024,
                    steps: 30,
                    samples: 1,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate image');
            }

            const data = await response.json();
            const imageUrl = `data:image/png;base64,${data.artifacts[0].base64}`;

            loadingCard.remove();
            const imageCard = this.createImageCard(imageUrl, prompt);
            this.imageGrid.insertBefore(imageCard, this.imageGrid.firstChild);
        } catch (error) {
            console.error('Error generating image:', error);
            loadingCard.remove();
            alert('Failed to generate image. Please try again.');
        }
    }

    createLoadingCard() {
        const card = document.createElement('div');
        card.className = 'image-card loading aspect-square';
        return card;
    }

    createImageCard(imageUrl, prompt) {
        const card = document.createElement('div');
        card.className = 'image-card animate-slide-up';

        card.innerHTML = `
            <img src="${imageUrl}" alt="${prompt}" loading="load">
            <div class="overlay">
                <p class="text-sm text-white">${prompt}</p>
                <button class="save-button mt-2 feature-button purple-glow">
                    Save
                </button>
            </div>
        `;
     // this event listener will be fired when the save button is clicked
        card.querySelector('.save-button').addEventListener('click', () => {
            this.saveImage(imageUrl, prompt);
        });

        return card;
    }
// this is the saved image section that uses the local storage api
    saveImage(imageUrl, prompt) {
        const savedImages = this.getSavedImages();
        savedImages.push({ url: imageUrl, prompt });
        localStorage.setItem('savedImages', JSON.stringify(savedImages));
        this.displaySavedImages();
    }

    getSavedImages() {
        const saved = localStorage.getItem('savedImages');
        return saved ? JSON.parse(saved) : [];
    }

    loadSavedImages() {
        this.displaySavedImages();
    }

    displaySavedImages() {
        const savedImages = this.getSavedImages();
        this.savedImagesGrid.innerHTML = '';

        savedImages.forEach(({ url, prompt }) => {
            const card = document.createElement('div');
            card.className = 'image-card animate-fade-in';

            card.innerHTML = `
                <img src="${url}" alt="${prompt}" loading="lazy">
                <div class="overlay">
                    <p class="text-sm text-white">${prompt}</p>
                    <button class="delete-button mt-2 feature-button purple-glow">
                        Delete
                    </button>
                </div>
            `;
          // handling the request to delete the saved image
            card.querySelector('.delete-button').addEventListener('click', () => {
                const updatedImages = savedImages.filter(img => img.url !== url);
                localStorage.setItem('savedImages', JSON.stringify(updatedImages));
                this.displaySavedImages();
            });

            this.savedImagesGrid.appendChild(card);
        });
    }
}

// calling
new AIStudio();
