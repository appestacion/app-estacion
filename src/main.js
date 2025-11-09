import Tesseract from 'tesseract.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// --- PEGA AQUÍ TUS LLAVES DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "app-estacion-db.firebaseapp.com",
  projectId: "app-estacion-db",
  storageBucket: "app-estacion-db.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {

  // --- Referencias a los elementos de la página ---
  const cameraButton = document.getElementById('camera-button');
  const galleryButton = document.getElementById('gallery-button');
  const resultContainer = document.getElementById('result-container');
  const ticketImage = document.getElementById('ticket-image');
  const extractedTextSpan = document.getElementById('extracted-text');
  
  const dateSpan = document.getElementById('date');
  const timeSpan = document.getElementById('time');
  const amountSpan = document.getElementById('amount');
  const litersSpan = document.getElementById('liters');
  const pointOfSaleSpan = document.getElementById('point-of-sale');
  const saveButton = document.getElementById('save-button');

  // --- Lógica para el botón de instalación de la PWA ---
  let deferredPrompt;
  const installButton = document.getElementById('install-button');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.style.display = 'block';
  });

  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    installButton.style.display = 'none';
  });

  // --- Función para procesar la imagen (común para cámara y galería) ---
  const processImageFile = async (file) => {
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    ticketImage.src = imageUrl;
    resultContainer.style.display = 'block';

    extractedTextSpan.textContent = 'Leyendo el texto de la foto... por favor, espera.';
    
    dateSpan.textContent = 'No encontrado'; timeSpan.textContent = 'No encontrado';
    amountSpan.textContent = 'No encontrado'; litersSpan.textContent = 'No encontrado';
    pointOfSaleSpan.textContent = 'No encontrado'; saveButton.style.display = 'none';

    const result = await Tesseract.recognize(ticketImage, 'spa', { logger: m => console.log(m) });
    const text = result.data.text;
    extractedTextSpan.textContent = text;

    // (El resto de la lógica de búsqueda es la misma que antes)
    if (document.getElementById('search-pos').checked) { /* ... */ }
    if (document.getElementById('search-date').checked) { /* ... */ }
    if (document.getElementById('search-time').checked) { /* ... */ }
    if (document.getElementById('search-amount').checked) { /* ... */ }
    if (document.getElementById('search-liters').checked) { /* ... */ }
    
    saveButton.style.display = 'block';
  };

  // --- Lógica para el botón de CÁMARA ---
  cameraButton.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Fuerza la cámara
    input.addEventListener('change', (event) => processImageFile(event.target.files[0]));
    input.click();
  });

  // --- Lógica para el botón de GALERÍA ---
  galleryButton.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // No ponemos 'capture', por lo que el navegador elegirá la galería
    input.addEventListener('change', (event) => processImageFile(event.target.files[0]));
    input.click();
  });

  // --- Lógica del Botón de Guardar ---
  saveButton.addEventListener('click', async () => {
    saveButton.disabled = true; saveButton.textContent = 'Guardando...';
    const ticketData = {
      pointOfSale: pointOfSaleSpan.textContent, date: dateSpan.textContent, time: timeSpan.textContent,
      liters: litersSpan.textContent, amount: amountSpan.textContent, fullText: extractedTextSpan.textContent,
      timestamp: new Date()
    };
    try {
      const docRef = await addDoc(collection(db, "tickets"), ticketData);
      alert('¡Ticket guardado en la nube con éxito!');
      resultContainer.style.display = 'none'; saveButton.style.display = 'none';
    } catch (e) {
      alert('Hubo un error al guardar.');
    } finally {
      saveButton.disabled = false; saveButton.textContent = 'Guardar en la Nube';
    }
  });

});